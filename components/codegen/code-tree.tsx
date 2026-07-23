"use client" ;


import { useState, useMemo } from "react";
import { useTheme } from "@/lib/theme-context";
import type {
  TreeNode as TreeNodeType,
  Token,
  TokenKind,
  Palette,
  RowProps,
  TreeNodeProps,
  CodePanelProps,
  FileMeta,
  TreeFolder,
} from "./types";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search02Icon,
  Folder01Icon,
  ArrowRight01Icon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  Download01Icon,
  Image01Icon,
  Settings01Icon,
  BookOpen01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons";



const TREE: TreeFolder = {
  name: "root",
  type: "folder",
  children: [
    {
      name: ".lovable",
      type: "folder",
      children: [{ name: "plan.md", type: "file" }],
    },
    {
      name: "public",
      type: "folder",
      children: [
        { name: "favicon.ico", type: "file" },
        { name: "placeholder.svg", type: "file" },
        { name: "robots.txt", type: "file" },
      ],
    },
    {
      name: "src",
      type: "folder",
      children: [
        { name: "assets", type: "folder", children: [] },
        {
          name: "components",
          type: "folder",
          children: [
            { name: "Header.tsx", type: "file" },
            { name: "Hero.tsx", type: "file", hasDemo: true },
            { name: "Footer.tsx", type: "file" },
          ],
        },
        { name: "contexts", type: "folder", children: [] },
        { name: "hooks", type: "folder", children: [] },
        { name: "integrations", type: "folder", children: [] },
        { name: "lib", type: "folder", children: [] },
        {
          name: "pages",
          type: "folder",
          children: [{ name: "Index.tsx", type: "file" }],
        },
        { name: "test", type: "folder", children: [] },
        { name: "App.css", type: "file" },
        { name: "App.tsx", type: "file" },
        { name: "index.css", type: "file" },
        { name: "main.tsx", type: "file" },
        { name: "vite-env.d.ts", type: "file" },
      ],
    },
    {
      name: "supabase",
      type: "folder",
      children: [
        { name: "functions", type: "folder", children: [] },
        { name: "migrations", type: "folder", children: [] },
        { name: "config.toml", type: "file" },
      ],
    },
  ],
};

/* ---------------------------------------------------------------
   2. DEMO FILE CONTENT (Hero.tsx) — real React/Next/Tailwind/
      Framer Motion so the tokenizer has real syntax to chew on
--------------------------------------------------------------- */

const DEMO_CODE = `"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HeroProps {
  title: string;
  ctaLabel?: string;
}

export default function Hero({ title, ctaLabel = "Get started" }: HeroProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <section className="relative px-6 py-24 overflow-hidden">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-5xl font-medium tracking-tight text-neutral-900"
      >
        {title}
      </motion.h1>

      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-neutral-400"
          >
            Ready when you are.
          </motion.span>
        )}
      </AnimatePresence>

      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="mt-8 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
      >
        {ctaLabel}
      </button>
    </section>
  );
}
`;

/* ---------------------------------------------------------------
   3. TOKENIZER — regex-based, single pass per line
--------------------------------------------------------------- */

const KEYWORDS = new Set([
  "import","export","default","from","const","let","var","function","return",
  "if","else","for","while","interface","type","extends","implements","async",
  "await","new","class","public","private","readonly","as","of","in","void",
  "null","undefined","true","false","this","super","try","catch","finally",
]);

const TOKEN_RE =
  /(\/\/.*$)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(<\/?[A-Za-z][\w.]*)|(\b[A-Za-z_$][\w$]*\b)(?=\s*=(?!=))|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][\w$]*\b)(?=\s*\()|(\b[A-Za-z_$][\w$]*\b)|([{}()[\];:,.<>/=+\-!?&|%*]+)|(\s+)/g;

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(line)) !== null) {
    if (m.index > last) tokens.push({ t: line.slice(last, m.index), k: "plain" });
    const [, comment, str, jsxTag, attr, num, fnCall, ident, punct, ws] = m;
    if (comment) tokens.push({ t: comment, k: "comment" });
    else if (str) tokens.push({ t: str, k: "string" });
    else if (jsxTag) tokens.push({ t: jsxTag, k: "jsx" });
    else if (attr) tokens.push({ t: attr, k: "attr" });
    else if (num) tokens.push({ t: num, k: "number" });
    else if (fnCall) tokens.push({ t: fnCall, k: /^use[A-Z]/.test(fnCall) ? "hook" : "fn" });
    else if (ident) tokens.push({ t: ident, k: KEYWORDS.has(ident) ? "keyword" : "ident" });
    else if (punct) tokens.push({ t: punct, k: "punct" });
    else if (ws) tokens.push({ t: ws, k: "plain" });
    last = TOKEN_RE.lastIndex;
    if (m.index === TOKEN_RE.lastIndex) TOKEN_RE.lastIndex++;
  }
  if (last < line.length) tokens.push({ t: line.slice(last), k: "plain" });
  return tokens;
}

