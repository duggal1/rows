const SEP = "─".repeat(60)

export const terminal = {
  init(model: string, thinkingLevel: string) {
    console.log(`\n${SEP}`)
    console.log(`  Initializing ${model} at ${thinkingLevel} thinking`)
  },

  context(type: "html" | "css", size: number) {
    const label = type === "html" ? "HTML" : "CSS"
    const kb = (size / 1024).toFixed(1)
    console.log(`  🟩 Giving context of ${label} extracted from the website (${kb}KB)`)
  },

  success(durationMs: number) {
    const s = (durationMs / 1000).toFixed(2)
    console.log(`  ✅ Gemini responded in ${s}s`)
  },

  error(err: string) {
    console.log(`  ❌ Gemini error — ${err}`)
  },

  files(count: number) {
    console.log(`  📄 Parsed ${count} code file${count === 1 ? "" : "s"}`)
    console.log(`${SEP}\n`)
  },
}
