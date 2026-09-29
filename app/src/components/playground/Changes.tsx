/* Changes — the working diff, laid out the way Codex and Cursor review one: a
 * scope switch and the running +/− total on top, "Commit or push" on the
 * right, then one row per changed file (dim folder, bright name, its own
 * +/−). A row with a body unfolds into the hunk in place; a file the run
 * actually ships source for also opens in its own editor tab.
 *
 * Everything is read off the scenario — the diff groups name the files, the
 * shipped sources give an added file its lines, and a group's snippet is the
 * hunk of the modified file it belongs to. Nothing here is invented per view.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import type { DiffGroup, PlaygroundState, Scenario } from '../../state/types'
import { useDismiss } from '../../state/useDismiss'
import { fileText } from '../../state/workspace'
import { MiniHeaderBtn, MiniHeaderRow } from './MiniHeader'

type Tone = 'add' | 'del' | 'ctx'
interface Line { tone: Tone; text: string; n: number | null }
interface FileChange {
  path: string
  status: '+' | '~' | '-'
  add: number | null
  del: number | null
  body: Line[] | null
  /** The scenario file this path is — set means it can open in the editor. */
  source: string | null
}
interface RepoChanges { repo: string; branch: string; files: FileChange[] }

const SCOPES = ['Last turn', 'Uncommitted', 'Unstaged', 'Staged', 'Committed', 'Branch'] as const
type Scope = typeof SCOPES[number]
/* Where the menu draws a divider — after "Last turn", after "Staged". */
const RULE_AFTER: Scope[] = ['Last turn', 'Staged']

function changesFor(scenario: Scenario, pg: PlaygroundState): RepoChanges[] {
  return scenario.diff.map((g) => ({ repo: g.repo, branch: g.branch, files: filesOf(g, scenario, pg) }))
}

function filesOf(g: DiffGroup, scenario: Scenario, pg: PlaygroundState): FileChange[] {
  /* The group's snippet, minus its closing "… n files" summary line. */
  const snippet: Line[] = (g.lines ?? [])
    .filter((l) => !(l.tone === 'ctx' && l.text.trim().startsWith('…')))
    .map((l) => ({ tone: l.tone, text: l.text.replace(/^[+\- ] ?/, ''), n: null }))
  let snippetUsed = false

  const out: FileChange[] = []
  for (const raw of g.files) {
    const m = raw.match(/^([+~-])\s+(.+)$/)
    if (!m || /more files?$/.test(m[2])) continue
    const status = m[1] as FileChange['status']
    const path = m[2]
    const base = path.split('/').pop() ?? path
    const source = scenario.files[base] ? base : null
    const stat = g.stats?.[path]

    let body: Line[] | null = null
    if (source && status === '+') {
      /* A new file is all additions — its whole source, numbered. */
      body = fileText(scenario, pg, source).split('\n').map((text, i) => ({ tone: 'add', text, n: i + 1 }))
    } else if (source && status === '~' && !snippetUsed && snippet.some((l) => l.tone !== 'ctx')) {
      /* The group's snippet is the hunk of the modified file the run ships. */
      body = snippet
      snippetUsed = true
    }

    const add = stat?.[0] ?? (body ? body.filter((l) => l.tone === 'add').length : null)
    const del = stat?.[1] ?? (body ? body.filter((l) => l.tone === 'del').length : null)
    out.push({ path, status, add, del, body, source })
  }
  return out
}

