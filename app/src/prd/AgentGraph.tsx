/* The agent-topology canvas — a live, state-driven communication graph.
 *
 * The exact agents behind the "Epics and Features Generator" run — the same ones
 * named in the capability match — laid out as the process flow: PRD Parser →
 * Epic → Feature → Story generators → DoR checker → Sprint planner → Jira
 * publisher, with the human Reviewer as the approval gate. Nothing is animated
 * at random: each node's state is derived from the actual run (which documents
 * exist, whether a step is executing, whether a gate is waiting), so while the
 * plan is still being approved everything sits idle, and only the agent that is
 * genuinely running carries the pulsing stroke and a flowing edge.
 */
import { useMemo } from 'react'
import { WatchBar } from '../zones/WatchBar'
import type { Message, WatchEntry } from '../state/types'

type Kind = 'agent' | 'tool' | 'human'
type NodeState = 'running' | 'success' | 'paused' | 'idle'
type AgentId = 'parse' | 'epics' | 'features' | 'stories' | 'dor' | 'sprint' | 'publish' | 'review'

interface NodeDef { id: AgentId; kind: Kind; title: string; sub: string; x: number; y: number }

const W = 232
const H = 108

/* Layout — a zig-zag pipeline: top row left→right, bottom row right→left, with
   the Reviewer anchored bottom-left as the human gate. */
const NODES: NodeDef[] = [
  { id: 'parse', kind: 'agent', title: 'PRD Parser', sub: 'Objectives · roles · requirements', x: 30, y: 60 },
  { id: 'epics', kind: 'agent', title: 'Epic Generator', sub: 'Clusters requirements into epics', x: 350, y: 60 },
  { id: 'features', kind: 'agent', title: 'Feature Generator', sub: 'Decomposes epics into features', x: 670, y: 60 },
  { id: 'stories', kind: 'agent', title: 'Story Generator', sub: 'Writes user stories', x: 990, y: 60 },
  { id: 'dor', kind: 'agent', title: 'DoR Checker', sub: 'Definition-of-Ready checks', x: 990, y: 350 },
  { id: 'sprint', kind: 'agent', title: 'Sprint Planner', sub: 'Maps stories into sprints', x: 670, y: 350 },
  { id: 'publish', kind: 'tool', title: 'Jira Publisher', sub: 'Creates the linked hierarchy', x: 350, y: 350 },
  { id: 'review', kind: 'human', title: 'Reviewer', sub: 'Human approval gate', x: 30, y: 350 },
]
const byId = (id: AgentId) => NODES.find((n) => n.id === id)!

/* The pipeline order — edges follow this chain. */
const PIPELINE: AgentId[] = ['parse', 'epics', 'features', 'stories', 'dor', 'sprint', 'publish']

const VB_W = 1252
const VB_H = 500

const RUN_BLUE = '#5B9DFF'
const STATE_COLOR: Record<NodeState, string> = {
  running: RUN_BLUE, success: 'var(--ok)', paused: 'var(--warn)', idle: 'var(--muted-deep)',
}
const STATE_LABEL: Record<NodeState, string> = {
  running: 'RUNNING', success: 'DONE', paused: 'REVIEW', idle: 'QUEUED',
}

interface Run { done: Set<AgentId>; active: AgentId | null; waiting: boolean; gateNode: AgentId | null }

/* Derive the live state of every agent from the run so far — no timers, no
   randomness. `done` from the documents produced, `active` from a status
   checklist still ticking, `waiting` from a gate holding for the user. */
function deriveRun(messages: Message[]): Run {
  const docs = new Set<string>()
  let running = false
  let liveGate = false
  let pushed = false
  for (const m of messages ?? []) {
    const b = m.block
    if (b?.kind === 'document' && b.doc) docs.add(b.doc)
    if (b?.kind === 'tools' && b.done < b.steps.length) running = true
    if (m.live !== false && (b?.kind === 'decision' || b?.kind === 'sync')) liveGate = true
    if (m.from === 'aava' && /pushed the .* to jira|pushed to jira|pushed to azure/i.test(m.lines.join(' '))) pushed = true
  }
  const marker: Record<AgentId, boolean> = {
    parse: docs.has('intake'),
    epics: docs.has('epics') || docs.has('epics-fields') || docs.has('epics-custom'),
    features: docs.has('features') || docs.has('features-gaps') || docs.has('features-custom'),
    stories: docs.has('stories'),
    dor: docs.has('stories-flags'),
    sprint: docs.has('sprint'),
    publish: pushed,
    review: false,
  }
  const done = new Set<AgentId>(PIPELINE.filter((a) => marker[a]))
  const firstPending = PIPELINE.find((a) => !marker[a]) ?? null
  const active = running ? firstPending : null
  // The gate only holds after the run has actually started producing something.
  const waiting = liveGate && done.size > 0 && !running
  const gateNode = waiting ? ([...done].pop() ?? null) : null
  return { done, active, waiting, gateNode }
}

function nodeState(n: NodeDef, run: Run): NodeState {
  if (n.id === 'review') return run.waiting ? 'paused' : 'idle'
  if (run.done.has(n.id)) return 'success'
  if (run.active === n.id) return 'running'
  return 'idle'
}

