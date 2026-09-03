import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Actions, DockLocation, Layout, Model, TabNode } from 'flexlayout-react'
import type { IJsonModel } from 'flexlayout-react'
import type { ActiveObject, PlaygroundState, Scenario, WatchEntry } from '../../state/types'
import { openableTabs, prdTab, saveTaskLayout, taskLayout, workspaceTabFor, type WorkspaceTab } from '../../state/workspace'
import { useDismiss } from '../../state/useDismiss'
import { TabContentRegistry } from './TabContentRegistry'
import { WatchBar } from '../../zones/WatchBar'
import '../../design/flexlayout-theme.css'

/* An empty tabset, not a seeded one. Manually reopening an empty workspace has
   to show an empty workspace — inventing a tab to fill it is the app deciding
   what you wanted to look at. */
function emptyModel(): IJsonModel {
  return {
    global: {
      tabEnableClose: true,
      tabEnableRename: false,
      tabSetEnableMaximize: true,
      /* Splitter thickness is a CSS variable in 0.10 (--flexlayout-splitter-size),
         set in flexlayout-theme.css — it is no longer a model attribute. */
      tabSetMinWidth: 140,
      tabSetMinHeight: 100,
    },
    layout: {
      type: 'row',
      weight: 100,
      children: [{ type: 'tabset', id: 'workspace-root', weight: 100, children: [] }],
    },
  }
}

/* A single-tab layout seeded with the PRD workspace. A PRD object has no saved
   layout of its own, so it always opens on this one tab. */
function prdModel(): IJsonModel {
  const base = emptyModel()
  return {
    ...base,
    layout: {
      type: 'row', weight: 100,
      children: [{
        type: 'tabset', id: 'workspace-root', weight: 100,
        children: [{ type: 'tab', id: 'prd:workspace', name: 'PRD', component: 'prd:workspace' }],
      }],
    },
  }
}

/* A restored layout still gets a guard — a model this version of FlexLayout
   will not build should cost one tab layout, never the whole panel. */
function modelFor(taskId: string | null, isPrd: boolean): Model {
  const saved = taskId ? taskLayout(taskId) : undefined
  if (saved) {
    try {
      return Model.fromJson(saved)
    } catch {
      /* Discard and start clean rather than take the whole panel down. */
    }
  }
  return Model.fromJson(isPrd ? prdModel() : emptyModel())
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

interface Props {
  pg: PlaygroundState
  scenario: Scenario | null
  taskId: string | null
  /** Set when the workspace is holding a PRD object rather than a task. */
  prdObject?: ActiveObject | null
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
  pg, scenario, taskId, prdObject, watch, theme, active, onCollapse, onToast, onFile, onEdit,
}: Props) {
  const isPrd = !!prdObject
  /* PRD workspaces key their layout on a constant id, not a task id, so the
     single tab persists across the object's lifetime. */
  const layoutKey = isPrd ? 'prd' : taskId
  const [model, setModel] = useState<Model>(() => modelFor(taskId, isPrd))
  const lastOpened = useRef<string | null>(null)
  const prevKey = useRef(layoutKey)

  /* A workspace arrangement belongs to one task's artefacts. Carrying it into
     another task would restore tabs pointing at files that task never had. */
  useEffect(() => {
    if (prevKey.current === layoutKey) return
    prevKey.current = layoutKey
    lastOpened.current = null
    setModel(modelFor(taskId, isPrd))
  }, [layoutKey, taskId, isPrd])

  const handleModelChange = useCallback((changed: Model) => {
    if (taskId) saveTaskLayout(taskId, changed.toJson())
    /* Closing the last tab closes the panel — but the model stays exactly as it
       is, and the task is untouched. Reopening finds an empty workspace. */
    if (countTabs(changed) === 0) onCollapse()
  }, [taskId, onCollapse])

  /* Open-or-activate. Identity does the deduplication: the tab id IS
     `${type}:${resource}`, so asking twice for one file lands on the tab that is
     already open, and asking for a different file opens a second one. */
  const openTab = useCallback((tab: WorkspaceTab) => {
    if (model.getNodeById(tab.id)) {
      model.doAction(Actions.selectTab(tab.id))
      return
    }
    /* Never hardcode a tabset id — the one the layout shipped with is gone the
       moment the user closes or splits it. */
    const target = model.getActiveTabset() ?? model.getFirstTabSet()
    if (!target) return
    model.doAction(Actions.addNode(
      { type: 'tab', id: tab.id, name: tab.label, component: tab.id },
      target.getId(),
      DockLocation.CENTER,
      -1,
      true,
    ))
  }, [model])

  /* The scenario says "show the diff now" in its own vocabulary; this is where
     that becomes a workspace tab. Guarded on the resolved id *and* the request
     counter: incidental re-renders (reopening the panel, say) do not re-add a
     tab the user deliberately closed, but asking again — an Open button, a file
     link, the next beat — always does, even for the tab last asked for. */
  useEffect(() => {
    // A PRD object owns a single seeded tab and has no scenario vocabulary to
    // resolve — the scenario-driven tab opening does not apply to it.
    if (isPrd) return
    const tab = workspaceTabFor(pg.activeTab, taskId)
    const key = `${tab.id}#${pg.openRequest}`
    if (lastOpened.current === key) return
    lastOpened.current = key
    openTab(tab)
  }, [isPrd, pg.activeTab, pg.openRequest, taskId, openTab])

  useWorkspaceShortcuts(model, active)

  return (
    <section aria-label="Task workspace" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div
        className="relative m-[12px] mb-0 min-h-0 flex-1 overflow-hidden rounded-t-[var(--r-md)]"
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)', borderBottom: 'none' }}
      >
        <Layout
          model={model}
          factory={(node: TabNode) => (
            <TabContentRegistry
              tabId={node.getComponent() ?? ''}
              scenario={scenario}
              prdObject={prdObject}
              pg={pg}
              theme={theme}
              onToast={onToast}
              onFile={onFile}
              onEdit={onEdit}
            />
          )}
          onModelChange={handleModelChange}
          /* Sticky buttons sit immediately after the last tab and travel with the
             strip — the browser new-tab position, which is where a "+" is looked
             for. FlexLayout owns that row, so this is the only way in. */
          onRenderTabSet={(_node, values) => {
            values.stickyButtons.push(
              <QuickOpen key="quick-open" pg={pg} taskId={taskId} scenario={scenario} prdObject={prdObject} onOpen={openTab} />,
            )
          }}
          onTabSetPlaceHolder={() => <WorkspaceEmpty />}
          realtimeResize
        />
      </div>
      {/* The Watch zone — a thin bar at the foot of every workspace. */}
      <div className="mx-[12px] mb-[12px] overflow-hidden rounded-b-[var(--r-md)]"
        style={{ border: '1px solid var(--glass-line-soft)', borderTop: 'none' }}>
        <WatchBar entries={watch} />
      </div>
    </section>
  )
}

