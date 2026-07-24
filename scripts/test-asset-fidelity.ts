import * as cheerio from "cheerio"
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

const url = process.argv[2]
if (!url) {
  console.error("Usage: npx tsx scripts/test-asset-fidelity.ts <url>")
  process.exit(1)
}

function makeAbsolute(href: string, base: string): string {
  try { return new URL(href, base).toString() } catch { return href }
}

// ━━━ Fetch via ScrapingBee ━━━
async function fetchViaScrapingBee(targetUrl: string): Promise<string | null> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY
  if (!apiKey) { console.log("  SCRAPINGBEE_API_KEY not set"); return null }
  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      url: targetUrl,
      render_js: "true",
      wait: "1500",
    })
    const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`, {
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.log(`  ScrapingBee status ${res.status}: ${body.slice(0, 100)}`)
      return null
    }
    return await res.text()
  } catch (e) { console.log(`  ScrapingBee error: ${e}`); return null }
}

async function fetchRaw(targetUrl: string): Promise<string | null> {
  try {
    const res = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch { return null }
}

// ━━━ Apply the same sanitization as scrapingbee-clone.ts ━━━
async function sanitize(html: string, targetUrl: string): Promise<string> {
  // 1. Strip post-</html>
  const htmlEnd = html.indexOf("</html>")
  let clean = htmlEnd !== -1 ? html.slice(0, htmlEnd + "</html>".length) : html

  // 2. Strip scripts
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, "")
  clean = clean.replace(/<script[^>]*\/>/gi, "")

  // 3. Strip event handlers
  clean = clean.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "")
  clean = clean.replace(/\s+on\w+\s*=\s*\S+/gi, "")

  // 4. Strip noscript
  clean = clean.replace(/<noscript[\s\S]*?<\/noscript>/gi, "")

  // 5. Strip meta refresh
  clean = clean.replace(/<meta[^>]+http-equiv\s*=\s*["']refresh["'][^>]*\/?>/gi, "")

  // 6. Strip canvas
  clean = clean.replace(/<canvas[\s\S]*?<\/canvas>/gi, "")
  clean = clean.replace(/<canvas[^>]*\/?>/gi, "")

  // 7. Strip iframe/object/embed
  clean = clean.replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
  clean = clean.replace(/<object[\s\S]*?<\/object>/gi, "")
  clean = clean.replace(/<embed[^>]*\/?>/gi, "")

  // 8. Make img src absolute
  clean = clean.replace(
    /(<img[^>]+src\s*=\s*["'])(\/[^"']+)(["'])/gi,
    (_m: string, pre: string, path: string, post: string) => `${pre}${makeAbsolute(path, targetUrl)}${post}`,
  )

  // 9. Make srcset URLs absolute
  clean = clean.replace(
    /(<img[^>]+srcset\s*=\s*["'])(\/[^"']+)(["'])/gi,
    (_m: string, pre: string, path: string, post: string) => `${pre}${makeAbsolute(path, targetUrl)}${post}`,
  )

  // 10. Extract & consolidate CSS (from pre-sanitized html, so we get all <style> blocks)
  const inlineStyles: string[] = []
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let styleMatch
  while ((styleMatch = styleRe.exec(clean)) !== null) {
    inlineStyles.push(styleMatch[1])
  }

  // Fetch external stylesheets
  const stylesheetUrls: string[] = []
  const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi
  let linkMatch
  while ((linkMatch = linkRe.exec(clean)) !== null) {
    try {
      stylesheetUrls.push(new URL(linkMatch[1], targetUrl).toString())
    } catch { /* skip */ }
  }

  const cssResults = await Promise.all(
    stylesheetUrls.map(async (sheetUrl) => {
      try {
        const res = await fetch(sheetUrl, { signal: AbortSignal.timeout(3_000) })
        if (res.ok) {
          let cssText = await res.text()
          cssText = cssText.replace(
            /url\(['"]?(?!https?:\/\/|\/\/|data:)([^'")\s]+)['"]?\)/g,
            (_m: string, urlPath: string) => `url(${makeAbsolute(urlPath, sheetUrl)})`,
          )
          return cssText
        }
        return null
      } catch { return null }
    }),
  )

  const fetchedCss = cssResults.filter(Boolean) as string[]
  const cssTexts = [inlineStyles.join("\n"), ...fetchedCss]
  const css = cssTexts.join("\n\n")

  // 11. Remove existing <style> and <link rel="stylesheet">, inject our own
  clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  clean = clean.replace(/<link[^>]+rel=["']stylesheet["'][^>]*\/?>/gi, "")
  clean = clean.replace(/<base[^>]*\/?>/gi, "")
  clean = clean.replace("<head>",
    `<head>\n  <base href="${targetUrl}">\n  <style>${css}</style>`)

  return clean
}

// ━━━ Main ━━━
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`🧪 ASSET FIDELITY TEST`)
console.log(`📡 Fetching: ${url}`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

const domain = new URL(url).hostname
let source = "scrapingbee"
let rawHtml = await fetchViaScrapingBee(url)

if (!rawHtml) {
  console.log("⚠️  ScrapingBee unavailable — trying raw fetch")
  rawHtml = await fetchRaw(url)
  source = "raw"
}

if (!rawHtml) {
  console.error("❌ Failed to fetch URL")
  process.exit(1)
}

console.log(`✅ ${source} returned ${(rawHtml.length / 1024).toFixed(1)}KB of HTML\n`)

const sanitized = await sanitize(rawHtml, url)
const $ = cheerio.load(sanitized)

// ━━━ SVG CHECK ━━━
const inlineSvgs = $("svg").length
const svgImgTags = $('img[src$=".svg"]').length

console.log(`━━━ SVG FIDELITY ━━━`)
console.log(`  Inline <svg> tags:   ${inlineSvgs}`)
if (inlineSvgs > 0) {
  // Verify SVGs have actual content
  let emptySvgs = 0
  let totalSvgContent = 0
  $("svg").each((_, el) => {
    const svgHtml = $.html(el) ?? ""
    totalSvgContent += svgHtml.length
    if (svgHtml.length < 50) emptySvgs++
  })
  console.log(`  SVG content total:   ${(totalSvgContent / 1024).toFixed(1)}KB`)
  if (emptySvgs > 0) console.log(`  ⚠️  Empty/minimal SVGs: ${emptySvgs}`)
  else console.log(`  ✅ All SVGs have content`)
}
console.log(`  <img> pointing to .svg: ${svgImgTags}`)
if (svgImgTags > 0) {
  console.log(`  ⚠️  External SVG references (via <img>): ${svgImgTags}`)
  console.log(`       These are URLs not inline SVGs — AI must use the absolute URL.`)
  $('img[src$=".svg"]').each((_, el) => {
    const src = $(el).attr("src")
    if (src) console.log(`       ${src}`)
  })
}

// ━━━ IMAGE CHECK ━━━
const imgTags = $("img").toArray().filter((el) => {
  const src = $(el).attr("src") ?? ""
  return !src.startsWith("data:")
}).length
const dataUriImgs = $("img").toArray().filter((el) => {
  const src = $(el).attr("src") ?? ""
  return src.startsWith("data:")
}).length
const absoluteImgs = $("img").toArray().filter((el) => {
  const src = $(el).attr("src") ?? ""
  return src.startsWith("http") || src.startsWith("//")
}).length
const relativeImgs = $("img").toArray().filter((el) => {
  const src = $(el).attr("src") ?? ""
  return !src.startsWith("http") && !src.startsWith("//") && !src.startsWith("data:") && src.length > 0
}).length

console.log(`\n━━━ IMAGE FIDELITY ━━━`)
console.log(`  <img> tags (non-data):  ${imgTags}`)
console.log(`  data: URI images:       ${dataUriImgs}`)
console.log(`  Absolute URLs:          ${absoluteImgs}`)
console.log(`  Relative URLs:          ${relativeImgs}`)
if (relativeImgs === 0) console.log(`  ✅ All image URLs are absolute`)
else console.log(`  ⚠️  ${relativeImgs} relative image URLs remain`)

// ━━━ CSS CHECK ━━━
const styleBlocks = $("style").length
const stylesheetLinks = $("link[rel='stylesheet']").length
const styleContent = $("style").map((_, el) => $(el).html() ?? "").get().join("")
const cssSizeKb = (styleContent.length / 1024).toFixed(1)

console.log(`\n━━━ CSS FIDELITY ━━━`)
console.log(`  <style> blocks:         ${styleBlocks}`)
console.log(`  External stylesheets:   ${stylesheetLinks}`)
console.log(`  Total CSS size:         ${cssSizeKb}KB`)
if (stylesheetLinks === 0) console.log(`  ✅ All CSS consolidated into <style>`)
else console.log(`  ⚠️  ${stylesheetLinks} external stylesheets not inlined`)
if (styleBlocks === 1) console.log(`  ✅ Single <style> block`)
else if (styleBlocks > 1) console.log(`  ℹ️  ${styleBlocks} <style> blocks (may merge)`)
if (styleContent.includes("background-image") || styleContent.includes("background:")) {
  const bgImgCount = (styleContent.match(/url\(["']?[^"')]+["']?\)/g) || []).length
  console.log(`  CSS background images:  ${bgImgCount}`)
}

// ━━━ NOISE CHECK ━━━
const scripts = $("script").length
const canvases = $("canvas").length
const iframes = $("iframe").length
const objects = $("object").length
const embeds = $("embed").length
const noscripts = $("noscript").length

console.log(`\n━━━ NOISE CHECK ━━━`)
console.log(`  <script> tags:  ${scripts}`)
console.log(`  <canvas> tags:  ${canvases}`)
console.log(`  <iframe> tags:  ${iframes}`)
console.log(`  <object> tags:  ${objects}`)
console.log(`  <embed> tags:   ${embeds}`)
console.log(`  <noscript> tags: ${noscripts}`)
if (scripts + canvases + iframes + objects + embeds + noscripts === 0) {
  console.log(`  ✅ All noise stripped`)
}

// ━━━ BASE TAG CHECK ━━━
const baseTag = $("base").attr("href")
console.log(`\n━━━ META CHECK ━━━`)
console.log(`  <base href>:    ${baseTag ? `✅ ${baseTag}` : "❌ MISSING"}`)
const title = $("title").text().trim() || "Untitled"
console.log(`  <title>:        ${title}`)

// ━━━ SUMMARY ━━━
let passed = 0
let total = 0

const checks = [
  { name: "SVGs preserved", pass: inlineSvgs > 0 },
  { name: "Image URLs absolute", pass: relativeImgs === 0 },
  { name: "CSS consolidated", pass: stylesheetLinks === 0 },
  { name: "Scripts stripped", pass: scripts === 0 },
  { name: "Canvas stripped", pass: canvases === 0 },
  { name: "Iframes stripped", pass: iframes === 0 },
  { name: "Base tag present", pass: !!baseTag },
  { name: "Has content", pass: sanitized.length > 1000 },
]

for (const check of checks) {
  total++
  if (check.pass) passed++
}

const maxWidth = Math.max(...checks.map(c => c.name.length))

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`📊 FIDELITY REPORT — ${domain}`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`  Source:         ${source}`)
for (const check of checks) {
  const icon = check.pass ? "✅" : "❌"
  console.log(`  ${icon} ${check.name.padEnd(maxWidth)} ${check.pass ? "" : "FAIL"}`)
}
console.log(`\n  Score: ${passed}/${total} (${Math.round(passed / total * 100)}%)`)
console.log(`  Total HTML:     ${(sanitized.length / 1024).toFixed(1)}KB`)

// Save to file for manual inspection
const outputPath = resolve(`asset-test-${domain}.html`)
writeFileSync(outputPath, sanitized, "utf-8")
console.log(`\n  💾 Saved to: ${outputPath}`)
console.log(`  📂 Open in browser to visually verify.\n`)
