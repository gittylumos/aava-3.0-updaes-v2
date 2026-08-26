/* The PRD-to-backlog run — a scripted, human-in-the-loop flow.
 *
 * Phases (Intake, Epics, Features, Stories, Sprint plan), each one a status
 * checklist (the tools block) resolving in real time, an AAVA turn, the phase's
 * document opening in the canvas, and a gate the user must clear before the run
 * moves on (the golden "waiting on you" decision block). After every phase gate
 * AAVA offers to push that level to Jira — "Push to Jira" or "Proceed for now",
 * both continuing the run. It maps to the "Epics and Features Generator" agentic
 * process; the words follow that script.
 */
import type { BlockSpec, Effect, ToolStep } from '../state/types'
import type { BacklogDoc } from './backlog'
import { T } from '../state/timing'

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
      beat: pushBeat, secondaryLabel: 'Proceed for now', secondaryBeat: nextBeat,
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
      "Here's how I'll approach it — I'll pause for your review after every level, and I won't touch sprint planning until epics, features and stories are confirmed.",
    ] },
    /* Plan + approval, one card. Proceed both approves and starts the run. */
    { type: 'say', lines: [], stream: false, block: {
      kind: 'plan', count: 6, title: 'Initiate Process',
      action: { label: 'Proceed', beat: 'startIntake' },
      steps: [
        { title: 'Intake & understanding', detail: 'Parse the PRD, summarise objectives, roles and requirements' },
        { title: 'Draft epics', detail: 'Cluster 28 requirements into themed epics — pause for review' },
        { title: 'Break into features', detail: 'Decompose each confirmed epic — pause for review' },
        { title: 'Write user stories', detail: 'Draft stories and run Definition-of-Ready — flag gaps' },
        { title: 'Confirm (gate)', detail: 'Hold before sprint planning until you say go' },
        { title: 'Sprint plan', detail: 'Map MVP-scope stories into a sprint grid' },
      ],
    } },
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
  { type: 'say',
    lines: [
      '23 features across the 7 epics. Three of them are missing fields I could not infer from the PRD — target start date, end date and priority: Feature 1.3 (Responsive Device Preview), 5.3 (Bi-Directional Sync) and 7.2 (Contextual AI Tooltips).',
      'You can fill those in and I will fold them into the list, or I can go ahead now and highlight the gaps in the doc for later.',
    ],
    block: gate(4, 'Fill the missing fields', 'Add target start date, end date and priority for the 3 flagged features?', [
      ['Add the missing info', 'fillFeatureFields', true, true],
      ['Proceed without this info', 'featuresNoInfo'],
    ], [{ label: '3 features flagged', detail: '1.3 · 5.3 · 7.2' }]),
  },
]

/* Phase 4 · Stories, with the Definition-of-Ready pass. */
const BUILD_STORIES: Effect[] = [
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
      ['Yes, plan the sprints', 'reviewStories', true],
      ['Stop here for now', 'stopHere'],
    ], [{ label: '58 stories', detail: '51 ready · 7 flagged' }]),
  },
]

