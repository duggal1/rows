"use client"

import { use, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import JSZip from "jszip"
import { buildTree, type FileTreeNode, type WorkspaceData } from "@/components/workspace/types"
import { TIMING, extractDomain, loadWorkspace, saveWorkspace } from "./utils"
import { processUrl } from "./processing"

export function useWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const url = searchParams.get("url")

  const [step, setStep] = useState(0)
  const [data, setData] = useState<WorkspaceData | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileTreeNode | null>(null)
  const [tab, setTab] = useState<"code" | "preview">("code")
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [inputValue, setInputValue] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const hasPendingUrl = !!(url && !data)
  const isProcessing = hasPendingUrl || data?.status === "pending" || data?.status === "processing"
  const isDone = data?.status === "done"

  useEffect(() => {
    const existing = loadWorkspace(id)
    if (existing) {
      setData(existing)
      if (existing.status === "done") setStep(TIMING.totalSteps)
      return
    }
    if (!url) { router.push("/"); return }
    processUrl(id, url, { onUpdate: setData, onStep: setStep, onError: console.error })
  }, [id, url, router])

  useEffect(() => {
    if (!isProcessing || isDone) return
    const timer = setInterval(() => {
      setStep((s) => (s >= TIMING.totalSteps - 1 ? (clearInterval(timer), s) : s + 1))
    }, TIMING.stepInterval)
    return () => clearInterval(timer)
  }, [isProcessing, isDone])

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
    setSelectedFile, setTab, setPreviewMode, setInputValue,
    handleCopy, handleDownload, downloadZip,
  }
}
