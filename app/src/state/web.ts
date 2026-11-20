/* External places a session links to — Jira tickets, GitHub pull requests,
 * Figma files — and the mock pages the canvas browser shows for them.
 *
 * Nothing leaves the prototype: every link resolves to a URL here, and the web
 * app opens that URL as a browser tab in the right-hand canvas (see
 * components/playground/WebPage.tsx). Pure data, no React.
 */
import type { Citation, Task } from './types'

const JIRA_HOST = 'https://aava-demo.atlassian.net'
const GITHUB_ORG = 'https://github.com/aava-demo'
const FIGMA_HOST = 'https://www.figma.com'

export const jiraUrl = (key: string) => `${JIRA_HOST}/browse/${key}`
export const prUrl = (repo: string, n: number) => `${GITHUB_ORG}/${repo}/pull/${n}`
export const compareUrl = (repo: string, base: string, head: string) => `${GITHUB_ORG}/${repo}/compare/${base}...${head}`
export const figmaUrl = (file: string) =>
  `${FIGMA_HOST}/design/Fbk3vQ/${file.trim().replace(/\s+/g, '-')}`

/* ── GitHub pull requests the T1 run raises ─────────────────────────────── */

export interface PullRequest {
  repo: string
  number: number
  title: string
  base: string
  head: string
  /** "+added −removed", files changed, commits. */
  added: number
  removed: number
  files: string[]
  commits: string[]
  summary: string[]
  linked: string
  checks: string
}

export const PULL_REQUESTS: PullRequest[] = [
  {
    repo: 'product-web', number: 1043,
    title: 'MOB-2841: Add product feedback form',
    base: 'develop', head: 'feat/MOB-2841-feedback-form',
    added: 412, removed: 18,
    files: [
      'src/app/feedback/feedback-form.component.html',
      'src/app/feedback/feedback-form.component.ts',
      'src/app/feedback/feedback-form.component.spec.ts',
      'src/app/feedback/feedback.service.ts',
      'src/app/feedback/feedback.service.spec.ts',
      'src/app/app.routes.ts',
      'src/app/feedback/feedback.module.ts',
    ],
    commits: ['feat(feedback): feedback page, API integration and specs'],
    summary: [
      'New feedback page: a 1–5 rating (starts unselected) and a comment capped at 500 characters with a live counter.',
      'Posts to the existing POST /api/v1/feedback endpoint; success and error states after submit.',
      'Built on the PLAY FormField and CharacterCounter components (see PLAY PR #218).',
      '11 specs passing; coverage 87% (gate 80%).',
      'Open item: anonymous submission is not in the API contract — blocked on the platform team.',
    ],
    linked: 'MOB-2841',
    checks: 'All checks have passed · 11 specs, lint, build',
  },
  {
    repo: 'play-components', number: 218,
    title: 'PLAY-412: FormField and CharacterCounter components',
    base: 'main', head: 'feat/play-formfield-charactercounter',
    added: 236, removed: 4,
    files: [
      'projects/play/src/lib/form-field/form-field.component.ts',
      'projects/play/src/lib/form-field/form-field.component.html',
      'projects/play/src/lib/character-counter/character-counter.component.ts',
      'projects/play/src/public-api.ts',
    ],
    commits: ['feat(play): FormField and CharacterCounter'],
    summary: [
      'Adds FormField (label, hint, error slot) and CharacterCounter (live count against a max) to the PLAY library.',
      'Needed by the product feedback form (product-web PR #1043).',
      'Accessible by default: labels are bound, the counter is announced politely.',
    ],
    linked: 'MOB-2841',
    checks: 'All checks have passed · lint, build, unit',
  },
]

const prByNumber = (n: number) => PULL_REQUESTS.find((p) => p.number === n)

/* ── Resolving what a link points at ────────────────────────────────────── */

/** A tool step names its source as a plain string ("GitHub", "Jira", "Figma")
 *  and its result ("#1043", "In Review", "Feedback Form v3"). This turns that
 *  pair into the page it refers to, or null when there is nowhere to go. */
export function urlForSource(source: string, result: string, ticket?: string): string | null {
  const s = source.toLowerCase()
  if (s === 'jira') {
    const key = /^[A-Z]+-\d+$/.test(result) ? result : ticket
    return key ? jiraUrl(key) : null
  }
  if (s === 'figma') return figmaUrl(result || 'Design')
  if (s === 'github') {
    const n = Number(result.replace(/^#/, ''))
    if (prByNumber(n)) return prUrl(prByNumber(n)!.repo, n)
    if (result === 'PLAY') return prUrl('play-components', 218)
    if (result === 'Product') return prUrl('product-web', 1043)
    return `${GITHUB_ORG}/product-web`
  }
  return null
}

/** A citation pill → its page. */
export function urlForCitation(c: Pick<Citation, 'kind' | 'label' | 'title'>, ticket?: string): string | null {
  if (c.kind === 'jira') return jiraUrl(/^[A-Z]+-\d+$/.test(c.label) ? c.label : ticket ?? c.label)
  if (c.kind === 'figma') return figmaUrl(c.title || c.label)
  if (c.kind === 'github') {
    const pr = c.title.match(/#(\d+)/) ?? c.label.match(/#(\d+)/)
    if (pr && prByNumber(Number(pr[1]))) return prUrl(prByNumber(Number(pr[1]))!.repo, Number(pr[1]))
    const branch = c.title.match(/feat\/[\w-]+/)
    if (branch) return compareUrl('product-web', 'develop', branch[0])
    return `${GITHUB_ORG}/product-web`
  }
  return null
}

/* ── The page a URL shows ───────────────────────────────────────────────── */

export type WebPageSpec =
  | { site: 'jira'; url: string; key: string; task: Task | null }
  | { site: 'github-pr'; url: string; pr: PullRequest }
  | { site: 'github-compare'; url: string; repo: string; base: string; head: string }
  | { site: 'figma'; url: string; file: string }
  | { site: 'other'; url: string }

export function pageFor(url: string, tasks: Task[]): WebPageSpec {
  const jira = url.match(/atlassian\.net\/browse\/([A-Z]+-\d+)/)
  if (jira) return { site: 'jira', url, key: jira[1], task: tasks.find((t) => t.context.ticket === jira[1]) ?? null }
  const pr = url.match(/github\.com\/[\w-]+\/([\w-]+)\/pull\/(\d+)/)
  if (pr) {
    const found = PULL_REQUESTS.find((p) => p.repo === pr[1] && p.number === Number(pr[2]))
    if (found) return { site: 'github-pr', url, pr: found }
  }
  const cmp = url.match(/github\.com\/[\w-]+\/([\w-]+)\/compare\/([^.]+)\.\.\.(.+)$/)
  if (cmp) return { site: 'github-compare', url, repo: cmp[1], base: cmp[2], head: cmp[3] }
  const fig = url.match(/figma\.com\/design\/[\w]+\/(.+)$/)
  if (fig) return { site: 'figma', url, file: decodeURIComponent(fig[1]).replace(/-/g, ' ') }
  return { site: 'other', url }
}

/** The tab label: what is open, the way a browser titles it. */
export function webTitle(url: string, tasks: Task[]): string {
  const p = pageFor(url, tasks)
  switch (p.site) {
    case 'jira': return `${p.key} · Jira`
    case 'github-pr': return `PR #${p.pr.number} · GitHub`
    case 'github-compare': return 'Compare · GitHub'
    case 'figma': return `${p.file} · Figma`
    default: return url.replace(/^https?:\/\//, '').split('/')[0]
  }
}
