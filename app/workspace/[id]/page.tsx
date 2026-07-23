"use client"

import { LeftPanel } from "@/components/workspace/[id]/left-panel"
import { RightPanel } from "@/components/workspace/[id]/right-panel"
import { useWorkspace } from "@/components/workspace/[id]/use-workspace"



export default function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const w = useWorkspace({ params })

  return (
    <div className="flex h-dvh w-full">
      <LeftPanel
        domain={w.domain}
        folderName={w.folderName}
        step={w.step}
        isProcessing={w.isProcessing}
        isDone={w.isDone}
        isDownloading={w.isDownloading}
        inputValue={w.inputValue}
        router={w.router}
        onDownloadZip={w.downloadZip}
        onInputChange={w.setInputValue}
      />
      <RightPanel
        tab={w.tab}
        previewMode={w.previewMode}
        folderName={w.folderName}
        treeNodes={w.treeNodes}
        selectedFile={w.selectedFile}
        fileName={w.fileName}
        selectedContent={w.selectedContent}
        copied={w.copied}
        html={w.data?.html ?? ""}
        isDownloading={w.isDownloading}
        isDone={w.isDone}
        onTabChange={w.setTab}
        onPreviewModeChange={w.setPreviewMode}
        onSelectFile={w.setSelectedFile}
        onCopy={w.handleCopy}
        onDownloadFile={w.handleDownload}
        onDownloadZip={w.downloadZip}
      />
    </div>
  )
}
