import type { Action, Arrangement, AppState, Effect, PlaygroundState, PrepStep, Task, TaskTag, Thread, ThreadSnapshot } from './types'
import { hasPreview } from './workspace'
import { DEFAULT_PROFILE } from '../data/user'

/* The board task that mirrors a PRD object. Created when the PRD opens, so a
   PRD parked at a gate shows on the home screen exactly like a scripted task,
   and the card reopens the parked thread. */
export function prdBoardTask(id: string, title: string, subject: string): Task {
  return {
    id, title,
    // "Needs your input" from the start: an in-flight PRD is a thing waiting on
    // Raman, so it reads that way on his home the whole time it is active.
    status: 'clarify', tag: 'input',
    est: '—', dep: 'PRD', note: 'Reviewing your PRD…', updated: 'Just now',
    opening: [],
    context: {
      ticket: 'PRD', ticketSource: 'AAVA · PRD',
      description: `Draft a PRD for ${subject}, decompose it into epics and user stories, and publish to Jira.`,
      criteria: [],
      run: { agent: 'PRD Composer', golden: false },
    },
  }
}

/** Where a scenario's run stands when you open it: its first unfinished step,
 *  or past the end when there is nothing left to do. */
export const prepStart = (prep: PrepStep[]) => {
  const i = prep.findIndex((s) => s.pending)
  return i === -1 ? prep.length : i
}

