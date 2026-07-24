"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Globe02Icon,
  PlusSignIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons"
import { Menu, MenuTrigger, MenuPopup, MenuRadioGroup, MenuRadioItem } from "@/components/ui/menu"
import { Spinner } from "@/components/ui/loading-state/spinner"
import { useFileUpload, type AttachedFile } from "@/hooks/use-file-upload"
import { z } from "zod"

const analyzeSchema = z.object({
  url: z.string().min(1, "URL is required"),
  intent: z.string().min(1, "Intent is required"),
  model: z.string().min(1),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    content: z.string(),
  })),
})

const MODELS = [
  {
    id: "gemini-3.6-flash",
    label: "Gemini 3.6 Flash",
    comingSoon: false,
    icon: <Image src="/gemini-color.svg" alt="" width={50} height={50} className="size-4 shrink-0" />,
  },
  {
    id: "claude-opus-4.8",
    label: "Opus 4.8",
    comingSoon: true,
    icon: <Image src="/claude-color.svg" alt="" width={50} height={50} className="size-4 shrink-0" />,
  },
  {
    id: "fable-5",
    label: "Fable 5",
    comingSoon: true,
    icon: <Image src="/claude-color.svg" alt="" width={50} height={50} className="size-4 shrink-0" />,
  },
] as const

type ModelId = (typeof MODELS)[number]["id"]

export interface AnalyzeSubmitPayload {
  url: string
  intent: string
  model: string
  attachments: AttachedFile[]
}

