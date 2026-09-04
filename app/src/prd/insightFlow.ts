/* The Product-Analytics & Feedback-Triage run — Example 3, a prompt-driven,
 * human-in-the-loop investigation for the PM (Raman).
 *
 * The PM types the first prompt ("show me the analytics after last night's
 * release"); AAVA matches a capability, proposes a plan, and on Proceed walks
 * an investigation in five steps — detect the anomaly, correlate friction with
 * feedback, audit the application logs, estimate the business impact, draft a
 * PRD. After every step the Canvas reveals the evidence and the run-progress
 * dock advances; the PM drives the next step from a suggestion chip (the
 * next question, pre-filled) or by typing it. The run ends by raising a P1
 * Jira ticket to the Billing team.
 *
 * It mirrors the backlog flow's shape (capability → plan → phased run with
 * artefacts and a Jira push), so it reuses the same block vocabulary. */
import type { BlockSpec, Effect, Message, PrepStep, ToolStep, Chip } from '../state/types'
import type { InsightView } from './insight'
import { INSIGHT_FILE } from './insight'
import { T } from '../state/timing'

/* The run-progress steps, one per Canvas view. Shown in the hanging dock below
   the session header once the run is underway (after Proceed). */
const PROGRESS_STEPS: PrepStep[] = [
  { key: 'funnel', label: 'Detect the anomaly', result: 'Step 3 flagged', detail: 'Scan post-release funnel & KPIs for anomalies' },
  { key: 'feedback', label: 'Correlate feedback', result: '42 tickets', detail: 'Cross-read friction telemetry with user feedback' },
  { key: 'audit', label: 'Audit application logs', result: 'root cause', detail: 'Filter the Step-3 CTA logs, pre vs post release' },
  { key: 'impact', label: 'Estimate impact', result: '$42k / week', detail: 'Model the affected cohort and revenue leakage' },
  { key: 'prd', label: 'Draft the PRD', result: 'PRD-2026-084', detail: 'Synthesise evidence into a P1 fix spec' },
]
const VIEW_PHASE: Record<InsightView, number> = { funnel: 0, feedback: 1, audit: 2, impact: 3, prd: 4 }

/** Where the run stands, derived from the run itself — the phase is the last
    view that landed while nothing is generating (you are reading it), or the
    next phase while a checklist is drafting it. `started` gates the whole dock:
    nothing shows during capability-match and planning, only once Proceed has
    kicked off the first step. No golden gates here — the PM drives each step
    from a chip — so `waiting` stays false and the dock reads blue. */
export function insightProgress(messages: Message[]): { steps: PrepStep[]; at: number; started: boolean; waiting: boolean } {
  let lastViewPhase = -1
  let running = false
  let started = false
  for (const m of messages) {
    const b = m.block
    if (b?.kind === 'document' && b.insight) {
      lastViewPhase = Math.max(lastViewPhase, VIEW_PHASE[b.insight])
      started = true
    }
    if (b?.kind === 'tools') { started = true; if (b.done < b.steps.length) running = true }
  }
  const lastIdx = PROGRESS_STEPS.length - 1
  const at = running
    ? Math.min(lastViewPhase + 1, PROGRESS_STEPS.length)
    : lastViewPhase >= lastIdx ? PROGRESS_STEPS.length : Math.max(0, lastViewPhase)
  return { steps: PROGRESS_STEPS, at, started, waiting: false }
}

/* Investigation pace — each analysis step dwells long enough to read the spinner
   resolve to a green tick, so the "running" state on the progress dock is
   visible rather than a flash. */
const GEN = 620
type Step = [label: string, result: string, ms?: number]

function status(steps: Step[], title?: string): Effect {
  const toolSteps: ToolStep[] = steps.map(([label, result, ms]) => ({ label, result, source: 'RUN', ms: ms ?? GEN }))
  return { type: 'tools', steps: toolSteps, title }
}

/** Reveal a view: the generated-view card in the chat (name + Open, which the
    progress dock reads to advance) AND a setInsight effect that swaps the Canvas
    to that dashboard automatically, so the evidence follows the run without the
    PM having to click Open. */
