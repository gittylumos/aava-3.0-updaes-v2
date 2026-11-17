/* The Explorer view: the open project's file tree. The scenario's files sit at
   `scenario.fileRoot` (where the prep step said it found them), inside a
   plausible Angular repo, and are the only clickable entries. AAVA-changed
   files carry a git-style "M". With no scenario open the tree is static. */
import { useMemo, useState } from 'react'
import type { Scenario } from '../state/types'

/** The rest of the repo, for context. Non-interactive. */
const STATIC_PATHS = [
  'src/app/app.component.html',
  'src/app/app.component.scss',
  'src/app/app.component.ts',
  'src/app/app.config.ts',
  'src/app/app.routes.ts',
  'src/app/shared/header/header.component.ts',
  'src/app/shared/footer/footer.component.ts',
  'src/assets/logo.svg',
  'src/environments/environment.ts',
  'src/index.html',
  'src/main.ts',
  'src/styles.scss',
  '.editorconfig',
  '.gitignore',
  'angular.json',
  'package.json',
  'README.md',
  'tsconfig.json',
]

interface Node {
  name: string
  path: string
  /** Folders only. */
  children?: Node[]
  /** Scenario file name (key of scenario.files) — makes the row clickable. */
  file?: string
  /** AAVA touched this file, or something inside this folder. */
  changed?: boolean
}

function insert(root: Node, path: string, file?: string) {
  const parts = path.split('/').filter(Boolean)
  let dir = root
  parts.forEach((name, i) => {
    const full = parts.slice(0, i + 1).join('/')
    const leaf = i === parts.length - 1
    if (file) dir.changed = true
    let next = dir.children!.find((c) => c.name === name)
    if (!next) {
      next = leaf ? { name, path: full } : { name, path: full, children: [] }
      dir.children!.push(next)
    }
    if (leaf && file) { next.file = file; next.changed = true }
    dir = next
  })
}

function sort(n: Node) {
  if (!n.children) return
  n.children.sort((a, b) => (!!b.children === !!a.children
    ? a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    : a.children ? -1 : 1))
  n.children.forEach(sort)
}

function buildTree(scenario: Scenario | null): Node {
  const root: Node = { name: 'PRODUCT-WEB', path: '', children: [] }
  STATIC_PATHS.forEach((p) => insert(root, p))
  if (scenario && scenario.fileOrder.length) {
    const base = scenario.fileRoot?.split('/').filter(Boolean).join('/') ?? ''
    scenario.fileOrder.forEach((f) => insert(root, base ? `${base}/${f}` : f, f))
  }
  sort(root)
  return root
}

export function Explorer({ scenario, onOpenFile }: { scenario: Scenario | null; onOpenFile: (file: string) => void }) {
  const tree = useMemo(() => buildTree(scenario), [scenario])
  /* Default expanded: track only what the user collapsed. */
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const toggle = (path: string) => setCollapsed((s) => {
    const n = new Set(s)
    if (n.has(path)) n.delete(path)
    else n.add(path)
    return n
  })

  const rootOpen = !collapsed.has(tree.path)

  return (
    <div role="tree" aria-label="Files" className="pb-2 text-[13px]">
      <button type="button" aria-expanded={rootOpen} aria-label={`${rootOpen ? 'Collapse' : 'Expand'} PRODUCT-WEB`}
        onClick={() => toggle(tree.path)}
        className="flex h-[22px] w-full items-center gap-0.5 px-1 text-left text-[11px] font-semibold uppercase tracking-[.04em] hover:bg-[var(--wash-3)]"
        style={{ color: 'var(--text-dim)' }}>
        <Chevron open={rootOpen} />
        {tree.name}
      </button>
      {rootOpen && tree.children!.map((c) => (
        <Row key={c.path} node={c} depth={0} collapsed={collapsed} onToggle={toggle} onOpenFile={onOpenFile} />
      ))}
    </div>
  )
}

function Row({ node, depth, collapsed, onToggle, onOpenFile }: {
  node: Node
  depth: number
  collapsed: Set<string>
  onToggle: (path: string) => void
  onOpenFile: (file: string) => void
}) {
  const pad = 8 + depth * 8
  const base = 'flex h-[22px] w-full items-center gap-1 pr-2 text-left'

  if (node.children) {
    const open = !collapsed.has(node.path)
    return (
      <div role="treeitem" aria-expanded={open}>
        <button type="button" aria-label={`${open ? 'Collapse' : 'Expand'} folder ${node.name}`}
          onClick={() => onToggle(node.path)}
          className={`${base} hover:bg-[var(--wash-3)]`}
          style={{ paddingLeft: pad, color: 'var(--text-dim)' }}>
          <Chevron open={open} />
          <span className="min-w-0 flex-1 truncate">{node.name}</span>
          {node.changed && <span aria-hidden="true" className="shrink-0 text-[9px]" style={{ color: 'var(--muted)' }}>●</span>}
        </button>
        {open && node.children.map((c) => (
          <Row key={c.path} node={c} depth={depth + 1} collapsed={collapsed} onToggle={onToggle} onOpenFile={onOpenFile} />
        ))}
      </div>
    )
  }

  const inner = (
    <>
      <span className="w-4 shrink-0" />
      <FileGlyph name={node.name} />
      <span className="min-w-0 flex-1 truncate">{node.name}</span>
      {node.changed && <span className="mono shrink-0 text-[11px] font-semibold" style={{ color: 'var(--text)' }} title="Modified by AAVA">M</span>}
    </>
  )

  if (node.file) {
    const file = node.file
    return (
      <div role="treeitem">
        <button type="button" aria-label={`Open ${node.name}${node.changed ? ', modified' : ''}`}
          onClick={() => onOpenFile(file)}
          className={`${base} hover:bg-[var(--wash-3)]`}
          style={{ paddingLeft: pad, color: 'var(--text)' }}>
          {inner}
        </button>
      </div>
    )
  }

  return (
    <div role="treeitem" className={base} style={{ paddingLeft: pad, color: 'var(--muted)' }}>
      {inner}
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0"
      style={{ transform: open ? 'rotate(90deg)' : undefined }}>
      <path d="m6 4 4 4-4 4" />
    </svg>
  )
}

/** Tiny extension mark in place of VS Code's coloured file-type icons. */
function FileGlyph({ name }: { name: string }) {
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
  const mark: Record<string, string> = { ts: 'TS', html: '<>', scss: '#', css: '#', json: '{}', md: 'M↓', svg: '◇' }
  return (
    <span aria-hidden="true" className="mono w-[18px] shrink-0 text-center text-[9px] font-semibold"
      style={{ color: 'var(--muted-deep)' }}>
      {mark[ext] ?? '·'}
    </span>
  )
}
