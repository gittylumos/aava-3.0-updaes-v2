/* The PM Analytics → Report run (Example 4) — a structured, gate-driven triage.
 *
 * Flow (from the spec doc):
 *   capability match (4 capabilities) → plan (4 steps) → Gate 1 (Proceed)
 *   → analyse + correlate → Analysis Insights.html → Gate 2 (calculate impact? A/B)
 *      A → model the impact → …Revenue Impact.pdf → Gate 3 (raise ticket?)
 *      B → draft a summary   → …Recommendations.pdf → Gate 3 (raise ticket?)
 *   → raise a bug ticket, report attached.
 *
 * The gates are decision blocks (buttons), so the run advances through runBeat,
 * not chips. Canvas assets are named files opened as tabs (see ReportCanvas). */
import type { BlockSpec, Effect, Message, PrepStep, ToolStep } from '../state/types'
import type { ReportView } from './report'
import { REPORT_ASSETS } from './report'
import { T } from '../state/timing'

const PROGRESS_STEPS: PrepStep[] = [
  { key: 'analyze', label: 'Analyze analytics & feedback', result: 'anomaly found', detail: 'Scan web-analytics + survey feedback for changes' },
  { key: 'correlate', label: 'Correlate & summarise', result: 'hypothesis', detail: 'Synthesise the two streams into insights' },
  { key: 'impact', label: 'Estimate impact', result: 'optional', detail: 'Model the user / business impact' },
  { key: 'report', label: 'Prepare report', result: 'triage report', detail: 'Synthesise the evidence with next steps' },
]

/** Progress derived from which assets have landed (see the reveal() helper). No
    golden gates on the dock — the decision cards carry the pauses. */
export function reportProgress(messages: Message[]): { steps: PrepStep[]; at: number; started: boolean; waiting: boolean } {
  let analysis = false, impact = false, recommendations = false, started = false, running = false
  for (const m of messages) {
    const b = m.block
    if (b?.kind === 'document' && b.report) {
      started = true
      if (b.report === 'analysis') analysis = true
      if (b.report === 'impact') impact = true
      if (b.report === 'recommendations') recommendations = true
    }
    if (b?.kind === 'tools') { started = true; if (b.done < b.steps.length) running = true }
    if (b?.kind === 'links' && m.from === 'aava') recommendations = recommendations || impact // ticket end
  }
  const at = recommendations || impact ? 4 : analysis ? 2 : running ? 1 : 0
  return { steps: PROGRESS_STEPS, at, started, waiting: false }
}

const GEN = 620
type Step = [label: string, result: string, ms?: number]
function status(steps: Step[], title?: string): Effect {
  const toolSteps: ToolStep[] = steps.map(([label, result, ms]) => ({ label, result, source: 'RUN', ms: ms ?? GEN }))
  return { type: 'tools', steps: toolSteps, title }
}

/** Reveal an asset: a named-file card in the chat + a setReport effect that opens
    it as the active tab in the Canvas. */
function reveal(view: ReportView): Effect[] {
  const { file, kind } = REPORT_ASSETS[view]
  return [
    { type: 'say', lines: [], stream: false, block: { kind: 'document', name: file, format: kind.toUpperCase(), report: view } },
    { type: 'setReport', view },
  ]
}

/** The A/B and raise-ticket gates. Decision buttons, so option beats fire via
    runBeat. */
function gate(title: string, question: string, options: { label: string; beat: string; primary?: boolean }[]): BlockSpec {
  return { kind: 'decision', variant: 'buttons', title, question, options }
}

const JIRA_LINKS: BlockSpec = {
  kind: 'links', links: [
    { label: 'BILL-2291 · Checkout Step 3 “Make Payment” failure', href: 'https://aava-demo.atlassian.net/browse/BILL-2291' },
    { label: 'Billing board', href: 'https://aava-demo.atlassian.net/jira/software/projects/BILL/boards/4' },
  ],
}

export function pmReportOpening(): Effect[] {
  return [
    { type: 'watch', text: 'Matching a capability for this request', tone: 'info' },
    { type: 'say', lines: ['Good morning, Raman. Reviewing the requirement and identifying the right capability for the job.'] },
    { type: 'say', lines: [], stream: false, block: {
      kind: 'capability', searching: true, badge: 'PAT-1.0',
      maps: "This maps to the 'Product Analytics & Feedback Triage' agentic process with these capabilities:",
      chips: [
        'Web Analytics analysis',
        'Customer Feedback analysis & clustering',
        'Impact Analysis',
        'Report Preparation',
      ],
    } },
    { type: 'wait', ms: 2500 },
    { type: 'capabilityMatched' },
    { type: 'watch', text: 'Matched · Product Analytics & Feedback Triage (PAT-1.0)', tone: 'ok' },
    { type: 'say', lines: ["Here's the sequence of steps. You can review the output after each milestone and provide directions."] },
    { type: 'say', lines: [], stream: false, block: {
      kind: 'plan', count: 4, title: 'Product Analytics & Feedback Triage',
      action: { label: 'Proceed', beat: 'startAnalysis' },
      steps: [
        { title: 'Analyze web analytics and customer feedback', detail: 'Check for significant changes in metrics and behavior patterns' },
        { title: 'Correlate the data and provide summary', detail: 'Synthesise data from the two sources and provide insights' },
        { title: 'Estimate the impact (optional)', detail: 'Estimate the user / business impact (adoption / revenue) from the new numbers' },
        { title: 'Prepare Analysis Report & recommendations', detail: 'Synthesise the evidence into a report with actionable next steps' },
      ],
    } },
  ]
}

