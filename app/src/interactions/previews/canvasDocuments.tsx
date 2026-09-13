/* Canvas & documents (P3, P5). The Preview/Code segmented pill, inline
 * highlighted comments, the changes tray, the compact match card, and the
 * split-tab workspace. */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Replayable } from '../shared'

/* ── Preview/Code segmented pill ───────────────────────────────────────── */
function ViewTabsDemo() {
  const [view, setView] = useState<'preview' | 'code'>('preview')
  const tabs = [
    { id: 'preview' as const, label: 'Preview' },
    { id: 'code' as const, label: 'Code' },
  ]
  return (
    <div className="flex items-center gap-0.5 rounded-[11px] p-[3px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
      {tabs.map((t) => {
        const active = view === t.id
        return (
          <motion.button key={t.id} layout onClick={() => setView(t.id)} aria-pressed={active}
            transition={{ type: 'spring', stiffness: 520, damping: 40 }}
            className="press flex items-center gap-1.5 rounded-[8px] text-[12.5px] font-medium"
            style={active ? { background: 'var(--text)', color: 'var(--on-text)', padding: '5px 11px', boxShadow: '0 1px 3px rgba(0,0,0,.25)' } : { background: 'transparent', color: 'var(--muted)', padding: '5px 6px' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {t.id === 'preview' ? <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 9h18" /></> : <path d="m8 6-5 6 5 6M16 6l5 6-5 6" />}
            </svg>
            <AnimatePresence initial={false}>
              {active && (
                <motion.span layout initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.16 }} className="overflow-hidden whitespace-nowrap">
                  {t.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}
export function ViewTabsPreview() {
  return <Replayable render={(key) => <div key={key}><ViewTabsDemo /></div>} minHeight={140} />
}

/* ── Inline comments ──────────────────────────────────────────────────────
   Plays the whole gesture, not a frozen end-state: the comment tool arms, a
   phrase is selected (the highlight sweeps in), a floating composer types the
   note, and on save the passage settles into its commented highlight with a
   numbered marker tied to the entry below — the real DocumentCanvas flow, on a
   loop. */
type CommentPhase = 'idle' | 'selecting' | 'composing' | 'saved'
const COMMENT_NOTE = 'Should this also cover the wallet flows, or just card auth?'
function InlineCommentsDemo() {
  const [phase, setPhase] = useState<CommentPhase>('idle')
  const [typed, setTyped] = useState('')

  useEffect(() => {
    const t = [
      window.setTimeout(() => setPhase('selecting'), 650),
      window.setTimeout(() => setPhase('composing'), 1350),
      window.setTimeout(() => setPhase('saved'), 3400),
    ]
    return () => t.forEach(clearTimeout)
  }, [])
  useEffect(() => {
    if (phase !== 'composing') { if (phase === 'idle') setTyped(''); return }
    let i = 0
    const iv = window.setInterval(() => {
      i += 1; setTyped(COMMENT_NOTE.slice(0, i))
      if (i >= COMMENT_NOTE.length) window.clearInterval(iv)
    }, 26)
    return () => window.clearInterval(iv)
  }, [phase])

  const armed = phase !== 'idle'
  const highlighted = phase === 'selecting' || phase === 'composing'
  const committed = phase === 'saved'

  return (
    <div className="relative w-full max-w-[460px]">
      {/* The comment tool, as it sits in the canvas toolbar — it arms, then the
          selection follows. */}
      <div className="mb-2.5 flex items-center justify-end">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
          style={{ background: armed ? 'var(--wash-5)' : 'var(--wash-2)', border: `1px solid ${armed ? 'var(--glass-line)' : 'var(--glass-line-soft)'}`, color: armed ? 'var(--text)' : 'var(--muted)' }}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          {armed ? 'Commenting' : 'Comment'}
        </span>
      </div>

      <p className="text-[13px] leading-[1.8]" style={{ color: 'var(--text-dim)' }}>
        The Checkout Payments Service is a stateless authorisation gateway fronting the card processor.{' '}
        <span className="relative rounded-[3px] px-0.5 transition-colors duration-300"
          style={{
            background: committed ? 'var(--wash-5)' : highlighted ? 'var(--wash-6)' : 'transparent',
            boxShadow: committed ? 'inset 0 -1.5px 0 var(--text-dim)' : 'none',
          }}>
          It exposes a synchronous authorise/capture API
          {committed && (
            <motion.sup initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 22 }}
              className="mono ml-0.5 inline-grid h-[15px] w-[15px] place-items-center rounded-full align-super text-[9px] font-bold" style={{ background: 'var(--text)', color: 'var(--on-text)' }}>1</motion.sup>
          )}
        </span>{' '}
        to the checkout front-end.
      </p>

      {/* Floating composer while the note is being written. */}
      <AnimatePresence>
        {phase === 'composing' && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.18 }}
            className="mt-3 flex items-center gap-2 rounded-[var(--r-md)] p-1.5 pl-3 shadow-xl" style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
            <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: typed ? 'var(--text)' : 'var(--muted-deep)' }}>
              {typed || 'Add a comment…'}<span className="ilib-caret" />
            </span>
            <button type="button" className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ background: 'var(--text)', color: 'var(--on-text)' }} aria-hidden>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5.5M12 5.5 6 11.5M12 5.5l6 6" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The saved comment, tied to marker 1. */}
      <AnimatePresence>
        {committed && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
            className="mt-3 flex items-start gap-2.5 rounded-[var(--r-md)] p-3" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
            <span className="mono grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold" style={{ background: 'var(--text)', color: 'var(--on-text)' }}>1</span>
            <div className="min-w-0">
              <div className="mb-0.5 flex items-center gap-1.5">
                <span className="grid h-4 w-4 place-items-center rounded-full text-[8px] font-semibold" style={{ background: 'var(--wash-4)', color: 'var(--text-dim)' }}>D</span>
                <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>Deepak</span>
              </div>
              <p className="text-[12.5px] leading-[1.5]" style={{ color: 'var(--text-dim)' }}>{COMMENT_NOTE}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .ilib-caret { display: inline-block; width: 1.5px; height: 13px; margin-left: 1px; vertical-align: text-bottom; background: var(--text); animation: ilib-caret-blink 1s steps(1) infinite; }
        @keyframes ilib-caret-blink { 0%,50% { opacity: 1 } 50.01%,100% { opacity: 0 } }
      `}</style>
    </div>
  )
}
export function InlineCommentsPreview() {
  return <Replayable render={(key) => <div key={key} className="w-full max-w-[460px]"><InlineCommentsDemo /></div>} minHeight={260} />
}

/* ── Changes tray ──────────────────────────────────────────────────────────
   Apply doesn't jump straight to a resolved sentence — it runs the same
   tool-step accordion pattern (pending → running → done, auto-folding) while
   the edits are actually being merged in, then settles on "Applied". */
const TRAY_CHANGES = [
  { quote: 'authorise/capture API', note: 'Add a note about idempotency here' },
  { quote: 'checkout front-end', note: 'Should this name the mobile app too?' },
]
type TrayPhase = 'open' | 'applying' | 'applied'
function TrayApplySteps({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(0)
  const steps = TRAY_CHANGES.map((c) => `Applying edit — "${c.quote}"`)
  useEffect(() => {
    if (done >= steps.length) { const t = window.setTimeout(onDone, 500); return () => clearTimeout(t) }
    const t = window.setTimeout(() => setDone((d) => d + 1), 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])
  return (
    <div className="w-full max-w-[440px] overflow-hidden rounded-[var(--r-md)]" style={{ border: '1px solid var(--glass-line-soft)' }}>
      <div className="flex items-center gap-2 px-2.5 py-2" style={{ background: 'var(--wash-2)' }}>
        <span className="grid h-[15px] w-[15px] shrink-0 place-items-center">
          {done >= steps.length
            ? <span className="text-[11px] leading-none" style={{ color: 'var(--ok)' }}>✓</span>
            : <span className="block h-[11px] w-[11px] rounded-full border-[1.6px] border-transparent" style={{ borderTopColor: 'var(--muted)', borderRightColor: 'var(--muted)', animation: 'ilib-spin .7s linear infinite' }} />}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium" style={{ color: 'var(--text-dim)' }}>Applying your edits</span>
        <span className="shrink-0 text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{Math.min(done, steps.length)}/{steps.length}</span>
      </div>
      <div className="grid gap-[3px] p-1" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>
        {steps.map((label, i) => {
          const state = i < done ? 'done' : i === done ? 'running' : 'pending'
          if (state === 'pending') return null
          return (
            <motion.div key={label} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
              className="flex items-center gap-2.5 rounded-[var(--r-sm)] px-2.5 py-[7px]" style={{ background: 'var(--wash-2)' }}>
              <span className="grid h-[15px] w-[15px] shrink-0 place-items-center">
                {state === 'done'
                  ? <span className="text-[10px] leading-none" style={{ color: 'var(--ok)' }}>✓</span>
                  : <span className="block h-[11px] w-[11px] rounded-full border-[1.6px] border-transparent" style={{ borderTopColor: 'var(--muted)', borderRightColor: 'var(--muted)', animation: 'ilib-spin .7s linear infinite' }} />}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px]" style={{ color: state === 'done' ? 'var(--text-dim)' : 'var(--muted)' }}>{label}</span>
            </motion.div>
          )
        })}
      </div>
      <style>{`@keyframes ilib-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
function ChangesTrayDemo() {
  const [open, setOpen] = useState(true)
  const [phase, setPhase] = useState<TrayPhase>('open')
  if (phase === 'applying') return <TrayApplySteps onDone={() => setPhase('applied')} />
  if (phase === 'applied') return <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>Applied — both edits are now part of the conversation.</p>
  return (
    <div className="w-full max-w-[440px] overflow-hidden rounded-[var(--r-lg)]" style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-line)' }}>
      {open && (
        <div className="max-h-[200px] overflow-auto px-3.5 pt-3" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          {TRAY_CHANGES.map((c, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] text-[10px] font-semibold" style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}>{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11.5px] italic" style={{ color: 'var(--muted)' }}>"{c.quote}"</span>
                <span className="block text-[13px]" style={{ color: 'var(--text-dim)' }}>{c.note}</span>
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <button onClick={() => setOpen((o) => !o)} className="press flex items-center gap-1.5 text-[13px] font-medium" style={{ color: 'var(--text-dim)' }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .15s' }}><path d="M9 6l6 6-6 6" /></svg>
          {TRAY_CHANGES.length} changes
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setPhase('applied')} className="press rounded-[9px] px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[var(--wash-3)]" style={{ background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--glass-line-soft)' }}>Discard</button>
          <button onClick={() => setPhase('applying')} className="press rounded-[9px] px-4 py-1.5 text-[12.5px] font-medium transition-[filter] hover:brightness-90" style={{ background: 'var(--text)', color: 'var(--on-text)' }}>Apply</button>
        </div>
      </div>
    </div>
  )
}
export function ChangesTrayPreview() {
  return <Replayable render={(key) => <div key={key} className="w-full max-w-[440px]"><ChangesTrayDemo /></div>} minHeight={220} />
}

/* ── Match card ────────────────────────────────────────────────────────── */
function MatchCardDemo() {
  return (
    <button className="press group flex h-full w-full max-w-[340px] flex-col gap-3 rounded-[var(--r-md)] p-4 text-left transition-shadow hover:shadow-[0_4px_14px_rgba(0,0,0,.2)]"
      style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px]" style={{ background: 'var(--wash-3)', color: 'var(--text-dim)' }}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>HLD Architecture Builder</div>
          <div className="mt-1 text-[9.5px] font-semibold uppercase tracking-[.07em]">
            <span className="inline-flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" aria-hidden><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              Best fit
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right leading-none">
          <span className="mono font-bold" style={{ color: 'var(--text)', fontSize: 22 }}>97<span className="text-[12px]" style={{ color: 'var(--muted)' }}>%</span></span>
          <div className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-[.1em]" style={{ color: 'var(--muted-deep)' }}>fit</div>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--wash-3)' }}>
        <div className="h-full rounded-full" style={{ width: '97%', background: 'var(--text-dim)' }} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {['Analysis', 'Proposal', 'C4 Gen'].map((s) => <span key={s} className="shrink-0 rounded-[6px] px-2 py-[3px] text-[10px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>{s}</span>)}
        <span className="shrink-0 rounded-[6px] px-2 py-[3px] text-[10px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>+4</span>
      </div>
      <div className="flex items-center gap-3 pt-0.5" style={{ borderTop: '1px solid var(--glass-line-soft)', paddingTop: 10 }}>
        <span className="flex items-center gap-1 text-[10.5px]" style={{ color: 'var(--muted)' }}><b className="mono font-bold" style={{ color: 'var(--text-dim)' }}>97</b>runs</span>
        <span className="flex items-center gap-1 text-[10.5px]" style={{ color: 'var(--muted)' }}><b className="mono font-bold" style={{ color: 'var(--text-dim)' }}>4</b>teams</span>
        <span className="mono ml-auto text-[10px]" style={{ color: 'var(--muted-deep)' }}>v2.1</span>
      </div>
    </button>
  )
}
export function MatchCardPreview() {
  return <Replayable render={(key) => <div key={key}><MatchCardDemo /></div>} minHeight={200} />
}

/* ── Split-tab workspace ─────────────────────────────────────────────────────
   Deepak's Add-feedback-form flow (TabWorkspace.tsx, flexlayout-react). Waiting
   for a real drag would make this the one preview nobody ever sees run, so it
   auto-plays it once per mount/replay — but the drag mechanics themselves are
   FlexLayout's own, straight from flexlayout-theme.css's tokens, not invented:
   a translucent brand-tinted "drag rect" (the tab being lifted) travels toward
   the edge; a bold brand-tinted "edge rect" claims the target half of the
   panel, then settles to a quieter hold the instant it's clearly claimed —
   exactly how it reads live. The tab row itself is FlexLayout's real chrome
   too: a brand underline on the active tab (not a filled pill), a close "×"
   that only shows on hover, and the same sticky "+" that sits after the last
   tab. Full page-width canvas, with its own header, rather than a cropped
   card — this is what the panel actually looks like, not an abstracted widget
   of it. Once the split lands, the whole canvas settles into a slight zoom so
   the result — not the chrome around it — is what's left holding the eye. */
type SplitPhase = 'single' | 'dragging' | 'split'

/* The real Preview tab's own chrome (src/components/playground/Preview.tsx)
   at preview scale — a fake browser window (the exact traffic-light hexes,
   the "localhost:4200" mono URL bar) around the running app, on --preview-bg,
   inside the same p-3 the real Padded wrapper uses. Not a bare form. */
function MockFeedbackForm() {
  return (
    <div className="h-full overflow-auto p-3">
      <div className="overflow-hidden rounded-[var(--r-sm)]" style={{ border: '1px solid var(--glass-line-soft)' }}>
        <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'var(--wash-2)' }}>
          <span className="flex gap-1.5" aria-hidden="true">
            {['#FF6B6B', '#FBBF24', '#4ADE80'].map((c) => <i key={c} className="h-2 w-2 rounded-full" style={{ background: c, display: 'block' }} />)}
          </span>
          <span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>localhost:4200</span>
        </div>
        <div className="p-4" style={{ background: 'var(--preview-bg)' }}>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>How was your experience?</div>
          <div className="mt-1 text-[10.5px]" style={{ color: 'var(--muted)' }}>Your feedback goes straight to the product team.</div>
          <div className="mt-3 text-[10px] font-medium" style={{ color: 'var(--muted)' }}>Rating</div>
          <div className="mt-1.5 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => <span key={n} className="grid h-7 w-7 place-items-center rounded-[6px] text-[11px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>{n}</span>)}
          </div>
          <div className="mt-3 text-[10px] font-medium" style={{ color: 'var(--muted)' }}>Comment</div>
          <div className="mt-1.5 h-12 rounded-[7px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }} />
          <div className="mt-3 inline-block rounded-[7px] px-3.5 py-1.5 text-[11px] font-medium" style={{ background: 'var(--wash-3)', color: 'var(--text-dim)' }}>Submit</div>
        </div>
      </div>
    </div>
  )
}
function MockCodePane() {
  const lines = ['<form [formGroup]="form">', '  <h3>How was your experience?</h3>', '', '  <play-rating-scale formC…>', '  <play-form-field label…>', '    <textarea formControl…>', '  </play-form-field>', '</form>']
  return (
    <div className="h-full overflow-auto p-3">
      {lines.map((l, i) => (
        <div key={i} className="mono flex gap-2.5 text-[10.5px] leading-[1.7]">
          <span className="w-3.5 shrink-0 text-right" style={{ color: 'var(--muted-deep)' }}>{i + 1}</span>
          <span style={{ color: 'var(--muted)' }}>{l || ' '}</span>
        </div>
      ))}
    </div>
  )
}

/* The real FlexLayout tab chrome, at preview scale — a brand underline on the
   active tab (never a filled pill), a close "×" that only reveals on hover or
   when active, matching .flexlayout__tab_button / _trailing exactly. Clickable
   where a click makes sense, so this reads as a real workspace, not a frozen
   frame of one. */
function FlexTab({ label, active, dimmed, onClick }: { label: string; active: boolean; dimmed?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={!onClick} className="press relative flex items-center gap-1.5 px-3 py-[7px] text-[11.5px] font-medium disabled:cursor-default"
      style={{ color: active ? 'var(--text)' : 'var(--muted)', boxShadow: active ? 'inset 0 -2px 0 var(--brand)' : 'inset 0 -2px 0 transparent', opacity: dimmed ? 0.35 : 1 }}>
      {label}
      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden
        style={{ opacity: active ? 0.7 : 0, transition: 'opacity var(--dur) var(--ease)' }}><path d="M6 6l12 12M18 6 6 18" /></svg>
    </button>
  )
}
/* The sticky "+" (QuickOpen) that rides at the end of every tab strip — a real
   toggling dropdown, the same list of openable artefacts the real one offers. */
const QUICK_OPEN_ITEMS = ['Preview', 'Code', 'Validation Agent results', 'Working diff', 'Evidence']
function FlexQuickOpen() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative shrink-0">
      <button onClick={() => setOpen((o) => !o)} aria-label="Open an artifact" aria-expanded={open}
        className="press grid h-6 w-6 place-items-center rounded-[6px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-[188px] overflow-hidden rounded-[10px] py-1 shadow-xl" style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
          {QUICK_OPEN_ITEMS.map((label) => (
            <button key={label} onClick={() => setOpen(false)}
              className="press flex w-full items-center px-3 py-[7px] text-left text-[12px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--text-dim)' }}>{label}</button>
          ))}
        </div>
      )}
    </div>
  )
}
function FlexTabStrip({ children }: { children: React.ReactNode }) {
  return <div className="flex shrink-0 items-center gap-1 px-1.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>{children}</div>
}

function SplitTabsDemo() {
  const [phase, setPhase] = useState<SplitPhase>('single')
  /* Before the auto-play split, the single pane's own tab is still genuinely
     clickable — a visitor can look at Code without waiting for the drag. */
  const [singleTab, setSingleTab] = useState<'preview' | 'code'>('preview')
  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('dragging'), 1200)
    const t2 = window.setTimeout(() => setPhase('split'), 2250)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <motion.div animate={{ scale: phase === 'split' ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="relative flex w-full overflow-hidden rounded-[var(--r-md)]" style={{ border: '1px solid var(--glass-line)', background: 'var(--slab-raised)', height: 480 }}>
      {/* Left tabset — Preview, or Code if the visitor picked it manually. */}
      <motion.div layout transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="flex h-full min-w-0 flex-col overflow-hidden" style={{ width: phase === 'split' ? '50%' : '100%', borderRight: phase === 'split' ? '1px solid var(--glass-line)' : undefined }}>
        <FlexTabStrip>
          <FlexTab label="Preview" active={phase === 'split' || singleTab === 'preview'} onClick={phase === 'single' ? () => setSingleTab('preview') : undefined} />
          {phase !== 'split' && <FlexTab label="Code" active={singleTab === 'code'} dimmed={phase === 'dragging'} onClick={phase === 'single' ? () => setSingleTab('code') : undefined} />}
          <FlexQuickOpen />
        </FlexTabStrip>
        <div className="min-h-0 flex-1 overflow-hidden">
          {phase !== 'split' && singleTab === 'code' ? <MockCodePane /> : <MockFeedbackForm />}
        </div>
      </motion.div>

      {/* Right tabset — appears once split. */}
      <AnimatePresence>
        {phase === 'split' && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: '50%', opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="flex h-full min-w-0 flex-col overflow-hidden">
            <FlexTabStrip><FlexTab label="Code" active /><FlexQuickOpen /></FlexTabStrip>
            <div className="min-h-0 flex-1 overflow-hidden"><MockCodePane /></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The edge rect — FlexLayout's own drop indicator for the target half:
          it fades in only as the lifted tab nears the edge, then settles to a
          quieter hold, rather than flashing on at full strength. */}
      {phase === 'dragging' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0.7, 0.4] }} transition={{ duration: 1.05, times: [0, 0.4, 0.75, 1] }}
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
          style={{ background: 'color-mix(in srgb, var(--brand) 26%, transparent)', borderLeft: '2px solid color-mix(in srgb, var(--brand) 70%, transparent)' }} />
      )}

      {/* The drag rect — the Code tab lifted off the strip and carried toward the
          drop zone. It emerges FROM the tab's own place (small, tab-sized, a soft
          lift-shadow) and eases across — not a big button popping in at a corner. */}
      {phase === 'dragging' && (
        <motion.div
          initial={{ left: 92, top: 8, opacity: 0, scale: 0.94 }}
          animate={{ left: [92, 110, '70%'], top: [8, 4, '46%'], opacity: [0, 1, 1], scale: [0.94, 1, 1] }}
          transition={{ duration: 1.0, times: [0, 0.35, 1], ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute z-10 flex items-center gap-1.5 rounded-[7px] px-2.5 py-[5px] text-[11px] font-medium"
          style={{ background: 'var(--slab)', border: '1px solid var(--glass-line)', color: 'var(--text-dim)', boxShadow: '0 8px 20px rgba(0,0,0,.28)' }}>
          Code
        </motion.div>
      )}
    </motion.div>
  )
}
export function SplitTabsPreview() {
  return <Replayable render={(key) => <div key={key} className="w-full"><SplitTabsDemo /></div>} minHeight={500} />
}
