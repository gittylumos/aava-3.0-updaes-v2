/* PRD to Stories V2 — a second, parallel demo of the SAME PRD-to-backlog run,
 * kept deliberately separate from backlogFlow.ts and its shipped "rewind"
 * revise mechanism (supersede downstream, reopen the gate, re-run the same
 * process automatically, no extra confirmation once the edit is sent).
 *
 * This one recreates the earlier, richer "compensating update" experience
 * from the design research — the one built and then simplified away before
 * the main flow shipped:
 *   1. Every answered, revisable gate shows "Revise this step" (epics AND
 *      features here).
 *   2. Clicking it opens a live-computed impact alert — before anything is
 *      released to Jira it just names what would be invalidated; once
 *      something downstream has actually been published, it names EXACTLY
 *      which levels (Epics / Features / Stories) are already released and
 *      warns that AAVA will amend those released items with a compensating
 *      update rather than delete them, pausing for approval before touching
 *      Jira.
 *   3. Confirming ("Continue to edit") reopens the gate in place as an
 *      editable draft ("Change your decision"), not an immediate re-run.
 *   4. Sending ("Revise & regenerate") invalidates downstream (kept,
 *      collapsed — never deleted) and regenerates it — but ONLY as far as
 *      the run had actually progressed before the revise. If nothing beyond
 *      the gate being revised was ever built, this is a plain free-flow
 *      edit: no alert, no compensating gate, it just re-runs the SAME
 *      forward pipeline with the new value (identical to the main flow's own
 *      logic). A compensating-transaction gate only appears once the
 *      regeneration reaches a level that had actually been PUBLISHED to
 *      Jira — and even then, any levels beyond that point which were never
 *      released keep building normally afterward, ending on their own plain
 *      "push to Jira" offer rather than folding into the compensating gate.
 *
 * The main "PRD to Stories" card, BACKLOG_BEATS, and every gate in
 * backlogFlow.ts are untouched — this whole flow lives in its own beat
 * namespace (`V2_BEATS`, plus a few message-aware functions dispatched by
 * name from useJourney.ts the same way `pushStoriesFinal` already is for the
 * main flow), and the richer copy/labels it needs on `gate()` are optional
 * fields nothing in backlogFlow.ts ever sets.
 */
import type { BlockSpec, Effect, Message } from '../state/types'
import { T } from '../state/timing'
import { status, artifact, gate, pushOffer, pushConfirm } from './backlogFlow'

const REVISE_COPY = {
  releasedImpactNote: true,
  reviseConfirmLabel: 'Continue to edit',
  reviseLabel: 'Change your decision',
  reviseSendLabel: 'Revise & regenerate',
}

/* Default (non-revise) gate shapes — kept byte-identical in structure to the
   main flow's own gates (a primary confirm + a secondary "Refine…" free-text
   option), just parametrised so a refine loop can re-show the same gate with
   an updated question. Nothing about the FIRST-time interaction on a V2 gate
   should read as stripped-down next to its main-flow counterpart — only
   what happens once an answered gate is revised is meant to differ. */
function intakeGateV2(question: string, refineBeat: string): BlockSpec {
  return gate(1, 'Confirm the intake summary', question, [
    ['Yes, this is accurate', 'startEpicsV2', true],
    ['No, something is off', refineBeat, false, true],
  ])
}

function epicsGateV2(question: string, refineBeat: string): BlockSpec {
  return gate(2, 'Confirm the epics', question, [
    ['Yes, break them into features', 'reviewEpicsV2', true],
    ['Refine the epics', refineBeat, false, true],
  ], [{ label: '7 epics', detail: '3× P0 · 3× P1 · 1× P2' }],
    { beat: 'reviseEpicsV2', impact: [{ label: '23 Features', doc: 'features' }, { label: '58 Stories', doc: 'stories' }], ...REVISE_COPY })
}

function featuresGateV2(question: string, reviewBeat: string, refineBeat: string, storiesLabel: string): BlockSpec {
  return gate(3, 'Confirm the features', question, [
    ['Yes, decompose into stories', reviewBeat, true],
    ['Refine the features', refineBeat, false, true],
  ], undefined,
    { beat: 'reviseFeaturesV2', impact: [{ label: storiesLabel, doc: 'stories' }], ...REVISE_COPY })
}

