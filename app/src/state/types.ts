import type { CanvasObjectKind } from '../zones/objects'
import type { ProfileId } from '../data/user'
import type { BacklogDoc } from '../prd/backlog'

/** `tasks` is the board on the main screen — it used to be a drawer overlay. */
export type Arrangement = 'start' | 'conversation' | 'split' | 'tasks'

/* A Canvas object opened by intent rather than by a task card — the user typed
   "create a PRD…" in the composer and walked straight into the playground. The
   heavy content is scripted elsewhere (src/prd) — state holds only what changes:
   which phase of the flow the workspace is showing. */
export type PrdPhase = 'analysis' | 'stories' | 'release' | 'done'

export interface ActiveObject {
  kind: CanvasObjectKind
  title: string
  /** Subject lifted from the intent, interpolated into the scripted content. */
  subject: string
  /** Which phase of the execution the Canvas workspace is rendering. */
  phase: PrdPhase
  /** The board task mirroring this object, so a parked PRD shows as a card and
      the card can reopen it. */
  taskId: string
  /** False until the document has been drafted — the canvas shows a drafting
      placeholder until then, so the clarifying turn precedes the artefact. */
  docReady?: boolean
  /** For a backlog object: which phase document the canvas is showing. */
  activeDoc?: BacklogDoc
}

/** One append-only line in the Watch zone — the run log. Never interactive. */
export interface WatchEntry {
  id: string
  text: string
  tone: 'info' | 'ok' | 'warn'
}
/** The lifecycle of a connector card — searching → not found (offer) →
    connecting → connected. */
export type ConnectState = 'searching' | 'offer' | 'connecting' | 'done'
export type TaskStatus = 'wip' | 'clarify' | 'pending' | 'done'
export type TabId = 'evidence' | 'preview' | 'code' | 'tests' | 'diff'
export type RunKind = 'prep' | 'live' | 'shipped'

/* The five states a task can be in, as the user experiences them.
 * `status` groups tasks into board columns (whose turn is it); `tag` says
 * precisely WHY. Three tasks can all need you for three different reasons. */
export type TaskTag = 'review' | 'input' | 'blocked' | 'working' | 'done'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  tag: TaskTag
  est: string
  dep: string
  recommended?: boolean
  /** Second status line. Under 10 words — a specific observation, not a label. */
  note: string
  /** When the task last moved. Relative, because nothing here has a real clock. */
  updated: string
  /** What AAVA opens with when this task is picked up. */
  opening: string[]
  context: TaskContext
}

export interface Thread {
  /** Stable identity — pinning needs something to key on. */
  id: string
  kind: 'chat' | 'task'
  title: string
  when: string
  /** Set on task threads, so the sidebar can reopen a task that was never parked. */
  taskId?: string
}

export interface CoverageGroup {
  title: string
  items: string[]
  tone?: 'assumed'
}

export interface ConfirmRow {
  repo: string
  branch: string
  what: string
}

/** One tool call AAVA makes while answering — shown resolving in real time. */
export interface ToolStep {
  label: string
  source: string
  result: string
  /** How long this call takes, from `T` in state/timing.ts. */
  ms: number
}

