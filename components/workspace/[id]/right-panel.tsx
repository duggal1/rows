"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Download01Icon } from "@hugeicons/core-free-icons"
import { PreviewPanel } from "@/components/workspace/preview-panel"
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import type { FileTreeNode } from "@/components/workspace/types"
import { CodePanel } from "./code-panel"

interface RightPanelProps {
  tab: "code" | "preview"
  previewMode: "desktop" | "mobile"
  folderName: string
  treeNodes: FileTreeNode[]
  selectedFile: FileTreeNode | null
  fileName: string
  selectedContent: string | null
  copied: boolean
  html: string
  isDownloading: boolean
  isDone: boolean
  onTabChange: (tab: "code" | "preview") => void
  onPreviewModeChange: (mode: "desktop" | "mobile") => void
  onSelectFile: (node: FileTreeNode | null) => void
  onCopy: () => void
  onDownloadFile: () => void
  onDownloadZip: () => void
}

export function RightPanel({
  tab,
  previewMode,
  folderName,
  treeNodes,
  selectedFile,
  fileName,
  selectedContent,
  copied,
  html,
  isDownloading,
  isDone,
  onTabChange,
  onPreviewModeChange,
  onSelectFile,
  onCopy,
  onDownloadFile,
  onDownloadZip,
}: RightPanelProps) {
  return (
    <div className="flex flex-1 min-w-0 flex-col bg-white dark:bg-zinc-950">
      <div className="grid grid-cols-3 items-center border-b border-neutral-200 bg-white py-2.5 px-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex justify-start">
          <Tabs value={tab} onValueChange={(v) => onTabChange(v as "code" | "preview")}>
            <TabsList>
              <TabsTab value="code" className="text-sm sm:h-7.5">Code</TabsTab>
              <TabsTab value="preview" className="text-sm sm:h-7.5">Preview</TabsTab>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex justify-center">
          {tab === "preview" && (
            <Tabs value={previewMode} onValueChange={(v) => onPreviewModeChange(v as "desktop" | "mobile")}>
              <TabsList>
                <TabsTab value="desktop" className="gap-1.5" disabled={!html}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 21H16M14 21C13.1716 21 12.5 20.3284 12.5 19.5V17L12 17M14 21H10M10 21H8M10 21C10.8284 21 11.5 20.3284 11.5 19.5V17L12 17M12 17V21" />
                    <path d="M16 3H8C5.17157 3 3.75736 3 2.87868 3.87868C2 4.75736 2 6.17157 2 9V11C2 13.8284 2 15.2426 2.87868 16.1213C3.75736 17 5.17157 17 8 17H16C18.8284 17 20.2426 17 21.1213 16.1213C22 15.2426 22 13.8284 22 11V9C22 6.17157 22 4.75736 21.1213 3.87868C20.2426 3 18.8284 3 16 3Z" />
                  </svg>
                </TabsTab>
                <TabsTab value="mobile" className="gap-1.5" disabled={!html}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H10L10.5 3H13.5L14 2Z" />
                    <rect x="5.5" y="2" width="13" height="20" rx="3" />
                  </svg>
                </TabsTab>
              </TabsList>
            </Tabs>
          )}
        </div>
        <div className="flex justify-end">
          {tab === "preview" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadZip}
              disabled={isDownloading || !isDone}
              className="shrink-0 gap-2 cursor-pointer rounded-lg px-3 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              rounded="md"
            >
              <HugeiconsIcon icon={Download01Icon} size={14} />
              Download
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "code" ? (
          <CodePanel
            folderName={folderName}
            treeNodes={treeNodes}
            selectedFile={selectedFile}
            fileName={fileName}
            selectedContent={selectedContent}
            copied={copied}
            onSelect={onSelectFile}
            onCopy={onCopy}
            onDownload={onDownloadFile}
          />
        ) : (
          <div className="h-full p-6">
            <PreviewPanel html={html} mode={previewMode} />
          </div>
        )}
      </div>
    </div>
  )
}
