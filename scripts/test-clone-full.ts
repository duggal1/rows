import * as cheerio from "cheerio"
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

const url = process.argv[2]
if (!url) {
  console.error("Usage: bun scripts/test-clone-full.ts <url> [--scrapingbee]")
  process.exit(1)
}

const useScrapingBee = process.argv.includes("--scrapingbee")

// ━━━ helpers ━━━
function makeAbsolute(href: string, base: string): string {
  try { return new URL(href, base).toString() } catch { return href }
}

async function fetchWithTimeout(url: string, timeout = 10_000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" },
      signal: AbortSignal.timeout(timeout),
    })
    if (!res.ok) return null
    return await res.text()
  } catch { return null }
}

async function fetchRenderedHtml(targetUrl: string): Promise<string | null> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY
  if (!apiKey) return null
  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      url: targetUrl,
      render_js: "true",
      wait: "3000",
    })
    const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`, {
      signal: AbortSignal.timeout(25_000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch { return null }
}

function looksLikeEmptyShell($: cheerio.CheerioAPI): boolean {
  const bodyText = $("body").clone().find("script,style,noscript").remove().end().text().trim()
  return bodyText.length < 200
}

// ━━━ Step 1: Fetch HTML ━━━
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`📡 Fetching: ${url}`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

let rawHtml: string
let source: string

const firstRes = await fetchWithTimeout(url)
if (!firstRes) {
  console.error("❌ Failed to fetch URL")
  process.exit(1)
}

let $ = cheerio.load(firstRes)
source = "raw"

if (looksLikeEmptyShell($)) {
  console.log("🟡 SPA shell detected — body text < 200 chars")
  if (useScrapingBee) {
    console.log("🔵 Requesting JS-rendered snapshot via ScrapingBee...")
    const rendered = await fetchRenderedHtml(url)
    if (rendered) {
      $ = cheerio.load(rendered)
      rawHtml = rendered
      source = "scrapingbee"
      console.log("✅ ScrapingBee snapshot captured")
    } else {
      console.log("⚠️  ScrapingBee unavailable (no key or failed) — using raw HTML")
      rawHtml = firstRes
    }
  } else {
    console.log("⚠️  --scrapingbee not passed — using raw HTML (add --scrapingbee to try JS rendering)")
    rawHtml = firstRes
  }
} else {
  console.log("✅ Body has content — no SPA shell detected")
  rawHtml = firstRes
}

const title = $("title").first().text().trim() || "Untitled"
const domain = new URL(url).hostname

console.log(`\n📄 Title: ${title}`)
console.log(`🔗 Source: ${source}`)
console.log(`📏 Raw HTML: ${(rawHtml.length / 1024).toFixed(1)}KB`)

// ━━━ Step 2: Fix relative URLs ━━━
$("img").each((_, el) => {
  const src = $(el).attr("src")
  if (src && !src.startsWith("http") && !src.startsWith("//") && !src.startsWith("data:"))
    $(el).attr("src", makeAbsolute(src, url))
  const srcset = $(el).attr("srcset")
  if (srcset) {
    $(el).attr("srcset", srcset.split(",").map((part) => {
      const [u, ...rest] = part.trim().split(/\s+/)
      return (u && !u.startsWith("http") && !u.startsWith("//") && !u.startsWith("data:"))
        ? [makeAbsolute(u, url), ...rest].join(" ")
        : part.trim()
    }).join(", "))
  }
})

$("video source, video, source").each((_, el) => {
  const src = $(el).attr("src")
  if (src && !src.startsWith("http") && !src.startsWith("//") && !src.startsWith("data:"))
    $(el).attr("src", makeAbsolute(src, url))
})

$("picture source").each((_, el) => {
  const srcset = $(el).attr("srcset")
  if (srcset) {
    $(el).attr("srcset", srcset.split(",").map((part) => {
      const [u, ...rest] = part.trim().split(/\s+/)
      return (u && !u.startsWith("http") && !u.startsWith("//") && !u.startsWith("data:"))
        ? [makeAbsolute(u, url), ...rest].join(" ")
        : part.trim()
    }).join(", "))
  }
})

// ━━━ Step 3: Extract CSS ━━━
console.log(`\n━━━ CSS Extraction ━━━`)

const inlineCss = $("style").map((_, el) => $(el).html() ?? "").get().join("\n")
console.log(`  Inline <style> tags: ${$("style").length}`)

const stylesheetLinks = $("link[rel='stylesheet']").toArray()
console.log(`  External stylesheets: ${stylesheetLinks.length}`)

let cssTexts: string[] = [inlineCss]
let cssFetched = 0
let cssFailed = 0

for (const link of stylesheetLinks) {
  const href = $(link).attr("href")
  if (!href) { cssFailed++; continue }
  try {
    const abs = new URL(href, url).toString()
    const cssRes = await fetchWithTimeout(abs, 5_000)
    if (cssRes) {
      const resolved = cssRes.replace(
        /url\(['"]?(?!https?:\/\/|\/\/|data:)([^'")\s]+)['"]?\)/g,
        (_m, urlPath: string) => `url(${makeAbsolute(urlPath, abs)})`
      )
      cssTexts.push(resolved)
      cssFetched++
    } else {
      cssFailed++
    }
  } catch { cssFailed++ }
}

const css = cssTexts.join("\n\n")
console.log(`  Fetched: ${cssFetched}, Failed: ${cssFailed}`)
console.log(`  Total CSS: ${(css.length / 1024).toFixed(1)}KB`)

// ━━━ Step 4: Extract JS (stats only) ━━━
const scriptTags = $("script").toArray()
let externalScripts = 0
let inlinedScripts = 0
for (const script of scriptTags) {
  const $s = $(script)
  if ($s.attr("src")) externalScripts++
  else inlinedScripts++
}
console.log(`\n━━━ JS Stats ━━━`)
console.log(`  External scripts: ${externalScripts}`)
console.log(`  Inline scripts: ${inlinedScripts}`)

// ━━━ Step 5: Assets ━━━
console.log(`\n━━━ Assets ━━━`)
const imgs = $("img").toArray().filter((el) => $(el).attr("src") && !$(el).attr("src")?.startsWith("data:")).length
const svgs = $("svg").length
const bgImages: string[] = []
css.replace(/background(?:-image)?:\s*url\(['"]?([^'")\s]+)['"]?\)/g, (_m, u) => {
  if (!u.startsWith("data:") && !bgImages.includes(u)) bgImages.push(u)
  return ""
})
console.log(`  <img> tags (non-data): ${imgs}`)
console.log(`  <svg> tags: ${svgs}`)
console.log(`  CSS background-images: ${bgImages.length}`)

// ━━━ Step 6: Build combined HTML ━━━
const bodyHtml = $("body").html() || ""
const lang = $("html").attr("lang") || "en"
const charset = $("meta[charset]").attr("charset") || "UTF-8"

const combined = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <base href="${url}">
  <meta charset="${charset}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Full Clone Test</title>
  <style>${css}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`

