import { useEffect, useMemo, useState } from 'react'
import { IconBell, IconMoon, IconSun } from './components/chrome/icons'
import { AnimatePresence, motion } from 'motion/react'
import { AmbientField } from './components/ambient/AmbientField'
import { Sidebar } from './components/chrome/Sidebar'
import { WorkspaceShell } from './components/layout/WorkspaceShell'

import { Composer, MODELS, type Connector, type Effort } from './components/chrome/Composer'
import { StartView } from './components/start/StartView'
import { ConversationView } from './components/chat/ConversationView'
import { TabWorkspace } from './components/playground/TabWorkspace'
import { DocumentCanvas } from './prd/DocumentCanvas'
import { InsightCanvas } from './prd/InsightCanvas'
import { insightChips } from './prd/insightFlow'
import type { InsightView } from './prd/insight'
import { AgentGraph } from './prd/AgentGraph'
import { ScenarioGraph } from './components/playground/ScenarioGraph'
import { ScenarioFiles } from './components/playground/ScenarioFiles'
import { FilesPanel, type SessionFile } from './prd/FilesPanel'
import type { BacklogDoc } from './prd/backlog'
import { FeedbackApp, previewTemplate, readTemplate } from './components/playground/FeedbackApp'
import { TasksView } from './components/tasks/TasksView'
import { Notifications } from './components/overlays/Notifications'
import { Search } from './components/overlays/Search'
import { Toast } from './components/overlays/Toast'
import { useJourney } from './state/useJourney'
import { useTheme } from './state/useTheme'
import { PROFILES } from './data/user'

/* The two chips in the corner are the same object twice — one shape, one hit
   size — so they read as a pair rather than as two unrelated buttons. */
const CORNER_BTN = 'press relative grid h-[34px] w-[34px] place-items-center rounded-[9px] transition-colors hover:bg-[var(--wash-4)] hover:text-[var(--text-dim)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]'
const CORNER_STYLE = { color: 'var(--muted)', background: 'var(--glass)', border: '1px solid var(--glass-line)' }

