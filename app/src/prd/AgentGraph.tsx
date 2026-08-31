/* The Execution-activity canvas — the full run blueprint, preloaded.
 *
 * The moment the plan's Proceed is pressed, the entire predefined process map is
 * laid out — every agent, and now a Reviewer block inlined at each human gate and
 * a Jira Publisher block inlined at each publish, connected in sequence exactly
 * the way the agents are. Nothing is universalised: there is a distinct Reviewer
 * for each level's review and a distinct Publisher for each level's push, so the
 * blueprint reads as the real, ordered process.
 *
 * As the run traverses this fixed structure, each block lights up from its own
 * run signals — never a timer:
 *   • an agent turns blue while generating, green when its document lands;
 *   • a Reviewer turns amber while its gate holds, green once it is answered;
 *   • a Publisher turns green ("Published") if that level was pushed, amber
 *     ("Skipped") if it was skipped;
 *   • everything not yet reached sits grey ("Queued").
 * Done stays done.
 */
import { useMemo } from 'react'
import { WatchBar } from '../zones/WatchBar'
import type { Message, WatchEntry } from '../state/types'

type Kind = 'agent' | 'tool' | 'human'
type NState = 'running' | 'done' | 'waiting' | 'skipped' | 'queued'
type AgentId = 'parse' | 'epics' | 'features' | 'stories'
type GatePhase = 'intake' | 'epics' | 'features'
type PushPhase = 'epics' | 'features' | 'stories'

interface NodeDef {
  id: string; kind: Kind; title: string; sub: string
  agent?: AgentId; gate?: GatePhase; push?: PushPhase
  x: number; y: number
}

const W = 232
const H = 108

/* The blueprint, in flow order — Reviewer inlined after every level, a Jira
   Publisher after every level. The run ends by publishing the stories; sprint
   planning is handed to the scrum master, so there is no sprint node. */
const BLUEPRINT: Omit<NodeDef, 'x' | 'y'>[] = [
  { id: 'parse', kind: 'agent', title: 'PRD Parser', sub: 'Objectives · roles · requirements', agent: 'parse' },
  { id: 'rev-intake', kind: 'human', title: 'Reviewer', sub: 'Confirm the intake summary', gate: 'intake' },
  { id: 'epics', kind: 'agent', title: 'Epic Generator', sub: 'Clusters requirements into epics', agent: 'epics' },
  { id: 'rev-epics', kind: 'human', title: 'Reviewer', sub: 'Confirm the epics', gate: 'epics' },
  { id: 'pub-epics', kind: 'tool', title: 'Jira Publisher', sub: 'Publish the epics', push: 'epics' },
  { id: 'features', kind: 'agent', title: 'Feature Generator', sub: 'Decomposes epics into features', agent: 'features' },
  { id: 'rev-features', kind: 'human', title: 'Reviewer', sub: 'Confirm the features', gate: 'features' },
  { id: 'pub-features', kind: 'tool', title: 'Jira Publisher', sub: 'Publish the features', push: 'features' },
  { id: 'stories', kind: 'agent', title: 'Story Generator', sub: 'Writes user stories', agent: 'stories' },
  { id: 'pub-stories', kind: 'tool', title: 'Jira Publisher', sub: 'Publish the stories', push: 'stories' },
]

/* Lay the blueprint out as a boustrophedon (snake) — rows alternate direction so
   the sequence stays connected as it wraps. */
const PER_ROW = 5
const X0 = 30, Y0 = 40, XSTEP = 300, YSTEP = 290
const NODES: NodeDef[] = BLUEPRINT.map((n, i) => {
  const row = Math.floor(i / PER_ROW)
  const inRow = i % PER_ROW
  const col = row % 2 === 0 ? inRow : PER_ROW - 1 - inRow
  return { ...n, x: X0 + col * XSTEP, y: Y0 + row * YSTEP }
})
const VB_W = X0 * 2 + (PER_ROW - 1) * XSTEP + W          // 1494
const VB_H = Y0 + Math.floor((BLUEPRINT.length - 1) / PER_ROW) * YSTEP + H + 40  // 768

