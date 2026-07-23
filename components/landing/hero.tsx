"use client"

import { AnalyzeForm } from "./main/analyze-form"

interface HeroProps {
  onSubmit: (url: string) => void
  isPending: boolean
}

export function Hero({ onSubmit, isPending }: HeroProps) {
  return (
    <section className="relative flex min-h-[calc(100vh-env(safe-area-inset-bottom))] w-full flex-col items-center overflow-hidden bg-background pt-32 md:min-h-screen md:pb-64">
      <div className="relative z-10 flex w-full max-w-187.5 flex-col items-center gap-8 px-4">
        <h1 className="mx-auto max-w-4xl text-center text-[36px] leading-[0.98] tracking-[-0.06em] text-foreground sm:text-[40px] md:text-[48px]">
          Clone any website.
          <br className="md:hidden" />
        
        </h1>

        <p className="max-w-110 text-center text-base font-normal leading-relaxed text-muted-foreground antialiased">
          Paste a URL and get a clean, production-ready Next.js codebase — styled, structured, and ready to run.
        </p>

        <div className="w-full max-w-xl">
          <AnalyzeForm onSubmit={onSubmit} isPending={isPending} />
        </div>
      </div>
    </section>
  )
}
