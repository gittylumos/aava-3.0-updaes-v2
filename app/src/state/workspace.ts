/* The workspace layer: tab identity, and the one place workspace state lives.
 *
 * Two things live here because they are the two things the workspace owns that
 * the journey reducer deliberately does not. The reducer owns what the *task*
 * is doing — which artefacts exist, what the run produced. This owns how the
 * user has arranged their view of it, which lasts the session and means nothing
 * to the scenario.
 */
import type { IJsonModel } from 'flexlayout-react'
import type { PlaygroundState, Scenario, TabId } from './types'
import type { BacklogDoc } from '../prd/backlog'
import { INSIGHT_FILE, type InsightView } from '../prd/insight'
import { REPORT_ASSETS, type ReportView } from '../prd/report'

/* ── Tab identity ───────────────────────────────────────────────────────────
 *
 * `${type}:${resourceId}`. The type picks the renderer, the resource says which
 * one of that kind — so two tasks' previews are two tabs, but asking for the
 * same one twice lands on the tab already open. Identity IS the dedup: the
 * FlexLayout model is keyed by it, so `getNodeById` answers "is this already
 * open?" without a second registry to keep in sync.
 */
export type WorkspaceTabType =
  /** The fixed first tab — tools, artifacts, connected context, recents. */
  | 'overview'
  | 'code'
  /** One source file in its own editor tab, named by the file. */
  | 'file'
  | 'preview'
  | 'browser'
  | 'terminal'
  | 'tests'
  | 'diff'
  | 'evidence'
  | 'task'
  | 'agent-output'
  | 'workflow'
  /** A document — a PRD or a backlog phase file — named by its file. */
  | 'doc'
  /** One analytics dashboard, named by its view file. */
  | 'insight'
  /** One generated report asset (.html / .pdf), named by its file. */
  | 'report'
  /** The run's execution-activity graph. */
  | 'activity'
  /** The agent workflow builder, named by the process. */
  | 'agent'
  /** The agent run's Sample Run document. */
  | 'agent-sample'

export interface WorkspaceTab {
  id: string
  type: WorkspaceTabType
  resourceId: string
  label: string
}

export function makeTabId(type: WorkspaceTabType, resourceId: string): string {
  return `${type}:${resourceId}`
}

/** Split on the FIRST colon only — resource ids are free to contain more. */
export function parseTabId(id: string): { type: WorkspaceTabType; resourceId: string } {
  const at = id.indexOf(':')
  if (at === -1) return { type: id as WorkspaceTabType, resourceId: '' }
  return { type: id.slice(0, at) as WorkspaceTabType, resourceId: id.slice(at + 1) }
}

/* The scenario layer still speaks in `TabId` ('code', 'preview', …) because the
   beats are written in it and rewriting the scripts would be churn for nothing.
   This is the seam: one legacy id plus the current playground state resolves to
   exactly one workspace tab.
   Source is ONE tab, not one per file: the editor carries its own file tree, so
   a second file switcher in the tab bar would be the same navigation twice.
   The rendered page is a browser tab named after the artifact it shows (the
   task's title), never "Preview" — the tab says WHAT is open, not which tool. */
export function workspaceTabFor(tab: TabId, taskId: string | null, pageTitle?: string): WorkspaceTab {
  const task = taskId ?? 'task'
  const label: Record<TabId, string> = {
    code: 'Code',
    preview: pageTitle ?? 'Browser',
    tests: 'Validation Agent results',
    diff: 'Changes',
    evidence: 'Evidence',
  }
  return { id: makeTabId(tab, task), type: tab, resourceId: task, label: label[tab] }
}

export function overviewTab(taskId: string | null): WorkspaceTab {
  return { id: makeTabId('overview', taskId ?? 'task'), type: 'overview', resourceId: taskId ?? 'task', label: 'Overview' }
}

/* The Browser tool opens a fresh "New tab" every time, the way a browser's own
   "+" does — so its id is minted at open time (`browser:<task>~<n>`), and this
   is only the entry the tool menus list. */
export function browserTab(taskId: string | null): WorkspaceTab {
  return { id: makeTabId('browser', taskId ?? 'task'), type: 'browser', resourceId: taskId ?? 'task', label: 'Browser' }
}
export function terminalTab(taskId: string | null): WorkspaceTab {
  return { id: makeTabId('terminal', taskId ?? 'task'), type: 'terminal', resourceId: taskId ?? 'task', label: 'Terminal' }
}

/* A source file in its own editor tab — what opening a file from Changes does. */
export function fileTab(file: string): WorkspaceTab {
  return { id: makeTabId('file', file), type: 'file', resourceId: file, label: file.split('/').pop() ?? file }
}

/* Where the scenario's page is served. The dev server is Angular's :4200 (the
   run's own card says so), and the route is the feature folder's name. */
export function pageUrl(scenario: Scenario | null | undefined): string | null {
  if (!hasPreview(scenario)) return null
  const route = scenario.fileRoot?.split('/').filter(Boolean).pop()
  return `localhost:4200${route ? `/${route}` : ''}`
}

/* A preview needs a page to render. A backend migration parked at a review gate
   has none — so the tab is not locked for it, it does not exist for it. */
export function hasPreview(scenario: Scenario | null | undefined): scenario is Scenario {
  return !!scenario?.fileOrder.some((f) => f.endsWith('.html'))
}