/* Phase 6 · Sprint plan, ending in the final full-backlog push offer. */
const BUILD_SPRINT: Effect[] = [
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
      'Sprint plan set — 4 sprints of 2 weeks across the MVP scope, with ST-047 held in Sprint 3 until the WebSocket spec lands.',
      'That completes the whole backlog — 7 epics, 23 features and 58 stories, all decomposed, reviewed and now mapped into the sprint grid, saved as editable docs. Want me to push the complete backlog to Jira?',
    ],
  },
  { type: 'say',
    lines: [],
    stream: false,
    block: {
      kind: 'sync', title: 'Push the complete backlog to Jira',
      detail: '7 epics · 23 features · 58 stories · 4 sprints · WFS',
      beat: 'pushJira', secondaryLabel: 'Not now', secondaryBeat: 'wrapUp',
    },
  },
]

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
    { type: 'say', lines: ['Thanks for the clarification — I will go ahead and create the features list with those folded in.'] },
    status([
      ['Applying target dates to Feature 1.3, 5.3, 7.2', 'done'],
      ['Setting priority on the 3 features', 'done'],
      ['Re-validating all 23 features against required fields', 'complete'],
      ['Applying feature template', '23 features'],
    ], 'Features · applying your edits'),
    { type: 'watch', text: '23 features complete', tone: 'ok' },
    artifact('features.md', 'features'),
    { type: 'say',
      lines: ['Done — all 23 features now carry target dates and priority, grouped under their parent epic with Requirement and Acceptance criteria.'],
      block: gate(4, 'Confirm the features', 'Do these 23 features cover it?', [
        ['Yes, decompose into stories', 'reviewFeatures', true],
        ['Refine the features', 'refineFeatures', false, true],
      ], [{ label: '23 features', detail: 'under 7 epics · all fields set' }]),
    },
  ],

  /* Proceed without the info — the doc is generated with the gaps highlighted. */
  featuresNoInfo: [
    { type: 'watch', text: 'Generating features · gaps highlighted', tone: 'info' },
    status([
      ['Applying feature template', '23 features'],
      ['Highlighting 3 features with missing fields', 'flagged'],
    ], 'Features · decomposing epics'),
    { type: 'watch', text: '23 features drafted · 3 flagged', tone: 'warn' },
    artifact('features.md', 'features-gaps'),
    { type: 'say',
      lines: ['Understood — generated the full list and highlighted Feature 1.3, 5.3 and 7.2 so the missing target dates and priority are easy to spot. They will need those before they can enter a sprint.'],
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

  /* Stories confirmed — offer the Jira push, then plan the sprints either way. */
  reviewStories: [
    { type: 'watch', text: 'Backlog confirmed', tone: 'ok' },
    pushOffer('58 stories', '58 stories · 51 ready · 7 flagged', 'pushStories', 'buildSprint', 'proceed for sprint plan creation'),
  ],
  pushStories: [...pushConfirm('58 stories'), ...BUILD_SPRINT],
  buildSprint: BUILD_SPRINT,

  stopHere: [
    { type: 'say', lines: ['Stopped here. Epics, features and stories are all confirmed and saved as editable docs — the comment thread stays open if anything shifts.'] },
  ],

  wrapUp: [
    { type: 'say', lines: ['Understood — nothing else pushed. The full backlog (epics, features, stories and the sprint grid) stays saved as editable docs. Let me know if you need anything else.'] },
  ],

  /* The final full push (from the sprint-plan offer) — then the dependency ticket. */
  pushJira: [
    { type: 'watch', text: 'Pushing the complete backlog to Jira · WFS project', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'Backlog published · hierarchy complete', tone: 'ok' },
    { type: 'say', lines: ['Pushed the complete backlog to Jira — 7 epics, 23 features and 58 stories with parent–child links, plus the 4-sprint plan and its assignments, all in project WFS. ST-047 stays flagged until its spec lands.'] },
    { type: 'say',
      lines: [
        'ST-047 (multi-user cursor display) is blocked on the WebSocket cursor-broadcast spec, which sits with the Backend / WebSockets team. Want me to raise a dependency ticket for it and assign it to them?',
      ],
      block: {
        kind: 'decision', variant: 'action', icon: 'shield', title: 'Raise a dependency ticket',
        question: 'I will create a Jira task for the WebSocket cursor-broadcast spec, assign it to the Backend / WebSockets team, and link it as a blocker of ST-047.',
        options: [{ label: 'Create the dependency ticket', beat: 'createDepTicket', primary: true }],
      },
    },
  ],

  createDepTicket: [
    { type: 'watch', text: 'Connecting to Jira · creating dependency ticket', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'Dependency ticket created · WFS-142', tone: 'ok' },
    { type: 'say',
      lines: ['Done — raised WFS-142, a dependency task for the WebSocket cursor-broadcast spec, assigned to the Backend / WebSockets team and linked as a blocker of ST-047.'],
      block: { kind: 'links', links: [{ label: 'WFS-142 · WebSocket cursor-broadcast spec', href: 'https://aava-demo.atlassian.net/browse/WFS-142' }] },
    },
    { type: 'say', lines: ['Let me know if anything needs to change, or if you would like a hand with the next step.'] },
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
