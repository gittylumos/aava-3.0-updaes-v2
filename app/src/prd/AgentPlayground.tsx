/* The Playground — the execution & monitoring surface for the Agent-Designer run.
 *
 * Opened from the orchestration canvas's Run, DOCKED in the same right panel (no
 * new screen) with a Back-to-canvas control. A person feeds inputs, watches
 * per-artefact outputs, approves the HITL checkpoint, and reads metrics/logs.
 * Three columns under a thin top bar; the centre swaps by mode (Input / Output /
 * Monitor). Seeded, with working demo interactions. Lucide icons; AAVA colours
 * (indigo = active; blue = running; amber = HITL/waiting; green = done; red =
 * failed; violet = Split).  */
import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, Pause, Play, Square, Check, X, Download, UserCheck, Paperclip, Copy,
} from 'lucide-react'
import { Tooltip } from '../components/chrome/Tooltip'
import type { ActiveObject } from '../state/types'

interface Props {
  object: ActiveObject
  onClose: () => void
  onToast: (text: string) => void
}

type Status = 'completed' | 'running' | 'waiting' | 'failed' | 'idle'
const STATUS: Record<Status, { c: string; label: string }> = {
  completed: { c: 'var(--ok)', label: 'Completed' },
  running: { c: 'var(--zone-canvas-accent)', label: 'Running' },
  waiting: { c: 'var(--warn)', label: 'Waiting' },
  failed: { c: 'var(--danger)', label: 'Failed' },
  idle: { c: 'var(--muted-deep)', label: 'Idle' },
}

function Pill({ status }: { status: Status }) {
  const s = STATUS[status]
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-[2px] text-[10px] font-semibold"
      style={{ background: `color-mix(in srgb, ${s.c} 16%, transparent)`, color: s.c }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.c }} />{s.label}
    </span>
  )
}

type Mode = 'input' | 'output' | 'monitor'

interface Step { label: string; status: Status }
const ACTIVITY: Step[] = [
  { label: 'Architecture Analyzer', status: 'completed' },
  { label: 'Solution Proposal', status: 'running' },
  { label: 'Human-in-the-loop', status: 'waiting' },
  { label: 'Split', status: 'running' },
  { label: 'C4 Container Diagram', status: 'running' },
  { label: 'If-else', status: 'failed' },
  { label: 'C4 Component Diagram', status: 'failed' },
  { label: 'Design Review', status: 'failed' },
]
const LOGS = [
  ['09/18 12:47:04', 'Agent: Project Architect | react | tailwind'],
  ['09/18 12:47:04', 'Action: Project analysis completed, generating roadmap'],
  ['09/18 12:47:51', 'Agent: Application Info Extractor | react | tailwind'],
  ['09/18 12:47:52', 'Action: Extracted 14 services from the connected repo'],
  ['09/18 12:48:10', 'Agent: Architecture Analyzer | c4 | mermaid'],
  ['09/18 12:48:11', 'Action: Mapped service dependencies, 3 boundaries found'],
  ['09/18 12:48:39', 'Agent: Solution Proposal | react | tailwind'],
  ['09/18 12:48:40', 'Action: Drafting the high-level solution proposal'],
  ['09/18 12:49:02', 'Gate: Human-in-the-loop | awaiting approval'],
  ['09/18 12:49:20', 'Agent: C4 Container Diagram | c4 | mermaid'],
  ['09/18 12:49:21', 'Action: Rendering container view, 6 nodes'],
  ['09/18 12:49:48', 'Error: If-else | predicate evaluation failed on branch B'],
]

