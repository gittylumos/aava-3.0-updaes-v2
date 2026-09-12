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
            style={active ? { background: 'var(--brand)', color: '#fff', padding: '5px 11px', boxShadow: '0 1px 3px rgba(0,0,0,.25)' } : { background: 'transparent', color: 'var(--muted)', padding: '5px 6px' }}>
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

/* ── Inline comments ───────────────────────────────────────────────────── */
function InlineCommentsDemo() {
  return (
    <div className="w-full max-w-[460px]">
      <p className="text-[13px] leading-[1.7]" style={{ color: 'var(--text-dim)' }}>
        The Checkout Payments Service is a stateless authorisation gateway fronting the card processor.{' '}
        <span className="relative rounded-[3px] px-0.5" style={{ background: 'color-mix(in srgb, var(--brand) 22%, transparent)' }}>
          It exposes a synchronous authorise/capture API
          <sup className="mono ml-0.5 grid h-[14px] w-[14px] place-items-center rounded-full align-super text-[9px] font-bold" style={{ background: 'var(--brand)', color: '#fff' }}>1</sup>
        </span>{' '}
        to the checkout front-end.
      </p>
      <div className="mt-3 flex items-start gap-2.5 rounded-[var(--r-md)] p-3" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
        <span className="mono grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold" style={{ background: 'var(--brand)', color: '#fff' }}>1</span>
        <p className="text-[12.5px] leading-[1.5]" style={{ color: 'var(--text-dim)' }}>Should this also cover the wallet flows, or just card auth?</p>
      </div>
    </div>
  )
}
export function InlineCommentsPreview() {
  return <Replayable render={(key) => <div key={key} className="w-full max-w-[460px]"><InlineCommentsDemo /></div>} minHeight={200} />
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
          <button onClick={() => setPhase('applied')} className="press rounded-[9px] px-3.5 py-1.5 text-[12.5px] font-medium" style={{ background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--glass-line-soft)' }}>Discard</button>
          <button onClick={() => setPhase('applying')} className="press rounded-[9px] px-4 py-1.5 text-[12.5px] font-medium" style={{ background: 'var(--brand)', color: '#fff' }}>Apply</button>
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
    <button className="press group flex h-full w-full max-w-[280px] flex-col gap-2 rounded-[var(--r-md)] p-3 text-left"
      style={{ background: 'color-mix(in srgb, var(--warn) 7%, var(--slab-raised))', border: '1px solid color-mix(in srgb, var(--warn) 48%, transparent)' }}>
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px]" style={{ background: 'color-mix(in srgb, var(--zone-canvas-accent) 18%, transparent)', color: 'var(--zone-canvas-accent)' }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>HLD Architecture Builder</div>
          <div className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[.06em]">
            <span className="inline-flex items-center gap-1" style={{ color: 'var(--warn)' }}>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" aria-hidden><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              Best fit
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right leading-none">
          <span className="mono font-bold" style={{ color: 'var(--warn)', fontSize: 20 }}>97<span className="text-[11px]">%</span></span>
          <div className="text-[8.5px] font-semibold uppercase tracking-[.1em]" style={{ color: 'var(--muted-deep)' }}>fit</div>
        </div>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--wash-3)' }}>
        <div className="h-full rounded-full" style={{ width: '97%', background: 'var(--warn)' }} />
      </div>
      <div className="flex items-center gap-1">
        {['Analysis', 'Proposal', 'C4 Gen'].map((s) => <span key={s} className="shrink-0 rounded-[5px] px-1.5 py-[2px] text-[10px]" style={{ background: 'var(--wash-2)', color: 'var(--muted)' }}>{s}</span>)}
        <span className="shrink-0 rounded-[5px] px-1.5 py-[2px] text-[10px]" style={{ background: 'var(--wash-2)', color: 'var(--muted)' }}>+4</span>
      </div>
      <div className="flex items-center gap-2.5">
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

      {/* The edge rect — FlexLayout's own drop indicator: bold on arrival,
          then settling to a quieter hold, in the theme's real edge-marker tint
          (brand at 40%) over the drag-rect fill (brand at 18%). */}
      {phase === 'dragging' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.95, 0.95, 0.45] }} transition={{ duration: 1.05, times: [0, 0.28, 0.5, 1], delay: 0.35 }}
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
          style={{ background: 'color-mix(in srgb, var(--brand) 40%, transparent)', borderLeft: '2px solid var(--brand)' }} />
      )}

      {/* The drag rect — the tab itself, lifted and travelling toward the drop
          zone, FlexLayout's brand-18%-fill / brand-border ghost. */}
      {phase === 'dragging' && (
        <motion.div
          initial={{ left: 80, top: 14, opacity: 0 }}
          animate={{ left: [80, 80, '72%'], top: [14, 14, '46%'], opacity: [0, 1, 1] }}
          transition={{ duration: 0.85, times: [0, 0.2, 1], ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute z-10 flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[11.5px] font-medium"
          style={{ background: 'color-mix(in srgb, var(--brand) 18%, var(--slab-raised))', border: '1px solid var(--brand)', color: 'var(--text)', boxShadow: '0 6px 18px rgba(0,0,0,.35)' }}>
          Code
        </motion.div>
      )}
    </motion.div>
  )
}
export function SplitTabsPreview() {
  return <Replayable render={(key) => <div key={key} className="w-full"><SplitTabsDemo /></div>} minHeight={500} />
}
