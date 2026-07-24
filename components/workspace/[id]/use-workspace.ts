"use client"

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import JSZip from "jszip"
import { buildTree, type FileTreeNode, type WorkspaceData, type GeneratedFile } from "@/components/workspace/types"
import { TIMING, extractDomain } from "./utils"
import type { AttachedFile } from "@/hooks/use-file-upload"
import { processUrl, regenerateFromWorkspace } from "./processing"
import { isSandboxRunning } from "@/server/actions/sandbox"
import { getWorkspace } from "@/server/actions/workspace"

export function useWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const url = searchParams.get("url")
  const prompt = searchParams.get("prompt")

  const [step, setStep] = useState(0)
  const [data, setData] = useState<WorkspaceData | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileTreeNode | null>(null)
  const [tab, setTab] = useState<"code" | "preview">("code")
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [inputValue, setInputValue] = useState("")
  const [previewHtml, setPreviewHtml] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const startedRef = useRef(false)

  const hasPendingUrl = !!(url && !data)
  const isProcessing = hasPendingUrl || data?.status === "pending" || data?.status === "processing"
  const isDone = data?.status === "done"

  useEffect(() => {
    if (startedRef.current) return
    async function load() {
      let existingPrompt = prompt
      let existingUrl = url

      try {
        const existing = await getWorkspace(id)
        if (existing) {
          const w: WorkspaceData = {
            url: existing.url,
            title: existing.title || "",
            html: existing.html || "",
            css: existing.css || "",
            designHtml: existing.designHtml || "",
            files: (existing.files as GeneratedFile[]) || [],
            status: existing.status as WorkspaceData["status"],
            createdAt: existing.createdAt ? existing.createdAt.getTime() : Date.now(),
            prompt: existing.prompt || "",
            summary: existing.summary || undefined,
            previewUrl: existing.previewUrl || undefined,
            sandboxId: existing.sandboxId || undefined,
            error: existing.error || undefined,
          }
          existingPrompt = existing.prompt || prompt
          existingUrl = existing.url || url

          if (w.status === "done") {
            setData(w)
            setPreviewHtml(w.html || "")
            setStep(TIMING.totalSteps)
            if (w.sandboxId) {
              isSandboxRunning(w.sandboxId).then((alive) => {
                if (!alive) setData((prev) => prev ? { ...prev, previewUrl: undefined, sandboxId: undefined } : prev)
              })
            }
            return
          }
          if (w.status === "error") {
            setData(w)
            setPreviewHtml(w.html || "")
            return
          }
        }
      } catch {
        // not found or not authorized — fall through to process
      }

      const targetUrl = existingUrl || url
      if (!targetUrl) { router.push("/"); return }

      const attachedFiles: { name: string; content: string }[] = []
      try {
        const raw = sessionStorage.getItem(`workspace-files-${id}`)
        if (raw) {
          const parsed = JSON.parse(raw) as AttachedFile[]
          attachedFiles.push(...parsed.map((f) => ({ name: f.name, content: f.content })))
          sessionStorage.removeItem(`workspace-files-${id}`)
        }
      } catch { /* ignore */ }

      startedRef.current = true
      processUrl(id, targetUrl, existingPrompt ?? undefined, attachedFiles.length > 0 ? attachedFiles : undefined, {
        onUpdate: setData,
        onStep: setStep,
        onError: console.error,
      
      })
    }

    load()
  }, [id, url, router])

  useEffect(() => {
    if (!isProcessing || isDone) return
    const timer = setInterval(() => {
      setStep((s) => (s >= TIMING.totalSteps - 1 ? (clearInterval(timer), s) : s + 1))
    }, TIMING.stepInterval)
    return () => clearInterval(timer)
  }, [isProcessing, isDone])

  useEffect(() => {
    if (isDone) setTab("preview")
  }, [isDone, setTab])

  const domain = data ? extractDomain(data.url) : ""
  const folderName = domain ? `${domain}-nextjs-landing` : "project"

  const treeNodes = useMemo(() => (data?.files ? buildTree(data.files) : []), [data?.files])
  const selectedContent = useMemo(() => {
    if (!selectedFile || selectedFile.type === "folder") return null
    return selectedFile.content ?? null
  }, [selectedFile])

  const fileName = selectedFile?.name ?? ""

  const handleCopy = useCallback(() => {
    if (!selectedContent) return
    navigator.clipboard?.writeText(selectedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }, [selectedContent])

  const handleDownload = useCallback(() => {
    if (!selectedContent || !selectedFile) return
    const blob = new Blob([selectedContent], { type: "text/plain" })
    const oc = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = oc; a.download = selectedFile.name; a.click()
    URL.revokeObjectURL(oc)
  }, [selectedContent, selectedFile])

  const handleRegenerate = useCallback(
    async (promptText: string, attachedFiles: AttachedFile[], _model: string) => {
      if (!data?.designHtml) return
      const prevSandboxId = data.sandboxId
      setData((prev) => prev ? { ...prev, status: "processing", files: [], previewUrl: undefined, sandboxId: undefined, error: undefined } : prev)
      try {
        const result = await regenerateFromWorkspace(
          id,
          data.designHtml,
          data.css,
          promptText,
          attachedFiles.map((f) => ({ name: f.name, content: f.content })),
          data.url,
          prevSandboxId,
        )
        setData((prev) => prev ? {
          ...prev,
          files: result.files,
          summary: result.summary,
          previewUrl: result.previewUrl,
          sandboxId: result.sandboxId,
          status: "done",
        } : prev)
        setStep(TIMING.totalSteps)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Regeneration failed"
        setData((prev) => prev ? { ...prev, status: "error", error: msg } : prev)
      }
    },
    [id, data],
  )

  const downloadZip = useCallback(async () => {
    if (!data?.files.length) return
    setIsDownloading(true)
    try {
      const zip = new JSZip()
      for (const file of data.files) zip.file(file.path, file.content)
      const blob = await zip.generateAsync({ type: "blob" })
      const oc = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = oc; a.download = `${folderName}.zip`; a.click()
      URL.revokeObjectURL(oc)
    } finally { setIsDownloading(false) }
  }, [data?.files, folderName])

  return {
    id, router, step, data, selectedFile, tab, previewMode, inputValue,
    isDownloading, copied, hasPendingUrl, isProcessing, isDone,
    domain, folderName, treeNodes, selectedContent, fileName,
    url, prompt, summary: data?.summary, previewHtml,
    setSelectedFile, setTab, setPreviewMode, setInputValue,
    handleCopy, handleDownload, downloadZip, handleRegenerate,
  }
}