const outputPath = resolve(`output-${domain}.html`)
writeFileSync(outputPath, combined, "utf-8")

// ━━━ Stats ━━━
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`📊 FIDELITY REPORT — ${domain}`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`  Source:           ${source}`)
console.log(`  Total HTML:       ${(combined.length / 1024).toFixed(1)}KB`)
console.log(`  CSS inlined:      ${(css.length / 1024).toFixed(1)}KB`)
console.log(`  <style> tags:     ${$("style").length}`)
console.log(`  Stylesheets:      ${stylesheetLinks.length}`)
console.log(`  <img> tags:       ${imgs}`)
console.log(`  <svg> tags:       ${svgs}`)
console.log(`  CSS bg images:    ${bgImages.length}`)
console.log(`  External scripts: ${externalScripts}`)
console.log(`  Inline scripts:   ${inlinedScripts}`)

const hasBase = combined.includes('<base href=')
const hasViewport = combined.includes('name="viewport"')
const hasCharset = combined.includes('charset=')
console.log(`  <base> tag:       ${hasBase ? "✅" : "❌"}`)
console.log(`  Viewport meta:    ${hasViewport ? "✅" : "❌"}`)
console.log(`  Charset meta:     ${hasCharset ? "✅" : "❌"}`)
console.log(`\n  💾 Saved to: ${outputPath}`)
console.log(`  📂 Open in browser to verify fidelity.\n`)
