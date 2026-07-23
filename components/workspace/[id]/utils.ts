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

export function loadWorkspace(id: string): WorkspaceData | null {
  try {
    const raw = localStorage.getItem(`workspace-${id}`)
    if (!raw) return null
    return JSON.parse(raw) as WorkspaceData
  } catch {
    return null
  }
}

export function saveWorkspace(id: string, data: WorkspaceData) {
  try {
    localStorage.setItem(`workspace-${id}`, JSON.stringify(data))
  } catch {}
}