/* The task-card opening — identical to the main flow's `backlogTaskOpening`:
   capability and plan land as quiet collapsed records, the intake accordion
   is already complete (ms 0), and the run parks on the intake gate. The
   initial interaction is deliberately unchanged from the main card — the
   divergence only starts once something gets revised after release. */
export function backlogTaskOpeningV2(): Effect[] {
  return [
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
        { title: 'Draft epics', detail: 'Cluster requirements into themed epics — pause for review' },
        { title: 'Break into features', detail: 'Decompose each confirmed epic — pause for review' },
        { title: 'Write user stories', detail: 'Draft stories from the confirmed features' },
        { title: 'Publish to Jira', detail: 'Push the backlog; compensate in place for any later scope change' },
      ],
    } },
    { type: 'watch', text: 'Reading PRD · WireFrame Generation v1.0', tone: 'info' },
    status([
      ['Reading PRD', 'WireFrame Generation v1.0', 0],
      ['Parsing document structure and headers', 'done', 0],
      ['Extracting objectives', '5 found', 0],
      ['Extracting user roles', '6 found', 0],
      ['Parsing functional requirements', '28 · 6 cats', 0],
      ['Extracting non-functional requirements', '5 areas', 0],
      ['Building intake summary', 'ready', 0],
    ], 'Intake · reading the PRD'),
    { type: 'watch', text: 'Intake summary ready', tone: 'ok' },
    { type: 'say', stream: false, lines: [
      'PRD received — WireFrame Generation, v1.0. I found 5 objectives, 6 user roles, 28 functional requirements across 6 categories, and 5 non-functional areas. Before I build anything, here is what I understood.',
    ] },
    artifact('intake.md', 'intake'),
    { type: 'setDoc', doc: 'intake' },
    { type: 'say', stream: false,
      lines: ['Take a look in the canvas and flag anything I have misread — I will not move on until you confirm.'],
      block: intakeGateV2('Does this match your PRD?', 'refineIntakeV2'),
    },
  ]
}

const BUILD_EPICS_V2: Effect[] = [
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
  { type: 'say', lines: [
    '7 epics drafted, open in the canvas — each on the same template: Background, Details, Benefits, Assumptions, Priority.',
  ] },
  artifact('epics.md', 'epics'),
  { type: 'say', lines: [], block: epicsGateV2('Are these 7 epics right?', 'refineEpicsV2') },
]

const BUILD_FEATURES_V2: Effect[] = [
  status([
    ['Reading confirmed epics', 'done'],
    ['Decomposing Epic 01', '4 features'],
    ['Decomposing Epic 02', '4 features'],
    ['Decomposing Epic 03', '3 features'],
    ['Decomposing Epic 04', '4 features'],
    ['Decomposing Epic 05', '3 features'],
    ['Decomposing Epic 06', '3 features'],
    ['Decomposing Epic 07', '2 features'],
    ['Applying feature template', '23 features'],
  ], 'Features · decomposing epics'),
  { type: 'watch', text: '23 features drafted', tone: 'ok' },
  { type: 'say', lines: [
    '23 features across the 7 epics, open in the canvas — each linked to its parent epic.',
  ] },
  artifact('features.md', 'features'),
  { type: 'say', lines: [], block: featuresGateV2('Are these 23 features right?', 'reviewFeaturesV2', 'refineFeaturesV2', '58 Stories') },
]

const BUILD_STORIES_V2: Effect[] = [
  status([
    ['Reading confirmed features', 'done'],
    ['Decomposing 23 features into stories', '58 stories', T.repo],
    ['Writing acceptance criteria for each story', 'done'],
    ['Linking stories to their parent features', 'done'],
    ['Applying the story template', '58 stories'],
  ], 'Stories · decomposing features'),
  { type: 'watch', text: '58 stories drafted', tone: 'ok' },
  { type: 'say', lines: [
    '58 stories decomposed from the 23 confirmed features, each with acceptance criteria and linked to its parent — all open in the canvas.',
  ] },
  artifact('stories.md', 'stories'),
  { type: 'say', lines: ['Want me to push them to Jira now?'],
    block: {
      kind: 'sync', title: 'Push the 58 stories to Jira', detail: '58 stories · under 23 features · WFS',
      beat: 'pushStoriesFinalV2', secondaryLabel: 'Skip', secondaryBeat: 'storiesSkippedV2', revisable: true,
    },
  },
]

