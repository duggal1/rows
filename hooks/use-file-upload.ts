"use client"

import { useCallback, useRef, useState } from "react"

export interface AttachedFile {
  id: string
  name: string
  content: string
}

const ALLOWED_EXTENSIONS = [".md", ".txt"]

export function useFileUpload() {
  const [files, setFiles] = useState<AttachedFile[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)

  const openFilePicker = useCallback(() => {
    if (!inputRef.current) {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".md,.txt"
      input.multiple = true
      input.onchange = () => {
        const selected = Array.from(input.files ?? [])
        for (const file of selected) {
          const ext = "." + file.name.split(".").pop()?.toLowerCase()
          if (!ALLOWED_EXTENSIONS.includes(ext)) continue
          const reader = new FileReader()
          reader.onload = (e) => {
            const content = e.target?.result as string
            setFiles((prev) => [
              ...prev,
              { id: crypto.randomUUID(), name: file.name, content },
            ])
          }
          reader.readAsText(file)
        }
        input.value = ""
      }
      inputRef.current = input
    }
    inputRef.current.click()
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  return { files, openFilePicker, removeFile, clearFiles }
}
