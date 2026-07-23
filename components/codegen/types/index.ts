import type { HugeiconsIconProps } from "@hugeicons/react";

export type TreeFile = {
  name: string;
  type: "file";
  hasDemo?: boolean;
};

export type TreeFolder = {
  name: string;
  type: "folder";
  children: TreeNode[];
};

export type TreeNode = TreeFile | TreeFolder;

export type TokenKind =
  | "comment"
  | "string"
  | "jsx"
  | "attr"
  | "number"
  | "hook"
  | "fn"
  | "keyword"
  | "ident"
  | "punct"
  | "plain";

export type Token = {
  t: string;
  k: TokenKind;
};

export type Palette = Record<TokenKind, string>;

export type RowProps = {
  depth: number;
  active: boolean;
  dark: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

export type TreeNodeProps = {
  node: TreeNode;
  depth: number;
  path: string;
  expanded: Set<string>;
  toggle: (path: string) => void;
  selected: string;
  select: (path: string) => void;
  dark: boolean;
  query: string;
};

export type CodePanelProps = {
  dark: boolean;
  fileName: string;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
};

export type FileMetaBadge = {
  kind: "badge";
  label: string;
  color: string;
  bg: string;
};

export type FileMetaIcon = {
  kind: "icon";
  Icon: HugeiconsIconProps["icon"];
  color: string;
};

export type FileMeta = FileMetaBadge | FileMetaIcon;
