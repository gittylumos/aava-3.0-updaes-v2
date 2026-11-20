import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BrandMark, IconPanel } from './icons'
import { Tooltip } from './Tooltip'

/* The primary sidebar of the two-sidebar layout (concept: AAVA-Web-demo).
 *
 * It only navigates: New chat, Home, My tasks, Conversations, Completed, and
 * the account. The sessions themselves live in the secondary list beside it
 * (SessionList), the way Codex splits its app rail from its thread list.
 * Collapsed to an icon rail by default; the toggle widens it to show labels.
 */

export type ListView = 'home' | 'mytasks' | 'conversations' | 'completed'

interface Props {
  open: boolean
  onToggle: () => void
  view: ListView
  onView: (v: ListView) => void
  onNewChat: () => void
  /** The brand mark is a way home. */
  onHome: () => void
  needsCount: number
  counts: { mytasks: number; conversations: number; completed: number }
  profileName: string
  profileRole: string
  /* The account menu: other personas to switch to, and the theme. Omitted, the
     account row is a plain label. */
  otherProfiles?: { id: string; name: string; role: string; initials: string }[]
  onSwitchTo?: (id: never) => void
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
}

const svg = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

const ICONS: Record<ListView | 'new', ReactNode> = {
  new: <svg {...svg} strokeWidth={1.8}><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 20 12z" /><path d="M12 8.5v7M8.5 12h7" /></svg>,
  home: <svg {...svg}><path d="M3 11l9-7 9 7" /><path d="M5.5 9.5V20h13V9.5" /></svg>,
  mytasks: <svg {...svg}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></svg>,
  conversations: <svg {...svg}><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 20 12z" /></svg>,
  completed: <svg {...svg}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>,
}

const LABELS: Record<ListView, string> = {
  home: 'Home', mytasks: 'My tasks', conversations: 'Conversations', completed: 'Completed',
}

