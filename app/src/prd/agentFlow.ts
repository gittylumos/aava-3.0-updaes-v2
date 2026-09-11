/* The Agent-Designer run (Ajay) — an intent-based flow that checks the golden
 * catalog for a fitting SDLC process, clones the best fit, and customises it.
 *
 * It runs on the same fixed spine as every other object flow, so the
 * interactions match: a capability match (shimmer → card), a numbered process
 * plan that feeds the hanging dock, then a loop of steps with "waiting on you"
 * gates. The five plan steps are:
 *   1. Refine the process requirement — structure the HLD steps, edit by talking
 *   2. Identify matching artifacts — rank golden processes, shown in a window
 *   3. Create or clone artifact — open the best fit read-only, clone to edit
 *   4. Assess the quality — check the working copy against thresholds
 *   5. Send for approval — route the artifact for sign-off
 *
 * Capability: "Artifact Identification" (AID-1.0). */
import type { ArtifactMatch, BlockSpec, Effect, Message, PrepStep, ToolStep } from '../state/types'
import { T } from '../state/timing'

/** A thinking accordion — label/result rows that resolve one by one. */
function status(steps: [string, string, number?][], title?: string): Effect {
  const toolSteps: ToolStep[] = steps.map(([label, result, ms]) => ({ label, result, source: 'RUN', ms: ms ?? T.repo }))
  return { type: 'tools', steps: toolSteps, title }
}

/** An agent-designer intent: a request to find/build an artifact, agent or
   process for a piece of work. Fires on a "find/create an artifact/agent/
   process/workflow" cue, or on naming a design deliverable (HLD / LLD /
   diagram) alongside a build verb — so "looking for an agentic process to
   build HLDs" routes here. Checked before the other object intents in `send()`;
   it names none of their keywords, so pinning it first keeps this path clean. */
export function isArtifactIntent(text: string): boolean {
  const t = text.toLowerCase()
  const build = /\b(find|looking for|need|create|build|generate|design|set up|agentify)\b/.test(t)
  const object = /\b(artifact|artefact|agent|agentic|golden|orchestration|process|workflow|hld|hlds|lld|c4|architecture diagram)\b/.test(t)
  return build && object
}

/* ── The process-plan dock ──────────────────────────────────────────────────
   Five steps, shown as a plan the user Proceeds through, then tracked in the
   hanging dock. `agentPhase` on the object is the furthest step reached. */
const AGENT_PROGRESS: PrepStep[] = [
  { key: 'refine', label: 'Understand the requirement', result: 'Confirmed', detail: "Map the user's intent to the process they need" },
  { key: 'match', label: 'Identify matching artifacts', result: 'Ranked', detail: 'Rank golden processes by fit to the requirement' },
  { key: 'clone', label: 'Create or clone artifact', result: 'Cloned', detail: 'Open the best fit and clone it to customise' },
  { key: 'assess', label: 'Assess the quality', result: 'Passed', detail: 'Check the working copy against quality thresholds' },
  { key: 'approve', label: 'Send for approval', result: 'Sent', detail: 'Consolidate and route the artifact for sign-off' },
]

/** The dock selector — reads the furthest plan step the object reached, and
   whether a live gate is parking the run (so the dock shimmers amber). */
export function agentProgress(messages: Message[], agentPhase: number | undefined):
  { steps: PrepStep[]; at: number; started: boolean; waiting: boolean } {
  const phase = agentPhase ?? -1
  const started = phase >= 0
  const at = phase < 0 ? 0 : Math.min(phase, AGENT_PROGRESS.length)
  const waiting = messages.some(
    (m) => m.live !== false && (m.block?.kind === 'decision' || m.block?.kind === 'confirm' || m.block?.kind === 'sync'),
  )
  return { steps: AGENT_PROGRESS, at, started, waiting }
}

/* ── The HLD requirement (edited by talking to it) ──────────────────────────
   The capability steps the user confirms/refines in step 1. Distinct from the
   richer golden process they later clone. */
