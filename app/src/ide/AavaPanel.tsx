/* The AAVA chat view — the extension's one webview, docked in VS Code's
   secondary sidebar (~380px). It replaces the web app's rail + centre column:
     header  → view-title bar: session title, New session, Session history,
               General / First time user switch (the Sidebar zone, folded in)
     home    → greeting + the first three tasks stacked, composer at the bottom
     history → a Quick-Pick-style list: search, PINNED, RECENTS
     session → collapsible Task context card, then the same ConversationView
               the web app uses, in its compact (narrow host) mode
   Same journey engine; only the placement changes (docs/surfaces-plan.md §1). */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import type { useJourney } from '../state/useJourney'
import type { Chip, EvidenceBlock, PrepStep, Scenario, TabId, Task, TaskContext, TaskTag, Thread } from '../state/types'
import { TAG_META, threadIdForTask } from '../state/reducer'
import { PROFILES } from '../data/user'
import { ConversationView } from '../components/chat/ConversationView'
import { IconChat, IconPinned, IconPlus, IconSearch, IconTasks } from '../components/chrome/icons'
import { useDismiss } from '../state/useDismiss'

type Journey = ReturnType<typeof useJourney>

interface Props {
  j: Journey
  composer: ReactNode
  chips: Chip[]
  taskProgress: { steps: PrepStep[]; at: number; waiting: boolean } | null
  preview: ReactNode
  onOpenFile: (file: string) => void
  onOpenTab: (tab: TabId) => void
}

/* Same ordering the web sidebar uses for never-opened tasks: whose turn first. */
const BY_TURN: Record<TaskTag, number> = { input: 0, blocked: 1, review: 2, working: 3, done: 4 }

/* VS Code view-title actions are 22px squares with a 16px glyph. */
const ACTION_BTN = 'grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[5px] transition-colors hover:bg-[var(--wash-4)] focus-visible:outline-1 focus-visible:outline-[var(--focus-ring)]'

