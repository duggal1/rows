"use client"

import { LeftPanel } from "./left-panel"
import { RightPanel } from "./right-panel"
import { useWorkspace } from "./use-workspace"

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
        onComposeSubmit={(_t, _f, _m) => {}}
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
        previewUrl={w.data?.previewUrl}
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