export const TASKS: Task[] = [
  {
    id: 'T1', title: 'Add product feedback form',
    status: 'clarify', tag: 'review', est: '2 hrs', dep: 'None', recommended: true,
    note: 'Completed development of UI screen.', updated: '8 min ago',
    opening: [
      'Analyzed the task.',
      'Below are the sequence of steps to achieve the task. Let me get going.',
    ],
    context: {
      ticket: 'MOB-2841', ticketSource: 'Jira · Sprint 34',
      description:
        'Add a feedback form to the mobile app so users can rate a session 1–5 and leave a comment. ' +
        'Reuse the PLAY component library where possible and post to the existing feedback endpoint.',
      criteria: [
        { text: 'Rating scale of 1–5, starting unselected', met: true },
        { text: 'Comment field capped at 500 characters, with a live counter', met: true },
        { text: 'Success and error states after submit', met: true },
        { text: 'Anonymous submission', met: false,
          note: 'No field for it in the API contract. Blocked on the platform team.' },
      ],
      capabilities: ['PLAY component library', 'Angular scaffolding', 'API contract binding', 'Karma spec generation', 'Contrast audit'],
      related: [
        { id: 'PLAY-412', title: 'FormField + CharacterCounter into the library' },
        { id: 'MOB-2790', title: 'Feedback endpoint contract' },
      ],
      connected: [
        { kind: 'file',   label: 'src/app/feedback/', source: 'Repo' },
        { kind: 'design', label: 'Feedback Form v3', source: 'Figma' },
        { kind: 'api',    label: 'POST /api/v1/feedback', source: 'OpenAPI' },
        { kind: 'git',    label: 'feat/MOB-2841-feedback-form', source: 'GitHub' },
      ],
      run: { agent: 'Frontend Feature Agent', golden: true, certified: '2026-06-12', accepts: 47,
             branch: 'feat/MOB-2841-feedback-form', tokens: '184k', cost: '$1.42' },
    },
  },
  {
    id: 'T7', title: 'Migrate the refunds API to the v2 schema',
    status: 'clarify', tag: 'input', est: '6 hrs', dep: 'Payments platform',
    note: 'Validator passed. Parked at step 4 of 10 — your approval.', updated: '12 min ago',
    opening: [
      'The Validator agent has finished. Nothing has been applied to any service yet.',
      'I am parked at step 4 — the mapping needs your approval before I touch the services.',
    ],
    context: {
      ticket: 'PAY-3120', ticketSource: 'Jira · Sprint 34',
      description:
        'Migrate the refunds API from the v1 to the v2 refund schema across payments-api, ledger-service ' +
        'and refund-worker. Two human gates: the field mapping before anything is applied, and a sign-off ' +
        'before the canary reaches staging.',
      criteria: [
        { text: 'Every v1 refund field mapped to a v2 field or explicitly dropped', met: true },
        { text: 'Validator agent passes contract conformance', met: true,
          note: '18 checks passed. Two warnings logged for your review.' },
        { text: 'All three consumers migrated with contract tests green', met: false,
          note: 'Blocked on the step 4 approval — nothing is applied until you approve.' },
        { text: 'Canary verified against live consumer traffic', met: false,
          note: 'Behind the step 7 sign-off gate.' },
      ],
      capabilities: ['Schema mapping', 'Contract conformance validation', 'Consumer contract tests', 'Canary release'],
      related: [
        { id: 'PAY-3044', title: 'Refund v2 schema · RFC' },
        { id: 'LED-881', title: 'Ledger refund reconciliation' },
      ],
      connected: [
        { kind: 'file', label: 'src/payments/refunds/', source: 'Repo' },
        { kind: 'api',  label: 'POST /api/v2/refunds', source: 'OpenAPI' },
        { kind: 'api',  label: 'refund.settled · v2 event', source: 'Schema registry' },
        { kind: 'git',  label: 'feat/PAY-3120-refund-v2', source: 'GitHub' },
      ],
      run: { agent: 'Payments Migration Agent', golden: true, certified: '2026-07-04', accepts: 18,
             branch: 'feat/PAY-3120-refund-v2', tokens: '212k', cost: '$1.86',
             halted: 'Parked at the step 4 review gate — nothing applies until you approve.' },
    },
  },
  {
    id: 'T2', title: 'Modify the progress bar behavior',
    status: 'clarify', tag: 'input', est: '1.5 hrs', dep: 'Product',
    note: 'Clarifications needed on the trigger logic.', updated: '25 min ago',
    opening: [
      'The visual side is done — the bar now holds an indeterminate state while the total size is unknown.',
      'What I will not guess at is when it should appear at all: every request, or only ones past some threshold. The ticket says "long-running" without a number. Want me to draft the question?',
    ],
    context: {
      ticket: 'MOB-2907', ticketSource: 'Jira · Sprint 34',
      description:
        'Change how the upload progress bar behaves: when it appears, how it reports work of unknown ' +
        'length, and what it does when an upload fails and retries.',
      criteria: [
        { text: 'Indeterminate state while total size is unknown', met: true },
        { text: 'Bar animates to 100% before it dismisses', met: true },
        { text: 'Trigger rule: which operations show a bar', met: false,
          note: 'The ticket says "long-running" without defining a threshold.' },
        { text: 'Behaviour on retry after a failed upload', met: false,
          note: 'Depends on the trigger rule above.' },
      ],
      capabilities: ['PLAY component library', 'Angular scaffolding'],
      related: [{ id: 'PLAY-388', title: 'ProgressBar component spec' }],
      connected: [
        { kind: 'file',   label: 'src/app/shared/progress-bar/', source: 'Repo' },
        { kind: 'design', label: 'Progress states v2', source: 'Figma' },
      ],
      run: { agent: 'Frontend Feature Agent', golden: true, certified: '2026-06-12', accepts: 47,
             tokens: '27k', cost: '$0.21',
             halted: 'Paused before the trigger rule — two open questions.' },
    },
  },
  {
    id: 'T3', title: 'Reduce the page load time for the ‘Careers’ website landing page.',
    status: 'clarify', tag: 'blocked', est: '3 hrs', dep: 'Repo access',
    note: 'No repo access', updated: '1 hr ago',
    opening: [
      'I have the target from the ticket — LCP under 2.5 seconds on a 4G connection — and that is as far as I got.',
      'My credentials do not reach the careers site repo, so I cannot run a baseline audit or see what is blocking the render. Grant read access and I will pick it straight back up.',
    ],
    context: {
      ticket: 'WEB-455', ticketSource: 'Jira · Sprint 34',
      description:
        'Bring the Careers landing page under a 2.5s LCP on 4G — cut render-blocking CSS and fonts, ' +
        'serve the hero image responsively, and lazy-load everything below the fold.',
      criteria: [
        { text: 'Target and budget agreed: LCP under 2.5s on 4G', met: true },
        { text: 'Baseline Lighthouse run captured', met: false,
          note: 'Cannot read the careers repo.' },
        { text: 'Render-blocking CSS and fonts removed', met: false },
        { text: 'Hero image served responsively, below-fold media deferred', met: false },
      ],
      capabilities: ['Performance audit'],
      related: [{ id: 'WEB-430', title: 'Careers site redesign — handover' }],
      connected: [
        { kind: 'design', label: 'Careers landing — v4', source: 'Figma' },
        { kind: 'git',    label: 'acme/careers-site', source: 'Denied', denied: true },
      ],
      run: { agent: 'Web Performance Agent', golden: true, certified: '2026-05-08', accepts: 9,
             tokens: '14k', cost: '$0.11',
             halted: 'Stopped before the audit — read access refused, so nothing was measured.' },
    },
  },
  {
    id: 'T4', title: 'Add telemetry functionality',
    status: 'wip', tag: 'working', est: '4 hrs', dep: 'None',
    note: 'Instrumenting endpoints. Roughly half done.', updated: '3 hrs ago',
    opening: [
      'Still working on this one. Seven of twelve endpoints are instrumented and reporting.',
      'Nothing needs you yet — I will surface it the moment it does.',
    ],
    context: {
      ticket: 'OBS-640', ticketSource: 'Jira · Sprint 34',
      description:
        'Instrument the public API with request-level telemetry — latency, status class and tenant — ' +
        'and ship it to the existing collector.',
      criteria: [
        { text: 'Latency and status recorded on every endpoint', met: false,
          note: '7 of 12 done, still running.' },
        { text: 'Tenant dimension attached to each span', met: true },
        { text: 'Dashboards updated with the new series', met: false },
      ],
      capabilities: ['OpenTelemetry binding', 'Endpoint discovery'],
      related: [],
      connected: [
        { kind: 'file', label: 'src/telemetry/', source: 'Repo' },
        { kind: 'api',  label: 'otel-collector.internal', source: 'Collector' },
        { kind: 'git',  label: 'feat/OBS-640-telemetry', source: 'GitHub' },
      ],
      run: { agent: 'Observability Agent', golden: true, certified: '2026-06-02', accepts: 24,
             branch: 'feat/OBS-640-telemetry', tokens: '61k', cost: '$0.47' },
    },
  },
  {
    id: 'T5', title: 'Deprecate the legacy artifact store',
    status: 'done', tag: 'done', est: '—', dep: 'None',
    note: 'Merged Thursday. No regressions since.', updated: 'Thursday',
    opening: [
      'This one is closed. The store was drained, the read path was cut over, and the old service is off.',
    ],
    context: {
      ticket: 'INF-712', ticketSource: 'Jira · Sprint 33',
      description: 'Drain the legacy artifact store, cut the read path over to the new service, and decommission it.',
      criteria: [
        { text: 'All artifacts migrated and checksummed', met: true },
        { text: 'Read path cut over with no downtime', met: true },
        { text: 'Legacy service decommissioned', met: true },
      ],
      capabilities: ['Storage migration', 'Traffic cutover'],
      connected: [{ kind: 'git', label: 'PR #1284 · merged', source: 'GitHub' }],
      run: { agent: 'Platform Agent', golden: true, certified: '2026-05-18', accepts: 71,
             branch: 'chore/INF-712-drain-store', tokens: '96k', cost: '$0.74' },
    },
  },
  {
    id: 'T6', title: 'Write the Experience Studio migration runbook',
    status: 'done', tag: 'done', est: '—', dep: 'None',
    note: 'Approved and published to the team wiki.', updated: 'Last week',
    opening: [
      'Done and published. The runbook covers the cutover, the rollback path and the on-call checklist.',
    ],
    context: {
      ticket: 'DOC-233', ticketSource: 'Confluence',
      description: 'Write the Experience Studio migration runbook: cutover steps, rollback path and the on-call checklist.',
      criteria: [
        { text: 'Cutover steps with owners and timings', met: true },
        { text: 'Rollback path tested in staging', met: true },
        { text: 'Reviewed and published', met: true },
      ],
      capabilities: ['Runbook drafting'],
      connected: [{ kind: 'file', label: 'Experience Studio · Migration runbook', source: 'Confluence' }],
      run: { agent: 'Product Doc Agent', golden: true, certified: '2026-05-22', accepts: 31,
             tokens: '44k', cost: '$0.33' },
    },
  },
]

