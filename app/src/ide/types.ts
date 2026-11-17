/* Contracts for the IDE-surface demo (branch feat/lowfi-ide).
 *
 * The demo is a web page that looks like VS Code with the AAVA extension
 * installed. It runs the SAME journey engine as the web app (useJourney +
 * scenarios). What changes is where things render — see docs/surfaces-plan.md:
 *   Sidebar zone      → AAVA panel header (new session, history, user type)
 *   Conversation zone → AAVA panel (right, secondary sidebar), narrow
 *   Canvas zone       → BORROWED: host editor tabs, diff editor, integrated
 *                       browser tab, terminal panel, markdown preview
 *   Toolbar zone      → panel title + editor toolbar actions
 *   Watch zone        → NO watch: one status bar item + gate notifications
 *
 * Every file under src/ide/ is owned by one build task; this file is shared.
 */
import type { ReactNode } from 'react'

/** What an editor tab holds. Each replaces one web canvas tab. */
export type EditorTabKind =
  | 'welcome'   // VS Code's empty editor (no AAVA artifact open)
  | 'code'      // a source file (web: Code tab)
  | 'diff'      // the native diff editor, original ↔ proposed (web: Diff tab)
  | 'browser'   // Integrated Browser on localhost:4200 (web: Preview tab)
  | 'markdown'  // read-only markdown preview, e.g. Validation results.md (web: Validation tab)

export interface EditorTab {
  /** Stable id, e.g. `code:feedback.service.ts`, `diff:feedback.service.ts`, `browser:4200`, `md:validation`. */
  id: string
  kind: EditorTabKind
  /** Tab label, e.g. "feedback.service.ts", "feedback.service.ts ↔ (AAVA)", "localhost:4200", "Validation results.md". */
  title: string
  /** For code / diff: the scenario file name (key of scenario.files). */
  file?: string
  /** For browser: the URL shown in the address bar. */
  url?: string
  /** For markdown: which generated document. */
  doc?: 'validation'
}

/** One integrated-terminal session in the bottom panel. */
export interface TerminalSession {
  id: string
  /** e.g. "AAVA · feedback-form" */
  title: string
  lines: string[]
}

/** The editor-area model the router hook exposes (Task 3 implements it). */
export interface Workbench {
  tabs: EditorTab[]
  activeTabId: string | null
  open: (tab: EditorTab) => void
  focus: (id: string) => void
  close: (id: string) => void
  terminals: TerminalSession[]
  activeTerminalId: string | null
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
  /** Renders the body of a tab (Monaco, diff, browser, markdown, welcome). */
  renderTab: (tab: EditorTab) => ReactNode
  /** A file link in the chat / Explorer → open (or focus) its editor tab. */
  openFile: (file: string) => void
  /** A web canvas tab asked for (chat link `tab:` or a beat's showTab):
      'code' → the scenario's first file, 'diff' → diff editor,
      'preview' → integrated browser on localhost:4200 (+ ensure the
      `ng serve` terminal is running), 'tests' → Validation results.md,
      'evidence' → no editor tab (evidence lives in the AAVA panel). */
  openCanvasTab: (tab: import('../state/types').TabId) => void
}

/** A VS Code-style notification toast (Task 4). */
export interface IdeNotice {
  id: string
  /** One line, e.g. "AAVA: Feedback form is ready — review the changes." */
  text: string
  /** Optional buttons, rightmost primary. */
  actions?: { label: string; run: () => void; primary?: boolean }[]
}
