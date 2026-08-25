/* The PRD-to-backlog run — a scripted, human-in-the-loop flow.
 *
 * Six phases (Intake, Epics, Features, Stories, Confirm, Sprint plan), each one
 * a status checklist (the tools block) resolving in real time, an AAVA turn, the
 * phase's document opening in the canvas, and a gate the user must clear before
 * the run moves on (the golden "waiting on you" decision block). It mirrors the
 * WireFrame Studio script's interaction, not its exact words.
 */
import type { BlockSpec, Effect, ToolStep } from '../state/types'
import type { BacklogDoc } from './backlog'
import { T } from '../state/timing'

type Step = [label: string, result: string, ms?: number]

/** A status checklist — spinner → ✓ with a result, one row at a time. A `title`
   makes it a collapsible accordion that folds to a summary once it finishes. */
function status(steps: Step[], title?: string): Effect {
  const toolSteps: ToolStep[] = steps.map(([label, result, ms]) => ({
    label, result, source: 'RUN', ms: ms ?? T.contract,
  }))
  return { type: 'tools', steps: toolSteps, title }
}

/** A generated-artefact card — doc name + Open, which reveals it in the canvas. */
function artifact(name: string, doc: BacklogDoc): Effect {
  return { type: 'say', lines: [], stream: false, block: { kind: 'document', name, format: 'MD', doc } }
}

type Opt = [label: string, beat: string, primary?: boolean]

/** A gate — the golden "waiting on you" decision card. */
function gate(step: number, title: string, question: string, options: Opt[], summary?: { label: string; detail?: string }[]): BlockSpec {
  return {
    kind: 'decision', step, title, question,
    options: options.map(([label, beat, primary]) => ({ label, beat, primary })),
    summary,
  }
}

/* The run always starts with capability matching — a shimmering search, then the
   matched capability, an approach note, the proposed plan, and a gate to approve
   it. Nothing executes until the plan is approved. */
