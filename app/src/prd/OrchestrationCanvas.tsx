/* The Orchestration Builder — the Agent-Designer canvas (Ajay's flow).
 *
 * A Copilot-Studio-style node-graph builder. The Canvas tab carries its own
 * mini-header: the editable process name on the left, the Build / Execute /
 * Analytics section tabs in the middle, and the section's actions on the right
 * (undo · redo · version history · save · run in Build). Build is the node graph;
 * Run ▶ switches to Execute and starts a scripted run whose Process Activity
 * panel and conversation stay in lockstep; Analytics unlocks once the run
 * finishes. The library, the per-node config drawer and the version-history
 * drawer FLOAT over the canvas (the config/history drawers slide from the right
 * edge and are resizable). Lucide icons throughout; AAVA colour scheme.
 *
 * Colours (AAVA's own run convention): indigo = selected; primary button = Run;
 * blue = agent; green = start/merge; amber = HITL; violet = Split. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Actions, DockLocation, Layout, Model, TabNode } from 'flexlayout-react'
import type { IJsonModel } from 'flexlayout-react'
import {
  Save, Play, Maximize2, Minimize2, X, Info, Search, ListFilter, ChevronDown, ChevronRight,
  GripVertical, Sparkles, Bot, Split as SplitIcon, GitMerge, Circle, Pencil, Copy,
  PanelLeftClose, Hand, ZoomIn, ZoomOut, Undo2, Redo2, Maximize, UserCheck,
  Lock, GitFork, CirclePlus, Workflow, History, Send, CircleStop, Loader2, Plug, Cpu,
  Bold, Italic, Strikethrough, List, Link2, Wrench, BookOpen, Check, ShieldCheck,
} from 'lucide-react'
import { Tooltip } from '../components/chrome/Tooltip'
import { matchById } from './agentFlow'
import { HldDocument } from './HldDocument'
import { VersionHistoryPanel } from './AgentDrawers'
import { AnalyticsView, ExecuteView, useExecutionRun } from './AgentExecution'
import type { ExecStep } from './AgentExecution'
import type { ActiveObject, ArtifactMatch } from '../state/types'
import '../design/flexlayout-theme.css'

/* The hover spring — the reference motion config used across the canvas. */
const HOVER_SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 }

interface Props {
  object: ActiveObject
  onCollapse: () => void
  onToast: (text: string) => void
  expanded?: boolean
  onToggleExpand?: () => void
  /** Legacy hook — Run is now handled inside the canvas (Execute tab); kept
      optional so callers that still pass it don't break. */
  onRun?: () => void
  /** Read-only until cloned: the header shows Clone + a read-only banner, and the
      floating library / per-node config / section tabs are hidden. */
  readOnly?: boolean
  /** The canvas Clone button — make a working copy and start customising. */
  onClone?: () => void
  /** The user added a Stakeholder Review node — render it after HITL Review. */
  stakeholderAdded?: boolean
}

/* ── The HLD Architecture Builder graph ────────────────────────────────────
   The golden process the user opens and clones: a linear HLD chain, laid out
   either left-to-right (horizontal) or top-to-bottom (vertical) from the toolbar
   toggle. The Stakeholder Review node is appended after HITL once the user adds
   it. Positions are computed from the flow order + layout, so the switch is just
   a re-map (animated by motion). */

type NodeKind = 'start' | 'generated' | 'aava-agent' | 'split' | 'merge' | 'hitl'
type Layout = 'horizontal' | 'vertical'
interface FlowNode { id: string; kind: NodeKind; label: string; artId?: string; desc: string }
interface GNode extends FlowNode { x: number; y: number }
interface GEdge { from: string; to: string }

const FLOW: FlowNode[] = [
  { id: 'start', kind: 'start', label: 'Start Flow', desc: 'The entry point of the process.' },
  { id: 'arch', kind: 'aava-agent', label: 'Architecture Analysis', artId: '5346', desc: 'Analyses the system context and constraints to frame the architecture.' },
  { id: 'solution', kind: 'generated', label: 'Solution Proposal', artId: '6346', desc: 'Proposes the high-level solution and its component breakdown.' },
  { id: 'c4', kind: 'aava-agent', label: 'C4 Diagram Generation', artId: '6412', desc: 'Generates C4 context, container and component diagrams.' },
  { id: 'api', kind: 'aava-agent', label: 'API Contract', artId: '7346', desc: 'Derives the API contract from the solution design.' },
  { id: 'docs', kind: 'aava-agent', label: 'Documentation', artId: '8346', desc: 'Assembles the HLD document from the produced artifacts.' },
  { id: 'architect', kind: 'aava-agent', label: 'Architect Review', artId: '9346', desc: 'An architect agent reviews the design for soundness.' },
  { id: 'hitl', kind: 'hitl', label: 'HITL Review', desc: 'A human reviewer signs off before publish.' },
]
/* The Stakeholder Review node, appended after HITL Review when the user adds it. */
const STAKEHOLDER: FlowNode = { id: 'stakeholder', kind: 'hitl', label: 'Stakeholder Review', desc: 'Stakeholders review and approve the final design.' }

const NODE_W = 208, NODE_H = 58, GATE_W = 96, GATE_H = 52, START_W = 84

/* The Execute run's steps, derived from the graph so the activity panel, the
   graph and the conversation name the same things. The first agent step asks for
   the requirement brief; the agent steps emit artefact cards; HITL steps gate. */