function reveal(view: InsightView, format: string): Effect[] {
  return [
    { type: 'say', lines: [], stream: false, block: { kind: 'document', name: INSIGHT_FILE[view], format, insight: view } },
    { type: 'setInsight', view },
  ]
}

/* ── The five next-step suggestion chips, keyed by the view just revealed. The
   `sends` text is the PM's next question (faithful to the source), and the
   router below maps it to the next beat. Both the chip and free typing work. */
const NEXT_PROMPT: Record<InsightView, string> = {
  funnel: "Yes, show me where users are getting stuck and what's causing the bounce-rate spike on Step 3.",
  feedback: 'The feedback points at the checkout submit CTA. Fetch the application logs for the Step 3 CTA and check the submit button for anomalies.',
  audit: "What's the estimated revenue impact if this persists over the weekend, and what share of our users is affected?",
  impact: 'Yes, draft the PRD — include repro steps from the session telemetry, acceptance criteria for Safari autofill, and success metrics for recovery.',
  prd: '', // the finale is the Jira-push card, not a chip
}
const CHIP_LABEL: Record<InsightView, string> = {
  funnel: 'Show me where users are getting stuck',
  feedback: 'Fetch the Step-3 CTA logs',
  audit: "What's the revenue impact?",
  impact: 'Draft the PRD & fix spec',
  prd: '',
}

/** The suggestion chip for the current run state — the next question, pre-filled.
    Derived from the last view that landed (like the progress dock). Empty once
    the PRD is drafted (the Jira-push card takes over). */
export function insightChips(messages: Message[]): Chip[] {
  let last: InsightView | null = null
  for (const m of messages) {
    if (m.block?.kind === 'document' && m.block.insight) last = m.block.insight
  }
  if (!last || !NEXT_PROMPT[last]) return []
  return [{ label: CHIP_LABEL[last], sends: NEXT_PROMPT[last] }]
}

/* The Jira ticket links shown after a successful raise. */
const JIRA_LINKS: BlockSpec = {
  kind: 'links', links: [
    { label: 'BILL-2291 · Checkout Step 3 Safari autofill fix', href: 'https://aava-demo.atlassian.net/browse/BILL-2291' },
    { label: 'Billing board', href: 'https://aava-demo.atlassian.net/jira/software/projects/BILL/boards/4' },
  ],
}

/* The run opens with capability matching, then a plan the PM approves. Nothing
   executes until Proceed — the plan is the "plan step" the demo calls out. */
export function insightOpening(): Effect[] {
  return [
    { type: 'watch', text: 'Matching a capability for this request', tone: 'info' },
    { type: 'say', lines: [], stream: false, block: {
      kind: 'capability', searching: true, badge: 'PAT-1.0',
      maps: "This maps to the 'Product Analytics & Feedback Triage' agentic process. I can take it end-to-end:",
      chips: [
        'Post-release anomaly detection',
        'Feedback synthesis & clustering',
        'Application-log root-cause audit',
        'Impact modelling & PRD drafting',
      ],
    } },
    { type: 'wait', ms: 2500 },
    { type: 'capabilityMatched' },
    { type: 'watch', text: 'Matched · Product Analytics & Feedback Triage (PAT-1.0)', tone: 'ok' },
    { type: 'say', lines: [
      'Good morning, Raman. Here is how I will approach it — I will investigate the drop step by step and show you the evidence in the canvas after each one, then draft a fix PRD you can raise to engineering.',
    ] },
    { type: 'say', lines: [], stream: false, block: {
      kind: 'plan', count: 5, title: 'Product Analytics & Feedback Triage',
      action: { label: 'Proceed', beat: 'startAnalysis' },
      steps: [
        { title: 'Detect the anomaly', detail: 'Scan the post-v3.4 funnel and KPIs, isolate the anomalous step' },
        { title: 'Correlate friction & feedback', detail: 'Cross-read Step-3 telemetry with the 42 incoming tickets' },
        { title: 'Audit the application logs', detail: 'Filter the submit-CTA logs, pre vs post release, for the root cause' },
        { title: 'Estimate the business impact', detail: 'Model the affected cohort, revenue leakage and ticket surge' },
        { title: 'Draft the PRD & fix spec', detail: 'Synthesise the evidence into a P1 PRD; raise it to Billing' },
      ],
    } },
  ]
}

