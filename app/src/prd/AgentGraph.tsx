/* The Execution-activity canvas — the full run blueprint, preloaded.
 *
 * Same canvas grammar as the Agent-Designer builder (OrchestrationCanvas.tsx) —
 * the dot-grid background, the rounded node cards with a hover spring, the
 * floating pan/zoom/fit + layout-toggle bar, and a circular Start node — so a
 * user who has seen one process canvas reads this one for free. What differs is
 * content only: nodes carry a RUN STATE (queued/running/waiting/done/skipped),
 * derived from the conversation, not a static config.
 *
 * The moment the plan's Proceed is pressed, the entire predefined process map is
 * laid out — every agent, a Reviewer block inlined at each human gate, and a
 * Jira Publisher block inlined at each publish. As the run traverses this fixed
 * structure, each block lights up from its own run signals — never a timer:
 *   • an agent turns blue while generating, green when its document lands;
 *   • a Reviewer turns amber while its gate holds, green once it is answered;
 *   • a Publisher turns green ("Published") if that level was pushed, amber
 *     ("Skipped") if it was skipped;
 *   • everything not yet reached sits grey ("Queued").
 * Done stays done.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Hand, ZoomIn, ZoomOut, Maximize, Workflow, X } from 'lucide-react'
import { Tooltip } from '../components/chrome/Tooltip'
import type { Message, WatchEntry } from '../state/types'

const HOVER_SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 }

type Kind = 'agent' | 'tool' | 'human'
type NState = 'running' | 'done' | 'waiting' | 'skipped' | 'queued'
type AgentId = 'parse' | 'epics' | 'features' | 'stories' | 'assign'
type GatePhase = 'intake' | 'epics' | 'features' | 'assign'
type PushPhase = 'epics' | 'features' | 'stories'
type Layout = 'horizontal' | 'vertical'

interface NodeDef {
  id: string; kind: Kind; title: string; sub: string
  agent?: AgentId; gate?: GatePhase; push?: PushPhase
  /** The circular green entry node — always "done" the moment the canvas opens. */
  isStart?: boolean
}
interface GNode extends NodeDef { x: number; y: number }

/* The blueprint, in flow order — Reviewer inlined after every level, a Jira
   Publisher after every level. Once the stories publish, the process hands the
   backlog to the scrum team: a Story Assignment agent drafts the allocation, then
   a human gate (User B — the PM who owns the sprint) reviews it. */
const BLUEPRINT: NodeDef[] = [
  { id: 'start', kind: 'agent', title: 'Start', sub: 'The entry point of the process.', isStart: true },
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
  { id: 'assign', kind: 'agent', title: 'Story Assignment', sub: 'Allocates 58 stories across the team', agent: 'assign' },
  { id: 'rev-assign', kind: 'human', title: 'Meera · Product Manager', sub: 'Review story assignments', gate: 'assign' },
]

const NODE_W = 236, NODE_H = 80, START_W = 84, START_H = 56
const H_STEP = 276, V_STEP = 128

/* Place the blueprint for a layout — a plain single row (horizontal) or single
 * column (vertical), nothing more clever. A wrapping snake grid was tried here
 * and rejected: it read as zig-zag, not a process. Cards stay at one fixed,
 * always-legible size; whichever axis runs long simply scrolls (the canvas is
 * `overflow-auto` in both directions) instead of the layout folding or the
 * zoom shrinking to force everything into view at once. */
function placeNodes(layout: Layout): GNode[] {
  if (layout === 'vertical') {
    return BLUEPRINT.map((n, i) => {
      const x = 200 + (n.isStart ? (NODE_W - START_W) / 2 : 0)
      return { ...n, x, y: 24 + i * V_STEP }
    })
  }
  return BLUEPRINT.map((n, i) => {
    const x = i === 0 ? 24 : 132 + (i - 1) * H_STEP
    return { ...n, x, y: 140 + (n.isStart ? 10 : 0) }
  })
}
function nodeW(n: NodeDef) { return n.isStart ? START_W : NODE_W }
function nodeH(n: NodeDef) { return n.isStart ? START_H : NODE_H }

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
/* Short form — matches the legend's own wording (Agent/Tool/Human) and leaves
   room for the label to sit comfortably at a readable size in the card. */