const OUTPUTS: Record<string, string> = {
  arch: 'Mapped the system context and constraints: 1 primary actor (Shopper), 2 external systems (Card Gateway, Event Bus), and a hard p99 < 250 ms budget. Framed a thin stateless authorisation service fronted by an idempotency store.',
  solution: 'Proposed a stateless Auth API fronting the card processor, a Redis idempotency store keyed on the client token, and an async fan-out to the billing and analytics pipelines. A circuit breaker fails closed on gateway timeout.',
  c4: 'Generated the C4 set — Context, Container and Component views — from the confirmed solution. No ambiguous boundaries remained after the analysis pass.',
  api: 'Derived the authorise/capture contract: POST /api/v1/payments/authorise with an Idempotency-Key header; 201 authorised / 402 gateway_declined.',
  docs: 'Assembled the HLD document: overview, architecture analysis, the C4 diagram set, the API contract, and a design-review section with one open question flagged for the architect.',
}
function toExecSteps(flow: FlowNode[]): ExecStep[] {
  let firstAgent = true
  return flow.map((n) => {
    const label = n.label === 'Start Flow' ? 'Start' : n.label
    if (n.kind === 'start') return { id: n.id, label, kind: n.kind, run: 500 }
    if (n.kind === 'hitl') return { id: n.id, label, kind: n.kind, gate: true, run: 900 }
    const isAgent = n.kind === 'aava-agent' || n.kind === 'generated'
    const wantsInput = isAgent && firstAgent
    if (wantsInput) firstAgent = false
    const out = OUTPUTS[n.id]
    return {
      id: n.id, label, kind: n.kind, run: 1200,
      input: wantsInput || undefined,
      output: out ? { title: `${label} · output`, body: out } : undefined,
    }
  })
}

/* Place the flow's nodes for a layout. Horizontal marches right; vertical
   marches down a single column. */
function placeNodes(flow: FlowNode[], layout: Layout): GNode[] {
  return flow.map((n, i) => {
    if (layout === 'vertical') {
      const x = 220 + (n.kind === 'start' ? (NODE_W - START_W) / 2 : 0)
      return { ...n, x, y: 24 + i * 108 }
    }
    const x = i === 0 ? 24 : 132 + (i - 1) * 244
    return { ...n, x, y: 150 + (n.kind === 'start' ? 2 : 0) }
  })
}
function nodeW(kind: NodeKind) { return kind === 'start' ? START_W : kind === 'split' || kind === 'merge' ? GATE_W : NODE_W }
function nodeH(kind: NodeKind) { return kind === 'start' ? 56 : kind === 'split' || kind === 'merge' ? GATE_H : NODE_H }

const KIND_ACCENT: Record<NodeKind, string> = {
  start: 'var(--ok)', generated: 'var(--brand)', 'aava-agent': 'var(--zone-canvas-accent)',
  split: 'var(--zone-sidebar-accent)', merge: 'var(--ok)', hitl: 'var(--warn)',
}
const KIND_TYPE: Record<NodeKind, string> = {
  start: 'Start', generated: 'Generated Agent', 'aava-agent': 'AAVA Agent',
  split: 'Split', merge: 'Merge', hitl: 'Human in the loop',
}
function KindIcon({ kind, size = 14 }: { kind: NodeKind; size?: number }) {
  const p = { size, strokeWidth: 1.8 }
  if (kind === 'generated') return <Sparkles {...p} />
  if (kind === 'aava-agent') return <Bot {...p} />
  if (kind === 'split') return <SplitIcon {...p} />
  if (kind === 'merge') return <GitMerge {...p} />
  if (kind === 'hitl') return <UserCheck {...p} />
  return <Circle {...p} />
}

/* The workspace model — a Canvas tab always; the Sample I/O document tab is
   added on demand from the conversation. Tabs drag and split like Deepak's. */
function agentModel(): IJsonModel {
  return {
    global: { tabEnableClose: true, tabEnableRename: false, tabSetEnableMaximize: true, tabSetMinWidth: 160, tabSetMinHeight: 120 },
    layout: {
      type: 'row', weight: 100,
      children: [{
        type: 'tabset', id: 'agent-root', weight: 100,
        children: [{ type: 'tab', id: 'canvas', name: 'Canvas', component: 'canvas', enableClose: false }],
      }],
    },
  }
}

