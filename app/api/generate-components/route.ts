import { NextRequest } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { buildSystemPrompt, buildUserPrompt } from "@/server/actions/provider/gemini/prompt"
import { makeBoundaryToken } from "@/lib/codegen/protocol"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { html, css } = body
  if (!html) return Response.json({ error: "Missing html" }, { status: 400 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 500 })

  const token = makeBoundaryToken()

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      try {
        const ai = new GoogleGenAI({ apiKey })
        const result = await ai.interactions.create({
          model: "gemini-3.6-flash",
          generation_config: {
            temperature: 0.1,
            thinking_level: "medium",
            max_output_tokens: 16_384,
          },
          system_instruction: buildSystemPrompt(token),
          input: buildUserPrompt(html.slice(0, 100_000), (css ?? "").slice(0, 50_000)),
        } as any)

        const text = (result as any).output_text ?? ""
        send(JSON.stringify({ type: "result", token, text }))

        const fileRegex = new RegExp(
          `⟦FILE:${token} path="(.+?)"⟧([\\s\\S]*?)⟦ENDFILE:${token}⟧`,
          "g",
        )
        let match: RegExpExecArray | null
        while ((match = fileRegex.exec(text)) !== null) {
          send(JSON.stringify({ type: "file", path: match[1], content: match[2] }))
        }

        send(JSON.stringify({ type: "done" }))
      } catch (e) {
        send(JSON.stringify({ type: "error", message: String(e) }))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
