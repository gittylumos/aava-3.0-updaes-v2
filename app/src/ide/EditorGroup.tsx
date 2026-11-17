/* The host editor group: tab strip and the active tab's body (rendered by
   the workbench; code and diff tabs carry their own path row). With nothing
   open, VS Code's empty editor. */
import type { ReactNode } from 'react'
import type { EditorTabKind, Workbench } from './types'

export function EditorGroup({ wb }: { wb: Workbench }) {
  const active = wb.tabs.find((t) => t.id === wb.activeTabId) ?? null

  return (
    <div className="flex h-full min-h-0 flex-col">
      {wb.tabs.length > 0 && (
        <div role="tablist" aria-label="Editor tabs"
          className="flex h-[35px] shrink-0 items-stretch overflow-x-auto overflow-y-hidden"
          style={{ background: 'var(--ground)', borderBottom: '1px solid var(--border)' }}>
          {wb.tabs.map((t) => {
            const on = t.id === wb.activeTabId
            return (
              <div key={t.id} role="presentation"
                className="group relative flex shrink-0 items-center"
                style={{
                  background: on ? 'var(--slab)' : 'var(--ground)',
                  borderRight: '1px solid var(--glass-line)',
                  marginBottom: on ? -1 : 0,
                }}>
                {on && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px" style={{ background: 'var(--text)' }} />}
                <button type="button" role="tab" aria-selected={on} aria-label={t.title}
                  onClick={() => wb.focus(t.id)}
                  className="flex h-full items-center gap-1.5 pl-3 pr-1 text-[13px]"
                  style={{ color: on ? 'var(--text)' : 'var(--muted)' }}>
                  <KindIcon kind={t.kind} />
                  <span className="max-w-[220px] truncate">{t.title}</span>
                </button>
                <button type="button" aria-label={`Close ${t.title}`} title="Close"
                  onClick={() => wb.close(t.id)}
                  className={`mr-1.5 flex h-5 w-5 items-center justify-center rounded-[4px] hover:bg-[var(--wash-4)] ${on ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
                  style={{ color: 'var(--muted)' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
                    <path d="m3 3 6 6M9 3 3 9" />
                  </svg>
                </button>
              </div>
            )
          })}
          <div className="flex-1" />
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden" style={{ background: 'var(--slab)' }}>
        {active && active.kind !== 'welcome' ? wb.renderTab(active) : <Welcome />}
      </div>
    </div>
  )
}

const SHORTCUTS: [string, string][] = [
  ['Show All Commands', '⇧⌘P'],
  ['Go to File', '⌘P'],
  ['Open AAVA', '⌘⇧A'],
  ['Open Settings', '⌘,'],
]

function Welcome() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 select-none" style={{ color: 'var(--muted-deep)' }}>
      <svg width="132" height="132" viewBox="0 0 100 100" fill="none" aria-hidden="true"
        style={{ color: 'var(--wash-6)' }}>
        <path d="M72 8 36 42 16 27 8 31v38l8 4 20-15 36 34 20-9V17L72 8Z" fill="currentColor" />
        <path d="M72 30 47 50l25 20V30ZM16 39v22l11-11-11-11Z" style={{ fill: 'var(--slab)' }} />
      </svg>
      <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2.5 text-[13px]">
        {SHORTCUTS.map(([label, keys]) => (
          <div key={label} className="contents">
            <dt className="text-right">{label}</dt>
            <dd className="mono m-0 tracking-[.12em]">{keys}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function KindIcon({ kind }: { kind: EditorTabKind }): ReactNode {
  const common = {
    width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    'aria-hidden': true, className: 'shrink-0',
  }
  switch (kind) {
    case 'diff':
      return <svg {...common}><rect x="1.5" y="2.5" width="5.5" height="11" rx="1" /><rect x="9" y="2.5" width="5.5" height="11" rx="1" /></svg>
    case 'browser':
      return <svg {...common}><circle cx="8" cy="8" r="6" /><path d="M2 8h12M8 2c-2 2-2 10 0 12M8 2c2 2 2 10 0 12" /></svg>
    case 'markdown':
      return <span aria-hidden="true" className="mono shrink-0 text-[10px] font-semibold">M↓</span>
    default:
      return <svg {...common}><path d="M4 1.5h5.5L12.5 4.5v10h-8.5Z" /><path d="M9.5 1.5v3h3" /></svg>
  }
}
