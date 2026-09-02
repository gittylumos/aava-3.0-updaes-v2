/* The PRD-to-backlog run — a scripted, human-in-the-loop flow.
 *
 * Phases (Intake, Epics, Features, Stories), each one a status checklist (the
 * tools block) resolving in real time, an AAVA turn, the phase's document opening
 * in the canvas, and a gate the user must clear before the run moves on (the
 * golden "waiting on you" decision block). After every phase gate AAVA offers to
 * push that level to Jira — "Publish" or "Skip", both continuing the run. The run
 * ends by publishing the stories; sprint planning is handed to the scrum master.
 * It maps to the "Epics and Features Generator" agentic process; the words follow
 * that script.
 */
import type { BlockSpec, Effect, Message, PrepStep, ToolStep } from '../state/types'
import type { BacklogDoc } from './backlog'
import { T } from '../state/timing'

/* Which phase a produced document belongs to — used to drive the run-progress
   bar and to reopen a phase's doc from it. */
export const DOC_PHASE: Record<BacklogDoc, string> = {
  intake: 'intake',
  epics: 'epics', 'epics-fields': 'epics', 'epics-custom': 'epics',
  features: 'features', 'features-gaps': 'features', 'features-custom': 'features',
  stories: 'stories', 'stories-flags': 'stories',
  sprint: 'sprint',
}

/* The run-progress steps for the backlog flow. Sprint planning is handed off to
   the scrum master once the stories are published, so the run itself ends at
   stories — four phases, shown in the progress bar below the session header once
   the run starts (after Proceed). */
const PROGRESS_STEPS: PrepStep[] = [
  { key: 'intake', label: 'Intake & understanding', result: 'PRD parsed', detail: 'Objectives, roles and requirements', gate: 'intake' },
  { key: 'epics', label: 'Draft epics', result: '7 epics', detail: 'Cluster requirements into themed epics', gate: 'epics' },
  { key: 'features', label: 'Break into features', result: '23 features', detail: 'Decompose each confirmed epic', gate: 'features' },
  { key: 'stories', label: 'Write user stories', result: '58 stories', detail: 'Draft stories, then publish to Jira' },
]
const PHASE_INDEX: Record<string, number> = { intake: 0, epics: 1, features: 2, stories: 3 }

/** Where the backlog run stands, derived from the run itself — no separate state
    to keep in sync. The current phase is the last document's phase while a gate
    holds (you are reviewing it), or the next phase while a checklist is running
    (it is being drafted). `waiting` is true only at a gate, so the bar does not
    claim "waiting on you" mid-generation. `started` gates the whole bar: nothing
    shows during capability-match and planning, only once the run is underway. */
export function backlogProgress(messages: Message[]): { steps: PrepStep[]; at: number; started: boolean; waiting: boolean } {
  let lastDocPhase = -1
  let gateLive = false
  let running = false
  let started = false
  for (const m of messages) {
    const b = m.block
    if (b?.kind === 'document' && b.doc) {
      const p = PHASE_INDEX[DOC_PHASE[b.doc]]
      if (p != null) lastDocPhase = Math.max(lastDocPhase, p)
      started = true
    }
    if (b?.kind === 'tools') { started = true; if (b.done < b.steps.length) running = true }
    if (m.live !== false && b?.kind === 'decision') gateLive = true
  }
  /* Current phase = the NEXT one only while a checklist is actively drafting it;
     otherwise the last document's phase (being reviewed, or between steps). This
     avoids the flash to the next phase in the gap between a doc landing and its
     gate appearing. `waiting` (amber) is a golden gate only. */
  /* Once the final phase's document has landed and nothing is generating, the
     run's work is complete (publishing is a follow-on action, not a phase) —
     count all steps done rather than parking on the last one forever. */
  const lastIdx = PROGRESS_STEPS.length - 1
  const at = running
    ? Math.min(lastDocPhase + 1, PROGRESS_STEPS.length)
    : lastDocPhase >= lastIdx ? PROGRESS_STEPS.length : Math.max(0, lastDocPhase)
  return { steps: PROGRESS_STEPS, at, started, waiting: gateLive }
}

type Step = [label: string, result: string, ms?: number]

