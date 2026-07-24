"use server"

import * as cheerio from "cheerio"
import { z } from "zod"
import { stripNoise } from "@/lib/html/strip-noise"
import { terminal } from "@/server/terminal/logger"

const urlSchema = z.string().url()

export interface CloneResult {
  html: string
  cleanHtml: string
  designHtml: string
  css: string
  title: string
  sourceUrl: string
  svgs: string[]
  imageUrls: string[]
  jsSnippets: string[]
}

type CloneResponse =
  | { ok: true; data: CloneResult }
  | { ok: false; error: string }

function makeAbsolute(href: string, base: string): string {
  try {
    return new URL(href, base).toString()
  } catch {
    return href
  }
}

function formatHtml(html: string): string {
  return html.replace(/>\s*</g, ">\n<")
}

function indent(text: string, level: number): string {
  const spaces = "  ".repeat(level)
  return text
    .split("\n")
    .map((line) => (line ? spaces + line : line))
    .join("\n")
}

function formatCss(css: string): string {
  let result = css
    .replace(/@charset\s+["'][^"']*["']\s*;/g, "")
    .replace(/\/\*# sourceMappingURL=[^*]*\*\//g, "")
    .trim()
  if (!result) return ""

  if (result.includes("\n")) return result

  result = result
    .replace(/}/g, "}\n")
    .replace(/\s*{\s*/g, " {\n  ")
    .replace(/;\s*/g, ";\n  ")
    .replace(/\n  \n}/g, "\n}")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  const lines = result.split("\n")
  let indent = 0
  return lines
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return ""

      const opens = (trimmed.match(/\{/g) || []).length
      const closes = (trimmed.match(/\}/g) || []).length

      indent = Math.max(0, indent - closes)

      const output = "  ".repeat(indent) + trimmed

      indent += opens

      return output
    })
    .join("\n")
}

function stripHtmlComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "")
}

async function fetchWithScrapingBee(targetUrl: string): Promise<string | null> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY
  if (!apiKey) return null
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
    if (!res.ok) return null
    const text = await res.text()
    if (text.length < 100) return null
    return text
  } catch {
    return null
  }
}

