import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Actions, DockLocation, Layout, Model, TabNode } from 'flexlayout-react'
import type { Action, IJsonModel } from 'flexlayout-react'
import type { ActiveObject, Message, PlaygroundState, Scenario, Task, WatchEntry } from '../../state/types'
import {
  activityTab, agentSampleTab, agentTab, docTab, hasPreview, insightTab, makeTabId, openableTabs, overviewTab,
  parseTabId, recentTabs, recordRecent, reportTab, saveTaskLayout, taskLayout, workspaceTabFor,
  type SessionFile, type WorkspaceTab,
} from '../../state/workspace'
import { docForFile, documentFile, objectOverview, recentRows, taskOverview } from '../../state/overview'
import { BACKLOG_FILE, type BacklogDoc } from '../../prd/backlog'
import type { InsightView } from '../../prd/insight'
import type { ReportView } from '../../prd/report'
import { useDismiss } from '../../state/useDismiss'
import { TabContentRegistry, type WorkspaceCtx } from './TabContentRegistry'
import { Overview } from './Overview'
import { TabTypeIcon } from './TabIcon'
import { Tooltip } from '../chrome/Tooltip'
import '../../design/flexlayout-theme.css'

/* The right panel, for every session — a task, a PRD, a backlog, an analytics
 * or report run, an agent build. One tab strip: Overview first, then one tab
 * per artifact, named by what it is (a page by its title, a document by its
 * file); "+" for the tools; full screen and close on the right. Drag, drop and
 * split come with FlexLayout. What is INSIDE a tab is TabContentRegistry's.
 */

const GLOBAL: IJsonModel['global'] = {
  tabEnableClose: true,
  tabEnableRename: false,
  tabSetEnableMaximize: true,
  /* Splitter thickness is a CSS variable in 0.10 (--flexlayout-splitter-size),
     set in flexlayout-theme.css — it is no longer a model attribute. */
  tabSetMinWidth: 140,
  tabSetMinHeight: 100,
}

/* Every workspace opens on its Overview — the tools and everything the
   session has. It closes like any tab; the panel coming back with nothing
   open brings it back, so the panel never opens onto a blank. An Open button
   or a beat opens the thing it names instead. */
function freshModel(sessionKey: string | null): IJsonModel {
  const overview = overviewTab(sessionKey)
  return {
    global: GLOBAL,
    layout: {
      type: 'row', weight: 100,
      children: [{
        type: 'tabset', id: 'workspace-root', weight: 100,
        children: [{ type: 'tab', id: overview.id, name: overview.label, component: overview.id }],
      }],
    },
  }
}

/* A restored layout still gets a guard — a model this version of FlexLayout
   will not build should cost one tab layout, never the whole panel. */
function modelFor(sessionKey: string | null): Model {
  const saved = sessionKey ? taskLayout(sessionKey) : undefined
  if (saved) {
    try {
      return Model.fromJson(saved)
    } catch {
      /* Discard and start clean rather than take the whole panel down. */
    }
  }
  return Model.fromJson(freshModel(sessionKey))
}

function countTabs(model: Model): number {
  let tabs = 0
  /* Recursive: after a split, tabsets nest inside rows, so counting only the
     root's children reports zero for a workspace that is visibly full. */
  model.visitNodes((node) => {
    if (node.getType() === 'tab') tabs++
  })
  return tabs
}

/* The request key the task opener compares against — the tab the run last
   asked for, and how many times anything has asked. */
const requestKey = (pg: PlaygroundState, taskId: string | null) =>
  `${workspaceTabFor(pg.activeTab, taskId).id}#${pg.openRequest}`

/* The artifact an object session is on right now — the document, dashboard,
   report or workflow the run last produced or the user last opened. */
function objectArtifact(object: ActiveObject | null | undefined, processName?: string): WorkspaceTab | null {
  if (!object?.docReady) return null
  switch (object.kind) {
    case 'insight': return insightTab(object.activeInsight ?? 'funnel')
    case 'report': return object.activeReport ? reportTab(object.activeReport) : null
    case 'agent': return processName ? agentTab(processName) : null
    default: return docTab(documentFile(object))
  }
}

/* Recents start with the running page, if the run has one — it is the first
   thing anyone opens. */
