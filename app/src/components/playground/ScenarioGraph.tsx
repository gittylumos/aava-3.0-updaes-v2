/* The Execution-activity canvas for a scenario run.
 *
 * The same visual language as the backlog flow's graph, but the blueprint is the
 * scenario's own prep steps laid out in order — one node each, connected in a
 * snake. State is read straight from the run's position (`at`): steps behind it
 * are done (green), the step it is parked on is either a human gate (amber,
 * pulsing) or work in flight (blue, pulsing), and steps ahead are queued.
 * The toolbar carries the session heading — the capability name and badge.
 */
import { useMemo } from 'react'
import { WatchBar } from '../../zones/WatchBar'
import type { PrepStep, WatchEntry } from '../../state/types'

type Kind = 'agent' | 'tool' | 'human'
type NState = 'done' | 'running' | 'waiting' | 'queued'

interface NodeDef { id: string; kind: Kind; title: string; sub: string; x: number; y: number }

const W = 232
const H = 108
const PER_ROW = 4
const X0 = 30, Y0 = 40, XSTEP = 300, YSTEP = 290

const RUN_BLUE = '#5B9DFF'
const STATE_COLOR: Record<NState, string> = {
  done: 'var(--ok)', running: RUN_BLUE, waiting: 'var(--warn)', queued: 'var(--muted-deep)',
}
function stateLabel(state: NState, kind: Kind): string {
  switch (state) {
    case 'running': return 'RUNNING'
    case 'waiting': return kind === 'human' ? 'REVIEW' : 'RUNNING'
    case 'queued': return 'QUEUED'
    case 'done': default: return kind === 'human' ? 'APPROVED' : 'DONE'
  }
}

/* Infer a node kind from a prep step: gates are human, verification/build steps
   read as tools, everything else is an agent action. */
function kindOf(step: PrepStep): Kind {
  if (step.gate) return 'human'
  if (/\b(test|check|validat|lint|build|inject|ran|coverage|contract)\b/i.test(step.label)) return 'tool'
  return 'agent'
}

/* Lay the steps out as a boustrophedon (snake). */
function layout(steps: PrepStep[]): NodeDef[] {
  return steps.map((s, i) => {
    const row = Math.floor(i / PER_ROW)
    const inRow = i % PER_ROW
    const col = row % 2 === 0 ? inRow : PER_ROW - 1 - inRow
    return { id: s.key, kind: kindOf(s), title: s.label, sub: s.result, x: X0 + col * XSTEP, y: Y0 + row * YSTEP }
  })
}

