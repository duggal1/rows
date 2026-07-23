import { randomBytes } from "node:crypto"

export function makeBoundaryToken(): string {
  return randomBytes(6).toString("hex")
}

export function fileOpenTag(token: string, path: string): string {
  return `⟦FILE:${token} path="${path}"⟧`
}

export function fileCloseTag(token: string): string {
  return `⟦ENDFILE:${token}⟧`
}