export function NavRail({ open, onToggle, view, onView, onNewChat, onHome, needsCount, counts, profileName, profileRole, otherProfiles = [], onSwitchTo, theme, onToggleTheme }: Props) {
  const [menu, setMenu] = useState(false)
  const acct = useRef<HTMLDivElement>(null)
  const menuEl = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null)
  /* The rail is narrow and clips what overflows it, so the menu is portalled to
     the page and placed beside the account row. Clicks inside it count as
     inside, so choosing an item does not read as an outside click. */
  const close = useCallback(() => setMenu(false), [])
  useEffect(() => {
    if (!menu) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (!acct.current?.contains(t) && !menuEl.current?.contains(t)) close()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('keydown', onKey) }
  }, [menu, close])
  const hasMenu = otherProfiles.length > 0 || !!onToggleTheme
  const item = (v: ListView) => {
    const on = view === v
    const count = v === 'home' ? null : counts[v]
    const btn = (
      <button type="button" onClick={() => onView(v)} aria-label={v === 'home' && needsCount > 0 ? `Home, ${needsCount} need you` : LABELS[v]} aria-current={on ? 'page' : undefined}
        className={`press relative flex h-10 items-center gap-3 rounded-[10px] transition-colors hover:bg-[var(--wash-3)] ${open ? 'w-full px-3' : 'w-10 justify-center'}`}
        style={{ background: on ? 'var(--wash-4)' : undefined, color: on ? 'var(--text)' : 'var(--text-dim)' }}>
        <span className="relative grid place-items-center">
          {ICONS[v]}
          {v === 'home' && needsCount > 0 && !open && (
            <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold"
              style={{ background: 'var(--warn)', color: 'var(--on-warn)' }} aria-hidden>{needsCount}</span>
          )}
        </span>
        {open && <span className="flex-1 truncate text-left text-[14px]">{LABELS[v]}</span>}
        {open && v === 'home' && needsCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold"
            style={{ background: 'var(--warn)', color: 'var(--on-warn)' }} aria-hidden>{needsCount}</span>
        )}
        {open && count != null && <span className="text-[12px] tabular-nums" style={{ color: 'var(--muted)' }}>{count}</span>}
      </button>
    )
    return open ? <div key={v}>{btn}</div> : <Tooltip key={v} label={LABELS[v]} side="right">{btn}</Tooltip>
  }

  return (
    <nav aria-label="AAVA navigation" className={`flex h-full w-full min-w-0 flex-col gap-1 py-3 ${open ? 'px-3' : 'items-center px-0'}`}>
      <div className={`mb-2 flex items-center ${open ? 'justify-between px-1' : 'flex-col gap-2'}`}>
        <button type="button" onClick={onHome} aria-label="AAVA home" title="Home"
          className="press flex items-center gap-2 rounded-full transition-opacity hover:opacity-80">
          <BrandMark size={28} />
          {open && <b className="pr-1 text-[15px] font-semibold tracking-[-.01em]">AAVA</b>}
        </button>
        <Tooltip label={open ? 'Collapse sidebar' : 'Expand sidebar'} side="right">
          <button type="button" onClick={onToggle} aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={open}
            className="press grid h-8 w-8 place-items-center rounded-[8px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}>
            <IconPanel size={18} />
          </button>
        </Tooltip>
      </div>

      {(() => {
        const btn = (
          <button type="button" onClick={onNewChat} aria-label="New chat"
            className={`press mb-2 flex h-10 items-center gap-3 rounded-[10px] transition-colors hover:bg-[var(--wash-4)] ${open ? 'w-full px-3' : 'w-10 justify-center'}`}
            style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line)', color: 'var(--text)' }}>
            {ICONS.new}
            {open && <span className="text-[14px] font-medium">New chat</span>}
          </button>
        )
        return open ? btn : <Tooltip label="New chat" side="right">{btn}</Tooltip>
      })()}

      {(['home', 'mytasks', 'conversations', 'completed'] as ListView[]).map(item)}

      <div ref={acct} className="relative mt-auto pt-2">
        {menu && pos && createPortal(
          <div ref={menuEl} role="menu" className="fixed z-[80] w-[236px] overflow-hidden rounded-[12px] p-1 shadow-lg"
            style={{ left: pos.left, bottom: pos.bottom, background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
            <div className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>Switch profile</div>
            {otherProfiles.map((p) => (
              <button key={p.id} type="button" role="menuitem" onClick={() => { setMenu(false); onSwitchTo?.(p.id as never) }}
                className="press flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-[var(--wash-3)]">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold" style={{ background: 'var(--wash-3)', color: 'var(--text-dim)' }}>{p.initials}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium" style={{ color: 'var(--text-dim)' }}>{p.name}</span>
                  <span className="block truncate text-[11px]" style={{ color: 'var(--muted)' }}>{p.role}</span>
                </span>
              </button>
            ))}
            {onToggleTheme && (
              <>
                <div className="my-1 h-px" style={{ background: 'var(--glass-line-soft)' }} />
                <button type="button" role="menuitem" onClick={onToggleTheme}
                  className="press flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[12.5px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--text-dim)' }}>
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
        <button type="button" onClick={(e) => {
            if (!hasMenu) return
            const r = e.currentTarget.getBoundingClientRect()
            setPos({ left: r.right + 8, bottom: Math.max(8, window.innerHeight - r.bottom) })
            setMenu((m) => !m)
          }} aria-haspopup={hasMenu ? 'menu' : undefined} aria-expanded={hasMenu ? menu : undefined}
          aria-label={`${profileName}, ${profileRole}${hasMenu ? '. Account menu' : ''}`}
          className={`flex w-full items-center gap-2.5 rounded-[10px] transition-colors ${hasMenu ? 'press hover:bg-[var(--wash-3)]' : 'cursor-default'} ${open ? 'px-2 py-2' : 'justify-center py-2'}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold"
            style={{ background: 'var(--wash-4)', color: 'var(--text)' }} aria-hidden>
            {profileName.slice(0, 1)}
          </span>
          {open && (
            <span className="min-w-0 text-left">
              <span className="block truncate text-[13.5px] font-medium">{profileName}</span>
              <span className="block truncate text-[11.5px]" style={{ color: 'var(--muted)' }}>{profileRole}</span>
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}
