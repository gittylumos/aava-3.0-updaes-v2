/* The Orchestration Builder — the Agent-Designer canvas (Ajay's flow).
 *
 * A Copilot-Studio-style node-graph builder: a thin top bar over a full-bleed
 * canvas, with the Artefact/Logic/Blocks library and the node config panel
 * FLOATING over the canvas rather than docked as columns. Opening a node's
 * config auto-collapses the library to a pill; the user can reopen it to have
 * both. Seeded graph with working demo interactions (select, config, Run,
 * pan/zoom/fit, collapse/expand). Lucide icons throughout; AAVA colour scheme.
 *
 * Colours (AAVA's own run convention): indigo = selected; primary button = Run;
 * blue = agent; green = start/merge; amber = HITL; violet = Split. */
import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  Save, Play, Maximize2, Minimize2, X, Info, Search, ListFilter, ChevronDown, ChevronRight,
  GripVertical, Sparkles, Bot, Split as SplitIcon, GitMerge, Circle, Pencil, Copy,
  PanelLeftClose, Hand, ZoomIn, ZoomOut, Undo2, Redo2, Maximize, UserCheck,
  BookOpen, ShieldCheck, Wrench, Boxes, Lock, GitFork, CirclePlus, Workflow,
} from 'lucide-react'
import { Tooltip } from '../components/chrome/Tooltip'
import { matchById } from './agentFlow'
import type { ActiveObject } from '../state/types'

/* The hover spring — the reference motion config used across the canvas. */
const HOVER_SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 }

