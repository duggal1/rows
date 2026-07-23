"use client"

import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon, ArrowUp01Icon } from "@hugeicons/core-free-icons"

interface InputComposerProps {
  value: string
  onChange: (value: string) => void
}

export function InputComposer({ value, onChange }: InputComposerProps) {
  return (
    <div className="bg-zinc-50 px-5 py-6 dark:bg-zinc-900">
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/60 bg-white px-5 py-3 dark:border-zinc-800/60 dark:bg-zinc-950">
        <button
          type="button"
          className="flex size-7.5 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-zinc-100/90 text-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-300/80"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
        </button>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask AI to modify..."
          className="min-w-0 flex-1 border-none bg-transparent text-[14px] font-normal text-zinc-800/70 outline-none placeholder:text-zinc-400/90 dark:text-zinc-200/70 dark:placeholder:text-zinc-500/90"
        />
        <div className="flex shrink-0 items-center gap-2.5 font-sans">
          <div className="flex items-center gap-1.5 rounded-md bg-zinc-100/90 px-3 py-1 dark:bg-zinc-800/90">
            <Image src="/claude-color.svg" alt="" width={14} height={14} className="size-3.5" />
            <span className="hidden text-[13px] font-medium text-zinc-800 sm:inline dark:text-zinc-200">
              Opus 4.8
            </span>
          </div>
          <div className="flex items-center rounded-sm bg-fuchsia-100/90 px-3 py-1 font-sans dark:bg-fuchsia-700/20">
            <span className="text-[13px] font-medium text-fuchsia-700 dark:text-fuchsia-500">
              AI Mode
            </span>
          </div>
          <button
            type="button"
            className="ml-4 flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-300/80 text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-700/80 dark:text-zinc-100"
            disabled={!value.trim()}
          >
            <HugeiconsIcon icon={ArrowUp01Icon} size={15} stroke="1.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
