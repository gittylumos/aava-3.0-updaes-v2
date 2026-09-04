/* Content for the structured PM Analytics → Report run (Example 4).
 *
 * A more flow-based sibling of the Product-Analytics run: the PM asks for an
 * analytics triage, AAVA analyses + correlates the two data streams, then
 * branches on a human choice — model the revenue impact, or go straight to a
 * summary — and finishes by raising a bug ticket with the report attached.
 *
 * Unlike the earlier run, the Canvas shows the evidence as *named files* opened
 * in tabs (an .html analysis report, a .pdf impact/recommendations report),
 * Deepak-canvas style. The dashboards themselves are reused from InsightCanvas;
 * this module only names the assets and holds the report-only copy. */
export type ReportView = 'analysis' | 'impact' | 'recommendations'

/** Each asset is a named file the Canvas opens as a tab. */
export const REPORT_ASSETS: Record<ReportView, { file: string; kind: 'html' | 'pdf' }> = {
  analysis: { file: 'Analysis Insights.html', kind: 'html' },
  impact: { file: 'Analysis Insights with Revenue Impact.pdf', kind: 'pdf' },
  recommendations: { file: 'Analysis Insights & Recommendations.pdf', kind: 'pdf' },
}

/** Order assets appear as tabs, and the order the progress dock reads. */
export const REPORT_ORDER: ReportView[] = ['analysis', 'impact', 'recommendations']

/* The recommendations/summary report body (branch B, and the tail of the impact
   PDF). Plain sections rendered as a report page in the Canvas tab. */
export interface ReportSection { title: string; body?: string; items?: string[] }

export const REPORT_META = {
  title: 'Checkout Step 3 — Safari “Make Payment” failure',
  subtitle: 'Post-Release v3.4 · Product Analytics & Feedback Triage',
  severity: 'P1 · High',
}

export const REPORT_SECTIONS: ReportSection[] = [
  {
    title: '1. Summary',
    body: 'Following Release v3.4, checkout conversion dropped 22% over 48 hours, driven by a steep drop-off at Step 3 of the funnel and a 310% spike in rage clicks on the “Make Payment” CTA. Survey feedback corroborates it: 81% of submissions are from the iOS ecosystem, 90% of those call out an unresponsive submit button, and 50% report a silent failure with no error shown.',
  },
  {
    title: '2. Root-cause hypothesis',
    body: 'Safari users cannot complete a purchase because the “Make Payment” button appears broken — the backend call is not invoked on click. Consistent with a WebKit event-handling regression introduced in v3.4.',
  },
  {
    title: '3. Steps to reproduce',
    items: [
      'On Safari (iOS or macOS), add an item and proceed to checkout.',
      'Complete Steps 1–2, reach Step 3 (payment).',
      'Fill valid card details and tap “Make Payment”.',
      'Observe: no network request fires, no error shown, the button appears inert.',
    ],
  },
  {
    title: '4. Recommendations',
    items: [
      'Hotfix the “Make Payment” click handler for WebKit; ensure the payment backend call fires on tap.',
      'Add a visible error/loading state so a failed submit is never silent.',
      'Add a Safari checkout smoke test to the release gate to catch this class of regression.',
    ],
  },
]

/* The extra section the impact PDF carries on top of the above. */
export const REPORT_IMPACT_SECTION: ReportSection = {
  title: '5. Revenue impact',
  items: [
    'Affected cohort: 18,200 monthly active Safari visitors — 28.4% of checkout traffic.',
    'Estimated leakage: $42,000 / week in abandoned new subscriptions.',
    'Support load: 85 tickets today, projected to reach 140 by Sunday if unresolved.',
    'A hotfix within 24h recovers the run-rate and returns tickets toward baseline.',
  ],
}