export function Changes({ scenario, pg, onOpenFile, onToast }: {
  scenario: Scenario
  pg: PlaygroundState
  onOpenFile: (file: string) => void
  onToast: (text: string) => void
}) {
  const repos = useMemo(() => changesFor(scenario, pg), [scenario, pg])
  const all = repos.flatMap((r) => r.files)
  const firstBody = all.find((f) => f.body)?.path
  const [open, setOpen] = useState<Set<string>>(() => new Set(firstBody ? [firstBody] : []))
  const [scope, setScope] = useState<Scope>('Uncommitted')

  /* Nothing is committed until the run's own gate raises the PRs. */
  const shown = scope === 'Committed' ? [] : repos
  const totalAdd = shown.flatMap((r) => r.files).reduce((s, f) => s + (f.add ?? 0), 0)
  const totalDel = shown.flatMap((r) => r.files).reduce((s, f) => s + (f.del ?? 0), 0)
  const expandable = all.filter((f) => f.body).map((f) => f.path)
  const allOpen = expandable.length > 0 && expandable.every((p) => open.has(p))

  const toggle = (path: string) => setOpen((s) => {
    const next = new Set(s)
    if (next.has(path)) next.delete(path); else next.add(path)
    return next
  })

  const gate = scenario.prep[pg.prepAt]?.gate
  const commit = (what: string) => onToast(gate
    ? `${what} waits on your approval — step ${pg.prepAt + 1} is open in the conversation.`
    : `${what} — done on ${repos[0]?.branch ?? 'the branch'}.`)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MiniHeaderRow>
        <ScopeMenu scope={scope} onScope={setScope} />
        <span className="mono ml-1 text-[11.5px] tabular-nums">
          <span style={{ color: 'var(--ok)' }}>+{totalAdd.toLocaleString()}</span>{' '}
          <span style={{ color: 'var(--danger)' }}>−{totalDel.toLocaleString()}</span>
        </span>
        <div className="ml-auto flex items-center gap-1">
          <MiniHeaderBtn label={allOpen ? 'Collapse all' : 'Expand all'} disabled={!expandable.length}
            onClick={() => setOpen(allOpen ? new Set() : new Set(expandable))}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {allOpen ? <path d="m7 14 5-5 5 5M7 20l5-5 5 5" /> : <path d="m7 4 5 5 5-5M7 10l5 5 5-5" />}
            </svg>
          </MiniHeaderBtn>
          <CommitMenu onPick={commit} />
        </div>
      </MiniHeaderRow>

      <div className="min-h-0 flex-1 overflow-auto py-1">
        {shown.length === 0 && (
          <p className="px-4 py-6 text-[12.5px]" style={{ color: 'var(--muted-deep)' }}>
            Nothing committed on these branches yet.
          </p>
        )}
        {shown.map((r) => (
          <section key={r.repo}>
            {/* Two repos, two PRs — the branch heads its own files. */}
            {shown.length > 1 && (
              <div className="flex items-center gap-2 px-4 pb-1 pt-3 text-[11px]" style={{ color: 'var(--muted-deep)' }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="8" r="2" /><path d="M6 7v10M18 10c0 4-6 3-11 7" />
                </svg>
                <span className="font-medium" style={{ color: 'var(--muted)' }}>{r.repo}</span>
                <span className="mono min-w-0 truncate">{r.branch}</span>
              </div>
            )}
            {r.files.map((f) => (
              <FileRow key={f.path} file={f} open={open.has(f.path)} onToggle={() => toggle(f.path)}
                onOpenFile={f.source ? () => onOpenFile(f.source!) : undefined} />
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}

function FileRow({ file, open, onToggle, onOpenFile }: {
  file: FileChange; open: boolean; onToggle: () => void; onOpenFile?: () => void
}) {
  const cut = file.path.lastIndexOf('/')
  const dir = cut >= 0 ? file.path.slice(0, cut + 1) : ''
  const name = file.path.slice(cut + 1)
  return (
    <div>
      <div className="group flex items-center gap-1 pr-2 transition-colors hover:bg-[var(--wash-2)]">
        <button onClick={file.body ? onToggle : undefined} aria-expanded={file.body ? open : undefined}
          className="flex min-w-0 flex-1 items-center gap-2 py-[7px] pl-3 text-left"
          style={{ cursor: file.body ? 'pointer' : 'default' }}>
          <span className="grid w-3 shrink-0 place-items-center" style={{ color: 'var(--muted-deep)' }}>
            {file.body && (
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
                style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform var(--dur) var(--ease)' }}>
                <path d="m9 6 6 6-6 6" />
              </svg>
            )}
          </span>
          <span className="shrink-0" style={{ color: file.status === '+' ? 'var(--ok)' : file.status === '-' ? 'var(--danger)' : 'var(--warn)' }}
            title={file.status === '+' ? 'Added' : file.status === '-' ? 'Deleted' : 'Modified'}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" />
            </svg>
          </span>
          <span className="mono min-w-0 truncate text-[12px]">
            <span style={{ color: 'var(--muted-deep)' }}>{dir}</span>
            <span style={{ color: 'var(--text)' }}>{name}</span>
          </span>
          {file.add !== null && (
            <span className="mono shrink-0 text-[11.5px] tabular-nums">
              <span style={{ color: 'var(--ok)' }}>+{file.add}</span>{' '}
              <span style={{ color: 'var(--danger)' }}>−{file.del ?? 0}</span>
            </span>
          )}
        </button>
        {onOpenFile && (
          <MiniHeaderBtn label="Open in editor" onClick={onOpenFile}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
            </svg>
          </MiniHeaderBtn>
        )}
      </div>
      {open && file.body && <Hunk lines={file.body} />}
    </div>
  )
}

const HUNK_TONE: Record<Tone, { bg: string; bar: string; sign: string }> = {
  add: { bg: 'color-mix(in srgb, var(--ok) 11%, transparent)', bar: 'var(--ok)', sign: '+' },
  del: { bg: 'color-mix(in srgb, var(--danger) 11%, transparent)', bar: 'var(--danger)', sign: '−' },
  ctx: { bg: 'transparent', bar: 'transparent', sign: ' ' },
}

function Hunk({ lines }: { lines: Line[] }) {
  return (
    <div className="mono mx-3 mb-2 mt-0.5 overflow-x-auto rounded-[8px] py-1 text-[11.5px] leading-[1.75]"
      style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
      {lines.map((l, i) => {
        const t = HUNK_TONE[l.tone]
        return (
          <div key={i} className="flex min-w-max" style={{ background: t.bg, boxShadow: `inset 2px 0 0 ${t.bar}` }}>
            <span className="w-10 shrink-0 select-none pr-2 text-right tabular-nums" style={{ color: 'var(--muted-deep)' }}>{l.n ?? ''}</span>
            <span className="w-4 shrink-0 select-none" style={{ color: t.bar === 'transparent' ? 'var(--muted-deep)' : t.bar }}>{t.sign}</span>
            <span className="whitespace-pre pr-4" style={{ color: l.tone === 'ctx' ? 'var(--muted)' : 'var(--text-dim)' }}>{l.text || ' '}</span>
          </div>
        )
      })}
    </div>
  )
}

/* "Uncommitted ⌄" — which slice of the work the list shows. */
function ScopeMenu({ scope, onScope }: { scope: Scope; onScope: (s: Scope) => void }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(open, root, useCallback(() => setOpen(false), []))
  return (
    <div ref={root} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        className="press flex h-7 items-center gap-1 rounded-[7px] px-2 text-[12.5px] font-medium transition-colors hover:bg-[var(--wash-4)]"
        style={{ color: 'var(--text)', background: open ? 'var(--wash-4)' : undefined }}>
        {scope}
        <Chevron />
      </button>
      {open && (
        <Menu className="left-0">
          {SCOPES.map((s) => (
            <div key={s}>
              <MenuItem onClick={() => { onScope(s); setOpen(false) }}>
                <span className="flex-1">{s}</span>
                {s === scope && (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
                )}
              </MenuItem>
              {RULE_AFTER.includes(s) && <div className="mx-2 my-1 border-t" style={{ borderColor: 'var(--glass-line-soft)' }} />}
            </div>
          ))}
        </Menu>
      )}
    </div>
  )
}

function CommitMenu({ onPick }: { onPick: (what: string) => void }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(open, root, useCallback(() => setOpen(false), []))
  return (
    <div ref={root} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        className="press flex h-7 items-center gap-1.5 rounded-[8px] px-2.5 text-[12px] font-medium transition-colors hover:bg-[var(--wash-4)]"
        style={{ color: 'var(--text)', border: '1px solid var(--glass-line)' }}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="3.5" /><path d="M2 12h6.5M15.5 12H22" />
        </svg>
        Commit or push
        <Chevron />
      </button>
      {open && (
        <Menu className="right-0">
          {['Commit', 'Commit and push', 'Create pull request'].map((what) => (
            <MenuItem key={what} onClick={() => { onPick(what); setOpen(false) }}>{what}</MenuItem>
          ))}
        </Menu>
      )}
    </div>
  )
}

function Menu({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div role="menu" className={`absolute top-[calc(100%+6px)] z-30 w-[200px] rounded-[12px] p-1.5 shadow-lg ${className}`}
      style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
      {children}
    </div>
  )
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button role="menuitem" onClick={onClick}
      className="press flex w-full items-center gap-2 rounded-[8px] px-2.5 py-[7px] text-left text-[12.5px] transition-colors hover:bg-[var(--glass)]"
      style={{ color: 'var(--text-dim)' }}>
      {children}
    </button>
  )
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ color: 'var(--muted)' }}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