interface AnalyzeFormProps {
  onSubmit: (payload: AnalyzeSubmitPayload) => void
  isPending: boolean
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`).hostname
  } catch {
    return null
  }
}

function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

export function AnalyzeForm({ onSubmit, isPending }: AnalyzeFormProps) {
  const [urlValue, setUrlValue] = useState("")
  const [intentValue, setIntentValue] = useState("")
  const [confirmedUrl, setConfirmedUrl] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelId>("gemini-3.6-flash")
  const [isDark, setIsDark] = useState(false)
  const { files, openFilePicker, removeFile } = useFileUpload()

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])
  const urlInputRef = useRef<HTMLInputElement>(null)
  const intentRef = useRef<HTMLTextAreaElement>(null)
  const [error, setError] = useState<string | null>(null)

  const domain = useMemo(() => extractDomain(urlValue), [urlValue])
  const confirmedDomain = useMemo(() => confirmedUrl ? extractDomain(confirmedUrl) : null, [confirmedUrl])

  const stage = confirmedUrl ? "intent" : "url"

  const autoResize = useCallback(() => {
    const ta = intentRef.current
    if (ta) {
      ta.style.height = "auto"
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px"
    }
  }, [])

  useEffect(() => {
    autoResize()
  }, [intentValue, autoResize])

  useEffect(() => {
    if (stage === "intent") intentRef.current?.focus()
  }, [stage])

  function normalizeUrl(raw: string): string | null {
    const trimmed = raw.trim()
    if (!trimmed) return null
    const withScheme = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    try {
      const url = new URL(withScheme)
      if (!url.hostname.includes(".")) return null
      return withScheme
    } catch {
      return null
    }
  }

  function confirmUrl() {
    const normalized = normalizeUrl(urlValue)
    if (!normalized) {
      setError("Enter a valid URL — e.g. stripe.com")
      urlInputRef.current?.focus()
      return
    }
    setError(null)
    setConfirmedUrl(normalized)
  }

  function resetUrl() {
    setConfirmedUrl(null)
    setUrlValue("")
    setIntentValue("")
    setTimeout(() => urlInputRef.current?.focus(), 0)
  }

  function handleUrlKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      confirmUrl()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleSubmit() {
    if (!confirmedUrl || isPending) return

    const result = analyzeSchema.safeParse({
      url: confirmedUrl,
      intent: intentValue.trim(),
      model: selectedModel,
      attachments: files,
    })

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid input")
      return
    }

    onSubmit(result.data)
  }

  const selected = MODELS.find((m) => m.id === selectedModel)!

  return (
    <>
    <div className="rounded-xl border border-zinc-100/90 bg-zinc-50/80 px-1 py-1 dark:border-zinc-800/50 dark:bg-zinc-900/80">
        {files.length > 0 && (
         <div className="flex flex-wrap gap-2  px-4 pt-2 pb-1 ">
            {files.map((f) => (
               <div
               key={f.id}
               className="flex items-center gap-1.5 rounded-lg bg-zinc-100/95 pl-2.5 pr-1.5 py-1.5 text-[13px] text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300" 
               >
                <svg viewBox="0 0 16 16" fill="none" width="13" height="13" className="shrink-0 text-orange-600">
                  <path d="M3 2H10L13 5V13C13 13.5523 12.5523 50 12 50H3C2.44772 50 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2Z" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M10 2V5H13" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                <span className="max-w-35 truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="ml-0.5 flex size-4 cursor-pointer items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                >
                  <svg viewBox="0 0 16 16" fill="none" width="10" height="10">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {stage === "url" ? (
          <div className="flex items-center gap-3 px-5 py-2.5 min-h-12">
            <button
              type="button"
              onClick={openFilePicker}
              className="flex size-7.5 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-zinc-100/95 text-zinc-700/80 hover:text-zinc-800 dark:bg-zinc-800/90 dark:text-zinc-300/80 dark:hover:text-zinc-200"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
            </button>
            <div className="flex min-w-0 flex-1 items-center">
              {domain ? (
                <img src={faviconUrl(domain)} alt="" className="mr-2 size-5 shrink-0 rounded-sm" />
              ) : (
                <HugeiconsIcon icon={Globe02Icon} size={20} className="mr-2 shrink-0 text-zinc-400" />
              )}
              <input
                ref={urlInputRef}
                type="url"
                value={urlValue}
                onChange={(e) => { setUrlValue(e.target.value); setError(null) }}
                onKeyDown={handleUrlKeyDown}
                placeholder="www.clay.com"
                autoFocus
              className="min-w-0 flex-1 border-none bg-transparent py-1.5 text-[15px] font-normal text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-500"
            />
            </div>
            <div className="flex shrink-0 items-center gap-2.5 font-sans">
              <Menu>
                <MenuTrigger className="flex cursor-pointer items-center gap-1.5 rounded-md bg-zinc-100/90 px-3 py-2 text-[13px] font-medium text-zinc-700 outline-none hover:bg-zinc-200/45 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800/80">
                  {selected.icon}
                  <span className="hidden sm:inline">{selected.label}</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="shrink-0 ml-1 text-zinc-600" />
                </MenuTrigger>

                <MenuPopup sideOffset={6} align="end" className="w-60 rounded-md p-1">
                  <MenuRadioGroup value={selectedModel} onValueChange={(v) => setSelectedModel(v as ModelId)}>
                    {MODELS.map((model) => (
                      <MenuRadioItem
                        key={model.id}
                        value={model.id}
                        disabled={model.comingSoon}
                        className="gap-2.5 text-xs"
                      >
                        {model.icon}
                        {model.label}
                        {model.comingSoon && (
                          <span className="ms-auto rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-700/10 dark:text-orange-600">
                            Coming Soon
                          </span>
                        )}
                      </MenuRadioItem>
                    ))}
                  </MenuRadioGroup>
                </MenuPopup>
              </Menu>

              <button
                type="button"
                onClick={confirmUrl}
                disabled={!urlValue.trim() || isPending}
                className="flex size-8 shrink-0 items-center cursor-pointer justify-center rounded-lg bg-zinc-300/95 text-zinc-900/95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-700/80 dark:text-zinc-100"
              >
                {isPending ? (
                  <Spinner size={18} color={isDark ? "#ffffff" : "#000000"} />
                ) : (
                  <HugeiconsIcon icon={ArrowUp01Icon} size={15} stroke="1.5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-5 py-2.5 min-h-12">
            <button
              type="button"
              onClick={openFilePicker}
              className="flex size-7.5 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-zinc-100/90 text-zinc-700/80 hover:text-zinc-800 dark:bg-zinc-800/90 dark:text-zinc-300/80 dark:hover:text-zinc-200"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
            </button>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="mb-3 flex items-center gap-2 self-start rounded-md bg-blue-50 px-3 py-1.5 text-blue-700/80 dark:bg-blue-700/10 dark:text-blue-600">
                {confirmedDomain && (
                  <img src={faviconUrl(confirmedDomain)} alt="" className="size-4 shrink-0 rounded-sm" />
                )}
                <span className="truncate text-[13px] font-medium">{confirmedUrl}</span>
                <button
                  type="button"
                  onClick={resetUrl}
                  className="ml-1 flex size-4 cursor-pointer items-center justify-center rounded text-blue-700/60 hover:text-blue-700"
                >
                  <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <textarea
                ref={intentRef}
                value={intentValue}
                onChange={(e) => setIntentValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to change..."
                rows={1}
              className="min-w-0 resize-none border-none bg-transparent py-1.5 text-[15px] font-normal text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-500"
            />
            </div>

            <div className="flex shrink-0 items-center gap-2.5 font-sans">
              <Menu>
                <MenuTrigger className="flex cursor-pointer items-center gap-1.5 rounded-md bg-zinc-100/90 px-3 py-2 text-[13px] font-medium text-zinc-700 outline-none hover:bg-zinc-200/45 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80">
                  {selected.icon}
                  <span className="hidden sm:inline">{selected.label}</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="shrink-0 ml-1 text-zinc-600" />
                </MenuTrigger>

                <MenuPopup sideOffset={6} align="end" className="w-60 rounded-md p-1">
                  <MenuRadioGroup value={selectedModel} onValueChange={(v) => setSelectedModel(v as ModelId)}>
                    {MODELS.map((model) => (
                      <MenuRadioItem
                        key={model.id}
                        value={model.id}
                        disabled={model.comingSoon}
                        className="gap-2.5 text-xs"
                      >
                        {model.icon}
                        {model.label}
                        {model.comingSoon && (
                          <span className="ms-auto rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-700/20 dark:text-orange-500">
                            Coming Soon
                          </span>
                        )}
                      </MenuRadioItem>
                    ))}
                  </MenuRadioGroup>
                </MenuPopup>
              </Menu>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!confirmedUrl || isPending}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-300/80 text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-700/80 dark:text-zinc-100"
              >
                {isPending ? (
                  <Spinner size={18} color={isDark ? "#ffffff" : "#000000"} />
                ) : (
                  <HugeiconsIcon icon={ArrowUp01Icon} size={15} stroke="1.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 mx-5 pb-1 text-[13px] text-rose-700/90 dark:text-rose-600">
            {error}
          </div>
        )}
    </div>
      <style>{`
        [data-slot="menu-popup"] > div::-webkit-scrollbar { width: 5px; }
        [data-slot="menu-popup"] > div::-webkit-scrollbar-track { background: #fafafa; border-radius: 999px; }
        [data-slot="menu-popup"] > div::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 999px; }
        .dark [data-slot="menu-popup"] > div::-webkit-scrollbar-track { background: #27272a; }
        .dark [data-slot="menu-popup"] > div::-webkit-scrollbar-thumb { background: #52525b; }
      `}</style>
    </>
  )
}