function seedRecents(key: string | null, scenario: Scenario | null, title?: string): WorkspaceTab[] {
  if (!key) return []
  const had = recentTabs(key)
  if (had.length || !hasPreview(scenario)) return had
  return recordRecent(key, workspaceTabFor('preview', key, title))
}

/* Opening these is worth remembering; a tool or a blank browser tab is not. */
const REMEMBERED: WorkspaceTab['type'][] = [
  'preview', 'file', 'code', 'diff', 'tests', 'evidence', 'doc', 'insight', 'report', 'activity', 'agent', 'agent-sample',
]

type Change = { quote: string; note: string; range?: Range }

interface Props {
  /** Whose workspace this is — a task id, or `obj:<task>` for an object session.
      Layout, recents and requests are all keyed by it. */
  sessionKey: string | null
  pg: PlaygroundState
  scenario: Scenario | null
  taskId: string | null
  /** The task behind a task session — its title names the page, its context
      fills the Overview's connected sources. */
  task?: Task | null
  /** The object behind an object session. */
  object?: ActiveObject | null
  messages: Message[]
  /** An object session's produced files, newest first. */
  files?: SessionFile[]
  /** An agent session's process name — its workflow tab's label. */
  processName?: string
  /** This session's execution-activity graph, if it has one. */
  activity?: React.ReactNode
  /** The header's "execution activity" / "files" asks, and a beat's. Bumping
      `n` opens the view named — the graph, the Overview, or the artifact. */
  canvasRequest: { view: 'doc' | 'graph' | 'files'; n: number }
  /** Pending inline comments on the open document. */
  changes?: Change[]
  onAddChange?: (change: Change) => void
  /** A document / dashboard / report tab came to the front — the object follows. */
  onSelectDoc?: (doc: BacklogDoc) => void
  onSelectInsight?: (view: InsightView) => void
  onSelectReport?: (view: ReportView) => void
  onClone?: () => void
  /** The Watch zone's run log, shown in the bottom bar. */
  watch: WatchEntry[]
  theme: 'dark' | 'light'
  /** True when the right panel is expanded — shortcuts stay dormant otherwise. */
  active: boolean
  onCollapse: () => void
  onToast: (text: string) => void
  onFile: (file: string) => void
  onEdit: (file: string, text: string) => void
}

