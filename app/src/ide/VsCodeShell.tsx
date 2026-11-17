/* The VS Code window the AAVA extension lives in: title bar, Activity Bar,
   Primary Sidebar (Explorer), editor group, bottom Panel, Secondary Sidebar
   (AAVA, on the right) and Status Bar. Presentational: every region's content
   comes in as props; only the primary sidebar's open/closed view is local. */
import { useState, type ReactNode } from 'react'

type SideView = 'explorer' | 'search' | 'scm' | 'run' | 'extensions'

const VIEW_LABEL: Record<SideView, string> = {
  explorer: 'Explorer',
  search: 'Search',
  scm: 'Source Control',
  run: 'Run and Debug',
  extensions: 'Extensions',
}

const LINE = '1px solid var(--border)'
const LINE_SOFT = '1px solid var(--glass-line)'

export function VsCodeShell(props: {
  title: string
  activityBadge: number
  auxOpen: boolean
  onAavaActivity: () => void
  explorer: ReactNode
  editor: ReactNode
  panel: ReactNode | null
  aux: ReactNode
  statusLeft: ReactNode
  statusRight: ReactNode
}) {
  const { title, activityBadge, auxOpen, onAavaActivity, explorer, editor, panel, aux, statusLeft, statusRight } = props
  const [view, setView] = useState<SideView>('explorer')
  const [sideOpen, setSideOpen] = useState(true)

  /* VS Code: clicking the active view's icon collapses the sidebar; another
     icon switches to that view (and reopens the sidebar). */
  const pick = (v: SideView) => {
    if (v === view) setSideOpen((o) => !o)
    else { setView(v); setSideOpen(true) }
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden text-[13px] leading-[1.4]"
      style={{ background: 'var(--ground)', color: 'var(--text)', fontFamily: 'var(--font-ui)', letterSpacing: 0 }}>

      {/* Title bar */}
      <header className="relative flex h-[30px] shrink-0 items-center px-3 select-none"
        style={{ background: 'var(--ground)', borderBottom: LINE }}>
        <div className="flex items-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-3 w-3 rounded-full"
              style={{ background: 'var(--wash-6)', border: '1px solid var(--border)' }} />
          ))}
        </div>
        <p className="pointer-events-none absolute inset-x-0 text-center text-[12px] truncate px-24"
          style={{ color: 'var(--muted)' }}>{title}</p>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Activity Bar */}
        <nav aria-label="Activity Bar" className="flex w-12 shrink-0 flex-col items-center justify-between py-1"
          style={{ background: 'var(--ground)', borderRight: LINE }}>
          <div className="flex flex-col items-center">
            <ActivityItem label="Explorer" active={sideOpen && view === 'explorer'} onClick={() => pick('explorer')}><IconFiles /></ActivityItem>
            <ActivityItem label="Search" active={sideOpen && view === 'search'} onClick={() => pick('search')}><IconSearch /></ActivityItem>
            <ActivityItem label="Source Control" active={sideOpen && view === 'scm'} onClick={() => pick('scm')}><IconScm /></ActivityItem>
            <ActivityItem label="Run and Debug" active={sideOpen && view === 'run'} onClick={() => pick('run')}><IconRun /></ActivityItem>
            <ActivityItem label="Extensions" active={sideOpen && view === 'extensions'} onClick={() => pick('extensions')}><IconExtensions /></ActivityItem>
            <ActivityItem
              label={activityBadge > 0 ? `AAVA, ${activityBadge} unread` : 'AAVA'}
              active={auxOpen} onClick={onAavaActivity} badge={activityBadge}>
              <IconAava />
            </ActivityItem>
          </div>
          <div className="flex flex-col items-center">
            <ActivityItem label="Accounts" onClick={() => {}}><IconAccount /></ActivityItem>
            <ActivityItem label="Manage" onClick={() => {}}><IconGear /></ActivityItem>
          </div>
        </nav>

        {/* Primary Sidebar */}
        {sideOpen && (
          <aside aria-label={VIEW_LABEL[view]} className="flex w-[240px] shrink-0 flex-col overflow-hidden"
            style={{ background: 'var(--ground)', borderRight: LINE }}>
            <p className="flex h-[35px] shrink-0 items-center px-5 text-[11px] uppercase tracking-[.08em]"
              style={{ color: 'var(--muted)' }}>{VIEW_LABEL[view]}</p>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {view === 'explorer'
                ? explorer
                : <p className="px-5 py-2 text-[12px]" style={{ color: 'var(--muted-deep)' }}>
                    {VIEW_LABEL[view]} is not part of this demo.
                  </p>}
            </div>
          </aside>
        )}

        {/* Editor group + bottom Panel */}
        <main className="flex min-w-0 flex-1 flex-col" style={{ background: 'var(--slab)' }}>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{editor}</div>
          {panel && (
            <section aria-label="Panel" className="flex h-[200px] shrink-0 flex-col overflow-hidden"
              style={{ borderTop: LINE }}>
              {panel}
            </section>
          )}
        </main>

        {/* Secondary Sidebar: the AAVA view */}
        {auxOpen && (
          <aside aria-label="AAVA" className="flex w-[380px] min-w-[320px] shrink-0 flex-col overflow-hidden"
            style={{ background: 'var(--ground)', borderLeft: LINE }}>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{aux}</div>
          </aside>
        )}
      </div>

      {/* Status Bar */}
      <footer className="flex h-[22px] shrink-0 items-center justify-between gap-4 px-2 text-[12px]"
        style={{ background: 'var(--slab)', color: 'var(--text-dim)', borderTop: LINE_SOFT }}>
        <div className="flex min-w-0 items-center gap-3">{statusLeft}</div>
        <div className="flex min-w-0 items-center gap-3">{statusRight}</div>
      </footer>
    </div>
  )
}