const KIND_TYPE: Record<Kind, string> = { agent: 'Agent', tool: 'Tool', human: 'Human' }

interface Run {
  has: Record<AgentId, boolean>
  activeAgent: AgentId | null
  running: boolean
  answeredGates: Set<GatePhase>
  liveGate: GatePhase | null
  pushes: Partial<Record<PushPhase, { live: boolean; skipped: boolean }>>
}

const gatePhaseOf = (title: string): GatePhase => {
  const t = title.toLowerCase()
  if (/intake|summary/.test(t)) return 'intake'
  if (/assign|allocation|allocate/.test(t)) return 'assign'
  if (/epic/.test(t)) return 'epics'
  if (/feature/.test(t)) return 'features'
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
    if (m.superseded) continue
    const b = m.block
    if (b?.kind === 'document' && b.doc) docs.add(b.doc)
    /* Meera's allocation artefact has no BacklogDoc id — detect it by name so the
       Story Assignment node lights green once it lands. */
    if (b?.kind === 'document' && /allocation/i.test(b.name)) docs.add('team-allocation')
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
    assign: docs.has('team-allocation'),
  }
  const order: AgentId[] = ['parse', 'epics', 'features', 'stories', 'assign']
  const activeAgent = running ? order.find((a) => !has[a]) ?? null : null
  return { has, activeAgent, running, answeredGates, liveGate, pushes }
}

function nodeState(n: NodeDef, run: Run): NState {
  if (n.isStart) return 'done'
  if (n.agent) return run.has[n.agent] ? 'done' : run.activeAgent === n.agent ? 'running' : 'queued'
  if (n.gate) return run.liveGate === n.gate ? 'waiting' : run.answeredGates.has(n.gate) ? 'done' : 'queued'
  if (n.push) {
    const p = run.pushes[n.push]
    if (!p) return 'queued'
    return p.live ? 'waiting' : p.skipped ? 'skipped' : 'done'
  }
  return 'queued'
}