export function AgentGraph({ messages, watch, onCollapse }: { messages: Message[]; watch: WatchEntry[]; onCollapse: () => void }) {
  const run = useMemo(() => deriveRun(messages), [messages])

  return (
    <section aria-label="Canvas — agent workflow" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
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
            className="press grid h-8 w-8 place-items-center rounded-[8px] hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {/* Legend — the node types we actually use, and the status colours. */}
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

        {/* The graph. */}
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" style={{ minWidth: 620, display: 'block' }} role="img" aria-label="Agent communication graph">
            <defs>
              <style>{`
                .edge-flow { stroke-dasharray: 7 7; animation: agentMarch .7s linear infinite; }
                @keyframes agentMarch { to { stroke-dashoffset: -28; } }
                .node-pulse { animation: agentPulse 1.7s ease-in-out infinite; }
                @keyframes agentPulse { 0%,100% { stroke-opacity: .9; } 50% { stroke-opacity: .15; } }
                @media (prefers-reduced-motion: reduce) { .edge-flow, .node-pulse { animation: none; } }
              `}</style>
            </defs>

            {/* Pipeline edges — only the one flowing into the running agent moves. */}
            {PIPELINE.slice(0, -1).map((from, i) => {
              const to = PIPELINE[i + 1]
              const active = run.active === to
              return <Edge key={`${from}-${to}`} from={byId(from)} to={byId(to)}
                color={active ? RUN_BLUE : 'var(--glass-line)'} flow={active} label={active ? 'RUNNING' : undefined} />
            })}

            {/* The approval edge to the Reviewer — drawn only while a gate holds. */}
            {run.waiting && run.gateNode && (
              <Edge from={byId(run.gateNode)} to={byId('review')} color="var(--warn)" flow label="APPROVAL" dashed />
            )}

            {NODES.map((n) => <Card key={n.id} node={n} state={nodeState(n, run)} />)}
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
function Edge({ from, to, color, flow, label, dashed }: {
  from: NodeDef; to: NodeDef; color: string; flow?: boolean; label?: string; dashed?: boolean
}) {
  const fc = { x: from.x + W / 2, y: from.y + H / 2 }
  const tc = { x: to.x + W / 2, y: to.y + H / 2 }
  const dx = Math.abs(fc.x - tc.x); const dy = Math.abs(fc.y - tc.y)
  let a: { x: number; y: number }; let b: { x: number; y: number }
  if (dx >= dy) { // horizontal-ish
    a = { x: fc.x < tc.x ? from.x + W : from.x, y: fc.y }
    b = { x: fc.x < tc.x ? to.x : to.x + W, y: tc.y }
  } else { // vertical-ish
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
      <path d={d} fill="none" stroke={color} strokeWidth={idle ? 2 : 2.6} strokeLinecap="round"
        className={flow ? 'edge-flow' : undefined} strokeDasharray={dashed && !flow ? '7 7' : undefined} />
      <path d={`M ${b.x - (dx >= dy ? (b.x > a.x ? 9 : -9) : 0)} ${b.y - (dx >= dy ? 5 : (b.y > a.y ? 9 : -9))} L ${b.x} ${b.y} L ${b.x - (dx >= dy ? (b.x > a.x ? 9 : -9) : 5) } ${b.y + (dx >= dy ? 5 : (b.y > a.y ? 9 : -9))} Z`} fill={color} />
      {label && (
        <>
          <rect x={mx - lw / 2} y={my - 12} width={lw} height={24} rx={12} fill="var(--slab-raised)" stroke={color} strokeWidth={1} />
          <text x={mx} y={my + 4} textAnchor="middle" fontSize={10.5} fontWeight={700} letterSpacing="0.06em" fill={idle ? 'var(--muted)' : color}>{label}</text>
        </>
      )}
    </g>
  )
}

function Card({ node, state }: { node: NodeDef; state: NodeState }) {
  const { x, y } = node
  const col = STATE_COLOR[state]
  const lit = state === 'running' || state === 'paused'
  const border = state === 'idle' ? 'var(--glass-line)' : col
  return (
    <g opacity={state === 'idle' ? 0.72 : 1}>
      {lit && (
        <rect x={x - 3} y={y - 3} width={W + 6} height={H + 6} rx={16} fill="none" stroke={col} strokeWidth={2} className="node-pulse" />
      )}
      <rect x={x} y={y} width={W} height={H} rx={13} fill="var(--slab)" stroke={border} strokeWidth={lit ? 1.6 : 1} />

      {/* Header: icon tile + type + status badge. */}
      <g transform={`translate(${x + 14}, ${y + 14})`}>
        <rect width={28} height={28} rx={8} fill="var(--wash-2)" stroke="var(--glass-line-soft)" strokeWidth={1} />
        <g transform="translate(6,6)" style={{ color: state === 'idle' ? 'var(--muted-deep)' : col }}><KindGlyph kind={node.kind} /></g>
      </g>
      <Badge x={x + 50} y={y + 16} text={node.kind.toUpperCase()} fg="var(--muted)" bg="var(--wash-3)" />
      <Badge x={x + 50 + node.kind.length * 8 + 20} y={y + 16} text={STATE_LABEL[state]} fg={col} bg="transparent" border={col} dot={lit} />

      {/* Title + subtitle. */}
      <text x={x + 16} y={y + 70} fontSize={15} fontWeight={600} fill={state === 'idle' ? 'var(--muted)' : 'var(--text)'}>{node.title}</text>
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
