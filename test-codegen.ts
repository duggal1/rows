import { GoogleGenAI } from "@google/genai"
import { buildSystemPrompt, buildUserPrompt } from "@/server/actions/provider/gemini/prompt"
import { makeBoundaryToken } from "@/lib/codegen/protocol"
import { FileStreamParser } from "@/lib/codegen/protocol-parser"
import { validateFile } from "@/lib/codegen/validate"

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Page</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; background: #fff; color: #111; }
    nav { display: flex; gap: 1.5rem; padding: 1rem 2rem; border-bottom: 1px solid #e5e5e5; align-items: center; }
    nav a { text-decoration: none; color: #555; font-size: 0.875rem; }
    nav a:hover { color: #000; }
    .hero { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem 2rem; text-align: center; }
    .hero h1 { font-size: 3rem; font-weight: 700; letter-spacing: -0.03em; margin: 0; }
    .hero p { color: #666; max-width: 32rem; margin-top: 1rem; line-height: 1.6; }
    .hero button { margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #000; color: #fff; border: none; border-radius: 8px; font-size: 0.875rem; cursor: pointer; }
    .hero button:hover { background: #333; }
    footer { border-top: 1px solid #e5e5e5; padding: 2rem; text-align: center; color: #888; font-size: 0.8rem; }
  </style>
</head>
<body>
  <nav>
    <strong>Logo</strong>
    <a href="#">Features</a>
    <a href="#">Pricing</a>
    <a href="#">About</a>
  </nav>
  <section class="hero">
    <h1>Build faster</h1>
    <p>A modern platform for teams who want to move quickly and ship reliably.</p>
    <button>Get started</button>
  </section>
  <footer>
    <p>&copy; 2026 Test Company. All rights reserved.</p>
  </footer>
</body>
</html>`

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not set")
    process.exit(1)
  }

  const ai = new GoogleGenAI({ apiKey })
  const token = makeBoundaryToken()
  const html = SAMPLE_HTML.slice(0, 2000)
  const css = ""

  console.log("─── Test: Boundary marker protocol ───")
  console.log(`Token: ${token}`)
  console.log(`HTML size: ${html.length} chars`)
  console.log()

  const systemInstruction = buildSystemPrompt(token)
  const userPrompt = buildUserPrompt(html, css)

  const startTime = performance.now()

  const response = await ai.interactions.create({
    model: "gemini-3.6-flash",
    system_instruction: systemInstruction,
    input: userPrompt,
    generation_config: {
      thinking_level: "medium" as any,
      temperature: 0.1,
      max_output_tokens: 8_192,
    },
  } as any)

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2)
  const rawText = (response as any).output_text ?? ""

  console.log(`⏱  ${elapsed}s`)
  console.log(`Raw output length: ${rawText.length} chars`)
  console.log()

  // Parse
  const parser = new FileStreamParser(token)
  const events = parser.push(rawText)
  const finalEvents = parser.finalize()
  const allEvents = [...events, ...finalEvents]

  const files = allEvents.filter(
    (e) => e.type === "file_complete" || e.type === "file_incomplete",
  ) as Extract<typeof allEvents[number], { type: "file_complete" | "file_incomplete" }>[]

  const strayText = allEvents.filter((e) => e.type === "stray_text")

  console.log(`📦 Files parsed: ${files.length}`)
  if (strayText.length > 0) {
    console.log(`⚠️  Stray text lines: ${strayText.length}`)
    for (const s of strayText.slice(0, 5)) {
      console.log(`   "${(s as any).text}"`)
    }
  }
  console.log()

  if (files.length === 0) {
    console.log("❌ No files parsed. Raw output:")
    console.log(rawText.slice(0, 1000))
    process.exit(1)
  }

  for (const fe of files) {
    const f = "file" in fe ? fe.file : (fe as any).file
    const kind = fe.type === "file_complete" ? "complete" : "incomplete"
    const validation = await validateFile(f.path, f.content)
    const icon = validation.valid ? "✅" : "❌"
    console.log(
      `${icon} ${f.path} (${kind}, ${f.content.length} chars)${validation.error ? ` — ${validation.error}` : ""}`,
    )
  }

  console.log()
  console.log("─── Test complete ───")
}

main().catch(console.error)