/* ── The 9-epic path — reached from `reviseEpicsV2` no matter how far the run
   had progressed. Split into an INTERACTIVE half (a fresh gate + push offer,
   used for whichever level had genuinely never been built before — that's
   forward progress, not a compensating fix) and an AUTO half (no re-gate,
   used for a level that was already built once and is simply being
   regenerated in place ahead of a compensating-transaction gate). ── */

const RECLUSTER_EPICS_9: Effect[] = [
  { type: 'watch', text: 'Re-clustering 28 requirements into 9 epics', tone: 'info' },
  status([
    ['Re-reading the 28 requirements against your change', 'done', T.repo],
    ['Splitting Epic 01 → Canvas Editor + Responsive Preview', 'Epic 08'],
    ['Promoting text-to-wireframe to its own epic', 'Epic 09'],
    ['Re-validating all 9 epics against required fields', '9 epics'],
  ], 'Epics · re-clustering into 9'),
  { type: 'watch', text: '9 epics drafted (was 7)', tone: 'ok' },
  { type: 'say', stream: false, lines: [
    'Epics regenerated to **9 epics** — I split the Canvas Editor into a dedicated Responsive & Multi-Device Preview epic (E08), and promoted text-to-wireframe generation to its own epic (E09). The other seven keep their scope.',
  ] },
  artifact('epics.md (v2)', 'epics-revised'),
  { type: 'setDoc', doc: 'epics-revised' },
  { type: 'setCanvasView', view: 'doc' },
]

const REGEN_FEATURES_9: Effect[] = [
  { type: 'watch', text: 'Regenerating features under the new epic split', tone: 'info' },
  status([
    ['Reading the 9 confirmed epics', 'done'],
    ['Decomposing all 9 epics', '29 features'],
    ['Decomposing Epic 08 · Responsive Preview', '3 features'],
    ['Decomposing Epic 09 · Text-to-Wireframe', '3 features'],
    ['Checking each feature against required fields', 'complete'],
  ], 'Features · decomposing 9 epics'),
  { type: 'watch', text: '29 features drafted (was 23)', tone: 'ok' },
  { type: 'say', stream: false, lines: [
    '29 features across the 9 epics — the 6 new ones come from Epic 08 (Responsive Preview) and Epic 09 (Text-to-Wireframe). Open in the canvas.',
  ] },
  artifact('features.md', 'features'),
]

const REGEN_STORIES_9: Effect[] = [
  { type: 'watch', text: 'Regenerating stories under the new features', tone: 'info' },
  status([
    ['Reading the 29 confirmed features', 'done'],
    ['Decomposing 29 features into stories', '72 stories', T.repo],
    ['Writing acceptance criteria for each story', 'done'],
    ['Linking stories to their parent features', 'done'],
  ], 'Stories · decomposing 29 features'),
  { type: 'watch', text: '72 stories drafted (was 58)', tone: 'ok' },
  { type: 'say', lines: [
    '72 stories decomposed from the 29 confirmed features, each with acceptance criteria and linked to its parent — all open in the canvas.',
  ] },
  artifact('stories.md', 'stories'),
]

/* The compensating-transaction gate — the single HITL block that halts
   before AAVA is allowed to touch anything already released. Reused for both
   the epics- and features-triggered compensating updates; only the question
   text and the beat it fires differ. */
function compensatingGate(step: number, question: string, beat: string): Effect {
  return { type: 'say', lines: ['Before I touch what is already live on Jira, here is exactly what this compensating update will do.'],
    block: {
      kind: 'decision', variant: 'action', step, icon: 'shield',
      title: 'Updates on the published features', question,
      options: [{ label: 'Apply to Jira', beat, primary: true }],
    },
  }
}

const EPICS_COMPENSATING_QUESTION =
  'This regenerates the backlog around 9 epics instead of 7. On Jira I will create Epic 08 (Responsive & Multi-Device Preview) and Epic 09 (Text-to-Wireframe Generation), re-parent 6 features onto them, and reopen the release from Done back to In Progress so QA can pick up the new scope. Nothing already released gets deleted or silently rewritten.'

/* Interactive continuations for whichever level had never been built before
   the revise — identical in shape to the first-time creation gates above,
   just renumbered under 9 epics. Reachable both from a fresh "nothing
   released yet" revise and from the far side of a compensating update, once
   whatever WAS released is patched and AAVA moves on to genuinely new work. */