export function OrchestrationCanvas({ object, onCollapse, onToast, expanded, onToggleExpand, readOnly, onClone, stakeholderAdded }: Props) {
  /* The artifact this workspace is showing. */
  const artifact = matchById(object.activeArtifact)
  const [model] = useState(() => Model.fromJson(agentModel()))
  const docOpened = useRef(false)

  /* The process name shown in the Canvas tab's header. Read-only shows the
     golden name; cloning renames it to the user's working copy, which they can
     then rename inline. */
  const [name, setName] = useState(`${artifact.title} ${artifact.version}`)
  const wasReadOnly = useRef(readOnly)
  useEffect(() => {
    if (wasReadOnly.current && !readOnly) setName(`${artifact.title} — My Copy`)
    wasReadOnly.current = readOnly
  }, [readOnly, artifact.title])

  /* Open the Sample Run tab when the conversation's card asks — open-or-select,
     added into whichever tabset is active so a split is respected. */
  useEffect(() => {
    if (!object.agentDocOpen) return
    if (model.getNodeById('sampleIO')) { model.doAction(Actions.selectTab('sampleIO')); return }
    if (docOpened.current) return
    docOpened.current = true
    const target = model.getActiveTabset() ?? model.getFirstTabSet()
    if (!target) return
    model.doAction(Actions.addNode(
      { type: 'tab', id: 'sampleIO', name: 'Sample Run', component: 'sampleIO' },
      target.getId(), DockLocation.CENTER, -1, true,
    ))
  }, [object.agentDocOpen, model])

  return (
    <section aria-label="Canvas — orchestration builder" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${expanded ? '' : 'm-[12px] rounded-[var(--r-md)]'}`}
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)' }}>

        {/* The tab strip is the top-level chrome; each tab carries its own
            content's header inside. Expand/Close live on the strip's right. */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <Layout
            model={model}
            factory={(node: TabNode) => node.getComponent() === 'sampleIO'
              ? <HldDocument />
              : <AgentCanvasBody name={name} onRename={setName} artifact={artifact} onToast={onToast} readOnly={readOnly} onClone={onClone} stakeholderAdded={stakeholderAdded} />}
            onRenderTabSet={(_node, values) => {
              values.buttons.push(
                <TabStripActions key="ws-actions" expanded={expanded} onToggleExpand={onToggleExpand} onCollapse={onCollapse} />,
              )
            }}
            realtimeResize
          />
        </div>
      </div>
    </section>
  )
}

/* Expand and Close, docked at the right end of the tab strip. */
function TabStripActions({ expanded, onToggleExpand, onCollapse }: { expanded?: boolean; onToggleExpand?: () => void; onCollapse: () => void }) {
  return (
    <div className="flex items-center gap-0.5 pl-1">
      {onToggleExpand && (
        <Tooltip label={expanded ? 'Exit full screen' : 'Expand'} side="bottom">
          <button onClick={onToggleExpand} className="icon-btn h-7 w-7" aria-label={expanded ? 'Exit full screen' : 'Expand'}>
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </Tooltip>
      )}
      <Tooltip label="Close" side="bottom" align="end">
        <button onClick={onCollapse} className="icon-btn h-7 w-7" aria-label="Close"><X size={15} /></button>
      </Tooltip>
    </div>
  )
}

/* The editable process name in the Canvas header — double-click (when the copy
   is editable) turns it into an input; Enter or blur commits. */
function EditableName({ name, editable, onRename }: { name: string; editable: boolean; onRename: (n: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) { setDraft(name); ref.current?.focus(); ref.current?.select() } }, [editing, name])
  const commit = () => { const v = draft.trim(); if (v) onRename(v); setEditing(false) }
  if (editing) {
    return (
      <input ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)}
        onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="min-w-0 flex-1 rounded-[6px] px-1.5 py-0.5 text-[12.5px] font-semibold focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
        style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line)', color: 'var(--text)' }} />
    )
  }
  return (
    <span
      onDoubleClick={() => editable && setEditing(true)}
      title={editable ? 'Double-click to rename' : undefined}
      className={`truncate text-[12.5px] font-semibold ${editable ? 'cursor-text rounded-[6px] px-1 hover:bg-[var(--wash-2)]' : ''}`}
      style={{ color: 'var(--text)' }}>
      {name}
      {editable && <Pencil size={11} className="ml-1.5 inline opacity-0 transition-opacity group-hover/name:opacity-60" style={{ color: 'var(--muted)' }} />}
    </span>
  )
}

type Section = 'build' | 'execute' | 'analytics'

/* The Build / Execute / Analytics segmented control — the canvas's top-level
   sections. Analytics is disabled until a run has finished. */
function SectionTabs({ value, onChange, analyticsReady }: { value: Section; onChange: (s: Section) => void; analyticsReady: boolean }) {
  const tabs: { id: Section; label: string; disabled?: boolean }[] = [
    { id: 'build', label: 'Build' },
    { id: 'execute', label: 'Execute' },
    { id: 'analytics', label: 'Analytics', disabled: !analyticsReady },
  ]
  return (
    <div className="mx-auto flex shrink-0 items-center gap-0.5 rounded-[9px] p-[2px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => !t.disabled && onChange(t.id)} disabled={t.disabled} aria-pressed={value === t.id}
          title={t.disabled ? 'Available once a run has finished' : undefined}
          className="press rounded-[7px] px-3 py-1 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          style={value === t.id ? { background: 'var(--brand)', color: '#fff' } : { color: 'var(--muted)' }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* The Canvas tab's content — a mini-header (name · sections · actions) over one
   of three surfaces: the node-graph builder (Build), the scripted run (Execute),
   or the run metrics (Analytics). Read-only shows the graph with a Clone action;
   cloning makes the name editable and unlocks the sections + toolbar. */
function AgentCanvasBody({ name, onRename, artifact, onToast, readOnly, onClone, stakeholderAdded }: {
  name: string; onRename: (n: string) => void; artifact: ArtifactMatch
  onToast: (t: string) => void; readOnly?: boolean; onClone?: () => void; stakeholderAdded?: boolean
}) {
  const [section, setSection] = useState<Section>('build')
  const [selected, setSelected] = useState<string | null>(null)
  const [drawer, setDrawer] = useState<'none' | 'history'>('none')
  const [libOpen, setLibOpen] = useState(true)
  const [zoom, setZoom] = useState(0.62)
  const [layout, setLayout] = useState<Layout>('horizontal')

  const flow = useMemo(() => stakeholderAdded ? [...FLOW, STAKEHOLDER] : FLOW, [stakeholderAdded])
  const nodes = useMemo(() => placeNodes(flow, layout), [flow, layout])
  const edges = useMemo<GEdge[]>(() => flow.slice(1).map((n, i) => ({ from: flow[i].id, to: n.id })), [flow])
  const vbW = layout === 'vertical' ? 220 + NODE_W + 60 : nodes[nodes.length - 1].x + NODE_W + 40
  const vbH = layout === 'vertical' ? 24 + nodes.length * 108 + 20 : 340
  const selNode = useMemo(() => nodes.find((n) => n.id === selected) ?? null, [nodes, selected])

  const execSteps = useMemo(() => toExecSteps(flow), [flow])
  const run = useExecutionRun(execSteps, () => onToast('Execution complete — Analytics is now available'), onToast)

  const select = (id: string) => { if (readOnly) return; setSelected(id); setDrawer('none'); setLibOpen(false) }
  const openHistory = () => { setDrawer('history'); setSelected(null) }
  const startRun = () => { setSection('execute'); run.start() }
  const cancelRun = () => { run.cancel(); setSection('build') }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Mini-header — name · sections · actions. A three-column grid keeps the
          section tabs centred regardless of how wide the action group is, so the
          tabs don't shift when switching Build ↔ Execute ↔ Analytics. */}
      <div className="group/name grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-1.5" style={{ background: 'var(--slab-raised)', borderBottom: '1px solid var(--glass-line-soft)' }}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[6px]" style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}><Info size={12} /></span>
          <EditableName name={name} editable={!readOnly} onRename={onRename} />
          {readOnly && <span className="mono shrink-0 text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{artifact.uses} uses · {artifact.teams} teams</span>}
        </div>

        <div className="justify-self-center">
          {!readOnly && <SectionTabs value={section} onChange={setSection} analyticsReady={run.complete} />}
        </div>

        <div className="flex items-center gap-1 justify-self-end">
          {readOnly ? (
            <button onClick={() => (onClone ? onClone() : onToast('Cloned'))} className="btn-primary" style={{ minHeight: 30, padding: '5px 12px' }}><GitFork size={13} />Clone</button>
          ) : section === 'execute' ? (
            <>
              {run.complete ? (
                <button onClick={run.restart} className="btn-secondary" style={{ minHeight: 30, padding: '5px 12px' }}><Play size={13} fill="currentColor" />Run</button>
              ) : (
                <button onClick={cancelRun} className="press inline-flex items-center gap-1.5 rounded-[9px] text-[12.5px] font-semibold" style={{ minHeight: 30, padding: '5px 12px', color: 'var(--danger)', background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)' }}><CircleStop size={13} />Cancel run</button>
              )}
              <button onClick={() => onToast('Sent for approval')} className="btn-primary" style={{ minHeight: 30, padding: '5px 12px' }}><Send size={13} />Send for approval</button>
            </>
          ) : section === 'analytics' ? (
            <button onClick={() => onToast('Report exported')} className="btn-secondary" style={{ minHeight: 30, padding: '5px 12px' }}>Export report</button>
          ) : (
            <>
              <Tooltip label="Undo" side="bottom"><button onClick={() => onToast('Undo')} className="icon-btn h-7 w-7" aria-label="Undo"><Undo2 size={15} /></button></Tooltip>
              <Tooltip label="Redo" side="bottom"><button onClick={() => onToast('Redo')} className="icon-btn h-7 w-7" aria-label="Redo"><Redo2 size={15} /></button></Tooltip>
              <Tooltip label="Version history" side="bottom"><button onClick={openHistory} aria-pressed={drawer === 'history'} className="icon-btn h-7 w-7" aria-label="Version history"><History size={15} /></button></Tooltip>
              <Tooltip label="Save" side="bottom"><button onClick={() => onToast('Working copy saved')} className="icon-btn h-7 w-7" aria-label="Save"><Save size={15} /></button></Tooltip>
              <button onClick={startRun} className="btn-primary ml-0.5" style={{ minHeight: 30, padding: '5px 12px' }}><Play size={13} fill="currentColor" />Run</button>
            </>
          )}
        </div>
      </div>

      {/* Read-only banner (Build only). */}
      {readOnly && (
        <div className="flex shrink-0 items-center gap-2 px-3.5 py-1.5 text-[11.5px]"
          style={{ background: 'var(--warn-surface)', color: 'var(--warn)', borderBottom: '1px solid var(--glass-line-soft)' }}>
          <Lock size={12} />
          <span>Read-only — <button onClick={() => (onClone ? onClone() : onToast('Cloned'))} className="font-semibold underline underline-offset-2" style={{ color: 'var(--warn)' }}>Clone</button> to adapt this workflow to your process.</span>
        </div>
      )}

      {/* ── Execute ─────────────────────────────────────────────────────────── */}
      {!readOnly && section === 'execute' ? (
        <ExecuteView name={name} subtitle={artifact.title + ' — takes a requirement brief and produces an HLD with C4 diagrams'} steps={execSteps} run={run} onToast={onToast} />
      ) : !readOnly && section === 'analytics' ? (
        <AnalyticsView steps={execSteps} run={run} onToast={onToast} />
      ) : (
        /* ── Build (node graph) ────────────────────────────────────────────── */
        <div className="relative min-h-0 flex-1 overflow-hidden"
          style={{ backgroundColor: 'var(--slab, #0e1017)', backgroundImage: 'radial-gradient(circle at 28% 0%, color-mix(in srgb, var(--brand) 10%, transparent), transparent 55%), radial-gradient(var(--glass-line-soft) 1px, transparent 1px)', backgroundSize: 'auto, 24px 24px' }}>
          {/* Graph */}
          <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${zoom})`, width: vbW, height: vbH }}>
            <svg width={vbW} height={vbH} className="pointer-events-none absolute inset-0" aria-hidden>
              {edges.map((e) => {
                const a = nodes.find((n) => n.id === e.from)!, b = nodes.find((n) => n.id === e.to)!
                const aw = nodeW(a.kind), ah = nodeH(a.kind), bw = nodeW(b.kind), bh = nodeH(b.kind)
                const added = e.to === 'stakeholder'
                let d: string, sx: number, sy: number, ex: number, ey: number
                if (layout === 'vertical') {
                  sx = a.x + aw / 2; sy = a.y + ah; ex = b.x + bw / 2; ey = b.y
                  const my = (sy + ey) / 2
                  d = `M ${sx} ${sy} C ${sx} ${my}, ${ex} ${my}, ${ex} ${ey}`
                } else {
                  sx = a.x + aw; sy = a.y + ah / 2; ex = b.x; ey = b.y + bh / 2
                  const mx = (sx + ex) / 2
                  d = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`
                }
                return (
                  <g key={e.from + e.to}>
                    <path d={d} fill="none" stroke={added ? 'var(--brand)' : 'var(--zone-canvas-accent)'} strokeWidth={1.5} strokeDasharray="5 5" opacity={added ? 0.85 : 0.55} />
                    <circle cx={sx} cy={sy} r={3} fill={added ? 'var(--brand)' : 'var(--zone-canvas-accent)'} opacity={0.7} />
                    <circle cx={ex} cy={ey} r={3} fill={added ? 'var(--brand)' : 'var(--zone-canvas-accent)'} opacity={0.7} />
                  </g>
                )
              })}
            </svg>
            {nodes.map((n) => <NodeCard key={n.id} node={n} selected={n.id === selected} added={n.id === 'stakeholder'} readOnly={readOnly} onSelect={() => select(n.id)} onToast={onToast} />)}
          </div>

          {/* Floating add-panel — only on the editable working copy. */}
          {!readOnly && (libOpen
            ? <Library onCollapse={() => setLibOpen(false)} />
            : (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={HOVER_SPRING}
                onClick={() => setLibOpen(true)} aria-label="Open add panel"
                className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full px-3 py-2 shadow-lg"
                style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
                <CirclePlus size={16} style={{ color: 'var(--brand)' }} />
                <span className="text-[12px] font-medium" style={{ color: 'var(--text-dim)' }}>Add</span>
              </motion.button>
            ))}

          {/* Floating panels over the canvas — node config OR version history,
              pinned like the Add library rather than docked to the edge. */}
          <AnimatePresence>
            {!readOnly && drawer === 'history' && (
              <VersionHistoryPanel key="history" onClose={() => setDrawer('none')} onToast={onToast} />
            )}
            {!readOnly && drawer === 'none' && selNode && (
              <ConfigPanel key="config" node={selNode} onClose={() => setSelected(null)} onToast={onToast} />
            )}
          </AnimatePresence>

          {/* Bottom-center controls. */}
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-full px-1.5 py-1 shadow-lg"
            style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)' }}>
            {([
              ['Pan', Hand, () => onToast('Pan'), true],
              ['Zoom in', ZoomIn, () => setZoom((z) => Math.min(1.4, z + 0.12)), true],
              ['Zoom out', ZoomOut, () => setZoom((z) => Math.max(0.35, z - 0.12)), true],
              ['Fit to view', Maximize, () => setZoom(layout === 'vertical' ? 0.72 : 0.5), true],
            ] as const).filter(([, , , show]) => show).map(([label, Icon, fn]) => (
              <Tooltip key={label} label={label} side="top">
                <button className="icon-btn h-8 w-8" aria-label={label} onClick={fn}><Icon size={15} /></button>
              </Tooltip>
            ))}
            <span className="mx-0.5 h-5 w-px" style={{ background: 'var(--glass-line-soft)' }} aria-hidden />
            <Tooltip label={layout === 'horizontal' ? 'Switch to vertical layout' : 'Switch to horizontal layout'} side="top" align="end">
              <button className="icon-btn h-8 w-8" aria-label="Switch layout"
                aria-pressed={layout === 'vertical'}
                onClick={() => setLayout((l) => l === 'horizontal' ? 'vertical' : 'horizontal')}>
                <Workflow size={15} style={{ color: 'var(--brand)', transform: layout === 'vertical' ? 'rotate(90deg)' : undefined }} />
              </button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Node card ────────────────────────────────────────────────────────────── */

function NodeCard({ node, selected, added, readOnly, onSelect, onToast }: { node: GNode; selected: boolean; added?: boolean; readOnly?: boolean; onSelect: () => void; onToast: (t: string) => void }) {
  const accent = KIND_ACCENT[node.kind]
  /* The hover feel is shared: a subtle lift + a primary-tinted ring, on the
     reference spring. The base ring (selected/added) stays underneath. */
  const hoverRing = '0 0 0 3px color-mix(in srgb, var(--brand) 22%, transparent), 0 6px 18px rgba(0,0,0,.3)'

  if (node.kind === 'start') {
    return (
      <Tooltip label={node.desc} side="top">
        <motion.button onClick={onSelect} initial={false} animate={{ left: node.x, top: node.y }} transition={HOVER_SPRING}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          className="absolute grid place-items-center rounded-full text-[11px] font-semibold"
          style={{ width: START_W, height: 56, background: 'color-mix(in srgb, var(--ok) 15%, var(--slab))', border: `1.5px solid ${selected ? 'var(--brand)' : accent}`, color: 'var(--ok)' }}>Start</motion.button>
      </Tooltip>
    )
  }
  if (node.kind === 'split' || node.kind === 'merge') {
    return (
      <Tooltip label={node.desc} side="top">
        <motion.button onClick={onSelect} initial={false} animate={{ left: node.x, top: node.y }} transition={HOVER_SPRING}
          whileHover={{ scale: 1.05, boxShadow: hoverRing }} whileTap={{ scale: 0.97 }}
          className="absolute grid place-items-center gap-0.5 rounded-[12px]"
          style={{ width: GATE_W, height: GATE_H, background: `color-mix(in srgb, ${accent} 16%, var(--slab))`, border: `1.5px solid ${selected ? 'var(--brand)' : accent}`, color: accent }}>
          <KindIcon kind={node.kind} size={15} />
          <span className="text-[10px] font-bold uppercase tracking-[.06em]">{node.kind}</span>
        </motion.button>
      </Tooltip>
    )
  }
  const border = added ? 'var(--brand)' : selected ? 'var(--brand)' : 'var(--glass-line)'
  const baseShadow = (selected || added) ? '0 0 0 3px color-mix(in srgb, var(--brand) 28%, transparent)' : '0 1px 3px rgba(0,0,0,.18)'
  return (
    <Tooltip label={node.desc} side="top">
    <motion.div onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onSelect() }}
      initial={false} animate={{ left: node.x, top: node.y }} transition={HOVER_SPRING}
      whileHover={readOnly ? { scale: 1.02, boxShadow: hoverRing } : { scale: 1.03, boxShadow: hoverRing }}
      whileTap={readOnly ? undefined : { scale: 0.99 }}
      className={`absolute overflow-hidden rounded-[12px] ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
      style={{ width: NODE_W, height: NODE_H, background: 'var(--slab)', border: `1.5px solid ${border}`, boxShadow: baseShadow }}>
      <div className="flex items-center gap-1.5 px-2.5 pt-1.5">
        <span style={{ color: accent }}><KindIcon kind={node.kind} size={12} /></span>
        <span className="text-[9.5px] font-semibold uppercase tracking-[.05em]" style={{ color: 'var(--muted)' }}>{KIND_TYPE[node.kind]}</span>
        {added
          ? <span className="mono ml-auto rounded-full px-1.5 text-[9px] font-bold uppercase tracking-[.06em]" style={{ background: 'color-mix(in srgb, var(--brand) 18%, transparent)', color: 'var(--brand)' }}>New</span>
          : <span className="mono ml-auto text-[9.5px]" style={{ color: 'var(--muted-deep)' }}>{node.artId ? `ID:${node.artId}` : ''}</span>}
      </div>
      <div className="flex items-center gap-1.5 px-2.5 pb-1.5 pt-1">
        <span className="truncate text-[12.5px] font-medium" style={{ color: 'var(--text)' }}>{node.label}</span>
        {!readOnly && (
          <span className="ml-auto flex shrink-0 items-center gap-0.5">
            {node.kind === 'generated' && (
              <Tooltip label="Edit" side="top">
                <button onClick={(e) => { e.stopPropagation(); onToast('Edit generated agent') }} aria-label="Edit" className="grid h-5 w-5 place-items-center rounded-[5px] hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}><Pencil size={11} /></button>
              </Tooltip>
            )}
            <Tooltip label="Duplicate" side="top">
              <button onClick={(e) => { e.stopPropagation(); onToast('Duplicated ' + node.label) }} aria-label="Duplicate" className="grid h-5 w-5 place-items-center rounded-[5px] hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}><Copy size={11} /></button>
            </Tooltip>
          </span>
        )}
      </div>
    </motion.div>
    </Tooltip>
  )
}

/* ── Floating library ─────────────────────────────────────────────────────── */

const ARTEFACTS = [
  { icon: Sparkles, label: 'AI-Powered Task', badge: 'Process', id: '2345' },
  { icon: Cpu, label: 'AI-Powered Task', badge: 'Workflow', id: '4567' },
  { icon: Bot, label: 'AI-Powered Task', badge: 'Agent', id: '3456' },
]
const LOGIC = ['Split', 'Merge', 'If else', 'Multi-way Switch routing', 'Pattern match routing', 'Predicate-Based Intelligent Routing']
const BLOCKS = ['Start', 'End', 'Human in the loop']

function Library({ onCollapse }: { onCollapse: () => void }) {
  return (
    <div className="absolute left-3 top-3 z-20 flex max-h-[calc(100%-24px)] w-[264px] flex-col overflow-hidden rounded-[var(--r-md)] shadow-xl"
      style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
        <CirclePlus size={16} style={{ color: 'var(--brand)' }} />
        <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Add</span>
        <Tooltip label="Collapse" side="bottom" align="end">
          <button onClick={onCollapse} className="icon-btn ml-auto h-7 w-7" aria-label="Collapse add panel"><PanelLeftClose size={15} /></button>
        </Tooltip>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2">
        <div className="mb-2 flex items-center gap-1.5">
          <div className="flex flex-1 items-center gap-1.5 rounded-[7px] px-2 py-1.5" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
            <Search size={12} style={{ color: 'var(--muted)' }} />
            <input placeholder="Search" className="min-w-0 flex-1 bg-transparent text-[11.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-none" style={{ color: 'var(--text-dim)' }} />
          </div>
          <Tooltip label="Filter" side="bottom">
            <button className="icon-btn h-7 w-7" aria-label="Filter"><ListFilter size={14} /></button>
          </Tooltip>
        </div>
        <LibSection label="Artefacts" defaultOpen>
          {ARTEFACTS.map((a) => (
            <div key={a.id} className="press mb-1 flex cursor-grab items-center gap-2 rounded-[8px] px-2 py-1.5 transition-colors hover:border-[color-mix(in_srgb,var(--brand)_45%,transparent)] hover:bg-[var(--wash-3)]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px]" style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}><a.icon size={13} /></span>
              <span className="min-w-0 flex-1 truncate text-[11.5px]" style={{ color: 'var(--text-dim)' }}>{a.label}</span>
              <span className="shrink-0 rounded-full px-1.5 py-[1px] text-[9px] font-medium" style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}>{a.badge}</span>
            </div>
          ))}
        </LibSection>
        <LibSection label="Logic"><Rows items={LOGIC} /></LibSection>
        <LibSection label="Building blocks"><Rows items={BLOCKS} /></LibSection>
      </div>
    </div>
  )
}
function Rows({ items }: { items: string[] }) {
  return <>{items.map((l) => (
    <div key={l} className="press group mb-0.5 flex cursor-grab items-center gap-2 rounded-[7px] border border-transparent px-2 py-1.5 transition-colors hover:border-[color-mix(in_srgb,var(--brand)_40%,transparent)] hover:bg-[var(--wash-2)]">
      <span className="text-[11.5px]" style={{ color: 'var(--text-dim)' }}>{l}</span>
      <GripVertical size={13} className="ml-auto opacity-60 transition-opacity group-hover:opacity-100" style={{ color: 'var(--muted-deep)' }} />
    </div>
  ))}</>
}

