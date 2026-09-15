/* Sidebar — the app's primary nav, shown up close. It collapses to a rail and
 * expands back: the column springs its width while the row labels fade, so the
 * icons stay put and nothing else reflows. Mirrors Sidebar.tsx. The preview
 * plays this on a loop so it reads like a short reel, and it's fully live —
 * click the toggle to collapse it yourself, or pick a row to move the active
 * highlight. Hovering pauses the loop. */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PreviewBox } from '../shared'

const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
const Icon = {
  Panel: () => <svg {...svg} width="17" height="17"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg>,
  Plus: () => <svg {...svg} width="17" height="17"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M12 8v8M8 12h8" /></svg>,
  Tasks: () => <svg {...svg} width="17" height="17"><path d="m3 7 2 2 3-3M3 17l2 2 3-3M12 8h9M12 16h9" /></svg>,
  Search: () => <svg {...svg} width="17" height="17"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></svg>,
  Chat: () => <svg {...svg} width="16" height="16"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  Pin: () => <svg {...svg} width="15" height="15"><path d="M9 3.5h6M13.5 3.5v4.75c0 .95.54 1.82 1.4 2.24l1.35.66H7.75l1.35-.66c.86-.42 1.4-1.29 1.4-2.24V3.5M12 11.15V20.5" /></svg>,
}

interface Row { id: string; label: string; icon: 'plus' | 'tasks' | 'search' | 'chat'; needsYou?: boolean }
const NAV: Row[] = [
  { id: 'new', label: 'New Session', icon: 'plus' },
  { id: 'tasks', label: 'My Tasks', icon: 'tasks' },
  { id: 'search', label: 'Search', icon: 'search' },
]
const RECENTS: Row[] = [
  { id: 'feedback', label: 'Add product feedback form', icon: 'chat' },
  { id: 'refunds', label: 'Migrate the refunds API', icon: 'tasks', needsYou: true },
  { id: 'progress', label: 'Modify the progress bar', icon: 'tasks', needsYou: true },
  { id: 'sprint', label: 'Sprint scope questions', icon: 'chat' },
]
const GLYPH: Record<Row['icon'], React.ReactNode> = { plus: <Icon.Plus />, tasks: <Icon.Tasks />, search: <Icon.Search />, chat: <Icon.Chat /> }

function NavRow({ row, open, active, onClick }: { row: Row; open: boolean; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-current={active ? 'true' : undefined}
      className="press group relative flex w-full items-center gap-2.5 rounded-[9px] py-[7px] pl-2.5 pr-2 text-left transition-colors hover:bg-[var(--wash-2)]"
      style={{ background: active ? 'var(--wash-4)' : 'transparent' }}>
      <span className="shrink-0" style={{ color: active ? 'var(--text-dim)' : 'var(--muted)' }}>{GLYPH[row.icon]}</span>
      <AnimatePresence initial={false}>
        {open && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
            className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: active ? 'var(--text)' : 'var(--text-dim)' }}>{row.label}</motion.span>
        )}
      </AnimatePresence>
      {open && row.needsYou && (
        <span className="shrink-0 rounded-full px-1.5 py-[2px] text-[8.5px] font-semibold uppercase tracking-[.06em]" style={{ background: 'var(--warn-surface)', color: 'var(--warn)' }}>Needs you</span>
      )}
    </button>
  )
}

function SidebarNavDemo() {
  const [collapsed, setCollapsed] = useState(false)
  const [active, setActive] = useState('feedback')
  const paused = useRef(false)
  const open = !collapsed

  useEffect(() => {
    const iv = window.setInterval(() => { if (!paused.current) setCollapsed((c) => !c) }, 2800)
    return () => window.clearInterval(iv)
  }, [])

  return (
    <div className="relative h-[380px] w-full overflow-hidden rounded-[14px]" style={{ border: '1px solid var(--glass-line)', background: 'var(--ground)' }}
      onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }}>
      <div className="flex h-full">
        <motion.aside animate={{ width: collapsed ? 62 : 236 }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className="flex h-full shrink-0 flex-col overflow-hidden px-2.5 py-3" style={{ background: 'var(--slab)', borderRight: '1px solid var(--glass-line-soft)' }}>
          {/* Brand + collapse/expand toggle. Collapsed, the brand disc itself
              expands the rail; expanded, a panel toggle collapses it. */}
          <div className="mb-3 flex items-center gap-2 px-1">
            <button type="button" onClick={() => collapsed && setCollapsed(false)} aria-label={collapsed ? 'Expand sidebar' : 'AAVA home'}
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-bold ${collapsed ? 'press' : ''}`} style={{ background: 'var(--text)', color: 'var(--on-text)' }}>A</button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                  type="button" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar"
                  className="press ml-auto grid h-7 w-7 place-items-center rounded-[7px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}><Icon.Panel /></motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="grid gap-0.5">
            {NAV.map((r) => <NavRow key={r.id} row={r} open={open} active={active === r.id} onClick={() => setActive(r.id)} />)}
          </div>

          {open && (
            <div className="mt-3 flex items-center gap-1.5 px-2.5 pb-1">
              <span className="text-[9.5px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>Pinned</span>
            </div>
          )}
          <div className="grid gap-0.5">
            <button type="button" onClick={() => setActive('telemetry')} aria-current={active === 'telemetry' ? 'true' : undefined}
              className="press group relative flex w-full items-center gap-2.5 rounded-[9px] py-[7px] pl-2.5 pr-2 text-left transition-colors hover:bg-[var(--wash-2)]" style={{ background: active === 'telemetry' ? 'var(--wash-4)' : 'transparent' }}>
              <span className="shrink-0" style={{ color: 'var(--muted)' }}><Icon.Tasks /></span>
              {open && <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: 'var(--text-dim)' }}>Add telemetry functionality</span>}
              {open && <span className="shrink-0" style={{ color: 'var(--brand)' }}><Icon.Pin /></span>}
            </button>
          </div>

          {open && (
            <div className="mt-3 px-2.5 pb-1">
              <span className="text-[9.5px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>Recents</span>
            </div>
          )}
          <div className="grid gap-0.5">
            {RECENTS.map((r) => <NavRow key={r.id} row={r} open={open} active={active === r.id} onClick={() => setActive(r.id)} />)}
          </div>

          {/* Profile */}
          <div className="mt-auto flex items-center gap-2.5 rounded-[9px] px-1.5 py-1.5">
            <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold" style={{ background: 'var(--wash-3)', color: 'var(--text-dim)' }}>
              D<span className="absolute bottom-0 right-0 h-2 w-2 rounded-full" style={{ background: 'var(--ok)', boxShadow: '0 0 0 2px var(--slab)' }} />
            </span>
            {open && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Deepak</span>
                <span className="block truncate text-[10.5px]" style={{ color: 'var(--muted)' }}>Admin · HP</span>
              </span>
            )}
          </div>
        </motion.aside>

        {/* Faint main area, so the rail reads as part of an app shell. */}
        <div className="min-w-0 flex-1 px-5 py-4">
          <div className="h-4 w-40 rounded-full" style={{ background: 'var(--wash-2)' }} />
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-[10px]" style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SidebarNavPreview() {
  return <PreviewBox minHeight={420}><SidebarNavDemo /></PreviewBox>
}
