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
const $raw = cheerio.load(raw)

// ━━━ Inspect every SVG before stripping ━━━
console.log("━━━ ALL SVGs BEFORE STRIPPING ━━━\n")

const svgs = $raw("svg")
let idx = 0
svgs.each((_, el) => {
  const inner = $raw(el).html() ?? ""
  const charLen = inner.length
  const preview = inner.slice(0, 100).replace(/\n/g, " ").trim()
  const willRemove = charLen > 1000
  const tag = willRemove ? "❌ REMOVE (large)" : "✅ KEEP (small)"
  console.log(`  #${idx}  ${charLen.toString().padStart(5)} chars  ${tag}`)
  if (charLen < 300) {
    console.log(`       Content: ${preview}`)
  } else {
    console.log(`       Preview: ${preview.slice(0, 100)}...`)
  }
  console.log()
  idx++
})

console.log(`Total SVGs found: ${svgs.length}`)
console.log(`Small (≤1000 chars): ${svgs.length - [...svgs].filter((_, i) => ($raw(svgs[i]).html()?.length ?? 0) > 1000).length}`)
console.log()

// ━━━ Now run stripNoise ━━━
const stripped = stripNoise(raw)

const rawKb = (raw.length / 1024).toFixed(1)
const strippedKb = (stripped.length / 1024).toFixed(1)

console.log("━━━ STATS ━━━")
console.log(`  Raw HTML:           ${rawKb}KB (${raw.length} chars)`)
console.log(`  Stripped HTML:      ${strippedKb}KB (${stripped.length} chars)`)
console.log(`  Removed:            ${((raw.length - stripped.length) / 1024).toFixed(1)}KB of noise`)

const scriptCount = (raw.match(/<script/g) || []).length
const strippedScriptCount = (stripped.match(/<script/g) || []).length
const svgCount = (raw.match(/<svg/g) || []).length
const strippedSvgCount = (stripped.match(/<svg/g) || []).length

console.log(`  Script tags:        ${scriptCount} → ${strippedScriptCount}`)
console.log(`  SVG tags:           ${svgCount} → ${strippedSvgCount}`)

// ━━━ Inspect which SVGs survived ━━━
const $clean = cheerio.load(stripped)
const surviving = $clean("svg")
console.log(`\n━━━ SURVIVING SVGs (${surviving.length}) ━━━\n`)
surviving.each((i, el) => {
  const inner = $clean(el).html() ?? ""
  const preview = inner.slice(0, 120).replace(/\n/g, " ").trim()
  console.log(`  #${i}  (${inner.length} chars)  ${preview}...`)
})

console.log(`\n━━━ VERIFICATION ━━━`)
const remainingScripts = $clean("script").length
const remainingSvgs = $clean("svg").length
const remainingNoscripts = $clean("noscript").length
const remainingJsonld = $clean('script[type="application/ld+json"]').length

console.log(`  Scripts remaining:     ${remainingScripts} ${remainingScripts === 0 ? "✅" : "❌"}`)
console.log(`  SVGs remaining:        ${remainingSvgs}`)
console.log(`  Noscript remaining:    ${remainingNoscripts} ${remainingNoscripts === 0 ? "✅" : "❌"}`)
console.log(`  JSON-LD remaining:     ${remainingJsonld} ${remainingJsonld === 0 ? "✅" : "❌"}`)
