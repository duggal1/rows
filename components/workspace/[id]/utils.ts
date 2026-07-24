import type { WorkspaceData } from "@/components/workspace/types"

export const TIMING = {
  stepInterval: 10000,
  totalSteps: 10,
}

export function extractDomain(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//, "")
    .split(/[/?#]/)[0]
    .toLowerCase()
}

export function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}