/* The five card states. `status` decides which board column a task lands in
   (whose turn is it); TAG says precisely why. Three tasks can all be waiting on
   you for three entirely different reasons, and the tag is what distinguishes
   "I finished, review it" from "I am stuck and cannot proceed". */
export const TAG_META: Record<TaskTag, { label: string; fg: string; bg: string }> = {
  review:  { label: 'Ready for review', fg: 'var(--ok)',      bg: 'var(--ok-surface)' },
  input:   { label: 'Needs your input', fg: 'var(--warn)',    bg: 'var(--warn-surface)' },
  blocked: { label: 'Blocked',          fg: 'var(--danger)',  bg: 'var(--danger-surface)' },
  working: { label: 'Working',          fg: 'var(--done)',    bg: 'var(--done-surface)' },
  done:    { label: 'Completed',        fg: 'var(--muted)',   bg: 'var(--wash-3)' },
}

/** A task's thread id is derived, not looked up — the sidebar can pin a task
 *  that has never been opened, and OPEN_TASK has to land on that same row. */
export const threadIdForTask = (taskId: string) => `th-${taskId.toLowerCase()}`

/** The board's columns. The sidebar lists tasks flat — a 268px column is too
 *  narrow for three headers to earn their space. */
export const TASK_COLUMNS: { key: Task['status']; name: string }[] = [
  { key: 'wip',     name: 'Working in the background' },
  { key: 'clarify', name: 'Need your inputs' },
  { key: 'done',    name: 'Completed' },
]