const BUILD_FEATURES_9V2: Effect[] = [
  ...REGEN_FEATURES_9,
  { type: 'say', lines: [], block: featuresGateV2('Are these 29 features right?', 'reviewFeatures9V2', 'refineFeatures9V2', '72 Stories') },
]

const BUILD_STORIES_9V2: Effect[] = [
  ...REGEN_STORIES_9,
  { type: 'say', lines: ['Want me to push them to Jira now?'],
    block: {
      kind: 'sync', title: 'Push the 72 stories to Jira', detail: '72 stories · under 29 features · WFS',
      beat: 'pushStories9FinalV2', secondaryLabel: 'Skip', secondaryBeat: 'storiesSkippedV2', revisable: true,
    },
  },
]

/* ── Message-history helpers — shared between the revise beats (how far to
   regenerate) and useJourney.ts's rewind-confirm modal (what to warn about). ── */

type Level = 'epics' | 'features' | 'stories'

/** How far the run had actually progressed before this revise — the deepest
    document that was ever drafted, regardless of whether it was published. */
function furthestLevel(messages: Message[]): Level {
  if (messages.some((m) => m.block?.kind === 'document' && m.block.doc === 'stories')) return 'stories'
  if (messages.some((m) => m.block?.kind === 'document' && m.block.doc === 'features')) return 'features'
  return 'epics'
}

/** Which levels were actually PUBLISHED (an answered, non-skipped `sync`
    card) — a level can only appear here if it was also built, so this is
    always a subset of what `furthestLevel` implies. Exported so
    useJourney.ts's rewind-confirm modal can name the same levels in its
    live-computed warning, scoped to messages after the gate being revised. */
export function releasedLevels(messages: Message[]): Set<Level> {
  const out = new Set<Level>()
  for (const m of messages) {
    if (m.block?.kind !== 'sync' || m.live !== false || m.answer === 'proceeded') continue
    const t = m.block.title.toLowerCase()
    if (/epic/.test(t)) out.add('epics')
    else if (/feature/.test(t)) out.add('features')
    else if (/stor/.test(t)) out.add('stories')
  }
  return out
}

/** The rewind-confirm modal's extra amber paragraph, naming exactly which
    levels are already on Jira — "Epics are…" vs "Epics and Features are…" —
    or undefined if nothing relevant has been published yet. */
export function describeReleasedNote(levels: Set<Level>): string | undefined {
  if (!levels.size) return undefined
  const order: Level[] = ['epics', 'features', 'stories']
  const names = order.filter((l) => levels.has(l)).map((l) => l === 'epics' ? 'Epics' : l === 'features' ? 'Features' : 'Stories')
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  return `${list} are already published to Jira — I will amend those items with a compensating update rather than delete them, and will pause for your approval before touching Jira.`
}