export type BlockSpec =
  | { kind: 'coverage'; groups: CoverageGroup[] }
  /** What a validator agent found, as a scoreboard. `failing` names the checks
      that did not pass — usually the reason the run stopped for a human. */
  | { kind: 'validation'; agent: string; file?: string
      counts: { tests: number; passed: number; failed: number; warnings: number }
      failing?: string[] }
  /** `step` and `title` turn a confirm into a named gate — "waiting on you,
      step 4" — rather than an anonymous pair of buttons. */
  | { kind: 'confirm'; rows: ConfirmRow[]; acceptLabel: string; cancelLabel: string; acceptBeat: string
      step?: number; title?: string }
  /** `file` makes a link openable — it opens that source file in the workspace.
      `href` makes it an external link (a raised ticket in Jira, say), rendered
      as a blue hyperlink. Without either the link is a flat reference. */
  | { kind: 'links'; links: { label: string; file?: string; href?: string }[] }
  /** `title` groups the steps into a collapsible accordion — while running it is
      open and animating; once every step is done it folds to the title with a
      count, the way agent tools summarise a finished run. */
  | { kind: 'tools'; steps: ToolStep[]; done: number; title?: string }
  /** The thing that was just generated, with a way in. Open puts the preview
      tab in front — the same artefact the workspace already renders. */
  | { kind: 'app'; name: string; status: string }
  /** A generated document artefact, shown in chat as a card with an Open button
      (Claude-artifact style). Open reveals the document canvas on the right;
      `doc` names which backlog document to open (else just reveal the panel). */
  | { kind: 'document'; name: string; format: string; doc?: BacklogDoc }
  /** Capability matching — the first thing that happens on any run. `searching`
      shows a shimmering "looking for a capability" line; once matched it becomes
      a card naming the capability, what it maps to, and what it can do. */
  | { kind: 'capability'; searching: boolean; badge?: string; maps?: string; chips?: string[] }
  /** The proposed plan — a numbered list of steps AAVA will run, shown before
      execution starts. `title` overrides the default header ("Initiate Process"
      for the combined plan+approve card); `action` adds a footer CTA that both
      approves and starts the run, so the plan and its approval are one card. */
  | { kind: 'plan'; count: number; title?: string; steps: { title: string; detail: string }[]
      action?: { label: string; beat: string }
      /** A secondary "Edit plan" action — reveals a textarea (like a gate's
          refine), records the note, then fires the same `action` beat. */
      editLabel?: string }
  /** A "push to Jira" card — one primary action carrying the Jira logo (`beat`).
      An optional secondary action ("Proceed for now") continues the run without
      pushing; both advance to the next phase. Shown after every phase gate. */
  | { kind: 'sync'; title: string; detail: string; beat: string
      secondaryLabel?: string; secondaryBeat?: string }
  /** A connector card — searching for a service integration, offering to connect
      it, and the connecting/connected states. Drives the Azure DevOps push:
      shimmer while searching, a Connect button once "not found", a spinner while
      connecting, a tick once done. `beat` fires from the Connect button. */
  | { kind: 'connect'; service: string; detail: string; beat: string
      state: ConnectState; logo?: 'azure' | 'jira' }
  /** A human-in-the-loop decision gate. Three visual variants:
      - 'buttons' (default): one pill button per branch — the phase gates.
      - 'action': a single primary action on a titled card — access requests,
        "start execution", anything with one obvious next step.
      - 'clarify': a lettered multiple-choice panel with an "Other…" free-text
        row and a Continue button — a question that needs the user to pick.
      Each option names the beat it fires. */
  | { kind: 'decision'; step?: number; title: string; question: string
      variant?: 'buttons' | 'action' | 'clarify' | 'approve'
      /** Card glyph for 'action'/'clarify' variants. */
      icon?: 'person' | 'question' | 'shield' | 'sparkle'
      /** e.g. "1 of 3" — shown on the clarify panel. */
      counter?: string
      /** Placeholder for the clarify panel's free-text "Other…" row, and for a
          `collect` option's inline textarea. */
      placeholder?: string
      /** `collect` turns a buttons-variant option into a "reveal a textarea and
          record what you type" action — clicking it opens an inline text box
          rather than firing straight away; Send records the note and fires the
          beat. */
      options: { label: string; beat: string; primary?: boolean; sub?: string; collect?: boolean }[]
      summary?: { label: string; detail?: string }[] }

export interface Message {
  id: string
  from: 'user' | 'aava'
  lines: string[]
  block?: BlockSpec
  typing?: boolean
  /** Set false once the confirm block has been accepted or dismissed. */
  live?: boolean
  /** True while the text is still revealing, so it streams once and never re-streams. */
  stream?: boolean
  /** What the user typed into a gate's inline textarea before answering — shown
      back inside the retired gate card as their recorded note. */
  answer?: string
}

export type Effect =
  | { type: 'say'; lines: string[]; block?: BlockSpec; stream?: boolean }
  /** Show tool calls resolving one by one before the answer arrives. `title`
      groups them into a collapsible accordion that folds once they finish. */
  | { type: 'tools'; steps: ToolStep[]; title?: string }
  /** Advance the newest tools block to `done` completed steps. */
  | { type: 'toolProgress'; done: number }
  | { type: 'showTab'; tab: TabId }
  | { type: 'enableTab'; tab: TabId; badge?: number }
  | { type: 'runState'; kind: RunKind; label: string }
  | { type: 'codeVersion'; file: string; version: number }
  | { type: 'chips'; stage: string }
  /** Move the run to this prep step. Everything before it reads as done. */
  | { type: 'prepAt'; index: number }
  /** Append a line to the Watch zone (the run log). */
  | { type: 'watch'; text: string; tone?: 'info' | 'ok' | 'warn' }
  /** Reveal the artefact panel — fired when a document is ready to show. */
  | { type: 'openPanel' }
  /** Switch which backlog document the canvas shows, and open the panel. */
  | { type: 'setDoc'; doc: BacklogDoc }
  /** Resolve the newest capability block from searching to matched. */
  | { type: 'capabilityMatched' }
  /** Advance the newest connector card to a new state (searching → offer →
      connecting → done). */
  | { type: 'connectState'; state: ConnectState }
  /** Move the open PRD object to a new phase — swaps what the Canvas renders. */
  | { type: 'prdPhase'; phase: PrdPhase }
  | { type: 'wait'; ms: number }

