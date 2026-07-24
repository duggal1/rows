"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Share01Icon,
  PlusSignIcon,
  Layers01Icon,
  LockIcon,
} from "@hugeicons/core-free-icons"
import { IPhoneFrame } from "./iphone-frame"

interface PreviewPanelProps {
  previewUrl?: string
  mode: "desktop" | "mobile"
}

export function PreviewPanel({ previewUrl, mode }: PreviewPanelProps) {
  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950">
      <div className="flex-1 flex items-start justify-center px-6 pb-6">
        <div className="relative w-full max-w-[1600px] mx-auto bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg overflow-hidden flex flex-col h-[580px] sm:h-[650px] md:h-[750px]">
          <div className="h-10 bg-stone-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 flex items-center px-3 justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-[#FF5F57] border border-[#E0443E]" />
                <div className="size-2.5 rounded-full bg-[#FEBC2E] border border-[#D89D24]" />
                <div className="size-2.5 rounded-full bg-[#28C840] border border-[#1AAB29]" />
              </div>
              <div className="flex items-center gap-3 text-zinc-400 dark:text-zinc-500">
                <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1} />
                <HugeiconsIcon icon={ArrowRight02Icon} size={16} strokeWidth={1} />
              </div>
            </div>

            <div className="flex-1 max-w-[200px] sm:max-w-md mx-3">
              {previewUrl ? (
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-md h-8 px-2">
                  <HugeiconsIcon icon={LockIcon} size={11} strokeWidth={1} className="text-zinc-500 dark:text-zinc-400 shrink-0" />
                  <input
                    readOnly
                    value={previewUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 bg-transparent text-[11px] sm:text-[12px] text-zinc-600 dark:text-zinc-300 tracking-tight antialiased outline-none truncate cursor-default"
                  />
                  <Link
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="size-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0"
                  >
                    <HugeiconsIcon icon={Share01Icon} size={12} strokeWidth={1} />
                  </Link>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-md h-8 flex items-center justify-center gap-1.5 px-3 text-[11px] sm:text-[12px] text-zinc-400 dark:text-zinc-500">
                  <HugeiconsIcon icon={LockIcon} size={11} strokeWidth={1} className="text-zinc-500 dark:text-zinc-400 shrink-0" />
                  <span className="tracking-tight antialiased">Waiting for deployment...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
              <HugeiconsIcon icon={Share01Icon} size={16} strokeWidth={1} />
              <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={1} />
              <HugeiconsIcon icon={Layers01Icon} size={16} strokeWidth={1} />
            </div>
          </div>

          {mode === "mobile" ? (
            <div className="flex flex-1 items-start justify-center py-6 overflow-auto">
              <IPhoneFrame>
                {previewUrl ? (
                  <iframe
                    key={previewUrl}
                    src={previewUrl}
                    title="Mobile Preview"
                    className="h-full w-full"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
                    Preview will appear here
                  </div>
                )}
              </IPhoneFrame>
            </div>
          ) : previewUrl ? (
            <div className="flex-1 overflow-auto">
              <iframe
                key={previewUrl}
                src={previewUrl}
                title="Desktop Preview"
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="text-sm text-zinc-400 dark:text-zinc-500">Waiting for Next.js deployment...</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