export function AavaPanel({ j, composer, chips, taskProgress, preview, onOpenFile, onOpenTab }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const { state } = j
  const inSession = state.arrangement === 'conversation' || state.arrangement === 'split'
  const task = state.activeTaskId ? state.tasks.find((t) => t.id === state.activeTaskId) ?? null : null

  const sessionTitle = task?.title
    ?? state.activeObject?.title
    ?? state.threads.find((t) => t.id === state.activeThreadId)?.title
    ?? 'New session'

  const goHome = () => { setHistoryOpen(false); j.goHome() }

  /* A run-strip step opens its evidence in the Task context card — the IDE has
     no evidence tab (§1.3). `n` re-scrolls on a repeat click of the same step. */
  const [stepFocus, setStepFocus] = useState<{ taskId: string; key: string; n: number } | null>(null)
  const openStep = (key: string) => {
    if (task) setStepFocus((f) => ({ taskId: task.id, key, n: (f?.n ?? 0) + 1 }))
  }

  /* Escape closes the history list first — the cheapest layer. */
  useEffect(() => {
    if (!historyOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) { e.preventDefault(); setHistoryOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [historyOpen])

  return (
    <div className="flex h-full min-h-0 w-full flex-col" style={{ background: 'var(--slab)', color: 'var(--text)' }}>
      {/* ── View title bar ─────────────────────────────────────────── */}
      <div className="flex h-[35px] shrink-0 items-center gap-1 pl-2 pr-1.5"
        style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
        {inSession && !historyOpen ? (
          <>
            <button type="button" onClick={goHome} title="Back to AAVA home" aria-label="Back to AAVA home"
              className={ACTION_BTN} style={{ color: 'var(--muted)' }}>
              <Chevron dir="left" />
            </button>
            <h2 className="min-w-0 flex-1 truncate text-[12px] font-medium" title={sessionTitle}
              style={{ color: 'var(--text-dim)' }}>
              {sessionTitle}
            </h2>
          </>
        ) : (
          <h2 className="min-w-0 flex-1 truncate pl-1 text-[11px] font-semibold uppercase tracking-[.08em]"
            style={{ color: 'var(--text-dim)' }}>
            {historyOpen ? 'AAVA: Session history' : 'AAVA'}
          </h2>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <button type="button" onClick={goHome} title="New session" aria-label="New session"
            className={ACTION_BTN} style={{ color: 'var(--muted)' }}>
            <IconPlus size={16} />
          </button>
          <button type="button" onClick={() => setHistoryOpen((o) => !o)}
            title="Session history" aria-label="Session history" aria-pressed={historyOpen}
            className={ACTION_BTN}
            style={{
              color: historyOpen ? 'var(--text)' : 'var(--muted)',
              background: historyOpen ? 'var(--wash-4)' : undefined,
            }}>
            <IconClock />
          </button>
          <UserTypeMenu firstTime={state.firstTime} onChange={(on) => { setHistoryOpen(false); j.setFirstTime(on) }} />
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      {historyOpen ? (
        <HistoryList
          threads={state.threads}
          tasks={state.tasks}
          pinnedIds={state.pinnedThreadIds}
          activeThreadId={inSession ? state.activeThreadId : null}
          activeTaskId={inSession ? state.activeTaskId : null}
          onTogglePin={j.togglePinThread}
          onOpen={(t) => {
            setHistoryOpen(false)
            /* A real thread (chat or task) resumes through openThread; a
               stand-in row for a never-opened task opens the task. */
            if (state.threads.some((th) => th.id === t.id)) j.openThread(t)
            else if (t.taskId) j.openTask(t.taskId)
          }}
        />
      ) : inSession ? (
        <>
          {task && (
            <TaskContextCard key={task.id} ctx={task.context} scenario={j.scenario ?? null}
              focus={stepFocus?.taskId === task.id ? stepFocus : null}
              onClearFocus={() => setStepFocus(null)} />
          )}
          <div className="flex min-h-0 flex-1 flex-col">
            <ConversationView
              compact
              state={state}
              chips={chips}
              taskProgress={taskProgress}
              onOpenStep={openStep}
              preview={preview}
              onChip={j.send}
              onAccept={j.runBeat}
              onDismiss={j.dismissBlock}
              onOpenFile={onOpenFile}
              onOpenTab={onOpenTab}
              /* Borrowed canvas: a generic artifact card opens the code in the
                 host editor; the web-only object kinds keep their reducer path. */
              onOpenArtifact={(doc, insight, report) => (
                report ? j.openObjectReport(report)
                  : insight ? j.openObjectInsight(insight)
                    : doc ? j.openObjectDoc(doc)
                      : onOpenTab('code')
              )}
              onOpenAgentArtifact={(id) => j.openObjectAgent(id)}
              onOpenAgentDoc={j.openAgentDoc}
              onRecordAnswer={j.recordAnswer}
              onRevise={j.openReviseModal}
              revisingId={state.revisingId}
              onReviseSend={j.reviseSend}
              onReviseCancel={j.cancelReviseEdit}
              onToast={j.toast}
              /* No canvas to toggle, no graph (dropped in the IDE, §1.3);
                 "files" is the host editor. Header is hidden in compact mode. */
              onToggleContext={() => {}}
              onTogglePanel={() => {}}
              onShowGraph={() => {}}
              onShowFiles={() => onOpenTab('code')}
              composer={composer}
            />
          </div>
        </>
      ) : (
        <Home j={j} onOpenTask={(id) => j.openTask(id)} composer={composer} />
      )}
    </div>
  )
}

/* ── Home ──────────────────────────────────────────────────────────────── */

function Home({ j, onOpenTask, composer }: { j: Journey; onOpenTask: (id: string) => void; composer: ReactNode }) {
  const name = PROFILES[j.state.profileId].name
  const tasks = j.state.tasks.slice(0, 3)
  const empty = j.state.firstTime || tasks.length === 0

  return (
    <>
      <div className={`min-h-0 flex-1 overflow-y-auto px-3 ${empty ? 'flex flex-col justify-center' : 'pt-5'}`}>
        <div className={empty ? 'px-2 pb-10 text-center' : 'px-0.5'}>
          <h1 className="text-[17px] font-semibold leading-[1.3] tracking-[-.01em]" style={{ color: 'var(--text)' }}>
            Good evening, {name}
          </h1>
          <p className="mt-1.5 text-[12.5px] leading-[1.45]" style={{ color: 'var(--muted)' }}>
            {empty
              ? "I'm AAVA. Tell me what you'd like to build, and I'll take it from there."
              : 'I have worked on a couple of your tasks. Would you like to review these?'}
          </p>
        </div>

        {!empty && (
          <div className="mt-4 grid gap-2 pb-4">
            {tasks.map((t) => <HomeCard key={t.id} task={t} onOpen={onOpenTask} />)}
          </div>
        )}
      </div>
      <div className="shrink-0 px-3 pb-3">{composer}</div>
    </>
  )
}

function HomeCard({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const tag = TAG_META[task.tag]
  return (
    <button type="button" onClick={() => onOpen(task.id)}
      className="press w-full rounded-[var(--r-md)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--card-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
      style={{ background: 'var(--card)', border: '1px solid var(--glass-line)' }}>
      <span className="block text-[13px] font-semibold leading-[1.35]" style={{ color: 'var(--text)' }}>
        {task.title}
      </span>
      <span className="mt-2 flex items-center gap-2">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full py-[3px] pl-1.5 pr-2 text-[10.5px] font-semibold leading-none"
          style={{ background: tag.bg, color: tag.fg }}>
          <span className="h-[5px] w-[5px] rounded-full" style={{ background: 'currentColor' }} />
          {tag.label}
        </span>
      </span>
      <span className="mt-1.5 block text-[11.5px] leading-[1.45]" style={{ color: 'var(--muted)' }}>
        {task.note}
      </span>
    </button>
  )
}

/* ── Session history (Quick Pick style) ────────────────────────────────── */

function HistoryList({ threads, tasks, pinnedIds, activeThreadId, activeTaskId, onTogglePin, onOpen }: {
  threads: Thread[]
  tasks: Task[]
  pinnedIds: string[]
  activeThreadId: string | null
  activeTaskId: string | null
  onTogglePin: (threadId: string) => void
  onOpen: (t: Thread) => void
}) {
  const [query, setQuery] = useState('')
  /* The highlight follows a row, not a position — pinning moves the row
     between groups and the highlight goes with it. */
  const [cursorId, setCursorId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const optionId = (t: Thread) => `${listId}-opt-${t.id}`
  useEffect(() => { inputRef.current?.focus() }, [])

  /* Exactly the web sidebar's list: the thread timeline, then a stand-in row
     for every task never opened, ordered by whose turn it is. */
  const { pinned, recents } = useMemo(() => {
    const unopened: Thread[] = tasks
      .filter((t) => !threads.some((th) => th.id === threadIdForTask(t.id)))
      .sort((a, b) => BY_TURN[a.tag] - BY_TURN[b.tag])
      .map((t) => ({ id: threadIdForTask(t.id), kind: 'task', taskId: t.id, title: t.title, when: TAG_META[t.tag].label }))
    const q = query.trim().toLowerCase()
    const all = [...threads, ...unopened].filter((t) => !q || t.title.toLowerCase().includes(q))
    return {
      pinned: all.filter((t) => pinnedIds.includes(t.id)),
      recents: all.filter((t) => !pinnedIds.includes(t.id)),
    }
  }, [threads, tasks, pinnedIds, query])

  const flat = [...pinned, ...recents]
  const at = Math.max(0, flat.findIndex((t) => t.id === cursorId))
  const current = flat[at]

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); const t = flat[Math.min(at + 1, flat.length - 1)]; if (t) setCursorId(t.id) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const t = flat[Math.max(at - 1, 0)]; if (t) setCursorId(t.id) }
    else if (e.key === 'Enter' && current) { e.preventDefault(); onOpen(current) }
  }

  const isActive = (t: Thread) => (t.taskId ? t.taskId === activeTaskId : t.id === activeThreadId)
  const row = (t: Thread, i: number) => (
    <HistoryRow key={t.id} id={optionId(t)} thread={t} pinned={pinnedIds.includes(t.id)} focused={i === at}
      active={isActive(t)} onOpen={onOpen} onTogglePin={onTogglePin} onHover={() => setCursorId(t.id)} />
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 p-2">
        <label className="flex h-[26px] items-center gap-1.5 rounded-[3px] px-2"
          style={{ background: 'var(--card)', border: '1px solid var(--focus-ring)' }}>
          <span style={{ color: 'var(--muted)' }}><IconSearch size={13} /></span>
          <input ref={inputRef} value={query} onKeyDown={onKeyDown}
            onChange={(e) => { setQuery(e.target.value); setCursorId(null) }}
            placeholder="Search sessions" aria-label="Search sessions"
            role="combobox" aria-expanded aria-autocomplete="list"
            aria-controls={listId} aria-activedescendant={current ? optionId(current) : undefined}
            className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-[var(--muted-deep)]"
            style={{ color: 'var(--text)' }} />
        </label>
      </div>

      <div id={listId} role="listbox" aria-label="Sessions" className="min-h-0 flex-1 overflow-y-auto pb-2">
        <GroupHeader label="Pinned" />
        {pinned.length === 0
          ? <EmptyRow>{query ? 'No matches' : 'Nothing pinned yet'}</EmptyRow>
          : pinned.map((t, i) => row(t, i))}
        <GroupHeader label="Recents" />
        {recents.length === 0
          ? <EmptyRow>{query ? 'No matches' : 'No sessions yet'}</EmptyRow>
          : recents.map((t, i) => row(t, pinned.length + i))}
      </div>
    </div>
  )
}

/* A Quick Pick separator: a hairline with the group label on its right. */
function GroupHeader({ label }: { label: string }) {
  return (
    <div className="mt-1 flex items-center gap-2 px-3 pb-0.5 pt-2" role="presentation">
      <span className="h-px flex-1" style={{ background: 'var(--glass-line-soft)' }} />
      <span className="text-[10px] font-semibold uppercase tracking-[.1em]" style={{ color: 'var(--muted-deep)' }}>
        {label}
      </span>
    </div>
  )
}

function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="px-3 py-1.5 text-[12px]" style={{ color: 'var(--muted-deep)' }}>{children}</p>
}

function HistoryRow({ id, thread, pinned, focused, active, onOpen, onTogglePin, onHover }: {
  id: string
  thread: Thread
  pinned: boolean
  focused: boolean
  active: boolean
  onOpen: (t: Thread) => void
  onTogglePin: (id: string) => void
  onHover: () => void
}) {
  return (
    <div className="group relative flex items-center" onMouseEnter={onHover}
      style={{ background: focused ? 'var(--wash-4)' : undefined }}>
      <button type="button" id={id} role="option" aria-selected={focused} onClick={() => onOpen(thread)}
        className="flex h-[24px] min-w-0 flex-1 items-center gap-2 pl-3 pr-1 text-left">
        <span className="shrink-0" style={{ color: 'var(--muted)' }} aria-hidden>
          {thread.kind === 'task' ? <IconTasks size={14} /> : <IconChat size={14} />}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12.5px]"
          style={{ color: 'var(--text)', fontWeight: active ? 600 : 400 }}>
          {thread.title}
        </span>
        <span className="max-w-[40%] shrink-0 truncate text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>
          {active ? 'current' : thread.when}
        </span>
      </button>
      {/* Fixed slot so descriptions line up whether or not the pin is showing. */}
      <span className="grid w-[28px] shrink-0 place-items-center">
        <button type="button" onClick={() => onTogglePin(thread.id)}
          title={pinned ? 'Unpin' : 'Pin'}
          aria-label={pinned ? `Unpin ${thread.title}` : `Pin ${thread.title}`}
          aria-pressed={pinned}
          className={`${ACTION_BTN} focus-visible:opacity-100 ${pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          style={{ color: pinned ? 'var(--text)' : 'var(--muted)' }}>
          <IconPinned size={13} filled={pinned} />
        </button>
      </span>
    </div>
  )
}

/* ── Task context (the web Overview tab, kept in the panel — §1.3) ─────── */

function TaskContextCard({ ctx, scenario, focus, onClearFocus }: {
  ctx: TaskContext
  scenario: Scenario | null
  /** A run-strip step whose evidence to show; opening one expands the card. */
  focus: { key: string; n: number } | null
  onClearFocus: () => void
}) {
  const [open, setOpen] = useState(false)
  const met = ctx.criteria.filter((c) => c.met).length
  const step = focus ? scenario?.prep.find((p) => p.key === focus.key) ?? null : null
  const expanded = open || !!step
  const toggle = () => {
    if (expanded) { setOpen(false); onClearFocus() } else setOpen(true)
  }

  const stepRef = useRef<HTMLElement>(null)
  const n = step ? focus?.n : undefined
  useEffect(() => {
    if (n === undefined) return
    stepRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'nearest',
    })
  }, [n])

  return (
    <div className="shrink-0" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
      <button type="button" onClick={toggle} aria-expanded={expanded}
        className="flex h-[26px] w-full items-center gap-1.5 pl-1.5 pr-3 text-left hover:bg-[var(--wash-2)]">
        <span style={{ color: 'var(--muted)' }}><Chevron dir={expanded ? 'down' : 'right'} /></span>
        <span className="text-[11px] font-semibold uppercase tracking-[.08em]" style={{ color: 'var(--text-dim)' }}>
          Task context
        </span>
        <span className="mono ml-auto truncate text-[11px]" style={{ color: 'var(--muted)' }}>
          {ctx.ticket} · {met}/{ctx.criteria.length} criteria
        </span>
      </button>

      {expanded && (
        <div className="max-h-[42vh] overflow-y-auto px-3 pb-3 pt-1 text-[12px] leading-[1.45]">
          {step && (
            <StepEvidence key={step.key} ref={stepRef} step={step}
              block={scenario?.evidence[step.key]} onClose={onClearFocus} />
          )}
          <div className="flex items-baseline gap-2">
            <span className="mono text-[11.5px] font-semibold" style={{ color: 'var(--text)' }}>{ctx.ticket}</span>
            <span className="truncate text-[11px]" style={{ color: 'var(--muted)' }}>{ctx.ticketSource}</span>
          </div>
          <p className="mt-1.5" style={{ color: 'var(--text-dim)' }}>{ctx.description}</p>

          <CtxLabel>Acceptance criteria · {met} of {ctx.criteria.length} met</CtxLabel>
          <ul className="grid gap-1">
            {ctx.criteria.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="mono w-3 shrink-0 text-center" aria-label={c.met ? 'Met' : 'Not met'}
                  style={{ color: c.met ? 'var(--text)' : 'var(--muted-deep)' }}>
                  {c.met ? '✓' : '○'}
                </span>
                <span className="min-w-0">
                  <span style={{ color: c.met ? 'var(--text-dim)' : 'var(--text)' }}>{c.text}</span>
                  {!c.met && c.note && (
                    <span className="block text-[11px]" style={{ color: 'var(--muted)' }}>{c.note}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {!!ctx.connected?.length && (
            <>
              <CtxLabel>Connected sources</CtxLabel>
              <ul className="grid gap-1">
                {ctx.connected.map((c, i) => (
                  <li key={i} className="flex items-baseline gap-2">
                    <span className="mono w-3 shrink-0 text-center text-[10px]" style={{ color: 'var(--muted-deep)' }}>·</span>
                    <span className="min-w-0 truncate"
                      style={{ color: c.denied ? 'var(--muted-deep)' : 'var(--text-dim)', textDecoration: c.denied ? 'line-through' : undefined }}>
                      {c.label}
                    </span>
                    <span className="ml-auto shrink-0 text-[11px]" style={{ color: 'var(--muted)' }}>
                      {c.denied ? 'denied' : c.source}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* One run step's evidence — the web Evidence tab's card for that step, in the
   panel's black-and-white wireframe style. */
function StepEvidence({ ref, step, block, onClose }: {
  ref: React.Ref<HTMLElement>
  step: PrepStep
  block: EvidenceBlock | undefined
  onClose: () => void
}) {
  return (
    <section ref={ref} aria-label={`Evidence: ${step.label}`} className="mb-2 mt-1 rounded-[3px] px-2.5 pb-2.5 pt-1.5"
      style={{ background: 'var(--wash-1)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>
          Step evidence
        </h3>
        <button type="button" onClick={onClose} aria-label="Close step evidence" title="Close"
          className={`${ACTION_BTN} ml-auto`} style={{ color: 'var(--muted)' }}>
          <span aria-hidden className="text-[13px] leading-none">×</span>
        </button>
      </div>
      <p className="text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>{step.label}</p>
      {step.result && <p className="mono text-[11px]" style={{ color: 'var(--muted)' }}>{step.result}</p>}
      {step.detail && <p className="mt-1" style={{ color: 'var(--text-dim)' }}>{step.detail}</p>}

      {block && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="min-w-0 truncate text-[12px] font-semibold" style={{ color: 'var(--text)' }}>{block.name}</span>
            <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>
              {block.source}
            </span>
          </div>
          {block.body.kind === 'kv' && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11.5px]">
              {block.body.pairs.map(([k, v], i) => (
                <div key={`${k}-${i}`} className="contents">
                  <dt style={{ color: 'var(--muted-deep)' }}>{k}</dt>
                  <dd className="mono m-0 min-w-0 break-words" style={{ color: 'var(--text-dim)' }}>{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {block.body.kind === 'text' && <p style={{ color: 'var(--muted)' }}>{block.body.text}</p>}
          {block.body.kind === 'columns' && (
            <>
              <p className="mb-1.5" style={{ color: 'var(--muted)' }}>{block.body.lead}</p>
              <div className="grid grid-cols-2 gap-3 text-[11.5px]">
                {([['Found', block.body.found], ['Missing', block.body.missing]] as const).map(([label, items]) => (
                  <div key={label}>
                    <h4 className="mb-0.5 text-[9.5px] uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>{label}</h4>
                    <ul className="mono grid gap-0.5" style={{ color: 'var(--text-dim)' }}>
                      {items.map((c) => <li key={c}>{c}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
          {block.body.kind === 'figma' && (
            <figure>
              <div aria-hidden className="grid h-[96px] place-items-center rounded-[3px] text-[11px]"
                style={{ border: '1px dashed var(--border)', color: 'var(--muted-deep)' }}>
                Figma frame
              </div>
              <figcaption className="mt-1 text-[11px]" style={{ color: 'var(--muted-deep)' }}>{block.body.caption}</figcaption>
            </figure>
          )}
        </div>
      )}
    </section>
  )
}

function CtxLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>
      {children}
    </h3>
  )
}

/* ── User type switch (compact) ────────────────────────────────────────── */

/* The web UserTypeSwitch is a 34px pill whose menu centres under it — at the
   right edge of a 380px panel it would overflow the window. Same two options,
   same onChange, sized for a view-title bar and opening right-aligned. */
const USER_TYPES = [
  { firstTime: false, short: 'General', label: 'General user' },
  { firstTime: true, short: 'First time', label: 'First time user' },
] as const

function UserTypeMenu({ firstTime, onChange }: { firstTime: boolean; onChange: (firstTime: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(open, root, useCallback(() => setOpen(false), []))
  const current = USER_TYPES.find((o) => o.firstTime === firstTime) ?? USER_TYPES[0]

  return (
    <div ref={root} className="relative ml-1">
      <button type="button" onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox" aria-expanded={open}
        aria-label={`User type: ${current.label}`} title="Switch user type (demo)"
        className="flex h-[22px] items-center gap-1 rounded-[5px] px-1.5 text-[11.5px] transition-colors hover:bg-[var(--wash-4)]"
        style={{ color: 'var(--text-dim)', border: '1px solid var(--glass-line)' }}>
        {current.short}
        <Chevron dir="down" size={11} />
      </button>
      {open && (
        <div role="listbox" aria-label="User type"
          className="absolute right-0 top-[calc(100%+4px)] z-[70] w-[160px] rounded-[5px] p-1"
          style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)', boxShadow: 'var(--shadow-pop)' }}>
          {USER_TYPES.map((o) => {
            const selected = o.firstTime === firstTime
            return (
              <button key={o.label} type="button" role="option" aria-selected={selected}
                onClick={() => { setOpen(false); onChange(o.firstTime) }}
                className="flex w-full items-center justify-between rounded-[3px] px-2 py-1 text-left text-[12px] hover:bg-[var(--wash-4)]"
                style={{ color: selected ? 'var(--text)' : 'var(--text-dim)', fontWeight: selected ? 600 : 400 }}>
                {o.label}
                {selected && <span aria-hidden>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Glyphs ────────────────────────────────────────────────────────────── */

function Chevron({ dir, size = 14 }: { dir: 'left' | 'right' | 'down'; size?: number }) {
  const rotate = dir === 'left' ? 90 : dir === 'right' ? -90 : 0
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
    </svg>
  )
}
