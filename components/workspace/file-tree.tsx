"use client"

import { useState, useMemo } from "react"
import { useTheme } from "@/lib/theme-context"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search02Icon,
  Folder01Icon,
  ArrowRight01Icon,
  File01Icon,
  Image01Icon,
  Settings01Icon,
  BookOpen01Icon,
} from "@hugeicons/core-free-icons"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

import type { FileTreeNode } from "./types"

const ROW_H = 28
const STEP = 20

function fileMeta(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (["tsx", "jsx"].includes(ext))
    return { kind: "badge" as const, label: ext.toUpperCase(), color: "#d946ef", bg: "#fdf4ff" }
  if (ext === "ts")
    return { kind: "badge" as const, label: "TS", color: "#3b82f6", bg: "#eff6ff" }
  if (ext === "css")
    return { kind: "badge" as const, label: "CSS", color: "#8b5cf6", bg: "#f5f3ff" }
  if (ext === "md")
    return { kind: "icon" as const, Icon: BookOpen01Icon, color: "#06b6d4" }
  if (["svg", "ico", "png", "jpg", "webp"].includes(ext))
    return { kind: "icon" as const, Icon: Image01Icon, color: "#db2777" }
  if (["json", "toml"].includes(ext))
    return { kind: "icon" as const, Icon: Settings01Icon, color: "#78716c" }
  return { kind: "icon" as const, Icon: File01Icon, color: "#78716c" }
}

interface InternalNode {
  name: string
  type: "file" | "folder"
  children?: InternalNode[]
  content?: string
  path?: string
}

function adapt(nodes: FileTreeNode[]): InternalNode[] {
  return nodes.map((n) => ({
    name: n.name,
    type: n.type,
    children: n.children ? adapt(n.children) : undefined,
    content: n.content,
    path: n.path,
  }))
}

interface FileTreeProps {
  nodes: InternalNode[]
  selectedPath: string | null
  onSelect: (node: FileTreeNode) => void
}

export function FileTree({ nodes, selectedPath, onSelect }: FileTreeProps) {
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState(new Set<string>())
  const { resolvedTheme: rootTheme } = useTheme()

  const root: InternalNode = { name: "root", type: "folder", children: nodes }

  const visibleTree = useMemo<InternalNode>(() => {
    if (!query) return root
    const filtered = filterTree(root, query)
    return filtered || { ...root, children: [] }
  }, [query, nodes])

  function toggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  const guideColor = rootTheme === "dark" ? "#3f3f46" : "#e4e4e7"

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-2.5">
        <InputGroup className="bg-zinc-100/80 dark:bg-zinc-800/80 border-zinc-100 dark:border-zinc-800 shadow-none px-1">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search02Icon} size={15} strokeWidth={1.8} style={{ color: rootTheme === "dark" ? "#a1a1aa" : "#52525b" }} />
          </InputGroupAddon>
          <InputGroupInput aria-label="Search" placeholder="Search files..." type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </InputGroup>
      </div>

      <div className="flex-1 overflow-auto px-2 pb-3">
        {(visibleTree.children || []).map((child) => (
          <TreeNode
            key={child.name}
            node={child}
            depth={0}
            path={`root/${child.name}`}
            expanded={expanded}
            toggle={toggle}
            selectedPath={selectedPath}
            onSelect={onSelect}
            guideColor={guideColor}
            query={query}
          />
        ))}
      </div>
    </div>
  )
}

function filterTree(node: InternalNode, query: string): InternalNode | null {
  if (!query) return node
  const q = query.toLowerCase()
  if (node.type === "file") return node.name.toLowerCase().includes(q) ? node : null
  const kids: InternalNode[] = (node.children || []).map((c) => filterTree(c, q)).filter(Boolean) as InternalNode[]
  if (node.name.toLowerCase().includes(q) || kids.length) return { ...node, children: kids }
  return null
}

function Row({
  depth,
  active,
  onClick,
  children,
}: {
  depth: number
  active: boolean
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <div
      onClick={onClick}
      style={{ height: ROW_H, paddingLeft: depth * STEP + 8 }}
      className={
        "relative flex items-center gap-1.5 cursor-pointer rounded-md pr-2 text-[13px] select-none " +
        (active
          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800")
      }
    >
      {children}
    </div>
  )
}

function TreeNode({
  node,
  depth,
  path,
  expanded,
  toggle,
  selectedPath,
  onSelect,
  guideColor,
  query,
}: {
  node: InternalNode
  depth: number
  path: string
  expanded: Set<string>
  toggle: (path: string) => void
  selectedPath: string | null
  onSelect: (node: FileTreeNode) => void
  guideColor: string
  query: string
}) {
  const { resolvedTheme } = useTheme()
  const isFolder = node.type === "folder"
  const isOpen = expanded.has(path) || Boolean(query)
  const guideX = depth * STEP + 15

  if (isFolder) {
    const kids = node.children || []
    const guideHeight = kids.length ? (kids.length - 1) * ROW_H + ROW_H / 2 : 0

    return (
      <div>
        <Row depth={depth} active={false} onClick={() => toggle(path)}>
          <span
            style={{
              display: "flex",
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 120ms ease",
              color: resolvedTheme === "dark" ? "#71717a" : "#a1a1aa",
              flexShrink: 0,
            }}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2.5} />
          </span>
          <HugeiconsIcon
            icon={Folder01Icon}
            size={15}
            strokeWidth={1.8}
            style={{ color: resolvedTheme === "dark" ? "#71717a" : "#a1a1aa", opacity: isOpen ? 1 : 0.85, flexShrink: 0 }}
          />
          <span className="truncate">{node.name}</span>
        </Row>

        {isOpen && kids.length > 0 && (
          <div className="relative">
            <div
              className="absolute"
              style={{ left: guideX, top: 0, width: 1, height: guideHeight, backgroundColor: guideColor }}
            />
            {kids.map((child) => (
              <TreeNode
                key={child.name}
                node={child}
                depth={depth + 1}
                path={`${path}/${child.name}`}
                expanded={expanded}
                toggle={toggle}
                selectedPath={selectedPath}
                onSelect={onSelect}
                guideColor={guideColor}
                query={query}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const meta = fileMeta(node.name)
  const branchLeft = (depth - 1) * STEP + 15
  const branchWidth = depth * STEP + 8 - branchLeft

  return (
    <div className="relative">
      <div
        className="absolute"
        style={{ left: branchLeft, top: ROW_H / 2, width: branchWidth, height: 1, backgroundColor: guideColor }}
      />
      <Row
        depth={depth}
        active={node.path === selectedPath}
        onClick={() => onSelect(node as FileTreeNode)}
      >
        {meta.kind === "badge" ? (
          <span
            className="flex items-center justify-center rounded font-semibold shrink-0"
            style={{ width: 26, height: 15, fontSize: 8.5, color: meta.color, backgroundColor: meta.bg }}
          >
            {meta.label}
          </span>
        ) : (
          <HugeiconsIcon icon={meta.Icon} size={14} strokeWidth={1.8} style={{ color: meta.color, flexShrink: 0 }} />
        )}
        <span className="truncate">{node.name}</span>
      </Row>
    </div>
  )
}
