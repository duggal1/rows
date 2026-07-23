import * as cheerio from "cheerio"

export function stripNoise(raw: string): string {
  const $ = cheerio.load(raw)
  $("script").remove()
  $("svg").remove()
  $("noscript").remove()
  $('link[rel="preload"]').remove()
  $('link[rel="modulepreload"]').remove()
  $('link[rel="dns-prefetch"]').remove()
  $('link[rel="preconnect"]').remove()
  $('link[rel="prefetch"]').remove()
  $("meta[name='generator']").remove()
  $("meta[name='theme-color']").remove()
  return $.html()
}
