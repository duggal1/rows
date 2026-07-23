"use client"

import { useState, useCallback, useRef } from "react"

export interface CodegenFile {
  path: string
  content: string
}

export function useCodegenStream() {
  const [files, setFiles] = useState<CodegenFile[]>([])
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const startGeneration = useCallback(async (html: string, css: string) => {
    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

    setStatus("streaming")
    setFiles([])
    setError(null)

    try {
      const res = await fetch("/api/generate-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, css }),
        signal: abort.signal,
      })

      if (!res.ok) {
        setStatus("error")
        setError(`HTTP ${res.status}`)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setStatus("error")
        setError("No response body")
        return
      }

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === "file") {
              setFiles((prev) => {
                const idx = prev.findIndex((f) => f.path === data.path)
                if (idx !== -1) {
                  const next = [...prev]
                  next[idx] = data
                  return next
                }
                return [...prev, { path: data.path, content: data.content }]
              })
            } else if (data.type === "done") {
              setStatus("done")
            } else if (data.type === "error") {
              setStatus("error")
              setError(data.message)
            }
          } catch {
            // skip unparseable lines
          }
        }
      }

      if (status !== "error") setStatus("done")
    } catch (e) {
      if ((e as Error).name === "AbortError") return
      setStatus("error")
      setError(String(e))
    }
  }, [status])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setStatus("idle")
    setFiles([])
    setError(null)
  }, [])

  return { files, status, error, startGeneration, reset }
}
