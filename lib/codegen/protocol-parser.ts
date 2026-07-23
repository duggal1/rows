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
  private openRe: RegExp
  private closeRe: RegExp
  private buffer = ""
  private state: "seeking" | "in_file" = "seeking"
  private currentPath = ""
  private currentLines: string[] = []

  constructor(token: string) {
    this.token = token
    this.openRe = new RegExp(`^⟦FILE:${token} path="(.+)"⟧$`)
    this.closeRe = new RegExp(`^⟦ENDFILE:${token}⟧$`)
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

  private consumeLine(line: string): FileEvent[] {
    if (this.state === "seeking") {
      const m = line.match(this.openRe)
      if (m) {
        this.state = "in_file"
        this.currentPath = m[1]
        this.currentLines = []
        return []
      }
      if (line.trim().length > 0) return [{ type: "stray_text", text: line }]
      return []
    }

    if (this.closeRe.test(line)) {
      const file: ParsedFile = {
        path: this.currentPath,
        content: this.currentLines.join("\n"),
        complete: true,
      }
      this.state = "seeking"
      this.currentPath = ""
      this.currentLines = []
      return [{ type: "file_complete", file }]
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
