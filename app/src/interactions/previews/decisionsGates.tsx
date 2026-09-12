/* Decisions & gates — human-in-the-loop (P3, P4). The inline Cancel/Send gate,
 * the HITL run gate, Plan → Edit plan, and the honest Pushed/Skipped after-state. */
import { useState } from 'react'
import { Replayable } from '../shared'

/* ── Gate → inline Cancel/Send ─────────────────────────────────────────── */
function InlineGateDemo() {
  const [collecting, setCollecting] = useState(false)
  const [note, setNote] = useState('')
  const [answered, setAnswered] = useState<string | null>(null)

  if (answered) {
    return (
      <div className="w-full max-w-[420px] rounded-[var(--r-md)] p-3" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
        <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>Your note</span>
        <span className="text-[12.5px]" style={{ color: 'var(--text-dim)' }}>{answered}</span>
      </div>
    )
  }
  return (
    <div className="w-full max-w-[420px] rounded-[var(--r-md)] p-3" style={{ background: 'var(--glass)', border: '1px solid var(--warn)' }}>
      <span className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[.13em]" style={{ color: 'var(--warn)' }}>
        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" /></svg>
        Waiting on you
      </span>
      <p className="mt-2 text-[12.5px]" style={{ color: 'var(--text-dim)' }}>Is this accurate?</p>
      {collecting ? (
        <div className="mt-3">
          <textarea autoFocus rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Please describe here…"
            className="w-full resize-none rounded-[9px] px-3 py-2 text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }} />
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <button onClick={() => { setCollecting(false); setNote('') }} className="btn-secondary">Cancel</button>
            <button onClick={() => note.trim() && setAnswered(note.trim())} disabled={!note.trim()} className="btn-primary">Send</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button onClick={() => setCollecting(true)} className="btn-secondary">No, something is off</button>
          <button onClick={() => setAnswered('Yes, this is accurate')} className="btn-primary">Yes, this is accurate</button>
        </div>
      )}
    </div>
  )
}
export function InlineGatePreview() {
  return <Replayable render={(key) => <div key={key} className="w-full max-w-[420px]"><InlineGateDemo /></div>} minHeight={180} />
}

/* ── HITL run gate ─────────────────────────────────────────────────────── */
function HitlGateDemo() {
  const [decided, setDecided] = useState<'approved' | 'rejected' | null>(null)
  return (
    <div className="w-full max-w-[420px] overflow-hidden rounded-[var(--r-md)]" style={{ background: 'color-mix(in srgb, var(--warn) 8%, var(--wash-1))', border: '1px solid color-mix(in srgb, var(--warn) 45%, transparent)' }}>
      <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ borderBottom: '1px solid color-mix(in srgb, var(--warn) 25%, transparent)' }}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--warn)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m17 11 2 2 4-4" /></svg>
        <span className="text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>Architect Review</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-[2px] text-[10px] font-semibold"
          style={{ background: decided ? 'color-mix(in srgb, var(--ok) 16%, transparent)' : 'color-mix(in srgb, var(--warn) 16%, transparent)', color: decided ? 'var(--ok)' : 'var(--warn)' }}>
          {decided === 'approved' ? 'Approved' : decided === 'rejected' ? 'Rejected' : 'Awaiting approval'}
        </span>
      </div>
      <div className="px-3.5 py-3">
        <div className="mb-1 text-[11px] font-medium" style={{ color: 'var(--muted)' }}>Comments</div>
        <textarea rows={2} disabled={!!decided} placeholder="Enter comments"
          className="w-full resize-none rounded-[8px] px-3 py-2 text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }} />
        {!decided && (
          <div className="mt-2.5 flex justify-end gap-2">
            <button onClick={() => setDecided('rejected')} className="btn-secondary">Reject</button>
            <button onClick={() => setDecided('approved')} className="btn-primary">Approve</button>
          </div>
        )}
      </div>
    </div>
  )
}
export function HitlGatePreview() {
  return <Replayable render={(key) => <div key={key} className="w-full max-w-[420px]"><HitlGateDemo /></div>} minHeight={200} />
}

/* ── Plan → Edit plan ──────────────────────────────────────────────────── */
const PLAN_STEPS = [
  { title: 'Understand the requirement', detail: "Map the user's intent to the process they need" },
  { title: 'Identify matching artifacts', detail: 'Rank golden processes by fit to the requirement' },
  { title: 'Create or clone artifact', detail: 'Open the best fit and clone it to customise' },
]
function PlanEditDemo() {
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  return (
    <div className="w-full max-w-[440px] overflow-hidden rounded-[var(--r-md)]" style={{ background: 'var(--glass)', border: `1px solid ${editing ? 'var(--warn)' : 'var(--glass-line)'}` }}>
      <div className="px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[.14em]" style={{ color: 'var(--muted-deep)', borderBottom: '1px solid var(--glass-line-soft)' }}>
        Artifact Identification process · {PLAN_STEPS.length} steps
      </div>
      {PLAN_STEPS.map((s, i) => (
        <div key={s.title} className="flex gap-3 px-3.5 py-2.5" style={{ borderTop: i ? '1px solid var(--glass-line-soft)' : undefined }}>
          <span className="mono mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px]" style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}>{i + 1}</span>
          <div className="min-w-0">
            <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{s.title}</div>
            <div className="mt-0.5 text-[12px] leading-[1.5]" style={{ color: 'var(--muted)' }}>{s.detail}</div>
          </div>
        </div>
      ))}
      <div className="px-3.5 py-2.5" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>
        {sent ? (
          <p className="text-[12px]" style={{ color: 'var(--text-dim)' }}><span style={{ color: 'var(--muted-deep)' }}>Edit recorded — </span>{note}</p>
        ) : editing ? (
          <>
            <textarea autoFocus rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add or reorder a step…"
              className="w-full resize-none rounded-[9px] px-3 py-2 text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }} />
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => { setEditing(false); setNote('') }} className="btn-secondary">Cancel</button>
              <button onClick={() => note.trim() && setSent(true)} disabled={!note.trim()} className="btn-primary">Send</button>
            </div>
          </>
        ) : (
          <div className="flex justify-end">
            <button onClick={() => setEditing(true)} className="btn-primary">
              Edit plan
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
export function PlanEditPreview() {
  return <Replayable render={(key) => <div key={key} className="w-full max-w-[440px]"><PlanEditDemo /></div>} minHeight={260} />
}

/* ── Honest after-state ──────────────────────────────────────────────────
   One live card, not two static outcomes: state 1 is the real choice (Skip
   for now / Publish); clicking either resolves the SAME card in place, and
   the label truthfully reflects whichever one was actually picked. */
function HonestAfterStateDemo() {
  const [resolved, setResolved] = useState<'Published' | 'Skipped' | null>(null)
  return (
    <div className="w-full max-w-[420px] rounded-[var(--r-md)] px-3.5 py-3" style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[9px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--done)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h6" /></svg>
        </span>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-[13px] font-semibold">Push AAVA-482 to Jira</span>
          <span className="text-[11.5px]" style={{ color: 'var(--muted)' }}>Sync the confirmed epic and its stories</span>
        </div>
        {resolved && <span className="shrink-0 text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>{resolved}</span>}
      </div>
      {!resolved && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button onClick={() => setResolved('Skipped')} className="btn-secondary">Skip for now</button>
          <button onClick={() => setResolved('Published')} className="btn-primary">Publish</button>
        </div>
      )}
    </div>
  )
}
export function HonestAfterStatePreview() {
  return <Replayable render={(key) => <div key={key} className="w-full max-w-[420px]"><HonestAfterStateDemo /></div>} minHeight={160} />
}
