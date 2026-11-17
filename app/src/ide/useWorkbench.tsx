/* The artifact router (Task 3). In the web app a beat's `showTab` or a chat
 * link opens a tab in AAVA's own canvas. In VS Code the canvas is borrowed:
 * the same requests open native editor tabs — a file, the diff editor, the
 * Integrated Browser, a markdown preview — and `ng serve` runs in a terminal.
 * See docs/surfaces-plan.md §1.3.
 *
 * The engine is untouched. This hook watches the two fields the reducer
 * already bumps for "open something": `playground.openRequest` (incremented by
 * showTab / SET_TAB / FOCUS_EVIDENCE) together with `playground.activeTab` and
 * `playground.activeFile`. A change of session (`activeTaskId`) clears the
 * editor area and the terminals.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { useJourney } from '../state/useJourney'
import type { Scenario, TabId } from '../state/types'
import type { EditorTab, TerminalSession, Workbench } from './types'
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

export function useWorkbench(j: Journey): Workbench {
  const [editor, setEditor] = useState<{ tabs: EditorTab[]; active: string | null }>({ tabs: [], active: null })
  const [terminals, setTerminals] = useState<TerminalSession[]>([])
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const scenario: Scenario | null = j.scenario ?? null

  const open = useCallback((tab: EditorTab) => {
    setEditor((e) => ({
      tabs: e.tabs.some((t) => t.id === tab.id) ? e.tabs : [...e.tabs, tab],
      active: tab.id,
    }))
  }, [])

  const focus = useCallback((id: string) => {
    setEditor((e) => (e.tabs.some((t) => t.id === id) ? { ...e, active: id } : e))
  }, [])

  /* Closing the active tab focuses its right neighbour, else its left one —
     what VS Code does. */
  const close = useCallback((id: string) => {
    setEditor((e) => {
      const at = e.tabs.findIndex((t) => t.id === id)
      if (at === -1) return e
      const tabs = e.tabs.filter((t) => t.id !== id)
      const active = e.active !== id ? e.active : (tabs[at] ?? tabs[at - 1])?.id ?? null
      return { tabs, active }
    })
  }, [])

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
        setTerminals((ts) => (ts.some((t) => t.id === SERVE_ID) ? ts : [...ts, SERVE]))
        setActiveTerminalId(SERVE_ID)
        setPanelOpen(true)
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
  const session = j.state.activeTaskId
  const seen = useRef({ session, req: pg.openRequest })
  const latest = useRef({ openCanvasTab, openFile })
  useEffect(() => { latest.current = { openCanvasTab, openFile } })

  useEffect(() => {
    const s = seen.current
    if (s.session !== session) {
      /* A different session (or home): its artifacts are not this one's. */
      seen.current = { session, req: pg.openRequest }
      setEditor({ tabs: [], active: null })
      setTerminals([])
      setActiveTerminalId(null)
      setPanelOpen(false)
      return
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
    tabs: editor.tabs,
    activeTabId: editor.active,
    open,
    focus,
    close,
    terminals,
    activeTerminalId,
    panelOpen,
    setPanelOpen,
    renderTab,
    openFile,
    openCanvasTab,
  }
}