export function AgentGraph({ messages, watch: _watch, onCollapse, assignActive, upstreamDone }: {
  messages: Message[]; watch: WatchEntry[]; onCollapse: () => void
  /* Raman's post-publish preview: the whole backlog is his, so his own messages
     drive every node — we only nudge the Story Assignment node to "in progress",
     since the scrum team has been handed the work. */
  assignActive?: boolean
  /* Meera's view: the run she opens contains only her allocation beats, so the
     upstream backlog nodes have no signal of their own — force them done, because
     Raman already finished and published them. */
  upstreamDone?: boolean
}) {
  /* Cards stay at one fixed, native size always (no zig-zag/wrap, no font
     shrinking baked into layout — see `placeNodes`). ZOOM is the separate
     knob that opens on whatever "Fit to view" computes, so the very first
     thing a user sees is the whole run at a glance; from there Zoom in/out and
     plain scroll (the canvas is `overflow-auto` both ways) take over. */
  const [zoom, setZoom] = useState(1)
  const [layout, setLayout] = useState<Layout>('horizontal')
  const canvasRef = useRef<HTMLDivElement>(null)

  const run = useMemo(() => deriveRun(messages), [messages])
  const nodes = useMemo(() => placeNodes(layout), [layout])
  const states = useMemo(() => nodes.map((n) => {
    const s = nodeState(n, run)
    if (n.agent === 'assign') {
      return run.has.assign ? 'done' : run.running || assignActive ? 'running' : 'queued'
    }
    if (n.gate === 'assign') return s
    if (upstreamDone && s === 'queued' && !n.isStart) return 'done'
    return s
  }), [nodes, run, assignActive, upstreamDone])

  const vbW = layout === 'vertical' ? 200 + NODE_W + 60 : nodes[nodes.length - 1].x + NODE_W + 40
  const vbH = layout === 'vertical' ? 24 + nodes.length * V_STEP + 40 : 300

  /* Shrink to show the whole run at once, never past a legibility floor —
     below that floor scrolling takes over rather than the text going unreadable. */
  const fit = () => {
    const el = canvasRef.current
    if (!el) return
    const z = Math.min((el.clientWidth - 32) / vbW, (el.clientHeight - 32) / vbH, 1)
    setZoom(Math.max(0.6, z))
  }

  /* The default view IS fit-to-view — computed on open and again whenever the
     layout switches or the panel is resized (a ResizeObserver, not just a
     mount effect, so the split-panel or an expand/collapse still re-fits). */
  useLayoutEffect(() => {
    fit()
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, vbW, vbH])

  return (
    <section aria-label="Canvas — execution activity" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="m-[12px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--r-md)]"
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)' }}>
        {/* Toolbar — label, capability line, and Close. Unchanged from before;
            only the canvas cards below got the redesign. */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          <span className="grid h-6 w-6 place-items-center rounded-[7px]" style={{ background: 'var(--brand)', color: 'var(--on-text)' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="4" width="7" height="5" rx="1.5" /><rect x="14" y="15" width="7" height="5" rx="1.5" /><rect x="3" y="15" width="7" height="5" rx="1.5" /><path d="M6.5 9v6M10 17.5h4M6.5 12h8.5a2 2 0 0 1 2 2v1" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[.14em]" style={{ color: 'var(--muted-deep)' }}>Execution activity</div>
            <div className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>Epics &amp; Features Generator · EFG-1.0</div>
          </div>
          <Tooltip label="Close" side="bottom" align="end">
            <button onClick={onCollapse} className="icon-btn h-7 w-7" aria-label="Close"><X size={15} /></button>
          </Tooltip>
        </div>

        {/* Legend — unchanged. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 text-[13px]"
          style={{ borderBottom: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>
          {(['agent', 'tool', 'human'] as Kind[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span style={{ color: 'var(--muted-deep)' }}><KindGlyph kind={k} size={18} /></span>
              <span className="capitalize">{k}</span>
            </span>
          ))}
          <span className="ml-auto flex items-center gap-3 text-[13px]" style={{ color: 'var(--muted-deep)' }}>
            <Dot color={RUN_BLUE} /> running
            <Dot color="var(--ok)" /> done
            <Dot color="var(--warn)" /> review
            <Dot color="var(--muted-deep)" /> queued
          </span>
        </div>

        {/* Canvas — an OUTER fixed-size frame holding two independent layers: the
            scrolling content and the floating toolbar. They used to be the same
            element (the scroll container itself, positioned + overflow-auto),
            which meant `bottom-3` on the toolbar anchored to that element's own
            box — and an absolutely-positioned child (the scaled node layer) can
            inflate what a browser treats as that box's scrollable extent, so the
            toolbar drifted up into the middle of a tall canvas instead of
            staying pinned to the visible bottom of the panel. Splitting them
            fixes it: the OUTER frame never changes size, so anything anchored
            to it (the toolbar) can't be dragged around by how much the INNER
            layer scrolls. */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div ref={canvasRef} className="absolute inset-0 overflow-auto"
            style={{ backgroundColor: 'var(--slab, #0e1017)', backgroundImage: 'radial-gradient(var(--glass-line-soft) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            <div className="relative origin-top-left" style={{ transform: `scale(${zoom})`, width: vbW, height: vbH }}>
              <svg width={vbW} height={vbH} className="pointer-events-none absolute inset-0" aria-hidden>
                {nodes.slice(0, -1).map((from, i) => {
                  const to = nodes[i + 1]
                  const ts = states[i + 1]
                  const active = ts === 'running' || ts === 'waiting'
                  /* Idle edges use --muted-deep, not --glass-line — the hairline
                     border colour is nearly invisible against the canvas at any
                     reasonable opacity; the connectors need to actually be seen. */
                  const color = active ? (ts === 'running' ? RUN_BLUE : 'var(--warn)') : 'var(--muted-deep)'
                  const label = active ? (to.kind === 'human' ? 'REVIEW' : to.kind === 'tool' ? 'PUBLISH' : 'RUNNING') : undefined
                  return <Edge key={`${from.id}-${to.id}`} from={from} to={to} layout={layout} color={color} flow={active} label={label} />
                })}
              </svg>
              {nodes.map((n, i) => <NodeCard key={n.id} node={n} state={states[i]} />)}
            </div>
          </div>

          {/* Floating bottom-center controls — a sibling of the scroll container,
              anchored to the OUTER frame, so it never moves: pan · zoom · fit ·
              layout toggle, identical set and icons to the Agent-Designer builder. */}
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-full px-1.5 py-1 shadow-lg"
            style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)' }}>
            {([
              ['Pan', Hand, () => {}],
              ['Zoom in', ZoomIn, () => setZoom((z) => Math.min(1.4, z + 0.12))],
              ['Zoom out', ZoomOut, () => setZoom((z) => Math.max(0.2, z - 0.12))],
              ['Fit to view', Maximize, fit],
            ] as const).map(([label, Icon, fn]) => (
              <Tooltip key={label} label={label} side="top">
                <button className="icon-btn h-8 w-8" aria-label={label} onClick={fn}><Icon size={15} /></button>
              </Tooltip>
            ))}
            <span className="mx-0.5 h-5 w-px" style={{ background: 'var(--glass-line-soft)' }} aria-hidden />
            <Tooltip label={layout === 'horizontal' ? 'Switch to vertical layout' : 'Switch to horizontal layout'} side="top" align="end">
              <button className="icon-btn h-8 w-8" aria-label="Switch layout" aria-pressed={layout === 'vertical'}
                onClick={() => setLayout((l) => l === 'horizontal' ? 'vertical' : 'horizontal')}>
                <Workflow size={15} style={{ color: 'var(--brand)', transform: layout === 'vertical' ? 'rotate(90deg)' : undefined }} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </section>
  )
}

/* A curved edge between two cards, joining their nearest sides — bezier for
   horizontal, straight-ish S-curve for vertical, matching the builder's edges. */
function Edge({ from, to, layout, color, flow, label }: {
  from: GNode; to: GNode; layout: Layout; color: string; flow?: boolean; label?: string
}) {
  const fw = nodeW(from), fh = nodeH(from), tw = nodeW(to), th = nodeH(to)
  let d: string, mx: number, my: number, sx: number, sy: number, ex: number, ey: number
  if (layout === 'vertical') {
    sx = from.x + fw / 2; sy = from.y + fh; ex = to.x + tw / 2; ey = to.y
    const cy = (sy + ey) / 2
    d = `M ${sx} ${sy} C ${sx} ${cy}, ${ex} ${cy}, ${ex} ${ey}`
    mx = (sx + ex) / 2; my = cy
  } else {
    sx = from.x + fw; sy = from.y + fh / 2; ex = to.x; ey = to.y + th / 2
    const cx = (sx + ex) / 2
    d = `M ${sx} ${sy} C ${cx} ${sy}, ${cx} ${ey}, ${ex} ${ey}`
    mx = (sx + ex) / 2; my = (sy + ey) / 2
  }
  const idle = color === 'var(--muted-deep)'
  const lw = label ? label.length * 7.4 + 18 : 0
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={idle ? 2 : 2.4} strokeDasharray="5 5" opacity={idle ? 0.85 : 0.95} className={flow ? 'edge-flow' : undefined} />
      <circle cx={sx} cy={sy} r={3} fill={color} opacity={idle ? 0.85 : 0.95} />
      <circle cx={ex} cy={ey} r={3} fill={color} opacity={idle ? 0.85 : 0.95} />
      {label && (
        <>
          <rect x={mx - lw / 2} y={my - 11} width={lw} height={22} rx={11} fill="var(--slab-raised)" stroke={color} strokeWidth={1} />
          <text x={mx} y={my + 4} textAnchor="middle" fontSize={10} fontWeight={700} letterSpacing="0.06em" fill={color}>{label}</text>
        </>
      )}
    </g>
  )
}

/* ── Node card — the builder's exact silhouette (rounded-12, hover spring,
   icon+type header row, title row), with the run-state accent/badge this
   canvas needs that a static config graph doesn't. Description moves into the
   hover tooltip, same as the builder's nodes. ── */
function NodeCard({ node, state }: { node: GNode; state: NState }) {
  const col = STATE_COLOR[state]
  const lit = state === 'running' || state === 'waiting'
  const hoverRing = '0 0 0 3px color-mix(in srgb, var(--brand) 22%, transparent), 0 6px 18px rgba(0,0,0,.3)'

  if (node.isStart) {
    return (
      <Tooltip label={node.sub} side="top">
        <motion.div initial={false} animate={{ left: node.x, top: node.y }} transition={HOVER_SPRING}
          whileHover={{ scale: 1.05 }}
          className="absolute grid place-items-center rounded-full text-[12px] font-semibold"
          style={{ width: START_W, height: START_H, background: 'color-mix(in srgb, var(--ok) 15%, var(--slab))', border: '1.5px solid var(--ok)', color: 'var(--ok)' }}>
          Start
        </motion.div>
      </Tooltip>
    )
  }

  return (
    <Tooltip label={node.sub} side="top">
      <motion.div initial={false} animate={{ left: node.x, top: node.y }} transition={HOVER_SPRING}
        whileHover={{ scale: 1.03, boxShadow: hoverRing }}
        className="absolute overflow-hidden rounded-[12px]"
        style={{ width: NODE_W, height: NODE_H, background: 'var(--slab)', border: `1.5px solid ${state === 'queued' ? 'var(--glass-line)' : col}`, opacity: state === 'queued' ? 0.75 : 1, boxShadow: lit ? `0 0 0 3px color-mix(in srgb, ${col} 24%, transparent)` : '0 1px 3px rgba(0,0,0,.18)' }}>
        <div className="flex items-center gap-1.5 px-2.5 pt-2.5">
          <span style={{ color: state === 'queued' ? 'var(--muted-deep)' : col }}><KindGlyph kind={node.kind} size={17} /></span>
          <span className="truncate text-[12px] font-semibold uppercase tracking-[.04em]" style={{ color: 'var(--muted)' }}>{KIND_TYPE[node.kind]}</span>
          <span className="ml-auto shrink-0 rounded-full px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-[.04em]"
            style={{ color: col, background: state === 'queued' ? 'var(--wash-3)' : `color-mix(in srgb, ${col} 16%, transparent)` }}>
            {stateLabel(state, node.kind)}
          </span>
        </div>
        <div className="px-2.5 pb-2.5 pt-1.5">
          <span className="block truncate text-[14px] font-medium" style={{ color: state === 'queued' ? 'var(--muted)' : 'var(--text)' }}>{node.title}</span>
        </div>
      </motion.div>
    </Tooltip>
  )
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block h-[7px] w-[7px] rounded-full align-middle" style={{ background: color }} />
}

/* Type glyphs, sized by the caller. */
function KindGlyph({ kind, size = 20 }: { kind: Kind; size?: number }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (kind === 'tool') return <svg viewBox="0 0 24 24" width={size} height={size} {...p} aria-hidden><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2z" /></svg>
  if (kind === 'human') return <svg viewBox="0 0 24 24" width={size} height={size} {...p} aria-hidden><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
  return <svg viewBox="0 0 24 24" width={size} height={size} {...p} aria-hidden><rect x="4" y="7" width="16" height="12" rx="2.5" /><path d="M12 3v4M9 13h.01M15 13h.01" /></svg>
}
