const SEP = "─".repeat(60)

function timestamp(): string {
  const d = new Date()
  return d.toLocaleTimeString("en-US", { hour12: false })
}

function fmtMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms)}ms`
}

type Phase = {
  name: string
  start: number
  end(): number
}

function formatBreakdown(entries: [string, string][]): string {
  return entries.length === 0 ? "" : ` (${entries.map(([k, v]) => `${k}: ${v}`).join(", ")})`
}

const colors = {
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  reset: "\x1b[0m",
  gray: "\x1b[90m",
}

function dim(s: string): string { return `${colors.dim}${s}${colors.reset}` }
function green(s: string): string { return `${colors.green}${s}${colors.reset}` }
function yellow(s: string): string { return `${colors.yellow}${s}${colors.reset}` }
function red(s: string): string { return `${colors.red}${s}${colors.reset}` }
function cyan(s: string): string { return `${colors.cyan}${s}${colors.reset}` }
function magenta(s: string): string { return `${colors.magenta}${s}${colors.reset}` }
function gray(s: string): string { return `${colors.gray}${s}${colors.reset}` }

export const terminal = {
  init(model: string, thinkingLevel: string) {
    console.log(`\n${SEP}`)
    console.log(`  ${dim(timestamp())} ${gray("○")} Initializing ${cyan(model)} (thinking: ${thinkingLevel})`)
  },

  context(type: "html" | "css", size: number) {
    const label = type === "html" ? "HTML" : "CSS"
    const kb = (size / 1024).toFixed(1)
    console.log(`  ${dim(timestamp())} ${gray("·")} ${label} context: ${kb}KB`)
  },

  step(label: string, detail: string) {
    console.log(`  ${dim(timestamp())} ${gray("·")} ${label}${detail ? ` ${dim(detail)}` : ""}`)
  },

  success(durationMs: number) {
    console.log(`  ${dim(timestamp())} ${green("✔")} Gemini responded in ${fmtMs(durationMs)}`)
  },

  error(err: string) {
    console.log(`  ${dim(timestamp())} ${red("✘")} Gemini error — ${err}`)
  },

  files(count: number) {
    console.log(`  ${dim(timestamp())} ${green("✔")} Parsed ${count} file${count === 1 ? "" : "s"}`)
    console.log(`${SEP}\n`)
  },

  info(msg: string) {
    console.log(`  ${dim(timestamp())} ${gray("·")} ${msg}`)
  },

  warn(msg: string) {
    console.log(`  ${dim(timestamp())} ${yellow("⚠")} ${msg}`)
  },

  done(msg: string) {
    console.log(`  ${dim(timestamp())} ${green("✔")} ${msg}`)
  },

  fail(msg: string) {
    console.log(`  ${dim(timestamp())} ${red("✘")} ${msg}`)
  },

  phase(name: string): Phase {
    const start = performance.now()
    return {
      name,
      start,
      end(): number {
        const elapsed = performance.now() - start
        console.log(`  ${dim(timestamp())} ${gray("·")} ${cyan(name)}: ${fmtMs(elapsed)}`)
        return elapsed
      },
    }
  },

  build(step: string, durationMs?: number) {
    if (durationMs !== undefined) {
      console.log(`  ${dim(timestamp())} ${gray("○")} ${step} ${dim(fmtMs(durationMs))}`)
    } else {
      console.log(`  ${dim(timestamp())} ${gray("○")} ${step}`)
    }
  },

  compile(module: string) {
    console.log(`  ${dim(timestamp())} ${gray("○")} Compiling ${cyan(module)} ...`)
  },

  container(event: "create" | "ready" | "writing" | "build" | "done" | "destroy", detail?: string) {
    const icons: Record<string, string> = {
      create: gray("○"),
      ready: green("✔"),
      writing: gray("·"),
      build: gray("○"),
      done: green("✔"),
      destroy: yellow("⚠"),
    }
    const labels: Record<string, string> = {
      create: "Creating E2B sandbox",
      ready: "E2B sandbox ready",
      writing: "Writing files to sandbox",
      build: "Building Next.js in sandbox",
      done: "E2B build complete",
      destroy: "Destroying E2B sandbox",
    }
    const icon = icons[event] || gray("·")
    const label = labels[event] || event
    console.log(`  ${dim(timestamp())} ${icon} ${label}${detail ? ` ${dim(detail)}` : ""}`)
  },

  cli(cmd: string, output?: string) {
    console.log(`  ${dim(timestamp())} ${gray("$")} ${magenta(cmd)}`)
    if (output) {
      const lines = output.split("\n").filter(Boolean)
      for (const line of lines.slice(0, 10)) {
        console.log(`    ${dim(line)}`)
      }
      if (lines.length > 10) console.log(`    ${dim(`... ${lines.length - 10} more lines`)}`)
    }
  },

  gemini(event: "sending" | "streaming" | "done" | "error", detail?: string) {
    const icons: Record<string, string> = {
      sending: gray("→"),
      streaming: gray("·"),
      done: green("✔"),
      error: red("✘"),
    }
    const labels: Record<string, string> = {
      sending: "Sending to Gemini",
      streaming: "Gemini streaming",
      done: "Gemini complete",
      error: "Gemini error",
    }
    const icon = icons[event] || gray("·")
    const label = labels[event] || event
    console.log(`  ${dim(timestamp())} ${icon} ${label}${detail ? ` ${dim(detail)}` : ""}`)
  },

  request(method: string, path: string, status: number, totalMs: number, breakdown?: Record<string, number>) {
    const statusCol = status < 300 ? green : status < 500 ? yellow : red
    const entries: [string, string][] = []
    if (breakdown) {
      for (const [k, v] of Object.entries(breakdown)) {
        entries.push([k, fmtMs(v)])
      }
    }
    const bd = formatBreakdown(entries)
    console.log(`  ${dim(timestamp())} ${method} ${path} ${statusCol(String(status))} in ${fmtMs(totalMs)}${bd}`)
  },
}
