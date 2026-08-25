/** Chrome surfaces — Notifications, Search seeds, Pinned.
 *  Search and Pinned are still demo data; notifications are derived from the
 *  live task board, so the panel and the board can never disagree. */

import type { Task, TaskTag, Thread } from '../state/types'
import { TAG_META } from '../state/reducer'

export interface ChromeNotification {
  id: string
  tag: TaskTag
  title: string
  body: string
  when: string
  unread: boolean
  openTaskId: string
}

/** One row per task, newest first — TASKS is already in that order. */
export function taskNotifications(tasks: Task[], read: string[]): ChromeNotification[] {
  return tasks.map((t) => ({
    id: t.id,
    tag: t.tag,
    title: t.title,
    body: t.note,
    when: t.updated,
    unread: !read.includes(t.id),
    openTaskId: t.id,
  }))
}

export type SearchHitKind = 'task' | 'chat'

export interface SearchHit {
  id: string
  kind: SearchHitKind
  title: string
  subtitle: string
  /** Lower-cased text the query runs against — more than what the row shows. */
  haystack: string
  /** Exactly one of these is set, and it is how the row opens. */
  taskId?: string
  thread?: Thread
}

/* Every task once — a task with a thread is still the task, and opening it
   brings its thread back — plus the chats, which have no task behind them. */
export function searchHits(tasks: Task[], threads: Thread[]): SearchHit[] {
  const taskHits: SearchHit[] = tasks.map((t) => ({
    id: `s-${t.id}`,
    kind: 'task',
    title: t.title,
    subtitle: `${TAG_META[t.tag].label} · ${t.context.ticket} · ${t.updated}`,
    // The ticket key and the task id are how people actually look a task up.
    haystack: [t.id, t.title, t.note, t.context.ticket, t.context.description, TAG_META[t.tag].label]
      .join(' ')
      .toLowerCase(),
    taskId: t.id,
  }))

  const chatHits: SearchHit[] = threads
    .filter((th) => th.kind === 'chat')
    .map((th) => ({
      id: `s-${th.id}`,
      kind: 'chat',
      title: th.title,
      subtitle: `Chat · ${th.when}`,
      haystack: `${th.title} chat ${th.when}`.toLowerCase(),
      thread: th,
    }))

  return [...taskHits, ...chatHits]
}

/** Every whitespace-separated term has to appear. Empty query matches all. */
export function matchHits(hits: SearchHit[], query: string): SearchHit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return hits
  return hits.filter((h) => terms.every((t) => h.haystack.includes(t)))
}

export interface PinItem {
  id: string
  label: string
  source: string
  detail: string
  /** Evidence key inside T1 — focused when T1 is already active. */
  evidenceKey?: string
  openTaskId?: string
}

export const PINS: PinItem[] = [
  {
    id: 'p-jira',
    label: 'MOB-2841',
    source: 'Jira',
    detail: 'Add feedback form to mobile app — acceptance criteria and sprint.',
    evidenceKey: 'jira',
    openTaskId: 'T1',
  },
  {
    id: 'p-figma',
    label: 'Feedback Form v3',
    source: 'Figma',
    detail: 'Product frame matched to the ticket.',
    evidenceKey: 'figma',
    openTaskId: 'T1',
  },
  {
    id: 'p-play',
    label: 'PLAY form field + character counter',
    source: 'PLAY',
    detail: 'Components needed for the feedback screen.',
    evidenceKey: 'play',
    openTaskId: 'T1',
  },
]
