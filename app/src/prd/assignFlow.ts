/* The Story Assignment run — Meera's (User B) half of the cross-persona handoff.
 *
 * She opens it from the "Assign Stories to scrum team members" card that appeared
 * on her home the moment Raman published the WFS backlog. The run:
 *   1. opens onto the Execution-activity graph, Story Assignment now "waiting on
 *      you" for her;
 *   2. runs the "Analysing Backlog & Team Capacity" checklist (ingest → classify →
 *      capacity → optimise);
 *   3. drops team_allocation.md into the canvas and an artefact card in chat;
 *   4. states the drafted plan, with the two capacity hotspots highlighted;
 *   5. stops at Decision Gate 1 — the Review Story Assignments HITL block.
 *
 * It runs on the same `backlog` object machinery as Raman's flow, so runBeat looks
 * its beats up in ASSIGN_BEATS alongside BACKLOG_BEATS.
 */
import type { BlockSpec, Effect, ToolStep } from '../state/types'
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

/* Decision Gate 1 — the Review Story Assignments HITL block. A lettered
   option panel (Claude-ask-question style) shown as "waiting on you", with a
   summary badge and a grey "Recommended" tag on the first option. */
const REVIEW_GATE: BlockSpec = {
  kind: 'decision', variant: 'clarify', step: 1, icon: 'person',
  title: 'Review Story Assignments',
  question: 'How would you like to handle the team allocation?',
  summary: [
    { label: '58 stories', detail: '142 pts' },
    { label: '8 members balanced' },
    { label: '2 overloaded' },
  ],
  options: [
    { label: 'Review & resolve bottlenecks', beat: 'assignResolve', primary: true, tag: 'Recommended',
      sub: 'Triggers optimisation recommendations to rebalance Arjun and Farhan.' },
    { label: 'Approve proposed assignments as-is', beat: 'assignApprove',
      sub: 'Publishes the draft to Jira and accepts the two overload risks.' },
    { label: 'Adjust manually', beat: 'assignManual',
      sub: 'Opens interactive reallocation to move stories yourself.' },
  ],
  revisable: true, reviseBeat: 'reviseAssign',
  impact: [{ label: 'Team allocation', doc: 'team-allocation' }],
}

/* The opening — plays the moment Meera picks up the assignment card. */
export function storyAssignmentOpening(): Effect[] {
  return [
    /* Execution-activity view first — Story Assignment is now her node. */
    { type: 'setCanvasView', view: 'graph' },
    { type: 'watch', text: 'Ingesting WFS backlog · 58 stories', tone: 'info' },
    status([
      ['Reading 58 stories from Jira project WFS', '142 story points', T.repo],
      ['Checking story priorities', '5 P1 · 20 P2 · 33 P3'],
      ['Classifying story domains', '12 Design · 26 Frontend · 20 Backend'],
      ['Checking team availability & active PTOs', '10 active · Rohan PTO Thu–Fri'],
      ['Evaluating historical velocity & component ownership', 'done'],
      ['Running allocation optimisation algorithm', '58 assignments drafted'],
    ], 'Analysing Backlog & Team Capacity'),
    { type: 'watch', text: 'Allocation drafted · 58 assignments', tone: 'ok' },
    /* The artefact card in chat, and the same doc auto-rendered in the canvas. */
    artifact('team_allocation.md', 'team-allocation'),
    { type: 'setDoc', doc: 'team-allocation' },
    { type: 'setCanvasView', view: 'doc' },
    /* Non-streamed so the key figures render highlighted for a skimming read. */
    { type: 'say', stream: false, lines: [
      "Good morning, Meera. I've ingested all **58 stories (142 story points)** published by Raman for WireFrame Studio.",
      "Based on component ownership in the repo, historical velocity, and current PTO calendars, I've drafted an **end-to-end allocation plan across our 10 team members**.",
      "Before we push this to Jira, I noticed **two capacity issues** for the upcoming sprint: **Arjun (Lead Frontend) is at 138% capacity**, and **Farhan (UI/UX) is at 120%**. Would you like to review the proposed allocation to balance the load?",
    ] },
    { type: 'say', lines: [], block: REVIEW_GATE },
  ]
}