/* Generation pace. The backlog agents do real work — clustering, decomposing,
   checking — so each step dwells long enough to read the spinner resolve to a
   green tick, and a phase runs ~5s+. That is also what makes the "running" blue
   state on the topology visible rather than a flash. */
const GEN = 650

/** A status checklist — spinner → ✓ with a result, one row at a time. A `title`
   makes it a collapsible accordion that folds to a summary once it finishes. */
function status(steps: Step[], title?: string): Effect {
  const toolSteps: ToolStep[] = steps.map(([label, result, ms]) => ({
    label, result, source: 'RUN', ms: ms ?? GEN,
  }))
  return { type: 'tools', steps: toolSteps, title }
}

/** A generated-artefact card — doc name + Open, which reveals it in the canvas. */
function artifact(name: string, doc: BacklogDoc): Effect {
  return { type: 'say', lines: [], stream: false, block: { kind: 'document', name, format: 'MD', doc } }
}

/* [label, beat, primary?, collect?] — `collect` turns the option into a
   "reveal a textarea, record what you type, then fire the beat" action. */
type Opt = [label: string, beat: string, primary?: boolean, collect?: boolean]

/** A gate — the golden "waiting on you" decision card. */
function gate(step: number, title: string, question: string, options: Opt[], summary?: { label: string; detail?: string }[]): BlockSpec {
  return {
    kind: 'decision', step, title, question,
    placeholder: 'Please describe here…',
    options: options.map(([label, beat, primary, collect]) => ({ label, beat, primary, collect })),
    summary,
  }
}

/** A quick "pushed to Jira" confirmation, run before continuing to the next
    phase when the user chooses to publish that level. */
function pushConfirm(count: string): Effect[] {
  return [
    { type: 'watch', text: `Pushing ${count} to Jira · WFS`, tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: `${count} created · Jira`, tone: 'ok' },
    { type: 'say', lines: [`Pushed the ${count} to Jira with parent–child links. Continuing.`] },
  ]
}

/** A Jira push offer shown after a phase gate — publish this level, or move to
    the next creation step (`next` names it) and publish later. */
function pushOffer(count: string, detail: string, pushBeat: string, nextBeat: string, next: string): Effect {
  return {
    type: 'say',
    lines: [`${count} confirmed. Want me to push them to Jira now, or ${next} and publish later?`],
    block: {
      kind: 'sync', title: `Push the ${count} to Jira`, detail,
      beat: pushBeat, secondaryLabel: 'Skip', secondaryBeat: nextBeat,
    },
  }
}

/* The run always starts with capability matching — a shimmering search, then the
   matched capability, and a single "Initiate Process" card that shows the plan
   and carries the Proceed action. Nothing executes until Proceed is pressed. */
export function backlogOpening(): Effect[] {
  return [
    { type: 'watch', text: 'Matching a capability for this request', tone: 'info' },
    { type: 'say', lines: [], stream: false, block: {
      kind: 'capability', searching: true, badge: 'EFG-1.0',
      maps: "This maps to the 'Epics and Features Generator' agentic process. I can take it end-to-end:",
      chips: [
        'PRD parsing & requirement extraction',
        'Backlog decomposition (epics → features → stories)',
        'Definition-of-Ready checks',
        'Sprint planning & story mapping',
      ],
    } },
    { type: 'wait', ms: 2500 },
    { type: 'capabilityMatched' },
    { type: 'watch', text: "Matched · Epics and Features Generator (EFG-1.0)", tone: 'ok' },
    { type: 'say', lines: [
      "Here's how I'll approach it — I'll pause for your review after every level, then publish the confirmed backlog to Jira and hand sprint planning to the scrum master.",
    ] },
    /* Plan + approval, one card. Proceed both approves and starts the run. */
    { type: 'say', lines: [], stream: false, block: {
      kind: 'plan', count: 5, title: 'Epics & Feature Generator Process',
      action: { label: 'Proceed', beat: 'startIntake' },
      steps: [
        { title: 'Intake & understanding', detail: 'Parse the PRD, summarise objectives, roles and requirements' },
        { title: 'Draft epics', detail: 'Cluster 28 requirements into themed epics — pause for review' },
        { title: 'Break into features', detail: 'Decompose each confirmed epic — pause for review' },
        { title: 'Write user stories', detail: 'Draft stories from the confirmed features' },
        { title: 'Publish to Jira', detail: 'Push the backlog; sprint planning goes to the scrum master' },
      ],
    } },
  ]
}