const BASE_STEPS = [
  { label: 'Architecture analysis' },
  { label: 'Solution proposal' },
  { label: 'Design review' },
]
const REFINED_STEPS = [
  { label: 'Architecture analysis' },
  { label: 'Solution proposal' },
  { label: 'C4 Diagram Generation', added: true },
  { label: 'Design review' },
]

/** The golden-process matches, ranked by fit. All are golden *processes* — the
   user reuses one rather than building from scratch. */
export const ARTIFACT_MATCHES: ArtifactMatch[] = [
  {
    id: '2345', type: 'Process', title: 'HLD Architecture Builder', match: 97,
    workflow: 'Architecture analysis → Solution proposal → C4 diagram generation → API contract → Documentation → Architect review → HITL review',
    steps: ['Analysis', 'Proposal', 'C4 Gen', 'API Contract', 'Docs', 'Architect Review', 'HITL'],
    why: 'Already covers the core steps in your process, including C4 diagram generation — you only adapt the parts specific to your team.',
    uses: 97, version: 'v2.1', teams: 4,
  },
  {
    id: '4567', type: 'Process', title: 'System Architect Builder', match: 89,
    workflow: 'Architecture analysis → Solution proposal → Design review → Publish',
    steps: ['Analysis', 'Proposal', 'Design Review', 'Publish'],
    why: 'Strong architectural coverage, but does not include C4 diagram generation out of the box.',
    uses: 71, version: 'v1.9', teams: 3,
  },
  {
    id: '3456', type: 'Process', title: 'Solution Design Builder', match: 82,
    workflow: 'Requirement intake → Solution proposal → Design review',
    steps: ['Intake', 'Proposal', 'Design Review'],
    why: 'Covers the solution-design core, but omits the C4 and documentation stages your process needs.',
    uses: 54, version: 'v1.8', teams: 2,
  },
]

/** The matched artifact a card id points at (the canvas header reads this). */
export function matchById(id?: string): ArtifactMatch {
  return ARTIFACT_MATCHES.find((a) => a.id === id) ?? ARTIFACT_MATCHES[0]
}

/** The capability/step list, as a conversation block (no dock). */
function processBlock(steps: { label: string; added?: boolean }[]): BlockSpec {
  return { kind: 'process', title: 'Process Flow for this task', steps }
}

export function agentOpening(): Effect[] {
  return [
    { type: 'watch', text: 'Reviewing the requirement and identifying the right capability', tone: 'info' },
    { type: 'say', lines: [], stream: false, block: {
      kind: 'capability', searching: true, badge: 'AID-1.0',
      maps: "This maps to the 'Artifact Identification' agentic process, with these capabilities:",
      chips: ['SDLC Process definition', 'Artifact Matching', 'Artifact Builder', 'Quality Assessment'],
    } },
    { type: 'wait', ms: 2500 },
    { type: 'capabilityMatched' },
    { type: 'watch', text: 'Matched · Artifact Identification (AID-1.0)', tone: 'ok' },
    { type: 'say', lines: [
      "Good morning, Ajay. Here's how I'll approach this — first, I'll understand the HLD process you need, then I'll look for an existing process you can reuse and customize rather than building one from scratch.",
    ] },
    { type: 'say', lines: [], stream: false, block: {
      kind: 'plan', count: 5, title: 'Artifact Identification process',
      action: { label: 'Proceed', beat: 'refineProcess' },
      steps: AGENT_PROGRESS.map((s) => ({ title: s.label, detail: s.detail })),
    } },
  ]
}

