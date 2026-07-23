import * as esbuild from "esbuild"

export interface ValidationResult {
  valid: boolean
  error: string | null
}

export async function validateFile(
  path: string,
  content: string,
): Promise<ValidationResult> {
  if (!content.trim()) return { valid: false, error: "Empty file" }
  if (path.includes("..") || path.startsWith("/")) {
    return { valid: false, error: "Unsafe path" }
  }

  const isCss = path.endsWith(".css")
  if (isCss) {
    const openBraces = (content.match(/{/g) ?? []).length
    const closeBraces = (content.match(/}/g) ?? []).length
    return openBraces === closeBraces
      ? { valid: true, error: null }
      : { valid: false, error: "Mismatched braces in CSS" }
  }

  const loader = path.endsWith(".tsx") ? "tsx" : "ts"
  try {
    await esbuild.transform(content, { loader, target: "es2022" })
    return { valid: true, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown syntax error"
    return { valid: false, error: message }
  }
}
