/* Content for the Product-Analytics & Feedback-Triage run (Example 3).
 *
 * A PM (Raman) asks AAVA to look at the analytics after last night's release.
 * AAVA walks an investigation — anomaly → friction & feedback → application-log
 * audit → business impact → a drafted PRD — and after every step the Canvas
 * shows the evidence for what it just said. This module holds that evidence as
 * plain data; `InsightCanvas` renders it, `insightFlow` scripts the run.
 *
 * The five Canvas views, in order. Each step of the run reveals the next one and
 * the run-progress dock advances with it. */
export type InsightView = 'funnel' | 'feedback' | 'audit' | 'impact' | 'prd'

/** Order of the views == order of the investigation, so the progress dock and
    the "reopen this view" affordances can derive the phase from the view. */
export const INSIGHT_ORDER: InsightView[] = ['funnel', 'feedback', 'audit', 'impact', 'prd']

/** The file name each view opens as, shown on the artefact card in the chat. */
export const INSIGHT_FILE: Record<InsightView, string> = {
  funnel: 'funnel-anomaly.view',
  feedback: 'step3-feedback.view',
  audit: 'cta-log-audit.view',
  impact: 'revenue-impact.view',
  prd: 'PRD-2026-084.md',
}

export type Delta = { text: string; tone: 'pos' | 'neg' | 'warn' | 'flat' }
export interface Kpi { label: string; value: string; delta?: Delta; tone?: 'text' | 'danger' | 'warn' | 'ok' | 'blue' }

/* ── View 1 · Funnel & anomaly detection ─────────────────────────────────── */

export const FUNNEL_KPIS: Kpi[] = [
  { label: 'Weekly visitors', value: '142.5k', delta: { text: '▲ +4.2% vs last week', tone: 'pos' } },
  { label: 'Checkout conversion', value: '3.1%', tone: 'danger', delta: { text: '▼ −22.4% · threshold 4.0%', tone: 'neg' } },
  { label: 'Rage-click sessions', value: '1,240', tone: 'warn', delta: { text: '▲ +310% surge', tone: 'warn' } },
  { label: 'Checkout CSAT', value: '3.4 / 5', delta: { text: '▼ −0.8 pts drop', tone: 'neg' } },
]

export interface FunnelStep { name: string; count: string; pct: number; drop: string; tone: 'blue' | 'danger' | 'ok'; alert?: boolean; badge?: string }
export const FUNNEL_STEPS: FunnelStep[] = [
  { name: 'Step 1 · Landing & pricing', count: '100,000', pct: 100, drop: 'Baseline 100%', tone: 'blue' },
  { name: 'Step 2 · Account creation', count: '65,000', pct: 65, drop: '35% drop-off (normal)', tone: 'blue' },
  { name: 'Step 3 · Payment details', count: '38,350', pct: 38, drop: '▼ 41.0% drop-off (+22% vs baseline)', tone: 'danger', alert: true, badge: 'Anomaly' },
  { name: 'Step 4 · Order confirmed', count: '3,100', pct: 8, drop: '3.1% overall conversion', tone: 'ok' },
]

/* ── View 2 · Step-3 friction & customer feedback ────────────────────────── */

export const FRICTION_KPIS: Kpi[] = [
  { label: 'Avg time-on-task', value: '4m 45s', tone: 'warn', delta: { text: '▲ +295% · baseline 1m 12s', tone: 'warn' } },
  { label: 'Step bounce rate', value: '38.2%', tone: 'danger', delta: { text: '▲ 2.6× · norm 14.5%', tone: 'neg' } },
  { label: 'Avg form interactions', value: '12.4 fields', delta: { text: 'Repeated edits on shipping form', tone: 'warn' } },
  { label: 'Feedback volume', value: '42 tickets', delta: { text: 'Tagged to checkout flow', tone: 'neg' } },
]

export interface Synthesis { metric: string; title: string; body: string }
export const FEEDBACK_SYNTHESIS: Synthesis[] = [
  { metric: '38 of 42 · 90%', title: 'Unresponsive submit CTA', body: "Users report the 'Complete Order' / 'Submit Payment' button does not react to clicks or taps." },
  { metric: '34 of 42 · 81%', title: 'Device / browser isolation', body: 'Concentrated exclusively on Apple WebKit — Safari macOS, iPhone Safari, iPadOS.' },
  { metric: '42 of 42 · 100%', title: 'Silent UI failure', body: 'No error notification, field outline or toast shown; users assume the system has frozen.' },
  { metric: '29 of 42 · 69%', title: 'Triggered by autofill', body: 'Occurs immediately after using browser Keychain or an Apple Pay suggested address.' },
]