export interface PrepStep {
  key: string
  label: string
  result: string
  detail: string
  /** Not done yet. The FIRST pending step is where the run is parked — that is
      what seeds `playground.prepAt`, and everything after it is simply ahead. */
  pending?: boolean
  /** Names the beat that asks for this step's decision. Set = this step is a
      human gate: the run stops here, and that beat is replayed after every
      answer until someone clears it. */
  gate?: string
}

export interface EvidenceBlock {
  name: string
  source: string
  /** Rendered by Evidence.tsx. `figma` gets the SVG frame treatment. */
  body: { kind: 'kv'; pairs: [string, string][] }
      | { kind: 'text'; text: string }
      | { kind: 'columns'; found: string[]; missing: string[]; lead: string }
      | { kind: 'figma'; caption: string }
}

export interface DiffGroup {
  repo: string
  branch: string
  files: string[]
  lines?: { tone: 'ctx' | 'del' | 'add'; text: string }[]
}

export interface Chip { label: string; sends: string }

/* Everything the task-context pane shows, grouped the way it renders.
 *
 * Most sections are optional on purpose. A task AAVA has barely started has
 * almost nothing to show, and that emptiness is information — it says exactly
 * how far it got before it stopped. A pane that always looked full would be
 * lying about the ones that are blocked. */
export interface TaskContext {
  ticket: string
  ticketSource: string
  /** Tracker deep link. Omitted means the sample Jira browse URL is used. */
  ticketUrl?: string
  description: string
  /** `note` explains an unmet criterion — why, not just that. */
  criteria: { text: string; met: boolean; note?: string }[]
  capabilities?: string[]
  related?: { id: string; title: string }[]
  connected?: {
    kind: 'file' | 'design' | 'api' | 'git'
    label: string
    source: string
    /** Reached for and refused — shown struck through, in danger. */
    denied?: boolean
  }[]
  run: {
    agent: string
    golden: boolean
    certified?: string
    accepts?: number
    branch?: string
    tokens?: string
    cost?: string
    /** Why the run stopped short of finishing, when it did. */
    halted?: string
  }
}

export interface Scenario {
  prep: PrepStep[]
  evidence: Record<string, EvidenceBlock>
  files: Record<string, { versions: string[] }>
  fileOrder: string[]
  /** Where the changed files live in the repo, for the editor's file tree.
      Slash-separated; each segment renders as a folder above the files. */
  fileRoot?: string
  /** `file` names the spec file the Tests tab reports on; `failing` lists the
      specs in `specs` that do NOT pass, so the tab and the validation card in
      the conversation can never tell different stories. */
  tests: { specs: string[]; coveragePct: number; gatePct: number; file?: string
    failing?: string[]
    /** The prep step that fixes `failing`. Past it, the tab shows them green —
        so the tab cannot still be red after the run says it fixed them. */
    failUntil?: number }
  diff: DiffGroup[]
  beats: Record<string, Effect[]>
  router: { match: RegExp; beat: string }[]
  chips: Record<string, Chip[]>
  fallback: string[]
}

export interface PlaygroundState {
  taskId: string | null
  activeTab: TabId
  enabledTabs: TabId[]
  runState: { kind: RunKind; label: string }
  focusedEvidence: string | null
  fileVersions: Record<string, number>
  /** What the user typed in the editor, per file. Overrides the scripted
   *  version for that file — the preview reads from here too. */
  edits: Record<string, string>
  activeFile: string | null
  /** Which prep step the run is parked on. Steps before it are done, the step
   *  itself is where the user is, everything after is ahead of the run. */
  prepAt: number
  diffBadge: number | null
  /** Task-context pane. Collapsed by default so the default split is unchanged. */
  contextOpen: boolean
  /** Artefact panel. Collapses to a spine rather than disappearing. */
  panelOpen: boolean
  /** Bumped every time something explicitly asks for a tab — a beat, a link, the
   *  Open button. The workspace opens on the change, so asking twice for the same
   *  tab works even after the user closed it. Incidental re-renders do not bump,
   *  which is what keeps a closed tab closed. */
  openRequest: number
}

