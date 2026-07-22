"use client"

import { startTransition, useState } from "react"

import { AnalyzeForm } from "@/components/landing/main/analyze-form"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CloneResult, cloneSite } from "@/server/actions/site/clone-site"

export default function Page() {
  const [result, setResult] = useState<CloneResult | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(url: string) {
    setError(null)
    setIsPending(true)

    startTransition(async () => {
      const res = await cloneSite(url)
      setIsPending(false)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setResult(res.data)
    })
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center px-4 pt-24 sm:pt-32">
        <div className="w-full text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Clone any website
          </h1>
          <p className="mt-2 text-muted-foreground">
            Paste a URL and get a clean copy of the site content.
          </p>
        </div>

        <div className="mt-8 w-full max-w-xl">
          <AnalyzeForm onSubmit={handleSubmit} isPending={isPending} />
        </div>

        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}

        {result && (
          <div className="mt-12 w-full space-y-6 pb-24">
            <Card>
              <CardHeader>
                <CardTitle>{result.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground break-all">
                  Source: {result.sourceUrl}
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const blob = new Blob([result.cleanHtml], { type: "text/plain" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = "page.html"
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className={buttonVariants({ variant: "outline", rounded: "lg" })}
              >
                Download HTML
              </button>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              <iframe
                srcDoc={result.html}
                title="Preview"
                className="h-[600px] w-full rounded-xl"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
