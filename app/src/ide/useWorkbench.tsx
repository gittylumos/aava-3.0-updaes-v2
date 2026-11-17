/* The artifact router (Task 3). In the web app a beat's `showTab` or a chat
 * link opens a tab in AAVA's own canvas. In VS Code the canvas is borrowed:
 * the same requests open native editor tabs — a file, the diff editor, the
 * Integrated Browser, a markdown preview — and `ng serve` runs in a terminal.
 * See docs/surfaces-plan.md §1.3.
 *
 * The engine is untouched. This hook watches the two fields the reducer
 * already bumps for "open something": `playground.openRequest` (incremented by
 * showTab / SET_TAB / FOCUS_EVIDENCE) together with `playground.activeTab` and
 * `playground.activeFile`. Each session (sessionKeyOf) keeps its own editor
 * area and terminals: leaving one parks them, resuming it restores them, and a
 * brand-new session starts empty.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { useJourney } from '../state/useJourney'
import type { Scenario, TabId } from '../state/types'
import type { EditorTab, TerminalSession, Workbench } from './types'
import { sessionKeyOf } from './session'
import { CodeTab } from './tabs/CodeTab'
import { DiffTab } from './tabs/DiffTab'
import { diffFileFor } from './tabs/diffData'
import { BrowserTab } from './tabs/BrowserTab'
import { MarkdownTab } from './tabs/MarkdownTab'

type Journey = ReturnType<typeof useJourney>

const SERVE_ID = 'term:ng-serve'
const SERVE: TerminalSession = {
  id: SERVE_ID,
  title: 'AAVA · feedback-form',
  lines: [
    '$ ng serve',
    '✔ Browser application bundle generation complete.',
    '',
    '  ➜  Local:   http://localhost:4200/',
    '',
    '✔ Compiled successfully.',
  ],
}

const codeTab = (file: string): EditorTab => ({ id: `code:${file}`, kind: 'code', title: file, file })

interface Area {
  tabs: EditorTab[]
  activeTabId: string | null
  terminals: TerminalSession[]
  activeTerminalId: string | null
  panelOpen: boolean
}

const EMPTY: Area = { tabs: [], activeTabId: null, terminals: [], activeTerminalId: null, panelOpen: false }

/* A fresh session's playground starts from the reducer's emptyPlayground,
   whose openRequest is 0 — anything above it was asked for in this session. */
const FRESH_REQ = 0

export function useWorkbench(j: Journey): Workbench {
  const [area, setArea] = useState<Area>(EMPTY)

  const scenario: Scenario | null = j.scenario ?? null

  const open = useCallback((tab: EditorTab) => {
    setArea((a) => ({
      ...a,
      tabs: a.tabs.some((t) => t.id === tab.id) ? a.tabs : [...a.tabs, tab],
      activeTabId: tab.id,
    }))
  }, [])

  const focus = useCallback((id: string) => {
    setArea((a) => (a.tabs.some((t) => t.id === id) ? { ...a, activeTabId: id } : a))
  }, [])

  /* Closing the active tab focuses its right neighbour, else its left one —
     what VS Code does. */
  const close = useCallback((id: string) => {
    setArea((a) => {
      const at = a.tabs.findIndex((t) => t.id === id)
      if (at === -1) return a
      const tabs = a.tabs.filter((t) => t.id !== id)
      const activeTabId = a.activeTabId !== id ? a.activeTabId : (tabs[at] ?? tabs[at - 1])?.id ?? null
      return { ...a, tabs, activeTabId }
    })
  }, [])

  const setPanelOpen = useCallback((panelOpen: boolean) => setArea((a) => ({ ...a, panelOpen })), [])

  const openFile = useCallback((file: string) => open(codeTab(file)), [open])

  const openCanvasTab = useCallback((tab: TabId) => {
    if (!scenario) return
    switch (tab) {
      case 'code': {
        const first = scenario.fileOrder[0]
        if (first) open(codeTab(first))
        return
      }
      case 'diff': {
        const file = diffFileFor(scenario)
        if (file) open({ id: `diff:${file}`, kind: 'diff', title: `${file} ↔ AAVA changes`, file })
        return
      }
      case 'preview':
        /* The app runs in the user's own terminal; its localhost link is what
           opens the Integrated Browser. */
        setArea((a) => ({
          ...a,
          terminals: a.terminals.some((t) => t.id === SERVE_ID) ? a.terminals : [...a.terminals, SERVE],
          activeTerminalId: SERVE_ID,
          panelOpen: true,
        }))
        open({ id: 'browser:4200', kind: 'browser', title: 'localhost:4200', url: 'http://localhost:4200/feedback' })
        return
      case 'tests':
        open({ id: 'md:validation', kind: 'markdown', title: 'Validation results.md', doc: 'validation' })
        return
      case 'evidence':
        /* Evidence lives in the AAVA panel, under each run step. */
        return
    }
  }, [scenario, open])

  /* ── Sync with the engine ── */
  const pg = j.state.playground
  const session = sessionKeyOf(j.state)
  const seen = useRef({ session, req: pg.openRequest })
  /* Parked areas, with the last request each one handled. */
  const parked = useRef(new Map<string, { area: Area; req: number }>())
  const latest = useRef({ openCanvasTab, openFile, area })
  useEffect(() => { latest.current = { openCanvasTab, openFile, area } })

  useEffect(() => {
    const s = seen.current
    if (s.session !== session) {
      if (s.session) parked.current.set(s.session, { area: latest.current.area, req: s.req })
      const back = session ? parked.current.get(session) : undefined
      s.session = session
      /* Resumed: the restored playground is the one that was parked, so its
         openRequest is the one already handled — put its area back as it was.
         Anything else (a new session, or one whose run started over) starts
         empty, and a request made in the same render still opens below. */
      if (back && back.req === pg.openRequest) {
        s.req = back.req
        setArea(back.area)
        return
      }
      s.req = FRESH_REQ
      setArea(EMPTY)
    }
    if (pg.openRequest === s.req) return
    s.req = pg.openRequest
    if (pg.activeTab === 'code' && pg.activeFile) latest.current.openFile(pg.activeFile)
    else latest.current.openCanvasTab(pg.activeTab)
  }, [session, pg.openRequest, pg.activeTab, pg.activeFile])

  const renderTab = (tab: EditorTab) => {
    if (!scenario) return null
    switch (tab.kind) {
      case 'code':
        return tab.file ? <CodeTab key={tab.id} j={j} scenario={scenario} file={tab.file} /> : null
      case 'diff':
        return tab.file ? <DiffTab key={tab.id} j={j} scenario={scenario} file={tab.file} /> : null
      case 'browser':
        return <BrowserTab key={tab.id} j={j} scenario={scenario} url={tab.url ?? 'http://localhost:4200/'} />
      case 'markdown':
        return <MarkdownTab key={tab.id} scenario={scenario} prepAt={pg.prepAt} />
      case 'welcome':
      default:
        return null
    }
  }

  return {
    tabs: area.tabs,
    activeTabId: area.activeTabId,
    open,
    focus,
    close,
    terminals: area.terminals,
    activeTerminalId: area.activeTerminalId,
    panelOpen: area.panelOpen,
    setPanelOpen,
    renderTab,
    openFile,
    openCanvasTab,
  }
}
