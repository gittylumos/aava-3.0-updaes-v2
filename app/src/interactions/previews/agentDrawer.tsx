/* Node drawer — click an agent in the orchestration topology and a panel
 * slides in from the right with its Configure / Run node / Evaluate tabs. The
 * body doesn't jump between tabs: it measures the new content and springs its
 * height to fit, so switching views reads as one panel reshaping. Mirrors the
 * ConfigPanel in src/prd/OrchestrationCanvas.tsx. This preview drives itself —
 * a node is selected, the drawer arrives, the tabs cycle, it leaves, the next
 * node lights up — so it plays like a short reel; hovering pauses it. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PreviewBox } from '../shared'

/* Measure an element's content height (springs the drawer body to fit). */
function useMeasuredHeight() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [h, setH] = useState<number | 'auto'>('auto')
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setH(e.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, h] as const
}

interface Node { id: string; label: string; type: string; accent: string }
const NODES: Node[] = [
  { id: 'n1', label: 'Requirement Analyzer', type: 'AAVA Agent', accent: 'var(--zone-canvas-accent)' },
  { id: 'n2', label: 'Solution Proposer', type: 'AI Generated Agent', accent: 'var(--brand)' },
  { id: 'n3', label: 'C4 Generator', type: 'AI Generated Agent', accent: 'var(--brand)' },
]
const TABS = ['Configure', 'Run node', 'Evaluate'] as const
type Tab = (typeof TABS)[number]

function TabBody({ tab }: { tab: Tab }) {
  if (tab === 'Configure') return (
    <div className="flex flex-col gap-2.5 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-semibold" style={{ color: 'var(--text)' }}>Model</span>
        <span className="flex items-center gap-1.5 rounded-[7px] px-2 py-1 text-[11px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>Claude Opus 5</span>
      </div>
      <div>
        <div className="mb-1 text-[11.5px] font-semibold" style={{ color: 'var(--text)' }}>Instructions</div>
        <div className="rounded-[8px] px-2.5 py-2 text-[11px] leading-[1.5]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>
          Takes a requirement brief and produces its section of the HLD, grounded in the confirmed capability process. Cite a source for every component.
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['C4 renderer', 'API registry', 'Token reader'].map((t) => (
          <span key={t} className="rounded-[7px] px-2 py-1 text-[10.5px]" style={{ background: 'var(--wash-3)', color: 'var(--text-dim)' }}>{t}</span>
        ))}
      </div>
    </div>
  )
  if (tab === 'Run node') return (
    <div className="flex flex-col gap-2.5 p-3">
      <div className="rounded-[8px] px-2.5 py-2 text-[11px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>Run this node in isolation against a sample brief.</div>
      <button type="button" className="press inline-flex w-fit items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[11.5px] font-medium" style={{ background: 'var(--text)', color: 'var(--on-text)' }}>
        <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden><polygon points="6 4 20 12 6 20 6 4" /></svg>Run node
      </button>
      <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--ok)' }}>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12 4 4L19 7" /></svg>
        Completed in 2.4s · 3 sources cited
      </div>
    </div>
  )
  return (
    <div className="flex flex-col gap-2 p-3">
      {[['Accuracy', '94%'], ['Latency', '2.4s'], ['Cost / run', '$0.031']].map(([k, v]) => (
        <div key={k} className="flex items-center justify-between rounded-[8px] px-2.5 py-2 text-[11.5px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
          <span style={{ color: 'var(--muted)' }}>{k}</span><span className="mono font-semibold" style={{ color: 'var(--text-dim)' }}>{v}</span>
        </div>
      ))}
    </div>
  )
}

function AgentDrawerDemo() {
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('Configure')
  const [bodyRef, bodyH] = useMeasuredHeight()
  const paused = useRef(false)
  const node = NODES.find((n) => n.id === selected)

  /* The reel: pick a node → drawer in → cycle its tabs → drawer out → next. */
  useEffect(() => {
    const steps: Array<() => void> = []
    NODES.forEach((n) => {
      steps.push(() => { setSelected(n.id); setTab('Configure') })
      steps.push(() => setTab('Run node'))
      steps.push(() => setTab('Evaluate'))
      steps.push(() => setSelected(null))
    })
    let i = 0
    const iv = window.setInterval(() => { if (!paused.current) { steps[i % steps.length](); i += 1 } }, 1500)
    return () => window.clearInterval(iv)
  }, [])

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[14px]" style={{ border: '1px solid var(--glass-line)', background: 'var(--slab-raised)', backgroundImage: 'radial-gradient(var(--glass-line-soft) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }}>
      {/* Topology — a horizontal chain of nodes. */}
      <div className="flex h-full items-center gap-0 px-6">
        {NODES.map((n, i) => (
          <div key={n.id} className="flex items-center">
            <button type="button" onClick={() => { setSelected(n.id); setTab('Configure') }}
              className="press relative flex w-[112px] flex-col gap-1 rounded-[10px] px-2.5 py-2 text-left transition-[box-shadow,transform]"
              style={{ background: 'var(--slab)', border: `1px solid ${selected === n.id ? n.accent : 'var(--glass-line)'}`, boxShadow: selected === n.id ? `0 0 0 3px color-mix(in srgb, ${n.accent} 22%, transparent)` : 'none' }}>
              <span className="grid h-6 w-6 place-items-center rounded-[7px]" style={{ background: `color-mix(in srgb, ${n.accent} 16%, transparent)`, color: n.accent }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 9h6M9 13h4" /></svg>
              </span>
              <span className="truncate text-[11px] font-medium" style={{ color: 'var(--text)' }}>{n.label}</span>
              <span className="text-[9px] uppercase tracking-[.06em]" style={{ color: 'var(--muted-deep)' }}>{n.type}</span>
            </button>
            {i < NODES.length - 1 && <span className="h-px w-6 shrink-0" style={{ background: 'var(--glass-line)' }} aria-hidden />}
          </div>
        ))}
      </div>

      {/* The node drawer — slides in from the right, springs its height per tab. */}
      <AnimatePresence>
        {node && (
          <motion.div key="drawer" initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="absolute right-2 top-2 z-20 flex w-[240px] flex-col overflow-hidden rounded-[12px] shadow-xl"
            style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)', maxHeight: 'calc(100% - 16px)' }}>
            <div className="flex shrink-0 items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
              <span className="grid h-6 w-6 place-items-center rounded-[7px]" style={{ background: `color-mix(in srgb, ${node.accent} 16%, transparent)`, color: node.accent }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 9h6M9 13h4" /></svg>
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] font-semibold" style={{ color: 'var(--text)' }}>{node.label}</span>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="press grid h-6 w-6 place-items-center rounded-[6px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <div className="flex shrink-0 gap-2 px-3 pt-2" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
              {TABS.map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} className="press pb-2 text-[11px] font-medium transition-colors"
                  style={{ color: tab === t ? 'var(--text)' : 'var(--muted)', boxShadow: tab === t ? 'inset 0 -2px 0 var(--text)' : 'inset 0 -2px 0 transparent' }}>{t}</button>
              ))}
            </div>
            {/* Height springs to the measured content — the reshape, not a jump. */}
            <motion.div animate={{ height: bodyH }} transition={{ type: 'spring', stiffness: 340, damping: 34 }} className="overflow-hidden">
              <div ref={bodyRef}>
                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
                    <TabBody tab={tab} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AgentDrawerPreview() {
  return <PreviewBox minHeight={460}><AgentDrawerDemo /></PreviewBox>
}
