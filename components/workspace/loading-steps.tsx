"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const STEPS = [
  "Initializing",
  "Fetching website",
  "Extracting HTML & CSS",
  "Extracting assets",
  "Starting E2B + dev server",
  "Sending to Gemini",
  "Generating code",
  "Writing files (HMR)",
  "Waiting for dev server",
  "Finalizing",
]

interface LoadingStepsProps {
  currentStep: number
}

export function LoadingSteps({ currentStep }: LoadingStepsProps) {
  return (
    <div className="flex flex-col gap-2">
      {STEPS.map((label, i) => {
        const isComplete = i < currentStep
        const isActive = i === currentStep

        return (
          <div key={i} className="flex items-center gap-2.5">
            <div className="flex w-4 shrink-0 items-center justify-center">
              {isComplete ? (
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={16}
                  className="text-green-600"
                />
              ) : isActive ? (
                <Spinner className="size-3.5" />
              ) : (
                <span className="size-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              )}
            </div>
            <span
              className={cn(
                "text-sm leading-6 transition-all",
                isComplete && "text-zinc-400 line-through dark:text-zinc-500",
                isActive && "font-medium text-zinc-900 dark:text-zinc-100",
                !isComplete && !isActive && "text-zinc-800 font-normal dark:text-zinc-200",
              )}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