export interface Feedback { quote: string; user: string; device: string; time: string; tag: string; urgent: boolean }
export const FEEDBACK_ITEMS: Feedback[] = [
  { quote: "Tried checking out on my phone during lunch. It wouldn't let me hit submit.", user: 'Enterprise Lead', device: 'Safari iOS 17.5', time: '34m ago', tag: 'CSAT 1/5', urgent: true },
  { quote: 'The form is completely broken on Mac Safari. Re-entered my address twice and the checkout button stays stuck.', user: 'Pro Tier User', device: 'Safari macOS 14.4', time: '1h ago', tag: 'Ticket #89201', urgent: true },
  { quote: 'Card info is 100% correct, but the checkout submit button stays unclickable on Safari. Super frustrating.', user: 'Annual Subscriber', device: 'Safari macOS 14.2', time: '2h ago', tag: 'Ticket #89188', urgent: true },
  { quote: 'Checkout page felt very slow compared to yesterday. Kept tapping the button.', user: 'New Sign-up', device: 'Mobile Safari', time: '3h ago', tag: 'In-app Survey', urgent: false },
  { quote: "Can't complete payment on iPad Pro. Button does not respond to taps.", user: 'Design Agency', device: 'iPadOS 17.4', time: '3h ago', tag: 'Intercom #1204', urgent: true },
  { quote: 'Using Apple Pay autofill broke the final submit button. Had to abandon.', user: 'E-comm Founder', device: 'Safari macOS 14.3', time: '4h ago', tag: 'Ticket #89172', urgent: true },
  { quote: 'Nothing happens when clicking Complete Order. Tried 6 times.', user: 'Marketing Director', device: 'Safari iOS 17.4', time: '4h ago', tag: 'CSAT 1/5', urgent: true },
  { quote: 'Button stays grayed out even though all billing inputs are filled.', user: 'Operations Manager', device: 'Safari macOS 14.4', time: '4h ago', tag: 'Ticket #89165', urgent: true },
  { quote: "Payment gateway didn't trigger. Switched to Chrome and it worked immediately.", user: 'Product Lead', device: 'macOS Chrome 122', time: '5h ago', tag: 'In-app Feedback', urgent: false },
  { quote: 'Stuck on Step 3 for 10 minutes. The button won’t activate after address autofill.', user: 'Freelance Designer', device: 'Safari macOS 14.1', time: '5h ago', tag: 'Ticket #89150', urgent: true },
  { quote: 'Tapped Complete Purchase four times on iPhone 15, zero feedback.', user: 'Individual Pro', device: 'Mobile Safari 17.3', time: '5h ago', tag: 'Intercom #1198', urgent: true },
  { quote: 'Address populated automatically from iCloud Keychain, but submit remained disabled.', user: 'Engineering Manager', device: 'Safari macOS 14.4', time: '6h ago', tag: 'Ticket #89142', urgent: true },
  { quote: 'Thought my credit card was declined, but no error code was shown at all.', user: 'Finance Director', device: 'Safari macOS 14.2', time: '6h ago', tag: 'CSAT 2/5', urgent: false },
  { quote: 'Clicking submit does nothing. Checked developer console, seeing form state lock.', user: 'Frontend Dev', device: 'Safari macOS 14.4', time: '6h ago', tag: 'Community Forum', urgent: true },
  { quote: 'Unable to upgrade plan today. Complete Order button unresponsive.', user: 'Startup CEO', device: 'Safari iOS 17.4', time: '7h ago', tag: 'Zendesk #4012', urgent: true },
  { quote: 'Safari mobile checkout button dead. Lost 15 minutes of my morning.', user: 'Growth Lead', device: 'iPhone 14 Pro Safari', time: '7h ago', tag: 'CSAT 1/5', urgent: true },
  { quote: 'Payment form does not recognize my postal code after Safari suggested address.', user: 'Brand Manager', device: 'Safari macOS 14.4', time: '7h ago', tag: 'Ticket #89129', urgent: true },
  { quote: 'Gave up on subscription renewal. Button won’t click on Mac.', user: 'Business Analyst', device: 'Safari macOS 13.6', time: '8h ago', tag: 'Ticket #89115', urgent: true },
  { quote: 'Tapping Complete Payment gives zero indication of loading or error.', user: 'Architect', device: 'iPad Air Safari', time: '8h ago', tag: 'CSAT 1/5', urgent: false },
  { quote: 'Is your checkout down? Tried Safari on both my MacBook and iPhone.', user: 'Creative Director', device: 'Multi-device Apple', time: '8h ago', tag: 'Intercom #1184', urgent: true },
  { quote: 'Filled out credit card twice. The button never turned active.', user: 'Consultant', device: 'Safari macOS 14.0', time: '9h ago', tag: 'Ticket #89098', urgent: false },
  { quote: 'Autofill fills city and zip, but the submit button stays unclickable.', user: 'Tech Lead', device: 'Safari iOS 17.2', time: '9h ago', tag: 'In-app Survey', urgent: true },
  { quote: 'Order button completely inactive on Safari. Please fix ASAP.', user: 'Head of Growth', device: 'Safari macOS 14.4', time: '9h ago', tag: 'Zendesk #4001', urgent: true },
  { quote: 'Cannot purchase additional seats for my team. Submit button is frozen.', user: 'Team Admin', device: 'Safari macOS 14.3', time: '10h ago', tag: 'Ticket #89076', urgent: true },
  { quote: 'Pressed the button multiple times, thought page hung.', user: 'Content Strategist', device: 'Mobile Safari', time: '10h ago', tag: 'CSAT 1/5', urgent: false },
  { quote: "Card details valid, address valid, but submit button won't submit.", user: 'Enterprise Client', device: 'Safari macOS 14.4', time: '10h ago', tag: 'Ticket #89064', urgent: true },
  { quote: 'Checkout step 3 is broken on iOS Safari 17.5.', user: 'QA Consultant', device: 'iPhone 13 Safari', time: '11h ago', tag: 'Community Forum', urgent: true },
  { quote: 'Tried ordering on iPad, button did not trigger gateway.', user: 'Agency Partner', device: 'iPadOS Safari', time: '11h ago', tag: 'Intercom #1167', urgent: false },
  { quote: 'Button is disabled without telling me which field is invalid.', user: 'VP Product', device: 'Safari macOS 14.4', time: '11h ago', tag: 'Ticket #89052', urgent: true },
  { quote: 'Why is Complete Order unclickable? No error message is highlighted.', user: 'Solo Founder', device: 'Safari macOS 14.2', time: '11h ago', tag: 'CSAT 1/5', urgent: true },
  { quote: "Checkout stopped working after last night's update on Mac.", user: 'Developer', device: 'Safari macOS 14.4', time: '12h ago', tag: 'Ticket #89039', urgent: true },
  { quote: 'Button does not register clicks when using Apple Pay contact info.', user: 'Pro Subscriber', device: 'Safari iOS 17.4', time: '12h ago', tag: 'Zendesk #3988', urgent: true },
  { quote: 'Safari autofill leaves the postal code unverified in the background.', user: 'Senior Engineer', device: 'Safari macOS 14.4', time: '12h ago', tag: 'Bug Report #89028', urgent: true },
  { quote: "Can't complete checkout on phone while commuting.", user: 'Sales Manager', device: 'iPhone 15 Safari', time: '12h ago', tag: 'CSAT 1/5', urgent: false },
  { quote: 'Clicked 5 times in frustration before closing tab.', user: 'Senior Designer', device: 'Safari macOS 14.1', time: '12h ago', tag: 'In-app Modal', urgent: true },
  { quote: 'Payment form unresponsive on Safari desktop.', user: 'Operations Lead', device: 'Safari macOS 14.3', time: '13h ago', tag: 'Ticket #89015', urgent: true },
  { quote: "Submit button doesn't turn blue after autofill.", user: 'Account Executive', device: 'Safari macOS 14.4', time: '13h ago', tag: 'Ticket #89008', urgent: false },
  { quote: 'Failed checkout attempt on iPad Mini. No errors displayed.', user: 'Digital Marketer', device: 'iPadOS 17.3', time: '13h ago', tag: 'Intercom #1150', urgent: false },
  { quote: 'Customer unable to pay invoice due to broken submit CTA.', user: 'Support Agent Relay', device: 'Customer Safari macOS', time: '13h ago', tag: 'Zendesk #3972', urgent: true },
  { quote: "I had to borrow my colleague's Windows laptop to finish purchase.", user: 'Research Analyst', device: 'Safari macOS → Chrome Win', time: '14h ago', tag: 'Ticket #88995', urgent: true },
  { quote: 'Button appears active visually but clicking does nothing.', user: 'Media Director', device: 'Safari macOS 14.4', time: '14h ago', tag: 'CSAT 1/5', urgent: false },
  { quote: 'First bug encountered right after 10pm deploy. Checkout button dead.', user: 'Night Shift Admin', device: 'Safari iOS 17.4', time: '14h ago', tag: 'Ticket #88981', urgent: true },
]

