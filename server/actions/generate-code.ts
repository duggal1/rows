"use server"

import { z } from "zod"
import { GeminiClient } from "@/server/actions/provider/gemini/gemini-client"

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

const FILE_MARKER = /^--- FILE: (.+) ---$/m

function parseFileMarkers(text: string): GeneratedFile[] {
  const files: GeneratedFile[] = []
  const parts = text.split(FILE_MARKER)

  for (let i = 1; i < parts.length - 1; i += 2) {
    const path = parts[i].trim()
    const rawContent = parts[i + 1]?.trim() ?? ""
    files.push({ path, content: rawContent })
  }

  return files
}

function buildSystemPrompt(): string {
  return `You are given a massive HTML dump with CSS of a website that we just cloned.

## CRITICAL RULES — You must follow these strictly:

1. You are absolutely FORBIDDEN to reinvent your own wheel. Do not redesign anything.
2. You are absolutely FORBIDDEN to reinvent any of the design.
3. You are absolutely FORBIDDEN to do less and absolutely FORBIDDEN to do more.
4. You are FORBIDDEN to try to make the design cleaner or improve it in any way. The HTML/CSS dump IS the source of truth for design.

## Your goal:

Read the full HTML dump along with the CSS. Convert it to clean, production-ready Next.js + TypeScript + Tailwind CSS code. Use motion/react (from "motion/react" package, NOT "framer-motion") for animations only if the original site uses them.

The "motion/react" package is the rebranded and restructured version of framer-motion under motion.dev. Import from "motion/react" not "framer-motion".

## Requirements:

- Every file must be fully type-safe TypeScript
- Zero comments in the code — no comments at all
- Extremely clean, readable code
- Use Tailwind CSS for all styling — no CSS modules or inline styles unless absolutely necessary
- The source of truth for design UI/UX is the HTML/CSS dump. Do not invent your own design.
- If a section's code is missing from the dump (e.g. hero, features, footer), fill in with your own implementation while maintaining extreme visual consistency with the parts you can see.

## Output format:

Output each file with a marker like this — no JSON, no wrappers, just the markers:

--- FILE: app/page.tsx
[code here]
--- FILE: components/hero.tsx
[code here]
--- FILE: components/features.tsx
[code here]

Split the output into individual component files:
- app/page.tsx — main page composing all components
- components/hero.tsx — hero section
- components/features.tsx — features section  
- components/pricing.tsx — pricing section (if present)
- components/footer.tsx — footer section
- components/navbar.tsx — navigation bar
- lib/utils.ts — any utility functions



Use the correct file extensions (.tsx for React components, .ts for non-component files).`
}

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

  const prompt = `<HTML_DUMP>
${html.slice(0, 100_000)}
</HTML_DUMP>

<CSS>
${css.slice(0, 50_000)}
</CSS>

Convert this to clean Next.js + TypeScript + Tailwind CSS code. Output each file with the --- FILE: path --- marker format.`

  const client = new GeminiClient({ apiKey })

  try {
    const result = await client.createInteraction({
      systemInstruction: buildSystemPrompt(),
      input: prompt,
      thinkingLevel: "medium",
      temperature: 0.1,
      maxOutputTokens: 16_384,
    })

    const files = parseFileMarkers(result.text)

    if (files.length === 0) {
      return {
        ok: false,
        error: "AI returned no files. Raw response was empty or unparseable.",
      }
    }

    return { ok: true, data: { files, raw: result.text } }
  } catch (e) {
    return { ok: false, error: `AI generation failed: ${e}` }
  }
}
