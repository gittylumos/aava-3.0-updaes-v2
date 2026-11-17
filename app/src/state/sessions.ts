/* The session list — one derivation shared by the web sidebar and the CLI's
 * /resume, so both surfaces always show the same rows in the same order. */
import { TAG_META, threadIdForTask } from './reducer'
import type { Task, TaskTag, Thread } from './types'

/* Whose turn is it, descending. With the status headings gone, order is what
   replaces them — anything waiting on you is at the top, finished work sinks. */
export const BY_TURN: Record<TaskTag, number> = { input: 0, blocked: 1, review: 2, working: 3, done: 4 }

/** Pinned rows and recent rows. `threads` is already the timeline — the reducer
 *  unshifts a task's thread the moment it is opened. A task you have never
 *  opened has no thread yet, so it gets a stand-in row so the list is the full
 *  picture, ordered by whose turn it is and sitting under the real history. */
export function sessionRows(threads: Thread[], tasks: Task[], pinnedIds: string[]): { pinned: Thread[]; recents: Thread[] } {
  const unopened: Thread[] = tasks
    .filter((t) => !threads.some((th) => th.id === threadIdForTask(t.id)))
    .sort((a, b) => BY_TURN[a.tag] - BY_TURN[b.tag])
    .map((t) => ({
      id: threadIdForTask(t.id),
      kind: 'task',
      taskId: t.id,
      title: t.title,
      when: TAG_META[t.tag].label,
    }))
  const all = [...threads, ...unopened]
  return {
    pinned: all.filter((t) => pinnedIds.includes(t.id)),
    recents: all.filter((t) => !pinnedIds.includes(t.id)),
  }
}
