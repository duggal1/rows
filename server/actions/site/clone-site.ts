"use server"

import * as cheerio from "cheerio"
import { z } from "zod"

const urlSchema = z.string().url()

export interface CloneResult {
  html: string
  cleanHtml: string
  css: string
  title: string
  sourceUrl: string
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

export async function cloneSite(rawUrl: string): Promise<CloneResponse> {
  const parsed = urlSchema.safeParse(rawUrl)
  if (!parsed.success) return { ok: false, error: "That's not a valid URL." }
  const targetUrl = parsed.data

  let res: Response
  try {
    res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    return {
      ok: false,
      error: "Couldn't reach that URL — check it's live and public.",
    }
  }

  if (!res.ok)
    return { ok: false, error: `Site responded with ${res.status}.` }

  const rawHtml = await res.text()
  const $ = cheerio.load(rawHtml)

  // --- Universal cleanup (applies to both full and clean versions) ---
  $("noscript").remove()
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

  // --- JS: inline external scripts (parallel, limited concurrency) ---
  const scriptTags = $("script").toArray()
  const jsFetchTasks: { abs: string; el: any }[] = []

  for (const script of scriptTags) {
    const $script = $(script)
    const src = $script.attr("src")
    const type = $script.attr("type")
    if (type && !["text/javascript", "module", undefined].includes(type)) continue
    if (!src) continue
    if (type === "module") continue
    try {
      const abs = new URL(src, targetUrl).toString()
      jsFetchTasks.push({ abs, el: script })
    } catch {
    }
  }

  const jsResults = await Promise.all(
    jsFetchTasks.map(async ({ abs, el }) => {
      try {
        const jsRes = await fetch(abs, { signal: AbortSignal.timeout(4_000) })
        if (!jsRes.ok) return null
        const jsCode = await jsRes.text()
        return { el, jsCode }
      } catch {
        return null
      }
    }),
  )

  for (const result of jsResults) {
    if (!result) continue
    const { el, jsCode } = result
    $(el).replaceWith(`<script>${jsCode}</script>`)
  }

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
  // No SVGs, formatted CSS, no inline scripts, no HTML comments, well-formatted
  const $c = cheerio.load(cleanSnapshot)

  $c("svg").remove()
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

  return {
    ok: true,
    data: { html, cleanHtml, css, title, sourceUrl: targetUrl },
  }
}
