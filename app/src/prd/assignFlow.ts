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

/* Decision Gate 1 — the Handle DoR-not-met stories HITL block. Runs first: the
   2 P1 stories that failed the Definition-of-Ready check need a call before
   the allocation is reviewed at all. All three options feed back into the
   SAME Review Story Assignments gate below. */
const DOR_GATE: BlockSpec = {
  kind: 'decision', variant: 'clarify', step: 1, icon: 'shield',
  title: 'Handle DoR-not-met stories',
  question: "How should we handle the P1 stories that do not meet the 'Definition of Ready (DoR) criteria'?",
  summary: [{ label: '2 P1 stories DoR-not-met' }],
  options: [
    { label: 'Send to product manager to update necessary details.', beat: 'dorSendToPM', primary: true, tag: 'Recommended' },
    { label: 'Do not consider these 2 stories for current sprint assignment.', beat: 'dorSkip' },
    { label: 'Add comment in the stories about the risk and assign.', beat: 'dorComment', tag: 'Not recommended' },
  ],
  revisable: true, reviseBeat: 'dorSendToPM',
  impact: [{ label: 'Team allocation', doc: 'team-allocation' }],
}

/* Decision Gate 2 — the Review Story Assignments HITL block. A lettered
   option panel (Claude-ask-question style) shown as "waiting on you", with a
   summary badge and a grey "Recommended" tag on the first option. */
const REVIEW_GATE: BlockSpec = {
  kind: 'decision', variant: 'clarify', step: 2, icon: 'person',
  title: 'Review Story Assignments',
  question: 'How would you like to handle the team allocation?',
  summary: [
    { label: '53 stories', detail: '131 pts' },
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

/* The opening — plays the moment Meera picks up the assignment card. Like
   Raman's `backlogTaskOpening`, this work already ran before she arrived: the
   accordion lands already complete (ms 0, no spinner delay) and the copy is
   stream:false, so opening the card lands her directly on the gate rather than
   replaying a live generation each time. */
export function storyAssignmentOpening(): Effect[] {
  return [
    /* Execution-activity view first — Story Assignment is now her node. */
    { type: 'setCanvasView', view: 'graph' },
    { type: 'watch', text: 'Ingesting WFS backlog · 58 stories', tone: 'info' },
    status([
      ['Reading 58 stories from Jira project WFS', 'done', 0],
      ['Check story priorities', '25 P1s · 20 P2s · 13 P3s', 0],
      ["Verify the stories against 'Definition of Ready'", '5 not met · 53 ready for assignment', 0],
      ['Classifying story domains', '12 Design · 21 Frontend · 20 Backend', 0],
      ['Checking team availability & active PTOs', '10 active · Rohan on PTO Thu–Fri', 0],
      ['Evaluating historical velocity & component ownership', 'done', 0],
      ['Running allocation optimization algorithm', '53 assignments drafted', 0],
    ], 'Analysing Backlog & Team Capacity'),
    { type: 'watch', text: 'Allocation drafted · 53 assignments', tone: 'ok' },
    /* Non-streamed so the key figures render highlighted for a skimming read.
       Conversation copy first, then the artefact — reading the finding before
       the document it is about. */
    { type: 'say', stream: false, lines: [
      "Good morning, Meera. I've ingested all **58 stories (142 story points)** published by Raman for WireFrame Generation.",
      "Based on component ownership in the repo, historical velocity, and current PTO calendars, I've drafted an **end-to-end allocation plan across our 10 team members**.",
      "Before we push this to Jira, I noticed **2 issues** -",
      "• Definition of Ready (DoR) not met for 2 P1 stories. Needs to be updated by the product manager.",
      "• Capacity issues for the upcoming sprint: **Arjun (Lead Frontend) is at 138% capacity**, and **Farhan (UI/UX) is at 120%**. You have to review the proposed stories for the sprint to balance the load.",
    ] },
    /* The artefact card in chat, and the same doc auto-rendered in the canvas. */
    artifact('team_allocation.md', 'team-allocation'),
    { type: 'setDoc', doc: 'team-allocation' },
    { type: 'setCanvasView', view: 'doc' },
    { type: 'say', lines: [], block: DOR_GATE },
  ]
}

export const ASSIGN_BEATS: Record<string, Effect[]> = {
  /* Decision Gate 1 · Handle DoR-not-met stories — all three options proceed to
     the same Review Story Assignments gate. */

  /* 1A (recommended) · send back to the product manager. Also flips the
     persistent handoff flag — Raman's "PRD to Stories" card reopens onto the
     refinement request next time he opens it, from whichever profile he's on. */
  dorSendToPM: [
    { type: 'watch', text: 'Reassigning 2 stories to product manager', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: '2 stories reassigned · Jira', tone: 'ok' },
    { type: 'refinementRequested' },
    { type: 'say', lines: ['I have reassigned the 2 stories to the product manager. Proceed to the next decision step.'] },
    { type: 'say', lines: [], block: REVIEW_GATE },
  ],

  /* 1B · hold the 2 stories out of this sprint's assignment entirely. */
  dorSkip: [
    { type: 'watch', text: 'Holding stories back from Sprint 35', tone: 'info' },
    { type: 'say', lines: ['I will keep the 5 stories in the backlog. They can be introduced into the sprint when they are ready. Proceed to the next decision step.'] },
    { type: 'say', lines: [], block: REVIEW_GATE },
  ],

  /* 1C (not recommended) · flag the risk in-place and assign anyway. */
  dorComment: [
    { type: 'watch', text: 'Adding comments to 2 stories', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'Comments added · Jira', tone: 'ok' },
    { type: 'say', lines: ['I have added a comment in each of the stories about the missing information. Proceed to the next decision step.'] },
    { type: 'say', lines: [], block: REVIEW_GATE },
  ],

  /* Decision Gate 2 · Review Story Assignments. */

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
      kind: 'sync', title: 'Apply rebalance & publish to Jira', detail: '53 assignments · balanced · project WFS',
      beat: 'assignPublish', primaryLabel: 'Apply & publish', secondaryLabel: 'Keep reviewing', secondaryBeat: 'assignHold', revisable: true,
    } },
  ],

  /* 1B · Approve as-is — publish the draft, overload risks accepted. */
  assignApprove: [
    { type: 'watch', text: 'Publishing 53 assignments to Jira · WFS', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: '53 assignments created · Jira', tone: 'ok' },
    { type: 'say', lines: [
      'Done — all 53 stories are assigned in Jira for Sprint 35. I have flagged Arjun (138%) and Farhan (120%) as over capacity on the sprint board so the risk stays visible. Let me know if you want to rebalance later.',
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
    { type: 'watch', text: '53 balanced assignments created · Jira', tone: 'ok' },
    { type: 'say', lines: [
      'Published — the balanced allocation is live on the Sprint 35 board, every member under 100%. Nothing else needs you here for now.',
    ] },
  ],

  assignHold: [
    { type: 'say', lines: ['Kept the draft as it is — nothing published. The allocation stays open in the canvas whenever you want to come back to it.'] },
  ],

  /* Rewinding Decision Gate 2 — whatever branch was chosen is already cleared
     (superseded) when the rewind is confirmed; re-draft the allocation from the
     new note and land back on the same review gate. */
  reviseAssign: [
    { type: 'watch', text: 'Redrafting the allocation from your note', tone: 'info' },
    status([
      ['Re-reading your note', 'done'],
      ['Re-running allocation optimisation algorithm', '53 assignments redrafted', T.repo],
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