function LibSection({ label, defaultOpen, children }: { label: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="pb-1">
      <button onClick={() => setOpen((o) => !o)} className="press flex w-full items-center gap-1 px-1 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}{label}
      </button>
      {open && <div className="pt-0.5">{children}</div>}
    </div>
  )
}

/* ── Node config panel (floating over the canvas) ─────────────────────────────
   Floats like the Add library rather than docking to the edge. A Configure tab
   (model · instructions · knowledge base · tools · guardrails · MCP connectors)
   and a Run-node tab (a text input + Run, then the scripted run states).
   Split/Merge keep their own compact config. */
const CFG_TABS = ['Configure', 'Run node', 'Evaluate'] as const
function ConfigPanel({ node, onClose, onToast }: { node: GNode; onClose: () => void; onToast: (t: string) => void }) {
  const accent = KIND_ACCENT[node.kind]
  const isAgent = node.kind === 'aava-agent' || node.kind === 'generated'
  const [tab, setTab] = useState<(typeof CFG_TABS)[number]>('Configure')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -4 }} transition={HOVER_SPRING}
      className="absolute right-3 top-3 z-30 flex max-h-[calc(100%-24px)] w-[340px] flex-col overflow-hidden rounded-[var(--r-md)] shadow-xl"
      style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)', transformOrigin: 'top right' }}>
      <div className="flex shrink-0 items-center gap-2 px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
        <span className="grid h-6 w-6 place-items-center rounded-[7px]" style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}><KindIcon kind={node.kind} size={14} /></span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>{node.kind === 'generated' ? 'AI Generated Agent' : KIND_TYPE[node.kind]}</span>
        <Tooltip label="Close" side="bottom" align="end">
          <button onClick={onClose} className="icon-btn h-7 w-7" aria-label="Close"><X size={15} /></button>
        </Tooltip>
      </div>

      {isAgent && (
        <div className="flex shrink-0 gap-1 px-3.5 pt-2" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          {CFG_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className="press px-1.5 pb-2 text-[12px] font-medium"
              style={{ color: tab === t ? 'var(--brand)' : 'var(--muted)', borderBottom: `2px solid ${tab === t ? 'var(--brand)' : 'transparent'}`, marginBottom: -1 }}>{t}</button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3.5">
        {node.kind === 'split' || node.kind === 'merge' ? <SplitConfig />
          : !isAgent ? <div className="rounded-[8px] p-3 text-[12px] leading-[1.5]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>{node.desc}</div>
          : tab === 'Configure' ? <AgentConfigure node={node} />
          : tab === 'Run node' ? <RunNodePanel node={node} onToast={onToast} />
          : <div className="rounded-[8px] p-3 text-[12px] leading-[1.5]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>Evaluate this node against a test set — accuracy, latency and cost per run.</div>}
      </div>
    </motion.div>
  )
}

/* The Configure panel — model + instructions, then the agent's knowledge base,
   tools, guardrails and MCP connectors as accordions. */
function AgentConfigure({ node }: { node: GNode }) {
  const [instructions, setInstructions] = useState(`Takes a requirement brief and produces the ${node.label.toLowerCase()} for the HLD, grounded in the confirmed capability process. Cite a source for every component.`)
  return (
    <div className="flex flex-col gap-3">
      {/* Model */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Model</span>
        <div className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
          <Sparkles size={12} style={{ color: 'var(--zone-canvas-accent)' }} />
          <span className="text-[12px]" style={{ color: 'var(--text-dim)' }}>Claude Opus 5</span>
          <ChevronDown size={13} style={{ color: 'var(--muted)' }} />
        </div>
      </div>

      {/* Instructions */}
      <div>
        <div className="mb-1 text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Instructions</div>
        <div className="overflow-hidden rounded-[8px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
          <div className="flex items-center gap-0.5 px-2 py-1.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
            {[Bold, Italic, Strikethrough, List, Link2].map((I, i) => (
              <span key={i} className="grid h-6 w-6 place-items-center rounded-[5px]" style={{ color: 'var(--muted)' }}><I size={13} /></span>
            ))}
          </div>
          <textarea rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)}
            className="w-full resize-none bg-transparent px-3 py-2 text-[12px] leading-[1.55] focus-visible:outline-none" style={{ color: 'var(--text-dim)' }} />
        </div>
      </div>

      {/* Knowledge base */}
      <Accordion label="Knowledge Base" icon={BookOpen} defaultOpen>
        Architecture patterns, the org's reference HLD templates, and the connected repo's service map.
      </Accordion>

      {/* Tools */}
      <Accordion label="Tools" icon={Wrench}>
        <div className="flex flex-wrap gap-1.5">
          {['C4 renderer', 'API registry', 'Token reader'].map((t) => (
            <span key={t} className="flex items-center gap-1.5 rounded-[7px] px-2 py-1 text-[11.5px]" style={{ background: 'var(--wash-3)', color: 'var(--text-dim)' }}>
              <Wrench size={11} style={{ color: 'var(--zone-canvas-accent)' }} />{t}
            </span>
          ))}
        </div>
      </Accordion>

      {/* Guardrails */}
      <Accordion label="Guardrails" icon={ShieldCheck}>
        Cites a source for every component; will not invent an interface absent from the API registry; stops at the design-review gate for a human sign-off.
      </Accordion>

      {/* MCP connectors */}
      <Accordion label="MCP connectors" icon={Plug} defaultOpen>
        <div className="flex flex-col gap-1.5">
          {[['Jira', 'connected'], ['Azure DevOps', 'connected'], ['Confluence', 'idle']].map(([n, st]) => (
            <div key={n} className="flex items-center gap-2 text-[11.5px]" style={{ color: 'var(--text-dim)' }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: st === 'connected' ? 'var(--ok)' : 'var(--muted-deep)' }} />
              {n}<span className="ml-auto text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{st}</span>
            </div>
          ))}
        </div>
      </Accordion>
    </div>
  )
}