/* ── View 3 · Application-log audit ──────────────────────────────────────── */

export const AUDIT_KPIS: Kpi[] = [
  { label: 'Pre-release errors (0–24h)', value: '0', tone: 'ok', delta: { text: 'Healthy baseline before deploy', tone: 'pos' } },
  { label: 'Post-release errors (12h)', value: '1,840', tone: 'danger', delta: { text: '▲ first error +4m post-deploy', tone: 'neg' } },
  { label: 'Component failure state', value: 'disabled=true', tone: 'warn', delta: { text: 'No inline validation rendered', tone: 'warn' } },
  { label: 'Root exception', value: 'FormValidationBypass', tone: 'blue', delta: { text: 'WebKit DOMAutoComplete suppression', tone: 'flat' } },
]

/** One hour-bucket bar on the error-occurrence timeline. `clean` bars are the
    pre-release baseline (0 errors); the rest carry a height 0–1. */
export interface TimelineBar { label: string; count: string; height: number; clean?: boolean }
export const TIMELINE_PRE: TimelineBar[] = [
  { label: '−12h', count: '0', height: 0, clean: true },
  { label: '−8h', count: '0', height: 0, clean: true },
  { label: '−4h', count: '0', height: 0, clean: true },
  { label: '−1h', count: '0', height: 0, clean: true },
]
export const TIMELINE_POST: TimelineBar[] = [
  { label: '+1h (22:04)', count: '48', height: 0.18 },
  { label: '+3h', count: '112', height: 0.34 },
  { label: '+6h', count: '240', height: 0.59 },
  { label: '+8h', count: '380', height: 0.82 },
  { label: '+10h', count: '540', height: 1 },
  { label: '+12h (now)', count: '520', height: 0.95 },
]