export const PM_REPORT_BEATS: Record<string, Effect[]> = {
  /* Gate 1 · Proceed → analyse + correlate → Analysis Insights.html → Gate 2. */
  startAnalysis: [
    { type: 'watch', text: 'Pulling GA4 telemetry + survey feedback', tone: 'info' },
    status([
      ['Connecting to Google Analytics 4', 'Production v3.4', T.repo],
      ['Loading the checkout funnel & KPIs', '4 steps'],
      ['Ingesting survey feedback submissions', 'clustered'],
      ['Correlating analytics with feedback', '1 anomaly'],
    ], 'Analysis · web analytics & feedback'),
    { type: 'watch', text: 'Anomaly detected · Step 3', tone: 'warn' },
    { type: 'say', lines: [
      "Post-release v3.4 telemetry from Web Analytics shows an anomaly: checkout conversion dropped 22% over the last 48 hours, driven by a steep drop-off at Step 3 of the conversion funnel. This correlates to a 310% spike in rage clicks on the 'Make Payment' CTA in Step 3.",
      'There was also a higher number of user-feedback survey submissions — 81% from the iOS ecosystem, of which 90% call out an unresponsive submit button and 50% report a silent failure with no error shown.',
      "Hypothesis: Safari users can't complete a purchase because the 'Make Payment' button appears broken — the backend call is not invoked on click. This needs to be fixed asap.",
      "Here's the analysis report — you can explore it on the canvas.",
    ] },
    ...reveal('analysis'),
    { type: 'say',
      lines: ['Would you like to understand what this means in terms of revenue impact?'],
      block: gate('Estimate the revenue impact?', 'This step is optional — I can model it, or go straight to a summary report.', [
        ['Yes, calculate impact', 'calcImpact', true],
        ['No, prepare a summary report', 'prepSummary'],
      ].map(([label, beat, primary]) => ({ label: label as string, beat: beat as string, primary: !!primary }))),
    },
  ],

  /* Gate 2 · A — model the impact → …Revenue Impact.pdf → Gate 3. */
  calcImpact: [
    { type: 'watch', text: 'Modelling business impact', tone: 'info' },
    status([
      ['Sizing the affected Safari cohort', '18,200 users', T.repo],
      ['Projecting abandoned-subscription ARR', '$42k / week'],
      ['Forecasting support-ticket volume', '85 → 140'],
      ['Modelling post-fix recovery', 'done'],
    ], 'Impact · modelling the leakage'),
    { type: 'watch', text: 'Impact model ready', tone: 'ok' },
    { type: 'say', lines: [
      'The impact is material: 18,200 monthly active Safari visitors are affected — 28.4% of checkout traffic — for an estimated $42,000/week in abandoned new subscriptions. Support tickets stand at 85 and are projected to reach 140 by Sunday if unresolved.',
      "Here's the PDF report summarising the issue, the revenue impact and recommendations.",
    ] },
    ...reveal('impact'),
    { type: 'say',
      lines: ['I can now raise a Jira ticket for the engineering team and attach this report. Should I go ahead?'],
      block: gate('Raise a bug ticket?', 'I will attach the report and assign it to the relevant team.', [
        { label: 'Raise ticket', beat: 'raiseTicket', primary: true },
        { label: 'Not yet', beat: 'ticketSkipped' },
      ]),
    },
  ],

  /* Gate 2 · B — draft a summary → …Recommendations.pdf → Gate 3. */
  prepSummary: [
    { type: 'watch', text: 'Drafting a summary report', tone: 'info' },
    status([
      ['Synthesising telemetry, logs & feedback', 'done', T.repo],
      ['Writing steps to reproduce', 'done'],
      ['Drafting recommendations', 'done'],
    ], 'Drafting a summary report'),
    { type: 'watch', text: 'Summary report ready', tone: 'ok' },
    { type: 'say', lines: ["Here's the PDF report summarising the issue along with recommendations."] },
    ...reveal('recommendations'),
    { type: 'say',
      lines: ['I can now raise a Jira ticket for the engineering team and attach this report. Should I go ahead?'],
      block: gate('Raise a bug ticket?', 'I will attach the report and assign it to the relevant team.', [
        { label: 'Raise ticket', beat: 'raiseTicket', primary: true },
        { label: 'Not yet', beat: 'ticketSkipped' },
      ]),
    },
  ],

  /* Gate 3 · raise the bug ticket — the run's outcome. */
  raiseTicket: [
    { type: 'watch', text: 'Creating bug ticket · Billing', tone: 'info' },
    { type: 'wait', ms: T.prCreate },
    { type: 'watch', text: 'BILL-2291 created · Jira', tone: 'ok' },
    { type: 'say',
      lines: ['Raised the bug ticket on the Billing board with the triage report attached and assigned to the relevant team. No more actions on you for now — engineering picks it up from here.'],
      block: JIRA_LINKS,
    },
  ],

  ticketSkipped: [
    { type: 'say', lines: ['Understood — the report stays open in the canvas. Ask me whenever you would like to raise the ticket.'] },
  ],
}
