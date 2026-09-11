/* The Execute + Analytics surfaces for the orchestration canvas.
 *
 * Run ▶ on the canvas switches the mini-header to the Execute tab and starts a
 * scripted run: the left Process Activity panel and the centre conversation stay
 * in lockstep. Each step runs on a clock; where a step needs input it pauses and
 * shows a file/text request inline; a HITL step pauses for approval; every step
 * that produces something drops an expandable output card (copy + download), the
 * same block idiom as the matching-process cards. When the run finishes the
 * Analytics tab unlocks. Nothing here is live — it's replayable scripted state,
 * same convention as the rest of src/prd.
 *
 * The run driver (useExecutionRun) is owned by the canvas so the state survives
 * switching between the Execute and Analytics tabs; the two views below are pure
 * renderers of it. */
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  Check, Download, Copy, UserCheck, Upload, Paperclip, ChevronRight,
  Loader2, Sparkles, FileText, ArrowUp,
} from 'lucide-react'
import { Tooltip } from '../components/chrome/Tooltip'

/* One step of the run, derived from the canvas flow so the activity panel, the
   graph and the conversation all name the same things. */
export interface ExecStep {
  id: string
  label: string
  kind: string
  desc?: string
  /** Pauses before running to collect input — a file drop + a text box. */
  input?: boolean
  /** Pauses for a human approval before it can complete. */
  gate?: boolean
  /** Emits an artefact card when it completes. */
  output?: { title: string; body: string }
  /** How long the step runs once started (ms). */
  run?: number
}

export type ExecStatus = 'idle' | 'running' | 'waiting' | 'completed'

const STATUS_C: Record<ExecStatus, string> = {
  idle: 'var(--muted-deep)', running: 'var(--zone-canvas-accent)',
  waiting: 'var(--warn)', completed: 'var(--ok)',
}
const STATUS_LABEL: Record<ExecStatus, string> = {
  idle: 'Waiting to execute', running: 'Running', waiting: 'Needs input', completed: 'Completed',
}

/* ── The run driver ─────────────────────────────────────────────────────────
   A tiny scripted engine: walk the steps, pausing at input/gate steps until the
   user resolves them. Timers are tracked so Cancel/unmount can stop the chain.
   Owned by the canvas and passed to the views as `run`. */
export interface Run {
  statuses: Record<string, ExecStatus>
  pending: { id: string; label: string; kind: 'input' | 'hitl' } | null
  complete: boolean
  logs: [string, string][]
  started: boolean
  start: () => void
  restart: () => void
  resolve: (note?: string) => void
  cancel: () => void
}

export function useExecutionRun(steps: ExecStep[], onComplete: () => void, onToast: (t: string) => void): Run {
  const [statuses, setStatuses] = useState<Record<string, ExecStatus>>({})
  const [pending, setPending] = useState<Run['pending']>(null)
  const [complete, setComplete] = useState(false)
  const [logs, setLogs] = useState<[string, string][]>([])
  const [started, setStarted] = useState(false)

  const timers = useRef<number[]>([])
  const pos = useRef(0)
  const done = useRef<Set<string>>(new Set())

  const at = (label: string) => {
    const d = new Date()
    const ts = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
    setLogs((ls) => [...ls, [ts, label]])
  }
  const set = (id: string, s: ExecStatus) => setStatuses((m) => ({ ...m, [id]: s }))
  const wait = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }

  const finish = () => { setComplete(true); at('Run completed — all steps finished'); onComplete() }

  const runStep = (i: number) => {
    const s = steps[i]
    set(s.id, 'running'); at(`${s.label} — running`)
    wait(s.run ?? 1100, () => {
      set(s.id, 'completed'); at(`${s.label} — completed`)
      enter(i + 1)
    })
  }

  const enter = (i: number) => {
    pos.current = i
    if (i >= steps.length) return finish()
    const s = steps[i]
    if ((s.input || s.gate) && !done.current.has(s.id)) {
      set(s.id, 'waiting')
      setPending({ id: s.id, label: s.label, kind: s.gate ? 'hitl' : 'input' })
      at(`${s.label} — awaiting ${s.gate ? 'approval' : 'input'}`)
      return
    }
    runStep(i)
  }

  const resolve = (note?: string) => {
    const s = steps[pos.current]
    if (!s) return
    done.current.add(s.id)
    setPending(null)
    if (note) { at(note); onToast(note) }
    runStep(pos.current)
  }

  const begin = () => {
    setStarted(true)
    setComplete(false)
    setPending(null)
    setLogs([])
    done.current = new Set()
    pos.current = 0
    setStatuses(Object.fromEntries(steps.map((s) => [s.id, 'idle' as ExecStatus])))
    wait(500, () => enter(0))
  }

  const start = () => { if (!started) begin() }
  /* Run again from the top — clears the finished run and replays it. */
  const restart = () => { timers.current.forEach(clearTimeout); timers.current = []; begin() }

  const cancel = () => {
    timers.current.forEach(clearTimeout); timers.current = []
    setPending(null)
  }

  // Stop any in-flight timers when the canvas unmounts.
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = [] }, [])

  return { statuses, pending, complete, logs, started, start, restart, resolve, cancel }
}