export const ASSIGN_BEATS: Record<string, Effect[]> = {
  /* 1A · Review & resolve — draft the rebalancing moves, then offer to apply. */
  assignResolve: [
    { type: 'watch', text: 'Generating optimisation recommendations', tone: 'info' },
    status([
      ['Re-checking Arjun & Farhan load', '2 hotspots'],
      ['Finding under-capacity owners on the right components', 'Rohan · Neha'],
      ['Drafting rebalancing moves', '3 moves · −11 pts'],
    ], 'Optimisation · rebalancing the load'),
    { type: 'watch', text: 'Rebalance drafted · everyone under 100%', tone: 'ok' },
    { type: 'say', stream: false, lines: [
      'Here are the moves that clear both hotspots: reassign **ST-034** and **ST-011** from **Arjun → Rohan** (−7 pts), and **ST-047** from **Farhan → Neha** (−4 pts).',
      'That lands **Arjun at 96%** and **Farhan at 104%**, with Rohan and Neha still inside their bands after PTO. Apply the rebalance and publish to Jira?',
    ], block: {
      kind: 'sync', title: 'Apply rebalance & publish to Jira', detail: '58 assignments · balanced · project WFS',
      beat: 'assignPublish', primaryLabel: 'Apply & publish', secondaryLabel: 'Keep reviewing', secondaryBeat: 'assignHold',
    } },
  ],

  /* 1B · Approve as-is — publish the draft, overload risks accepted. */
  assignApprove: [
    { type: 'watch', text: 'Publishing 58 assignments to Jira · WFS', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: '58 assignments created · Jira', tone: 'ok' },
    { type: 'say', lines: [
      'Done — all 58 stories are assigned in Jira for Sprint 35. I have flagged Arjun (138%) and Farhan (120%) as over capacity on the sprint board so the risk stays visible. Let me know if you want to rebalance later.',
    ] },
  ],

  /* 1C · Adjust manually — hand her the interactive reallocation. */
  assignManual: [
    { type: 'watch', text: 'Opening interactive reallocation', tone: 'info' },
    { type: 'say', lines: [
      'Opened the allocation in the canvas for manual editing — drag any story to a different owner and the capacity read updates live. Tell me when you are happy with it and I will publish the final split to Jira.',
    ] },
  ],

  /* Applying the rebalance from 1A. */
  assignPublish: [
    { type: 'watch', text: 'Applying rebalance · publishing to Jira', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: '58 balanced assignments created · Jira', tone: 'ok' },
    { type: 'say', lines: [
      'Published — the balanced allocation is live on the Sprint 35 board, every member under 100%. Nothing else needs you here for now.',
    ] },
  ],

  assignHold: [
    { type: 'say', lines: ['Kept the draft as it is — nothing published. The allocation stays open in the canvas whenever you want to come back to it.'] },
  ],

  /* Rewinding Decision Gate 1 — whatever branch was chosen is already cleared
     (superseded) when the rewind is confirmed; re-draft the allocation from the
     new note and land back on the same review gate. */
  reviseAssign: [
    { type: 'watch', text: 'Redrafting the allocation from your note', tone: 'info' },
    status([
      ['Re-reading your note', 'done'],
      ['Re-running allocation optimisation algorithm', '58 assignments redrafted', T.repo],
    ], 'Redrafting the allocation'),
    { type: 'watch', text: 'Allocation redrafted', tone: 'ok' },
    artifact('team_allocation.md', 'team-allocation'),
    { type: 'setDoc', doc: 'team-allocation' },
    { type: 'setCanvasView', view: 'doc' },
    { type: 'say', stream: false, lines: [
      "Redrafted the allocation from your note — the previous draft is kept as the superseded record above.",
    ] },
    { type: 'say', lines: [], block: REVIEW_GATE },
  ],
}
