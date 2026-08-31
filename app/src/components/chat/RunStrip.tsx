/* The run-progress island.
 *
 * A compact, centered capsule that hangs from the session header once the
 * backlog run starts (after Proceed) and settles in from below. It reads at a
 * glance: a pulsing status dot (blue while a phase drafts, amber while it waits
 * on you), the current-phase label (which shimmers only in the waiting state),
 * a step count and a chevron.
 *
 * Structurally it behaves like a Dynamic Island: clicking it does not reveal a
 * separate rectangle — the SAME shell morphs, growing its width, height and
 * corner radius downward into the full phase list as one continuous surface.
 * The morph animates measured pixel dimensions (not a layout scale) so text
 * never distorts, and the shell floats over an absolute layer above a reserved
 * collapsed-height slot, so opening it never reflows the conversation. Each row
 * carries the same marker vocabulary: a green tick (done), a pulsing dot in a
 * ring (current), a clock (ahead).
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useAnimationControls } from 'motion/react'
import type { PrepStep } from '../../state/types'

/* A dock, not a pill. The top edge is flush with the header and its top corners
   flare outward into it with a small concave fillet (the FILLET spans below) —
   the way an iOS Dynamic Island joins the bezel — rather than sitting as a
   square-topped rectangle. Only the bottom corners are deeply rounded. No
   border, so the fillets blend seamlessly; the panel shadow keeps it defined.
   Opaque so the growing panel never lets the conversation behind it bleed
   through — the capsule and the expanded panel are one and the same surface. */
const surface = {
  background: 'var(--slab-raised)',
  borderRadius: '0 0 20px 20px',
  boxShadow: 'var(--shadow-panel)',
}
/* Radius of the concave top-corner fillets that flare the dock into the header. */
const FILLET = 12

/* Measure an element's border-box, kept live with a ResizeObserver. Stands in
   for react-use-measure (not a project dependency) so the shell can animate to
   real pixel dimensions rather than a distorting transform. */
function useMeasure() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [bounds, setBounds] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect
      setBounds({ width: r.width, height: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, bounds] as const
}

