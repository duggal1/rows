import type { WorkspaceData } from "@/components/workspace/types"
import { cloneSite } from "@/server/actions/site/clone-site"
import { generateCode } from "@/server/actions/generate-code"
import { TIMING, saveWorkspace } from "./utils"

export async function processUrl(
  id: string,
  url: string,
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
    files: [],
    status: "processing",
  }
  saveWorkspace(id, workspace)
  callbacks.onUpdate(workspace)

  try {
    const cloneRes = await cloneSite(url)
    if (!cloneRes.ok) throw new Error(cloneRes.error)
    workspace.title = cloneRes.data.title
    workspace.html = cloneRes.data.html
    workspace.css = cloneRes.data.css
    callbacks.onUpdate({ ...workspace })
    callbacks.onStep(4)

    const genRes = await generateCode({
      htmlDump: cloneRes.data.designHtml,
      cssDump: cloneRes.data.css,
    })
    if (!genRes.ok) throw new Error(genRes.error)
    workspace.files = genRes.data.files
    workspace.status = "done"
    saveWorkspace(id, workspace)
    callbacks.onUpdate({ ...workspace })
    callbacks.onStep(TIMING.totalSteps)
  } catch (e: any) {
    workspace.status = "error"
    workspace.error = e?.message ?? "Something went wrong"
    saveWorkspace(id, workspace)
    callbacks.onUpdate({ ...workspace })
  }
}
