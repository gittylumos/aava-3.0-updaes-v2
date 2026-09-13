/* Theme transition — the light⇄dark swap doesn't cut, it dissolves: the old
 * look blurs out and fades as the new one resolves out of the same blur. In the
 * real app this rides the View Transition API over the whole page
 * (src/state/useTheme.ts); here it plays on a self-contained mock so the effect
 * is visible without flipping the surrounding page. Auto-loops, and the toggle
 * drives it by hand too. */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PreviewBox } from '../shared'

type Mode = 'light' | 'dark'
const PALETTE: Record<Mode, { bg: string; card: string; line: string; text: string; sub: string; chip: string; accent: string }> = {
  dark: { bg: '#0F1117', card: '#181B25', line: 'rgba(255,255,255,.09)', text: '#F3F4F6', sub: '#9AA3B2', chip: 'rgba(255,255,255,.06)', accent: '#F3F4F6' },
  light: { bg: '#F3F4F6', card: '#FFFFFF', line: 'rgba(17,24,39,.10)', text: '#111827', sub: '#6B7280', chip: 'rgba(17,24,39,.05)', accent: '#111827' },
}

/* A small slice of product chrome, coloured entirely from the mode's palette so
   the crossfade has two genuinely different looks to move between. */
function MiniApp({ mode }: { mode: Mode }) {
  const c = PALETTE[mode]
  return (
    <div className="h-full w-full p-4" style={{ background: c.bg }}>
      <div className="mx-auto max-w-[300px] overflow-hidden rounded-[14px]" style={{ background: c.card, border: `1px solid ${c.line}` }}>
        <div className="flex items-center gap-2 px-3.5 py-3" style={{ borderBottom: `1px solid ${c.line}` }}>
          <span className="grid h-6 w-6 place-items-center rounded-[7px] text-[11px] font-bold" style={{ background: c.accent, color: c.bg }}>A</span>
          <span className="text-[12.5px] font-semibold" style={{ color: c.text }}>Good evening, Deepak</span>
          <span className="ml-auto grid h-6 w-6 place-items-center rounded-full" style={{ background: c.chip, color: c.sub }} aria-hidden>
            {mode === 'dark'
              ? <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></svg>
              : <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>}
          </span>
        </div>
        <div className="space-y-2.5 px-3.5 py-3.5">
          {['Add product feedback form', 'Migrate the refunds API'].map((t, i) => (
            <div key={t} className="rounded-[9px] px-3 py-2.5" style={{ background: c.chip }}>
              <div className="text-[11.5px] font-medium" style={{ color: c.text }}>{t}</div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: mode === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(17,24,39,.06)' }}>
                <div className="h-full rounded-full" style={{ width: i ? '48%' : '92%', background: c.sub }} />
              </div>
            </div>
          ))}
          <div className="inline-flex rounded-[8px] px-3 py-1.5 text-[11px] font-semibold" style={{ background: c.accent, color: c.bg }}>Open</div>
        </div>
      </div>
    </div>
  )
}

function ThemeTransitionDemo() {
  const [mode, setMode] = useState<Mode>('dark')
  const paused = useRef(false)
  useEffect(() => {
    const t = window.setInterval(() => { if (!paused.current) setMode((m) => (m === 'dark' ? 'light' : 'dark')) }, 3200)
    return () => window.clearInterval(t)
  }, [])

  return (
    <div className="w-full max-w-[380px]" onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }}>
      <div className="relative h-[210px] w-full overflow-hidden rounded-[16px]" style={{ border: '1px solid var(--glass-line)' }}>
        <AnimatePresence initial={false}>
          <motion.div key={mode} className="absolute inset-0"
            initial={{ opacity: 0, filter: 'blur(14px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(14px)' }}
            transition={{ duration: 0.46, ease: 'easeInOut' }}>
            <MiniApp mode={mode} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
          className="press inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-medium transition-colors hover:bg-[var(--wash-3)]"
          style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>
          <span className="grid h-4 w-4 place-items-center" aria-hidden>
            {mode === 'dark'
              ? <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              : <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></svg>}
          </span>
          Switch to {mode === 'dark' ? 'light' : 'dark'}
        </button>
      </div>
    </div>
  )
}

export function ThemeTransitionPreview() {
  return <PreviewBox minHeight={300}><ThemeTransitionDemo /></PreviewBox>
}
