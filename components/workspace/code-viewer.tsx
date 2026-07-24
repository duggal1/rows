"use client"

import { useState } from "react"
import { Highlight, themes } from "prism-react-renderer"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardPanel } from "@/components/ui/card"
import { useTheme } from "@/lib/theme-context"

interface CodeViewerProps {
  code: string
  language?: string
  fileName?: string
}

export function CodeViewer({ code, language = "tsx", fileName }: CodeViewerProps) {
  const [copied, setCopied] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-xl border">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b px-4 py-2.5">
        <span className="truncate text-xs text-muted-foreground font-mono">
          {fileName ?? "Select a file"}
        </span>
        {fileName && (
          <Button variant="outline" size="sm" onClick={copy} rounded="md">
            {copied ? "Copied" : "Copy"}
          </Button>
        )}
      </CardHeader>
      <CardPanel className="flex-1 overflow-auto p-4">
        <pre className="font-mono text-[13px] leading-relaxed">
          <Highlight
            theme={isDark ? themes.vsDark : themes.vsLight}
            code={code.trim()}
            language={language}
          >
            {({ tokens, getLineProps, getTokenProps }) => (
              <>
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })} className="flex">
                    <span className="mr-4 w-8 shrink-0 text-right text-[11px] text-neutral-400 select-none">
                      {i + 1}
                    </span>
                    <span>
                      {line.map((token, j) => (
                        <span key={j} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  </div>
                ))}
              </>
            )}
          </Highlight>
        </pre>
      </CardPanel>
    </Card>
  )
}