export const V2_BEATS: Record<string, Effect[]> = {
  startEpicsV2: BUILD_EPICS_V2,

  /* "No, something is off" / "Refine the X" loops — the secondary option on
     every default gate, matching the main flow's own pattern. Folds the note
     in and re-shows the same gate rather than fabricating new content, since
     the point of this demo is the revise/compensating experience, not a
     parallel refine narrative. */
  refineIntakeV2: [
    { type: 'watch', text: 'Applying your note', tone: 'info' },
    { type: 'say', lines: ['Noted — folded that into the intake summary. Take another look and confirm when ready.'] },
    { type: 'say', lines: [], block: intakeGateV2('Does this match your PRD now?', 'refineIntakeV2') },
  ],
  refineEpicsV2: [
    { type: 'watch', text: 'Applying your note', tone: 'info' },
    { type: 'say', lines: ['Folded that into the epics — take another look.'] },
    { type: 'say', lines: [], block: epicsGateV2('Are these 7 epics right now?', 'refineEpicsV2') },
  ],
  refineFeaturesV2: [
    { type: 'watch', text: 'Applying your note', tone: 'info' },
    { type: 'say', lines: ['Folded that into the features — take another look.'] },
    { type: 'say', lines: [], block: featuresGateV2('Are these 23 features right now?', 'reviewFeaturesV2', 'refineFeaturesV2', '58 Stories') },
  ],
  refineFeatures9V2: [
    { type: 'watch', text: 'Applying your note', tone: 'info' },
    { type: 'say', lines: ['Folded that into the features — take another look.'] },
    { type: 'say', lines: [], block: featuresGateV2('Are these 29 features right now?', 'reviewFeatures9V2', 'refineFeatures9V2', '72 Stories') },
  ],

  reviewEpicsV2: [
    { type: 'watch', text: 'Epics confirmed', tone: 'ok' },
    pushOffer('7 epics', '7 epics · project WFS', 'pushEpicsV2', 'buildFeaturesV2', 'proceed for features creation'),
  ],
  pushEpicsV2: [...pushConfirm('7 epics'), ...BUILD_FEATURES_V2],
  buildFeaturesV2: BUILD_FEATURES_V2,

  reviewFeaturesV2: [
    { type: 'watch', text: 'Features confirmed', tone: 'ok' },
    pushOffer('23 features', '23 features · under 7 epics', 'pushFeaturesV2', 'buildStoriesV2', 'proceed for stories creation'),
  ],
  pushFeaturesV2: [...pushConfirm('23 features'), ...BUILD_STORIES_V2],
  buildStoriesV2: BUILD_STORIES_V2,

  pushStoriesFinalV2: [
    { type: 'watch', text: 'Pushing 58 stories to Jira · WFS', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: '58 stories created · Jira', tone: 'ok' },
    { type: 'say', lines: ['Done — the epics, features and stories are all released on Jira now.'] },
    { type: 'taskDone', note: 'Backlog released · 7 epics, 23 features, 58 stories on Jira' },
  ],
  storiesSkippedV2: [
    { type: 'say', lines: ['Understood — nothing published yet. Whenever you are ready, you can ask me to publish these to Jira.'] },
  ],

  /* The 9-epic path's own forward continuations — same shape as the 7-epic
     ones above, only the numbers and beat names change. Reached both from a
     fresh "nothing released yet" epics revise (straight from `reviseEpicsV2`)
     and from the far side of a compensating update whose features/stories
     had never been built before. */
  pushEpics9V2: [...pushConfirm('9 epics'), ...BUILD_FEATURES_9V2],
  buildFeatures9V2: BUILD_FEATURES_9V2,
  reviewFeatures9V2: [
    { type: 'watch', text: 'Features confirmed', tone: 'ok' },
    pushOffer('29 features', '29 features · under 9 epics', 'pushFeatures9V2', 'buildStories9V2', 'proceed for stories creation'),
  ],
  pushFeatures9V2: [...pushConfirm('29 features'), ...BUILD_STORIES_9V2],
  buildStories9V2: BUILD_STORIES_9V2,
  pushStories9FinalV2: [
    { type: 'watch', text: 'Pushing 72 stories to Jira · WFS', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: '72 stories created · Jira', tone: 'ok' },
    { type: 'say', lines: ['Done — the epics, features and stories are all released on Jira now.'] },
    { type: 'taskDone', note: 'Backlog released · 9 epics, 29 features, 72 stories on Jira' },
  ],
}

/* ── Message-aware revise/apply beats — dispatched by name from
   useJourney.ts (reviseSend / runBeat), the same pattern the main flow
   already uses for `pushStoriesFinal`/`storiesSkipped`, since only the
   current message history can say how far the run had actually gone. ── */

/** Revising the epics gate. Always re-clusters to 9 epics; how far the
    regeneration continues from there depends entirely on what was already
    there before: nothing further if features/stories were never built (a
    plain free-flow edit, straight back into the normal forward pipeline);
    an auto-regenerate through whatever HAD been built, halting at a
    compensating-transaction gate only if something along the way was
    actually released — after which anything genuinely new keeps building
    normally. */