export const INSIGHT_BEATS: Record<string, Effect[]> = {
  /* Step 1 · Detect the anomaly. */
  startAnalysis: [
    { type: 'watch', text: 'Pulling GA4 telemetry · post-v3.4', tone: 'info' },
    status([
      ['Connecting to Google Analytics 4', 'Production v3.4', T.repo],
      ['Loading the acquisition & checkout funnel', '4 steps'],
      ['Comparing against the pre-release baseline', 'done'],
      ['Scanning for conversion & rage-click anomalies', '1 anomaly'],
    ], 'Analytics · scanning for anomalies'),
    { type: 'watch', text: 'Anomaly detected · Step 3', tone: 'warn' },
    ...reveal('funnel', 'LIVE'),
    { type: 'say', lines: [
      'Post-release v3.4 telemetry shows an anomaly: checkout conversion dropped 22% over the last 48 hours, and I detected a 310% spike in rage clicks clustered on Step 3 (payment authentication). The funnel is open in the canvas — Step 3 is where the drop-off concentrates.',
      'Want me to isolate the friction points on Step 3 and correlate them with the incoming user feedback?',
    ] },
  ],

  /* Step 2 · Correlate friction & feedback. */
  correlate: [
    { type: 'watch', text: 'Reading Step-3 session telemetry', tone: 'info' },
    status([
      ['Loading Step-3 session telemetry', 'done', T.repo],
      ['Measuring time-on-task and bounce', '4m 45s · 38.2%'],
      ['Ingesting feedback from tickets & surveys', '42 items'],
      ['Clustering feedback semantically', '93% coherence'],
    ], 'Friction · telemetry & feedback'),
    { type: 'watch', text: '42 tickets synthesised', tone: 'ok' },
    ...reveal('feedback', 'LIVE'),
    { type: 'say', lines: [
      'Step-3 time-on-task surged to 4m 45s (+295%) and the step bounce rate jumped to 38.2%. I read all 42 incoming tickets and surveys — 90% call out an unresponsive submit button, 81% are on Apple WebKit, and 100% report a silent failure with no error shown. The synthesis and every ticket are in the canvas.',
      'The pattern points squarely at the checkout submit CTA. Shall I fetch the application logs for the Step-3 submit button and check it for anomalies?',
    ] },
  ],

  /* Step 3 · Audit the application logs. */
  auditLogs: [
    { type: 'watch', text: 'Querying application logs · #submit-payment-btn', tone: 'info' },
    status([
      ['Filtering app logs to the Step-3 submit CTA', '#submit-payment-btn', T.repo],
      ['Diffing occurrences pre vs post v3.4', '0 → 1,840'],
      ['Locating the first post-deploy error', '22:04 UTC'],
      ['Isolating the root exception', 'FormValidationBypass'],
    ], 'Log audit · Step-3 submit CTA'),
    { type: 'watch', text: 'Root cause isolated', tone: 'ok' },
    ...reveal('audit', 'LOG'),
    { type: 'say', lines: [
      'The logs are conclusive. Zero errors on the CTA in the 24 hours before the release; 1,840 errors in the 12 hours since, first seen at 22:04 UTC — four minutes after the v3.4 deploy — and 100% on Safari/WebKit.',
      'Root cause: when Safari autofills the address, WebKit suppresses the synthetic input event on the postal-code field, so the client validator stays locked in isFormValid=false and the submit button is left permanently disabled with no visual feedback. The timeline and log audit are in the canvas.',
      'Want me to estimate the business impact if this holds over the weekend?',
    ] },
  ],

  /* Step 4 · Estimate the business impact. */
  estimateImpact: [
    { type: 'watch', text: 'Modelling business impact', tone: 'info' },
    status([
      ['Sizing the affected Safari cohort', '18,200 users', T.repo],
      ['Projecting abandoned-subscription ARR', '$42k / week'],
      ['Forecasting support-ticket volume', '85 → 140'],
      ['Modelling post-fix recovery', 'done'],
    ], 'Impact · modelling the leakage'),
    { type: 'watch', text: 'Impact model ready', tone: 'ok' },
    ...reveal('impact', 'MODEL'),
    { type: 'say', lines: [
      'The impact is material: 18,200 monthly active Safari visitors are affected — 28.4% of checkout traffic — for an estimated $42,000/week in abandoned new subscriptions. Support tickets stand at 85 and are projected to reach 140 by Sunday if unresolved. The model, including the recovery case, is in the canvas.',
      'I can draft a high-priority PRD and fix spec — repro steps, browser telemetry, the validation fix, acceptance criteria and success metrics. Shall I generate it?',
    ] },
  ],

  /* Step 5 · Draft the PRD, then offer the Jira push. */
  draftPrd: [
    { type: 'watch', text: 'Drafting PRD-2026-084', tone: 'info' },
    status([
      ['Synthesising telemetry, logs & feedback', 'done', T.repo],
      ['Writing repro steps from session telemetry', 'done'],
      ['Drafting acceptance criteria for Safari autofill', '3 AC'],
      ['Setting success & metric-recovery criteria', 'done'],
      ['Applying the PRD template', 'PRD-2026-084'],
    ], 'PRD · drafting the fix spec'),
    { type: 'watch', text: 'PRD-2026-084 drafted · P1', tone: 'ok' },
    ...reveal('prd', 'MD'),
    { type: 'say',
      lines: [
        'PRD-2026-084 is drafted and open in the canvas — a P1 hotfix spec: recover funnel conversion to ≥ 4.0% and restore the $42,000/week run-rate, with WebKit DOMAutoComplete listeners and visible inline validation as the key requirements. Review or edit it on the right.',
        'Want me to raise this as a P1 Jira ticket for the Billing engineering team?',
      ],
      block: {
        kind: 'sync', title: 'Raise a P1 Jira ticket · Billing', detail: 'PRD-2026-084 · P1 · project BILL',
        beat: 'raiseTicket', primaryLabel: 'Raise ticket', secondaryLabel: 'Not yet', secondaryBeat: 'ticketSkipped',
      },
    },
  ],

  /* Raise the Jira ticket — the run's outcome. */
  raiseTicket: [
    { type: 'watch', text: 'Creating P1 issue · Billing', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'BILL-2291 created · Jira', tone: 'ok' },
    { type: 'say',
      lines: ['Raised BILL-2291 on the Billing board as a P1, with PRD-2026-084 attached and the repro steps, telemetry and acceptance criteria carried across. No more actions on you for now — engineering picks it up from here.'],
      block: JIRA_LINKS,
    },
  ],

  ticketSkipped: [
    { type: 'say', lines: ['Understood — I have left PRD-2026-084 as an editable draft in the canvas. Whenever you are ready, ask me and I will raise it to the Billing team.'] },
  ],
}