/* The PRD-to-Stories run as a TASK, not an intent.
 *
 * Raman opens it from a board card the way Deepak opens a scripted task — but the
 * intake already ran ahead of him (on the PRD upload, before he sat down), so the
 * opening lands already parked on the first human gate: the intake-summary review.
 * It follows the task-card pattern (see scenarios/t1.ts): the capability and plan
 * are quiet COLLAPSED records of what already ran, the intake accordion is emitted
 * already-complete (ms 0 — prepared work, no fake loading), the summary is stated
 * whole, and the run stops at the intake gate. Everything after the gate is the
 * existing backlog flow unchanged — the intake gate's accept beat is `startEpics`,
 * so clearing it hands straight off to BACKLOG_BEATS. The content is pulled
 * strictly from the intent flow above (same capability, same plan, same intake
 * accordion, same summary, same gate). */
export function backlogTaskOpening(): Effect[] {
  return [
    /* Capability + plan first, as subtle collapsed records — this run was matched
       and its intake already executed, so they read as quiet context the user can
       open, not front-and-centre cards with a Proceed button. */
    { type: 'say', stream: false, lines: [], block: {
      kind: 'capability', searching: false, collapsed: true, badge: 'EFG-1.0',
      maps: "This maps to the 'Epics and Features Generator' agentic process — it took the intake end-to-end:",
      chips: [
        'PRD parsing & requirement extraction',
        'Backlog decomposition (epics → features → stories)',
        'Definition-of-Ready checks',
        'Sprint planning & story mapping',
      ],
    } },
    { type: 'say', stream: false, lines: [], block: {
      kind: 'plan', collapsed: true, count: 5, title: 'Epics & Feature Generator Process',
      steps: [
        { title: 'Intake & understanding', detail: 'Parse the PRD, summarise objectives, roles and requirements' },
        { title: 'Draft epics', detail: 'Cluster 28 requirements into themed epics — pause for review' },
        { title: 'Break into features', detail: 'Decompose each confirmed epic — pause for review' },
        { title: 'Write user stories', detail: 'Draft stories from the confirmed features' },
        { title: 'Publish to Jira', detail: 'Push the backlog; sprint planning goes to the scrum master' },
      ],
    } },
    /* The intake ran before Raman arrived, so the accordion lands already complete
       (ms 0) and the summary is stated whole, with no typing indicator — a record
       of what ran, not steps ticking through in front of him. */
    { type: 'watch', text: 'Reading PRD · WireFrame Studio v1.0', tone: 'info' },
    status([
      ['Reading PRD', 'WireFrame Studio v1.0', 0],
      ['Parsing document structure and headers', 'done', 0],
      ['Extracting objectives', '5 found', 0],
      ['Extracting user roles', '6 found', 0],
      ['Parsing functional requirements', '28 · 6 cats', 0],
      ['Extracting non-functional requirements', '5 areas', 0],
      ['Building intake summary', 'ready', 0],
    ], 'Intake · reading the PRD'),
    { type: 'watch', text: 'Intake summary ready', tone: 'ok' },
    { type: 'say', stream: false, lines: [
      'PRD received — WireFrame Studio, v1.0. I found 5 objectives, 6 user roles, 28 functional requirements across 6 categories, and 5 non-functional areas. Before I build anything, here is what I understood.',
    ] },
    artifact('intake.md', 'intake'),
    /* Open the intake summary in the canvas straight away — like a task opening onto
       its running preview, the evidence is already on the right when Raman arrives. */
    { type: 'setDoc', doc: 'intake' },
    { type: 'say', stream: false,
      lines: ['Take a look in the canvas and flag anything I have misread — I will not move on until you confirm.'],
      block: gate(1, 'Confirm the intake summary', 'Does this match your PRD?', [
        ['Yes, this is accurate', 'startEpics', true],
        ['No, something is off', 'refineIntake', false, true],
      ]),
    },
  ]
}

