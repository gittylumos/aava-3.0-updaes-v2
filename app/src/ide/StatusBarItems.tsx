/* Status bar items for the IDE surface (Task 4).
 *
 * The IDE has no Watch zone (surfaces-plan C6): run status collapses into ONE
 * plain-text status bar item. No custom colours, no spinner — text inherits the
 * status bar's own colour, the way a VS Code extension item does. */
import type { useJourney } from '../state/useJourney'
import type { PrepStep } from '../state/types'

type Journey = ReturnType<typeof useJourney>

const item =
  'inline-flex h-full shrink-0 items-center gap-1 px-1.5 text-[11.5px] leading-none whitespace-nowrap'

/** Left side: branch, then problems (errors / warnings). */
export function StatusLeft({ j }: { j: Journey }) {
  const task = j.state.activeTaskId ? j.state.tasks.find((t) => t.id === j.state.activeTaskId) : null
  const ticket = task?.context.ticket
  const branch = ticket ? `feat/${ticket}` : 'main'
  return (
    <span className="inline-flex h-full items-center">
      <span className={item} title={`Branch: ${branch}`} aria-label={`Git branch ${branch}`}>
        <BranchGlyph />
        {branch}
      </span>
      <span className={item} title="No problems" aria-label="0 errors, 0 warnings">
        <span aria-hidden>⊗</span> 0
        <span aria-hidden className="ml-1.5">⚠</span> 0
      </span>
    </span>
  )
}

/** Right side: the single AAVA item. Counts match the web RunStrip exactly:
    done = min(at, steps.length), total = steps.length. */
export function AavaStatusItem({ j, taskProgress, onClick }: {
  j: Journey
  taskProgress: { steps: PrepStep[]; at: number; waiting: boolean } | null
  onClick: () => void
}) {
  const inSession = !!(j.scenario && taskProgress && taskProgress.steps.length)
  let text = 'AAVA'
  let label = 'AAVA — no active session. Open the AAVA panel.'
  if (inSession && taskProgress) {
    const total = taskProgress.steps.length
    const done = Math.min(taskProgress.at, total)
    const state = taskProgress.at >= total ? 'Done' : taskProgress.waiting ? 'Waiting on you' : 'Working'
    text = `AAVA · ${state} · ${done}/${total}`
    label = `AAVA — ${state.toLowerCase()}, ${done} of ${total} steps done. Open the AAVA panel.`
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={`${item} cursor-pointer hover:bg-[var(--wash-2)]`}>
      <AGlyph />
      {text}
    </button>
  )
}

function BranchGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
      <circle cx="5" cy="3.5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="5" cy="12.5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11" cy="5.5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 5.1v5.8M11 7.1c0 2.4-6 1.6-6 3.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function AGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
      <path d="M3 13.5 8 2.5l5 11M5 9.5h6" fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
