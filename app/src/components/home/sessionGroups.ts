import type { Task } from '../../state/types'
import { TASKS } from '../../state/reducer'

/* Which tasks the session list shows, and the exact ask for each — shared by
   the list and the nav's "needs you" badge so the two counts always agree. */

export const ASK: Record<string, { meta: string; trail?: string; kind?: 'q' | 'a' }> = {
  T1: { meta: 'Asks: review the changes before the PR', trail: 'Step 9/10', kind: 'q' },
  T7: { meta: 'Wants approval for two unmapped fields', trail: 'Step 4/10', kind: 'a' },
  T2: { meta: 'Asks 3 questions on the trigger logic', trail: 'Not started', kind: 'q' },
}

const SEEDED = new Set(TASKS.map((t) => t.id))

/** The scripted tasks (by id), plus anything the user started this session
    (a PRD, backlog, report… opened from the prompt). Other seeded tasks are
    left to the sample rows. */
export function sessionTasks(tasks: Task[], firstTime: boolean): Task[] {
  if (firstTime) return []
  return tasks.filter((t) => ASK[t.id] || !SEEDED.has(t.id))
}

export const needsOf = (tasks: Task[]) => tasks.filter((t) => t.tag === 'input' || t.tag === 'blocked')
