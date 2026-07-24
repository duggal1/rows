export interface ParsedFile {
  path: string
  content: string
  complete: boolean
}

export type FileEvent =
  | { type: "file_complete"; file: ParsedFile }
  | { type: "file_incomplete"; file: ParsedFile }
  | { type: "stray_text"; text: string }

export class FileStreamParser {
  private token: string
  private openTagRe: RegExp
  private closeTagStr: string
  private buffer = ""
  private state: "seeking" | "in_file" | "in_summary" = "seeking"
  private currentPath = ""
  private currentLines: string[] = []
  private summaryLines: string[] = []

  constructor(token: string) {
    this.token = token
    this.openTagRe = new RegExp(`⟦FILE:${token} path="(.+)"⟧`)
    this.closeTagStr = `⟦ENDFILE:${token}⟧`
  }

  push(chunk: string): FileEvent[] {
    this.buffer += chunk
    const events: FileEvent[] = []
    let idx: number

    while ((idx = this.buffer.indexOf("\n")) !== -1) {
      const line = this.buffer.slice(0, idx)
      this.buffer = this.buffer.slice(idx + 1)
      events.push(...this.consumeLine(line))
    }
    return events
  }

  getSummary(): string {
    return this.summaryLines.join("\n").trim()
  }

  private emitFile(): FileEvent {
    return {
      type: "file_complete",
      file: {
        path: this.currentPath,
        content: this.currentLines.join("\n"),
        complete: true,
      },
    }
  }

  private consumeLine(line: string): FileEvent[] {
    const summaryStartIdx = line.indexOf("⟦SUMMARY⟧")
    if (summaryStartIdx !== -1) {
      const before = line.slice(0, summaryStartIdx)
      const after = line.slice(summaryStartIdx + "⟦SUMMARY⟧".length)
      const events: FileEvent[] = []
      if (this.state === "in_file") {
        const closeIdx = before.indexOf(this.closeTagStr)
        if (closeIdx !== -1) {
          const lastLine = before.slice(0, closeIdx)
          if (lastLine) this.currentLines.push(lastLine)
          const rest = before.slice(closeIdx + this.closeTagStr.length)
          if (rest.trim()) this.currentLines.push(rest)
          events.push(this.emitFile())
        } else {
          if (before.trim()) this.currentLines.push(before)
          events.push(this.emitFile())
        }
      }
      if (before.trim() && this.state === "seeking") {
        events.push({ type: "stray_text", text: before })
      }
      this.state = "in_summary"
      this.summaryLines = []
      if (after.trim()) this.summaryLines.push(after.trim())
      return events
    }

    if (this.state === "in_summary") {
      if (line.startsWith("⟦ENDSUMMARY⟧")) {
        this.state = "seeking"
        return []
      }
      this.summaryLines.push(line)
      return []
    }

    if (this.state === "seeking") {
      const openIdx = line.indexOf(`⟦FILE:${this.token} path="`)
      if (openIdx !== -1) {
        const tagEnd = line.indexOf("⟧", openIdx)
        if (tagEnd !== -1) {
          const tag = line.slice(openIdx, tagEnd + 1)
          const m = tag.match(this.openTagRe)
          if (m) {
            const before = line.slice(0, openIdx)
            const after = line.slice(tagEnd + 1)
            const events: FileEvent[] = []
            if (before.trim()) events.push({ type: "stray_text", text: before })
            this.state = "in_file"
            this.currentPath = m[1]
            this.currentLines = []
            if (after) this.currentLines.push(after)
            return events
          }
        }
      }
      if (line.trim().length > 0) return [{ type: "stray_text", text: line }]
      return []
    }

    const closeIdx = line.indexOf(this.closeTagStr)
    if (closeIdx !== -1) {
      const lastLine = line.slice(0, closeIdx)
      if (lastLine) this.currentLines.push(lastLine)
      const after = line.slice(closeIdx + this.closeTagStr.length)
      const events: FileEvent[] = [this.emitFile()]
      this.state = "seeking"
      this.currentPath = ""
      this.currentLines = []
      if (after.trim()) {
        this.buffer = after + "\n" + this.buffer
      }
      return events
    }

    this.currentLines.push(line)
    return []
  }

  finalize(): FileEvent[] {
    if (this.buffer.trim().length > 0) {
      this.consumeLine(this.buffer)
      this.buffer = ""
    }
    if (this.state === "in_file" && this.currentLines.length > 0) {
      return [
        {
          type: "file_incomplete",
          file: {
            path: this.currentPath,
            content: this.currentLines.join("\n"),
            complete: false,
          },
        },
      ]
    }
    return []
  }
}