export const AGENT_BEATS: Record<string, Effect[]> = {
  /* Step 1 · Refine the process requirement. Structure the base HLD steps and
     let the user edit them by talking, then confirm. */
  refineProcess: [
    { type: 'setAgentPhase', phase: 0 },
    { type: 'watch', text: 'Structuring the HLD process', tone: 'info' },
    { type: 'say', lines: [
      "Got it — you're looking to agentify the HLD creation process. Based on common HLD practice, the process typically runs Architecture analysis → Solution proposal → Design review. We can start from this and adapt it to your needs.",
    ] },
    { type: 'say', lines: [], stream: false, block: processBlock(BASE_STEPS) },
    { type: 'say',
      lines: ['Is there anything you would like to add or change?'],
      block: {
        kind: 'decision', variant: 'buttons', title: 'Refine or match the process',
        question: 'You can add, remove or reorder a step, or I can match existing artifacts to this now.',
        options: [
          { label: 'Refine the process', beat: 'refine', collect: true, primary: true },
          { label: 'Identify matching artifacts', beat: 'matchArtifacts' },
        ],
      },
    },
  ],

  /* The user refined the process (added C4 diagram generation). Re-show it with
     the new step highlighted, then ask to confirm. */
  refine: [
    { type: 'setAgentPhase', phase: 0 },
    { type: 'watch', text: 'Updating the process', tone: 'info' },
    { type: 'say', lines: [
      'Got it. I have added C4 Diagram Generation after the solution proposal. Your process is now Architecture analysis → Solution proposal → C4 diagram generation → Design review.',
    ] },
    { type: 'say', lines: [], stream: false, block: processBlock(REFINED_STEPS) },
    { type: 'say',
      lines: ['Does this look right?'],
      block: {
        kind: 'decision', variant: 'buttons', title: 'Confirm the process',
        question: 'Ready to match golden artifacts to these four capabilities?',
        options: [
          { label: 'Yes, proceed', beat: 'matchArtifacts', primary: true },
          { label: 'Keep refining', beat: 'refine', collect: true },
        ],
      },
    },
  ],

  /* Step 2 · Identify matching artifacts. Introduce reuse, search, then present
     the ranked golden processes in the catalog window. */
  matchArtifacts: [
    { type: 'setAgentPhase', phase: 1 },
    { type: 'say', lines: [
      "Great. Before we build this from scratch, I'll check whether an existing process already follows a similar workflow — if there's a good fit, you can reuse and customise it.",
    ] },
    { type: 'watch', text: 'Searching the artifact catalog', tone: 'info' },
    { type: 'wait', ms: T.library },
    { type: 'watch', text: '3 matches', tone: 'ok' },
    { type: 'say', lines: [
      'I found 3 processes relevant to your HLD workflow. HLD Architecture Builder is the closest fit — it already covers most of what you described, including C4 diagram generation. Open it to review, then clone and customise rather than starting from scratch.',
    ] },
    { type: 'say', lines: [], stream: false, block: { kind: 'artifacts', title: '3 matching processes', items: ARTIFACT_MATCHES } },
  ],

  /* Opening a match card (fired from the card's click) — the builder opens
     read-only on the canvas; narrate the read-only state and offer the clone. */
  openArtifact: [
    { type: 'setAgentPhase', phase: 2 },
    { type: 'say', lines: [
      "Here's the HLD Architecture Builder v2.1 — already used across 4 teams over 97 runs. The workflow on the right shows how the existing process is structured and where it lines up with what you described.",
    ] },
    /* A sample of what the process produces — input & a drafted HLD (with C4
       diagrams). Opens as its own tab in the canvas workspace. */
    { type: 'say', lines: [
      "Here's a sample run of this process, so you can see what you'd get — the input brief it takes in, and the HLD it produces. Open it to take a look before you clone.",
    ] },
    { type: 'say', lines: [], stream: false, block: {
      kind: 'agentDoc', name: 'HLD — Sample Input & Output', sub: 'A sample run: the requirement brief and the drafted HLD, with C4 diagrams',
    } },
    { type: 'say',
      lines: ['This artifact is read-only. Create your own version to adapt the workflow to your organisation’s HLD process.'],
      block: {
        kind: 'decision', variant: 'action', icon: 'sparkle', title: 'Read-only artifact',
        question: 'Clone HLD Architecture Builder v2.1 into a working copy you can edit.',
        options: [{ label: 'Clone', beat: 'cloneArtifact', primary: true }],
      },
    },
  ],

  /* Step 3 · Create or clone artifact. Make the working copy editable and invite
     changes. Fired from either the canvas Clone button or the conversation gate. */
  cloneArtifact: [
    { type: 'setAgentCloned' },
    { type: 'watch', text: 'Creating a working copy', tone: 'info' },
    { type: 'wait', ms: T.repo },
    { type: 'watch', text: 'Working copy created', tone: 'ok' },
    { type: 'say', lines: [
      "I've created a working copy of HLD Architecture Builder v2.1 for you. You can modify the workflow, configure individual agents, or add new capabilities.",
      'What would you like to change?',
    ] },
  ],

  /* The user added a Stakeholder Review node — reflect it on the canvas and
     confirm, then offer to send for assessment. */
  addStakeholder: [
    { type: 'setAgentStakeholder' },
    { type: 'watch', text: 'Adding Stakeholder Review after HITL review', tone: 'info' },
    { type: 'say', lines: [
      'Done. I have added Stakeholder Review after HITL Review. Your updated process is now Architecture analysis → Solution proposal → C4 diagram generation → API contract → Documentation → Architect review → HITL review → Stakeholder review.',
      'Your changes are saved to your working copy. You can keep refining, or send it for assessment.',
    ] },
    { type: 'say',
      lines: [],
      block: {
        kind: 'decision', variant: 'buttons', title: 'Send for assessment',
        question: 'Send the working copy to the quality assessor, or keep refining it?',
        options: [
          { label: 'Send for assessment', beat: 'assess', primary: true },
          { label: 'Keep refining', beat: 'keepRefining', collect: true },
        ],
      },
    },
  ],

  /* A refinement note that isn't the stakeholder step — acknowledge and re-offer. */
  keepRefining: [
    { type: 'say', lines: [
      "Saved to your working copy. Tell me the next change, or send it for assessment when you're ready.",
    ] },
  ],

  /* Step 4 · Assess the quality. Run the checks against thresholds, then offer
     to send for approval. */
  assess: [
    { type: 'setAgentPhase', phase: 3 },
    { type: 'watch', text: 'Assessing the working copy', tone: 'info' },
    status([
      ['Checking step completeness against the requirement', '8/8 steps mapped'],
      ['Verifying guardrail coverage', 'HITL gate present'],
      ['Checking token budget & timeout caps', 'within limits'],
      ['Scoring confidence on each agent', 'all ≥ 0.7'],
    ], 'Quality assessment'),
    { type: 'watch', text: 'Quality thresholds cleared', tone: 'ok' },
    { type: 'say', lines: [
      'Assessment complete. The working copy clears every quality threshold — full step completeness, guardrail coverage, and a HITL checkpoint before publish. It is ready to send for approval.',
    ] },
    { type: 'say',
      lines: [],
      block: {
        kind: 'decision', variant: 'action', icon: 'shield', title: 'Send for approval',
        question: 'Route HLD Architecture Builder (your copy) to the approver for sign-off.',
        options: [{ label: 'Send for approval', beat: 'approve', primary: true }],
      },
    },
  ],

  /* Step 5 · Send for approval — the run's outcome. */
  approve: [
    { type: 'setAgentPhase', phase: 4 },
    { type: 'watch', text: 'Routing for approval', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'Sent for approval', tone: 'ok' },
    { type: 'setAgentPhase', phase: 5 },
    { type: 'say', lines: [
      "Sent HLD Architecture Builder (your copy) for approval. I'll notify you when it's signed off — no more actions on you for now.",
    ] },
  ],
}

/** Typed input inside the run — routed by keyword. Stakeholder-review requests
   route to the node-add beat (only meaningful once cloned); a C4/step change
   routes to the process refine; a match/proceed cue jumps to the matches.
   Anything else falls through to a gentle nudge. */
export function agentRouter(text: string): Effect[] | null {
  const t = text.toLowerCase()
  if (/\b(stakeholder|reviewer|sign-?off)\b/.test(t)) return AGENT_BEATS.addStakeholder
  if (/\b(c4|diagram|add|include|insert|remove|drop|reorder|move|swap|step)\b/.test(t)) return AGENT_BEATS.refine
  if (/\b(match|proceed|yes|go ahead|identify|artifact|show me)\b/.test(t)) return AGENT_BEATS.matchArtifacts
  if (/\b(assess|approv|send)\b/.test(t)) return AGENT_BEATS.assess
  return null
}
