/* PRD to Stories V2 — a second, parallel demo of the SAME PRD-to-backlog run,
 * kept deliberately separate from backlogFlow.ts and its shipped "rewind"
 * revise mechanism (supersede downstream, reopen the gate, re-run the same
 * process). This one recreates the earlier "compensating update" experience
 * from the design research: instead of a person rewinding an answered gate,
 * AAVA itself notices a scope change against the PRD and names the exact
 * business-level fix in ONE HITL card — "7 epics will become 9" — with no
 * modal, no supersede, no re-run. Applying it patches only what changed
 * (2 new epics, 3 re-parented features) and leaves everything else as-is.
 *
 * The main "PRD to Stories" card, BACKLOG_BEATS and the rewind mechanism are
 * untouched — this whole flow lives in its own beat namespace (`V2_BEATS`)
 * so the two experiences never collide.
 */
import type { Effect, ToolStep } from '../state/types'
import type { BacklogDoc } from './backlog'
import { T } from '../state/timing'

const GEN = 650

/** A status checklist — spinner → ✓, folded into a titled accordion. */
function status(steps: [label: string, result: string, ms?: number][], title?: string): Effect {
  const toolSteps: ToolStep[] = steps.map(([label, result, ms]) => ({ label, result, source: 'RUN', ms: ms ?? GEN }))
  return { type: 'tools', steps: toolSteps, title }
}

/** A generated-artefact card — filename + Open, which reveals it in the canvas. */
function artifact(name: string, doc: BacklogDoc): Effect {
  return { type: 'say', lines: [], stream: false, block: { kind: 'document', name, format: 'MD', doc } }
}

/* The task-card opening — this run was matched and its intake already ran
   before Raman arrived (same convention as `backlogTaskOpening`): capability
   and plan land as quiet collapsed records, the intake accordion is already
   complete (ms 0), and the run parks on the intake gate. */
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
        { title: 'Break into features', detail: 'Decompose each confirmed epic' },
        { title: 'Reconcile against the PRD', detail: 'Catch scope changes before they reach stories' },
        { title: 'Publish to Jira', detail: 'Push the backlog, compensating for any scope change along the way' },
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
      block: {
        kind: 'decision', variant: 'action', step: 1, icon: 'person',
        title: 'Confirm the intake summary', question: 'Does this match your PRD?',
        options: [{ label: 'Yes, this is accurate', beat: 'startEpicsV2', primary: true }],
      },
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
  { type: 'say', lines: [],
    block: {
      kind: 'decision', variant: 'action', step: 2, icon: 'person',
      title: 'Confirm the epics', question: 'Are these 7 epics right? I will push them to Jira and continue to features.',
      summary: [{ label: '7 epics', detail: '3× P0 · 3× P1 · 1× P2' }],
      options: [{ label: 'Yes, push to Jira and continue', beat: 'pushEpicsV2', primary: true }],
    },
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
  /* The compensating-update trigger — scripted, not user-initiated. AAVA
     reconciles the fresh backlog against the PRD on its own and surfaces the
     scope gap as ONE inline caution line followed by ONE HITL card, rather
     than waiting for someone to revise an answered gate. */
  { type: 'say', lines: ['Cross-checking this backlog against the latest PRD comments before handing off to stories…'] },
  { type: 'watch', text: 'Scope gap found · 2 requirements do not fit the confirmed epics', tone: 'warn' },
  { type: 'say', lines: [], block: {
    kind: 'decision', variant: 'action', step: 3, icon: 'shield',
    title: 'Compensating Update Required',
    question: "Two PRD requirements — responsive multi-device preview and text-to-wireframe generation — don't fit any of the 7 confirmed epics. I can apply a compensating update: split them into 2 new epics (08, 09) and re-parent the 3 affected features, without touching anything else already built. 7 epics will become 9.",
    options: [{ label: 'Apply compensating update', beat: 'applyCompensatingUpdate', primary: true }],
  } },
]

export const V2_BEATS: Record<string, Effect[]> = {
  startEpicsV2: BUILD_EPICS_V2,

  /* Push the 7 epics, then straight into features — no interactive publish
     offer here; the point of this run is the compensating update ahead, not
     re-litigating the publish-or-skip choice already covered by the main flow. */
  pushEpicsV2: [
    { type: 'watch', text: 'Pushing 7 epics to Jira · WFS', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: '7 epics created · Jira', tone: 'ok' },
    ...BUILD_FEATURES_V2,
  ],

  /* The compensating update itself — a direct, business-semantic patch:
     create the 2 new epics, re-parent the 3 features they actually belong
     to. Everything else (the other 7 epics, the other 20 features) is never
     touched, superseded, or regenerated. */
  applyCompensatingUpdate: [
    { type: 'watch', text: 'Creating 2 new epics · re-parenting 3 features', tone: 'info' },
    status([
      ['Splitting Epic 01 → Canvas Editor + Responsive Preview', 'Epic 08'],
      ['Promoting text-to-wireframe to its own epic', 'Epic 09'],
      ['Re-parenting 3 affected features', 'done'],
    ], 'Compensating update · applying'),
    { type: 'watch', text: 'Compensating update applied · 9 epics', tone: 'ok' },
    { type: 'say', stream: false, lines: [
      'Done — created **Epic 08 (Responsive & Multi-Device Preview)** and **Epic 09 (Text-to-Wireframe Generation)** directly on Jira, and re-parented the 3 affected features onto them. The other 7 epics, and every feature under them, are untouched — nothing was rewound or regenerated.',
    ] },
    artifact('epics.md (v2)', 'epics-revised'),
    { type: 'setDoc', doc: 'epics-revised' },
    { type: 'taskDone', note: 'Compensating update applied · 9 epics, 23 features on Jira' },
  ],
}
