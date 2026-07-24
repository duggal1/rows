import type { WorkspaceData } from "@/components/workspace/types"
import type { GeneratedFile } from "@/components/workspace/types"
import { cloneSite } from "@/server/actions/site/clone-site"
import { generateCode } from "@/server/actions/generate-code"
import { createSandbox, writeFiles, startDevServer, waitForDevServer, getPreviewUrl, destroySandbox, readTemplateFiles } from "@/server/actions/sandbox"
import { TIMING } from "./utils"
import { updateWorkspace } from "@/server/actions/workspace"
import { terminal } from "@/server/terminal/logger"

function mergeUniqueFiles(
  template: { path: string; content: string }[],
  genFiles: { path: string; content: string }[],
): typeof genFiles {
  const seen = new Set(genFiles.map((f) => f.path))
  const merged = [...genFiles]
  for (const tf of template) {
    if (!seen.has(tf.path)) {
      merged.push(tf)
      seen.add(tf.path)
    }
  }
  return merged
}

export async function regenerateFromWorkspace(
  id: string,
  designHtml: string,
  css: string,
  promptText: string,
  attachedFiles: { name: string; content: string }[],
  sourceUrl?: string,
  previousSandboxId?: string,
): Promise<{ files: GeneratedFile[]; summary: string; previewUrl?: string; sandboxId?: string }> {
  if (previousSandboxId) {
    terminal.container("destroy", `previous sandbox ${previousSandboxId.slice(0, 8)}`)
    try { await destroySandbox(previousSandboxId) } catch {}
  }

  terminal.container("create")
  const { sandboxId } = await createSandbox()
  terminal.container("ready", sandboxId.slice(0, 8))
  await startDevServer(sandboxId)

  // Poll dev server in background
  let bgPreviewUrl: string | undefined
  waitForDevServer(sandboxId)
    .then(async () => { bgPreviewUrl = await getPreviewUrl(sandboxId) })
    .catch(() => {})

  const [templateFiles, genRes] = await Promise.all([
    readTemplateFiles(sandboxId),
    generateCode({
      url: sourceUrl,
      htmlDump: designHtml,
      cssDump: css,
      prompt: promptText,
      attachedFiles,
    }),
  ])
  if (!genRes.ok) throw new Error(genRes.error)

  const allFiles = mergeUniqueFiles(templateFiles, genRes.data.files)

  try {
    terminal.container("writing")
    await writeFiles(sandboxId, genRes.data.files)
    const previewUrl = bgPreviewUrl || await waitForDevServer(sandboxId).then(() => getPreviewUrl(sandboxId))
    terminal.container("done")

    await updateWorkspace(id, {
      files: allFiles,
      summary: genRes.data.summary,
      status: "done",
      previewUrl,
      sandboxId,
    })

    return { files: allFiles, summary: genRes.data.summary, previewUrl, sandboxId }
  } catch (e) {
    terminal.container("destroy")
    await destroySandbox(sandboxId)
    throw e
  }
}

export async function processUrl(
  id: string,
  url: string,
  prompt: string | undefined,
  files: { name: string; content: string }[] | undefined,
  callbacks: {
    onUpdate: (data: WorkspaceData) => void
    onStep: (step: number) => void
    onError: (error: string) => void
  },
) {
  const workspace: WorkspaceData = {
    url,
    title: "",
    html: "",
    css: "",
    designHtml: "",
    files: [],
    status: "processing",
    createdAt: Date.now(),
    prompt: prompt || "",
  }
  callbacks.onUpdate(workspace)

  const totalTimer = terminal.phase("total")

  try {
    terminal.compile(`/workspace/${id.slice(0, 8)}`)
    terminal.info("Cloning website...")
    const cloneRes = await cloneSite(url)
    if (!cloneRes.ok) throw new Error(cloneRes.error)
    workspace.title = cloneRes.data.title
    workspace.html = cloneRes.data.html
    workspace.css = cloneRes.data.css
    workspace.designHtml = cloneRes.data.designHtml
    callbacks.onUpdate({ ...workspace })
    callbacks.onStep(4)

    terminal.container("create")
    const { sandboxId } = await createSandbox()
    workspace.sandboxId = sandboxId
    terminal.container("ready", sandboxId.slice(0, 8))
    callbacks.onUpdate({ ...workspace })
    callbacks.onStep(5)

    await startDevServer(sandboxId)

    // Poll dev server in background — show live Next.js preview as soon as it's ready
    waitForDevServer(sandboxId)
      .then(async () => {
        const url = await getPreviewUrl(sandboxId)
        workspace.previewUrl = url
        callbacks.onUpdate({ ...workspace })
      })
      .catch(() => {})

    terminal.gemini("sending")
    const [templatePromise, genPromise] = [
      readTemplateFiles(sandboxId),
      generateCode({
        url,
        htmlDump: cloneRes.data.designHtml,
        cssDump: cloneRes.data.css,
        prompt,
        attachedFiles: files,
        svgs: cloneRes.data.svgs,
        imageUrls: cloneRes.data.imageUrls,
        jsSnippets: cloneRes.data.jsSnippets,
      }),
    ]

    templatePromise.then((tf) => {
      workspace.files = tf
      workspace.summary = "Rendering the base Next.js template while Gemini generates your components..."
      callbacks.onUpdate({ ...workspace })
    })

    const templateFiles = await templatePromise
    const genRes = await genPromise
    if (!genRes.ok) throw new Error(genRes.error)
    workspace.files = mergeUniqueFiles(templateFiles, genRes.data.files)
    workspace.summary = genRes.data.summary

    callbacks.onUpdate({ ...workspace })
    callbacks.onStep(6)

    terminal.container("writing")
    await writeFiles(sandboxId, genRes.data.files)
    callbacks.onStep(7)

    if (!workspace.previewUrl) {
      await waitForDevServer(sandboxId)
      const previewUrl = await getPreviewUrl(sandboxId)
      workspace.previewUrl = previewUrl
    }
    terminal.container("done")
    workspace.status = "done"

    await updateWorkspace(id, {
      title: workspace.title,
      html: workspace.html,
      css: workspace.css,
      designHtml: workspace.designHtml,
      files: workspace.files,
      status: "done",
      summary: workspace.summary,
      previewUrl: workspace.previewUrl,
      sandboxId,
    })

    const totalTime = totalTimer.end()
    terminal.request("GET", `/workspace/${id.slice(0, 8)}`, 200, totalTime)
    callbacks.onUpdate({ ...workspace })
    callbacks.onStep(TIMING.totalSteps)
  } catch (e: unknown) {
    workspace.status = "error"
    workspace.error = e instanceof Error ? e.message : "Something went wrong"
    if (workspace.sandboxId) {
      terminal.container("destroy")
      destroySandbox(workspace.sandboxId)
    }
    terminal.fail(`processUrl error: ${workspace.error}`)
    callbacks.onUpdate({ ...workspace })
  }
}
