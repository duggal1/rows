# Rows

Rows is an open-source AI website clone and design-reference architecture.

It takes a website URL, extracts its visual design, converts it into clean context, and generates a production-grade Next.js application — not a static copy.

## How It Works

1. You provide a URL.
2. Rows fetches the page and extracts HTML, CSS, and JavaScript.
3. Large SVGs, excessive markup, and irrelevant content are truncated to reduce unnecessary model context.
4. The cleanest, most relevant design context is sent to the AI provider.
5. The model returns structured files delimited by `--- FILE: <path> ---` markers.
6. Inngest orchestrates the background job: context processing, AI generation, and E2B container setup.
7. Inside an isolated E2B container, files are written, dependencies are installed, and the Next.js dev server starts.
8. The live application preview is exposed for the user to see.
9. You can chat with AI to modify the project — the AI reads, edits, and validates the real codebase.

## What We Have

- HTML extraction pipeline — fetches and cleans a target URL (inline CSS, rewrite assets, strip noise)
- Gemini provider backend — `@google/genai` SDK with streaming support
- AI code generation prompt — converts HTML/CSS to Next.js + TypeScript + Tailwind output with `--- FILE:` markers
- File parser — extracts individual files from the model response with zero ambiguity

## What We Don't Have Yet

- E2B container execution — generated code doesn't run as a real Next.js project
- Live preview — current preview renders raw HTML/CSS in an iframe, not a real Next.js app
- Inngest background processing — no async job orchestration
- Design-reference retrieval — no structured design dataset or embeddings
- Database — no persistent storage (localStorage only)
- Authentication — no user sessions
- AI editing — no iterative chat-driven modification of generated projects

## Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| UI | shadcn/ui |
| Animation | Motion |
| AI | Gemini (Anthropic, OpenAI, OpenRouter planned) |
| Background | Inngest |
| Execution | E2B |
| Database | Drizzle ORM (planned) |
| Auth | Better Auth (planned) |

## Goal

Turn a URL into a real, editable Next.js codebase that runs in an isolated environment, previews live, and can be iterated on through chat.