export function RunStrip({ steps, at, waiting, onOpenStep }: {
  steps: PrepStep[]
  at: number
  /** True only at a gate — drives amber vs blue, the shimmer, and the label. */
  waiting: boolean
  onOpenStep: (key: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [contentRef, bounds] = useMeasure()
  const controls = useAnimationControls()
  const first = useRef(true)
  /* Reserve the collapsed height so the slot never changes size when the island
     grows — the expansion is an overlay, not a push. */
  const [closedH, setClosedH] = useState<number>()

  const doneCount = Math.min(at, steps.length)
  const allDone = at >= steps.length
  const current = steps[at]
  const accent = waiting ? 'var(--warn)' : '#5B9DFF'
  const label = allDone
    ? 'All steps complete'
    : waiting ? `Waiting on you · ${current?.label ?? ''}` : (current?.label ?? '')

  // Morph the shell to the measured content box. The very first measured size
  // is committed instantly (no grow-from-zero on mount); every change after
  // springs, which is the open/close and any content update. The corner radius
  // is static (a hanging dock keeps its flat top and rounded bottom), so only
  // width and height animate.
  useLayoutEffect(() => {
    if (!bounds.width) return
    const to = { width: bounds.width, height: bounds.height }
    if (first.current) { controls.set(to); first.current = false }
    else controls.start(to)
  }, [bounds.width, bounds.height, controls])

  useEffect(() => {
    if (!open && bounds.height) setClosedH(bounds.height)
  }, [open, bounds.height])

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex justify-center"
      style={{ height: closedH ?? 'auto' }}
    >
      <style>{stripCss}</style>

      {/* Concave top-corner fillets — small dock-coloured patches that sit just
          outside the shell's top corners and curve the dock outward into the
          header, so the top reads as edge-clipped/flush rather than a square
          corner. Positioned by the measured dock width; the `left` transition
          keeps them tracking the shell through the expand morph. They live
          outside the overflow-hidden shell, which cannot itself paint beyond
          its own box. */}
      {bounds.width > 0 && (
        <>
          <span aria-hidden className="pointer-events-none absolute top-0 z-30"
            style={{
              width: FILLET, height: FILLET,
              left: `calc(50% - ${bounds.width / 2}px - ${FILLET}px)`,
              background: 'var(--slab-raised)',
              transition: 'left .38s cubic-bezier(.22,1,.36,1)',
              WebkitMaskImage: `radial-gradient(circle at bottom left, transparent ${FILLET}px, #000 ${FILLET}px)`,
              maskImage: `radial-gradient(circle at bottom left, transparent ${FILLET}px, #000 ${FILLET}px)`,
            }} />
          <span aria-hidden className="pointer-events-none absolute top-0 z-30"
            style={{
              width: FILLET, height: FILLET,
              left: `calc(50% + ${bounds.width / 2}px)`,
              background: 'var(--slab-raised)',
              transition: 'left .38s cubic-bezier(.22,1,.36,1)',
              WebkitMaskImage: `radial-gradient(circle at bottom right, transparent ${FILLET}px, #000 ${FILLET}px)`,
              maskImage: `radial-gradient(circle at bottom right, transparent ${FILLET}px, #000 ${FILLET}px)`,
            }} />
        </>
      )}

      {/* The island shell — one surface, absolutely centered so its downward
          growth floats over the conversation instead of pushing it. */}
      <motion.div
        animate={controls}
        initial={false}
        transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 1 }}
        className="absolute left-1/2 top-0 z-30 -translate-x-1/2 overflow-hidden"
        style={surface}
      >
        {/* max-w caps the capsule to the list width so a long status label
            truncates instead of pushing the pill past the viewport on narrow
            screens; w-max lets a short one hug its content. */}
        <div ref={contentRef} className="w-max max-w-[min(360px,86vw)]">
          {/* The strip — one line, always visible. */}
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--wash-2)]">
            {allDone ? (
              <span className="grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full" style={{ background: 'var(--ok)' }}>
                <svg viewBox="0 0 24 24" width="9" height="9" aria-hidden><path d="m5 13 4.5 4.5L19 7" fill="none" stroke="var(--on-text)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            ) : (
              <span className="strip-pulse h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: accent }} />
            )}

            {/* Label — shimmers only while it waits on you. */}
            <span className={`min-w-0 truncate text-[12.5px] font-medium ${waiting && !allDone ? 'strip-shimmer' : ''}`}
              style={waiting && !allDone
                ? ({ ['--sc' as string]: 'var(--warn)', ['--sc-hi' as string]: '#ffffff' })
                : { color: 'var(--text-dim)' }}>
              {label}
            </span>

            <span className="mono ml-auto shrink-0 pl-3 text-[11.5px] tabular-nums" style={{ color: 'var(--muted)' }}>
              {doneCount}/{steps.length} steps
            </span>
            <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden
              className="shrink-0 transition-transform duration-200" style={{ color: 'var(--muted-deep)', transform: open ? 'rotate(180deg)' : undefined }}>
              <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* The full phase list — the same surface, grown downward. It fades up
              into place as the shell springs open. */}
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="grid w-[min(360px,86vw)] gap-0.5 p-2"
              style={{ borderTop: '1px solid var(--glass-line)' }}>
              {steps.map((step, i) => (
                <StripRow key={step.key} step={step} index={i}
                  state={i < at ? 'done' : i === at ? 'current' : 'ahead'}
                  waiting={waiting} onOpen={() => { setOpen(false); onOpenStep(step.key) }} />
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function StripRow({ step, state, waiting, onOpen }: {
  step: PrepStep; index: number; state: 'done' | 'current' | 'ahead'; waiting: boolean; onOpen: () => void
}) {
  const current = state === 'current'
  const accent = waiting ? 'var(--warn)' : '#5B9DFF'
  return (
    <button onClick={onOpen} title={step.detail}
      className="flex w-full min-w-0 items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--wash-3)]">
      <StripMarker state={state} accent={accent} />
      <span className="grid min-w-0 flex-1 gap-0.5 pt-0.5">
        <span className="min-w-0 truncate text-[12.5px]"
          style={{ color: current ? 'var(--text)' : state === 'done' ? 'var(--text-dim)' : 'var(--muted)', fontWeight: current ? 600 : 400 }}>
          {step.label}
        </span>
        {current && (
          waiting ? (
            <span className="strip-shimmer truncate text-[11px]" style={{ ['--sc' as string]: 'var(--warn)', ['--sc-hi' as string]: '#ffffff' }}>Waiting on you</span>
          ) : (
            <span className="truncate text-[11px]" style={{ color: 'var(--muted)' }}>Drafting…</span>
          )
        )}
      </span>
      {state === 'done' && (
        <span className="mono shrink-0 truncate text-[11px]" style={{ color: 'var(--muted-deep)' }}>{step.result}</span>
      )}
    </button>
  )
}

function StripMarker({ state, accent }: { state: 'done' | 'current' | 'ahead'; accent: string }) {
  if (state === 'done') {
    return (
      <span className="mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full" style={{ background: 'var(--ok)' }}>
        <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden><path d="m5 13 4.5 4.5L19 7" fill="none" stroke="var(--on-text)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    )
  }
  if (state === 'current') {
    return (
      <span className="mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full" style={{ border: `1.5px solid ${accent}` }}>
        <span className="strip-pulse h-[7px] w-[7px] rounded-full" style={{ background: accent }} />
      </span>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden className="mt-0.5 shrink-0" style={{ color: 'var(--muted-deep)' }}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 1.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

const stripCss = `
.strip-pulse { animation: strip-pulse 1.4s ease-in-out infinite; }
@keyframes strip-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.6); } }
.strip-shimmer {
  background: linear-gradient(90deg, var(--sc) 0%, var(--sc-hi) 22%, var(--sc) 46%);
  background-size: 220% 100%; -webkit-background-clip: text; background-clip: text;
  color: transparent; animation: strip-sheen 1.8s linear infinite;
}
@keyframes strip-sheen { to { background-position: -220% 0; } }
@media (prefers-reduced-motion: reduce) {
  .strip-pulse, .strip-shimmer { animation: none; }
  .strip-shimmer { color: var(--sc); -webkit-text-fill-color: var(--sc); }
}`
