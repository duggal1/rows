"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Download01Icon, Copy01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { FileTree } from "@/components/workspace/file-tree"
import { CodeViewer } from "@/components/workspace/code-viewer"
import { Skeleton } from "@/components/ui/skeleton"
import type { FileTreeNode } from "@/components/workspace/types"

interface CodePanelProps {
  folderName: string
  treeNodes: FileTreeNode[]
  selectedFile: FileTreeNode | null
  fileName: string
  selectedContent: string | null
  copied: boolean
  onSelect: (node: FileTreeNode | null) => void
  onCopy: () => void
  onDownload: () => void
}

export function CodePanel({
  folderName,
  treeNodes,
  selectedFile,
  fileName,
  selectedContent,
  copied,
  onSelect,
  onCopy,
  onDownload,
}: CodePanelProps) {
  return (
    <div className="flex h-full">
      <div className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex-1 overflow-auto px-2 pb-3 pt-3">
          <FileTree
            nodes={[{ name: folderName, type: "folder", children: treeNodes }]}
            selectedPath={selectedFile?.path ?? null}
            onSelect={onSelect}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-center gap-2 px-4 h-11 border-b border-zinc-200 bg-zinc-50 shrink-0 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="px-3 py-1.5 text-[12.5px] font-medium rounded-t-md bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
            {fileName || "Select a file"}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={onCopy}
              disabled={!selectedContent}
              className="flex items-center gap-1.5 h-7 rounded-md px-2.5 text-[12px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70 disabled:opacity-40"
            >
              <HugeiconsIcon icon={copied ? CheckmarkCircle01Icon : Copy01Icon} size={13} strokeWidth={1.8} />
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={onDownload}
              disabled={!selectedContent}
              className="flex items-center gap-1.5 h-7 rounded-md px-2.5 text-[12px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70 disabled:opacity-40"
            >
              <HugeiconsIcon icon={Download01Icon} size={13} strokeWidth={1.8} />
              Download
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          {selectedContent ? (
            <CodeViewer code={selectedContent} fileName={fileName} />
          ) : (
            <div className="flex h-full items-start justify-center pt-8">
              <div className="w-full max-w-2xl font-mono text-[13px] leading-7">
                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map((n) => (
                  <div key={n} className="flex">
                    <span className="w-8 shrink-0 text-right pr-4 text-zinc-300 select-none dark:text-zinc-600">{n}</span>
                    {n === 6 ? null : (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-600">{n <= 5 ? "  " : n <= 11 ? n <= 7 ? "  " : n <= 10 ? "    " : "      " : "  "}</span>
                        <Skeleton className={`inline-block h-3.5 align-middle dark:bg-zinc-700 ${n === 1 ? "w-16" : n === 2 ? "w-24" : n === 3 ? "w-32" : n === 4 ? "w-40" : n === 5 ? "w-36" : n === 7 ? "w-28" : n === 8 ? "w-52" : n === 9 ? "w-44" : n === 10 ? "w-38" : n === 11 ? "w-56" : n === 12 ? "w-32" : n === 13 ? "w-20" : "w-14"}`} />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
