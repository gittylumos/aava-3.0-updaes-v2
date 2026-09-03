/* A scripted PRD object.
 *
 * Like the t1/t7 scenarios, the content is fixed — a prototype tells the same
 * story every run. What varies is the SUBJECT lifted from the user's intent
 * ("create a PRD for a referral program" → subject "a referral program"), which
 * is interpolated into the title, summary and goals so the draft reads as
 * though it were built for what the user actually asked. The structural
 * content — requirements, risks, stakeholders — is plausible and stays put.
 *
 * This is the shape a schema-emitted Canvas would receive as DATA (deck slide
 * 18): title, summary, goals, requirements, risks, stakeholders, open
 * questions. Here it is authored by hand; later a model emits it against the
 * same schema and the Canvas plots it the same way.
 */

export interface PrdRequirement { id: string; text: string; priority: 'P0' | 'P1' | 'P2' }
export interface PrdRisk { risk: string; impact: 'High' | 'Medium' | 'Low'; mitigation: string }
export interface PrdStakeholder { name: string; role: string }
export interface PrdStory { as: string; want: string; so: string }

export interface Prd {
  title: string
  summary: string
  goals: string[]
  stories: PrdStory[]
  requirements: PrdRequirement[]
  risks: PrdRisk[]
  stakeholders: PrdStakeholder[]
  questions: string[]
  versions: { label: string; when: string; note: string }[]
}

const DEFAULT_SUBJECT = 'your product'

/** A PRD-to-backlog intent: a request to decompose a PRD into a backlog. Checked
   before isPrdIntent, since "here is my PRD, create epics and user stories" also
   mentions a PRD — but this is the decomposition flow, not a PRD draft. Fires on
   two or more decomposition signals (epics / features / stories / sprints), or on
   the word "backlog" alone, so slight rephrasings still land. */
export function isBacklogIntent(text: string): boolean {
  const t = text.toLowerCase()
  if (/\bbacklog\b/.test(t)) return true
  const signals = [
    /\bepics?\b/, /\bfeatures?\b/, /\bstor(y|ies)\b/, /\bsprints?\b/,
  ].filter((re) => re.test(t)).length
  return signals >= 2
}

/** An analytics-investigation intent (Example 3): a PM asking to look at the
   product analytics / telemetry, usually tied to a release. Fires on an
   analytics signal (analytics / telemetry / metrics / funnel / conversion /
   dashboard) together with a look/release signal, so "show me the analytics
   after last night's release" lands while a stray "metrics" mention does not. */
export function isInsightIntent(text: string): boolean {
  const t = text.toLowerCase()
  const analytics = /\b(analytics|telemetry|metrics?|funnel|conversion|dashboard|drop.?off|bounce|rage.?click)\b/.test(t)
  const context = /\b(show|latest|after|release|deploy|deployment|launch|shipped|last night|yesterday|data|numbers|report|look)\b/.test(t)
  return analytics && context
}

/** Whether a message is a PRD-work intent: it names a PRD and asks for PRD work
   (create/draft, or extract/decompose into epics/features/stories). Order-free,
   so both "create a PRD for X" and "here is our PRD, extract the stories" land. */
export function isPrdIntent(text: string): boolean {
  const mentions = /\b(prd|product requirements?( document)?)\b/i.test(text)
  const work = /\b(creat|draft|writ|generat|mak|build|prepar|extract|decompos|epic|feature|user stor|stories|story|breakdown|backlog)\w*/i.test(text)
  return mentions && work
}

/** Turn a raw intent into a clean subject phrase. Only a subject introduced by
   for/on/about counts — "PRD v2.4" is a version, not a subject, so it defaults. */
export function prdSubject(intent: string): string {
  const m = intent.match(/\bprd\b\s+(?:for|on|about|:)\s+([^.?!]+)/i)
  const raw = (m?.[1] ?? '').trim()
  return raw || DEFAULT_SUBJECT
}

export function prdTitle(subject: string): string {
  if (subject === DEFAULT_SUBJECT) return 'PRD · Epics & Stories'
  const s = subject.replace(/^(a|an|the)\s+/i, '')
  return `PRD · ${s.charAt(0).toUpperCase()}${s.slice(1)}`
}

/** The scripted PRD, with the subject woven through the parts that should name it. */
export function buildPrd(subject: string): Prd {
  const s = subject.replace(/^(a|an|the)\s+/i, '')
  return {
    title: prdTitle(subject),
    summary:
      `This document defines the problem, scope and success criteria for ${subject}. ` +
      `It is a first draft plotted from the declared PRD schema, ready for review before any design or build begins.`,
    goals: [
      `Ship ${s} to a first cohort within one quarter`,
      'Reach a measurable lift in the primary activation metric',
      'Keep the change reversible behind a flag until it proves out',
    ],
    stories: [
      { as: 'a new user', want: `to understand what ${s} does within the first screen`, so: 'I can decide whether to opt in' },
      { as: 'a returning user', want: 'to see my current status at a glance', so: 'I do not have to re-learn the flow' },
      { as: 'an admin', want: 'to configure the rules without engineering', so: 'we can iterate without a release' },
    ],
    requirements: [
      { id: 'R1', text: `A primary entry point for ${s}, reachable from the home surface`, priority: 'P0' },
      { id: 'R2', text: 'State is persisted per user and survives a session', priority: 'P0' },
      { id: 'R3', text: 'An admin can change the rules from a settings surface', priority: 'P1' },
      { id: 'R4', text: 'Every action emits an analytics event with a stable name', priority: 'P1' },
      { id: 'R5', text: 'A localized empty state for users with nothing yet', priority: 'P2' },
    ],
    risks: [
      { risk: 'Scope creep beyond the first cohort', impact: 'High', mitigation: 'Flag-gate and freeze the schema before build' },
      { risk: 'Low activation if the entry point is buried', impact: 'Medium', mitigation: 'Reserve a primary slot on the home surface' },
      { risk: 'Analytics naming drift across surfaces', impact: 'Medium', mitigation: 'Declare event names in the schema, not per screen' },
    ],
    stakeholders: [
      { name: 'Product', role: 'Owns scope and success metrics' },
      { name: 'Design', role: 'Owns the flow and the surfaces' },
      { name: 'Engineering', role: 'Owns build, flag and rollout' },
      { name: 'Data', role: 'Owns the metric definitions' },
    ],
    questions: [
      `What is the single primary metric ${s} moves?`,
      'Which cohort gets the first rollout, and how large is it?',
      'Is there an existing surface to reuse, or is a new one required?',
    ],
    versions: [
      { label: 'v0.1', when: 'Just now', note: 'First draft plotted from the schema' },
    ],
  }
}
