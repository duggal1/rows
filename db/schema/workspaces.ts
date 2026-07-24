import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core"
import { user } from "./auth"
import type { GeneratedFile } from "@/components/workspace/types"

export const workspace = pgTable("workspace", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  prompt: text("prompt"),
  html: text("html"),
  css: text("css"),
  designHtml: text("design_html"),
  files: jsonb("files").$type<GeneratedFile[]>(),
  status: text("status").notNull().default("pending"),
  summary: text("summary"),
  previewUrl: text("preview_url"),
  sandboxId: text("sandbox_id"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