export function TabWorkspace({
  sessionKey, pg, scenario, taskId, task = null, object = null, messages, files = [], processName, activity,
  canvasRequest, changes = [], onAddChange, onSelectDoc, onSelectInsight, onSelectReport, onClone,
  watch: _watch, theme, active, onCollapse, onToast, onFile, onEdit,
}: Props) {
  const [model, setModel] = useState<Model>(() => modelFor(sessionKey))
  const [recents, setRecents] = useState<WorkspaceTab[]>(() => seedRecents(sessionKey, scenario, task?.title))
  /* Full screen — the workspace takes the whole window over the conversation.
     A class swap on the same element, never a remount, so the tab layout and
     every editor inside it survive going in and out. */
  const [expanded, setExpanded] = useState(false)
  /* Whatever a TASK asked for before this workspace mounted has already been
     answered by the thread it was asked in — the panel opens on its Overview,
     and only a request made from here on opens a tab. An object session is the
     other way round: it shows the artifact it is on, so that starts unanswered. */
  const lastTaskAsk = useRef<string | null>(requestKey(pg, taskId))
  const lastObjectAsk = useRef<string | null>(null)
  const lastSampleAsk = useRef(false)
  const lastCanvasAsk = useRef(canvasRequest.n)
  const prevKey = useRef(sessionKey)
  const browsers = useRef(0)

  /* A workspace arrangement belongs to one session's artefacts. Carrying it
     into another would restore tabs pointing at files that session never had. */
  useEffect(() => {
    if (prevKey.current === sessionKey) return
    prevKey.current = sessionKey
    lastTaskAsk.current = requestKey(pg, taskId)
    lastObjectAsk.current = null
    lastSampleAsk.current = false
    lastCanvasAsk.current = canvasRequest.n
    setModel(modelFor(sessionKey))
    setRecents(seedRecents(sessionKey, scenario, task?.title))
    setExpanded(false)
    // Only a change of session resets the workspace; the values read are that session's.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey])

  const collapse = useCallback(() => { setExpanded(false); onCollapse() }, [onCollapse])

  /* A document, dashboard or report tab coming to the front moves the object
     onto it — so a comment batch, the progress dock and the next beat all
     agree with what is on screen. */
  const followSelection = useCallback((tabId: string) => {
    if (!object) return
    const { type, resourceId } = parseTabId(tabId)
    if (type === 'doc' && object.kind === 'backlog') {
      const doc = docForFile(object, files, resourceId)
      if (doc && BACKLOG_FILE[doc] !== BACKLOG_FILE[object.activeDoc ?? 'intake']) onSelectDoc?.(doc)
    } else if (type === 'insight' && resourceId !== object.activeInsight) {
      onSelectInsight?.(resourceId as InsightView)
    } else if (type === 'report' && resourceId !== object.activeReport) {
      onSelectReport?.(resourceId as ReportView)
    }
  }, [object, files, onSelectDoc, onSelectInsight, onSelectReport])

  const handleModelChange = useCallback((changed: Model, action: Action) => {
    if (sessionKey) saveTaskLayout(sessionKey, changed.toJson())
    if (action.type === Actions.SELECT_TAB) followSelection(action.data.tabNode as string)
    /* Closing the last tab closes the panel — but the model stays exactly as it
       is, and the session is untouched. Reopening brings the Overview back. */
    if (countTabs(changed) === 0) collapse()
  }, [sessionKey, followSelection, collapse])

  /* Open-or-activate. Identity does the deduplication: the tab id IS
     `${type}:${resource}`, so asking twice for one file lands on the tab that is
     already open, and asking for a different file opens a second one. The
     Browser tool is the exception — like a browser's own "+", it always opens
     a new tab. */
  const openTab = useCallback((asked: WorkspaceTab) => {
    let tab = asked
    if (tab.type === 'browser' && !tab.resourceId.includes('~')) {
      let id: string
      do { id = makeTabId('browser', `${tab.resourceId}~${++browsers.current}`) } while (model.getNodeById(id))
      tab = { ...tab, id, label: 'New tab' }
    }
    if (sessionKey && REMEMBERED.includes(tab.type)) setRecents(recordRecent(sessionKey, tab))
    if (model.getNodeById(tab.id)) {
      model.doAction(Actions.selectTab(tab.id))
      return
    }
    /* Never hardcode a tabset id — the one the layout shipped with is gone the
       moment the user closes or splits it. */
    const target = model.getActiveTabset() ?? model.getFirstTabSet()
    if (!target) return
    model.doAction(Actions.addNode(
      { type: 'tab', id: tab.id, name: tab.label, component: tab.id, helpText: tab.label },
      target.getId(),
      DockLocation.CENTER,
      -1,
      true,
    ))
  }, [model, sessionKey])

  /* A task's scenario says "show the diff now" in its own vocabulary; this is
     where that becomes a workspace tab. Guarded on the resolved id *and* the
     request counter: incidental re-renders do not re-add a tab the user
     deliberately closed, but asking again — an Open button, a file link, the
     next beat — always does, even for the tab last asked for. */
  useEffect(() => {
    if (object) return
    const key = requestKey(pg, taskId)
    if (lastTaskAsk.current === key) return
    lastTaskAsk.current = key
    openTab(workspaceTabFor(pg.activeTab, taskId, task?.title))
  }, [object, pg, taskId, task?.title, openTab])

  /* An object session follows its run: each document, dashboard or report the
     run produces (or a card's Open asks for) comes to the front as its tab. The
     key includes the backlog doc, so a revision written to a file already open
     brings that tab forward too. */
  const artifact = objectArtifact(object, processName)
  const artifactKey = artifact ? `${artifact.id}#${object?.activeDoc ?? ''}` : null
  useEffect(() => {
    if (!artifact || lastObjectAsk.current === artifactKey) return
    lastObjectAsk.current = artifactKey
    openTab(artifact)
    // `artifact` is rebuilt every render; its key is what identifies it.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [artifactKey, openTab])

  /* An artifact renamed in place — the golden workflow becoming the user's
     working copy — keeps its tab and takes the new name. */
  const artifactLabel = artifact?.label
  useEffect(() => {
    if (!artifact || !artifactLabel) return
    const node = model.getNodeById(artifact.id)
    if (node instanceof TabNode && node.getName() !== artifactLabel) {
      model.doAction(Actions.renameTab(artifact.id, artifactLabel))
    }
    // Only the label moving is a rename; the id is the artifact's identity.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [artifactLabel, model])

  /* The agent run's Sample Run document, opened from the conversation's card. */
  useEffect(() => {
    if (!object?.agentDocOpen || lastSampleAsk.current) return
    lastSampleAsk.current = true
    openTab(agentSampleTab())
  }, [object?.agentDocOpen, openTab])

  /* The header's execution-activity and files toggles, and a beat that moves
     the canvas: the graph opens as its own tab, "files" is the Overview, and
     "doc" is the artifact the session is on. */
  useEffect(() => {
    if (lastCanvasAsk.current === canvasRequest.n) return
    lastCanvasAsk.current = canvasRequest.n
    if (canvasRequest.view === 'graph' && activity) openTab(activityTab(sessionKey ?? 'session'))
    else if (canvasRequest.view === 'files') openTab(overviewTab(sessionKey))
    else if (canvasRequest.view === 'doc' && artifact) openTab(artifact)
    // Fires on the request only; the values read are the session's at that moment.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRequest.n])

  /* Closing the last tab folds the panel away. When it comes back with
     nothing in it, it comes back on the Overview — never an empty frame.
     After the openers above, so a panel reopened BY a request shows only
     what was asked for. */
  useEffect(() => {
    if (!active || countTabs(model) > 0) return
    openTab(overviewTab(sessionKey))
  }, [active, model, sessionKey, openTab])

  /* Escape leaves full screen before it does anything else — captured, and
     marked handled, so the app's own Escape (fold the panel away) waits for
     the next press. */
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopImmediatePropagation()
      setExpanded(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [expanded])

  useWorkspaceShortcuts(model, active)

  const overview = useMemo(() => object
    ? objectOverview({ object, pg, files, messages, processName })
    : taskOverview({ scenario, pg, task, taskId, messages }),
  [object, pg, files, messages, processName, scenario, task, taskId])

  const ctx: WorkspaceCtx = {
    scenario, task, taskId, object, pg, theme, overview, files, activity, changes,
    recents: recentRows(recents, scenario),
    onOpenTab: openTab, onToast, onFile, onEdit, onAddChange, onClone,
  }

  return (
    <section aria-label="Workspace"
      className={expanded
        ? 'fixed inset-0 z-[70] flex flex-col overflow-hidden'
        : 'flex h-full min-w-0 flex-1 flex-col overflow-hidden'}
      style={expanded ? { background: 'var(--ground)' } : undefined}>
      <div
        className="relative m-[12px] min-h-0 flex-1 overflow-hidden rounded-[var(--r-md)]"
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)' }}
      >
        <Layout
          model={model}
          factory={(node: TabNode) => <TabContentRegistry tabId={node.getComponent() ?? ''} ctx={ctx} />}
          onModelChange={handleModelChange}
          /* Each tab wears its artifact's icon before the name — the "🌐 name ×"
             pill shape from the reference. */
          onRenderTab={(node, renderValues) => {
            renderValues.leading = <TabTypeIcon type={parseTabId(node.getComponent() ?? '').type} name={node.getName()} />
          }}
          /* Sticky buttons sit immediately after the last tab and travel with the
             strip — the browser new-tab position, which is where a "+" is looked
             for. FlexLayout owns that row, so this is the only way in. The global
             full-screen / close controls go on the RIGHT of the ROOT tabset only,
             so a split doesn't paint a second pair. */
          onRenderTabSet={(node, values) => {
            values.stickyButtons.push(<QuickOpen key="quick-open" tools={overview.tools} onOpen={openTab} />)
            const isRoot = node.getModel().getFirstTabSet()?.getId() === node.getId()
            if (isRoot) {
              values.buttons.push(
                <ChromeBtn key="expand" label={expanded ? 'Exit full screen' : 'Full screen'} onClick={() => setExpanded((x) => !x)}>
                  {expanded
                    ? <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 9h5V4M15 4v5h5M20 15h-5v5M9 20v-5H4" /></svg>
                    : <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 4H4v5M20 9V4h-5M15 20h5v-5M4 15v5h5" /></svg>}
                </ChromeBtn>,
                <ChromeBtn key="close" label="Hide workspace" onClick={collapse}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
                </ChromeBtn>,
              )
            }
          }}
          /* A tabset emptied by a split still gets the Overview, never a blank. */
          onTabSetPlaceHolder={() => <Overview data={overview} recents={ctx.recents} onOpen={openTab} />}
          realtimeResize
        />
      </div>
      {/* The Watch zone — a thin bar at the foot of every workspace. */}
    </section>
  )
}

/* A tab-strip chrome control (full screen / close) — sits on the right of the
   root tabset header, matching the reference's top-right cluster. */
function ChromeBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip label={label} side="bottom" align="end">
      <button onClick={onClick} aria-label={label}
        className="press grid h-7 w-7 place-items-center rounded-[7px] transition-colors hover:bg-[var(--wash-4)]"
        style={{ color: 'var(--muted)' }}>
        {children}
      </button>
    </Tooltip>
  )
}

/* §23: ONE tab bar. The artefacts used to sit in a permanent row of buttons that
   looked like tabs directly above the actual tabs — so this is a quick-open
   menu instead. It opens the tools, the same four the Overview leads with;
   the tab strip navigates what is open. A locked tool stays listed, because
   knowing the diff exists and why it is not ready beats it silently missing. */
function QuickOpen({ tools, onOpen }: {
  tools: ReturnType<typeof openableTabs>
  onOpen: (tab: WorkspaceTab) => void
}) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null)
  const open = at !== null
  const root = useRef<HTMLDivElement>(null)
  useDismiss(open, root, useCallback(() => setAt(null), []))

  return (
    <div ref={root} className="relative shrink-0">
      <Tooltip label="Open a tool" disabled={open} side="bottom">
        <button
          /* The tab strip clips its children, so the menu is portalled out and
             positioned from the button's rect rather than anchored to it. */
          onClick={(e) => {
            if (open) return setAt(null)
            const r = e.currentTarget.getBoundingClientRect()
            setAt({ x: Math.min(r.left, window.innerWidth - 208), y: r.bottom + 6 })
          }}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-pressed={open}
          aria-label="Open a tool"
          className="icon-btn"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </Tooltip>

      {at && createPortal(
        <div
          role="menu"
          /* Outside the dismiss root once portalled, so the menu stops its own
             mousedown reaching the document listener that would close it before
             the click lands on an item. */
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-[80] w-[200px] overflow-hidden rounded-[12px] p-1.5 shadow-lg"
          style={{ left: at.x, top: at.y, background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}
        >
          {tools.map(({ tab, locked, hint }) => (
            <button
              key={tab.id}
              role="menuitem"
              disabled={locked}
              title={locked ? hint : undefined}
              onClick={() => { onOpen(tab); setAt(null) }}
              className="press flex w-full items-center gap-2.5 rounded-[8px] px-2 py-2 text-left text-[12.5px] hover:bg-[var(--glass)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:hover:bg-transparent"
              style={{ color: locked ? 'var(--muted-deep)' : 'var(--text-dim)' }}
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center" style={{ color: 'var(--muted)' }}><TabTypeIcon type={tab.type} /></span>
              <span className="min-w-0 flex-1 truncate">{tab.label}</span>
              {locked && (
                <span className="shrink-0 text-[10px]" style={{ color: 'var(--muted-deep)' }}>Locked</span>
              )}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}

/* Cmd/Ctrl+W and Cmd/Ctrl+Tab belong to the browser and are left alone. These
   three are the safe neighbours, and they stay dormant unless the workspace is
   actually on screen — a shortcut that fires into a collapsed panel is a
   shortcut that appears to do nothing.
   `e.code` rather than `e.key`: Shift+] only produces '}' on some layouts. */
function useWorkspaceShortcuts(model: Model, active: boolean) {
  useEffect(() => {
    if (!active) return

    const cycle = (delta: number) => {
      const tabset = model.getActiveTabset() ?? model.getFirstTabSet()
      if (!tabset) return
      const children = tabset.getChildren()
      const selected = tabset.getSelected()
      if (selected === -1 || children.length < 2) return
      const next = (selected + delta + children.length) % children.length
      model.doAction(Actions.selectTab(children[next].getId()))
    }

    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return

      if (e.altKey && e.code === 'KeyW') {
        const node = model.getActiveTabset()?.getSelectedNode()
        if (!node) return
        e.preventDefault()
        model.doAction(Actions.deleteTab(node.getId()))
        return
      }
      if (!e.shiftKey || e.altKey) return
      if (e.code === 'BracketRight') { e.preventDefault(); cycle(1) }
      else if (e.code === 'BracketLeft') { e.preventDefault(); cycle(-1) }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [model, active])
}
