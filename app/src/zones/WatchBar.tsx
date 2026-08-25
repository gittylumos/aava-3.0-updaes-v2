/* The Watch zone, as a thin bottom bar.
 *
 * "What is happening?" — always present at the foot of the workspace, but quiet:
 * a single-line strip showing the latest run-log entry. Click it to expand the
 * full log; it also opens itself the moment an error or retry lands, because
 * that is the one time the log needs to be seen without being asked for.
 * Append-only and never interactive beyond expand/collapse (deck: Run log,
 * Errors and retries, Append-only, Never interactive).
 */
import { useEffect, useRef, useState } from 'react'
import type { WatchEntry } from '../state/types'

const TONE: Record<WatchEntry['tone'], string> = {
  info: 'var(--muted)',
  ok: 'var(--ok)',
  warn: 'var(--warn)',
}

export function WatchBar({ entries }: { entries: WatchEntry[] }) {
  const [open, setOpen] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const seenErrors = useRef(0)

  // Auto-open when a new error/retry (warn) entry arrives.
  useEffect(() => {
    const errors = entries.filter((e) => e.tone === 'warn').length
    if (errors > seenErrors.current) setOpen(true)
    seenErrors.current = errors
  }, [entries])

  useEffect(() => { if (open) end.current?.scrollIntoView({ block: 'end' }) }, [entries.length, open])

  const latest = entries.at(-1)
  const hasError = entries.some((e) => e.tone === 'warn')

  return (
    <section
      aria-label="Watch — run log"
      className="shrink-0"
      style={{ borderTop: '1px solid var(--glass-line-soft)', background: 'var(--zone-watch-tint)' }}
    >
      {/* The always-visible strip. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="press flex w-full items-center gap-2 px-3 py-1.5 text-left"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: hasError ? 'var(--warn)' : 'var(--zone-watch-accent)' }} aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-[.13em]" style={{ color: 'var(--muted)' }}>Watch</span>
        <span className="mono min-w-0 flex-1 truncate text-[11.5px]"
          style={{ color: latest ? (latest.tone === 'info' ? 'var(--text-dim)' : TONE[latest.tone]) : 'var(--muted-deep)' }}>
          {latest ? latest.text : 'Waiting for the run to start…'}
        </span>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden
          style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur)' }}>
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>

      {/* The full log, when expanded. */}
      {open && (
        <div className="max-h-[168px] overflow-y-auto px-3 pb-2" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>
          {entries.length === 0 ? (
            <p className="mono py-2 text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>No entries yet.</p>
          ) : (
            <ol className="space-y-1 py-2">
              {entries.map((e) => (
                <li key={e.id} className="mono flex gap-2 text-[11.5px] leading-[1.5]">
                  <span aria-hidden style={{ color: TONE[e.tone] }}>›</span>
                  <span style={{ color: e.tone === 'info' ? 'var(--text-dim)' : TONE[e.tone] }}>{e.text}</span>
                </li>
              ))}
            </ol>
          )}
          <div ref={end} />
        </div>
      )}
    </section>
  )
}
