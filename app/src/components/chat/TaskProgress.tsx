import * as Collapsible from '@radix-ui/react-collapsible'
import type { PrepStep } from '../../state/types'

/* Where the run stands, pinned above the composer.
 *
 * This used to be a block you had to ask for — a chip, an answer, a collapsed
 * list somewhere up the transcript. That made the single most important fact
 * about a parked run ("it is waiting on YOU, at step 4") something you could
 * scroll away from. It is furniture now: always on screen, collapsed to the one
 * step that matters, opening to the full ten.
 *
 * `at` is the whole status model — before it is done, on it is you, after it is
 * ahead — so the ticks and the marker can never contradict each other.
 */
export function TaskProgress({ steps, at, onOpenEvidence, currentWaiting = true }: {
  steps: PrepStep[]
  at: number
  onOpenEvidence: (key: string) => void
  /** Whether the current step is genuinely a gate awaiting the user. Scenario
      runs are parked at their gate (default true); a live run passes false while
      a step is mid-generation, so the bar does not claim "waiting on you" then. */
  currentWaiting?: boolean
}) {
  const done = Math.min(at, steps.length)
  const current = steps[at]

  return (
    /* Joined to the composer below: one surface, shared edge. The panel and the
       thing you answer it with are one object — a gap between them made the run
       status look like just another card that had floated to the bottom. */
    /* No surface of its own — it sits on the tinted wrapper it shares with the
       composer, which is what makes the two read as one object rather than two
       cards that happen to touch. */
    <Collapsible.Root className="group overflow-hidden">
      <Collapsible.Trigger className="flex w-full items-center gap-3 px-4 pb-2.5 pt-3 text-left transition-colors hover:bg-[var(--wash-2)]">
        <span className="text-[10.5px] font-semibold uppercase tracking-[.14em]" style={{ color: 'var(--muted)' }}>
          Task progress
        </span>
        <span className="mono ml-auto text-[11.5px] tabular-nums" style={{ color: 'var(--muted)' }}>
          {done}/{steps.length}
        </span>
        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"
          className="shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
          style={{ color: 'var(--muted-deep)' }}>
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Collapsible.Trigger>

      {/* The bar carries the count even when the list is shut. */}
      <div className="h-[3px] overflow-hidden" style={{ background: 'var(--wash-4)' }}>
        <div className="h-full transition-[width] duration-500"
          style={{ width: `${(done / steps.length) * 100}%`, background: 'var(--done)' }} />
      </div>

      {/* Collapsed, the panel is one line: the step you are on. Hidden once the
          full list is open, which shows the same row in place. */}
      {current && (
        <div className="px-2 py-1.5 group-data-[state=open]:hidden">
          <Row step={current} state="current" index={at} onOpenEvidence={onOpenEvidence} currentWaiting={currentWaiting} />
        </div>
      )}

      <Collapsible.Content className="grid grid-cols-1 px-2 py-1.5">
        {steps.map((step, i) => (
          <Row key={step.key} step={step} index={i}
            state={i < at ? 'done' : i === at ? 'current' : 'ahead'}
            onOpenEvidence={onOpenEvidence} currentWaiting={currentWaiting} />
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

function Row({ step, state, onOpenEvidence, currentWaiting = true }: {
  step: PrepStep
  index: number
  state: 'done' | 'current' | 'ahead'
  onOpenEvidence: (key: string) => void
  currentWaiting?: boolean
}) {
  const current = state === 'current'

  return (
    /* A row goes straight to its evidence. Opening a step to read a paragraph
       about it was a stop on the way to the thing the paragraph describes. */
    <button onClick={() => onOpenEvidence(step.key)}
      title={step.detail}
      className="flex w-full min-w-0 items-center gap-3 rounded-[var(--r-sm)] px-2.5 py-[7px] text-left transition-colors hover:bg-[var(--wash-3)]">
      <Marker state={state} />

      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="min-w-0 truncate text-[13px]"
          style={{
            color: current ? 'var(--text)' : state === 'done' ? 'var(--text-dim)' : 'var(--muted)',
            fontWeight: current ? 600 : 400,
          }}>
          {step.label}
        </span>
        {current && (
          <span className="text-[11.5px]" style={{ color: step.gate && currentWaiting ? 'var(--warn)' : 'var(--muted)' }}>
            {step.gate && currentWaiting ? 'Waiting on you' : step.gate ? 'Drafting…' : step.result}
          </span>
        )}
      </span>

      {!current && state === 'done' && (
        <span className="mono shrink-0 truncate text-[11px]" style={{ color: 'var(--muted-deep)' }}>
          {step.result}
        </span>
      )}
    </button>
  )
}

function Marker({ state }: { state: 'done' | 'current' | 'ahead' }) {
  if (state === 'done') {
    return (
      <span className="grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full"
        style={{ background: 'var(--ok)' }}>
        <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
          <path d="m5 13 4.5 4.5L19 7" fill="none" stroke="var(--on-text)" strokeWidth="3.2"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }

  // Dashed, because it is the only step that is neither finished nor waiting
  // its turn — it is open, and open is what a dashed edge reads as.
  if (state === 'current') {
    return (
      <span className="h-[19px] w-[19px] shrink-0 rounded-full border-[1.5px] border-dashed"
        style={{ borderColor: 'var(--warn)' }} />
    )
  }

  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" className="shrink-0"
      style={{ color: 'var(--muted-deep)' }}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 1.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