const emptyPlayground: PlaygroundState = {
  taskId: null,
  /* The running app is what a task opens onto. This is read on mount, before any
     beat has run, so anything else here is a tab nobody asked for sitting to the
     left of the one they did. */
  activeTab: 'preview',
  enabledTabs: ['preview', 'evidence', 'code', 'tests', 'diff'],
  runState: { kind: 'prep', label: 'Prep ready' },
  focusedEvidence: null,
  fileVersions: {},
  edits: {},
  activeFile: null,
  prepAt: 0,
  diffBadge: null,
  contextOpen: false,
  panelOpen: true,
  openRequest: 0,
}

export const initialState: AppState = {
  arrangement: 'start',
  profileId: DEFAULT_PROFILE,
  activeTaskId: null,
  activeObject: null,
  watchLog: [],
  tasks: TASKS,
  parkedTasks: [],
  messages: [],
  threads: [
    { id: 'th-sprint-scope', kind: 'chat', title: 'Sprint scope questions', when: 'Yesterday' },
    { id: 'th-t4', kind: 'task', taskId: 'T4', title: 'Add telemetry functionality', when: '2 days ago' },
  ],
  playground: emptyPlayground,
  toast: null,
  overlay: 'none',
  // The two finished tasks are old news; the four live ones have not been read.
  readNotifications: ['T5', 'T6'],
  chipStage: null,
  sidebarOpen: true,
  pinnedThreadIds: ['th-t4'],
  activeThreadId: null,
  stashed: {},
  pendingTopic: null,
}

/* The board is somewhere you look, not somewhere a thread lives. Whether you
   park a thread or close the board, the answer to "where do I come back to?" is
   the same one, derived from what the thread actually has. */
export const behindTheBoard = (s: AppState): Arrangement =>
  s.arrangement !== 'tasks' ? s.arrangement
    : s.activeTaskId || s.activeObject ? 'split'
    : s.messages.length > 0 ? 'conversation'
    : 'start'

/* Leaving cancels whatever the thread had in flight, so what gets parked has to
   be a resting state: a typing dot with no answer coming would be parked that
   way forever. */
export const snapshot = (state: AppState): ThreadSnapshot => ({
  arrangement: behindTheBoard(state),
  activeTaskId: state.activeTaskId,
  activeObject: state.activeObject,
  messages: state.messages.filter((m) => !m.typing),
  playground: state.playground,
  watchLog: state.watchLog,
  chipStage: state.chipStage,
})

let seq = 0
const nextId = () => `m${++seq}`
/** Test-only: keeps message ids deterministic across test cases. */
export const __resetIds = () => { seq = 0 }

