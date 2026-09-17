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
 *      something downstream has actually been published, it adds a warning
 *      that AAVA will amend those released items with a compensating update
 *      rather than delete them, and will pause for approval before touching
 *      Jira.
 *   3. Confirming ("Continue to edit") reopens the gate in place as an
 *      editable draft ("Change your decision"), not an immediate re-run.
 *   4. Sending ("Revise & regenerate") invalidates downstream (kept,
 *      collapsed — never deleted), regenerates it, and — unlike the main
 *      flow — HALTS at a dedicated compensating-transaction gate naming the
 *      exact Jira changes before AAVA is allowed to touch what's released.
 *
 * The main "PRD to Stories" card, BACKLOG_BEATS, and every gate in
 * backlogFlow.ts are untouched — this whole flow lives in its own beat
 * namespace (`V2_BEATS`), and the richer copy/labels it needs on `gate()`
 * are optional fields nothing in backlogFlow.ts ever sets.
 */
import type { Effect } from '../state/types'
import { T } from '../state/timing'
import { status, artifact, gate, pushOffer, pushConfirm } from './backlogFlow'

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
      block: gate(1, 'Confirm the intake summary', 'Does this match your PRD?', [
        ['Yes, this is accurate', 'startEpicsV2', true],
      ]),
    },
  ]
}

/* Shared copy for the "amber impact alert" once something is released — the
   modal only shows this if something downstream was actually published (see
   `openReviseModal` in useJourney.ts), so a revise BEFORE anything is on
   Jira still reads as the plain "will be marked invalid" list. */
const RELEASED_NOTE =
  'Some of this was already published to Jira and released — I will amend those items with a compensating update rather than delete them, and will pause for your approval before touching Jira.'

const REVISE_COPY = {
  releasedImpactNote: RELEASED_NOTE,
  reviseConfirmLabel: 'Continue to edit',
  reviseLabel: 'Change your decision',
  reviseSendLabel: 'Revise & regenerate',
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
  { type: 'say', lines: [],
    block: gate(2, 'Confirm the epics', 'Are these 7 epics right?', [
      ['Yes, break them into features', 'reviewEpicsV2', true],
    ], [{ label: '7 epics', detail: '3× P0 · 3× P1 · 1× P2' }],
      { beat: 'reviseEpicsV2', impact: [{ label: '23 Features', doc: 'features' }, { label: '58 Stories', doc: 'stories' }], ...REVISE_COPY }),
  },
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
  { type: 'say', lines: [],
    block: gate(3, 'Confirm the features', 'Are these 23 features right?', [
      ['Yes, decompose into stories', 'reviewFeaturesV2', true],
    ], undefined,
      { beat: 'reviseFeaturesV2', impact: [{ label: '58 Stories', doc: 'stories' }], ...REVISE_COPY }),
  },
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

export const V2_BEATS: Record<string, Effect[]> = {
  startEpicsV2: BUILD_EPICS_V2,

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

  /* The flagship: revising the epics gate AFTER release. Regenerates the same
     9-epics/29-features/72-stories content the main flow uses, but — unlike
     `reviseEpics` there — never auto-pushes anything. It halts at a
     compensating-transaction gate naming exactly what will change on the
     already-released Jira backlog, and waits for explicit approval. */
  reviseEpicsV2: [
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
    { type: 'watch', text: 'Regenerating stories under the new features', tone: 'info' },
    status([
      ['Reading the 29 confirmed features', 'done'],
      ['Decomposing 29 features into stories', '72 stories', T.repo],
      ['Writing acceptance criteria for each story', 'done'],
      ['Linking stories to their parent features', 'done'],
    ], 'Stories · decomposing 29 features'),
    { type: 'watch', text: '72 stories drafted (was 58)', tone: 'ok' },
    { type: 'say', lines: [
      '72 stories decomposed from the 29 confirmed features, each with acceptance criteria and linked to its parent — all open in the canvas, kept as drafts until the compensating update below is approved.',
    ] },
    artifact('stories.md', 'stories'),
    { type: 'say', lines: ['Before I touch what is already live on Jira, here is exactly what this compensating update will do.'],
      block: {
        kind: 'decision', variant: 'action', step: 4, icon: 'shield',
        title: 'Update the released Jira backlog?',
        question: 'This regenerates the backlog around 9 epics instead of 7. On Jira I will create Epic 08 (Responsive & Multi-Device Preview) and Epic 09 (Text-to-Wireframe Generation), re-parent 6 features onto them, and reopen the release from Done back to In Progress so QA can pick up the new scope. Nothing already released gets deleted or silently rewritten.',
        options: [{ label: 'Apply to Jira', beat: 'applyEpicsCompensatingUpdateV2', primary: true }],
      },
    },
  ],
  applyEpicsCompensatingUpdateV2: [
    { type: 'watch', text: 'Creating Epic 08 & 09 · re-parenting 6 features · reopening release', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'Compensating update applied · release reopened', tone: 'ok' },
    { type: 'say', stream: false, lines: [
      'Done — Jira now reflects **9 epics** and **29 features**. I created Epic 08 and Epic 09, re-parented the 6 affected features onto them, and reopened the release from Done back to In Progress so QA can pick up the new scope before it closes again. Everything else that was already released stays exactly as it was.',
    ] },
    { type: 'taskDone', note: 'Compensating update applied to the released Jira backlog · 9 epics' },
  ],

  /* Revising the features gate after release — the same primitive, applied
     one level down: only the stories regenerate, and the compensating gate
     only needs to amend the affected story tickets rather than restructure
     epics. */
  reviseFeaturesV2: [
    { type: 'watch', text: 'Regenerating stories from your change', tone: 'info' },
    status([
      ['Reading your revised features', 'done'],
      ['Regenerating the user stories', '58 stories', T.repo],
      ['Re-linking every story to its parent', 'done'],
    ], 'Stories · regenerating'),
    { type: 'watch', text: 'Stories regenerated', tone: 'ok' },
    { type: 'say', lines: ['Regenerated the 58 user stories from your revised features — the previous set is kept as the superseded record above.'] },
    artifact('stories.md', 'stories'),
    { type: 'say', lines: ['Before I touch what is already live on Jira, here is exactly what this compensating update will do.'],
      block: {
        kind: 'decision', variant: 'action', step: 5, icon: 'shield',
        title: 'Update the released Jira backlog?',
        question: 'This regenerates the 58 stories under your revised features. On Jira I will amend the affected story tickets in place rather than recreate them, and leave everything else untouched.',
        options: [{ label: 'Apply to Jira', beat: 'applyFeaturesCompensatingUpdateV2', primary: true }],
      },
    },
  ],
  applyFeaturesCompensatingUpdateV2: [
    { type: 'watch', text: 'Amending affected story tickets on Jira', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'Compensating update applied', tone: 'ok' },
    { type: 'say', lines: ['Done — the affected story tickets are amended on Jira in place. Everything else already released stays exactly as it was.'] },
    { type: 'taskDone', note: 'Compensating update applied to the released Jira backlog · features revised' },
  ],
}
