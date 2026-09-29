/* The per-artifact mini-header — the second-level chrome that sits directly
 * under the workspace tab strip and changes with the kind of artifact the
 * active tab holds. The top-level tab already carries the artifact's NAME; this
 * row carries only what that artifact needs to be driven:
 *
 *   browser  → back / forward / refresh, a URL pill, an inline-annotation toggle
 *   file     → nothing on the left, AAVA's own doc actions on the right
 *   terminal → no mini-header at all (the caller simply omits it)
 *
 * It is deliberately generic: a tab body composes `<MiniHeader …/>` above its
 * content, so every canvas that adopts the shell gets the same second-level
 * bar for free.
 */
import { useState } from 'react'
import { Tooltip } from '../chrome/Tooltip'

const svg = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/* One shared row so every mini-header lines up to the same height and hairline. */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[38px] shrink-0 items-center gap-1.5 px-2"
      style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
      {children}
    </div>
  )
}

function MiniBtn({ label, onClick, active, disabled, children }: {
  label: string; onClick?: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode
}) {
  return (
    <Tooltip label={label} side="bottom">
      <button onClick={onClick} disabled={disabled} aria-label={label} aria-pressed={active}
        className="press grid h-7 w-7 shrink-0 place-items-center rounded-[7px] transition-colors disabled:opacity-35 disabled:hover:bg-transparent hover:bg-[var(--wash-4)]"
        style={{ color: active ? 'var(--text)' : 'var(--muted)' }}>
        {children}
      </button>
    </Tooltip>
  )
}

/* The browser mini-header — back / forward / refresh, an address pill, and an
   inline-annotation toggle, matching the reference. Purely a demo surface: the
   controls are affordances over a rendered page, not a real navigation stack. */
export function BrowserMiniHeader({ url, onRefresh }: { url: string; onRefresh?: () => void }) {
  const [annotating, setAnnotating] = useState(false)
  return (
    <Row>
      <MiniBtn label="Back" disabled><svg {...svg} width="15" height="15"><path d="M15 18l-6-6 6-6" /></svg></MiniBtn>
      <MiniBtn label="Forward" disabled><svg {...svg} width="15" height="15"><path d="M9 6l6 6-6 6" /></svg></MiniBtn>
      <MiniBtn label="Refresh" onClick={onRefresh}><svg {...svg} width="15" height="15"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4" /></svg></MiniBtn>
      <div className="mx-1 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-[8px] px-3"
        style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
        <svg {...svg} width="12" height="12" style={{ color: 'var(--muted-deep)' }}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
        <span className="mono min-w-0 flex-1 truncate text-[11.5px]" style={{ color: 'var(--text-dim)' }}>{url}</span>
      </div>
      <MiniBtn label={annotating ? 'Stop annotating' : 'Annotate'} active={annotating} onClick={() => setAnnotating((a) => !a)}>
        <svg {...svg} width="15" height="15"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
      </MiniBtn>
    </Row>
  )
}

/* The file mini-header — the left face is deliberately empty (no breadcrumb, no
   "open in Cursor"); the artifact's name lives on the tab above. AAVA's own doc
   actions are passed in and sit on the right. `left`/`right` let a caller drop
   a Preview/Source switch on the left or comment/download/history on the right
   without this component knowing what they are. */
export function FileMiniHeader({ left, right }: { left?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <Row>
      {left}
      <div className="ml-auto flex items-center gap-1">{right}</div>
    </Row>
  )
}

export { Row as MiniHeaderRow, MiniBtn as MiniHeaderBtn }