/* Typed messages inside the insight run map to the next investigation step. The
   chips send these exact prompts; free typing that names the same thing works
   too. Checked most-specific first so a later step's keywords win over an
   earlier step's. */
export function insightRouter(text: string): Effect[] | null {
  const t = text.toLowerCase()
  if (/\b(jira|ticket|issue|raise|billing|engineering team)\b/.test(t)) return INSIGHT_BEATS.raiseTicket
  if (/\b(prd|draft|generate|fix spec|acceptance criteria|repro)\b/.test(t)) return INSIGHT_BEATS.draftPrd
  if (/\b(impact|revenue|arr|cost|weekend|affected|user base|how many)\b/.test(t)) return INSIGHT_BEATS.estimateImpact
  if (/\b(log|logs|cta|submit|button|exception|application log|console)\b/.test(t)) return INSIGHT_BEATS.auditLogs
  if (/\b(stuck|friction|feedback|bounce|complaint|ticket|survey|where)\b/.test(t)) return INSIGHT_BEATS.correlate
  return null
}

/* Fallback — a message that matches no step re-grounds the PM on the next move
   rather than dead-ending. */
export function insightReply(): Effect[] {
  return [{ type: 'say', lines: [
    'I can keep going on the investigation — use the suggested next step below, or ask me for the friction, the logs, the impact, or the PRD directly.',
  ] }]
}