export function AgentPlayground({ object, onClose, onToast }: Props) {
  const [mode, setMode] = useState<Mode>('output')
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <section aria-label="Playground — execution & monitoring" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="relative m-[12px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--r-md)]"
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)' }}>

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="flex h-12 shrink-0 items-center gap-2 px-3" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          <button onClick={onClose} className="press flex items-center gap-1 rounded-[8px] px-2 py-1.5 text-[12px] font-medium hover:bg-[var(--wash-3)]" style={{ color: 'var(--text-dim)' }}>
            <ChevronLeft size={15} />Back to canvas
          </button>
          <span className="hidden text-[11.5px] sm:inline" style={{ color: 'var(--muted-deep)' }}>{object.subject} · Playground</span>

          <div className="mx-auto inline-flex items-center gap-0.5 rounded-[10px] p-[3px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
            {(['input', 'output', 'monitor'] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
                className="press rounded-[7px] px-3 py-1 text-[12px] font-medium capitalize"
                style={mode === m ? { background: 'var(--brand)', color: '#fff' } : { color: 'var(--muted)' }}>{m}</button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 rounded-[10px] p-[3px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
              <Tooltip label="Pause" side="bottom">
                <button onClick={() => onToast('Paused')} className="icon-btn h-7 w-7" aria-label="Pause"><Pause size={13} fill="currentColor" /></button>
              </Tooltip>
              <Tooltip label="Resume" side="bottom">
                <button onClick={() => onToast('Resumed')} className="icon-btn h-7 w-7" aria-label="Resume"><Play size={13} fill="currentColor" /></button>
              </Tooltip>
              <Tooltip label="Stop" side="bottom">
                <button onClick={() => onToast('Stopped')} className="icon-btn h-7 w-7" aria-label="Stop"><Square size={12} fill="currentColor" /></button>
              </Tooltip>
            </div>
            <button onClick={() => onToast('Execution started')} className="btn-primary"><Play size={12} fill="currentColor" />Execute</button>
          </div>
        </div>

        {/* ── Three columns ──────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1">
          <LeftColumn selected={selected} onSelect={setSelected} />
          <div className="min-w-0 flex-1 overflow-y-auto">
            {mode === 'output' ? <OutputMode onApprove={() => onToast('Approved — run continues')} onReject={() => onToast('Rejected — sent back')} onToast={onToast} />
              : mode === 'input' ? <InputMode onToast={onToast} />
              : <MonitorMode />}
          </div>
          <RightColumn onToast={onToast} />
        </div>
      </div>
    </section>
  )
}

/* ── Left column ──────────────────────────────────────────────────────────── */

function LeftColumn({ selected, onSelect }: { selected: string | null; onSelect: (s: string | null) => void }) {
  return (
    <div className="flex w-[236px] shrink-0 flex-col overflow-y-auto" style={{ borderRight: '1px solid var(--glass-line-soft)', background: 'var(--wash-1)' }}>
      <Collapsible label="Process Activity" defaultOpen>
        <div className="relative pl-1">
          {ACTIVITY.map((s, i) => (
            <div key={s.label + i} className="relative flex items-start gap-2.5 pb-3">
              {i < ACTIVITY.length - 1 && <span className="absolute left-[9px] top-5 h-full w-px" style={{ borderLeft: '1px dashed var(--glass-line)' }} />}
              <span className="z-10 mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${STATUS[s.status].c} 20%, var(--slab))`, border: `1.5px solid ${STATUS[s.status].c}` }}>
                {s.status === 'completed' ? <Check size={10} strokeWidth={3} style={{ color: STATUS[s.status].c }} />
                  : s.status === 'failed' ? <X size={10} strokeWidth={3} style={{ color: STATUS[s.status].c }} />
                  : <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS[s.status].c }} />}
              </span>
              <button onClick={() => onSelect(selected === s.label ? null : s.label)} className="press min-w-0 flex-1 text-left">
                <span className="block truncate text-[12px]" style={{ color: 'var(--text-dim)' }}>{s.label}</span>
                <span className="mt-1 block"><Pill status={s.status} /></span>
              </button>
            </div>
          ))}
        </div>
      </Collapsible>
      <Collapsible label="Artifact Information">
        {selected
          ? <div className="text-[11.5px] leading-[1.5]" style={{ color: 'var(--muted)' }}>{selected} — golden AAVA agent. Inputs: solution brief. Outputs: C4 diagram set. Tools: C4 renderer.</div>
          : <div className="text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>Select a step to see its artefact details.</div>}
      </Collapsible>
      <Collapsible label="MCP Connection">
        <div className="flex flex-col gap-1.5">
          {[['Jira', 'connected'], ['Azure DevOps', 'connected'], ['Confluence', 'idle']].map(([n, st]) => (
            <div key={n} className="flex items-center gap-2 text-[11.5px]" style={{ color: 'var(--text-dim)' }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: st === 'connected' ? 'var(--ok)' : 'var(--muted-deep)' }} />
              {n}<span className="ml-auto text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{st}</span>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  )
}

/* ── Center · Output mode (default, full) ─────────────────────────────────── */

const OUT_TABS = ['Process Blueprint', 'Execution Output', 'Previous Executions'] as const
function OutputMode({ onApprove, onReject, onToast }: { onApprove: () => void; onReject: () => void; onToast: (t: string) => void }) {
  const [tab, setTab] = useState<(typeof OUT_TABS)[number]>('Execution Output')
  const [decided, setDecided] = useState<'approved' | 'rejected' | null>(null)
  return (
    <div className="px-5 py-4">
      <div className="mb-4 flex gap-2 border-b" style={{ borderColor: 'var(--glass-line-soft)' }}>
        {OUT_TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className="press px-1.5 pb-2 text-[12.5px] font-medium"
            style={{ color: tab === t ? 'var(--brand)' : 'var(--muted)', borderBottom: `2px solid ${tab === t ? 'var(--brand)' : 'transparent'}`, marginBottom: -1 }}>{t}</button>
        ))}
      </div>

      {tab === 'Execution Output' ? (
        <div className="mx-auto flex max-w-[720px] flex-col gap-3">
          <OutputCard title="Image to Text Analysis 1" status="completed" onToast={onToast} />
          <OutputCard title="Image to Text Analysis 2" status="completed" defaultOpen onToast={onToast}
            body="Extracted the checkout flow from the source frames: a 4-step funnel (landing, account, payment, confirmation) with the payment step carrying a rating control and a comment field. Detected the PLAY component set in use — FormField, Rating, CharacterCounter — and mapped each to its container. The C4 container view derives cleanly from this; no ambiguous boundaries remain after the analysis pass." />
          <div className="flex items-center gap-2 rounded-[10px] px-3 py-2" style={{ background: 'color-mix(in srgb, var(--zone-sidebar-accent) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--zone-sidebar-accent) 30%, transparent)' }}>
            <span className="text-[11px] font-bold uppercase tracking-[.06em]" style={{ color: 'var(--zone-sidebar-accent)' }}>Split</span>
            <span className="text-[11.5px]" style={{ color: 'var(--muted)' }}>Fanned out to 3 parallel C4 diagram agents.</span>
          </div>
          <HitlCard decided={decided} onApprove={() => { setDecided('approved'); onApprove() }} onReject={() => { setDecided('rejected'); onReject() }} />
        </div>
      ) : tab === 'Process Blueprint' ? (
        <div className="mx-auto max-w-[720px] rounded-[var(--r-md)] p-8 text-center" style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
          <div className="text-[13px]" style={{ color: 'var(--muted)' }}>The run graph. Click an artefact to load its Agent / Workflow details on the left.</div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-[720px] flex-col gap-2">
          {['Run #214 · 09/18 12:31', 'Run #213 · 09/17 18:04', 'Run #212 · 09/17 11:52'].map((r) => (
            <button key={r} onClick={() => onToast('Reopening ' + r)} className="press flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-left" style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
              <span className="text-[12.5px]" style={{ color: 'var(--text-dim)' }}>{r}</span><Pill status="completed" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function OutputCard({ title, status, body, defaultOpen, onToast }: { title: string; status: Status; body?: string; defaultOpen?: boolean; onToast: (t: string) => void }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="overflow-hidden rounded-[var(--r-md)]" style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <button onClick={() => setOpen((o) => !o)} className="press flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronRight size={13} style={{ color: 'var(--muted)', transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .15s' }} />
          <span className="truncate text-[13px] font-medium" style={{ color: 'var(--text)' }}>{title}</span>
        </button>
        <Pill status={status} />
        <Tooltip label="Download" side="top">
          <button onClick={() => onToast('Downloaded ' + title)} aria-label="Download" className="icon-btn h-7 w-7"><Download size={14} /></button>
        </Tooltip>
      </div>
      {open && body && <div className="px-3.5 pb-3.5 text-[12.5px] leading-[1.6]" style={{ color: 'var(--text-dim)', borderTop: '1px solid var(--glass-line-soft)', paddingTop: 12 }}>{body}</div>}
    </div>
  )
}

function HitlCard({ decided, onApprove, onReject }: { decided: 'approved' | 'rejected' | null; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="overflow-hidden rounded-[var(--r-md)]" style={{ background: 'color-mix(in srgb, var(--warn) 8%, var(--wash-1))', border: '1px solid color-mix(in srgb, var(--warn) 45%, transparent)' }}>
      <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ borderBottom: '1px solid color-mix(in srgb, var(--warn) 25%, transparent)' }}>
        <UserCheck size={15} style={{ color: 'var(--warn)' }} />
        <span className="text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>Human in the loop</span>
        {decided ? <Pill status={decided === 'approved' ? 'completed' : 'failed'} /> : <Pill status="waiting" />}
      </div>
      <div className="px-3.5 py-3">
        <div className="mb-1 text-[11px] font-medium" style={{ color: 'var(--muted)' }}>Comments</div>
        <textarea rows={2} disabled={!!decided} placeholder="Enter Comments"
          className="w-full resize-none rounded-[8px] px-3 py-2 text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }} />
        <div className="mb-1 mt-2.5 text-[11px] font-medium" style={{ color: 'var(--muted)' }}>Prompt Artifact</div>
        <input disabled={!!decided} placeholder="Prompt"
          className="w-full rounded-[8px] px-3 py-2 text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }} />
      </div>
      {!decided && (
        <div className="flex justify-end gap-2 px-3.5 pb-3">
          <button onClick={onReject} className="btn-secondary">Reject</button>
          <button onClick={onApprove} className="btn-primary">Approve</button>
        </div>
      )}
    </div>
  )
}

/* ── Center · Input & Monitor modes ───────────────────────────────────────── */

function InputMode({ onToast }: { onToast: (t: string) => void }) {
  const [sel, setSel] = useState('Architecture Analyzer')
  const agents = ['Architecture Analyzer', 'Solution Proposal', 'C4 Container Diagram', 'Design Review']
  return (
    <div className="px-5 py-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {agents.map((a) => (
          <button key={a} onClick={() => setSel(a)} aria-pressed={sel === a} className="press rounded-[9px] px-3 py-1.5 text-[12px] font-medium"
            style={sel === a ? { background: 'var(--brand)', color: '#fff' } : { background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>{a}</button>
        ))}
      </div>
      <div className="mx-auto max-w-[640px] rounded-[var(--r-md)] p-4" style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
        <div className="mb-2 text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>{sel} · Input</div>
        <textarea rows={5} placeholder={`Provide the input for ${sel}…`}
          className="w-full resize-none rounded-[8px] px-3 py-2 text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }} />
        <div className="mt-2.5 flex items-center justify-end gap-2">
          <Tooltip label="Attach" side="top">
            <button className="icon-btn" aria-label="Attach"><Paperclip size={15} /></button>
          </Tooltip>
          <button onClick={() => onToast('Submitted input for ' + sel)} className="btn-primary">Submit</button>
        </div>
      </div>
    </div>
  )
}

function MonitorMode() {
  return (
    <div className="px-5 py-4">
      <div className="mx-auto grid max-w-[720px] grid-cols-2 gap-3">
        {ACTIVITY.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-3" style={{ background: 'var(--wash-1)', border: `1px solid color-mix(in srgb, ${STATUS[s.status].c} 35%, var(--glass-line-soft))` }}>
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS[s.status].c, boxShadow: s.status === 'running' ? `0 0 0 3px color-mix(in srgb, ${STATUS[s.status].c} 25%, transparent)` : undefined }} />
            <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: 'var(--text-dim)' }}>{s.label}</span>
            <Pill status={s.status} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Right column · metrics & logs ────────────────────────────────────────── */

function RightColumn({ onToast }: { onToast: (t: string) => void }) {
  const [tab, setTab] = useState<'metrics' | 'community'>('metrics')
  const stats: [string, string, string][] = [
    ['Latency', '2412ms', 'var(--ok)'], ['Cost', '$0.0084', 'var(--warn)'],
    ['Tokens In', '1240', 'var(--text)'], ['Tokens Out', '312', 'var(--text)'],
  ]
  return (
    <div className="flex w-[276px] shrink-0 flex-col overflow-hidden" style={{ borderLeft: '1px solid var(--glass-line-soft)', background: 'var(--wash-1)' }}>
      <div className="flex gap-2 px-3.5 pt-3" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
        {(['metrics', 'community'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="press px-1 pb-2 text-[12px] font-medium"
            style={{ color: tab === t ? 'var(--brand)' : 'var(--muted)', borderBottom: `2px solid ${tab === t ? 'var(--brand)' : 'transparent'}`, marginBottom: -1 }}>{t === 'metrics' ? 'Output Metrics' : 'Community'}</button>
        ))}
      </div>
      {tab === 'metrics' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="px-3.5 py-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>Performance of the Model</div>
            <div className="grid grid-cols-2 gap-2">
              {stats.map(([label, value, c]) => (
                <div key={label} className="rounded-[10px] p-3" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
                  <div className="text-[10.5px] uppercase tracking-[.04em]" style={{ color: 'var(--muted)' }}>{label}</div>
                  <div className="mono mt-1 text-[16px] font-bold" style={{ color: c }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-3">
            <div className="mb-1.5 flex items-center">
              <span className="text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>Execution Logs</span>
              <Tooltip label="Copy logs" side="top" align="end">
                <button onClick={() => onToast('Execution log copied')} className="icon-btn ml-auto h-7 w-7" aria-label="Copy logs"><Copy size={14} /></button>
              </Tooltip>
            </div>
            <div className="mono min-h-0 flex-1 overflow-y-auto rounded-[8px] p-2.5 text-[10.5px] leading-[1.7]" style={{ background: 'var(--slab, #0b0e14)', border: '1px solid var(--glass-line-soft)' }}>
              {LOGS.map(([ts, line], i) => (
                <div key={i} className="flex gap-2">
                  <span className="shrink-0" style={{ color: 'var(--muted-deep)' }}>{ts}</span>
                  <span style={{ color: /^Error/.test(line) ? 'var(--danger)' : /^Gate/.test(line) ? 'var(--warn)' : /^Agent/.test(line) ? 'var(--zone-canvas-accent)' : 'var(--text-dim)' }}>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-3.5 py-6 text-center text-[12px]" style={{ color: 'var(--muted)' }}>Community metrics — shared runs and benchmarks appear here.</div>
      )}
    </div>
  )
}

/* ── Shared ───────────────────────────────────────────────────────────────── */

function Collapsible({ label, defaultOpen, children }: { label: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
      <button onClick={() => setOpen((o) => !o)} className="press flex w-full items-center gap-1.5 px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[.1em]" style={{ color: 'var(--muted-deep)' }}>
        <ChevronRight size={12} style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .15s' }} />{label}
      </button>
      {open && <div className="px-3.5 pb-3.5">{children}</div>}
    </div>
  )
}
