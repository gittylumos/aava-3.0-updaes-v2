/* Inline source citations — a compact pill (logo + label) that sits in the flow
 * of a sentence or a tool-step result, the way a cited source shows up inline
 * rather than as a footnote. Hovering shows a small preview card (what it is,
 * where it's from); clicking opens it — in a scenario, that's usually the
 * right-panel context pane or the relevant tab, wired by the caller via
 * `onOpen`. Same primitive everywhere a run cites something it read: a Jira
 * ticket, a Figma frame, a GitHub PR, a Confluence page. */
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { JiraLogo } from './Blocks'

export type SourceKind = 'jira' | 'figma' | 'github' | 'confluence' | 'azure'

export interface InlineSourceRef {
  kind: SourceKind
  /** Shown in the pill — the short handle, e.g. "MOB-2841" or "Feedback Form v3". */
  label: string
  /** Hover-preview heading — the fuller name of the thing being cited. */
  title: string
  /** Hover-preview subtitle — what it is / where it lives. */
  meta: string
  /** A citation's fuller hover-preview body, in place of the one-line `meta` —
      what CitationPills shows under the title. */
  description?: string
  /** A citation's hover-preview footer, e.g. "Opened Sep 8, 2026". */
  date?: string
}

function FigmaLogo({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 36" width={size} height={size * 1.5} aria-hidden>
      <path fill="#0ACF83" d="M6 36a6 6 0 0 0 6-6v-6H6a6 6 0 0 0 0 12Z" />
      <path fill="#A259FF" d="M0 18a6 6 0 0 1 6-6h6v12H6a6 6 0 0 1-6-6Z" />
      <path fill="#F24E1E" d="M0 6a6 6 0 0 1 6-6h6v12H6a6 6 0 0 1-6-6Z" />
      <path fill="#FF7262" d="M12 0h6a6 6 0 0 1 0 12h-6V0Z" />
      <path fill="#1ABCFE" d="M24 18a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" />
    </svg>
  )
}
function GitHubLogo({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden style={{ color: 'var(--text)' }}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2 0 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.4-1.3-5.4-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.6 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  )
}
function ConfluenceLogo({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <defs>
        <linearGradient id="confl-grad-a" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0" stopColor="#0052CC" /><stop offset="1" stopColor="#2684FF" />
        </linearGradient>
        <linearGradient id="confl-grad-b" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0" stopColor="#0052CC" /><stop offset="1" stopColor="#2684FF" />
        </linearGradient>
      </defs>
      <path fill="url(#confl-grad-a)" d="M4 21.5c-.6 1-.2 2.2.7 2.8l6.5 4c1 .6 2.3.3 2.9-.6l4.4-7.1c-4.6-2.3-9.8-2.6-14.5.9Z" />
      <path fill="url(#confl-grad-b)" d="M28 10.5c.6-1 .2-2.2-.7-2.8l-6.5-4c-1-.6-2.3-.3-2.9.6l-4.4 7.1c4.6 2.3 9.8 2.6 14.5-.9Z" />
    </svg>
  )
}

export const SOURCE_META: Record<SourceKind, { name: string; Logo: (p: { size?: number }) => React.JSX.Element; tint: string }> = {
  jira: { name: 'Jira', Logo: JiraLogo, tint: '#2684FF' },
  figma: { name: 'Figma', Logo: FigmaLogo, tint: '#A259FF' },
  github: { name: 'GitHub', Logo: GitHubLogo, tint: 'var(--muted)' },
  confluence: { name: 'Confluence', Logo: ConfluenceLogo, tint: '#2684FF' },
  azure: { name: 'Azure DevOps', Logo: ConfluenceLogo, tint: '#0078D4' },
}