export function reviseEpicsV2(messages: Message[]): Effect[] {
  const level = furthestLevel(messages)
  const released = releasedLevels(messages)
  const out: Effect[] = [...RECLUSTER_EPICS_9]

  if (level === 'epics') {
    out.push({ type: 'watch', text: '9 epics confirmed', tone: 'ok' })
    out.push(pushOffer('9 epics', '9 epics · project WFS', 'pushEpics9V2', 'buildFeatures9V2', 'proceed for features creation'))
    return out
  }

  out.push(...REGEN_FEATURES_9)
  if (level === 'features') {
    if (released.has('epics')) {
      out.push(compensatingGate(4, EPICS_COMPENSATING_QUESTION, 'applyEpicsCompensatingUpdateV2'))
    } else {
      out.push({ type: 'watch', text: '29 features confirmed', tone: 'ok' })
      out.push(pushOffer('29 features', '29 features · under 9 epics', 'pushFeatures9V2', 'buildStories9V2', 'proceed for stories creation'))
    }
    return out
  }

  out.push(...REGEN_STORIES_9)
  if (released.has('epics') || released.has('features')) {
    out.push(compensatingGate(4, EPICS_COMPENSATING_QUESTION, 'applyEpicsCompensatingUpdateV2'))
  } else {
    out.push({ type: 'say', lines: ['Want me to push them to Jira now?'],
      block: { kind: 'sync', title: 'Push the 72 stories to Jira', detail: '72 stories · under 29 features · WFS',
        beat: 'pushStories9FinalV2', secondaryLabel: 'Skip', secondaryBeat: 'storiesSkippedV2', revisable: true },
    })
  }
  return out
}

/** Applying the epics-triggered compensating update. Only ever reached once
    features (and maybe stories) had already been regenerated above, so this
    picks up exactly where that left off: if stories were never built, keep
    going — normal forward progress, no further compensating needed; if
    stories already existed too, there is nothing left to build. */
export function applyEpicsCompensatingUpdateV2(messages: Message[]): Effect[] {
  const level = furthestLevel(messages)
  const base: Effect[] = [
    { type: 'watch', text: 'Creating Epic 08 & 09 · re-parenting features · reopening release', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'Compensating update applied · release reopened', tone: 'ok' },
    { type: 'say', stream: false, lines: [
      'Done — Jira now reflects **9 epics** and **29 features**. I created Epic 08 and Epic 09, re-parented the affected features onto them, and reopened the release from Done back to In Progress so QA can pick up the new scope before it closes again. Everything else that was already released stays exactly as it was.',
    ] },
  ]
  if (level === 'stories') return [...base, { type: 'taskDone', note: 'Compensating update applied to the released Jira backlog · 9 epics' }]
  return [...base, ...BUILD_STORIES_9V2]
}

/** Revising the features gate. Always regenerates stories; a compensating
    gate only appears if features (or an already-published set of stories)
    were released — otherwise it is a plain regenerate straight back into a
    normal "push to Jira" offer. */
export function reviseFeaturesV2(messages: Message[]): Effect[] {
  const released = releasedLevels(messages)
  const relevant = released.has('features') || released.has('stories')
  const out: Effect[] = [
    { type: 'watch', text: 'Regenerating stories from your change', tone: 'info' },
    status([
      ['Reading your revised features', 'done'],
      ['Regenerating the user stories', '58 stories', T.repo],
      ['Re-linking every story to its parent', 'done'],
    ], 'Stories · regenerating'),
    { type: 'watch', text: 'Stories regenerated', tone: 'ok' },
    { type: 'say', lines: ['Regenerated the 58 user stories from your revised features — the previous set is kept as the superseded record above.'] },
    artifact('stories.md', 'stories'),
  ]
  if (relevant) {
    out.push(compensatingGate(5,
      'This regenerates the 58 stories under your revised features. On Jira I will amend the affected story tickets in place rather than recreate them, and leave everything else untouched.',
      'applyFeaturesCompensatingUpdateV2'))
  } else {
    out.push({ type: 'say', lines: ['Want me to push them to Jira now?'],
      block: { kind: 'sync', title: 'Push the 58 stories to Jira', detail: '58 stories · WFS',
        beat: 'pushStoriesFinalV2', secondaryLabel: 'Skip', secondaryBeat: 'storiesSkippedV2', revisable: true },
    })
  }
  return out
}

/** Applying the features-triggered compensating update — always the end of
    the line (there is nothing beyond stories), so this always closes the
    task. */
export function applyFeaturesCompensatingUpdateV2(): Effect[] {
  return [
    { type: 'watch', text: 'Amending affected story tickets on Jira', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'Compensating update applied', tone: 'ok' },
    { type: 'say', lines: ['Done — the affected story tickets are amended on Jira in place. Everything else already released stays exactly as it was.'] },
    { type: 'taskDone', note: 'Compensating update applied to the released Jira backlog · features revised' },
  ]
}