/* ── Phase bodies, as standalone arrays so a "push then continue" beat can splice
   the push confirmation in front of the same phase the "proceed" branch runs. ── */

/* Phase 3 · Features — decompose, then surface the fields I could not infer. */
const BUILD_FEATURES: Effect[] = [
  status([
    ['Reading confirmed epics', 'done'],
    ['Decomposing Epic 01', '4 features'],
    ['Decomposing Epic 02', '4 features'],
    ['Decomposing Epic 03', '3 features'],
    ['Decomposing Epic 04', '4 features'],
    ['Decomposing Epic 05', '3 features'],
    ['Decomposing Epic 06', '3 features'],
    ['Decomposing Epic 07', '2 features'],
    ['Checking each feature against required fields', '3 gaps'],
  ], 'Features · decomposing epics'),
  { type: 'watch', text: '23 features drafted · 3 missing fields', tone: 'warn' },
  /* Show the features doc first — the gaps are highlighted right in it — then ask
     to fill them. The doc is already open, so the gate reads against what they see. */
  artifact('features.md', 'features-gaps'),
  { type: 'say',
    lines: [
      '23 features across the 7 epics, open in the canvas. Three of them are missing fields I could not infer from the PRD — target start date, end date and priority: Feature 1.3 (Responsive Device Preview), 5.3 (Bi-Directional Sync) and 7.2 (Contextual AI Tooltips). I have highlighted the gaps right in the doc.',
      'You can fill those in and I will fold them into the list, or proceed and leave them flagged for later.',
    ],
    block: gate(4, 'Fill the missing fields', 'Add target start date, end date and priority for the 3 flagged features?', [
      ['Add the missing info', 'fillFeatureFields', true, true],
      ['Proceed without this info', 'featuresNoInfo'],
    ], [{ label: '3 features flagged', detail: '1.3 · 5.3 · 7.2' }]),
  },
]

/* Phase 4 · Stories — decompose the confirmed features, then offer the final
   Jira push. Sprint planning is handed to the scrum master, so the run ends
   here rather than building a sprint grid. */
const BUILD_STORIES: Effect[] = [
  status([
    ['Reading confirmed features', 'done'],
    ['Decomposing 23 features into stories', '58 stories', T.repo],
    ['Writing acceptance criteria for each story', 'done'],
    ['Linking stories to their parent features', 'done'],
    ['Applying the story template', '58 stories'],
  ], 'Stories · decomposing features'),
  { type: 'watch', text: '58 stories drafted', tone: 'ok' },
  artifact('stories.md', 'stories'),
  { type: 'say',
    lines: ['58 stories confirmed. Want me to push them to Jira now?'],
    block: {
      kind: 'sync', title: 'Push the 58 stories to Jira', detail: '58 stories · under 23 features · WFS',
      beat: 'pushStoriesFinal', secondaryLabel: 'Skip', secondaryBeat: 'storiesSkipped',
    },
  },
]

/* The links shown after a successful publish. */
const JIRA_LINKS: BlockSpec = {
  kind: 'links', links: [
    { label: 'WFS board · WireFrame Studio', href: 'https://aava-demo.atlassian.net/jira/software/projects/WFS/boards/1' },
    { label: 'WFS backlog', href: 'https://aava-demo.atlassian.net/jira/software/projects/WFS/boards/1/backlog' },
  ],
}

/* The static half of the stories publish — the confirmation, the success message
   and the links. The optional "push what you skipped" follow-up is spliced on by
   `backlogStoriesPublish`, which can see what the user skipped earlier. */
function storiesPublishBase(): Effect[] {
  return [
    { type: 'watch', text: 'Pushing 58 stories to Jira · WFS', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: '58 stories created · Jira', tone: 'ok' },
    { type: 'say',
      lines: ['Successfully created the stories on Jira. As part of this process, the next step involves sprint planning and is assigned to the scrum master. No more actions on you for now.'],
      block: JIRA_LINKS,
    },
  ]
}

/** Whether each earlier level was published or skipped — read from the retired
    push cards. A skip records `answer: 'proceeded'`; a publish leaves no answer. */
