import { useEffect, useMemo, useState } from 'react'
import { IconMoon, IconSun } from './components/chrome/icons'
import { NotificationBell } from './components/chrome/NotificationBell'
import { Tooltip, TooltipProvider } from './components/chrome/Tooltip'
import { AnimatePresence, motion } from 'motion/react'
import { AmbientField } from './components/ambient/AmbientField'
import { Sidebar } from './components/chrome/Sidebar'
import { NavRail, type ListView } from './components/chrome/NavRail'
import { SessionList } from './components/home/SessionList'
import { HomeEmpty } from './components/home/HomeEmpty'
import { needsOf, sessionTasks } from './components/home/sessionGroups'
import { FLAGS } from './config/flags'
import { RunTimelineContext } from './state/runTimeline'
import { WorkspaceShell } from './components/layout/WorkspaceShell'

import { Composer, MODELS, type Connector, type Effort } from './components/chrome/Composer'
import { livePinnedGate } from './state/gates'
import { StartView } from './components/start/StartView'
import { ConversationView } from './components/chat/ConversationView'
import { TabWorkspace } from './components/playground/TabWorkspace'
import { insightChips } from './prd/insightFlow'
import { backlogChips } from './prd/backlogFlow'
import { INSIGHT_FILE, type InsightView } from './prd/insight'
import { type ReportView, REPORT_ASSETS, REPORT_ORDER } from './prd/report'
import { matchById } from './prd/agentFlow'
import { AgentGraph } from './prd/AgentGraph'
import { ReportGraph } from './prd/ReportGraph'
import { ScenarioGraph } from './components/playground/ScenarioGraph'
import type { SessionFile } from './state/workspace'
import type { BacklogDoc } from './prd/backlog'
import { FeedbackApp, previewTemplate, readTemplate } from './components/playground/FeedbackApp'
import { TasksView } from './components/tasks/TasksView'
import { Notifications } from './components/overlays/Notifications'
import { Search } from './components/overlays/Search'
import { Toast } from './components/overlays/Toast'
import { ReviseModal } from './components/overlays/ReviseModal'
import { useJourney } from './state/useJourney'
import { OpenUrlContext } from './state/openUrl'
import { webTitle } from './state/web'
import { useTheme } from './state/useTheme'
import { PROFILES, PROFILE_ORDER } from './data/user'

/* The two chips in the corner are the same object twice — one shape, one hit
   size — so they read as a pair rather than as two unrelated buttons. */
const CORNER_BTN = 'press hit-pad-sm relative grid h-[34px] w-[34px] place-items-center rounded-[9px] transition-colors hover:bg-[var(--wash-4)] hover:text-[var(--text-dim)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]'
const CORNER_STYLE = { color: 'var(--muted)', background: 'var(--glass)', border: '1px solid var(--glass-line)' }

