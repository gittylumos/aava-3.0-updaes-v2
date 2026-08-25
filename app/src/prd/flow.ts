/* The PRD → Epics → Stories → Jira execution flow.
 *
 * A scripted human-in-the-loop run, the same shape as the task scenarios but
 * driven from the object path rather than a board card. Three phases, each
 * ending at a decision gate the user must clear:
 *   1 Analysis  — ingest the PRD, group into Epics/Features, gate on scope
 *   2 Stories   — decompose into user stories, gate on Definition of Ready
 *   3 Release   — bucket into sprints, gate on the Jira export
 * The output is never handed over directly; every phase stops and asks. Watch
 * lines narrate the machine work between the conversational turns.
 */
import type { Effect } from '../state/types'
import { T } from '../state/timing'
import { prdFileName, prdDocTitle } from './document'

export interface Epic { id: string; name: string; features: string[] }

export const EPICS: Epic[] = [
  { id: 'E1', name: 'User Authentication & Security', features: ['Login & session', 'Password & recovery', 'Role-based access'] },
  { id: 'E2', name: 'Core Billing Engine', features: ['Invoicing', 'Payment capture', 'Refund handling'] },
  { id: 'E3', name: 'Analytics Dashboard', features: ['Usage metrics', 'Export & reporting', 'Real-time view'] },
  { id: 'E4', name: 'Webhook Integration', features: ['Event delivery', 'Retry & backoff'] },
]

export interface Story { id: string; epic: string; title: string; points: number; ready: boolean }

export const STORIES: Story[] = [
  { id: 'STORY-01', epic: 'E1', title: 'Sign in with email and password', points: 3, ready: true },
  { id: 'STORY-05', epic: 'E1', title: 'Reset password via emailed link', points: 5, ready: true },
  { id: 'STORY-09', epic: 'E2', title: 'Generate an invoice on subscription renewal', points: 5, ready: true },
  { id: 'STORY-12', epic: 'E2', title: 'Handle a payment gateway timeout', points: 8, ready: false },
  { id: 'STORY-18', epic: 'E3', title: 'Export analytics for the current range', points: 5, ready: false },
  { id: 'STORY-22', epic: 'E4', title: 'Deliver a webhook with retry on failure', points: 8, ready: true },
]

export const CLARIFICATIONS = [
  { id: 'STORY-12', domain: 'QA', q: 'What is the fallback when the payment gateway times out after 3 retries?' },
  { id: 'STORY-18', domain: 'Biz', q: 'Should free-tier users have access to real-time analytics exports?' },
]

export const SPRINTS = [
  { name: 'Sprint 1', stories: ['STORY-01', 'STORY-05', 'STORY-09', 'STORY-12'] },
  { name: 'Sprint 2', stories: ['STORY-18', 'STORY-22'] },
]

export const JIRA_TARGET = {
  instance: 'company.atlassian.net',
  projectKey: 'PAYMENTS',
  board: 'Sprint Backlog',
  counts: '4 Epics · 11 Features · 24 Stories · 48 Sub-Tasks',
}

/* Example 1 — "create a PRD for X". A short clarifying turn, Claude-style,
   before anything is drafted. The user answers (or opts for defaults); the reply
   is what triggers prdCreateDocument below. */
export function prdOpening(subject: string): Effect[] {
  return [
    { type: 'watch', text: `Reading the request · PRD for ${subject}`, tone: 'info' },
    { type: 'say', lines: [
      `Happy to draft a PRD for ${subject}. Two quick things so it lands right:`,
      `1. Who is the primary user, and what are they trying to get done?`,
      `2. What single metric should this move in the first quarter?`,
      `Answer both, or just say "use sensible defaults" and I will make reasonable assumptions.`,
    ] },
  ]
}

/* The reply to the clarifying turn produces the document. Thinking, then the
   draft lands as an artefact card in the chat and opens on the right. */
