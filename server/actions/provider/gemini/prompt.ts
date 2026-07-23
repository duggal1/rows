const DESIGN_RULES = [
  "The HTML/CSS dump is the ONLY source of truth for design. Never reinvent, restyle, or apply your own design opinions.",
  "Convert into Next.js React with Tailwind CSS and motion/react, using Next.js 16, React 19+, Tailwind v4+ syntax.",
  "If a section is missing from the dump, infer it only from patterns already present — never invent new visual patterns.",
  "Output only component and logic files. No tailwind.config.ts, next.config.ts, or globals.css.",
  "utils/container.ts holds motion/react logic; utils/main.ts holds shared frontend logic.",
  "styling.css is allowed only for genuinely custom CSS Tailwind can't express (e.g. text selection) — not a globals.css replacement.",
  "One file per section. Never a single page.tsx dump.",
  "No comments. Fully type-safe. Clean, modular code.",
]

export function buildSystemPrompt(token: string): string {
  return `You output React + TypeScript + Tailwind code.

━━━ OUTPUT FORMAT — CRITICAL ━━━

❌ NEVER output JSON.
❌ NEVER wrap code in \`\`\`tsx or \`\`\` or any markdown fences.
❌ NEVER write explanations. Code only.

✅ Each file opens with: ⟦FILE:${token} path="project/components/FileName.tsx"⟧
✅ Raw code in between (no escaping, no wrapping).
✅ Closes with: ⟦ENDFILE:${token}⟧

Example:
⟦FILE:${token} path="project/components/Hero.tsx"⟧
export function Hero() {
  return <div>Hello</div>;
}
⟦ENDFILE:${token}⟧

━━━ YOUR JOB ━━━

You are extremely forbidden to reinvent your own wheel. The HTML/CSS dump below is the ONLY source of truth for ultra-clean design. Your job is to read the full HTML and CSS data dump and convert it into Next.js + TypeScript + Tailwind CSS + motion/react components.

Read the full HTML and CSS. Match colors, spacing, layout, typography exactly. Never apply your own design opinions.

If the HTML dump uses animations or transitions, use motion/react (not framer-motion).

━━━ MINIMUM FILES ━━━

Generate at least these 5:
- Hero (hero.tsx)
- Navbar (navbar.tsx)
- Footer (footer.tsx)
- FAQ (faq.tsx)
- Utilities/motion helpers (utils.ts, container.tsx, or similar .tsx)

Additional optional components if the dump has them: bento grid, testimonials, stats, CTA. Never fewer than 5.

━━━ FORBIDDEN FILES ━━━

Do NOT generate these — they already exist from create-next-app:
- globals.css, layout.tsx, next.config.ts, tailwind.config.ts

If you need extra custom CSS that Tailwind can't express, output it as styles.css (not globals.css). We will import it ourselves in layout.tsx. globals.css stays untouched.

━━━ DESIGN RULES ━━━

${DESIGN_RULES.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
}

export function buildUserPrompt(html: string, css: string): string {
  return `Convert this HTML/CSS into React + TypeScript + Tailwind components.

HTML:
${html}

CSS:
${css}`
}
