/* A tool-step result that touched files gets a diff chip instead of plain
 * text — a compact "N files changed" pill with the +/- delta, that reveals
 * the actual changed lines on hover. Portaled to document.body so it always
 * escapes the accordion's rounded-corner overflow-hidden rather than getting
 * clipped by it, and positioned from the trigger's own rect since a portal
 * can't rely on CSS anchoring to its original parent. */
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type DiffLine = { tone: 'ctx' | 'del' | 'add'; text: string }

const TONE = {
  ctx: { color: 'var(--muted-deep)', background: 'transparent' },
  del: { color: 'var(--danger)', background: 'rgba(255,107,107,.08)' },
  add: { color: 'var(--ok)', background: 'rgba(74,222,128,.10)' },
}

export function FileDiffChip({ result, lines, onOpen }: { result: string; lines: DiffLine[]; onOpen?: () => void }) {
  const [hover, setHover] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const ref = useRef<HTMLButtonElement>(null)
  /* The popover is portaled to <body>, so it sits outside the trigger's own DOM
     subtree — moving the mouse from the trigger toward it would otherwise fire
     the trigger's onMouseLeave first and unmount the popover before the pointer
     ever reaches it. A short close-delay, cancelled by either side's mouseenter,
     lets the cursor cross the gap. */
  const closeTimer = useRef<number | undefined>(undefined)
  const added = lines.filter((l) => l.tone === 'add').length
  const removed = lines.filter((l) => l.tone === 'del').length

  const show = () => {
    window.clearTimeout(closeTimer.current)
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setPos({ left: Math.min(r.left, window.innerWidth - 340), top: r.bottom + 6 })
    setHover(true)
  }
  const scheduleHide = () => {
    closeTimer.current = window.setTimeout(() => setHover(false), 150)
  }

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={scheduleHide}>
      <button
        ref={ref}
        type="button"
        onClick={onOpen}
        className="press mono inline-flex h-[19px] shrink-0 items-center gap-1.5 rounded-[6px] px-[6px] text-[10.5px] font-medium transition-colors"
        style={{ background: 'var(--wash-3)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}
      >
        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" />
        </svg>
        {result}
        {(added > 0 || removed > 0) && (
          <span className="flex items-center gap-[3px]">
            {added > 0 && <span style={{ color: 'var(--ok)' }}>+{added}</span>}
            {removed > 0 && <span style={{ color: 'var(--danger)' }}>-{removed}</span>}
          </span>
        )}
      </button>

      {hover && pos && createPortal(
        <div
          role="tooltip"
          onMouseEnter={show}
          onMouseLeave={scheduleHide}
          className="fixed z-[80] w-[320px] overflow-hidden rounded-[10px] shadow-xl"
          style={{ left: pos.left, top: pos.top, background: 'var(--slab-raised)', border: '1px solid var(--glass-line)', animation: 'aava-pop-in 140ms var(--ease-out) both' }}
        >
          <div className="flex items-center justify-between px-2.5 py-1.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
            <span className="text-[10.5px] font-semibold uppercase tracking-[.06em]" style={{ color: 'var(--muted)' }}>Working diff</span>
            {onOpen && (
              <button type="button" onClick={onOpen} className="press text-[11px] font-medium transition-colors" style={{ color: 'var(--brand)' }}>
                Open
              </button>
            )}
          </div>
          <div className="max-h-[220px] overflow-auto p-1.5">
            {lines.map((l, i) => (
              <div key={i} className="mono rounded px-1.5 py-[1px] text-[11px] leading-[1.5] whitespace-pre" style={TONE[l.tone]}>{l.text}</div>
            ))}
          </div>
        </div>,
        document.body,
      )}
      <style>{`@keyframes aava-pop-in { from { opacity: 0; transform: scale(.96) translateY(-2px) } to { opacity: 1; transform: scale(1) translateY(0) } }`}</style>
    </span>
  )
}