const PALETTE: Record<"light" | "dark", Palette> = {
  light: {
    comment: "#9ca3af", string: "#0d9488", jsx: "#db2777", attr: "#0891b2",
    number: "#d97706", hook: "#7c3aed", fn: "#2563eb", keyword: "#ea580c",
    ident: "#27272a", punct: "#78716c", plain: "#27272a",
  },
  dark: {
    comment: "#71717a", string: "#2dd4bf", jsx: "#f472b6", attr: "#22d3ee",
    number: "#fbbf24", hook: "#c4b5fd", fn: "#60a5fa", keyword: "#fb923c",
    ident: "#e4e4e7", punct: "#a8a29e", plain: "#e4e4e7",
  },
};

/* ---------------------------------------------------------------
   4. FILE ICON / BADGE HELPERS
--------------------------------------------------------------- */

function fileMeta(name: string, dark: boolean): FileMeta {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["tsx", "jsx"].includes(ext))
    return { kind: "badge", label: ext.toUpperCase(), color: "#d946ef", bg: dark ? "#701a7533" : "#fdf4ff" };
  if (ext === "ts")
    return { kind: "badge", label: "TS", color: "#3b82f6", bg: dark ? "#1e3a8a33" : "#eff6ff" };
  if (ext === "css")
    return { kind: "badge", label: "CSS", color: "#8b5cf6", bg: dark ? "#4c1d9533" : "#f5f3ff" };
  if (ext === "md")
    return { kind: "icon", Icon: BookOpen01Icon, color: "#06b6d4" };
  if (["svg", "ico", "png", "jpg"].includes(ext))
    return { kind: "icon", Icon: Image01Icon, color: "#db2777" };
  if (["json", "toml"].includes(ext))
    return { kind: "icon", Icon: Settings01Icon, color: dark ? "#a8a29e" : "#78716c" };
  return { kind: "icon", Icon: File01Icon, color: dark ? "#a8a29e" : "#78716c" };
}

/* ---------------------------------------------------------------
   5. TREE — real vertical guide + horizontal branch per row
--------------------------------------------------------------- */

const ROW_H = 28;
const STEP = 20;

function Row({ depth, active, dark, onClick, children }: RowProps) {
  return (
    <div
      onClick={onClick}
      style={{ height: ROW_H, paddingLeft: depth * STEP + 8 }}
      className={
        "relative flex items-center gap-1.5 cursor-pointer rounded-md pr-2 text-[13px] select-none " +
        (active
          ? dark
            ? "bg-white/10 text-zinc-200"
            : "bg-white text-zinc-900"
          : dark
          ? "text-zinc-300 hover:bg-zinc-800/60"
          : "text-zinc-700 hover:bg-zinc-100")
      }
    >
      {children}
    </div>
  );
}

