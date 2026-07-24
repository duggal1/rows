"use server"

import { Sandbox } from "e2b"
import { terminal } from "@/server/terminal/logger"

const APP_DIR = "/home/user/app"
const TEMPLATE = "nextjs-bun-base"
const SANDBOX_TIMEOUT_MS = 10 * 60 * 1000

const FORBIDDEN_FILES = new Set([
  "globals.css", "layout.tsx", "next.config.ts", "next.config.mjs", "tailwind.config.ts",
  "app/globals.css", "app/layout.tsx",
  "package.json", "tsconfig.json",
])

function normalizeFilePath(raw: string): string | null {
  let p = raw.replace(/\\/g, "/")
  p = p.replace(/^project\//, "")
  p = p.replace(/^src\//, "")
  p = p.replace(/^\/+/, "")
  if (FORBIDDEN_FILES.has(p)) return null
  if (p === "page.tsx") return "app/page.tsx"
  return p
}

export interface E2BSandboxInfo {
  sandboxId: string
}

export interface BuildResult {
  success: boolean
  output: string
}

export async function createSandbox(): Promise<E2BSandboxInfo> {
  const t = terminal.phase("sandbox:create")
  const sandbox = await Sandbox.create(TEMPLATE)
  await sandbox.setTimeout(SANDBOX_TIMEOUT_MS)
  t.end()
  return { sandboxId: sandbox.sandboxId }
}

export async function writeFiles(
  sandboxId: string,
  files: { path: string; content: string }[],
): Promise<void> {
  const t = terminal.phase("sandbox:write")
  const sandbox = await Sandbox.connect(sandboxId)
  const normalized = files
    .map((f) => {
      const p = normalizeFilePath(f.path)
      return p ? { path: `${APP_DIR}/${p}`, data: f.content } : null
    })
    .filter((f): f is { path: string; data: string } => f !== null)
  if (normalized.length === 0) { t.end(); return }
  await sandbox.files.write(normalized)
  terminal.done(`Wrote ${normalized.length} files to sandbox`)
  t.end()
}

export async function startDevServer(sandboxId: string): Promise<void> {
  terminal.info("Starting Next.js dev server...")
  const sandbox = await Sandbox.connect(sandboxId)
  await sandbox.commands.run("bun run dev 2>&1", {
    cwd: APP_DIR,
    background: true,
  })
}

export async function waitForDevServer(sandboxId: string): Promise<void> {
  const t = terminal.phase("dev:ready")
  const sandbox = await Sandbox.connect(sandboxId)
  const start = Date.now()
  while (Date.now() - start < 30_000) {
    const result = await sandbox.commands.run(
      "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null || echo '000'",
      { timeoutMs: 5_000 },
    )
    if (result.stdout.trim() === "200") {
      terminal.done("Dev server ready")
      t.end()
      return
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  t.end()
  terminal.fail("Dev server did not become ready within 30s")
}

export async function getPreviewUrl(sandboxId: string): Promise<string> {
  const t = terminal.phase("sandbox:preview")
  const sandbox = await Sandbox.connect(sandboxId)
  const url = await sandbox.getHost(3000)
  terminal.done(`Preview URL: ${url}`)
  t.end()
  return url
}

export async function destroySandbox(sandboxId: string): Promise<void> {
  terminal.info(`Destroying sandbox ${sandboxId.slice(0, 8)}`)
  await Sandbox.kill(sandboxId)
}

export async function isSandboxRunning(sandboxId: string): Promise<boolean> {
  try {
    const sandbox = await Sandbox.connect(sandboxId)
    return await sandbox.isRunning()
  } catch {
    return false
  }
}

const TEXT_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".css", ".md", ".env", ".txt", ".yaml", ".yml", ".toml"])

export async function readTemplateFiles(sandboxId: string): Promise<{ path: string; content: string }[]> {
  const sandbox = await Sandbox.connect(sandboxId)
  const result = await sandbox.commands.run(
    `find ${APP_DIR} -maxdepth 4 -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.git/*' -type f | sort`,
    { timeoutMs: 10_000 },
  )
  const paths = result.stdout.split("\n").filter(Boolean).map((p: string) => p.replace(`${APP_DIR}/`, ""))
  const results: { path: string; content: string }[] = []
  for (const rel of paths) {
    const ext = rel.slice(rel.lastIndexOf("."))
    if (!TEXT_EXTS.has(ext)) continue
    try {
      const content = await sandbox.files.read(`${APP_DIR}/${rel}`)
      results.push({ path: rel, content })
    } catch {
      // skip unreadable files
    }
  }
  terminal.done(`Read ${results.length} files from sandbox`)
  return results
}