export function InlineSource({ source, onOpen }: { source: InlineSourceRef; onOpen?: () => void }) {
  const [hover, setHover] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const ref = useRef<HTMLButtonElement>(null)
  /* Portaled (see FileDiffChip) so a pill sitting inside a collapsible
     accordion's overflow-hidden shell doesn't get its preview card clipped —
     confirmed live: the un-portaled version cut the card off mid-word. The
     close-delay lets the cursor cross the gap to the portaled card without it
     unmounting out from under the pointer. */
  const closeTimer = useRef<number | undefined>(undefined)
  const meta = SOURCE_META[source.kind]

  const show = () => {
    window.clearTimeout(closeTimer.current)
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setPos({ left: Math.min(r.left, window.innerWidth - 232), top: r.bottom + 6 })
    setHover(true)
  }
  const scheduleHide = () => { closeTimer.current = window.setTimeout(() => setHover(false), 150) }

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={scheduleHide}>
      <button
        ref={ref}
        type="button"
        onClick={onOpen}
        className="press mono inline-flex h-[19px] shrink-0 translate-y-[-1px] items-center gap-1 rounded-[6px] px-[5px] align-middle text-[10.5px] font-medium transition-colors"
        style={{ background: 'var(--wash-3)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}
      >
        <meta.Logo size={11} />
        {source.label}
      </button>

      {hover && pos && createPortal(
        <div
          role="tooltip"
          onMouseEnter={show}
          onMouseLeave={scheduleHide}
          className="fixed z-[80] w-[220px] overflow-hidden rounded-[10px] shadow-xl"
          style={{ left: pos.left, top: pos.top, background: 'var(--slab-raised)', border: '1px solid var(--glass-line)', animation: 'aava-pop-in 140ms var(--ease-out) both' }}
        >
          <div className="flex items-center gap-2 px-2.5 py-2" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px]" style={{ background: 'var(--wash-3)' }}>
              <meta.Logo size={13} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-[.06em]" style={{ color: meta.tint }}>{meta.name}</span>
          </div>
          <div className="px-2.5 py-2">
            <div className="truncate text-[12.5px] font-medium" style={{ color: 'var(--text)' }}>{source.title}</div>
            <div className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--muted)' }}>{source.meta}</div>
          </div>
          {onOpen && (
            <button type="button" onClick={onOpen}
              className="press flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[11.5px] font-medium transition-colors hover:bg-[var(--wash-3)]"
              style={{ borderTop: '1px solid var(--glass-line-soft)', color: 'var(--brand)' }}>
              Open
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          )}
        </div>,
        document.body,
      )}
      <style>{`@keyframes aava-pop-in { from { opacity: 0; transform: scale(.96) translateY(-2px) } to { opacity: 1; transform: scale(1) translateY(0) } }`}</style>
    </span>
  )
}

/* Citations at the end of a claim — "MOB-2841 matched the Feedback Form v3
   frame cleanly. [Jira] [Figma]" — the way a cited source trails the sentence
   it backs, rather than living inside a tool-step's own row. Each source gets
   its own small pill (so "which source says what" stays legible at a glance);
   hovering any one of them opens a shared preview card with prev/next paging
   across every source in the group, so the reader can sweep through all of
   them from a single hover without moving the pointer between pills. */
