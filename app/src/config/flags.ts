/* Feature switches for the low-fidelity web surface.
 *
 * Nothing here was deleted: each removed piece of UI is still in the code,
 * switched off by a boolean. Set a flag to `true` to bring that piece back.
 * Applies to the web surface (`/`) only; the IDE and CLI surfaces have their
 * own chrome.
 */
export const FLAGS = {
  /* ── Sidebar ──────────────────────────────────────────────────────────── */
  /** Show four inert placeholder rows ("Placeholder-1" … "Placeholder-4")
   *  where the real navigation used to be. */
  SIDEBAR_PLACEHOLDERS: true,
  /** "New Session" nav row. */
  SHOW_NEW_SESSION: false,
  /** "My Tasks" nav row. */
  SHOW_MY_TASKS: false,
  /** "Search" nav row (the placeholders stand in for it as Placeholder-4). */
  SHOW_SEARCH: false,
  /** The "Pinned" section. */
  SHOW_PINNED: false,
  /** The "Recents" section and its filter. */
  SHOW_RECENTS: false,

  /* ── Home ─────────────────────────────────────────────────────────────── */
  /** The bell in the top-right corner of the home screen. */
  SHOW_NOTIFICATIONS: false,
  /** Third home card: show the Jira task "Modify the progress bar behavior"
   *  (MOB-2907) as an inert "Task card -3 · Processing" card. When false, the
   *  real clarify session returns. */
  HOME_TASK3_AS_PROCESSING_CARD: true,

  /* ── Session header ───────────────────────────────────────────────────── */
  /** The "Execution activity" toggle in a session's header. */
  SHOW_EXECUTION_ACTIVITY: false,

  /* ── Composer ─────────────────────────────────────────────────────────── */
  /** The "N connectors active" line under the prompt bar, for a First time
   *  user. (The General user keeps it.) */
  SHOW_CONNECTORS_NOTE_FIRST_TIME: false,
} as const