/* A compact config accordion — a titled, collapsible section on the inner wash. */
function Accordion({ label, icon: Icon, defaultOpen, children }: { label: string; icon: typeof BookOpen; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="overflow-hidden rounded-[8px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
      <button onClick={() => setOpen((o) => !o)} className="press flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-semibold" style={{ color: 'var(--text-dim)' }}>
        <Icon size={14} style={{ color: 'var(--muted)' }} />{label}
        {open ? <ChevronDown size={13} className="ml-auto" /> : <ChevronRight size={13} className="ml-auto" />}
      </button>
      {open && <div className="px-3 pb-2.5 text-[11.5px] leading-[1.5]" style={{ color: 'var(--muted)' }}>{children}</div>}
    </div>
  )
}

/* The Run-node tab — a text input + Run, then the scripted single-node run
   states (running → ran actions → response), the reference execution feel. */
function RunNodePanel({ node, onToast }: { node: GNode; onToast: (t: string) => void }) {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [input, setInput] = useState('')
  const timers = useRef<number[]>([])
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const run = () => {
    setPhase('running')
    timers.current.push(window.setTimeout(() => { setPhase('done'); onToast('Node run complete') }, 1900))
  }
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = []; setPhase('idle') }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="mb-1 text-[11px]" style={{ color: 'var(--muted)' }}>Load values from previous run</div>
        <div className="flex items-center justify-between rounded-[8px] px-2.5 py-2" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
          <span className="text-[12px]" style={{ color: 'var(--muted)' }}>Select a run…</span>
          <ChevronDown size={13} style={{ color: 'var(--muted)' }} />
        </div>
      </div>

      <div>
        <div className="mb-1 text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Input</div>
        <textarea rows={3} value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Provide a sample input for ${node.label}…`}
          className="w-full resize-none rounded-[8px] px-3 py-2 text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }} />
      </div>

      {phase === 'running'
        ? <button onClick={stop} className="btn-secondary self-start" style={{ minHeight: 30, padding: '5px 12px' }}><CircleStop size={13} />Stop</button>
        : <button onClick={run} className="btn-primary self-start" style={{ minHeight: 30, padding: '5px 12px' }}><Play size={12} fill="currentColor" />Run</button>}

      {phase === 'running' && (
        <div className="flex items-center gap-2.5 rounded-[9px] px-3 py-2.5" style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
          <Loader2 size={14} className="animate-spin" style={{ color: 'var(--brand)' }} />
          <div>
            <div className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Running node</div>
            <div className="text-[11px]" style={{ color: 'var(--muted)' }}>Preparing inputs and connecting to the runtime.</div>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex flex-col gap-2">
          {['C4 renderer · render', 'API registry · lookup'].map((a) => (
            <div key={a} className="rounded-[9px] px-3 py-2" style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
              <div className="flex items-center gap-2 text-[11.5px]" style={{ color: 'var(--text-dim)' }}>
                <Check size={12} strokeWidth={3} style={{ color: 'var(--ok)' }} />Ran action · {a}
              </div>
              <div className="mt-0.5 pl-5 text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>Delivered in {a.includes('C4') ? '986 ms' : '720 ms'}</div>
            </div>
          ))}
          <div className="text-[11px]" style={{ color: 'var(--muted)' }}>Thought for 12 seconds</div>
          <div className="rounded-[9px] p-3" style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[.08em]" style={{ color: 'var(--muted-deep)' }}>Response</div>
            <div className="text-[12px] leading-[1.6]" style={{ color: 'var(--text-dim)' }}>{OUTPUTS[node.id] ?? `${node.label} ran against the sample input and produced its section of the HLD.`}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function SplitConfig() {
  const [agents, setAgents] = useState(['C4 Context', 'C4 Container', 'C4 Component', 'Design Review'])
  return (
    <>
      <div className="mb-2 text-[11px] font-medium" style={{ color: 'var(--text-dim)' }}>Select agents to configure</div>
      {agents.map((a) => (
        <div key={a} className="mb-1 flex items-center gap-2 rounded-[7px] px-2.5 py-1.5" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
          <span className="min-w-0 flex-1 truncate text-[12px]" style={{ color: 'var(--text-dim)' }}>{a}</span>
          <button onClick={() => setAgents((xs) => xs.filter((x) => x !== a))} aria-label={`Remove ${a}`} className="grid h-5 w-5 place-items-center rounded-[5px] hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted-deep)' }}><X size={11} /></button>
        </div>
      ))}
      <button className="press mt-1 text-[11.5px] font-medium" style={{ color: 'var(--brand)' }}>Add New +</button>
      <div className="mt-3 flex gap-1 border-b pb-0" style={{ borderColor: 'var(--glass-line-soft)' }}>
        {['Distribution', 'On Failure', 'Monitor'].map((t, i) => (
          <span key={t} className="px-1.5 pb-1.5 text-[11px] font-medium" style={{ color: i === 0 ? 'var(--brand)' : 'var(--muted)', borderBottom: i === 0 ? '2px solid var(--brand)' : '2px solid transparent' }}>{t}</span>
        ))}
      </div>
      <div className="mt-2.5 rounded-[8px] p-2.5 text-[11.5px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>
        Distribution strategy — dataset A1 · A2 · A3 fan out to the four branches in parallel.
      </div>
    </>
  )
}