export function prdCreateDocument(subject: string): Effect[] {
  const file = `${prdFileName(subject)}.md`
  return [
    { type: 'say', lines: ['Thanks — drafting it now.'] },
    { type: 'watch', text: 'Reviewing workspace architecture', tone: 'info' },
    { type: 'wait', ms: T.repo },
    { type: 'watch', text: 'Structuring requirements and success metrics', tone: 'info' },
    { type: 'wait', ms: T.contract },
    { type: 'watch', text: `Draft ready · ${file}`, tone: 'ok' },
    { type: 'openPanel' },
    { type: 'say',
      lines: [
        `Here is the first draft of the PRD for ${subject}. Open it on the right to review — switch between the rendered preview and the markdown source, export it, or tell me which section to revise.`,
      ],
      block: { kind: 'document', name: prdDocTitle(subject), format: 'MD' },
    },
  ]
}

function gate1() {
  return {
    kind: 'decision' as const, step: 1, title: 'Approve the Epic & Feature breakdown',
    question: 'Do these Epics and Features accurately represent your PRD scope?',
    summary: EPICS.map((e) => ({ label: `${e.id} · ${e.name}`, detail: `${e.features.length} Features` })),
    options: [
      { label: 'Yes, approve scope', beat: 'approveScope', primary: true },
      { label: 'No, refine Epics', beat: 'refineEpics' },
    ],
  }
}

export const PRD_BEATS: Record<string, Effect[]> = {
  /* Gate 1 · YES → decompose into stories, stop at gate 2. */
  approveScope: [
    { type: 'watch', text: 'Scope approved by you', tone: 'ok' },
    { type: 'say', lines: ['Scope approved. Breaking the features down into implementation-ready User Stories.'] },
    { type: 'watch', text: 'Decomposing features into user stories', tone: 'info' },
    { type: 'wait', ms: T.repo },
    { type: 'watch', text: 'Writing acceptance criteria (Gherkin)', tone: 'info' },
    { type: 'wait', ms: T.contract },
    { type: 'prdPhase', phase: 'stories' },
    { type: 'watch', text: 'Generated 24 stories · 2 clarifications open', tone: 'warn' },
    { type: 'say',
      lines: [
        `I've generated 24 User Stories across your approved features, and flagged ${CLARIFICATIONS.length} clarifications:`,
        ...CLARIFICATIONS.map((c) => `${c.domain} (${c.id}): ${c.q}`),
        'Answer these here or edit the story cards in the workspace, then confirm the backlog is ready.',
      ],
      block: {
        kind: 'decision', step: 2, title: 'Confirm the backlog is ready',
        question: "Do these 24 stories meet your team's Definition of Ready?",
        summary: [
          { label: '24 stories', detail: 'across 4 Epics' },
          { label: '2 open questions', detail: 'QA · Business' },
        ],
        options: [
          { label: 'Yes, backlog ready', beat: 'backlogReady', primary: true },
          { label: 'No, refine stories', beat: 'refineStories' },
        ],
      },
    },
  ],

  /* Gate 1 · NO → refinement loop. Typed feedback is caught by prdRouter. */
  refineEpics: [
    { type: 'say', lines: [
      'Understood. Tell me how to adjust the breakdown, or type your feedback below:',
      '1. Add missing scope or a feature',
      '2. Merge or split existing Epics',
      '3. Re-ingest a modified PRD file',
    ] },
  ],

  /* Gate 2 · YES → bucket into sprints, stop at gate 3. */
  backlogReady: [
    { type: 'watch', text: 'Stories confirmed ready', tone: 'ok' },
    { type: 'say', lines: ['Stories confirmed ready. Structuring sprint allocation and release milestones.'] },
    { type: 'watch', text: 'Grouping stories into sprints', tone: 'info' },
    { type: 'wait', ms: T.contract },
    { type: 'prdPhase', phase: 'release' },
    { type: 'watch', text: `Backlog structured · ${SPRINTS.length} sprints`, tone: 'ok' },
    { type: 'say',
      lines: [
        `Your backlog is structured into ${SPRINTS.length} sprint buckets and ready to push into Jira.`,
      ],
      block: {
        kind: 'decision', step: 3, title: 'Publish to Jira',
        question: 'Publish the work items and hierarchy directly to Jira?',
        summary: [
          { label: `${JIRA_TARGET.instance}`, detail: `Project ${JIRA_TARGET.projectKey} · ${JIRA_TARGET.board}` },
          { label: 'Items to create', detail: JIRA_TARGET.counts },
        ],
        options: [
          { label: 'Yes, sync to Jira', beat: 'syncJira', primary: true },
          { label: 'No, change destination', beat: 'changeDest' },
        ],
      },
    },
  ],

  /* Gate 2 · NO → story refinement loop. */
  refineStories: [
    { type: 'say', lines: [
      'Let me know what needs adjustment:',
      "Type inline feedback (e.g. 'Change STORY-05 acceptance criteria to include multi-currency support'),",
      'or answer an open question to auto-resolve a Definition-of-Ready flag.',
    ] },
  ],

  /* Gate 3 · YES → the export executes. */
  syncJira: [
    { type: 'watch', text: `Creating items in Jira · ${JIRA_TARGET.projectKey}`, tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'Applying parent–child hierarchies', tone: 'info' },
    { type: 'wait', ms: T.jira },
    { type: 'prdPhase', phase: 'done' },
    { type: 'watch', text: 'Export complete · traceability matrix updated', tone: 'ok' },
    { type: 'say', lines: [
      'Export complete. 4 Epics and 24 Stories created in project PAYMENTS, with issue links and parent–child hierarchies applied.',
      'The workspace now holds the full PRD-to-Jira traceability matrix. Workflow complete.',
    ] },
  ],

  /* Gate 3 · NO → destination change loop. */
  changeDest: [
    { type: 'say', lines: [
      'Select your export configuration:',
      '1. Change the Jira project key or board',
      '2. Export as CSV or Markdown',
      '3. Save as a workspace draft only',
    ] },
  ],
}