export function CitationPills({ sources, onOpen }: { sources: InlineSourceRef[]; onOpen?: (source: InlineSourceRef) => void }) {
  const [openAt, setOpenAt] = useState<number | null>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([])
  const closeTimer = useRef<number | undefined>(undefined)

  const show = (i: number) => {
    window.clearTimeout(closeTimer.current)
    const r = pillRefs.current[i]?.getBoundingClientRect()
    if (!r) return
    setPos({ left: Math.min(r.left, window.innerWidth - 268), top: r.bottom + 6 })
    setOpenAt(i)
  }
  const scheduleHide = () => { closeTimer.current = window.setTimeout(() => setOpenAt(null), 150) }
  const step = (delta: number) => setOpenAt((n) => ((n ?? 0) + delta + sources.length) % sources.length)

  if (sources.length === 0) return null
  const active = openAt != null ? sources[openAt] : null
  const activeMeta = active ? SOURCE_META[active.kind] : null

  return (
    <span className="ml-1.5 inline-flex flex-wrap items-center gap-1.5 align-middle">
      {sources.map((s, i) => {
        const meta = SOURCE_META[s.kind]
        return (
          <button
            key={i}
            ref={(el) => { pillRefs.current[i] = el }}
            type="button"
            onMouseEnter={() => show(i)}
            onMouseLeave={scheduleHide}
            onClick={() => onOpen?.(s)}
            className="press inline-flex h-[24px] shrink-0 items-center gap-1.5 rounded-full py-[3px] pl-[3px] pr-2.5 align-middle text-[12px] font-medium transition-colors"
            style={{ background: 'var(--wash-3)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}
          >
            <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full" style={{ background: 'var(--wash-4)' }}>
              <meta.Logo size={10} />
            </span>
            {meta.name}
          </button>
        )
      })}

      {active && activeMeta && pos && createPortal(
        <div
          role="tooltip"
          onMouseEnter={() => show(openAt!)}
          onMouseLeave={scheduleHide}
          className="fixed z-[80] w-[260px] overflow-hidden rounded-[12px] shadow-xl"
          style={{ left: pos.left, top: pos.top, background: 'var(--slab-raised)', border: '1px solid var(--glass-line)', animation: 'aava-pop-in 140ms var(--ease-out) both' }}
        >
          {sources.length > 1 && (
            <div className="flex items-center justify-between px-2 pt-2">
              <div className="flex items-center gap-0.5">
                <button type="button" aria-label="Previous source" onClick={() => step(-1)}
                  className="press grid size-[20px] place-items-center rounded-full transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}>
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
                </button>
                <button type="button" aria-label="Next source" onClick={() => step(1)}
                  className="press grid size-[20px] place-items-center rounded-full transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}>
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </div>
              <span className="mono text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{openAt! + 1}/{sources.length}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-2.5 pb-1 pt-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px]" style={{ background: 'var(--wash-3)' }}>
              <activeMeta.Logo size={13} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-[.06em]" style={{ color: activeMeta.tint }}>{activeMeta.name}</span>
          </div>
          <div className="px-2.5 pb-2 pt-1">
            <div className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--text)' }}>{active.title}</div>
            {(active.description ?? active.meta) && (
              <div className="mt-1 text-[11.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>{active.description ?? active.meta}</div>
            )}
            {active.date && <div className="mt-1.5 text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{active.date}</div>}
          </div>
          {/* Open on every source, not just some — a reader can follow any
              citation to its origin (the tracker, the frame, the PR). */}
          <button type="button" onClick={() => onOpen?.(active)}
            className="press flex w-full items-center gap-1.5 px-2.5 py-2 text-left text-[11.5px] font-medium transition-colors hover:bg-[var(--wash-3)]"
            style={{ borderTop: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>
            Open in {activeMeta.name}
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>,
        document.body,
      )}
      <style>{`@keyframes aava-pop-in { from { opacity: 0; transform: scale(.96) translateY(-2px) } to { opacity: 1; transform: scale(1) translateY(0) } }`}</style>
    </span>
  )
}

/* Every scenario already names a tool step's source as a plain string (Jira,
   Figma, GitHub, Confluence, Azure DevOps — see ToolStep.source). This maps
   that string straight to a registered logo, so a step can upgrade its own
   result into a rich pill without a scenario needing to know InlineSource
   exists — a source that isn't one of these still renders as plain text. */
export function sourceKindOf(source: string): SourceKind | null {
  const s = source.toLowerCase()
  if (s === 'jira') return 'jira'
  if (s === 'figma') return 'figma'
  if (s === 'github') return 'github'
  if (s === 'confluence') return 'confluence'
  if (s === 'azure devops' || s === 'azure') return 'azure'
  return null
}
