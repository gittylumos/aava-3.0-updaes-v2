/* Session pin — the sidebar's pin, shown up close. A row's pin sits hidden
 * until you're on it, then lifts the session into Pinned and fills solid so the
 * row reads as pinned at a glance; unpinning drops it back into Recents. The
 * groups reflow with a layout animation. Mirrors ThreadRow in
 * src/components/chrome/Sidebar.tsx. This preview also runs itself on a loop —
 * a spotlight travels the list, pinning and unpinning — so it plays like a
 * short reel; hovering pauses it and hands you the controls. */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PreviewBox } from '../shared'

interface Session { id: string; title: string }
const SESSIONS: Session[] = [
  { id: 's1', title: 'Add telemetry functionality' },
  { id: 's2', title: 'Add product feedback form' },
  { id: 's3', title: 'Migrate the refunds API' },
  { id: 's4', title: 'Sprint scope questions' },
  { id: 's5', title: 'Reduce the page load time' },
]

function PinGlyph({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 3.5h6" />
      <path d="M13.5 3.5v4.75c0 .95.54 1.82 1.4 2.24l1.35.66H7.75l1.35-.66c.86-.42 1.4-1.29 1.4-2.24V3.5" fill={filled ? 'currentColor' : 'none'} />
      <path d="M12 11.15V20.5" />
    </svg>
  )
}

function Row({ s, pinned, spotlit, active, onToggle }: { s: Session; pinned: boolean; spotlit: boolean; active: boolean; onToggle: () => void }) {
  return (
    <motion.div layout="position" transition={{ type: 'spring', stiffness: 420, damping: 34 }} className="group/row relative">
      <button type="button" aria-current={active ? 'true' : undefined}
        className="flex w-full items-center gap-2 rounded-[8px] py-2 pl-2.5 pr-9 text-left transition-colors"
        style={{ background: active ? 'var(--wash-4)' : spotlit ? 'var(--wash-2)' : 'transparent' }}>
        <span className="shrink-0" style={{ color: active ? 'var(--text-dim)' : 'var(--muted-deep)' }} aria-hidden>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        </span>
        <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: active ? 'var(--text)' : 'var(--text-dim)', fontWeight: active ? 500 : 400 }}>{s.title}</span>
      </button>
      <button type="button" onClick={onToggle} aria-label={pinned ? `Unpin ${s.title}` : `Pin ${s.title}`} aria-pressed={pinned}
        className={`press absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[7px] transition-[opacity,background-color,transform] duration-150 active:scale-90 ${pinned || spotlit ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'}`}
        style={pinned ? { color: 'var(--brand)', background: 'color-mix(in srgb, var(--brand) 12%, transparent)' } : { color: 'var(--muted-deep)' }}>
        <PinGlyph filled={pinned} />
      </button>
    </motion.div>
  )
}

function GroupLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center justify-between px-2.5 pb-1 pt-2">
      <span className="text-[9.5px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>{children}</span>
      {count != null && <span className="mono text-[10px]" style={{ color: 'var(--muted-deep)' }}>{count}</span>}
    </div>
  )
}

function SessionPinDemo() {
  const [pins, setPins] = useState<Set<string>>(new Set())
  const [spotlight, setSpotlight] = useState<string | null>(null)
  const paused = useRef(false)
  const toggle = (id: string) => setPins((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  /* The reel: spotlight a Recents row, pin it, move on; once a couple are
     pinned, clear them and start over. Paused while the pointer is inside. */
  useEffect(() => {
    const order = ['s2', 's4', '__clear__', 's1', '__clear__']
    let i = 0
    const tick = () => {
      if (paused.current) return
      const step = order[i % order.length]
      if (step === '__clear__') { setSpotlight(null); setPins(new Set()) }
      else {
        setSpotlight(step)
        window.setTimeout(() => { if (!paused.current) setPins((p) => new Set(p).add(step)) }, 650)
      }
      i += 1
    }
    const iv = window.setInterval(tick, 1900)
    return () => window.clearInterval(iv)
  }, [])

  const pinned = SESSIONS.filter((s) => pins.has(s.id))
  const recents = SESSIONS.filter((s) => !pins.has(s.id))

  return (
    <div className="w-full max-w-[320px]" onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false; setSpotlight(null) }}>
      <nav aria-label="Sessions" className="overflow-hidden rounded-[14px] p-2" style={{ background: 'var(--slab)', border: '1px solid var(--glass-line)' }}>
        <AnimatePresence initial={false}>
          {pinned.length > 0 && (
            <motion.div key="pinned" layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <GroupLabel count={pinned.length}>Pinned</GroupLabel>
              {pinned.map((s) => <Row key={s.id} s={s} pinned spotlit={false} active={false} onToggle={() => toggle(s.id)} />)}
            </motion.div>
          )}
        </AnimatePresence>
        <GroupLabel>Recents</GroupLabel>
        {recents.map((s, i) => <Row key={s.id} s={s} pinned={false} spotlit={spotlight === s.id} active={i === 0 && pinned.length === 0} onToggle={() => toggle(s.id)} />)}
      </nav>
    </div>
  )
}

export function SessionPinPreview() {
  return <PreviewBox minHeight={300}><SessionPinDemo /></PreviewBox>
}
