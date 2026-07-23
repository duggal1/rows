"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Globe02Icon } from "@hugeicons/core-free-icons"
import { useMemo, useRef, useState } from "react"

import { Spinner } from "@/components/ui/loading-state/spinner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function extractDomain(url: string): string | null {
  try {
    return new URL(
      url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`
    ).hostname
  } catch {
    return null
  }
}

function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

interface AnalyzeFormProps {
  onSubmit: (url: string) => void
  isPending: boolean
}

export function AnalyzeForm({ onSubmit, isPending }: AnalyzeFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [urlValue, setUrlValue] = useState("")
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const domain = useMemo(() => extractDomain(urlValue), [urlValue])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const raw = urlValue.trim()
    if (!raw) {
      setHasError(true)
      setError("Please enter a site URL")
      inputRef.current?.focus()
      return
    }
    const normalized = raw.startsWith("http") ? raw : `https://${raw}`
    try {
      new URL(normalized)
    } catch {
      setHasError(true)
      setError("Enter a valid URL — e.g. https://stripe.com")
      inputRef.current?.focus()
      return
    }
    setHasError(false)
    setError(null)
    onSubmit(normalized)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={`flex items-center gap-2 rounded-xl dark:bg-zinc-900 bg-zinc-50 px-5 py-2 transition-colors ${
          hasError ? "ring-1 ring-destructive/60" : ""
        }`}
      >
        {domain ? (
          <img
            src={faviconUrl(domain)}
            alt=""
            className="size-5 shrink-0 rounded-sm"
          />
        ) : (
          <HugeiconsIcon
            icon={Globe02Icon}
            size={20}
            className="shrink-0 text-muted-foreground"
          />
        )}
        <Input
          ref={inputRef}
          name="url"
          type="url"
          placeholder="https://company.com"
          value={urlValue}
          onChange={(e) => {
            setUrlValue(e.target.value)
            setHasError(false)
          }}
           className="h-8 bg-transparent px-0 shadow-none"
        />
        <Button
          type="submit"
          size="sm"
          rounded="lg"
          loading={isPending}

        >
          {isPending ? "Cloning…" : "Clone"}
        </Button>
      </div>
      {error && (
        <div className="mt-3 rounded-xl bg-rose-100/80 px-3 py-2.5 text-rose-700/90 dark:bg-rose-700/20 dark:text-rose-600">
          {error}
        </div>
      )}
    </form>
  )
}