export interface LogEntry { kind: 'first' | 'burst' | 'sustained'; head: string; ts: string; badge: string; lines: string[] }
export const LOG_ENTRIES: LogEntry[] = [
  {
    kind: 'first', head: 'FIRST OCCURRENCE POST-DEPLOY', ts: 'Yesterday 22:04:18.102 UTC (+4m after v3.4 deploy)', badge: '1st incident flagged',
    lines: [
      '[DOMObserver] WebKit native AutoFill populated address fields (postal_code, street_address).',
      "ERROR [FormValidator] Synthetic 'input' event suppressed by WebKit. Validation unchanged: isFormValid=false.",
      'ERROR [CTA#submit-payment-btn] Click rejected: button.disabled===true. No visual error feedback shown.',
    ],
  },
  {
    kind: 'burst', head: 'CLIENT-SIDE ERROR BURST', ts: 'Yesterday 23:14:02.450 UTC', badge: 'Occurrences: 48× in 15m',
    lines: [
      'ERROR [PaymentForm] Uncaught ClientException: FormValidationBypass on Step 3 submission.',
      '[Telemetry] User clicked disabled #submit-payment-btn 5× within 1.4s (rage click). Cart value: $349.00 abandoned.',
    ],
  },
  {
    kind: 'sustained', head: 'SUSTAINED TELEMETRY PATTERN', ts: 'Today 08:30:11.890 UTC (ongoing)', badge: 'Total volume: 1,840 events',
    lines: [
      '[AuditSummary] 1,840 identical suppression events across 1,240 unique Safari checkout sessions.',
      'Browser scope: 100% Safari iOS / macOS · Chromium / Gecko: 0 · Resolution: hotfix required in WebKit event handling.',
    ],
  },
]