export default function App() {
  const j = useJourney()
  const { theme, toggle: toggleTheme } = useTheme()
  const profile = PROFILES[j.state.profileId]
  /* The account switch cycles the profiles in order, so "the other profile" is
     simply the next one round the ring. */
  /* Every profile except the one signed in — the account menu lists them all. */
  const otherProfiles = PROFILE_ORDER.filter((id) => id !== j.state.profileId).map((id) => PROFILES[id])
  /* Raman's home stays empty until something he started needs him: it surfaces
     only active work (a PRD in flight, shown as "needs your input"), never
     completed work. Ajay's home is always empty — he builds from intent, there
     is no board of assigned work. Deepak keeps his full seeded board. */
  const homeTasks = j.state.profileId === 'raman'
    ? j.state.tasks.filter((t) => t.tag !== 'done')
    : j.state.tasks
  const homeSubtitle = homeTasks.length === 0
    ? j.state.profileId === 'ajay'
      ? 'Describe the agent or artifact you want, and I will find the golden match.'
      : 'What would you like to work on?'
    : j.state.profileId === 'raman'
      ? "Here's what's waiting on your input."
      : j.state.profileId === 'meera'
        ? "Here's what's waiting on your input."
        : 'I have worked on a couple of your tasks. Would you like to review these?'
  /* The draft lives here, above the arrangements. The composer renders inside
     whichever column it belongs to, so it remounts when the arrangement
     changes — holding the text here makes that remount invisible. */
  const [draft, setDraft] = useState('')
  /* Two-sidebar layout: which list the secondary sidebar shows, and whether it
     is showing at all (it can be tucked away for a wider session). */
  /* The first-time-user view is a lo-fi demo mode; Hoffman has one user. */
  const firstTime = false
  const [listView, setListView] = useState<ListView>('home')
  const [listOpen, setListOpen] = useState(true)
  const [vw, setVw] = useState(() => window.innerWidth)
  useEffect(() => {
    const on = () => setVw(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  const needsCount = needsOf(sessionTasks(homeTasks, firstTime)).length

  /* The header's execution-activity / files toggles, and a beat that moves the
     canvas, ask the workspace for a view — the graph opens as its own tab,
     "files" is the Overview, "doc" is the artifact the session is on. The
     counter makes asking twice for the same view ask twice. */
  const [canvasReq, setCanvasReq] = useState<{ view: 'doc' | 'files' | 'graph'; n: number }>({ view: 'doc', n: 0 })
  const askCanvas = (view: 'doc' | 'files' | 'graph') => setCanvasReq((r) => ({ view, n: r.n + 1 }))
  /* A Jira / GitHub / Figma link anywhere in the session opens its page as a
     browser tab in the canvas — never a new window, never a toast. */
  const [webReq, setWebReq] = useState<{ url: string; label: string; n: number }>({ url: '', label: '', n: 0 })
  const openUrl = useMemo(() => ({
    open: (url: string) => {
      setWebReq((r) => ({ url, label: webTitle(url, j.state.tasks), n: r.n + 1 }))
      j.setPanelOpen(true)
    },
    ticket: j.state.tasks.find((t) => t.id === j.state.activeTaskId)?.context.ticket,
    // `j` is rebuilt every render; only the active ticket changes what this returns.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }), [j.state.activeTaskId, j.state.tasks])
  /* Pending inline-comment changes — lifted here so the tray renders above the
     composer (in the conversation column) while comments are made in the canvas. */
  const [docChanges, setDocChanges] = useState<{ quote: string; note: string; range?: Range }[]>([])

  /* Every artefact the run has produced, newest first — the source for both the
     files modal and (via Open) the canvas. Read off the document cards in the
     thread, deduped by document, so it always matches what was generated. */
  const sessionFiles = useMemo<SessionFile[]>(() => {
    /* The analytics run produces dashboards, one view file each. */
    if (j.state.activeObject?.kind === 'insight') {
      const seen: InsightView[] = []
      for (const m of j.state.messages) {
        const v = m.block?.kind === 'document' ? m.block.insight : undefined
        if (v && !seen.includes(v)) seen.push(v)
      }
      return seen.reverse().map((insight, i) => ({ insight, name: INSIGHT_FILE[insight], when: clockAgo(i) }))
    }
    /* The triage-report run produces named .html / .pdf assets rather than
       backlog documents — list those, newest first, opening each report tab. */
    if (j.state.activeObject?.kind === 'report') {
      const seen: ReportView[] = []
      for (const m of j.state.messages) {
        const r = m.block?.kind === 'document' ? m.block.report : undefined
        if (r && !seen.includes(r)) seen.push(r)
      }
      return REPORT_ORDER.filter((v) => seen.includes(v)).reverse()
        .map((report, i) => ({ report, name: REPORT_ASSETS[report].file, when: clockAgo(i) }))
    }
    /* Keyed by file name so a doc shown twice (e.g. stories then its flagged
       revision, same stories.md) appears once — the latest wins, and Open reveals
       that version. */
    const seen = new Map<string, BacklogDoc>()
    for (const m of j.state.messages) {
      if (m.block?.kind === 'document' && m.block.doc) seen.set(m.block.name, m.block.doc)
    }
    const entries = [...seen.entries()].reverse()
    return entries.map(([name, doc], i) => ({ doc, name, when: clockAgo(i) }))
  }, [j.state.messages, j.state.activeObject?.kind])

  /* Switching docs drops any pending inline comments — they were about the doc
     you were on, and their highlight ranges belong to that document's DOM. */
  const openDoc = (doc: BacklogDoc) => { j.openObjectDoc(doc); setDocChanges([]) }
  const showFiles = () => { askCanvas('files'); j.setPanelOpen(true) }

  /* A beat asked the canvas to change view (open onto the Execution-activity graph,
     then swap to the artefact it produced). The nonce re-fires even when the same
     view is requested twice. */
  useEffect(() => {
    if (j.state.playground.canvasReq > 0) askCanvas(j.state.playground.canvasView)
  }, [j.state.playground.canvasReq, j.state.playground.canvasView])

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

  /* While a task is parked on a gate, typing asks about the session — the
     gate's own buttons are how the run moves on. No mode to pick. */
  const openGate = j.state.activeTaskId && !j.state.revisingId ? livePinnedGate(j.state.messages) : undefined
  const sendOrAsk = (text: string) => (openGate ? j.ask(text) : j.send(text))
  /* Chips are not typed text: an Ask follow-up is always a question, and every
     other chip is a run move whatever the mode. Ignored while AAVA is still
     playing, so two beats never interleave. */
  const onChip = (text: string) => {
    if (j.busy) return
    if (j.state.chipStage === 'ask' && openGate) j.ask(text)
    else j.send(text)
  }

  const composerFor = (joined = false) => (
    <Composer
      sessionNote={openGate ? "I'll answer from this session only. The task stays paused until you respond above." : undefined}
      onSend={(text) => { sendOrAsk(text); setFiles([]) }}
      value={draft} onChange={setDraft} joined={joined}
      model={model} onModel={setModel}
      effort={effort} onEffort={setEffort}
      connectors={connectors}
      onToggleConnector={(id) => setConnectors((cs) => cs.map((c) => (c.id === id ? { ...c, on: !c.on } : c)))}
      files={files}
      onAddFiles={(names) => setFiles((f) => [...new Set([...f, ...names])])}
      onRemoveFile={(name) => setFiles((f) => f.filter((x) => x !== name))}
      busy={j.busy} onStop={j.stop}
    />
  )

  /* Escape unwinds one layer at a time, cheapest first. Closing the workspace
     comes before leaving the task, because leaving the task throws the run
     away and Escape should not be able to do that by surprise. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      /* A layer that already answered this Escape (full screen, a modal) has
         spent it — the next layer waits for the next press. */
      if (e.key !== 'Escape' || e.defaultPrevented) return
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
  /* Ask follow-ups belong to the gate they were asked at — once it is
     answered they go too. */
  const stageChips = j.scenario && j.state.chipStage && !(j.state.chipStage === 'ask' && !livePinnedGate(j.state.messages))
    ? j.scenario.chips[j.state.chipStage] ?? []
    : []

  /* The insight run surfaces its next step as a suggestion chip — the next
     question pre-filled — derived from how far the investigation has got. */
  const objectChips = j.state.activeObject?.kind === 'insight'
    ? insightChips(j.state.messages)
    /* Raman's backlog run offers its two closing moves as plain pills once the
       run ends in a successful publish — not a HITL gate, nothing to answer. */
    : j.state.activeObject?.kind === 'backlog'
      ? backlogChips(j.state.messages)
      : []

  /* A chip you have already taken does not come back. Read off the thread's own
     user messages rather than a separate "used" list, so it costs no state and
     parking a thread carries the answered chips with it. */
  const asked = new Set(
    j.state.messages.filter((m) => m.from === 'user').map((m) => m.lines.join(' ')),
  )

  /* A follow-up question is spent once anything asked in this thread got the
     same scripted answer, whatever the wording ("why is this validation
     right?" retires "Why is the validation right?"). */
  const askEntries = j.scenario?.ask ?? []
  const answered = new Set(
    j.state.messages.filter((m) => m.from === 'user' && m.ask)
      .map((m) => askEntries.findIndex((a) => a.match.test(m.lines.join(' ')))),
  )
  const spent = (c: { sends: string; followup?: boolean }) =>
    asked.has(c.sends) || (!!c.followup && answered.has(askEntries.findIndex((a) => a.match.test(c.sends))))

  const chips = j.state.pendingTopic
    ? [{ label: 'Start a new thread', sends: 'alright' }]
    : [...stageChips, ...objectChips].filter((c) => !spent(c))

  const inTask = !!j.state.activeTaskId
    && (j.state.arrangement === 'conversation' || j.state.arrangement === 'split')
  /* An intent-opened Canvas object (a PRD) is a working session too — it takes
     the right panel, exactly as a task does. */
  const inObject = !!j.state.activeObject && j.state.arrangement === 'split'

  /* What the workspace is holding: a task, or an object — and, for the kinds
     that have one, the execution-activity graph the header's toggle opens. */
  const obj = !inTask && inObject ? j.state.activeObject : null
  const session = inTask
    ? {
        key: j.state.activeTaskId,
        object: null,
        processName: undefined,
        activity: j.scenario
          ? <ScenarioGraph steps={j.scenario.prep} at={j.state.playground.prepAt} waiting={!!taskProgress?.waiting}
              heading={j.scenario.capability} watch={j.state.watchLog} />
          : null,
      }
    : obj
      ? {
          key: `obj:${obj.taskId}`,
          object: obj,
          /* The golden artifact by name and version — until it is cloned, when
             it is the user's working copy (the builder renames it the same way). */
          processName: obj.kind === 'agent'
            ? (({ title, version }) => obj.agentCloned ? `${title} — My Copy` : `${title} ${version}`)(matchById(obj.activeArtifact))
            : undefined,
          activity: obj.kind === 'report'
            ? <ReportGraph messages={j.state.messages} watch={j.state.watchLog} />
            : obj.kind === 'insight' || obj.kind === 'agent'
              ? null
              : <AgentGraph messages={j.state.messages} watch={j.state.watchLog}
                  assignActive={j.state.backlogReady} upstreamDone={j.state.profileId === 'meera'} />,
        }
      : null

  /* Room for the four regions (nav, list, conversation, workspace). The panel
     library cannot honour minimums that add up to more than the window, so
     main's minimum is what is left once the nav and an open workspace have
     theirs — capped at list + a readable conversation. On a small window with
     the workspace open, the list steps aside; any nav item brings it back. */
  const sessionOpen = (inTask || inObject) && j.state.playground.panelOpen
  const navPx = j.state.sidebarOpen ? 268 : 70
  const showList = FLAGS.SESSION_LIST_LAYOUT && listOpen && !(sessionOpen && vw < 1100)
  const mainMinPx = showList
    ? Math.max(380, Math.min(296 + 400, vw - navPx - (sessionOpen ? 380 : 0) - 8))
    : 380

  return (
    <OpenUrlContext.Provider value={openUrl}>
    <TooltipProvider delayDuration={320} skipDelayDuration={140}>
      <AmbientField />
      {/* Landmarks for assistive tech and crawlers. The workspace itself is a
          full-bleed app shell with no visual header/footer bar — the nav's own
          brand mark and account row already carry that role on screen — so
          these are screen-reader-only, siblings of the shell (not nested inside
          its <nav>/<main>) so they register as real banner/contentinfo
          landmarks rather than being de-scoped to generic regions. */}
      <header className="sr-only">AAVA — AI workspace for product and engineering teams</header>
      <div className="relative z-10 h-full">
        <WorkspaceShell
          sidebarOpen={j.state.sidebarOpen}
          /* The nav stays on screen in the playground now — collapsed to its
             icon rail by default (opening a task/object sets sidebarOpen=false),
             not hidden behind a hover edge. So it is never an auto-hide drawer. */
          autoHideSidebar={false}
          mainMinPx={mainMinPx}
          rightOpen={j.state.playground.panelOpen}
          onSidebarOpenChange={j.setSidebarOpen}
          onRightOpenChange={j.setPanelOpen}
          sidebar={FLAGS.SESSION_LIST_LAYOUT ? (
            <NavRail
              open={j.state.sidebarOpen}
              onToggle={() => j.setSidebarOpen(!j.state.sidebarOpen)}
              view={listView}
              onView={(v) => { setListView(v); setListOpen(true) }}
              onNewChat={() => { j.goHome(); setListView('home'); setListOpen(true) }}
              onHome={() => { j.goHome(); setListView('home'); setListOpen(true) }}
              needsCount={needsCount}
              counts={{
                mytasks: firstTime ? 0 : 3 + 2 + 3 + 3,
                conversations: j.state.threads.filter((t) => t.kind === 'chat').length + (firstTime ? 0 : 2),
                completed: firstTime ? 0 : 3,
              }}
              profileName={profile.name}
              profileRole={profile.role}
              otherProfiles={otherProfiles}
              onSwitchTo={j.setProfile}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          ) : (
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
              otherProfiles={otherProfiles}
              onSwitchTo={j.setProfile}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}
          main={
            <div className="flex h-full min-h-0 w-full">
            {showList && (
              <SessionList
                view={listView}
                onView={setListView}
                tasks={homeTasks}
                threads={j.state.threads}
                firstTime={firstTime}
                activeTaskId={j.state.activeTaskId}
                activeThreadId={j.state.activeThreadId}
                onOpenTask={j.openTask}
                onOpenThread={(id) => { const th = j.state.threads.find((t) => t.id === id); if (th) j.openThread(th) }}
                onNewChat={() => { j.goHome(); setListView('home') }}
                onSample={(title) => j.toast(`“${title}” is sample data in this prototype. Open a task under Needs you to try a run.`)}
                onHide={() => setListOpen(false)}
              />
            )}
            <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto">
              {/* Theme switch and notification bell — the home screen only.
                  Inside a task the top-right corner belongs to the workspace,
                  and an inbox is a standing invitation to leave the thing you
                  just opened. The account menu keeps its own theme entry for
                  the screens this corner does not appear on. */}
              {j.state.arrangement === 'start' && (
                <div className="absolute right-4 top-4 z-[60] flex items-center gap-2">
                  <Tooltip label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} side="bottom" align="end">
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
                  </Tooltip>
                  <Tooltip label="Notifications" side="bottom" align="end">
                    <button
                      type="button"
                      aria-label="Notifications"
                      onClick={() => j.setOverlay(j.state.overlay === 'notifications' ? 'none' : 'notifications')}
                      className={CORNER_BTN}
                      style={CORNER_STYLE}
                    >
                      <NotificationBell count={j.unreadCount} />
                    </button>
                  </Tooltip>
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
                  FLAGS.SESSION_LIST_LAYOUT
                    ? <HomeEmpty key="start" name={profile.name} subtitle={homeSubtitle} composer={composerFor()} />
                    : <StartView key="start" name={profile.name} tasks={homeTasks} subtitle={homeSubtitle}
                    onOpenTask={j.openTask}
                    onViewAllTasks={j.showTasks}
                    composer={composerFor()} />
                )}
                {j.state.arrangement === 'tasks' && (
                  <TasksView key="tasks" tasks={j.state.tasks} onOpenTask={j.openTask} />
                )}
                {(j.state.arrangement === 'conversation' || j.state.arrangement === 'split') && (
                  <RunTimelineContext.Provider key="conversation" value={{
                    scenario: j.scenario, prepAt: j.state.playground.prepAt,
                    waiting: !!taskProgress?.waiting, preview, onOpenTab: j.setTab, onToast: j.toast,
                  }}>
                  <ConversationView
                    key="conversation"
                    state={j.state}
                    chips={chips}
                    taskProgress={taskProgress}
                    onOpenStep={j.focusEvidence}
                    preview={preview}
                    onChip={onChip}
                    onAccept={j.runBeat}
                    onDismiss={j.dismissBlock}
                    onOpenFile={j.openFile}
                    onOpenTab={j.setTab}
                    onOpenArtifact={(doc, insight, report) => (report ? j.openObjectReport(report) : insight ? j.openObjectInsight(insight) : doc ? openDoc(doc) : j.setPanelOpen(true))}
                    onOpenAgentArtifact={(id) => j.openObjectAgent(id)}
                    onOpenAgentDoc={j.openAgentDoc}
                    onRecordAnswer={j.recordAnswer}
                    onRevise={j.openReviseModal}
                    revisingId={j.state.revisingId}
                    onReviseSend={j.reviseSend}
                    onReviseCancel={j.cancelReviseEdit}
                    onToast={j.toast}
                    onToggleContext={j.toggleContext}
                    onTogglePanel={j.togglePanel}
                    onShowFiles={showFiles}
                    changes={docChanges}
                    onApplyChanges={() => { j.applyComments(docChanges); setDocChanges([]) }}
                    onDiscardChanges={() => setDocChanges([])}
                    onRemoveChange={(i) => setDocChanges((cs) => cs.filter((_, idx) => idx !== i))}
                    /* The progress dock now hangs from the header, so the
                       composer is always free-standing here. */
                    composer={composerFor()}
                  />
                  </RunTimelineContext.Provider>
                )}
              </AnimatePresence>
            </main>
            </div>
          }
          /* One workspace for every session — a task, a PRD, a backlog, an
             analytics or report run, an agent build. Mounted for the whole life
             of the session, not just while visible — collapsing the panel must
             not take the tab layout with it. */
          right={(inTask || inObject) ? (
            <TabWorkspace
              sessionKey={session?.key ?? null}
              pg={j.state.playground}
              scenario={session?.object ? null : j.scenario}
              taskId={j.state.activeTaskId}
              task={session?.object ? null : j.state.tasks.find((t) => t.id === j.state.activeTaskId) ?? null}
              object={session?.object ?? null}
              messages={j.state.messages}
              files={sessionFiles}
              processName={session?.processName}
              activity={session?.activity}
              canvasRequest={canvasReq}
              webRequest={webReq}
              changes={docChanges}
              onAddChange={(c) => setDocChanges((cs) => [...cs, c])}
              onSelectDoc={openDoc}
              onSelectInsight={j.openObjectInsight}
              onSelectReport={j.openObjectReport}
              onClone={j.cloneArtifact}
              watch={j.state.watchLog}
              theme={theme}
              active={j.state.playground.panelOpen}
              onCollapse={() => j.setPanelOpen(false)}
              onToast={j.toast}
              onFile={j.setFile}
              onEdit={j.editFile}
            />
          ) : undefined}
        />
      </div>
      <footer className="sr-only">AAVA</footer>

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
      {j.state.reviseModal && (
        <ReviseModal
          items={j.state.reviseModal.items}
          onOpenDoc={(doc) => openDoc(doc)}
          onConfirm={j.confirmReviseModal}
          onCancel={j.closeReviseModal}
          note={j.state.reviseModal.note}
          confirmLabel={j.state.reviseModal.confirmLabel}
        />
      )}
      <Toast text={j.state.toast} />
    </TooltipProvider>
    </OpenUrlContext.Provider>
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
