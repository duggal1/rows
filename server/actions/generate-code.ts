"use server"

import { z } from "zod"
import { GeminiClient } from "@/server/actions/provider/gemini/gemini-client"
import { buildSystemPrompt, buildUserPrompt } from "@/server/actions/provider/gemini/prompt"
import { makeBoundaryToken } from "@/lib/codegen/protocol"
import { FileStreamParser } from "@/lib/codegen/protocol-parser"
import { terminal } from "@/server/terminal/logger"

const FORBIDDEN_FILES = new Set([
  "globals.css", "layout.tsx", "next.config.ts", "tailwind.config.ts",
  "app/globals.css", "app/layout.tsx",
])

function normalizeFilePath(raw: string): string | null {
  let p = raw.replace(/\\/g, "/")
  p = p.replace(/^project\//, "")
  p = p.replace(/^src\//, "")
  p = p.replace(/^\/+/, "")
  if (FORBIDDEN_FILES.has(p)) return null
  if (p === "page.tsx") return "app/page.tsx"
  return p
}

const attachedFileSchema = z.object({
  name: z.string(),
  content: z.string(),
})

const inputSchema = z.object({
  url: z.string().url().optional(),
  htmlDump: z.string().optional(),
  cssDump: z.string().optional(),
  prompt: z.string().optional(),
  attachedFiles: z.array(attachedFileSchema).optional(),
  svgs: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
  jsSnippets: z.array(z.string()).optional(),
})

export interface GeneratedFile {
  path: string
  content: string
}

export interface StreamChunk {
  type: "event" | "file" | "done" | "error"
  text?: string
  file?: GeneratedFile
  message?: string
}

export type GenerateCodeResponse =
  | { ok: true; data: { files: GeneratedFile[]; raw: string; summary: string } }
  | { ok: false; error: string }

export async function generateCode(
  input: z.infer<typeof inputSchema>,
): Promise<GenerateCodeResponse> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Invalid input." }
  const { htmlDump, cssDump, url, prompt, attachedFiles, svgs, imageUrls, jsSnippets } = parsed.data

  if (!htmlDump) {
    return { ok: false, error: "Provide an HTML dump (use cloneSite to ScrapingBee-render the URL first)." }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY not configured." }
  }

  const html = htmlDump
  const css = cssDump ?? ""

  const token = makeBoundaryToken()
  const slicedSvgs = svgs?.map((s) => s.slice(0, 10_000)) ?? []
  const userPrompt = buildUserPrompt(html.slice(0, 200_000), css.slice(0, 100_000), prompt, attachedFiles, url, slicedSvgs, imageUrls, jsSnippets)

  terminal.init("Gemini 3.6 Flash", "medium")
  terminal.context("html", html.length)
  if (css) terminal.context("css", css.length)

  const client = new GeminiClient({ apiKey })

  const start = Date.now()

  try {
    const result = await client.createInteraction({
      systemInstruction: buildSystemPrompt(token),
      input: userPrompt,
      thinkingLevel: "medium",
      temperature: 0.9,
      maxOutputTokens: 16_384,
    })

    terminal.success(Date.now() - start)

    const parser = new FileStreamParser(token)
    const events = parser.push(result.text)
    const finalEvents = parser.finalize()

    const fileEvents = [...events, ...finalEvents].filter(
      (e) => e.type === "file_complete",
    ) as { type: "file_complete"; file: { path: string; content: string } }[]

    const files = fileEvents
      .map((e) => {
        const p = normalizeFilePath(e.file.path)
        return p ? { path: p, content: e.file.content } : null
      })
      .filter((f): f is { path: string; content: string } => f !== null)

    if (files.length === 0) {
      return {
        ok: false,
        error: "AI returned no files (all paths were forbidden or unparseable).",
      }
    }

    terminal.files(files.length)

    return { ok: true, data: { files, raw: result.text, summary: parser.getSummary() } }
  } catch (e) {
    terminal.error(String(e))
    return { ok: false, error: `AI generation failed: ${e}` }
  }
}