/* ── Execute view ───────────────────────────────────────────────────────────── */

export function ExecuteView({ name, subtitle, steps, run, onToast }: {
  name: string
  subtitle: string
  steps: ExecStep[]
  run: Run
  onToast: (t: string) => void
}) {
  return (
    <div className="flex h-full min-h-0 w-full">
      {/* Process Activity — synced with the conversation. */}
      <ActivityPanel steps={steps} statuses={run.statuses} />

      {/* The conversation stream. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[760px] px-6 py-5">
          {/* Agent header */}
          <div className="mb-4 flex items-start gap-2.5">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[9px]" style={{ background: 'color-mix(in srgb, var(--zone-canvas-accent) 16%, transparent)', color: 'var(--zone-canvas-accent)' }}><Sparkles size={16} /></span>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{name}</div>
              <div className="text-[12px]" style={{ color: 'var(--muted)' }}>{subtitle}</div>
            </div>
          </div>

          <Line>I'm executing the process now — I'll run each step in order, ask you for input where a step needs it, and show every artifact as it's produced.</Line>

          {/* One block per step, in order, appearing as the run reaches it. */}
          <div className="mt-3 flex flex-col gap-2.5">
            {steps.map((s) => {
              const st = run.statuses[s.id] ?? 'idle'
              if (st === 'idle') return null
              if (st === 'waiting' && run.pending?.id === s.id) {
                return run.pending.kind === 'hitl'
                  ? <HitlCard key={s.id} label={s.label} onApprove={() => run.resolve(`Approved ${s.label} — run continues`)} onReject={() => run.resolve(`Sent ${s.label} back for changes`)} />
                  : <InputCard key={s.id} step={s} onSubmit={() => run.resolve(`Submitted input for ${s.label}`)} />
              }
              if (st === 'running') return <RunningCard key={s.id} label={s.label} />
              // completed
              return s.output
                ? <OutputCard key={s.id} title={s.output.title} body={s.output.body} kind={s.kind} onToast={onToast} />
                : <CompletedLine key={s.id} label={s.label} />
            })}
          </div>

          {run.complete && (
            <div className="mt-4">
              <Line tone="ok">Execution complete — all {steps.length} steps finished and the artifacts above are ready. The <strong>Analytics</strong> tab is now available for the run metrics and logs.</Line>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Line({ children, tone }: { children: React.ReactNode; tone?: 'ok' }) {
  return (
    <p className="text-[13px] leading-[1.6]" style={{ color: tone === 'ok' ? 'var(--text)' : 'var(--text-dim)' }}>
      {tone === 'ok' && <Check size={13} className="mr-1.5 inline" style={{ color: 'var(--ok)' }} />}
      {children}
    </p>
  )
}

function ActivityPanel({ steps, statuses }: { steps: ExecStep[]; statuses: Record<string, ExecStatus> }) {
  return (
    <div className="flex w-[232px] shrink-0 flex-col overflow-y-auto" style={{ borderRight: '1px solid var(--glass-line-soft)', background: 'var(--wash-1)' }}>
      <div className="px-3.5 pb-2 pt-3.5 text-[11px] font-semibold uppercase tracking-[.1em]" style={{ color: 'var(--muted-deep)' }}>Process Activity</div>
      <div className="relative px-3 pb-3">
        {steps.map((s, i) => {
          const st = statuses[s.id] ?? 'idle'
          const c = STATUS_C[st]
          return (
            <div key={s.id} className="relative flex items-start gap-2.5 pb-3">
              {i < steps.length - 1 && <span className="absolute left-[9px] top-5 h-full w-px" style={{ borderLeft: '1px dashed var(--glass-line)' }} />}
              <span className="z-10 mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${c} 20%, var(--slab))`, border: `1.5px solid ${c}` }}>
                {st === 'completed' ? <Check size={10} strokeWidth={3} style={{ color: c }} />
                  : st === 'running' ? <Loader2 size={10} className="animate-spin" style={{ color: c }} />
                  : <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[12px]" style={{ color: st === 'idle' ? 'var(--muted)' : 'var(--text-dim)' }}>{s.label}</span>
                <span className="mt-0.5 inline-flex items-center rounded-full px-1.5 py-[1px] text-[9.5px] font-semibold" style={{ background: `color-mix(in srgb, ${c} 15%, transparent)`, color: c }}>{STATUS_LABEL[st]}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RunningCard({ label }: { label: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5" style={{ background: 'var(--wash-1)', border: '1px solid color-mix(in srgb, var(--zone-canvas-accent) 30%, var(--glass-line-soft))' }}>
      <Loader2 size={14} className="animate-spin" style={{ color: 'var(--zone-canvas-accent)' }} />
      <span className="text-[12.5px]" style={{ color: 'var(--text-dim)' }}>Executing <strong style={{ color: 'var(--text)' }}>{label}</strong>…</span>
    </motion.div>
  )
}

function CompletedLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-1 text-[12.5px]" style={{ color: 'var(--muted)' }}>
      <Check size={13} strokeWidth={2.5} style={{ color: 'var(--ok)' }} />{label} completed
    </div>
  )
}

function OutputCard({ title, body, kind, onToast }: { title: string; body: string; kind: string; onToast: (t: string) => void }) {
  const [open, setOpen] = useState(true)
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[var(--r-md)]" style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <button onClick={() => setOpen((o) => !o)} className="press flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronRight size={13} style={{ color: 'var(--muted)', transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .15s' }} />
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px]" style={{ background: 'color-mix(in srgb, var(--zone-canvas-accent) 14%, transparent)', color: 'var(--zone-canvas-accent)' }}><FileText size={13} /></span>
          <span className="truncate text-[13px] font-medium" style={{ color: 'var(--text)' }}>{title}</span>
        </button>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-[2px] text-[10px] font-semibold" style={{ background: 'color-mix(in srgb, var(--ok) 16%, transparent)', color: 'var(--ok)' }}><Check size={10} strokeWidth={3} />Output</span>
        <Tooltip label="Copy" side="top">
          <button onClick={() => { navigator.clipboard?.writeText(body); onToast('Output copied') }} aria-label="Copy" className="icon-btn h-7 w-7"><Copy size={13} /></button>
        </Tooltip>
        <Tooltip label="Download" side="top">
          <button onClick={() => onToast('Downloaded ' + title)} aria-label="Download" className="icon-btn h-7 w-7"><Download size={13} /></button>
        </Tooltip>
      </div>
      {open && (
        <div className="px-3.5 pb-3.5 pt-1 text-[12.5px] leading-[1.65]" style={{ color: 'var(--text-dim)', borderTop: '1px solid var(--glass-line-soft)' }}>
          <div className="pt-2.5">{body}</div>
          {kind === 'aava-agent' && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {['C4 · Context', 'C4 · Container', 'C4 · Component'].map((t) => (
                <span key={t} className="mono rounded-[6px] px-1.5 py-[2px] text-[10.5px]" style={{ background: 'var(--wash-2)', color: 'var(--muted)' }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

function InputCard({ step, onSubmit }: { step: ExecStep; onSubmit: () => void }) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<string | null>(null)
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[var(--r-md)]" style={{ background: 'var(--wash-1)', border: '1px solid color-mix(in srgb, var(--warn) 40%, var(--glass-line-soft))' }}>
      <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
        <span className="grid h-6 w-6 place-items-center rounded-[7px]" style={{ background: 'color-mix(in srgb, var(--warn) 16%, transparent)', color: 'var(--warn)' }}><ArrowUp size={13} /></span>
        <span className="text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>{step.label} needs input</span>
      </div>
      <div className="px-3.5 py-3">
        {/* File drop */}
        <div className="mb-1 text-[11px] font-medium" style={{ color: 'var(--muted)' }}>Upload file <span style={{ color: 'var(--muted-deep)' }}>(optional)</span></div>
        <label className="press mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-dashed px-3 py-3 text-[11.5px] transition-colors hover:bg-[var(--wash-2)]"
          style={{ borderColor: 'var(--glass-line)', color: 'var(--muted)' }}>
          <Upload size={14} />
          {file ?? 'Drop a .zip, .pptx, .csv, .docx, .pdf — or click to browse'}
          <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0]?.name ?? 'requirements.pdf')} />
        </label>
        {/* Text */}
        <div className="mb-1 text-[11px] font-medium" style={{ color: 'var(--muted)' }}>Requirement brief</div>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter input here…"
          className="w-full resize-none rounded-[8px] px-3 py-2 text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }} />
        <div className="mt-2.5 flex items-center justify-end gap-2">
          <Tooltip label="Attach" side="top"><button className="icon-btn h-7 w-7" aria-label="Attach"><Paperclip size={14} /></button></Tooltip>
          <button onClick={onSubmit} className="btn-primary" style={{ minHeight: 30, padding: '5px 12px' }}>Submit &amp; continue</button>
        </div>
      </div>
    </motion.div>
  )
}

function HitlCard({ label, onApprove, onReject }: { label: string; onApprove: () => void; onReject: () => void }) {
  const [decided, setDecided] = useState<'approved' | 'rejected' | null>(null)
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[var(--r-md)]" style={{ background: 'color-mix(in srgb, var(--warn) 8%, var(--wash-1))', border: '1px solid color-mix(in srgb, var(--warn) 45%, transparent)' }}>
      <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ borderBottom: '1px solid color-mix(in srgb, var(--warn) 25%, transparent)' }}>
        <UserCheck size={15} style={{ color: 'var(--warn)' }} />
        <span className="text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>{label}</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-[2px] text-[10px] font-semibold" style={{ background: 'color-mix(in srgb, var(--warn) 16%, transparent)', color: 'var(--warn)' }}>Awaiting approval</span>
      </div>
      <div className="px-3.5 py-3">
        <div className="mb-1 text-[11px] font-medium" style={{ color: 'var(--muted)' }}>Comments</div>
        <textarea rows={2} disabled={!!decided} placeholder="Enter comments"
          className="w-full resize-none rounded-[8px] px-3 py-2 text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }} />
        <div className="mt-2.5 flex justify-end gap-2">
          <button onClick={() => { setDecided('rejected'); onReject() }} className="btn-secondary" style={{ minHeight: 30, padding: '5px 12px' }}>Reject</button>
          <button onClick={() => { setDecided('approved'); onApprove() }} className="btn-primary" style={{ minHeight: 30, padding: '5px 12px' }}>Approve</button>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Analytics view ─────────────────────────────────────────────────────────
   Unlocked after a run: the model metrics, a per-step status grid, and the run
   log accumulated by the driver. */
export function AnalyticsView({ steps, run, onToast }: {
  steps: ExecStep[]
  run: Run
  onToast: (t: string) => void
}) {
  const stats: [string, string, string][] = [
    ['Latency', '2412 ms', 'var(--ok)'], ['Cost', '$0.0084', 'var(--warn)'],
    ['Tokens in', '1,240', 'var(--text)'], ['Tokens out', '312', 'var(--text)'],
  ]
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[820px] px-6 py-5">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>Model performance</div>
        <div className="grid grid-cols-4 gap-2.5">
          {stats.map(([label, value, c]) => (
            <div key={label} className="rounded-[10px] p-3" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
              <div className="text-[10.5px] uppercase tracking-[.04em]" style={{ color: 'var(--muted)' }}>{label}</div>
              <div className="mono mt-1 text-[16px] font-bold" style={{ color: c }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>Per-step outcome</div>
        <div className="grid grid-cols-2 gap-2.5">
          {steps.map((s) => {
            const st = run.statuses[s.id] ?? 'idle'
            const c = STATUS_C[st]
            return (
              <div key={s.id} className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5" style={{ background: 'var(--wash-1)', border: `1px solid color-mix(in srgb, ${c} 35%, var(--glass-line-soft))` }}>
                <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: 'var(--text-dim)' }}>{s.label}</span>
                <span className="text-[10.5px] font-semibold" style={{ color: c }}>{STATUS_LABEL[st]}</span>
              </div>
            )
          })}
        </div>

        <div className="mb-1.5 mt-5 flex items-center">
          <span className="text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>Execution logs</span>
          <Tooltip label="Copy logs" side="top" align="end">
            <button onClick={() => { navigator.clipboard?.writeText(run.logs.map((l) => l.join('  ')).join('\n')); onToast('Execution log copied') }} className="icon-btn ml-auto h-7 w-7" aria-label="Copy logs"><Copy size={14} /></button>
          </Tooltip>
        </div>
        <div className="mono overflow-y-auto rounded-[8px] p-2.5 text-[10.5px] leading-[1.7]" style={{ maxHeight: 220, background: 'var(--slab, #0b0e14)', border: '1px solid var(--glass-line-soft)' }}>
          {run.logs.length === 0 ? <span style={{ color: 'var(--muted-deep)' }}>No log lines.</span> : run.logs.map(([ts, line], i) => (
            <div key={i} className="flex gap-2">
              <span className="shrink-0" style={{ color: 'var(--muted-deep)' }}>{ts}</span>
              <span style={{ color: /completed/.test(line) ? 'var(--ok)' : /approval|input/.test(line) ? 'var(--warn)' : 'var(--text-dim)' }}>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