interface Props {
  object: ActiveObject
  onCollapse: () => void
  onToast: (text: string) => void
  expanded?: boolean
  onToggleExpand?: () => void
  /** Run ▶ — hand off to the Playground (execution & monitoring), docked in the
      same panel. */
  onRun?: () => void
  /** Read-only until cloned: the top bar shows Clone + a read-only banner, and
      the floating library / per-node config are hidden. */
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

export function OrchestrationCanvas({ object, onCollapse, onToast, expanded, onToggleExpand, onRun, readOnly, onClone, stakeholderAdded }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [libOpen, setLibOpen] = useState(true)
  const [zoom, setZoom] = useState(0.62)
  const [layout, setLayout] = useState<Layout>('horizontal')

  /* The graph is the base HLD chain, plus the Stakeholder Review node once the
     user adds it to their working copy — placed for the current layout. */
  const flow = useMemo(() => stakeholderAdded ? [...FLOW, STAKEHOLDER] : FLOW, [stakeholderAdded])
  const nodes = useMemo(() => placeNodes(flow, layout), [flow, layout])
  const edges = useMemo<GEdge[]>(() => flow.slice(1).map((n, i) => ({ from: flow[i].id, to: n.id })), [flow])
  const vbW = layout === 'vertical' ? 220 + NODE_W + 60 : nodes[nodes.length - 1].x + NODE_W + 40
  const vbH = layout === 'vertical' ? 24 + nodes.length * 108 + 20 : 340
  const selNode = useMemo(() => nodes.find((n) => n.id === selected) ?? null, [nodes, selected])

  /* The artifact this canvas is showing (for the read-only header). */
  const artifact = matchById(object.activeArtifact)

  /* Selecting a node opens its config on the right and collapses the library to
     a pill — only once the copy is editable (read-only view has neither). */
  const select = (id: string) => { if (readOnly) return; setSelected(id); setLibOpen(false) }

  return (
    <section aria-label="Canvas — orchestration builder" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${expanded ? '' : 'm-[12px] rounded-[var(--r-md)]'}`}
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)' }}>

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          <span className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[12px] font-medium"
            style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>
            {artifact.title} {artifact.version}
            <Info size={12} style={{ color: 'var(--muted)' }} />
          </span>
          {readOnly && (
            <span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>{artifact.uses} uses · {artifact.teams} teams</span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {readOnly ? (
              /* Read-only: the one primary action is Clone. */
              <button onClick={() => (onClone ? onClone() : onToast('Cloned'))} className="btn-primary"><GitFork size={13} />Clone &amp; Customize</button>
            ) : (
              <>
                <Tooltip label="Save" side="bottom">
                  <button onClick={() => onToast('Working copy saved')} className="icon-btn" aria-label="Save"><Save size={16} /></button>
                </Tooltip>
                <button onClick={() => (onRun ? onRun() : onToast('Run started'))} className="btn-primary"><Play size={13} fill="currentColor" />Run</button>
              </>
            )}
            <span className="mx-0.5 h-5 w-px" style={{ background: 'var(--glass-line-soft)' }} aria-hidden />
            {onToggleExpand && (
              <Tooltip label={expanded ? 'Exit full screen' : 'Expand'} side="bottom">
                <button onClick={onToggleExpand} className="icon-btn" aria-label={expanded ? 'Exit full screen' : 'Expand'}>
                  {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
              </Tooltip>
            )}
            <Tooltip label="Close" side="bottom" align="end">
              <button onClick={onCollapse} className="icon-btn" aria-label="Close"><X size={16} /></button>
            </Tooltip>
          </div>
        </div>

        {/* Read-only banner — the amber "clone to modify" strip. */}
        {readOnly && (
          <div className="flex shrink-0 items-center gap-2 px-3.5 py-2 text-[12px]"
            style={{ background: 'var(--warn-surface)', color: 'var(--warn)', borderBottom: '1px solid var(--glass-line-soft)' }}>
            <Lock size={13} />
            <span>Read-only view — <button onClick={() => (onClone ? onClone() : onToast('Cloned'))} className="font-semibold underline underline-offset-2" style={{ color: 'var(--warn)' }}>Clone &amp; Customize</button> to adapt this workflow to your organisation’s HLD process.</span>
          </div>
        )}

        {/* ── Full-bleed canvas with floating panels over it ──────────────── */}
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

          {/* Floating add-panel + per-node config — only on the editable working copy. */}
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

          {/* Floating config — right; on node select (editable copy only). */}
          {!readOnly && selNode && <ConfigPanel node={selNode} onClose={() => setSelected(null)} onToast={onToast} onRun={() => (onRun ? onRun() : onToast('Run node'))} />}

          {/* Bottom-center controls. Read-only shows pan/zoom/fit + the layout
              toggle; the working copy also gets undo/redo. */}
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-full px-1.5 py-1 shadow-lg"
            style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)' }}>
            {([
              ['Pan', Hand, () => onToast('Pan'), true],
              ['Zoom in', ZoomIn, () => setZoom((z) => Math.min(1.4, z + 0.12)), true],
              ['Zoom out', ZoomOut, () => setZoom((z) => Math.max(0.35, z - 0.12)), true],
              ['Undo', Undo2, () => onToast('Undo'), !readOnly],
              ['Redo', Redo2, () => onToast('Redo'), !readOnly],
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
      </div>
    </section>
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
  { icon: Boxes, label: 'AI-Powered Task', badge: 'Workflow', id: '4567' },
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
        <Section label="Artefacts" defaultOpen>
          {ARTEFACTS.map((a) => (
            <div key={a.id} className="press mb-1 flex cursor-grab items-center gap-2 rounded-[8px] px-2 py-1.5 transition-colors hover:border-[color-mix(in_srgb,var(--brand)_45%,transparent)] hover:bg-[var(--wash-3)]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px]" style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}><a.icon size={13} /></span>
              <span className="min-w-0 flex-1 truncate text-[11.5px]" style={{ color: 'var(--text-dim)' }}>{a.label}</span>
              <span className="shrink-0 rounded-full px-1.5 py-[1px] text-[9px] font-medium" style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}>{a.badge}</span>
            </div>
          ))}
        </Section>
        <Section label="Logic"><Rows items={LOGIC} /></Section>
        <Section label="Building blocks"><Rows items={BLOCKS} /></Section>
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

function Section({ label, defaultOpen, children }: { label: string; defaultOpen?: boolean; children: React.ReactNode }) {
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

/* ── Floating config panel ────────────────────────────────────────────────── */

const CFG_TABS = ['Configure', 'Run node', 'Evaluate'] as const
function ConfigPanel({ node, onClose, onToast, onRun }: { node: GNode; onClose: () => void; onToast: (t: string) => void; onRun: () => void }) {
  const accent = KIND_ACCENT[node.kind]
  const [tab, setTab] = useState<(typeof CFG_TABS)[number]>('Configure')
  return (
    <div className="absolute right-3 top-3 z-30 flex max-h-[calc(100%-24px)] w-[336px] flex-col overflow-hidden rounded-[var(--r-md)] shadow-xl"
      style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
      <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
        <span className="grid h-6 w-6 place-items-center rounded-[7px]" style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}><KindIcon kind={node.kind} size={14} /></span>
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>{node.kind === 'generated' ? 'AI Generated Agent' : KIND_TYPE[node.kind]}</div>
          {node.kind === 'generated' && <div className="text-[10px]" style={{ color: 'var(--muted)' }}>Draft</div>}
        </div>
        <Tooltip label="Close" side="bottom" align="end">
          <button onClick={onClose} className="icon-btn ml-auto h-7 w-7" aria-label="Close"><X size={15} /></button>
        </Tooltip>
      </div>

      {node.kind !== 'split' && node.kind !== 'merge' && (
        <div className="flex gap-1 px-3.5 pt-2" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          {CFG_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className="press px-1.5 pb-2 text-[12px] font-medium"
              style={{ color: tab === t ? 'var(--brand)' : 'var(--muted)', borderBottom: `2px solid ${tab === t ? 'var(--brand)' : 'transparent'}`, marginBottom: -1 }}>{t}</button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
        {node.kind === 'split' ? <SplitConfig />
          : tab === 'Configure' ? <AgentConfig node={node} />
          : tab === 'Run node' ? <div className="rounded-[8px] p-3 text-[12px] leading-[1.5]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>Run just this node with a sample input to preview its output before running the whole flow.</div>
          : <div className="rounded-[8px] p-3 text-[12px] leading-[1.5]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>Evaluate this node against a test set — accuracy, latency and cost per run.</div>}
      </div>

      <div className="flex items-center justify-end gap-2 px-3.5 py-2.5" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>
        <button onClick={() => { onToast('Saved'); onClose() }} className="btn-secondary">Save</button>
        <button onClick={onRun} className="btn-primary"><Play size={12} fill="currentColor" />Run</button>
      </div>
    </div>
  )
}

function Accordion({ label, icon: Icon, defaultOpen, children }: { label: string; icon: typeof BookOpen; defaultOpen?: boolean; children?: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="mb-1.5 overflow-hidden rounded-[8px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
      <button onClick={() => setOpen((o) => !o)} className="press flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium" style={{ color: 'var(--text-dim)' }}>
        <Icon size={14} style={{ color: 'var(--muted)' }} />{label}
        {open ? <ChevronDown size={13} className="ml-auto" /> : <ChevronRight size={13} className="ml-auto" />}
      </button>
      {open && <div className="px-3 pb-2.5 text-[11.5px] leading-[1.5]" style={{ color: 'var(--muted)' }}>{children}</div>}
    </div>
  )
}

function AgentConfig({ node }: { node: GNode }) {
  return (
    <>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>Agent Information</div>
      <Accordion label="Agent Overview" icon={Bot} defaultOpen>{node.label} — generates the high-level design artefacts for this step, grounded in the confirmed capability process.</Accordion>
      <Accordion label="Knowledge Base" icon={BookOpen}>Architecture patterns, the org's reference HLD templates, and the connected repo's service map.</Accordion>
      <Accordion label="Guardrails" icon={ShieldCheck}>Cites a source for every component; will not invent an interface absent from the API registry.</Accordion>
      <Accordion label="Behaviour" icon={UserCheck}>Deterministic diagram output; stops at the design-review gate for a human sign-off.</Accordion>
      <Accordion label="Tools" icon={Wrench}>C4 renderer, the design-system token reader, the API-contract lookup.</Accordion>
    </>
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
