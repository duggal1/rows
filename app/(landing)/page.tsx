"use client"

import { Suspense, useCallback, useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Hero } from "@/components/landing/hero"
import { RecentProjects } from "@/components/landing/recent-projects"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { createWorkspace } from "@/server/actions/workspace"
import type { AnalyzeSubmitPayload } from "@/components/landing/main/analyze-form"

function PageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [authOpen, setAuthOpen] = useState(false)
  const { data: session, isPending: sessionLoading } = authClient.useSession()

  const signinParam = searchParams.get("signin")

  useEffect(() => {
    if (signinParam === "true" && !session && !sessionLoading) {
      setAuthOpen(true)
    }
  }, [signinParam, session, sessionLoading])

  const handleSubmit = useCallback(
    async ({ url, intent, model, attachments }: AnalyzeSubmitPayload) => {
      if (!session) {
        setAuthOpen(true)
        return
      }

      const id = crypto.randomUUID()
      try {
        await createWorkspace({ id, url, prompt: intent })
      } catch {
        setAuthOpen(true)
        return
      }

      if (attachments.length > 0) {
        try {
          sessionStorage.setItem(`workspace-files-${id}`, JSON.stringify(attachments))
        } catch { /* proceed without files */ }
      }

      const params = new URLSearchParams({ url, model })
      if (intent) params.set("prompt", intent)

      startTransition(() => {
        router.push(`/workspace/${id}?${params.toString()}`)
      })
    },
    [session, router],
  )

  return (
    <>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <Hero onSubmit={handleSubmit} isPending={isPending} />
      <RecentProjects />
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageInner />
    </Suspense>
  )
}