/* The object artifacts — each is named by the file (or process) it is, so the
   tab strip reads like a file list. A file written twice (epics.md, then its
   revision) is ONE tab: the id is the file name, not the version. */
export function docTab(file: string): WorkspaceTab {
  return { id: makeTabId('doc', file), type: 'doc', resourceId: file, label: file }
}
export function insightTab(view: InsightView): WorkspaceTab {
  return { id: makeTabId('insight', view), type: 'insight', resourceId: view, label: INSIGHT_FILE[view] }
}
export function reportTab(view: ReportView): WorkspaceTab {
  return { id: makeTabId('report', view), type: 'report', resourceId: view, label: REPORT_ASSETS[view].file }
}
export function activityTab(sessionKey: string): WorkspaceTab {
  return { id: makeTabId('activity', sessionKey), type: 'activity', resourceId: sessionKey, label: 'Execution activity' }
}
export function agentTab(processName: string): WorkspaceTab {
  return { id: makeTabId('agent', 'workflow'), type: 'agent', resourceId: 'workflow', label: processName }
}
export function agentSampleTab(): WorkspaceTab {
  return { id: makeTabId('agent-sample', 'run'), type: 'agent-sample', resourceId: 'run', label: 'Sample Run' }
}

/* A file the run produced in an object session, newest first. A backlog/PRD run
   yields `doc` documents, the triage run `report` assets, the analytics run
   `insight` views — one of the three says what opening it shows. */
export interface SessionFile {
  name: string
  when: string
  doc?: BacklogDoc
  report?: ReportView
  insight?: InsightView
}

export type OpenTabEntry = { tab: WorkspaceTab; legacy?: TabId; locked: boolean; hint?: string }

/* The top-level tools every workspace offers — Browser, Code, Terminal,
   Changes. The same four sit on the Overview tab and behind the "+". A
   rendered page is not a tool: it is an artifact, opened as a browser tab
   named after it (from Overview → Artifacts / Recents, or the run's own Open).
   Everything else a run produces — validation results, evidence — is listed
   on the Overview, never a standing tab. */
export function openableTabs(
  pg: PlaygroundState,
  taskId: string | null,
  scenario: Scenario | null,
): OpenTabEntry[] {
  const out: OpenTabEntry[] = []
  /* A session with no code — a PRD, an analytics run — still shows Code and
     Changes, so the tools read the same everywhere; they are simply locked. */
  const push = (legacy: TabId) => {
    const tab = workspaceTabFor(legacy, taskId)
    out.push({
      tab, legacy,
      locked: !scenario || !pg.enabledTabs.includes(legacy),
      hint: scenario ? undefined : 'No code in this session',
    })
  }

  out.push({ tab: browserTab(taskId), locked: false })
  push('code')
  out.push({ tab: terminalTab(taskId), locked: false })
  push('diff')

  return out
}

/* The produced artefacts a workspace lists on its Overview — the run's
   outputs, not standing tabs. */
export function suggestedTabs(
  pg: PlaygroundState,
  taskId: string | null,
  scenario: Scenario | null,
): OpenTabEntry[] {
  /* A task nothing has run on yet has produced nothing — whatever tabs the
     playground enables by default. */
  if (!scenario) return []
  const out: OpenTabEntry[] = []
  const push = (legacy: TabId) => {
    const tab = workspaceTabFor(legacy, taskId)
    out.push({ tab, legacy, locked: !pg.enabledTabs.includes(legacy) })
  }
  push('tests')
  push('evidence')
  return out.filter((e) => !e.locked)
}

/** The scripted source of `file` as the editor shows it: the user's edit if
    there is one, else the version the run is on. */
export function fileText(scenario: Scenario, pg: PlaygroundState, file: string): string {
  const scripted = scenario.files[file].versions[pg.fileVersions[file] ?? 0].replaceAll('@@', '')
  return pg.edits[file] ?? scripted
}

/* ── Session state ────────────────────────────────────────────────
 *
 * In memory, and deliberately not in storage. This is a prototype that gets
 * demoed: a reload has to put the flow back at the very start, so nothing here
 * survives one.
 *
 * Layouts are keyed by task. A workspace arrangement is about the artefacts of
 * one task; restoring another task's tabs — pointing at files that task never
 * had — is worse than starting clean.
 */

/** Panel geometry as react-resizable-panels reports it: panel id → percentage. */
export type PanelLayout = Record<string, number>

/** Identifies a layout by the panels it covers. */
export function panelSetKey(ids: string[]): string {
  return [...ids].sort().join(',')
}

const taskLayouts = new Map<string, IJsonModel>()

export function saveTaskLayout(taskId: string, layout: IJsonModel) {
  taskLayouts.set(taskId, layout)
}

export function taskLayout(taskId: string): IJsonModel | undefined {
  return taskLayouts.get(taskId)
}

/* What the user opened in this task's workspace, newest first — the Overview's
   Recents. Same lifetime as the layouts: the session, never storage. */
const taskRecents = new Map<string, WorkspaceTab[]>()

export function recentTabs(taskId: string): WorkspaceTab[] {
  return taskRecents.get(taskId) ?? []
}

/** Moves `tab` to the front (one entry per artifact) and returns the new list. */
export function recordRecent(taskId: string, tab: WorkspaceTab): WorkspaceTab[] {
  const next = [tab, ...recentTabs(taskId).filter((t) => t.id !== tab.id)].slice(0, 12)
  taskRecents.set(taskId, next)
  return next
}