export function applyEffect(state: AppState, effect: Effect): AppState {
  const pg = state.playground

  switch (effect.type) {
    case 'wait':
      return state

    /* The run moved. Steps behind it tick, the step itself becomes where you
       are — one number, so the list can never disagree with itself.
       Forward only: a beat replayed from further up the transcript must never
       un-tick work that has already happened. */
    case 'prepAt':
      return { ...state, playground: { ...pg, prepAt: Math.max(pg.prepAt, effect.index) } }

    case 'say': {
      const trailing = state.messages.at(-1)
      const said = {
        id: trailing?.typing ? trailing.id : nextId(),
        from: 'aava' as const,
        lines: effect.lines,
        block: effect.block,
        typing: false,
        live: true,
        stream: effect.stream !== false,
      }
      const base = trailing?.typing ? state.messages.slice(0, -1) : state.messages
      /* One live decision at a time, and it is the newest one. A gate that
         re-asks further down the thread must retire the copy above it —
         otherwise a scrolled-up button re-runs work that already ran. */
      const gate = said.block?.kind === 'confirm' || said.block?.kind === 'decision'
      const messages = [
        ...(gate
          ? base.map((m) => (m.block?.kind === 'confirm' || m.block?.kind === 'decision' ? { ...m, live: false } : m))
          : base),
        said,
      ]
      /* A PRD gate going live is what turns the board card to "needs your
         input" — so a parked PRD reads on the home screen exactly like the
         scripted tasks that stopped for a human. */
      const tasks = said.block?.kind === 'decision' && state.activeObject
        ? updatePrdTask(state, { tag: 'input', status: 'clarify', note: said.block.question })
        : state.tasks
      return { ...state, messages, tasks }
    }

    case 'tools': {
      const trailing = state.messages.at(-1)
      const block = { kind: 'tools' as const, steps: effect.steps, done: 0, title: effect.title }
      const msg = {
        id: trailing?.typing ? trailing.id : nextId(),
        from: 'aava' as const,
        lines: [],
        block,
        typing: false,
        live: true,
      }
      const messages = trailing?.typing
        ? [...state.messages.slice(0, -1), msg]
        : [...state.messages, msg]
      return { ...state, messages }
    }

    case 'toolProgress': {
      // Advance the newest tools block. Search backwards: later `say` messages
      // may already sit on top of it.
      const idx = state.messages.map((m) => m.block?.kind).lastIndexOf('tools')
      if (idx === -1) return state
      const target = state.messages[idx]
      if (target.block?.kind !== 'tools') return state
      const messages = [...state.messages]
      messages[idx] = { ...target, block: { ...target.block, done: effect.done } }
      return { ...state, messages }
    }

    case 'showTab':
      return {
        ...state,
        playground: {
          ...pg,
          activeTab: effect.tab,
          /* Producing an artefact opens the workspace — §13 automatic opening. */
          panelOpen: true,
          enabledTabs: pg.enabledTabs.includes(effect.tab)
            ? pg.enabledTabs
            : [...pg.enabledTabs, effect.tab],
          diffBadge: effect.tab === 'diff' ? null : pg.diffBadge,
          openRequest: pg.openRequest + 1,
        },
      }

    case 'enableTab':
      return {
        ...state,
        playground: {
          ...pg,
          enabledTabs: pg.enabledTabs.includes(effect.tab)
            ? pg.enabledTabs
            : [...pg.enabledTabs, effect.tab],
          diffBadge: effect.tab === 'diff' ? effect.badge ?? null : pg.diffBadge,
        },
      }

    case 'runState':
      return { ...state, playground: { ...pg, runState: { kind: effect.kind, label: effect.label } } }

    /* AAVA rewriting a file wins over what you typed in it — it is editing the
       same file, not a copy. Dropping the edit is what makes the preview follow
       the new version instead of your stale one. */
    case 'codeVersion': {
      const { [effect.file]: _dropped, ...edits } = pg.edits
      return {
        ...state,
        playground: {
          ...pg,
          activeFile: effect.file,
          fileVersions: { ...pg.fileVersions, [effect.file]: effect.version },
          edits,
        },
      }
    }

    case 'chips':
      return { ...state, chipStage: effect.stage }

    /* A document is ready — mark it so the canvas swaps its drafting placeholder
       for the document, and make sure the panel is open. */
    case 'openPanel':
      return {
        ...state,
        activeObject: state.activeObject ? { ...state.activeObject, docReady: true } : state.activeObject,
        playground: { ...pg, panelOpen: true },
      }

    /* The capability search resolved — flip the newest capability block from
       its shimmering "searching" state to the matched card. */
    case 'capabilityMatched': {
      const idx = state.messages.map((m) => m.block?.kind).lastIndexOf('capability')
      if (idx === -1) return state
      const target = state.messages[idx]
      if (target.block?.kind !== 'capability') return state
      const messages = [...state.messages]
      messages[idx] = { ...target, block: { ...target.block, searching: false } }
      return { ...state, messages }
    }

    /* A connector card advanced — flip the newest one to its next state
       (searching → offer → connecting → done). */
    case 'connectState': {
      const idx = state.messages.map((m) => m.block?.kind).lastIndexOf('connect')
      if (idx === -1) return state
      const target = state.messages[idx]
      if (target.block?.kind !== 'connect') return state
      const messages = [...state.messages]
      messages[idx] = { ...target, block: { ...target.block, state: effect.state } }
      return { ...state, messages }
    }

    /* The backlog run moved to a new phase document — swap what the canvas shows
       and bring the panel into view. */
    case 'setDoc':
      return {
        ...state,
        activeObject: state.activeObject
          ? { ...state.activeObject, activeDoc: effect.doc, docReady: true }
          : state.activeObject,
        playground: { ...pg, panelOpen: true },
      }

    /* The Watch zone is append-only and never interactive — a line lands and
       stays. */
    case 'watch':
      return {
        ...state,
        watchLog: [...state.watchLog, { id: nextId(), text: effect.text, tone: effect.tone ?? 'info' }],
      }

    /* The PRD moved to a new phase, which is what the Canvas renders. The board
       card follows: back to "working" while it runs, "done" once it ships. */
    case 'prdPhase':
      if (!state.activeObject) return state
      return {
        ...state,
        activeObject: { ...state.activeObject, phase: effect.phase },
        // Stays "needs your input" while running (Raman's home keeps the card);
        // only the finished PRD leaves his home.
        tasks: effect.phase === 'done'
          ? updatePrdTask(state, { tag: 'done', status: 'done', note: 'Exported to Jira · workflow complete' })
          : updatePrdTask(state, { note: 'Working through the run…' }),
      }
  }
}