/* ── View 4 · Business & revenue impact ──────────────────────────────────── */

export interface ImpactBox { label: string; value: string; sub: string; foot: string; tone: 'blue' | 'warn' | 'danger'; highlight?: boolean }
export const IMPACT_BOXES: ImpactBox[] = [
  { label: 'Affected user cohort', value: '18,200', sub: 'Monthly active Safari visitors', foot: '28.4% of total checkout traffic', tone: 'blue' },
  { label: 'Estimated revenue leakage', value: '$42,000', sub: 'Lost ARR run-rate per week', foot: '~$6,000 / day in abandoned carts', tone: 'warn', highlight: true },
  { label: 'Support ticket surge', value: '85 → 140', sub: 'Current tickets → projected by Sunday', foot: '+65% support-queue overload', tone: 'danger' },
]

export const IMPACT_STATUS_QUO = [
  'Safari checkout conversion stays suppressed at 1.8%.',
  'Accumulated revenue loss reaches ~$168,000 over a 30-day window.',
  'Churn and CSAT impact permanently damage onboarding NPS.',
]
export const IMPACT_WITH_FIX = [
  'Recovers conversion rate back to ≥ 4.0%.',
  'Eliminates the $42,000/week ARR bleed immediately.',
  'Reduces billing-related support tickets to baseline (< 15/week).',
]

/* ── View 5 · The drafted PRD ────────────────────────────────────────────── */

export interface PrdSection { title: string; body?: string; items?: string[] }
export const PRD_META = {
  id: 'PRD-2026-084',
  tag: 'Checkout Hotfix',
  title: 'Safari Autofill Validation & Unresponsive Submit Button on Checkout Step 3',
  author: 'Raman (via AAVA) · Version 1.0',
  release: 'Hotfix v3.4.1',
  scope: 'Billing & Checkout Funnel',
}
export const PRD_SECTIONS: PrdSection[] = [
  {
    title: '1. Problem statement & background',
    body: 'Following Release v3.4, overall checkout funnel conversion declined by 22% (from a 4.0% baseline to 3.1%), driven almost entirely by a 41.0% drop-off at Step 3 (payment authentication). Session duration surged from 1m 12s to 4m 45s, and rage-click incidents rose by 310%, concentrated on the primary payment confirmation button.',
  },
  {
    title: '2. Telemetry & user-feedback evidence',
    items: [
      'Targeted cohort: 78.4% of friction occurs on WebKit/Safari (iOS and macOS), affecting ~18,200 monthly active users (28.4% of checkout traffic).',
      'CTA log telemetry: 1,840 suppressed clicks logged on #submit-payment-btn with zero user feedback displayed.',
      'Customer verbatim: "Card info is 100% correct, but the checkout button stays unclickable on Safari." (42 support tickets logged).',
    ],
  },
  {
    title: '3. Technical root-cause hypothesis',
    body: 'WebKit autofill populates address credentials (e.g. via Apple Pay suggestions or Keychain) without triggering standard synthetic input or change events on the hidden postal_code DOM element. Consequently, client-side React form validation marks the form invalid while the submit button remains disabled without inline error indicators.',
  },
  {
    title: '4. Functional requirements & acceptance criteria',
    items: [
      'AC 4.1 (Autofill listener): add explicit listeners for DOMAutoComplete and animationstart events to force re-evaluation of form-validation state on browser autofill.',
      'AC 4.2 (Visible inline validation): the submit button must never remain silently disabled — clicking or focusing it with fields missing must show explicit inline errors naming the fields.',
      'AC 4.3 (Touch & mobile fallback): ensure iOS Safari software-keyboard dismissal triggers an explicit form-state update.',
    ],
  },
  {
    title: '5. Verification & metric-recovery criteria',
    items: [
      'Funnel conversion recovery: Step 3 conversion must recover to ≥ 4.0% within 24h of hotfix deployment.',
      'Rage-click threshold: rage clicks on #submit-payment-btn must drop below 0.5% of total sessions.',
      'Revenue protection: recovers $42,000 / week in prevented subscription abandonment.',
    ],
  },
]