function ActivityItem({ label, active = false, onClick, badge = 0, children }: {
  label: string
  active?: boolean
  onClick: () => void
  badge?: number
  children: ReactNode
}) {
  return (
    <button type="button" aria-label={label} title={label} aria-pressed={active} onClick={onClick}
      className="relative flex h-12 w-12 items-center justify-center transition-colors hover:text-[var(--text)]"
      style={{ color: active ? 'var(--text)' : 'var(--muted-deep)' }}>
      {active && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[2px]" style={{ background: 'var(--text)' }} />}
      {children}
      {badge > 0 && (
        <span aria-hidden="true"
          className="absolute bottom-[7px] right-[6px] flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none"
          style={{ background: 'var(--text)', color: 'var(--slab)' }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}

/* Activity Bar icons: 24px line icons, stroke = currentColor. */
function Svg({ children }: { children: ReactNode }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

function IconFiles() {
  return <Svg><path d="M9 3h6l4 4v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M15 3v4h4" /><path d="M5 7v13a1 1 0 0 0 1 1h9" /></Svg>
}
function IconSearch() {
  return <Svg><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5.5 5.5" /></Svg>
}
function IconScm() {
  return <Svg><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="8" r="2" /><path d="M6 7v10" /><path d="M18 10c0 4-6 3-11.5 7.5" /></Svg>
}
function IconRun() {
  return <Svg><path d="M8 5.5v13l10-6.5-10-6.5Z" /><path d="M4 17.5h2.5" /><path d="M4 14h2.5" /></Svg>
}
function IconExtensions() {
  return <Svg><rect x="4" y="10" width="5" height="5" /><rect x="9" y="10" width="5" height="5" /><rect x="4" y="15" width="5" height="5" /><rect x="9" y="15" width="5" height="5" /><rect x="15" y="4" width="5" height="5" transform="rotate(12 17.5 6.5)" /></Svg>
}
function IconAava() {
  return <Svg><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="m8.5 16.5 3.5-9 3.5 9" /><path d="M9.8 13.2h4.4" /></Svg>
}
function IconAccount() {
  return <Svg><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></Svg>
}
function IconGear() {
  return <Svg><circle cx="12" cy="12" r="3" /><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" /></Svg>
}