/** Everything that makes a thread itself, parked while you work in another one. */
export interface ThreadSnapshot {
  arrangement: Arrangement
  activeTaskId: string | null
  activeObject: ActiveObject | null
  messages: Message[]
  playground: PlaygroundState
  watchLog: WatchEntry[]
  chipStage: string | null
}

export type Overlay =
  | 'none'
  | 'notifications'
  | 'search'

export interface AppState {
  arrangement: Arrangement
  /** Who is signed in. Switching profiles swaps the home board and greeting. */
  profileId: ProfileId
  activeTaskId: string | null
  /** Set when a Canvas object (a PRD, say) was opened by intent, not a task. */
  activeObject: ActiveObject | null
  /** The Watch zone's run log — append-only, cleared when a session opens. */
  watchLog: WatchEntry[]
  tasks: Task[]
  /** The non-active profile's tasks, kept so switching back restores them. Only
      Raman's are dynamic (Deepak's are the seeded board); this holds whichever
      profile is not currently on screen. */
  parkedTasks: Task[]
  messages: Message[]
  threads: Thread[]
  playground: PlaygroundState
  toast: string | null
  overlay: Overlay
  /** Unread count for the topbar bell. Cleared when the notifications panel opens. */
  /** Task ids whose notification has been opened. Everything else reads as new. */
  readNotifications: string[]
  chipStage: string | null
  /** Sidebar. Open by default; collapses to an icon rail and pushes content back. */
  sidebarOpen: boolean
  /** Ids of threads the user pinned to the top of the sidebar. */
  pinnedThreadIds: string[]
  /** Which thread the conversation on screen belongs to. */
  activeThreadId: string | null
  /** Parked threads, by id. Leaving a thread never throws its state away. */
  stashed: Record<string, ThreadSnapshot>
  /** An off-topic question waiting on "yes, start a new thread". */
  pendingTopic: string | null
}

export type Action =
  | { type: 'GO_HOME' }
  /** My Tasks — the board, as a destination. Leaves the live thread untouched. */
  | { type: 'SHOW_TASKS' }
  /** Back off the board, into whatever was underneath it. */
  | { type: 'CLOSE_TASKS' }
  | { type: 'USER_SAY'; text: string }
  | { type: 'TYPING' }
  | { type: 'OPEN_TASK'; taskId: string; scenario: Scenario | null }
  /** Open a Canvas object by intent (no task card). `said` is the user's message. */
  | { type: 'OPEN_OBJECT'; kind: CanvasObjectKind; title: string; subject: string; said: string }
  | { type: 'CLOSE_PLAYGROUND' }
  | { type: 'APPLY'; effect: Effect }
  | { type: 'SET_TAB'; tab: TabId }
  | { type: 'SET_FILE'; file: string }
  | { type: 'EDIT_FILE'; file: string; text: string }
  | { type: 'FOCUS_EVIDENCE'; key: string }
  | { type: 'DISMISS_BLOCK'; messageId: string }
  | { type: 'OVERLAY'; overlay: Overlay }
  | { type: 'READ_NOTIFICATION'; taskId: string }
  | { type: 'TOAST'; text: string | null }
  | { type: 'TOGGLE_CONTEXT' }
  | { type: 'TOGGLE_PANEL' }
  /** Explicit set, for the panel library reporting geometry back as intent. */
  | { type: 'SET_PANEL_OPEN'; open: boolean }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; open: boolean }
  | { type: 'TOGGLE_PIN_THREAD'; threadId: string }
  /** Off-topic question parked until the user accepts a new thread. */
  | { type: 'PENDING_TOPIC'; text: string | null }
  /** Park the current thread, open a fresh chat carrying `text`. */
  | { type: 'NEW_THREAD'; text: string }
  | { type: 'RESUME_THREAD'; threadId: string }
  /** Switch to the other signed-in profile; resets to that profile's home. */
  | { type: 'SWITCH_PROFILE' }
  /** Open a specific backlog document in the canvas — an artefact card's Open. */
  | { type: 'SET_OBJECT_DOC'; doc: BacklogDoc }
  /** Record what the user typed into a gate's inline textarea, and retire the
      gate — the note is shown back inside the answered card. */
  | { type: 'RECORD_ANSWER'; messageId: string; text: string }