/* Patch the board task mirroring the open PRD object. */
function updatePrdTask(state: AppState, patch: Partial<Task>): Task[] {
  const id = state.activeObject?.taskId
  if (!id) return state.tasks
  return state.tasks.map((t) => (t.id === id ? { ...t, ...patch, updated: 'Just now' } : t))
}

export function applyEffects(state: AppState, effects: Effect[]): AppState {
  return effects.reduce(applyEffect, state)
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    /* My Tasks is the board, and looking at it costs you nothing: the thread you
       were in stays live underneath, exactly as it was, and CLOSE_TASKS puts you
       back in it. Nothing here parks, resets or reopens anything. */
    case 'SHOW_TASKS':
      return { ...state, arrangement: 'tasks', overlay: 'none' }

    case 'CLOSE_TASKS':
      return state.arrangement === 'tasks'
        ? { ...state, arrangement: behindTheBoard(state) }
        : state

    /* Home parks the current thread rather than dropping it — the sidebar row
       would otherwise point at a conversation that no longer exists anywhere. */
    case 'GO_HOME':
      return {
        ...initialState,
        profileId: state.profileId,
        tasks: state.tasks,
        parkedTasks: state.parkedTasks,
        threads: state.threads,
        pinnedThreadIds: state.pinnedThreadIds,
        sidebarOpen: state.sidebarOpen,
        readNotifications: state.readNotifications,
        stashed: state.activeThreadId
          ? { ...state.stashed, [state.activeThreadId]: snapshot(state) }
          : state.stashed,
      }

    /* Flip to the other signed-in profile and land on that profile's home. The
       outgoing profile's tasks are parked so switching back restores them; the
       threads/stash reset because a profile is a different person's session. */
    case 'SWITCH_PROFILE': {
      const to = state.profileId === 'deepak' ? 'raman' : 'deepak'
      return {
        ...initialState,
        profileId: to,
        // Deepak always opens on the seeded board; Raman opens on whatever he
        // parked (empty on first switch, his PRD cards after that).
        tasks: to === 'deepak' ? TASKS : state.parkedTasks,
        parkedTasks: state.tasks,
        sidebarOpen: state.sidebarOpen,
      }
    }

    case 'USER_SAY': {
      /* First message of a fresh conversation opens a thread, so every chat the
         user starts shows up under Recents without a separate "new chat" step. */
      const threadId = state.activeThreadId ?? `th-chat-${nextId()}`
      const opensThread = !state.activeThreadId
      return {
        ...state,
        // Talking always lands in the conversation — beside the playground when
        // a task OR a Canvas object (a PRD) is open, on its own when neither is.
        arrangement: state.activeTaskId || state.activeObject ? 'split' : 'conversation',
        chipStage: null,
        pendingTopic: null,
        activeThreadId: threadId,
        threads: opensThread
          ? [{ id: threadId, kind: 'chat', title: action.text, when: 'Just now' }, ...state.threads]
          : state.threads,
        messages: [
          ...state.messages,
          { id: nextId(), from: 'user', lines: [action.text], typing: false },
        ],
      }
    }

    case 'TYPING':
      return {
        ...state,
        messages: [...state.messages, { id: nextId(), from: 'aava', lines: [], typing: true }],
      }

    case 'OPEN_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task) return state
      const threadId = threadIdForTask(task.id)
      return {
        ...state,
        arrangement: 'split',
        activeTaskId: task.id,
        activeObject: null,
        watchLog: [],
        activeThreadId: threadId,
        overlay: 'none',
        chipStage: null,
        pendingTopic: null,
        /* A task you pick up while another one is open gets its own thread. The
           one you were in parks whole and waits in the sidebar — it must never
           end up with a second task talking over the top of it. */
        stashed: state.activeThreadId && state.activeThreadId !== threadId
          ? { ...state.stashed, [state.activeThreadId]: snapshot(state) }
          : state.stashed,
        /* The board is a fixed picture of the work, not a live one. Opening a
           task used to move its card into "Working", which meant the columns
           rearranged under whoever was looking at them. */
        threads: [
          { id: threadId, kind: 'task', taskId: task.id,
            title: task.title, when: 'Just now' },
          // Re-opening a task must not stack duplicate rows in the sidebar.
          ...state.threads.filter((t) => t.id !== threadId),
        ],
        // Its own conversation, from its own first line — not appended to whatever
        // thread happened to be on screen.
        messages: [
          { id: nextId(), from: 'user', typing: false,
            lines: [`Task assigned from ${task.context.ticketSource.split(' · ')[0]} – “${task.title}”`] },
        ],
        playground: {
          ...emptyPlayground,
          taskId: task.id,
          /* Opening onto a preview a backend task has no page for is a tab
             saying "nothing to show here" before anything has run. */
          activeTab: hasPreview(action.scenario) ? 'preview' : 'tests',
          activeFile: action.scenario?.fileOrder[0] ?? null,
          prepAt: action.scenario ? prepStart(action.scenario.prep) : 0,
        },
      }
    }

    case 'OPEN_OBJECT': {
      /* The intent path into the playground. Mirrors OPEN_TASK — its own thread,
         its own opening line — but carries a Canvas object instead of a task,
         and no scenario, so none of the task machinery (prep steps, gates,
         scripted beats) is engaged. */
      /* The object gets a board task so a parked PRD shows on the home screen
         like any other task; the thread is keyed off that task id so the card
         can reopen the parked thread through the same openTask path. */
      const prdTaskId = `prd-${nextId()}`
      const threadId = threadIdForTask(prdTaskId)
      return {
        ...state,
        arrangement: 'split',
        activeTaskId: null,
        activeObject: { kind: action.kind, title: action.title, subject: action.subject, phase: 'analysis', taskId: prdTaskId },
        activeThreadId: threadId,
        overlay: 'none',
        chipStage: null,
        pendingTopic: null,
        watchLog: [],
        tasks: [prdBoardTask(prdTaskId, action.title, action.subject), ...state.tasks],
        stashed: state.activeThreadId && state.activeThreadId !== threadId
          ? { ...state.stashed, [state.activeThreadId]: snapshot(state) }
          : state.stashed,
        threads: [
          { id: threadId, kind: 'task', taskId: prdTaskId, title: action.title, when: 'Just now' },
          ...state.threads.filter((t) => t.id !== threadId),
        ],
        messages: [
          { id: nextId(), from: 'user', typing: false, lines: [action.said] },
        ],
        playground: emptyPlayground,
      }
    }

    case 'CLOSE_PLAYGROUND':
      return { ...state, arrangement: 'conversation', activeTaskId: null, activeObject: null, watchLog: [], playground: emptyPlayground }

    case 'APPLY':
      return applyEffect(state, action.effect)

    /* A gate's inline note — store what the user typed and retire the gate, so
       the answered card shows their note back. */
    case 'RECORD_ANSWER':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.messageId ? { ...m, answer: action.text, live: false } : m,
        ),
      }

    /* An artefact card's Open — reveal that backlog document in the canvas. */
    case 'SET_OBJECT_DOC':
      return state.activeObject
        ? {
            ...state,
            activeObject: { ...state.activeObject, activeDoc: action.doc, docReady: true },
            playground: { ...state.playground, panelOpen: true },
          }
        : state

    case 'SET_TAB':
      return {
        ...state,
        playground: {
          ...state.playground,
          activeTab: action.tab,
          /* An explicit tab request shows it — the panel folds itself away when
             the last tab is closed, so asking for one has to bring it back. */
          panelOpen: true,
          enabledTabs: state.playground.enabledTabs.includes(action.tab)
            ? state.playground.enabledTabs
            : [...state.playground.enabledTabs, action.tab],
          diffBadge: action.tab === 'diff' ? null : state.playground.diffBadge,
          openRequest: state.playground.openRequest + 1,
        },
      }

    case 'SET_FILE':
      return { ...state, playground: { ...state.playground, activeFile: action.file } }

    /* Typing in the editor. Kept per file so switching files and coming back
       does not throw the edit away, and so the preview can read the same text
       the editor is showing. */
    case 'EDIT_FILE':
      return {
        ...state,
        playground: {
          ...state.playground,
          edits: { ...state.playground.edits, [action.file]: action.text },
        },
      }

    /* Bumps openRequest like SET_TAB does: the workspace dedups on
       `${tabId}#${openRequest}`, so without it a second step click while
       activeTab is already 'evidence' is a no-op — and the tab stays shut
       after the user closes it. */
    case 'FOCUS_EVIDENCE':
      return {
        ...state,
        playground: {
          ...state.playground,
          activeTab: 'evidence',
          focusedEvidence: action.key,
          panelOpen: true,
          openRequest: state.playground.openRequest + 1,
        },
      }

    case 'DISMISS_BLOCK':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.messageId ? { ...m, live: false } : m,
        ),
      }

    /* Opening the panel no longer marks everything read — a row stays new until
       it is the row you opened, which is what the bold/plain split says. */
    case 'OVERLAY':
      return { ...state, overlay: action.overlay }

    case 'READ_NOTIFICATION':
      return state.readNotifications.includes(action.taskId)
        ? state
        : { ...state, readNotifications: [...state.readNotifications, action.taskId] }

    case 'TOAST':
      return { ...state, toast: action.text }

    case 'TOGGLE_PANEL':
      return { ...state, playground: { ...state.playground, panelOpen: !state.playground.panelOpen } }

    case 'SET_PANEL_OPEN':
      return { ...state, playground: { ...state.playground, panelOpen: action.open } }

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }

    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.open }

    case 'TOGGLE_CONTEXT':
      return { ...state, playground: { ...state.playground, contextOpen: !state.playground.contextOpen } }

    case 'PENDING_TOPIC':
      return { ...state, pendingTopic: action.text }

    /* A new topic never costs you the old one: the thread you are in is parked
       whole — messages, playground, run state — and listed in the sidebar. */
    case 'NEW_THREAD': {
      const fromId = state.activeThreadId ?? `th-chat-${nextId()}`
      const fromRow: Thread = state.threads.find((t) => t.id === fromId) ?? {
        id: fromId,
        kind: 'chat',
        title: state.messages.find((m) => m.from === 'user')?.lines[0] ?? 'Conversation',
        when: 'Just now',
      }
      const newId = `th-chat-${nextId()}`
      return {
        ...state,
        arrangement: 'conversation',
        activeTaskId: null,
        activeObject: null,
        activeThreadId: newId,
        playground: emptyPlayground,
        chipStage: null,
        pendingTopic: null,
        messages: [{ id: nextId(), from: 'user', lines: [action.text], typing: false }],
        stashed: { ...state.stashed, [fromId]: snapshot(state) },
        threads: [
          { id: newId, kind: 'chat', title: action.text, when: 'Just now' },
          fromRow,
          ...state.threads.filter((t) => t.id !== fromId),
        ],
      }
    }

    case 'RESUME_THREAD': {
      const parked = state.stashed[action.threadId]
      if (!parked) return state
      const stashed = { ...state.stashed }
      delete stashed[action.threadId]
      if (state.activeThreadId) stashed[state.activeThreadId] = snapshot(state)
      const row = state.threads.find((t) => t.id === action.threadId)
      return {
        ...state,
        ...parked,
        activeThreadId: action.threadId,
        stashed,
        pendingTopic: null,
        overlay: 'none',
        /* The sidebar lists by recency with no headings to explain itself, so
           the thread you just came back to has to be the newest one — it cannot
           sit below chats you have not touched since. */
        threads: row
          ? [{ ...row, when: 'Just now' }, ...state.threads.filter((t) => t.id !== action.threadId)]
          : state.threads,
      }
    }

    case 'TOGGLE_PIN_THREAD':
      return {
        ...state,
        pinnedThreadIds: state.pinnedThreadIds.includes(action.threadId)
          ? state.pinnedThreadIds.filter((id) => id !== action.threadId)
          : [...state.pinnedThreadIds, action.threadId],
      }
  }
}
