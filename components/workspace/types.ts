export interface GeneratedFile {
  path: string
  content: string
}

export interface WorkspaceData {
  url: string
  title: string
  html: string
  css: string
  designHtml: string
  files: GeneratedFile[]
  status: "pending" | "processing" | "done" | "error"
  createdAt?: number
  prompt?: string
  error?: string
  summary?: string
  sandboxId?: string
  previewUrl?: string
}

export interface FileTreeNode {
  name: string
  type: "file" | "folder"
  children?: FileTreeNode[]
  content?: string
  path?: string
}

export function buildTree(files: GeneratedFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = []

  for (const file of files) {
    const parts = file.path.split("/")
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1

      if (isLast) {
        current.push({ name: part, type: "file", content: file.content, path: file.path })
      } else {
        let folder = current.find((n) => n.name === part && n.type === "folder") as FileTreeNode | undefined
        if (!folder) {
          folder = { name: part, type: "folder", children: [] }
          current.push(folder)
        }
        current = folder.children!
      }
    }
  }

  return root
}
