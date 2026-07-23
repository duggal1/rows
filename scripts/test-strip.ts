import * as cheerio from "cheerio"
import { stripNoise } from "@/lib/html/strip-noise"

const url = process.argv[2]
if (!url) {
  console.error("Usage: bun scripts/test-strip.ts <url>")
  process.exit(1)
}

console.log(`\nFetching ${url}...\n`)

const res = await fetch(url, {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  signal: AbortSignal.timeout(15_000),
})

if (!res.ok) {
  console.error(`Failed: ${res.status}`)
  process.exit(1)
}

const raw = await res.text()
const stripped = stripNoise(raw)

const rawKb = (raw.length / 1024).toFixed(1)
const strippedKb = (stripped.length / 1024).toFixed(1)

console.log("━━━ STATS ━━━")
console.log(`  Raw HTML:      ${rawKb}KB (${raw.length} chars)`)
console.log(`  Stripped HTML: ${strippedKb}KB (${stripped.length} chars)`)
console.log(`  Removed:       ${((raw.length - stripped.length) / 1024).toFixed(1)}KB of noise`)

const scriptCount = (raw.match(/<script/g) || []).length
const strippedScriptCount = (stripped.match(/<script/g) || []).length
const svgCount = (raw.match(/<svg/g) || []).length
const strippedSvgCount = (stripped.match(/<svg/g) || []).length

console.log(`  Script tags:   ${scriptCount} → ${strippedScriptCount}`)
console.log(`  SVG tags:      ${svgCount} → ${strippedSvgCount}`)

const $ = cheerio.load(stripped)
const remainingScripts = $("script").length
const remainingSvgs = $("svg").length
const remainingNoscripts = $("noscript").length
const remainingJsonld = $('script[type="application/ld+json"]').length

console.log(`\n━━━ VERIFICATION ━━━`)
console.log(`  Scripts remaining:     ${remainingScripts} ${remainingScripts === 0 ? "✅" : "❌"}`)
console.log(`  SVGs remaining:        ${remainingSvgs} ${remainingSvgs === 0 ? "✅" : "❌"}`)
console.log(`  Noscript remaining:    ${remainingNoscripts} ${remainingNoscripts === 0 ? "✅" : "❌"}`)
console.log(`  JSON-LD remaining:     ${remainingJsonld} ${remainingJsonld === 0 ? "✅" : "❌"}`)

console.log(`\n━━━ FIRST 700 LINES OF STRIPPED HTML ━━━\n`)
const lines = stripped.split("\n").slice(0, 700)
console.log(lines.join("\n"))
console.log(`\n... (${stripped.split("\n").length - 700} more lines omitted)`)

const hasJs = stripped.includes("<script")
const hasSvg = stripped.includes("<svg")
const hasJsonld = stripped.includes("application/ld+json")

console.log(`\n━━━ CLEAN VERDICT ━━━`)
if (!hasJs && !hasSvg && !hasJsonld) {
  console.log("  ✅ Clean HTML/CSS only — no JS, no SVG, no JSON-LD")
} else {
  if (hasJs) console.log("  ❌ JavaScript still present")
  if (hasSvg) console.log("  ❌ SVG still present")
  if (hasJsonld) console.log("  ❌ JSON-LD still present")
}
