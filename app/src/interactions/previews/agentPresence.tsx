/* Agent presence — make the reasoning visible (P1). Faithful re-implementations
 * of TypingDots, StreamedText, ToolSteps, the Capability shimmer, and AgentGraph,
 * matched to their real timings/easings. */
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Replayable, AavaAvatar } from '../shared'

/* ── Thinking dots ─────────────────────────────────────────────────────── */
export function ThinkingDotsPreview() {
  return (
    <Replayable render={(key) => (
      <div key={key} className="flex items-center gap-3">
        <AavaAvatar />
        <div className="flex gap-1 py-1" aria-label="AAVA is thinking">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--muted)', animation: 'ilib-typing 1.2s ease-in-out infinite', animationDelay: `${i * 0.16}s` }} />
          ))}
        </div>
        <style>{`@keyframes ilib-typing { 0%,60%,100% { opacity:.25 } 30% { opacity:1 } }`}</style>
      </div>
    )} />
  )
}

/* ── Streamed text ─────────────────────────────────────────────────────── */
const STREAM_LINE = "I'll check the connected Jira project for the ticket status first, then draft the summary."
function StreamedLine({ text }: { text: string }) {
  const words = useRef(text.split(' '))
  const [shown, setShown] = useState(0)
  const done = shown >= words.current.length
  useEffect(() => {
    if (done) return
    const next = words.current[shown] ?? ''
    // Same formula as StreamedText.tsx: derived from a char rate, min 16ms.
    const ms = Math.max(16, ((next.length + 1) / 18) * 1000)
    const t = window.setTimeout(() => setShown((n) => n + 1), ms)
    return () => clearTimeout(t)
  }, [shown, done])
  return (
    <>
      {words.current.slice(0, shown).join(' ')}
      {!done && <span aria-hidden className="ml-[2px] inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse" style={{ background: 'var(--muted)' }} />}
    </>
  )
}
export function StreamedTextPreview() {
  return (
    <Replayable render={(key) => (
      <div key={key} className="flex w-full max-w-[420px] items-start gap-3">
        <AavaAvatar />
        <p className="text-[13px] leading-[1.6]" style={{ color: 'var(--text-dim)' }}><StreamedLine text={STREAM_LINE} /></p>
      </div>
    )} />
  )
}