export default function App() {
  const j = useJourney()
  const { theme, toggle: toggleTheme } = useTheme()
  const profile = PROFILES[j.state.profileId]
  const otherProfile = PROFILES[j.state.profileId === 'deepak' ? 'raman' : 'deepak']
  /* Raman's home stays empty until something he started needs him: it surfaces
     only active work (a PRD in flight, shown as "needs your input"), never
     completed work. Deepak keeps his full seeded board. */
  const homeTasks = j.state.profileId === 'raman'
    ? j.state.tasks.filter((t) => t.tag !== 'done')
    : j.state.tasks
  const homeSubtitle = homeTasks.length === 0
    ? 'What would you like to work on?'
    : j.state.profileId === 'raman'
      ? "Here's what's waiting on your input."
      : 'I have worked on a couple of your tasks. Would you like to review these?'
  /* The draft lives here, above the arrangements. The composer renders inside
     whichever column it belongs to, so it remounts when the arrangement
     changes — holding the text here makes that remount invisible. */
  const [draft, setDraft] = useState('')

  /* The right canvas shows one of three things: the active document, the session
     files list, or the agent-workflow topology. Held here above the arrangements. */
  const [canvasMode, setCanvasMode] = useState<'doc' | 'files' | 'graph'>('doc')
  /* Pending inline-comment changes — lifted here so the tray renders above the
     composer (in the conversation column) while comments are made in the canvas. */
  const [docChanges, setDocChanges] = useState<{ quote: string; note: string; range?: Range }[]>([])

  /* Every artefact the run has produced, newest first — the source for both the
     files modal and (via Open) the canvas. Read off the document cards in the
     thread, deduped by document, so it always matches what was generated. */
  const sessionFiles = useMemo<SessionFile[]>(() => {
    /* Keyed by file name so a doc shown twice (e.g. stories then its flagged
       revision, same stories.md) appears once — the latest wins, and Open reveals
       that version. */
    const seen = new Map<string, BacklogDoc>()
    for (const m of j.state.messages) {
      if (m.block?.kind === 'document' && m.block.doc) seen.set(m.block.name, m.block.doc)
    }
    const entries = [...seen.entries()].reverse()
    return entries.map(([name, doc], i) => ({ doc, name, when: clockAgo(i) }))
  }, [j.state.messages])

  /* Switching docs drops any pending inline comments — they were about the doc
     you were on, and their highlight ranges belong to that document's DOM. */
  const openDoc = (doc: BacklogDoc) => { setCanvasMode('doc'); j.openObjectDoc(doc); setDocChanges([]) }
  const showGraph = () => { setCanvasMode('graph'); j.setPanelOpen(true) }
  const showFiles = () => { setCanvasMode('files'); j.setPanelOpen(true) }

  /* A fresh session starts on its default canvas — the workspace/document — not
     whatever graph/files view the last session was left on. */
  useEffect(() => { setCanvasMode('doc') }, [j.state.activeTaskId, j.state.activeObject?.taskId])

  /* Prompt-bar settings live here, above the composer, so they survive the
     composer's remount when the arrangement changes — the same reason the draft
     does. Cosmetic for now; the selectors do not yet drive behaviour. */
  const [model, setModel] = useState<string>(MODELS[0])
  const [effort, setEffort] = useState<Effort>('High')
  const [files, setFiles] = useState<string[]>([])
  const [connectors, setConnectors] = useState<Connector[]>([
    { id: 'jira', name: 'Jira', hue: '#2684FF', on: true },
    { id: 'github', name: 'GitHub', hue: '#8B949E', on: true },
    { id: 'figma', name: 'Figma', hue: '#F24E1E', on: false },
    { id: 'slack', name: 'Slack', hue: '#E01E5A', on: false },
    { id: 'confluence', name: 'Confluence', hue: '#1868DB', on: false },
  ])

  const composerFor = (joined = false) => (
    <Composer
      onSend={(text) => { j.send(text); setFiles([]) }}
      value={draft} onChange={setDraft} joined={joined}
      model={model} onModel={setModel}
      effort={effort} onEffort={setEffort}
      connectors={connectors}
      onToggleConnector={(id) => setConnectors((cs) => cs.map((c) => (c.id === id ? { ...c, on: !c.on } : c)))}
      files={files}
      onAddFiles={(names) => setFiles((f) => [...new Set([...f, ...names])])}
      onRemoveFile={(name) => setFiles((f) => f.filter((x) => x !== name))}
    />
  )

  /* Escape unwinds one layer at a time, cheapest first. Closing the workspace
     comes before leaving the task, because leaving the task throws the run
     away and Escape should not be able to do that by surprise. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (j.state.overlay !== 'none') { j.setOverlay('none'); return }
      if (j.state.arrangement === 'tasks') { j.closeTasks(); return }
      if ((j.state.activeTaskId || j.state.activeObject) && j.state.playground.panelOpen) { j.setPanelOpen(false); return }
      if (j.state.arrangement === 'split') j.closePlayground()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    /* `j` is a new object every render, so depending on it would resubscribe on
       every keystroke. Every value the handler READS is listed instead. */
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [j.state.overlay, j.state.arrangement, j.state.activeTaskId, j.state.activeObject, j.state.playground.panelOpen])

  /* Scenario run progress — the same hanging status dock as the backlog flow
     (RunStrip), driven by the scenario's prep steps. `waiting` (amber, pulsing)
     when the current step is a gate the run is parked on; otherwise blue. */
  const taskProgress = j.scenario
    ? { steps: j.scenario.prep, at: j.state.playground.prepAt, waiting: !!j.scenario.prep[j.state.playground.prepAt]?.gate }
    : null

  /* The generated-app card shows the running app rather than a picture of it.
     Built here because this is where the scenario and the playground state meet;
     the card itself only places it. Inert, so it never needs a toast. */
  const preview = j.scenario
    ? <FeedbackApp template={readTemplate(previewTemplate(j.scenario, j.state.playground))} onToast={() => {}} />
    : null

  /* An offered new thread replaces the task chips — it is the only thing worth
     answering while the question is parked. */
  const stageChips = j.scenario && j.state.chipStage
    ? j.scenario.chips[j.state.chipStage] ?? []
    : []

  /* The insight run surfaces its next step as a suggestion chip — the next
     question pre-filled — derived from how far the investigation has got. */
  const objectChips = j.state.activeObject?.kind === 'insight'
    ? insightChips(j.state.messages)
    : []

  /* A chip you have already taken does not come back. Read off the thread's own
     user messages rather than a separate "used" list, so it costs no state and
     parking a thread carries the answered chips with it. */
  const asked = new Set(
    j.state.messages.filter((m) => m.from === 'user').map((m) => m.lines.join(' ')),
  )

  const chips = j.state.pendingTopic
    ? [{ label: 'Start a new thread', sends: 'alright' }]
    : [...stageChips, ...objectChips].filter((c) => !asked.has(c.sends))

  const inTask = !!j.state.activeTaskId
    && (j.state.arrangement === 'conversation' || j.state.arrangement === 'split')
  /* An intent-opened Canvas object (a PRD) is a working session too — it takes
     the right panel, exactly as a task does. */
  const inObject = !!j.state.activeObject && j.state.arrangement === 'split'

  return (
    <>
      <AmbientField />
      <div className="relative z-10 h-full">
        <WorkspaceShell
          sidebarOpen={j.state.sidebarOpen}
          /* The nav stays on screen in the playground now — collapsed to its
             icon rail by default (opening a task/object sets sidebarOpen=false),
             not hidden behind a hover edge. So it is never an auto-hide drawer. */
          autoHideSidebar={false}
          rightOpen={j.state.playground.panelOpen}
          onSidebarOpenChange={j.setSidebarOpen}
          onRightOpenChange={j.setPanelOpen}
          sidebar={
            <Sidebar
              /* Follows the collapse state directly now: expanded when open,
                 icon rail when not. In the playground it opens collapsed. */
              open={j.state.sidebarOpen}
              threads={j.state.threads}
              tasks={j.state.tasks}
              pinnedIds={j.state.pinnedThreadIds}
              activeThreadId={j.state.activeThreadId}
              activeTaskId={j.state.activeTaskId}
              searchActive={j.state.overlay === 'search'}
              tasksActive={j.state.arrangement === 'tasks'}
              onHome={j.goHome}
              onNewChat={j.goHome}
              onMyTasks={j.showTasks}
              onSearch={() => j.setOverlay('search')}
              onToggle={() => j.setSidebarOpen(!j.state.sidebarOpen)}
              onTogglePin={j.togglePinThread}
              onOpenThread={j.openThread}
              onOpenTask={j.openTask}
              profile={profile}
              otherProfile={otherProfile}
              onSwitchProfile={j.switchProfile}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          }
          main={
            <main className="relative min-h-0 flex-1 overflow-y-auto">
              {/* Theme switch and notification bell — the home screen only.
                  Inside a task the top-right corner belongs to the workspace,
                  and an inbox is a standing invitation to leave the thing you
                  just opened. The account menu keeps its own theme entry for
                  the screens this corner does not appear on. */}
              {j.state.arrangement === 'start' && (
                <div className="absolute right-4 top-4 z-[60] flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    onClick={toggleTheme}
                    className={CORNER_BTN}
                    style={CORNER_STYLE}
                  >
                    {/* Contextual icon transition — sun/moon cross-fade with
                        scale + blur rather than a hard swap. */}
                    <span className="relative grid h-[15px] w-[15px] place-items-center">
                      <AnimatePresence initial={false} mode="popLayout">
                        <motion.span
                          key={theme}
                          className="absolute inset-0 grid place-items-center"
                          initial={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
                          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                          exit={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
                          transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                        >
                          {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Notifications"
                    onClick={() => j.setOverlay(j.state.overlay === 'notifications' ? 'none' : 'notifications')}
                    className={CORNER_BTN}
                    style={CORNER_STYLE}
                  >
                    <IconBell size={15} />
                    {!!j.unreadCount && (
                      <span
                        aria-hidden="true"
                        className="absolute right-[6px] top-[6px] h-[6px] w-[6px] rounded-full"
                        style={{ background: 'var(--danger)', boxShadow: '0 0 0 2px var(--slab)' }}
                      />
                    )}
                  </button>
                </div>
              )}

              {/* popLayout, not wait: a streamed reply re-renders mid-exit, and
                  under mode="wait" that could stall the exit so the conversation
                  never mounted. popLayout pops the outgoing view from flow and
                  lets the incoming one mount immediately. */}
              {/* initial={false} keeps the enter animation off the very first
                  render — the app shouldn't animate itself in on load; only
                  subsequent arrangement switches should transition. */}
              <AnimatePresence mode="popLayout" initial={false}>
                {j.state.arrangement === 'start' && (
                  <StartView key="start" name={profile.name} tasks={homeTasks} subtitle={homeSubtitle}
                    onOpenTask={j.openTask}
                    onViewAllTasks={j.showTasks}
                    composer={composerFor()} />
                )}
                {j.state.arrangement === 'tasks' && (
                  <TasksView key="tasks" tasks={j.state.tasks} onOpenTask={j.openTask} />
                )}
                {(j.state.arrangement === 'conversation' || j.state.arrangement === 'split') && (
                  <ConversationView
                    key="conversation"
                    state={j.state}
                    chips={chips}
                    taskProgress={taskProgress}
                    onOpenStep={j.focusEvidence}
                    preview={preview}
                    onChip={j.send}
                    onAccept={j.runBeat}
                    onDismiss={j.dismissBlock}
                    onOpenFile={j.openFile}
                    onOpenTab={j.setTab}
                    onOpenArtifact={(doc, insight) => (insight ? j.openObjectInsight(insight) : doc ? openDoc(doc) : j.setPanelOpen(true))}
                    onRecordAnswer={j.recordAnswer}
                    onToggleContext={j.toggleContext}
                    onTogglePanel={j.togglePanel}
                    onShowFiles={showFiles}
                    onShowGraph={showGraph}
                    changes={docChanges}
                    onApplyChanges={() => { j.applyComments(docChanges); setDocChanges([]) }}
                    onDiscardChanges={() => setDocChanges([])}
                    onRemoveChange={(i) => setDocChanges((cs) => cs.filter((_, idx) => idx !== i))}
                    /* The progress dock now hangs from the header, so the
                       composer is always free-standing here. */
                    composer={composerFor()}
                  />
                )}
              </AnimatePresence>
            </main>
          }
          /* Mounted for the whole life of the task, not just while visible —
             collapsing the panel must not take the tab layout with it. */
          right={inTask ? (
            /* TabWorkspace stays mounted for the whole task; the Execution-activity
               graph and the session files list overlay it (an opaque layer) so
               the tab layout survives switching to them and back. */
            <div className="relative h-full min-h-0">
              <TabWorkspace
                pg={j.state.playground}
                scenario={j.scenario}
                taskId={j.state.activeTaskId}
                watch={j.state.watchLog}
                theme={theme}
                active={j.state.playground.panelOpen}
                onCollapse={() => j.setPanelOpen(false)}
                onToast={j.toast}
                onFile={j.setFile}
                onEdit={j.editFile}
              />
              {canvasMode === 'graph' && j.scenario && (
                <div className="absolute inset-0 z-10" style={{ background: 'var(--ground)' }}>
                  <ScenarioGraph
                    steps={j.scenario.prep}
                    at={j.state.playground.prepAt}
                    waiting={!!taskProgress?.waiting}
                    heading={j.scenario.capability}
                    watch={j.state.watchLog}
                    onCollapse={() => setCanvasMode('doc')}
                  />
                </div>
              )}
              {canvasMode === 'files' && j.scenario && (
                <div className="absolute inset-0 z-10" style={{ background: 'var(--ground)' }}>
                  <ScenarioFiles
                    root={j.scenario.fileRoot}
                    files={j.scenario.fileOrder}
                    activeFile={j.state.playground.activeFile}
                    watch={j.state.watchLog}
                    onOpen={(name) => { setCanvasMode('doc'); j.setFile(name); j.setTab('code') }}
                    onCollapse={() => setCanvasMode('doc')}
                  />
                </div>
              )}
            </div>
          ) : inObject && j.state.activeObject?.kind === 'insight' ? (
            /* A Product-Analytics run renders its own evidence dashboards rather
               than the document canvas or the topology — five views the run
               advances through and the toolbar switches between. */
            j.state.activeObject?.docReady ? (
              <InsightCanvas
                object={j.state.activeObject}
                watch={j.state.watchLog}
                onCollapse={() => j.setPanelOpen(false)}
                onSelectView={(v: InsightView) => { setCanvasMode('doc'); j.openObjectInsight(v) }}
                onToast={j.toast}
              />
            ) : undefined
          ) : inObject && canvasMode === 'graph' ? (
            /* The agent-workflow topology — shown in place of the document when
               the workflow icon is pressed. Closing it returns to the document
               if one is ready, otherwise folds the panel away. */
            <AgentGraph
              messages={j.state.messages}
              watch={j.state.watchLog}
              onCollapse={() => { setCanvasMode('doc'); if (!j.state.activeObject?.docReady) j.setPanelOpen(false) }}
            />
          ) : inObject && canvasMode === 'files' ? (
            /* The session files list, in the panel (not a modal). Picking a file
               opens it in the document canvas. */
            <FilesPanel
              files={sessionFiles}
              watch={j.state.watchLog}
              activeDoc={j.state.activeObject?.activeDoc}
              onOpen={openDoc}
              onCollapse={() => { setCanvasMode('doc'); if (!j.state.activeObject?.docReady) j.setPanelOpen(false) }}
            />
          ) : inObject && j.state.activeObject?.docReady ? (
            /* A document object opens in the document canvas (Preview/Code +
               Share/Expand/Download/History/Close), Watch docked beneath. The
               panel only mounts once a document is ready — so the intake/thinking
               steps run against the conversation alone first. */
            <DocumentCanvas
              object={j.state.activeObject}
              watch={j.state.watchLog}
              onToast={j.toast}
              onCollapse={() => j.setPanelOpen(false)}
              files={sessionFiles}
              onSelectDoc={openDoc}
              onAddChange={(c) => setDocChanges((cs) => [...cs, c])}
              changes={docChanges}
            />
          ) : undefined}
        />
      </div>

      <Notifications
        open={j.state.overlay === 'notifications'}
        items={j.notifications}
        onClose={() => j.setOverlay('none')}
        onOpen={(item) => {
          j.readNotification(item.openTaskId)
          j.setOverlay('none')
          j.openTask(item.openTaskId)
        }}
      />
      <Search
        open={j.state.overlay === 'search'}
        hits={j.searchHits}
        onClose={() => j.setOverlay('none')}
        onSelect={(hit) => {
          j.setOverlay('none')
          if (hit.taskId) j.openTask(hit.taskId)
          else if (hit.thread) j.openThread(hit.thread)
        }}
      />
      <Toast text={j.state.toast} />
    </>
  )
}

/* Synthetic clock times for the files list — newest first, counting back from a
   fixed base. There is no real clock in the prototype; this keeps the list
   reading like the reference (a time per file) without inventing a source. */
function clockAgo(i: number): string {
  const base = 14 * 60 + 12 // 14:12
  const t = Math.max(0, base - i * 3)
  const h = Math.floor(t / 60)
  const m = t % 60
  return `${h}:${String(m).padStart(2, '0')}`
}
