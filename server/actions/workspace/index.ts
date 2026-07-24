"use server"

import { db } from "@/db"
import { workspace } from "@/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { desc, eq } from "drizzle-orm"
import type { GeneratedFile } from "@/components/workspace/types"

export async function createWorkspace(data: {
  id: string
  url: string
  prompt?: string
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Not authenticated")

  await db.insert(workspace).values({
    id: data.id,
    userId: session.user.id,
    url: data.url,
    prompt: data.prompt || null,
    status: "pending",
  })

  return { id: data.id }
}

export async function getWorkspace(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Not authenticated")

  const row = await db.query.workspace.findFirst({
    where: eq(workspace.id, id),
  })

  if (!row) return null
  if (row.userId !== session.user.id) throw new Error("Not authorized")

  return row
}

export async function updateWorkspace(
  id: string,
  data: {
    title?: string
    html?: string
    css?: string
    designHtml?: string
    files?: GeneratedFile[]
    status?: string
    summary?: string
    previewUrl?: string
    sandboxId?: string
    error?: string
  },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Not authenticated")

  const row = await db.query.workspace.findFirst({
    where: eq(workspace.id, id),
  })
  if (!row) throw new Error("Workspace not found")
  if (row.userId !== session.user.id) throw new Error("Not authorized")

  await db
    .update(workspace)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workspace.id, id))
}

export async function listWorkspaces() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return []

  const rows = await db.query.workspace.findMany({
    where: eq(workspace.userId, session.user.id),
    orderBy: [desc(workspace.createdAt)],
    columns: {
      id: true,
      url: true,
      title: true,
      prompt: true,
      html: true,
      status: true,
      createdAt: true,
    },
  })

  return rows
}

export async function deleteWorkspace(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Not authenticated")

  const row = await db.query.workspace.findFirst({
    where: eq(workspace.id, id),
  })
  if (!row) throw new Error("Workspace not found")
  if (row.userId !== session.user.id) throw new Error("Not authorized")

  await db.delete(workspace).where(eq(workspace.id, id))
}
