import type { AppState } from '../state/types'

/** The one key the IDE surface uses for "which session is on screen": the
    thread when there is one (chats and tasks both have a thread id), else the
    task. Home is `null`. The workbench caches editor state under it and the
    gate notifications dedupe under it. */
export const sessionKeyOf = (s: Pick<AppState, 'activeThreadId' | 'activeTaskId'>): string | null =>
  s.activeThreadId ?? s.activeTaskId ?? null