export function ScenarioGraph({ steps, at, waiting, heading, watch, onCollapse }: {
  steps: PrepStep[]
  at: number
  /** True when the current step is a gate genuinely awaiting the user. */
  waiting: boolean
  heading?: { name: string; badge: string }
  watch: WatchEntry[]
  onCollapse: () => void
}) {
  const nodes = useMemo(() => layout(steps), [steps])
  const stateOf = (i: number): NState =>
    i < at ? 'done' : i === at ? (waiting ? 'waiting' : 'running') : 'queued'
  const vbW = X0 * 2 + (Math.min(PER_ROW, steps.length) - 1) * XSTEP + W
  const vbH = Y0 + Math.floor(Math.max(0, steps.length - 1) / PER_ROW) * YSTEP + H + 40

  return (
    <section aria-label="Canvas — execution activity" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="m-[12px] mb-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[var(--r-md)]"
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)', borderBottom: 'none' }}>
        <style>{`
          .sg-flow { stroke-dasharray: 7 7; animation: sgMarch .7s linear infinite; }
          @keyframes sgMarch { to { stroke-dashoffset: -28; } }
          .sg-pulse { animation: sgPulse 1.7s ease-in-out infinite; }
          @keyframes sgPulse { 0%,100% { stroke-opacity: .9; } 50% { stroke-opacity: .15; } }
          @media (prefers-reduced-motion: reduce) { .sg-flow, .sg-pulse { animation: none; } }
        `}</style>

        {/* Toolbar — the session heading (capability name · badge). */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          <span className="grid h-6 w-6 place-items-center rounded-[7px]" style={{ background: 'var(--brand)', color: '#fff' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="4" width="7" height="5" rx="1.5" /><rect x="14" y="15" width="7" height="5" rx="1.5" /><rect x="3" y="15" width="7" height="5" rx="1.5" /><path d="M6.5 9v6M10 17.5h4M6.5 12h8.5a2 2 0 0 1 2 2v1" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[.14em]" style={{ color: 'var(--muted-deep)' }}>Execution activity</div>
            {heading && <div className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>{heading.name} · {heading.badge}</div>}
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

        {/* The graph — the scenario's steps, in order. */}
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <svg viewBox={`0 0 ${vbW} ${vbH}`} width="100%" style={{ minWidth: 560, display: 'block' }} role="img" aria-label="Scenario execution graph">
            {nodes.slice(0, -1).map((from, i) => {
              const to = nodes[i + 1]
              const ts = stateOf(i + 1)
              const active = ts === 'running' || ts === 'waiting'
              const color = active ? (ts === 'running' ? RUN_BLUE : 'var(--warn)') : 'var(--glass-line)'
              return <Edge key={`${from.id}-${to.id}`} from={from} to={to} color={color} flow={active}
                label={active ? (to.kind === 'human' ? 'REVIEW' : 'RUNNING') : undefined} />
            })}
            {nodes.map((n, i) => <Card key={n.id} node={n} state={stateOf(i)} />)}
          </svg>
        </div>
      </div>

      <div className="mx-[12px] mb-[12px] overflow-hidden rounded-b-[var(--r-md)]" style={{ border: '1px solid var(--glass-line-soft)', borderTop: 'none' }}>
        <WatchBar entries={watch} />
      </div>
    </section>
  )
}

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
      <path d={d} fill="none" stroke={color} strokeWidth={idle ? 2 : 2.6} strokeLinecap="round" className={flow ? 'sg-flow' : undefined} />
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
      {lit && <rect x={x - 3} y={y - 3} width={W + 6} height={H + 6} rx={16} fill="none" stroke={col} strokeWidth={2} className="sg-pulse" />}
      <rect x={x} y={y} width={W} height={H} rx={13} fill="var(--slab)" stroke={border} strokeWidth={lit ? 1.6 : 1} />
      <g transform={`translate(${x + 14}, ${y + 14})`}>
        <rect width={28} height={28} rx={8} fill="var(--wash-2)" stroke="var(--glass-line-soft)" strokeWidth={1} />
        <g transform="translate(6,6)" style={{ color: state === 'queued' ? 'var(--muted-deep)' : col }}><KindGlyph kind={node.kind} /></g>
      </g>
      <Badge x={x + 50} y={y + 16} text={node.kind.toUpperCase()} fg="var(--muted)" bg="var(--wash-3)" />
      <Badge x={x + 50 + node.kind.length * 8 + 20} y={y + 16} text={stateLabel(state, node.kind)} fg={col} bg="transparent" border={col} dot={lit} />
      <text x={x + 16} y={y + 70} fontSize={14.5} fontWeight={600} fill={state === 'queued' ? 'var(--muted)' : 'var(--text)'}>{clip(node.title, 26)}</text>
      <text x={x + 16} y={y + 89} fontSize={11.5} fill="var(--muted)">{clip(node.sub, 30)}</text>
    </g>
  )
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

function Badge({ x, y, text, fg, bg, border, dot }: {
  x: number; y: number; text: string; fg: string; bg: string; border?: string; dot?: boolean
}) {
  const w = text.length * 7.4 + (dot ? 28 : 14)
  return (
    <g>
      <rect x={x} y={y} width={w} height={20} rx={6} fill={bg} stroke={border ?? 'transparent'} strokeWidth={border ? 1 : 0} />
      {dot && <circle cx={x + 11} cy={y + 10} r={3} fill={fg} className="sg-pulse" />}
      <text x={x + (dot ? 20 : 7)} y={y + 14} fontSize={10} fontWeight={700} letterSpacing="0.05em" fill={fg}>{text}</text>
    </g>
  )
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block h-[7px] w-[7px] rounded-full align-middle" style={{ background: color }} />
}

function KindGlyph({ kind }: { kind: Kind }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (kind === 'tool') return <svg viewBox="0 0 24 24" width="16" height="16" {...p} aria-hidden><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2z" /></svg>
  if (kind === 'human') return <svg viewBox="0 0 24 24" width="16" height="16" {...p} aria-hidden><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
  return <svg viewBox="0 0 24 24" width="16" height="16" {...p} aria-hidden><rect x="4" y="7" width="16" height="12" rx="2.5" /><path d="M12 3v4M9 13h.01M15 13h.01" /></svg>
}