export function backlogOpening(): Effect[] {
  return [
    { type: 'watch', text: 'Matching a capability for this request', tone: 'info' },
    { type: 'say', lines: [], stream: false, block: {
      kind: 'capability', searching: true, badge: 'WFS-PRD-1.0',
      maps: 'This maps to WireFrame Studio · Wireframe Ideation Platform. I can take it end-to-end:',
      chips: [
        'PRD parsing & requirement extraction',
        'Backlog decomposition (epics → features → stories)',
        'Definition-of-Ready checks',
        'Sprint planning & story mapping',
      ],
    } },
    { type: 'wait', ms: 2500 },
    { type: 'capabilityMatched' },
    { type: 'watch', text: 'Matched · WireFrame Studio (WFS-PRD-1.0)', tone: 'ok' },
    { type: 'say', lines: [
      "Here's how I'll approach it — I'll pause for your review after every level, and I won't touch sprint planning until epics, features and stories are confirmed.",
    ] },
    { type: 'say', lines: [], stream: false, block: {
      kind: 'plan', count: 6, steps: [
        { title: 'Intake & understanding', detail: 'Parse the PRD, summarise objectives, roles and requirements' },
        { title: 'Draft epics', detail: 'Cluster 28 requirements into themed epics — pause for review' },
        { title: 'Break into features', detail: 'Decompose each confirmed epic — pause for review' },
        { title: 'Write user stories', detail: 'Draft stories and run Definition-of-Ready — flag gaps' },
        { title: 'Confirm (gate)', detail: 'Hold before sprint planning until you say go' },
        { title: 'Sprint plan', detail: 'Map MVP-scope stories into a sprint grid' },
      ],
    } },
    { type: 'say', lines: [], block: {
      kind: 'decision', variant: 'approve', icon: 'person', title: 'Approve the plan',
      question: 'Sound right? Approve to start, or tell me what to change.',
      placeholder: 'Anything missing? Please add here…',
      options: [
        { label: 'Approve & start', beat: 'startIntake', primary: true },
        { label: 'Start with the epics', beat: 'startEpics' },
      ],
    } },
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
        ['Yes, this is accurate', 'approveIntake', true],
        ['No, something is off', 'refineIntake'],
      ]),
    },
  ],

  approveIntake: [
    { type: 'watch', text: 'Intake confirmed', tone: 'ok' },
    { type: 'say', lines: [
      'Here is my plan: epics first, then features under each epic, then stories under each feature — pausing for your review after every level. I will not touch sprint planning until all three are confirmed.',
    ],
      block: gate(2, 'Approach', 'Sound right?', [
        ['Yes, start with the epics', 'startEpics', true],
        ['Adjust the approach', 'refineIntake'],
      ]),
    },
  ],

  /* Phase 2 · Epics. */
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
        ['Yes, break them into features', 'approveEpics', true],
        ['Refine the epics', 'refineEpics'],
      ], [{ label: '7 epics', detail: '3× P0 · 3× P1 · 1× P2' }]),
    },
  ],

  /* Loop 1A · refine epics — promote text-to-wireframe, fill the two open fields. */
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
        ['Yes, break them into features', 'approveEpics', true],
        ['Keep refining', 'refineEpics'],
      ]),
    },
  ],

  /* Phase 3 · Features. */
  approveEpics: [
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
    artifact('features.md', 'features'),
    { type: 'say',
      lines: [
        '23 features across the 7 epics, open in the canvas — each with Requirement, Acceptance criteria and Priority, grouped under its parent epic so the hierarchy stays visible.',
      ],
      block: gate(4, 'Confirm the features', 'Do these 23 features cover it?', [
        ['Yes, decompose into stories', 'approveFeatures', true],
        ['Refine the features', 'refineFeatures'],
      ], [{ label: '23 features', detail: 'under 7 epics' }]),
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
        ['Yes, decompose into stories', 'approveFeatures', true],
        ['Keep refining', 'refineFeatures'],
      ]),
    },
  ],

  /* Phase 4 · Stories, with the Definition-of-Ready pass. */
  approveFeatures: [
    status([
      ['Reading confirmed features', 'done'],
      ['Decomposing 23 features into stories', '58 stories', T.repo],
      ['Running Definition-of-Ready check', 'scanning'],
    ], 'Stories · decomposing features'),
    artifact('stories.md', 'stories'),
    { type: 'say', lines: ['58 stories drafted from the confirmed features. Each is checked against Definition of Ready before I show it to you.'] },
    { type: 'watch', text: 'DoR check · 7 stories flagged', tone: 'warn' },
    status([
      ['Checking each story for a Figma reference', 'done'],
      ['Checking each story for an API contract', 'done'],
      ['Checking acceptance-criteria completeness', 'done'],
      ['Stories missing at least one DoR item', '7 flagged'],
    ], 'Stories · Definition-of-Ready check'),
    artifact('stories.md', 'stories-flags'),
    { type: 'say',
      lines: [
        '7 stories are not sprint-ready yet — mostly a missing Figma mockup or an undefined API contract. I have flagged exactly what is outstanding on each. None can enter a sprint until its DoR clears.',
      ],
      block: gate(5, 'Confirm the backlog', 'Epics, features and stories — the original ask. Move into sprint planning?', [
        ['Yes, plan the sprints', 'planSprints', true],
        ['Stop here for now', 'stopHere'],
      ], [{ label: '58 stories', detail: '51 ready · 7 flagged' }]),
    },
  ],

  /* Phase 6 · Sprint plan. */
  planSprints: [
    status([
      ['Building 4-sprint grid · 2 weeks each', 'done'],
      ['Filtering to MVP scope · Epics 01, 02, 04', 'done'],
      ['Holding ST-047 · API spec pending', 'held'],
      ['Stories eligible for MVP sprints', '32 stories'],
    ], 'Sprint plan · building the grid'),
    { type: 'watch', text: 'Sprint plan built · 4 sprints', tone: 'ok' },
    artifact('sprint-plan.md', 'sprint'),
    { type: 'say',
      lines: [
        'Sprint plan set — 4 sprints of 2 weeks across the MVP scope. That is the full backlog: epics, features, stories and the sprint grid, all saved as editable docs. ST-047 is held in Sprint 3 until the WebSocket spec lands.',
      ],
    },
    { type: 'say',
      lines: ['Would you like me to push these items to Jira?'],
      block: { kind: 'sync', title: 'Push the backlog to Jira', detail: '7 epics · 23 features · 58 stories · project WFS', beat: 'pushJira' },
    },
  ],

  stopHere: [
    { type: 'say', lines: ['Stopped here. Epics, features and stories are all confirmed and saved as editable docs — the comment thread stays open if anything shifts.'] },
  ],
  exportMarkdown: [
    { type: 'watch', text: 'Exported backlog · Markdown', tone: 'ok' },
    { type: 'say', lines: ['Exported the full backlog as Markdown — epics, features, stories and the sprint grid, ready to share. The docs stay editable if anything changes.'] },
  ],
  pushJira: [
    { type: 'watch', text: 'Pushing to Jira · WFS project', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'Export complete · hierarchy applied', tone: 'ok' },
    { type: 'say', lines: ['Pushed to Jira — 7 epics, 23 features and 58 stories created with parent–child links. ST-047 stays flagged until its spec lands.'] },
  ],
}

/* Typed feedback inside the backlog run — a light acknowledgement that re-lands
   the current phase's gate, so a comment never dead-ends. The detailed loops are
   the decision-card buttons above. */
export function backlogReply(): Effect[] {
  return [{ type: 'say', lines: [
    'Noted — I have folded that into the current draft in the canvas. Use the buttons above when you are ready to move to the next level.',
  ] }]
}