/* Shown when every tab is closed. Names the way back rather than apologising. */
function WorkspaceEmpty() {
  return (
    <div className="grid h-full place-items-center px-8 text-center">
      <div className="max-w-[300px]">
        <p className="text-[13px] font-medium" style={{ color: 'var(--text-dim)' }}>
          No open artifacts
        </p>
        <p className="mt-1.5 text-[12px] leading-[1.5]" style={{ color: 'var(--muted-deep)' }}>
          Use <span className="mono">+</span> in the tab strip to bring this task's
          artifacts back into the workspace.
        </p>
      </div>
    </div>
  )
}

/* §23: ONE tab bar. The artefacts used to sit in a permanent row of buttons that
   looked like tabs directly above the actual tabs — so this is a quick-open
   menu instead. It opens things; the tab strip below navigates them. Locked
   entries stay listed, because knowing the diff exists and why it is not ready
   beats it silently missing. */
function QuickOpen({ pg, taskId, scenario, prdObject, onOpen }: {
  pg: PlaygroundState
  taskId: string | null
  scenario: Scenario | null
  prdObject?: ActiveObject | null
  onOpen: (tab: WorkspaceTab) => void
}) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null)
  const open = at !== null
  const root = useRef<HTMLDivElement>(null)
  useDismiss(open, root, useCallback(() => setAt(null), []))

  /* A PRD object offers only its own single tab; a task offers its artefacts. */
  const entries = prdObject
    ? [{ tab: prdTab(prdObject), legacy: 'evidence' as const, locked: false, hint: undefined }]
    : openableTabs(pg, taskId, scenario)

  return (
    <div ref={root} className="relative shrink-0">
      <button
        /* The tab strip clips its children, so the menu is portalled out and
           positioned from the button's rect rather than anchored to it. */
        onClick={(e) => {
          if (open) return setAt(null)
          const r = e.currentTarget.getBoundingClientRect()
          setAt({ x: Math.min(r.left, window.innerWidth - 248), y: r.bottom + 6 })
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-pressed={open}
        aria-label="Open an artifact"
        title="Open an artifact"
        className="icon-btn"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {at && createPortal(
        <div
          role="menu"
          /* Outside the dismiss root once portalled, so the menu stops its own
             mousedown reaching the document listener that would close it before
             the click lands on an item. */
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-50 w-[240px] overflow-hidden rounded-[10px] p-1 shadow-lg"
          style={{ left: at.x, top: at.y, background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}
        >
          {entries.map(({ tab, locked, hint }) => (
            <button
              key={tab.id}
              role="menuitem"
              disabled={locked}
              title={locked ? hint : undefined}
              onClick={() => { onOpen(tab); setAt(null) }}
              className="press flex w-full items-baseline gap-2 rounded-[7px] px-2 py-1.5 text-left text-[12px] hover:bg-[var(--glass)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:hover:bg-transparent"
              style={{ color: locked ? 'var(--muted-deep)' : 'var(--text-dim)' }}
            >
              <span className="truncate">{tab.label}</span>
              {locked && (
                <span className="ml-auto shrink-0 text-[10px]" style={{ color: 'var(--muted-deep)' }}>
                  Locked
                </span>
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
