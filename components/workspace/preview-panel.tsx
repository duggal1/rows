"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Share01Icon,
  PlusSignIcon,
  Layers01Icon,
  LockIcon,
} from "@hugeicons/core-free-icons"
import { Skeleton } from "@/components/ui/skeleton"
import { IPhoneFrame } from "./iphone-frame"

interface PreviewPanelProps {
  html: string
  mode: "desktop" | "mobile"
}

export function PreviewPanel({ html, mode }: PreviewPanelProps) {
  const hasContent = html.length > 0

  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950">
      {/* Safari-style window frame */}
      <div className="flex-1 flex items-start justify-center px-6 pb-6">
        <div className="relative w-full max-w-[1600px] mx-auto bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg overflow-hidden flex flex-col h-[580px] sm:h-[650px] md:h-[750px]">
          {/* Safari browser header */}
          <div className="h-10 bg-stone-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 flex items-center px-3 justify-between shrink-0">
            {/* Traffic lights + nav */}
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

            {/* URL bar */}
            <div className="flex-1 max-w-[200px] sm:max-w-md mx-3">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-md h-6 flex items-center justify-center gap-1 px-2 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400">
                <HugeiconsIcon icon={LockIcon} size={10} strokeWidth={1} className="text-zinc-700 dark:text-zinc-300" />
                <span className="tracking-tight antialiased">localhost:3000</span>
              </div>
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
              <HugeiconsIcon icon={Share01Icon} size={16} strokeWidth={1} />
              <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={1} />
              <HugeiconsIcon icon={Layers01Icon} size={16} strokeWidth={1} />
            </div>
          </div>

          {/* Content */}
          {mode === "mobile" ? (
            <div className="flex flex-1 items-start justify-center py-6 overflow-auto">
              <IPhoneFrame>
                {hasContent ? (
                  <iframe
                    srcDoc={html}
                    title="Mobile Preview"
                    className="h-full w-full"
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div className="h-full flex flex-col p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Skeleton className="size-6 rounded-full dark:bg-zinc-700" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-2 w-3/5 dark:bg-zinc-700" />
                        <Skeleton className="h-2 w-2/5 dark:bg-zinc-700" />
                      </div>
                    </div>
                    <Skeleton className="h-24 w-full rounded-md mb-4 dark:bg-zinc-700" />
                    <div className="space-y-2">
                      <Skeleton className="h-2 w-full dark:bg-zinc-700" />
                      <Skeleton className="h-2 w-4/5 dark:bg-zinc-700" />
                      <Skeleton className="h-2 w-3/5 dark:bg-zinc-700" />
                    </div>
                    <div className="space-y-2 mt-auto pt-4">
                      <Skeleton className="h-2 w-full dark:bg-zinc-700" />
                      <Skeleton className="h-2 w-5/6 dark:bg-zinc-700" />
                      <Skeleton className="h-2 w-3/4 dark:bg-zinc-700" />
                      <Skeleton className="h-2 w-2/5 dark:bg-zinc-700" />
                    </div>
                  </div>
                )}
              </IPhoneFrame>
            </div>
          ) : hasContent ? (
            <div className="flex-1 overflow-auto">
              <iframe
                srcDoc={html}
                title="Desktop Preview"
                className="h-full w-full"
                sandbox="allow-scripts"
              />
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <div className="p-8 space-y-5">
                <Skeleton className="h-5 w-2/5 dark:bg-zinc-700" />
                <Skeleton className="h-5 w-4/5 dark:bg-zinc-700" />
                <div className="space-y-2 pt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 dark:bg-zinc-700" style={{ width: `${60 + Math.random() * 35}%` }} />
                  ))}
                </div>
                <div className="pt-2">
                  <Skeleton className="h-8 w-28 rounded-md dark:bg-zinc-700" />
                </div>
                <div className="space-y-2 pt-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 dark:bg-zinc-700" style={{ width: `${55 + Math.random() * 40}%` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
