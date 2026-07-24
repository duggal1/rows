import * as cheerio from "cheerio"
import type { Element } from "domhandler"

export function stripNoise(raw: string): string {
  const $ = cheerio.load(raw)
  $("script").remove()
  $("noscript").remove()
  $('link[rel="preload"]').remove()
  $('link[rel="modulepreload"]').remove()
  $('link[rel="dns-prefetch"]').remove()
  $('link[rel="preconnect"]').remove()
  $('link[rel="prefetch"]').remove()
  $("meta[name='generator']").remove()
  $("meta[name='theme-color']").remove()
  $("canvas").remove()
  $("iframe").remove()
  $("object").remove()
  $("embed").remove()
  $("meta[http-equiv='refresh']").remove()
  // Strip event handler attributes
  $("*").each((_, el) => {
    const attrs = (el as Element).attribs
    for (const attr of Object.keys(attrs)) {
      if (attr.startsWith("on")) delete attrs[attr]
    }
  })
  return $.html()
}
