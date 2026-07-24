"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link02Icon, Globe02Icon, ArrowUpRight01Icon, LaptopIcon } from "@hugeicons/core-free-icons"
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuSeparator } from "@/components/ui/menu"
import { extractDomain } from "@/components/workspace/[id]/utils"
import { listWorkspaces, deleteWorkspace } from "@/server/actions/workspace"
import type { WorkspaceData } from "@/components/workspace/types"

const IFRAME_WIDTH = 1280
const IFRAME_HEIGHT = 800

interface ProjectEntry {
  id: string
  url: string
  title: string | null
  prompt: string | null
  html: string | null
  createdAt: Date | null
  status: string
}

function timeAgo(date: Date | null): string {
  if (!date) return ""
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function truncateWords(text: string | null, max: number): string {
  if (!text) return ""
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length <= max) return text
  return words.slice(0, max).join(" ") + "..."
}

function ProjectCard({ p, router, onDelete }: { p: ProjectEntry; router: ReturnType<typeof useRouter>; onDelete: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.25)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / IFRAME_WIDTH)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleCopyProjectLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/workspace/${p.id}`)
  }

  const handleOpenNewTab = () => {
    window.open(`/workspace/${p.id}`, "_blank")
  }

  const handleDelete = async () => {
    try {
      await deleteWorkspace(p.id)
      onDelete(p.id)
    } catch {}
  }

  return (
    <div className="overflow-hidden rounded-md border border-zinc-100/90 bg-zinc-50/98 transition-all duration-150 hover:border-zinc-200/65 dark:border-zinc-800/70 dark:bg-zinc-900/90 dark:hover:border-zinc-700/75 focus-visible:outline-none">
      <button
        onClick={() => router.push(`/workspace/${p.id}`)}
        className="w-full focus-visible:outline-none"
      >
        <div ref={containerRef} className="relative aspect-16/10 w-full overflow-hidden bg-muted">
          {p.html ? (
            <iframe
              srcDoc={p.html}
              sandbox="allow-same-origin"
              className="pointer-events-none absolute left-0 top-0"
              style={{
                width: IFRAME_WIDTH,
                height: IFRAME_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: "0 0",
              }}
              title={p.title || ""}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Preview unavailable
            </div>
          )}
        </div>
      </button>

      <div className="flex items-center gap-3 px-4 py-3">
        <img
          src={`https://www.google.com/s2/favicons?domain=${extractDomain(p.url)}&sz=32`}
          alt=""
          className="size-5 shrink-0 rounded"
          width={20}
          height={20}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <button
            onClick={() => router.push(`/workspace/${p.id}`)}
            className="w-full min-w-0 cursor-pointer text-left focus-visible:outline-none"
          >
            <span className="block truncate text-sm font-medium text-foreground transition-colors hover:underline">
              {p.prompt ? truncateWords(p.prompt, 5) : p.title || extractDomain(p.url)}
            </span>
          </button>
          <span className="text-[11px] text-muted-foreground/50">
            {p.createdAt ? timeAgo(p.createdAt) : ""}
          </span>
        </div>

        <Menu>
          <MenuTrigger
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground/80 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon icon={Link02Icon} size={15} />
          </MenuTrigger>
          <MenuPopup sideOffset={6} align="end" className="w-52 rounded-md p-1">
            <MenuItem className="gap-2.5 text-xs" onClick={handleCopyProjectLink}>
              <HugeiconsIcon icon={Link02Icon} size={15} />
              Copy project link
            </MenuItem>
            <MenuItem className="gap-2.5 text-xs" disabled>
              <HugeiconsIcon icon={Globe02Icon} size={15} />
              Copy domain link
            </MenuItem>
          </MenuPopup>
        </Menu>

        <Menu>
          <MenuTrigger
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground/80 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="13" cy="8" r="1.5" />
            </svg>
          </MenuTrigger>
          <MenuPopup sideOffset={6} align="end" className="w-52 rounded-md p-1">
            <MenuItem className="gap-2.5 text-xs" onClick={() => router.push(`/workspace/${p.id}`)}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path d="M1.5 8C1.5 8 4.5 2.5 8 2.5C11.5 2.5 14.5 8 14.5 8C14.5 8 11.5 13.5 8 13.5C4.5 13.5 1.5 8 1.5 8Z" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              View
            </MenuItem>
            <MenuItem className="gap-2.5 text-xs" onClick={handleOpenNewTab}>
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} />
              Open in new tab
            </MenuItem>

            <MenuSeparator />

            <MenuItem className="gap-2.5 text-xs" disabled>
            <HugeiconsIcon icon={LaptopIcon} size={15} />
              Remix
            </MenuItem>
            <MenuItem className="gap-2.5 text-xs" disabled>
            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              Export to GitHub
            </MenuItem>

            <MenuSeparator />

            <MenuItem className="gap-2.5 text-xs" disabled>
              <HugeiconsIcon icon={Globe02Icon} size={15} />
              View public domain
            </MenuItem>

            <MenuSeparator />

            <MenuItem className="gap-2.5 text-xs" variant="destructive" onClick={handleDelete}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path d="M2 4H14M5 4V2.5C5 2.22386 5.22386 2 5.5 2H10.5C10.7761 2 11 2.22386 11 2.5V4M6.5 7V11.5M9.5 7V11.5M3.5 4L4.5 13.5C4.5 13.7761 4.72386 14 5 14H11C11.2761 14 11.5 13.7761 11.5 13.5L12.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Delete
            </MenuItem>
          </MenuPopup>
        </Menu>

      </div>
    </div>
  )
}

export function RecentProjects() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const { data: session } = authClient.useSession()

  useEffect(() => {
    if (!session) {
      setProjects([])
      return
    }
    listWorkspaces().then(setProjects).catch(() => setProjects([]))
  }, [session])

  function handleDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  if (!session || projects.length === 0) return null

  return (
    <section className="w-full pb-40">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="mb-6 text-xs font-normal tracking-[0.06em] uppercase text-muted-foreground">
          Recent projects
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} router={router} onDelete={handleDelete} />
          ))}
        </div>
      </div>
    </section>
  )
}