/* A revision to the produced document. Cosmetic in the prototype — the draft is
   deterministic — but the copy acknowledges the ask and points at History for
   the prior version, and it re-lands the artefact card. */
export function prdReviseDocument(subject: string): Effect[] {
  return [
    { type: 'watch', text: 'Revising the draft', tone: 'info' },
    { type: 'wait', ms: T.contract },
    { type: 'watch', text: 'Updated draft saved to history', tone: 'ok' },
    { type: 'say',
      lines: [
        `Done — I've updated the draft to reflect that. Open it to review the change; the previous version is kept under History if you want to compare or restore.`,
      ],
      block: { kind: 'document', name: prdDocTitle(subject), format: 'MD' },
    },
  ]
}

/* Typed feedback during a refinement loop. Matches the story's own example and
   re-presents the gate it belongs to, so the loop closes the way the task gates
   do. Returns null when nothing matches, so the caller can fall back. */
export function prdRouter(text: string): Effect[] | null {
  const t = text.toLowerCase()

  // Loop 1A — refining epics.
  if (/\b(epic|feature|scope|oauth|token)\b/.test(t) && /\b(add|extra|include|missing|split|merge)\b/.test(t)) {
    return [
      { type: 'watch', text: 'Updated Epic 4 · added Feature: OAuth Token Refresh Logic', tone: 'ok' },
      { type: 'say', lines: [
        'Updated Epic 4 to include a Feature for OAuth Token Refresh retry policies. Confirm the updated breakdown.',
      ], block: gate1() },
    ]
  }

  // Loop 2A — refining stories (e.g. the payment-timeout fallback).
  if (/\b(story|timeout|retry|queue|fallback|acceptance|criteria)\b/.test(t)) {
    return [
      { type: 'watch', text: 'Updated STORY-12 · retry queued after 15 minutes · DoR 100%', tone: 'ok' },
      { type: 'say', lines: [
        'Updated STORY-12 with the 15-minute queue retry policy. Definition of Ready is now 100%. Confirm the backlog is ready.',
      ], block: {
        kind: 'decision', step: 2, title: 'Confirm the backlog is ready',
        question: "Do these 24 stories meet your team's Definition of Ready?",
        summary: [{ label: '24 stories', detail: 'DoR 100%' }],
        options: [
          { label: 'Yes, backlog ready', beat: 'backlogReady', primary: true },
          { label: 'No, refine stories', beat: 'refineStories' },
        ],
      } },
    ]
  }

  return null
}