const RUN_BLUE = '#5B9DFF'
const STATE_COLOR: Record<NState, string> = {
  running: RUN_BLUE, done: 'var(--ok)', waiting: 'var(--warn)', skipped: 'var(--warn)', queued: 'var(--muted-deep)',
}
function stateLabel(state: NState, kind: Kind): string {
  switch (state) {
    case 'running': return 'RUNNING'
    case 'waiting': return kind === 'tool' ? 'OFFER' : 'REVIEW'
    case 'skipped': return 'SKIPPED'
    case 'queued': return 'QUEUED'
    case 'done': default: return kind === 'human' ? 'APPROVED' : kind === 'tool' ? 'PUBLISHED' : 'DONE'
  }
}

interface Run {
  has: Record<AgentId, boolean>
  activeAgent: AgentId | null
  answeredGates: Set<GatePhase>
  liveGate: GatePhase | null
  pushes: Partial<Record<PushPhase, { live: boolean; skipped: boolean }>>
}

const gatePhaseOf = (title: string): GatePhase => {
  const t = title.toLowerCase()
  if (/intake|summary/.test(t)) return 'intake'
  if (/epic/.test(t)) return 'epics'
  return 'features'
}
/* A push card can name more than one level (the "push what you skipped" card
   lists both epics and features), so it can settle several publisher nodes at
   once. Detect every level from the title alone — the detail may mention other
   levels in passing ("58 stories under 23 features"). */
const pushPhasesOf = (title: string): PushPhase[] => {
  const t = title.toLowerCase()
  const phs: PushPhase[] = []
  if (/stor/.test(t)) phs.push('stories')
  if (/feature/.test(t)) phs.push('features')
  if (/epic/.test(t)) phs.push('epics')
  return phs.length ? phs : ['stories']
}

/* Derive every block's state from the run so far. */
function deriveRun(messages: Message[]): Run {
  const docs = new Set<string>()
  let running = false
  const answeredGates = new Set<GatePhase>()
  let liveGate: GatePhase | null = null
  const pushes: Run['pushes'] = {}

  for (const m of messages ?? []) {
    const b = m.block
    if (b?.kind === 'document' && b.doc) docs.add(b.doc)
    if (b?.kind === 'tools' && b.done < b.steps.length) running = true
    if (b?.kind === 'decision') {
      const ph = gatePhaseOf(b.title)
      if (m.live === false) answeredGates.add(ph)
      else liveGate = ph
    }
    if (b?.kind === 'sync') {
      const status = { live: m.live !== false, skipped: m.answer === 'proceeded' }
      for (const p of pushPhasesOf(b.title)) pushes[p] = status
    }
  }

  const has: Record<AgentId, boolean> = {
    parse: docs.has('intake'),
    epics: docs.has('epics') || docs.has('epics-fields') || docs.has('epics-custom'),
    features: docs.has('features') || docs.has('features-gaps') || docs.has('features-custom'),
    stories: docs.has('stories'),
  }
  const order: AgentId[] = ['parse', 'epics', 'features', 'stories']
  const activeAgent = running ? order.find((a) => !has[a]) ?? null : null
  return { has, activeAgent, answeredGates, liveGate, pushes }
}

function nodeState(n: NodeDef, run: Run): NState {
  if (n.agent) return run.has[n.agent] ? 'done' : run.activeAgent === n.agent ? 'running' : 'queued'
  if (n.gate) return run.liveGate === n.gate ? 'waiting' : run.answeredGates.has(n.gate) ? 'done' : 'queued'
  if (n.push) {
    const p = run.pushes[n.push]
    if (!p) return 'queued'
    return p.live ? 'waiting' : p.skipped ? 'skipped' : 'done'
  }
  return 'queued'
}