async function fetchWithFallback(targetUrl: string): Promise<string | null> {
  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function stripPostHtml(html: string): string {
  const idx = html.indexOf("</html>")
  return idx !== -1 ? html.slice(0, idx + "</html>".length) : html
}

async function inlineExternalSvgs(html: string): Promise<string> {
  const $ = cheerio.load(html)
  const svgImgs: { el: ReturnType<typeof $>; url: string }[] = []

  $("img[src]").each((_, el) => {
    const src = $(el).attr("src") || ""
    if (/\.svg(\?|#|$)/i.test(src) && (src.startsWith("http") || src.startsWith("//"))) {
      svgImgs.push({ el: $(el), url: src.startsWith("//") ? `https:${src}` : src })
    }
  })

  if (svgImgs.length === 0) return html

  const results = await Promise.allSettled(
    svgImgs.map(async ({ url }) => {
      const res = await fetch(url, { signal: AbortSignal.timeout(5_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const svgText = await res.text()
      const svgMatch = svgText.match(/<svg[\s\S]*?<\/svg>/i)
      if (!svgMatch) throw new Error("No <svg> found in response")
      return { url, svg: svgMatch[0] }
    }),
  )

  const inline = new Map<string, string>()
  for (const result of results) {
    if (result.status === "fulfilled") inline.set(result.value.url, result.value.svg)
  }

  svgImgs.forEach(({ el, url }) => {
    const svg = inline.get(url)
    if (!svg) return
    const alt = el.attr("alt") || ""
    const className = el.attr("class") || ""
    const style = el.attr("style") || ""
    const width = el.attr("width")
    const height = el.attr("height")

    const $svg = $(svg)
    if (alt) $svg.attr("aria-label", alt)
    if (className) $svg.attr("class", className)
    if (style) $svg.attr("style", style)
    if (width && !$svg.attr("width")) $svg.attr("width", width)
    if (height && !$svg.attr("height")) $svg.attr("height", height)

    el.replaceWith($svg)
  })

  return $.html()
}

export async function cloneSite(rawUrl: string): Promise<CloneResponse> {
  const parsed = urlSchema.safeParse(rawUrl)
  if (!parsed.success) return { ok: false, error: "That's not a valid URL." }
  const targetUrl = parsed.data

  // ━━━ Step 1: Fetch HTML — try ScrapingBee first, fall back to raw fetch ━━━
  let renderedHtml: string | null

  terminal.info(`Fetching ${targetUrl}`)
  const fetchTimer = terminal.phase("fetch")

  renderedHtml = await fetchWithScrapingBee(targetUrl)
  if (renderedHtml) {
    terminal.done("ScrapingBee snapshot captured")
  } else {
    terminal.warn("ScrapingBee unavailable — falling back to raw fetch")
    renderedHtml = await fetchWithFallback(targetUrl)
    if (!renderedHtml) {
      fetchTimer.end()
      return { ok: false, error: "Couldn't reach that URL — check it's live and public." }
    }
  }
  fetchTimer.end()

  // Strip anything after </html> (injected beacons, RSC payloads, garbage)
  renderedHtml = stripPostHtml(renderedHtml)

  // --- Pre-sanitize: strip elements that break the backend pipeline ---
  // Strip ALL <script> tags — they cause iframe crashes and waste Gemini tokens
  renderedHtml = renderedHtml.replace(/<script[\s\S]*?<\/script>/gi, "")
  renderedHtml = renderedHtml.replace(/<script[^>]*\/>/gi, "")
  // Strip event handler attributes
  renderedHtml = renderedHtml.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "")
  renderedHtml = renderedHtml.replace(/\s+on\w+\s*=\s*\S+/gi, "")
  // Strip <noscript> — useless when scripts are removed
  renderedHtml = renderedHtml.replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
  // Strip <meta http-equiv="refresh"> — would redirect iframe
  renderedHtml = renderedHtml.replace(/<meta[^>]+http-equiv\s*=\s*["']refresh["'][^>]*\/?>/gi, "")
  // Strip <canvas> — AI cannot replicate canvas graphics
  renderedHtml = renderedHtml.replace(/<canvas[\s\S]*?<\/canvas>/gi, "")
  renderedHtml = renderedHtml.replace(/<canvas[^>]*\/?>/gi, "")
  // Strip <iframe>, <object>, <embed> — nested frames cause issues
  renderedHtml = renderedHtml.replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
  renderedHtml = renderedHtml.replace(/<object[\s\S]*?<\/object>/gi, "")
  renderedHtml = renderedHtml.replace(/<embed[^>]*\/?>/gi, "")

  const $ = cheerio.load(renderedHtml)

  // --- Universal cleanup (applies to both full and clean versions) ---
  $('link[rel="preload"][as="script"]').remove()
  $('link[rel="modulepreload"]').remove()

  const title = $("title").first().text().trim() || "Untitled"
  const lang = $("html").attr("lang") || "en"
  const charset = $("meta[charset]").attr("charset") || "UTF-8"

  // --- Rewrite relative asset URLs to absolute (before CSS/JS processing so
  //     the clean-version snapshot preserves original link/script tags) ---
  $("img").each((_, el) => {
    const src = $(el).attr("src")
    if (
      src &&
      !src.startsWith("http") &&
      !src.startsWith("//") &&
      !src.startsWith("data:")
    ) {
      $(el).attr("src", makeAbsolute(src, targetUrl))
    }
    const srcset = $(el).attr("srcset")
    if (srcset) {
      $(el).attr(
        "srcset",
        srcset
          .split(",")
          .map((part) => {
            const [url, ...rest] = part.trim().split(/\s+/)
            if (
              url &&
              !url.startsWith("http") &&
              !url.startsWith("//") &&
              !url.startsWith("data:")
            ) {
              return [makeAbsolute(url, targetUrl), ...rest].join(" ")
            }
            return part.trim()
          })
          .join(", "),
      )
    }
  })

  $("video source, video, source").each((_, el) => {
    const src = $(el).attr("src")
    if (
      src &&
      !src.startsWith("http") &&
      !src.startsWith("//") &&
      !src.startsWith("data:")
    ) {
      $(el).attr("src", makeAbsolute(src, targetUrl))
    }
  })

  $("picture source").each((_, el) => {
    const srcset = $(el).attr("srcset")
    if (srcset) {
      $(el).attr(
        "srcset",
        srcset
          .split(",")
          .map((part) => {
            const [url, ...rest] = part.trim().split(/\s+/)
            if (
              url &&
              !url.startsWith("http") &&
              !url.startsWith("//") &&
              !url.startsWith("data:")
            ) {
              return [makeAbsolute(url, targetUrl), ...rest].join(" ")
            }
            return part.trim()
          })
          .join(", "),
      )
    }
  })

  // Snapshot the clean state (before CSS/JS processing removes link/script tags)
  const cleanSnapshot = $.html()

  // --- CSS: inline styles + fetch external stylesheets (parallel) ---
  const cssTimer = terminal.phase("css-extract")
  const inlineCss =
    $("style")
      .map((_, el) => $(el).html() ?? "")
      .get()
      .join("\n")

  const stylesheetLinks = $("link[rel='stylesheet']").toArray()
  const cssResults = await Promise.all(
    stylesheetLinks.map(async (link) => {
      const href = $(link).attr("href")
      if (!href) return null
      try {
        const abs = new URL(href, targetUrl).toString()
        const cssRes = await fetch(abs, { signal: AbortSignal.timeout(4_000) })
        if (!cssRes.ok) return null
        let cssText = await cssRes.text()
        cssText = cssText.replace(
          /url\(['"]?(?!https?:\/\/|\/\/|data:)([^'")\s]+)['"]?\)/g,
          (_match, urlPath: string) => {
            const resolved = makeAbsolute(urlPath, abs)
            return `url(${resolved})`
          },
        )
        $(link).remove()
        return cssText
      } catch {
        return null
      }
    }),
  )

  const css = [inlineCss, ...cssResults.filter(Boolean)].join("\n\n")
  cssTimer.end()

  // --- Build the full version (for iframe — everything inlined) ---
  const bodyHtml = $("body").html() || ""

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <base href="${targetUrl}">
  <meta charset="${charset}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`

  // --- Build the clean version (for download) ---
  // Formatted CSS, no inline scripts, no HTML comments, well-formatted
  const $c = cheerio.load(cleanSnapshot)

  $c("link[rel='stylesheet']").remove()
  $c("style").remove()
  $c("script").each((_, el) => {
    const $el = $c(el)
    if (!$el.attr("src")) $el.remove()
  })

  const cleanCss = formatCss(css)

  const cHeadHtml = $c("head").html() || ""
  const cBodyHtml = $c("body").html() || ""

  const cleanHtml = stripHtmlComments(`<!DOCTYPE html>
<html lang="${lang}">
<head>
  <base href="${targetUrl}">
  <meta charset="${charset}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${cleanCss}</style>
${indent(formatHtml(cHeadHtml), 2)}
</head>
<body>
${indent(formatHtml(cBodyHtml), 2)}
</body>
</html>`)

  const designHtml = await inlineExternalSvgs(stripNoise(cleanSnapshot))

  const $assets = cheerio.load(designHtml)
  const svgs: string[] = []
  $assets("svg").each((_, el) => {
    svgs.push($assets(el).toString())
  })
  const imageUrls: string[] = []
  $assets("img[src]").each((_, el) => {
    const src = $assets(el).attr("src")
    if (src && src.startsWith("http")) imageUrls.push(src)
  })
  $assets("[style*='background-image'], [style*='background']").each((_, el) => {
    const style = $assets(el).attr("style") || ""
    const m = style.match(/url\(["']?([^"')]+)["']?\)/g)
    if (m) m.forEach((u) => {
      const url = u.replace(/url\(["']?|["']?\)/g, "")
      if (url.startsWith("http")) imageUrls.push(url)
    })
  })
  const jsSnippets: string[] = []
  $assets("script:not([src])").each((_, el) => {
    const code = $assets(el).html() || ""
    const trimmed = code.trim()
    if (trimmed && trimmed.length < 5_000) jsSnippets.push(trimmed)
  })
  terminal.done(`Extracted ${svgs.length} SVGs, ${imageUrls.length} images, ${jsSnippets.length} JS snippets`)

  return {
    ok: true,
    data: { html, cleanHtml, designHtml, css, title, sourceUrl: targetUrl, svgs, imageUrls, jsSnippets },
  }
}