function levelStatus(messages: Message[]): Record<'epics' | 'features', 'published' | 'skipped' | undefined> {
  const out: Record<'epics' | 'features', 'published' | 'skipped' | undefined> = { epics: undefined, features: undefined }
  for (const m of messages ?? []) {
    const b = m.block
    if (b?.kind === 'sync' && m.live === false) {
      const t = b.title.toLowerCase()
      const level = /epic/.test(t) ? 'epics' : /feature/.test(t) ? 'features' : null
      if (level) out[level] = m.answer === 'proceeded' ? 'skipped' : 'published'
    }
  }
  return out
}

/** Which earlier levels the user skipped publishing. Order follows the run. */
function skippedLevels(messages: Message[]): ('epics' | 'features')[] {
  const st = levelStatus(messages)
  return (['epics', 'features'] as const).filter((l) => st[l] === 'skipped')
}

/** A natural-language list: "a", "a and b", "a, b and c". */
function joinList(arr: string[]): string {
  if (arr.length <= 1) return arr[0] ?? ''
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`
}

/** The user skipped the final stories push. The line names what is already on
    Jira and what is still outstanding, so they know exactly where they stand. */
export function backlogStoriesSkipped(messages: Message[]): Effect[] {
  const st = levelStatus(messages)
  const published = (['epics', 'features'] as const).filter((l) => st[l] === 'published')
  // Everything not yet on Jira: the skipped epics/features, plus the stories just skipped.
  const left = [...(['epics', 'features'] as const).filter((l) => st[l] !== 'published'), 'stories']
  const line = published.length === 0
    ? 'Understood — nothing published. Whenever you are ready, you can ask me to publish these to Jira.'
    : `Understood — ${joinList([...published])} ${published.length > 1 ? 'have' : 'has'} been published; ${joinList(left)} ${left.length > 1 ? 'are' : 'is'} left to publish. Whenever you are ready, you can ask me to publish these to Jira.`
  return [{ type: 'say', lines: [line] }]
}

/** The stories publish, aware of what was skipped: after the success message it
    offers to push any epics/features the user skipped earlier. If nothing was
    skipped it simply ends on the success message. Dispatched from useJourney so
    it can see the run's messages. */
export function backlogStoriesPublish(messages: Message[]): Effect[] {
  const skipped = skippedLevels(messages)
  const base = storiesPublishBase()
  if (!skipped.length) return base
  const parts = skipped.map((s) => (s === 'epics' ? '7 epics' : '23 features'))
  const list = parts.join(' & ')
  return [
    ...base,
    { type: 'say',
      lines: [`One thing before you go — you skipped publishing the ${list} earlier. Want me to push ${skipped.length > 1 ? 'them' : 'it'} to Jira now?`],
      block: {
        kind: 'sync', title: `Push the ${list} to Jira`, detail: `${parts.join(' · ')} · project WFS`,
        beat: 'pushSkipped', secondaryLabel: 'Skip', secondaryBeat: 'wrapUpSkipped',
      },
    },
  ]
}

export const BACKLOG_BEATS: Record<string, Effect[]> = {
  /* Phase 1 · Intake. The canvas opens only when the artefact is opened. */
  startIntake: [
    { type: 'watch', text: 'Reading PRD · WireFrame Studio v1.0', tone: 'info' },
    status([
      ['Reading PRD', 'WireFrame Studio v1.0', T.repo],
      ['Parsing document structure and headers', 'done'],
      ['Extracting objectives', '5 found'],
      ['Extracting user roles', '6 found'],
      ['Parsing functional requirements', '28 · 6 cats'],
      ['Extracting non-functional requirements', '5 areas'],
      ['Building intake summary', 'ready'],
    ], 'Intake · reading the PRD'),
    { type: 'watch', text: 'Intake summary ready', tone: 'ok' },
    { type: 'say', lines: [
      'PRD received — WireFrame Studio, v1.0. I found 5 objectives, 6 user roles, 28 functional requirements across 6 categories, and 5 non-functional areas. Before I build anything, here is what I understood.',
    ] },
    artifact('intake.md', 'intake'),
    { type: 'say',
      lines: ['Take a look in the canvas and flag anything I have misread — I will not move on until you confirm.'],
      block: gate(1, 'Confirm the intake summary', 'Does this match your PRD?', [
        ['Yes, this is accurate', 'startEpics', true],
        ['No, something is off', 'refineIntake', false, true],
      ]),
    },
  ],

  /* Loop · the user flagged something in the intake. */
  refineIntake: [
    { type: 'watch', text: 'Applying your intake edits', tone: 'info' },
    status([
      ['Re-reading the PRD against your note', 'done'],
      ['Updating the intake summary', 'done'],
    ], 'Intake · applying your edits'),
    artifact('intake.md', 'intake'),
    { type: 'say',
      lines: ['Folded that in and updated the summary. Have another look — I will move on once it matches your PRD.'],
      block: gate(1, 'Confirm the intake summary', 'Does this match your PRD now?', [
        ['Yes, this is accurate', 'startEpics', true],
        ['Still something off', 'refineIntake', false, true],
      ]),
    },
  ],

  /* Phase 2 · Epics. Gate → Jira push offer → features. */
  startEpics: [
    status([
      ['Clustering 28 requirements by theme', 'done', T.repo],
      ['Drafting Epic 1 · Intelligent Canvas Editor', 'P0'],
      ['Drafting Epic 2 · Component & Template Library', 'P0'],
      ['Drafting Epic 3 · AI-Powered Design Assistant', 'P1'],
      ['Drafting Epic 4 · Real-Time Collaboration', 'P0'],
      ['Drafting Epic 5 · Design System Integration', 'P1'],
      ['Drafting Epic 6 · Prototyping & Export', 'P1'],
      ['Drafting Epic 7 · User Onboarding & Education', 'P2'],
      ['Applying epic template', '7 epics'],
    ], 'Epics · clustering & drafting'),
    { type: 'watch', text: '7 epics drafted', tone: 'ok' },
    artifact('epics.md', 'epics'),
    { type: 'say',
      lines: [
        '7 epics drafted, open in the canvas — each on the same template: Background, Details, Benefits, Assumptions, Priority. Comment on any line, the way you would on code; I will fold every note back in before locking these.',
      ],
      block: gate(3, 'Confirm the epics', 'Are these 7 epics right?', [
        ['Yes, break them into features', 'reviewEpics', true],
        ['Refine the epics', 'refineEpics', false, true],
      ], [{ label: '7 epics', detail: '3× P0 · 3× P1 · 1× P2' }]),
    },
  ],

  refineEpics: [
    status([
      ['Re-reading Epic 3 against your comment', 'done'],
      ['Promoting text-to-wireframe to lead item', 'done'],
      ['Cross-checking all 7 epics against required fields', 'done'],
      ['Epic 6 · target dates', 'filled'],
      ['Epic 7 · phase month', 'set'],
    ], 'Epics · applying your edits'),
    artifact('epics.md', 'epics-fields'),
    { type: 'say',
      lines: [
        'Updated Epic 3 — text-to-wireframe is now the lead item in Details. I also filled the two fields I could not infer earlier: Epic 6 runs Month 7–9, and Epic 7 is marked runs continuously from Month 4. All 7 epics are locked.',
      ],
      block: gate(3, 'Confirm the epics', 'Ready to break these into features?', [
        ['Yes, break them into features', 'reviewEpics', true],
        ['Keep refining', 'refineEpics', false, true],
      ]),
    },
  ],

  /* Epics confirmed — offer the Jira push, then build features either way. */
  reviewEpics: [
    { type: 'watch', text: 'Epics confirmed', tone: 'ok' },
    pushOffer('7 epics', '7 epics · project WFS', 'pushEpics', 'buildFeatures', 'proceed for features creation'),
  ],
  pushEpics: [...pushConfirm('7 epics'), ...BUILD_FEATURES],
  buildFeatures: BUILD_FEATURES,

  /* Loop 1A · the user supplied the missing fields. */
  fillFeatureFields: [
    { type: 'watch', text: 'Applying your dates & priority', tone: 'info' },
    { type: 'say', lines: ['Thanks for the clarification — I will fold those dates and priorities into Feature 1.3, 5.3 and 7.2 and rebuild the list.'] },
    status([
      ['Feature 1.3 · Responsive Device Preview', 'M2–M3 · P1'],
      ['Feature 5.3 · Bi-Directional Sync', 'M5–M6 · P2'],
      ['Feature 7.2 · Contextual AI Tooltips', 'M4–M6 · P2'],
      ['Re-validating all 23 features against required fields', 'complete'],
      ['Applying feature template', '23 features'],
    ], 'Features · applying your edits'),
    { type: 'watch', text: '23 features complete', tone: 'ok' },
    artifact('features.md', 'features'),
    { type: 'say',
      lines: ['Done — the three flagged features now carry target dates and priority: Feature 1.3 runs Month 2–3 at P1, Feature 5.3 runs Month 5–6 at P2, and Feature 7.2 runs Month 4–6 at P2. All 23 features are grouped under their parent epic with Requirement and Acceptance criteria.'],
      block: gate(4, 'Confirm the features', 'Do these 23 features cover it?', [
        ['Yes, decompose into stories', 'reviewFeatures', true],
        ['Refine the features', 'refineFeatures', false, true],
      ], [{ label: '23 features', detail: 'under 7 epics · all fields set' }]),
    },
  ],

  /* Proceed without the info — the gaps doc is already open, so just move on with
     the 3 features left flagged. */
  featuresNoInfo: [
    { type: 'watch', text: 'Keeping the 3 fields flagged', tone: 'info' },
    { type: 'say',
      lines: ['Understood — I will leave Feature 1.3, 5.3 and 7.2 with their gaps highlighted in the doc. They will need target dates and priority before they can enter a sprint.'],
      block: gate(4, 'Confirm the features', 'Ready for stories? (3 features stay flagged)', [
        ['Yes, decompose into stories', 'reviewFeatures', true],
        ['Refine the features', 'refineFeatures', false, true],
      ], [{ label: '23 features', detail: '20 complete · 3 flagged' }]),
    },
  ],

  refineFeatures: [
    status([
      ['Applying your edits', 'done'],
      ['Feature 4.1 · added 10,000-concurrent-user criterion', 'done'],
      ['Feature 6.2 · added Sketch export', 'done'],
    ], 'Features · applying your edits'),
    artifact('features.md', 'features'),
    { type: 'say',
      lines: ['Folded those in — Feature 4.1 now names the 10,000+ concurrent-user target, and Feature 6.2 adds Sketch to the export formats. Features are confirmed.'],
      block: gate(4, 'Confirm the features', 'Ready for stories?', [
        ['Yes, decompose into stories', 'reviewFeatures', true],
        ['Keep refining', 'refineFeatures', false, true],
      ]),
    },
  ],

  /* Features confirmed — offer the Jira push, then build stories either way. */
  reviewFeatures: [
    { type: 'watch', text: 'Features confirmed', tone: 'ok' },
    pushOffer('23 features', '23 features · under 7 epics', 'pushFeatures', 'buildStories', 'proceed for stories creation'),
  ],
  pushFeatures: [...pushConfirm('23 features'), ...BUILD_STORIES],
  buildStories: BUILD_STORIES,

  /* Stories publish. `pushStoriesFinal` is dispatched dynamically from useJourney
     (it needs the run's messages to know what was skipped); the static base here
     is a safety fallback. */
  pushStoriesFinal: storiesPublishBase(),

  /* The user skipped the stories push. Dispatched dynamically from useJourney
     (it names what is already on Jira); this static line is a safety fallback. */
  storiesSkipped: [
    { type: 'say', lines: ['Understood — nothing published. Whenever you are ready, you can ask me to publish these to Jira.'] },
  ],

  /* Publishing the epics/features the user skipped earlier. */
  pushSkipped: [
    { type: 'watch', text: 'Pushing the remaining items to Jira · WFS', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'Remaining items created · Jira', tone: 'ok' },
    { type: 'say',
      lines: ['Done — everything is on Jira now. Sprint planning stays with the scrum master; no more actions on you for now.'],
      block: JIRA_LINKS,
    },
  ],

  wrapUpSkipped: [
    { type: 'say', lines: ['Understood — I left those unpublished. The stories are on Jira and the rest stays saved as editable docs. Let me know if anything changes.'] },
  ],

  /* Scenario · the user provides their own epic/feature format. */
  customFormat: [
    { type: 'watch', text: 'Comparing your format to the team standard', tone: 'info' },
    status([
      ['Reading your attached format', 'done'],
      ['Diffing against the team epic/feature structure', 'off-standard'],
      ['Checking Jira-publish compatibility', 'blocked'],
    ], 'Format check · your structure vs the standard'),
    { type: 'say',
      lines: [
        "I have compared your format to the team's defined epic and feature structure. It does not line up with the standard we publish to Jira with — I can adopt your layout for the docs, but I will not be able to publish those to Jira while they are off-standard.",
      ],
      block: gate(0, 'Use your format?', 'Still want me to generate the epic and feature docs in your format?', [
        ['Yes, use my format', 'applyCustomFormat', true],
        ['Keep the standard', 'keepStandard'],
      ]),
    },
  ],

  applyCustomFormat: [
    { type: 'watch', text: 'Rebuilding docs in your format', tone: 'info' },
    status([
      ['Mapping epics to your table columns', 'done'],
      ['Mapping features to your table columns', 'done'],
      ['Marking both docs off the Jira-publish path', 'flagged'],
    ], 'Reformatting · applying your structure'),
    { type: 'watch', text: 'Custom-format docs ready', tone: 'ok' },
    artifact('epics-custom.md', 'epics-custom'),
    artifact('features-custom.md', 'features-custom'),
    { type: 'say',
      lines: [
        'Done — epics and features rebuilt in your tabular format, open in the canvas. These are saved as editable docs but stay off the Jira-publish path, since they do not match the team standard.',
      ],
    },
  ],

  keepStandard: [
    { type: 'say', lines: ['Kept the standard structure — nothing changed. The published backlog stays as it is.'] },
  ],

  /* Scenario · push the custom docs to Azure DevOps. No connector is wired. */
  pushAdo: [
    { type: 'watch', text: 'Searching for an Azure DevOps connector', tone: 'info' },
    { type: 'say', lines: [], stream: false, block: {
      kind: 'connect', service: 'Azure DevOps', logo: 'azure',
      detail: 'Access Azure Boards & Repos from AAVA', beat: 'adoConnect', state: 'searching',
    } },
    { type: 'wait', ms: 5000 },
    { type: 'connectState', state: 'offer' },
    { type: 'watch', text: 'No Azure DevOps connector found', tone: 'warn' },
    { type: 'say', lines: ["I could not find an Azure DevOps connector in your workspace. Connect it and I will push the epics and user stories straight to Azure Boards."] },
  ],

  adoConnect: [
    { type: 'connectState', state: 'connecting' },
    { type: 'watch', text: 'Connecting to Azure DevOps', tone: 'info' },
    { type: 'wait', ms: 10000 },
    { type: 'connectState', state: 'done' },
    { type: 'watch', text: 'Connected · Azure DevOps', tone: 'ok' },
    { type: 'say', lines: ['Connected to Azure DevOps successfully.'] },
    { type: 'watch', text: 'Pushing to Azure Boards', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'Work items created · Azure Boards', tone: 'ok' },
    { type: 'say', lines: ['Pushed to Azure Boards — epics and user stories created as work items in your project, in your custom format. Let me know if you need any help.'] },
  ],
}

/* Typed messages inside the backlog run. Two follow-up scenarios are recognised —
   supplying a custom format, and pushing to Azure DevOps — everything else is a
   light acknowledgement that folds the comment into the current draft. */
export function backlogRouter(text: string): Effect[] | null {
  if (/\b(azure|ado|a\.?d\.?o\.?|devops|dev ops|boards)\b/i.test(text)) return BACKLOG_BEATS.pushAdo
  if (/\b(format|structure|restructure|tabular|table|my own|layout|template)\b/i.test(text)) return BACKLOG_BEATS.customFormat
  return null
}

/* The fallback acknowledgement — a comment that matches no scenario re-lands on
   the current draft rather than dead-ending. */
export function backlogReply(): Effect[] {
  return [{ type: 'say', lines: [
    'Noted — I have folded that into the current draft in the canvas. Use the buttons above when you are ready to move to the next level.',
  ] }]
}