export function AgentGraph({ messages, watch, onCollapse }: { messages: Message[]; watch: WatchEntry[]; onCollapse: () => void }) {
  const run = useMemo(() => deriveRun(messages), [messages])
  const states = useMemo(() => NODES.map((n) => nodeState(n, run)), [run])

  return (
    <section aria-label="Canvas — execution activity" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="m-[12px] mb-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[var(--r-md)]"
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)', borderBottom: 'none' }}>
        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          <span className="grid h-6 w-6 place-items-center rounded-[7px]" style={{ background: 'var(--brand)', color: '#fff' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="4" width="7" height="5" rx="1.5" /><rect x="14" y="15" width="7" height="5" rx="1.5" /><rect x="3" y="15" width="7" height="5" rx="1.5" /><path d="M6.5 9v6M10 17.5h4M6.5 12h8.5a2 2 0 0 1 2 2v1" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[.14em]" style={{ color: 'var(--muted-deep)' }}>Execution activity</div>
            <div className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>Epics &amp; Features Generator · EFG-1.0</div>
          </div>
          <button onClick={onCollapse} aria-label="Close" title="Close"
            className="press grid h-8 w-8 place-items-center rounded-[8px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 text-[11.5px]"
          style={{ borderBottom: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>
          {(['agent', 'tool', 'human'] as Kind[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span style={{ color: 'var(--muted-deep)' }}><KindGlyph kind={k} /></span>
              <span className="capitalize">{k}</span>
            </span>
          ))}
          <span className="ml-auto flex items-center gap-3 text-[11px]" style={{ color: 'var(--muted-deep)' }}>
            <Dot color={RUN_BLUE} /> running
            <Dot color="var(--ok)" /> done
            <Dot color="var(--warn)" /> review
            <Dot color="var(--muted-deep)" /> queued
          </span>
        </div>

        {/* The graph — the full blueprint, preloaded. */}
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" style={{ minWidth: 640, display: 'block' }} role="img" aria-label="Execution blueprint">
            <defs>
              <style>{`
                .edge-flow { stroke-dasharray: 7 7; animation: agentMarch .7s linear infinite; }
                @keyframes agentMarch { to { stroke-dashoffset: -28; } }
                .node-pulse { animation: agentPulse 1.7s ease-in-out infinite; }
                @keyframes agentPulse { 0%,100% { stroke-opacity: .9; } 50% { stroke-opacity: .15; } }
                @media (prefers-reduced-motion: reduce) { .edge-flow, .node-pulse { animation: none; } }
              `}</style>
            </defs>

            {/* Sequential edges — the one flowing into an active block moves. */}
            {NODES.slice(0, -1).map((from, i) => {
              const to = NODES[i + 1]
              const ts = states[i + 1]
              const active = ts === 'running' || ts === 'waiting'
              const color = active ? (ts === 'running' ? RUN_BLUE : 'var(--warn)') : 'var(--glass-line)'
              const label = active ? (to.kind === 'human' ? 'REVIEW' : to.kind === 'tool' ? 'PUBLISH' : 'RUNNING') : undefined
              return <Edge key={`${from.id}-${to.id}`} from={from} to={to} color={color} flow={active} label={label} />
            })}

            {NODES.map((n, i) => <Card key={n.id} node={n} state={states[i]} />)}
          </svg>
        </div>
      </div>

      <div className="mx-[12px] mb-[12px] overflow-hidden rounded-b-[var(--r-md)]" style={{ border: '1px solid var(--glass-line-soft)', borderTop: 'none' }}>
        <WatchBar entries={watch} />
      </div>
    </section>
  )
}

/* A curved edge between two cards, joining their nearest sides. */
function Edge({ from, to, color, flow, label }: {
  from: NodeDef; to: NodeDef; color: string; flow?: boolean; label?: string
}) {
  const fc = { x: from.x + W / 2, y: from.y + H / 2 }
  const tc = { x: to.x + W / 2, y: to.y + H / 2 }
  const dx = Math.abs(fc.x - tc.x); const dy = Math.abs(fc.y - tc.y)
  let a: { x: number; y: number }; let b: { x: number; y: number }
  if (dx >= dy) {
    a = { x: fc.x < tc.x ? from.x + W : from.x, y: fc.y }
    b = { x: fc.x < tc.x ? to.x : to.x + W, y: tc.y }
  } else {
    a = { x: fc.x, y: fc.y < tc.y ? from.y + H : from.y }
    b = { x: tc.x, y: fc.y < tc.y ? to.y : to.y + H }
  }
  const cxo = dx >= dy ? 70 : 0
  const cyo = dx >= dy ? 0 : 70
  const d = `M ${a.x} ${a.y} C ${a.x + (b.x > a.x ? cxo : -cxo)} ${a.y + cyo}, ${b.x - (b.x > a.x ? cxo : -cxo)} ${b.y - cyo}, ${b.x} ${b.y}`
  const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2
  const lw = label ? label.length * 8 + 18 : 0
  const idle = color === 'var(--glass-line)'
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={idle ? 2 : 2.6} strokeLinecap="round" className={flow ? 'edge-flow' : undefined} />
      <path d={`M ${b.x - (dx >= dy ? (b.x > a.x ? 9 : -9) : 0)} ${b.y - (dx >= dy ? 5 : (b.y > a.y ? 9 : -9))} L ${b.x} ${b.y} L ${b.x - (dx >= dy ? (b.x > a.x ? 9 : -9) : 5)} ${b.y + (dx >= dy ? 5 : (b.y > a.y ? 9 : -9))} Z`} fill={color} />
      {label && (
        <>
          <rect x={mx - lw / 2} y={my - 12} width={lw} height={24} rx={12} fill="var(--slab-raised)" stroke={color} strokeWidth={1} />
          <text x={mx} y={my + 4} textAnchor="middle" fontSize={10.5} fontWeight={700} letterSpacing="0.06em" fill={color}>{label}</text>
        </>
      )}
    </g>
  )
}

function Card({ node, state }: { node: NodeDef; state: NState }) {
  const { x, y } = node
  const col = STATE_COLOR[state]
  const lit = state === 'running' || state === 'waiting'
  const border = state === 'queued' ? 'var(--glass-line)' : col
  return (
    <g opacity={state === 'queued' ? 0.72 : 1}>
      {lit && (
        <rect x={x - 3} y={y - 3} width={W + 6} height={H + 6} rx={16} fill="none" stroke={col} strokeWidth={2} className="node-pulse" />
      )}
      <rect x={x} y={y} width={W} height={H} rx={13} fill="var(--slab)" stroke={border} strokeWidth={lit ? 1.6 : 1} />

      {/* Header: icon tile + type + status badge. */}
      <g transform={`translate(${x + 14}, ${y + 14})`}>
        <rect width={28} height={28} rx={8} fill="var(--wash-2)" stroke="var(--glass-line-soft)" strokeWidth={1} />
        <g transform="translate(6,6)" style={{ color: state === 'queued' ? 'var(--muted-deep)' : col }}><KindGlyph kind={node.kind} /></g>
      </g>
      <Badge x={x + 50} y={y + 16} text={node.kind.toUpperCase()} fg="var(--muted)" bg="var(--wash-3)" />
      <Badge x={x + 50 + node.kind.length * 8 + 20} y={y + 16} text={stateLabel(state, node.kind)} fg={col} bg="transparent" border={col} dot={lit} />

      {/* Title + subtitle. */}
      <text x={x + 16} y={y + 70} fontSize={15} fontWeight={600} fill={state === 'queued' ? 'var(--muted)' : 'var(--text)'}>{node.title}</text>
      <text x={x + 16} y={y + 89} fontSize={11.5} fill="var(--muted)">{node.sub}</text>
    </g>
  )
}

function Badge({ x, y, text, fg, bg, border, dot }: {
  x: number; y: number; text: string; fg: string; bg: string; border?: string; dot?: boolean
}) {
  const w = text.length * 7.4 + (dot ? 28 : 14)
  return (
    <g>
      <rect x={x} y={y} width={w} height={20} rx={6} fill={bg} stroke={border ?? 'transparent'} strokeWidth={border ? 1 : 0} />
      {dot && <circle cx={x + 11} cy={y + 10} r={3} fill={fg} className="node-pulse" />}
      <text x={x + (dot ? 20 : 7)} y={y + 14} fontSize={10} fontWeight={700} letterSpacing="0.05em" fill={fg}>{text}</text>
    </g>
  )
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block h-[7px] w-[7px] rounded-full align-middle" style={{ background: color }} />
}

/* Type glyphs, 16×16 in currentColor. */
function KindGlyph({ kind }: { kind: Kind }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (kind === 'tool') return <svg viewBox="0 0 24 24" width="16" height="16" {...p} aria-hidden><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2z" /></svg>
  if (kind === 'human') return <svg viewBox="0 0 24 24" width="16" height="16" {...p} aria-hidden><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
  return <svg viewBox="0 0 24 24" width="16" height="16" {...p} aria-hidden><rect x="4" y="7" width="16" height="12" rx="2.5" /><path d="M12 3v4M9 13h.01M15 13h.01" /></svg>
}