/* ── Tool-step accordion ───────────────────────────────────────────────── */
const TOOL_STEPS = [
  { label: 'Fetch Jira ticket AAVA-482', result: '200 OK · 340ms' },
  { label: 'Read linked design spec', result: 'Figma · 1 frame' },
  { label: 'Check CI status on main', result: 'passing' },
]
function ToolStepsDemo() {
  const [done, setDone] = useState(0)
  const [open, setOpen] = useState(true)
  const complete = done >= TOOL_STEPS.length
  useEffect(() => {
    if (done >= TOOL_STEPS.length) return
    const t = window.setTimeout(() => setDone((d) => d + 1), 650)
    return () => clearTimeout(t)
  }, [done])
  useEffect(() => { if (complete) { const t = window.setTimeout(() => setOpen(false), 400); return () => clearTimeout(t) } }, [complete])

  const rows = (
    <div className="grid gap-[3px]">
      {TOOL_STEPS.map((step, i) => {
        const state = i < done ? 'done' : i === done ? 'running' : 'pending'
        if (state === 'pending') return null
        return (
          <motion.div key={step.label} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
            className="flex items-center gap-2.5 rounded-[var(--r-sm)] px-2.5 py-[7px]" style={{ background: 'var(--wash-2)' }}>
            <span className="grid h-[15px] w-[15px] shrink-0 place-items-center">
              {state === 'done'
                ? <span className="text-[10px] leading-none" style={{ color: 'var(--ok)' }}>✓</span>
                : <span className="block h-[11px] w-[11px] rounded-full border-[1.6px] border-transparent" style={{ borderTopColor: 'var(--muted)', borderRightColor: 'var(--muted)', animation: 'ilib-spin .7s linear infinite' }} />}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px]" style={{ color: state === 'done' ? 'var(--text-dim)' : 'var(--muted)' }}>{step.label}</span>
            {state === 'done' && <span className="mono shrink-0 text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{step.result}</span>}
          </motion.div>
        )
      })}
    </div>
  )
  return (
    <div className="w-full max-w-[420px] overflow-hidden rounded-[var(--r-md)]" style={{ border: '1px solid var(--glass-line-soft)' }}>
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="press flex w-full items-center gap-2 px-2.5 py-2 text-left" style={{ background: 'var(--wash-2)' }}>
        <span className="grid h-[15px] w-[15px] shrink-0 place-items-center">
          {complete ? <span className="text-[11px] leading-none" style={{ color: 'var(--ok)' }}>✓</span>
            : <span className="block h-[11px] w-[11px] rounded-full border-[1.6px] border-transparent" style={{ borderTopColor: 'var(--muted)', borderRightColor: 'var(--muted)', animation: 'ilib-spin .7s linear infinite' }} />}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium" style={{ color: 'var(--text-dim)' }}>Gathering context</span>
        <span className="shrink-0 text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{Math.min(done, TOOL_STEPS.length)}/{TOOL_STEPS.length}</span>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
          style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur)' }}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && <div className="p-1" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>{rows}</div>}
      <style>{`@keyframes ilib-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
export function ToolStepsPreview() {
  return <Replayable render={(key) => <div key={key}><ToolStepsDemo /></div>} />
}

/* ── Capability-match shimmer ──────────────────────────────────────────── */
function CapabilityShimmerDemo() {
  const [matched, setMatched] = useState(false)
  useEffect(() => { const t = window.setTimeout(() => setMatched(true), 1800); return () => clearTimeout(t) }, [])
  if (!matched) {
    return (
      <div className="flex items-center gap-2 text-[13px]">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--muted)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>
        <span className="ilib-shimmer">Searching for the capabilities to complete this task…</span>
        <style>{`.ilib-shimmer{background:linear-gradient(90deg,var(--muted-deep) 0%,var(--text) 20%,var(--muted-deep) 40%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:ilib-sheen 1.4s linear infinite}
          @keyframes ilib-sheen{to{background-position:-200% 0}}`}</style>
      </div>
    )
  }
  return (
    <div className="w-full max-w-[420px] rounded-[var(--r-md)] p-3.5" style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--brand)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>
        <h4 className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">Capabilities matched</h4>
        <span className="mono shrink-0 text-[11px]" style={{ color: 'var(--muted-deep)' }}>AID-1.0</span>
      </div>
      <p className="mt-2 text-[12.5px] leading-[1.5]" style={{ color: 'var(--muted)' }}>This maps to the 'Artifact Identification' agentic process, with these capabilities:</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {['SDLC Process definition', 'Artifact Matching', 'Quality Assessment'].map((c) => (
          <span key={c} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>
            <span style={{ color: 'var(--ok)' }}>✓</span>{c}
          </span>
        ))}
      </div>
    </div>
  )
}
export function CapabilityShimmerPreview() {
  return <Replayable render={(key) => <div key={key}><CapabilityShimmerDemo /></div>} />
}

/* ── Execution-activity graph ──────────────────────────────────────────────
   The real blueprint topology (AgentGraph.tsx) at preview scale: the same
   boustrophedon (snake) layout, the same agent/tool/human node vocabulary,
   badges and curved flowing edges — auto-advancing through running → done →
   queued so every state is visible without waiting on a click. */
type GKind = 'agent' | 'tool' | 'human'
type GState = 'running' | 'done' | 'review' | 'queued'
interface GNodeDef { id: string; kind: GKind; title: string; sub: string }

const GRAPH_BLUEPRINT: GNodeDef[] = [
  { id: 'parse', kind: 'agent', title: 'PRD Parser', sub: 'Objectives · roles' },
  { id: 'rev1', kind: 'human', title: 'Reviewer', sub: 'Confirm the intake' },
  { id: 'epics', kind: 'agent', title: 'Epic Generator', sub: 'Clusters into epics' },
  { id: 'features', kind: 'agent', title: 'Feature Generator', sub: 'Decomposes epics' },
  { id: 'rev2', kind: 'human', title: 'Reviewer', sub: 'Confirm the features' },
  { id: 'publish', kind: 'tool', title: 'Jira Publisher', sub: 'Publish the features' },
]
// Boustrophedon layout — 3 per row, alternating direction, matching AgentGraph.tsx.
const G_PER_ROW = 3
const G_W = 176, G_H = 78, G_X0 = 16, G_Y0 = 16, G_XSTEP = 210, G_YSTEP = 128
const GRAPH_NODES = GRAPH_BLUEPRINT.map((n, i) => {
  const row = Math.floor(i / G_PER_ROW)
  const inRow = i % G_PER_ROW
  const col = row % 2 === 0 ? inRow : G_PER_ROW - 1 - inRow
  return { ...n, x: G_X0 + col * G_XSTEP, y: G_Y0 + row * G_YSTEP }
})
const G_VB_W = G_X0 * 2 + (G_PER_ROW - 1) * G_XSTEP + G_W
const G_VB_H = G_Y0 + G_YSTEP + G_H + 16
const G_RUN_BLUE = 'var(--zone-canvas-accent)'
const G_STATE_COLOR: Record<GState, string> = { running: G_RUN_BLUE, done: 'var(--ok)', review: 'var(--warn)', queued: 'var(--muted-deep)' }
const G_STATE_LABEL: Record<GState, string> = { running: 'RUNNING', done: 'DONE', review: 'REVIEW', queued: 'QUEUED' }

function graphState(kind: GKind, index: number, active: number): GState {
  if (index < active) return 'done'
  if (index > active) return 'queued'
  return kind === 'human' ? 'review' : 'running'
}

function GKindGlyph({ kind }: { kind: GKind }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (kind === 'tool') return <svg viewBox="0 0 24 24" width="13" height="13" {...p} aria-hidden><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2z" /></svg>
  if (kind === 'human') return <svg viewBox="0 0 24 24" width="13" height="13" {...p} aria-hidden><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
  return <svg viewBox="0 0 24 24" width="13" height="13" {...p} aria-hidden><rect x="4" y="7" width="16" height="12" rx="2.5" /><path d="M12 3v4M9 13h.01M15 13h.01" /></svg>
}

function GraphEdge({ from, to, color, flow }: { from: typeof GRAPH_NODES[number]; to: typeof GRAPH_NODES[number]; color: string; flow?: boolean }) {
  const fc = { x: from.x + G_W / 2, y: from.y + G_H / 2 }
  const tc = { x: to.x + G_W / 2, y: to.y + G_H / 2 }
  const dx = Math.abs(fc.x - tc.x), dy = Math.abs(fc.y - tc.y)
  let a: { x: number; y: number }, b: { x: number; y: number }
  if (dx >= dy) {
    a = { x: fc.x < tc.x ? from.x + G_W : from.x, y: fc.y }
    b = { x: fc.x < tc.x ? to.x : to.x + G_W, y: tc.y }
  } else {
    a = { x: fc.x, y: fc.y < tc.y ? from.y + G_H : from.y }
    b = { x: tc.x, y: fc.y < tc.y ? to.y : to.y + G_H }
  }
  const cxo = dx >= dy ? 42 : 0, cyo = dx >= dy ? 0 : 42
  const d = `M ${a.x} ${a.y} C ${a.x + (b.x > a.x ? cxo : -cxo)} ${a.y + cyo}, ${b.x - (b.x > a.x ? cxo : -cxo)} ${b.y - cyo}, ${b.x} ${b.y}`
  return <path d={d} fill="none" stroke={color} strokeWidth={flow ? 2.2 : 1.6} strokeLinecap="round" className={flow ? 'ilib-graph-flow' : undefined} />
}

function GraphCard({ node, state }: { node: typeof GRAPH_NODES[number]; state: GState }) {
  const { x, y } = node
  const col = G_STATE_COLOR[state]
  const lit = state === 'running' || state === 'review'
  return (
    <g opacity={state === 'queued' ? 0.7 : 1}>
      {lit && <rect x={x - 2} y={y - 2} width={G_W + 4} height={G_H + 4} rx={13} fill="none" stroke={col} strokeWidth={1.6} className="ilib-graph-pulse" />}
      <rect x={x} y={y} width={G_W} height={G_H} rx={11} fill="var(--slab)" stroke={state === 'queued' ? 'var(--glass-line)' : col} strokeWidth={lit ? 1.4 : 1} />
      <g transform={`translate(${x + 10}, ${y + 10})`}>
        <rect width={22} height={22} rx={6} fill="var(--wash-2)" stroke="var(--glass-line-soft)" strokeWidth={1} />
        <g transform="translate(4.5,4.5)" style={{ color: state === 'queued' ? 'var(--muted-deep)' : col }}><GKindGlyph kind={node.kind} /></g>
      </g>
      <text x={x + 38} y={y + 15} fontSize={7.5} fontWeight={700} letterSpacing="0.06em" fill="var(--muted)">{node.kind.toUpperCase()}</text>
      <text x={x + 10} y={y + 47} fontSize={12} fontWeight={600} fill={state === 'queued' ? 'var(--muted)' : 'var(--text)'}>{node.title}</text>
      <text x={x + 10} y={y + 63} fontSize={9} fill="var(--muted)">{node.sub}</text>
      <rect x={x + G_W - (G_STATE_LABEL[state].length * 5.6 + 12)} y={y + 8} width={G_STATE_LABEL[state].length * 5.6 + 12} height={15} rx={5} fill="transparent" stroke={col} strokeWidth={1} />
      <text x={x + G_W - 6} y={y + 18} textAnchor="end" fontSize={8} fontWeight={700} letterSpacing="0.05em" fill={col}>{G_STATE_LABEL[state]}</text>
    </g>
  )
}

function AgentGraphDemo() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setActive((a) => (a + 1) % GRAPH_NODES.length), 1500)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="w-full max-w-[560px]">
      <div className="mb-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[10.5px]" style={{ color: 'var(--muted)' }}>
        {(['agent', 'tool', 'human'] as GKind[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5"><span style={{ color: 'var(--muted-deep)' }}><GKindGlyph kind={k} /></span><span className="capitalize">{k}</span></span>
        ))}
        <span className="ml-auto flex items-center gap-2.5 text-[10px]" style={{ color: 'var(--muted-deep)' }}>
          <span className="inline-flex items-center gap-1"><span className="h-[6px] w-[6px] rounded-full" style={{ background: G_RUN_BLUE }} />running</span>
          <span className="inline-flex items-center gap-1"><span className="h-[6px] w-[6px] rounded-full" style={{ background: 'var(--ok)' }} />done</span>
          <span className="inline-flex items-center gap-1"><span className="h-[6px] w-[6px] rounded-full" style={{ background: 'var(--warn)' }} />review</span>
          <span className="inline-flex items-center gap-1"><span className="h-[6px] w-[6px] rounded-full" style={{ background: 'var(--muted-deep)' }} />queued</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${G_VB_W} ${G_VB_H}`} width="100%" style={{ display: 'block' }} role="img" aria-label="Execution blueprint">
        {GRAPH_NODES.slice(0, -1).map((from, i) => {
          const to = GRAPH_NODES[i + 1]
          const toState = graphState(to.kind, i + 1, active)
          const flow = toState === 'running' || toState === 'review'
          return <GraphEdge key={`${from.id}-${to.id}`} from={from} to={to} color={flow ? G_STATE_COLOR[toState] : 'var(--glass-line)'} flow={flow} />
        })}
        {GRAPH_NODES.map((n, i) => <GraphCard key={n.id} node={n} state={graphState(n.kind, i, active)} />)}
      </svg>
      <style>{`
        .ilib-graph-flow { stroke-dasharray: 6 6; animation: ilib-graph-march .7s linear infinite; }
        @keyframes ilib-graph-march { to { stroke-dashoffset: -24; } }
        .ilib-graph-pulse { animation: ilib-graph-pulse 1.7s ease-in-out infinite; }
        @keyframes ilib-graph-pulse { 0%,100% { stroke-opacity: .9; } 50% { stroke-opacity: .15; } }
      `}</style>
    </div>
  )
}
export function ExecutionGraphPreview() {
  return <Replayable render={(key) => <div key={key} className="w-full max-w-[560px]"><AgentGraphDemo /></div>} minHeight={300} />
}