function TreeNode({ node, depth, path, expanded, toggle, selected, select, dark, query }: TreeNodeProps) {
  const isFolder = node.type === "folder";
  const isOpen = expanded.has(path) || Boolean(query);
  const guideColor = dark ? "#3f3f46" : "#e4e4e7";
  const guideX = depth * STEP + 15;

  if (isFolder) {
    const kids = node.children || [];
    const guideHeight = kids.length ? (kids.length - 1) * ROW_H + ROW_H / 2 : 0;

    return (
      <div>
        <Row depth={depth} active={false} dark={dark} onClick={() => toggle(path)}>
          <span
            style={{
              display: "flex",
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 120ms ease",
              color: dark ? "#71717a" : "#a1a1aa",
              flexShrink: 0,
            }}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2.5} />
          </span>
          <HugeiconsIcon
            icon={Folder01Icon}
            size={15}
            strokeWidth={1.8}
            style={{ color: dark ? "#71717a" : "#a1a1aa", opacity: isOpen ? 1 : 0.85 }}
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
                selected={selected}
                select={select}
                dark={dark}
                query={query}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const meta = fileMeta(node.name, dark);
  const branchLeft = (depth - 1) * STEP + 15;
  const branchWidth = depth * STEP + 8 - branchLeft;

  return (
    <div className="relative">
      <div
        className="absolute"
        style={{ left: branchLeft, top: ROW_H / 2, width: branchWidth, height: 1, backgroundColor: guideColor }}
      />
      <Row depth={depth} active={selected === path} dark={dark} onClick={() => select(path)}>
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
  );
}

/* filter tree by search query, keeping matched paths + their ancestors */
function filterTree(node: TreeNodeType, query: string): TreeNodeType | null {
  if (!query) return node;
  const q = query.toLowerCase();
  if (node.type === "file") return node.name.toLowerCase().includes(q) ? node : null;
  const kids: TreeNodeType[] = (node.children || []).map((c) => filterTree(c, query)).filter(Boolean) as TreeNodeType[];
  if (node.name.toLowerCase().includes(q) || kids.length) return { ...node, children: kids };
  return null;
}

/* ---------------------------------------------------------------
   6. CODE PANEL
--------------------------------------------------------------- */

function CodePanel({ dark, fileName, copied, onCopy, onDownload }: CodePanelProps) {
  const pal = dark ? PALETTE.dark : PALETTE.light;
  const lines = useMemo(() => DEMO_CODE.split("\n"), []);

  return (
    <div className={"flex flex-1 flex-col min-w-0 " + (dark ? "bg-zinc-950" : "bg-white")}>
      {/* tab bar */}
      <div
        className={
          "flex items-center gap-2 px-4 h-11 border-b shrink-0 " +
          (dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50")
        }
      >
        <span
          className={
            "px-3 py-1.5 text-[12.5px] font-medium rounded-t-md " +
            (dark
              ? "bg-zinc-950 text-zinc-100"
              : "bg-white text-zinc-800")
          }
        >
          {fileName}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onCopy}
            className={
              "flex items-center gap-1.5 h-7 rounded-md px-2.5 text-[12px] font-medium " +
              (dark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-200/70")
            }
          >
            <HugeiconsIcon
              icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
              size={13}
              strokeWidth={1.8}
              style={{ color: copied ? (dark ? "#a1a1aa" : "#78716c") : undefined }}
            />
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={onDownload}
            className={
              "flex items-center gap-1.5 h-7 rounded-md px-2.5 text-[12px] font-medium " +
              (dark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-200/70")
            }
          >
            <HugeiconsIcon icon={Download01Icon} size={13} strokeWidth={1.8} />
            Download
          </button>
        </div>
      </div>

      {/* code */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max px-4 py-4 font-mono text-[12.5px] leading-[1.75]">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span
                className="w-8 shrink-0 text-right pr-4 select-none text-[11px]"
                style={{ color: dark ? "#52525b" : "#d4d4d8" }}
              >
                {i + 1}
              </span>
              <span className="whitespace-pre">
                {line.length === 0
                  ? "\u00A0"
                  : tokenizeLine(line).map((tok, j) => (
                      <span key={j} style={{ color: pal[tok.k as TokenKind] }}>
                        {tok.t}
                      </span>
                    ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   7. ROOT
--------------------------------------------------------------- */

export default function FileTreeCodeViewer() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(new Set(["root/src", "root/src/components"]));
  const [selected, setSelected] = useState("root/src/components/Hero.tsx");
  const [copied, setCopied] = useState(false);

  const visibleTree = useMemo<TreeFolder>(() => (filterTree(TREE, query) as TreeFolder) || { ...TREE, children: [] }, [query]);
  const fileName = selected.split("/").pop() ?? "";

  function toggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  function handleCopy() {
    navigator.clipboard?.writeText(DEMO_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function handleDownload() {
    const blob = new Blob([DEMO_CODE], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className={
        "flex h-dvh w-full overflow-hidden border " +
        (dark ? "border-zinc-800" : "border-zinc-200")
      }
    >
      {/* sidebar */}
      <div
        className={
          "flex w-64 shrink-0 flex-col border-r " +
          (dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50")
        }
      >
        <div className="px-4 py-2.5">
          <InputGroup className="bg-white border-zinc-100 shadow-none px-1">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search02Icon} size={15} strokeWidth={1.8} style={{ color: "#52525b" }} />
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
              selected={selected}
              select={setSelected}
              dark={dark}
              query={query}
            />
          ))}
        </div>
      </div>

      <CodePanel
        dark={dark}
        fileName={fileName}
        copied={copied}
        onCopy={handleCopy}
        onDownload={handleDownload}
      />
    </div>
  );
}