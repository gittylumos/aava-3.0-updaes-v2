/* The workspace layer: tab identity, and the one place workspace state lives.
 *
 * Two things live here because they are the two things the workspace owns that
 * the journey reducer deliberately does not. The reducer owns what the *task*
 * is doing — which artefacts exist, what the run produced. This owns how the
 * user has arranged their view of it, which lasts the session and means nothing
 * to the scenario.
 */
import type { IJsonModel } from 'flexlayout-react'
import type { ActiveObject, PlaygroundState, Scenario, TabId } from './types'

/* ── Tab identity ───────────────────────────────────────────────────────────
 *
 * `${type}:${resourceId}`. The type picks the renderer, the resource says which
 * one of that kind — so two tasks' previews are two tabs, but asking for the
 * same one twice lands on the tab already open. Identity IS the dedup: the
 * FlexLayout model is keyed by it, so `getNodeById` answers "is this already
 * open?" without a second registry to keep in sync.
 */
export type WorkspaceTabType =
  | 'code'
  | 'preview'
  | 'tests'
  | 'diff'
  | 'evidence'
  | 'task'
  | 'agent-output'
  | 'workflow'
  /** A Canvas object (a PRD) rendered as a single workspace tab. */
  | 'prd'

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
   a second file switcher in the tab bar would be the same navigation twice. */
export function workspaceTabFor(tab: TabId, taskId: string | null): WorkspaceTab {
  const task = taskId ?? 'task'
  const label: Record<TabId, string> = {
    code: 'Code',
    preview: 'Preview',
    tests: 'Validation Agent results',
    diff: 'Working diff',
    evidence: 'Evidence',
  }
  return { id: makeTabId(tab, task), type: tab, resourceId: task, label: label[tab] }
}

/* A preview needs a page to render. A backend migration parked at a review gate
   has none — so the tab is not locked for it, it does not exist for it. */
export function hasPreview(scenario: Scenario | null | undefined): scenario is Scenario {
  return !!scenario?.fileOrder.some((f) => f.endsWith('.html'))
}

/* The single tab a PRD object occupies. Its label stays fixed — the phase name
   changes inside the tab, not on it, so the tab identity is stable. */
export function prdTab(_object: ActiveObject): WorkspaceTab {
  return { id: makeTabId('prd', 'workspace'), type: 'prd', resourceId: 'workspace', label: 'PRD' }
}

/** Every artefact the quick-open menu can offer, in tab-bar order. */
export function openableTabs(
  pg: PlaygroundState,
  taskId: string | null,
  scenario: Scenario | null,
): { tab: WorkspaceTab; legacy: TabId; locked: boolean; hint?: string }[] {
  const out: { tab: WorkspaceTab; legacy: TabId; locked: boolean; hint?: string }[] = []

  const push = (legacy: TabId, hint?: string) => {
    const tab = workspaceTabFor(legacy, taskId)
    out.push({ tab, legacy, locked: !pg.enabledTabs.includes(legacy), hint })
  }

  if (hasPreview(scenario)) push('preview')
  push('code')
  push('tests')
  push('diff')
  push('evidence')

  return out
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
