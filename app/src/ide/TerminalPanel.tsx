/* The bottom Panel, on its TERMINAL tab: the integrated terminals AAVA runs in
   (e.g. "AAVA · feedback-form" running `ng serve`). A localhost URL in the
   output opens the Integrated Browser, as VS Code does. */
import { useEffect, useRef, type ReactNode } from 'react'
import type { Workbench } from './types'

const PANEL_TABS = ['Problems', 'Output', 'Debug Console', 'Terminal'] as const
const URL_RE = /(https?:\/\/localhost:\d+\S*)/g

export function TerminalPanel({ wb }: { wb: Workbench }) {
  const term = wb.terminals.find((t) => t.id === wb.activeTerminalId) ?? wb.terminals[0] ?? null
  const bodyRef = useRef<HTMLDivElement>(null)
  const lineCount = term?.lines.length ?? 0

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [term?.id, lineCount])

  const linkify = (line: string): ReactNode[] =>
    line.split(URL_RE).map((part, i) => (i % 2 === 1
      ? (
        <button key={i} type="button" aria-label={`Open ${part} in the Integrated Browser`}
          onClick={() => wb.openCanvasTab('preview')}
          className="cursor-pointer underline underline-offset-2">
          {part}
        </button>
      )
      : part))

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: 'var(--slab)' }}>
      <div className="flex h-[35px] shrink-0 items-center gap-1 pl-2 pr-1">
        <div role="tablist" aria-label="Panel" className="flex h-full items-stretch">
          {PANEL_TABS.map((label) => {
            const on = label === 'Terminal'
            return (
              <button key={label} type="button" role="tab" aria-selected={on}
                className="relative px-2.5 text-[11px] uppercase tracking-[.06em]"
                style={{ color: on ? 'var(--text)' : 'var(--muted-deep)' }}>
                {label}
                {on && <span aria-hidden="true" className="absolute inset-x-2.5 bottom-[6px] h-px" style={{ background: 'var(--text)' }} />}
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-1">
          {wb.terminals.length > 0 && (
            <ul aria-label="Terminals" className="flex min-w-0 items-center gap-1 overflow-x-auto">
              {wb.terminals.map((t) => {
                const on = t.id === term?.id
                return (
                  <li key={t.id}
                    className="flex h-[22px] shrink-0 items-center gap-1.5 rounded-[3px] px-2 text-[12px]"
                    style={{
                      background: on ? 'var(--wash-4)' : 'transparent',
                      color: on ? 'var(--text)' : 'var(--muted)',
                    }}
                    aria-current={on ? 'true' : undefined}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"
                      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m2 3 3 3-3 3M6.5 9.5H10" />
                    </svg>
                    <span className="max-w-[200px] truncate">{t.title}</span>
                  </li>
                )
              })}
            </ul>
          )}
          <button type="button" aria-label="Close Panel" title="Close Panel"
            onClick={() => wb.setPanelOpen(false)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] hover:bg-[var(--wash-4)]"
            style={{ color: 'var(--muted)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
              <path d="m3 3 6 6M9 3 3 9" />
            </svg>
          </button>
        </div>
      </div>

      <div ref={bodyRef} role="log" aria-label={term ? `Terminal: ${term.title}` : 'Terminal'}
        className="mono min-h-0 flex-1 overflow-y-auto px-3 py-2 text-[12px] leading-[1.5]"
        style={{ background: 'var(--code-bg)', color: '#e5e5e5' }}>
        {term
          ? term.lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-words">{line === '' ? ' ' : linkify(line)}</div>
          ))
          : <div style={{ opacity: 0.6 }}>No terminal is running.</div>}
      </div>
    </div>
  )
}
