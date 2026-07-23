"use server"

import { z } from "zod"
import { GeminiClient } from "@/server/actions/provider/gemini/gemini-client"
import { buildSystemPrompt, buildUserPrompt } from "@/server/actions/provider/gemini/prompt"
import { makeBoundaryToken } from "@/lib/codegen/protocol"
import { FileStreamParser } from "@/lib/codegen/protocol-parser"
import { terminal } from "@/server/terminal/logger"

const inputSchema = z.object({
  url: z.string().url().optional(),
  htmlDump: z.string().optional(),
  cssDump: z.string().optional(),
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
  | { ok: true; data: { files: GeneratedFile[]; raw: string } }
  | { ok: false; error: string }

export async function generateCode(
  input: z.infer<typeof inputSchema>,
): Promise<GenerateCodeResponse> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Invalid input." }
  const { htmlDump, cssDump, url } = parsed.data

  if (!htmlDump && !url) {
    return { ok: false, error: "Provide a URL or an HTML dump." }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY not configured." }
  }

  let html = htmlDump ?? ""
  let css = cssDump ?? ""

  if (url && !html) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(15_000),
      })
      if (!res.ok) return { ok: false, error: `URL responded with ${res.status}.` }
      const text = await res.text()

      const styleMatches = text.match(/<style[^>]*>([\s\S]*?)<\/style>/gi)
      if (styleMatches) {
        css = styleMatches
          .map((s) => s.replace(/<\/?style[^>]*>/gi, ""))
          .join("\n")
      }

      const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i)
      html = bodyMatch?.[1] ?? text
    } catch (e) {
      return { ok: false, error: `Failed to fetch URL: ${e}` }
    }
  }

  const token = makeBoundaryToken()
  const prompt = buildUserPrompt(html.slice(0, 100_000), css.slice(0, 50_000))

  terminal.init("Gemini 3.6 Flash", "medium")
  terminal.context("html", html.length)
  if (css) terminal.context("css", css.length)

  const client = new GeminiClient({ apiKey })

  const start = Date.now()

  try {
    const result = await client.createInteraction({
      systemInstruction: buildSystemPrompt(token),
      input: prompt,
      thinkingLevel: "medium",
      temperature: 0.1,
      maxOutputTokens: 16_384,
    })

    terminal.success(Date.now() - start)

    const parser = new FileStreamParser(token)
    const events = parser.push(result.text)
    const finalEvents = parser.finalize()

    const fileEvents = [...events, ...finalEvents].filter(
      (e) => e.type === "file_complete",
    ) as { type: "file_complete"; file: { path: string; content: string } }[]

    const files = fileEvents.map((e) => ({ path: e.file.path, content: e.file.content }))

    if (files.length === 0) {
      return {
        ok: false,
        error: "AI returned no files. Raw response was empty or unparseable.",
      }
    }

    terminal.files(files.length)

    return { ok: true, data: { files, raw: result.text } }
  } catch (e) {
    terminal.error(String(e))
    return { ok: false, error: `AI generation failed: ${e}` }
  }
}
