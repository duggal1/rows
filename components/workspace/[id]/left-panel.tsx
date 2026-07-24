"use client"

import React from "react"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Download01Icon,
  GiftIcon,
  Settings01Icon,
  ApiIcon,
  Github01Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons"
import { InputComposer } from "@/components/workspace/input-composer"
import { LoadingSteps } from "@/components/workspace/loading-steps"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Menu,
  MenuPopup,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuSubPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/ui/menu"
import { useTheme } from "@/lib/theme-context"
import { faviconUrl } from "./utils"

import type { AttachedFile } from "@/hooks/use-file-upload"

interface LeftPanelProps {
  domain: string
  folderName: string
  step: number
  isProcessing: boolean
  isDone: boolean
  isDownloading: boolean
  inputValue: string
  router: AppRouterInstance
  url?: string | null
  prompt?: string | null
  summary?: string
  onDownloadZip: () => void
  onInputChange: (value: string) => void
  onComposeSubmit: (text: string, files: AttachedFile[], model: string) => void
}

function SummaryRenderer({ summary }: { summary: string }) {
  const lines = summary.split("\n")
  const elements: React.ReactElement[] = []
  let inList = false
  let listItems: React.ReactElement[] = []

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-1.5">
          {listItems}
        </ul>,
      )
      listItems = []
    }
    inList = false
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      continue
    }

    if (trimmed.startsWith("## ")) {
      flushList()
      elements.push(
        <h2 key={`h-${i}`} className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mt-5 mb-2 first:mt-0">
          {trimmed.replace("## ", "")}
        </h2>,
      )
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true
      const text = trimmed.slice(2)
      const parts = text.split(/(`[^`]+`)/g)
      listItems.push(
        <li key={`li-${i}`} className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {parts.map((part, j) =>
            part.startsWith("`") && part.endsWith("`") ? (
              <span
                key={j}
                className="inline-flex items-center rounded-md bg-blue-50/80 px-2 py-0.5 text-[12px] font-medium text-blue-700 dark:bg-blue-700/15 dark:text-blue-500"
              >
                {part.slice(1, -1)}
              </span>
            ) : (
              <span key={j}>{part}</span>
            ),
          )}
        </li>,
      )
    } else {
      flushList()
      elements.push(
        <p key={`p-${i}`} className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {trimmed}
        </p>,
      )
    }
  }
  flushList()

  return <div className="space-y-1">{elements}</div>
}

function ChatBubble({ url, prompt, summary, isProcessing, isDone }: {
  url?: string | null
  prompt?: string | null
  summary?: string
  isProcessing: boolean
  isDone: boolean
}) {
  const displayPrompt = prompt || "Clone this website"

  return (
    <div className="space-y-5">
      <div className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950">
        {url && (
          <p className="text-[13px] font-medium break-all text-blue-600 underline decoration-dotted underline-offset-2 dark:text-blue-400">{url}</p>
        )}
        <p className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {displayPrompt}
        </p>
      </div>

      {isDone && (
        <div className="flex gap-3">
          <img src="/gemini-color.svg" alt="Gemini" className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <SummaryRenderer summary={summary || ""} />
          </div>
        </div>
      )}
    </div>
  )
}

export function LeftPanel({
  domain,
  folderName,
  step,
  isProcessing,
  isDone,
  isDownloading,
  inputValue,
  router,
  url,
  prompt,
  summary,
  onDownloadZip,
  onInputChange,
  onComposeSubmit,
}: LeftPanelProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex w-[40%] min-w-0 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon-xs" onClick={() => router.push("/")}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
          {domain && (
            <img src={faviconUrl(domain)} alt="" className="size-4 shrink-0 rounded-sm" />
          )}

          <Menu>
            <MenuTrigger className="flex items-center gap-1 cursor-pointer outline-none">
              <span className="truncate text-sm font-medium text-neutral-900 dark:text-zinc-100">{folderName}</span>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-neutral-400 shrink-0 dark:text-zinc-500">
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </MenuTrigger>

            <MenuPopup sideOffset={6} align="start" className="w-56 rounded-md p-1">

              <MenuItem disabled className="gap-2.5">
                <HugeiconsIcon icon={GiftIcon} size={16} />
                Get free credits
              </MenuItem>

              <MenuItem disabled className="gap-2.5">
                <HugeiconsIcon icon={Settings01Icon} size={16} />
                Settings
              </MenuItem>

              <MenuItem disabled className="gap-2.5">
                <HugeiconsIcon icon={ApiIcon} size={16} />
                Integrations
              </MenuItem>

              <MenuItem disabled className="gap-2.5">
                <HugeiconsIcon icon={Github01Icon} size={16} />
                Export to GitHub
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} className="ms-auto opacity-60" />
              </MenuItem>

              <MenuSeparator />

              <MenuSub>
                <MenuSubTrigger className="gap-2.5">
                  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="shrink-0 opacity-80" aria-hidden="true">
                    <path d="M20.25 12C20.25 7.44365 16.5563 3.75 12 3.75C11.9163 3.75 11.833 3.75437 11.75 3.75684V20.2422C11.8331 20.2447 11.9163 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12ZM21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C11.6345 21.75 11.2735 21.7297 10.918 21.6904C6.04223 21.1514 2.25 17.0191 2.25 12C2.25 6.9809 6.04223 2.84856 10.918 2.30957C11.2735 2.27028 11.6345 2.25 12 2.25C17.3848 2.25 21.75 6.61522 21.75 12Z" fill="currentColor" />
                  </svg>
                  Appearance
                </MenuSubTrigger>
                <MenuSubPopup className="w-48 rounded-md p-1">
                  <MenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
                    <MenuRadioItem value="light" className="gap-2.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" className="shrink-0 opacity-80">
                        <circle cx="12" cy="12" r="5" />
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                      </svg>
                      Light
                    </MenuRadioItem>
                    <MenuRadioItem value="dark" className="gap-2.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" className="shrink-0 opacity-80">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                      Dark
                    </MenuRadioItem>
                    <MenuRadioItem value="system" className="gap-2.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" className="shrink-0 opacity-80">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                      </svg>
                      System
                    </MenuRadioItem>
                  </MenuRadioGroup>
                </MenuSubPopup>
              </MenuSub>

            </MenuPopup>
          </Menu>

          <div className="flex shrink-0 items-center gap-1.5 rounded-md bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 px-3 py-1 text-[12px] font-medium text-zinc-700 dark:text-zinc-300 ml-2">
            <img
              src="https://www.google.com/s2/favicons?domain=nextjs.org&sz=64"
              alt=""
              className="size-3.5 shrink-0 rounded-sm"
            />
            Next.js
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadZip}
          disabled={isDownloading || !isDone}
          className="shrink-0 gap-2 cursor-pointer rounded-lg px-3 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          rounded="md"
        >
          <HugeiconsIcon icon={Download01Icon} size={14} />
          Download
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-5 space-y-4">
            <ChatBubble
              url={url}
              prompt={prompt}
              summary={summary}
              isProcessing={isProcessing}
              isDone={isDone}
            />
          </div>
          {isProcessing && !isDone && (
            <div className="px-5 pb-5">
              <LoadingSteps currentStep={step} />
            </div>
          )}
        </ScrollArea>
      </div>

      <InputComposer value={inputValue} onChange={onInputChange} />
    </div>
  )
}
