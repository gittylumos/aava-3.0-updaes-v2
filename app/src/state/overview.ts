/* What the Overview tab lists, for any session — pure data, no React.
 *
 *   artifacts  what this session produced (a running page, documents, reports,
 *              dashboards, a workflow, validation results)
 *   context    where the work came from and went — tickets, designs, branches,
 *              sources — as real links wherever there is one
 *
 * A task session reads its scenario and the task's own context; an object
 * session (a PRD, a backlog, an analytics or report run, an agent build) reads
 * the files it produced. Both also pick up every link the conversation has
 * handed the user so far — a raised PR, a published Jira board.
 */
import type { ActiveObject, Message, PlaygroundState, Scenario, Task } from './types'
import { BACKLOG_FILE, type BacklogDoc } from '../prd/backlog'
import { prdFileName } from '../prd/document'
import {
  agentSampleTab, agentTab, docTab, hasPreview, insightTab, openableTabs, pageUrl, reportTab,
  suggestedTabs, workspaceTabFor, type OpenTabEntry, type SessionFile, type WorkspaceTab,
  type WorkspaceTabType,
} from './workspace'

export type LogoKind = 'jira' | 'figma' | 'github' | 'confluence' | 'azure'
export type OverviewIcon = { tab: WorkspaceTabType } | { logo: LogoKind }

export interface OverviewRow {
  key: string
  label: string
  meta?: string
  mono?: boolean
  icon: OverviewIcon
  /** Opens this workspace tab. */
  tab?: WorkspaceTab
  /** Leaves for this page. Neither set: a plain reference. */
  href?: string
}

export interface OverviewData {
  tools: OpenTabEntry[]
  artifacts: OverviewRow[]
  context: OverviewRow[]
}

const JIRA = 'https://aava-demo.atlassian.net/browse/'
const slug = (s: string) => s.trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')

function logoFor(href: string): OverviewIcon {
  if (/atlassian\.net\/wiki/.test(href)) return { logo: 'confluence' }
  if (/atlassian\.net/.test(href)) return { logo: 'jira' }
  if (/figma\.com/.test(href)) return { logo: 'figma' }
  if (/github\.com/.test(href)) return { logo: 'github' }
  if (/dev\.azure\.com/.test(href)) return { logo: 'azure' }
  return { tab: 'browser' }
}

/* Every external link the conversation has put in front of the user. */
function conversationLinks(messages: Message[]): OverviewRow[] {
  const rows: OverviewRow[] = []
  for (const m of messages) {
    const b = m.block
    const links = b?.kind === 'links' ? b.links : b?.kind === 'callout' ? b.links ?? [] : []
    for (const l of links) {
      if (!('href' in l) || !l.href) continue
      rows.push({ key: l.href, label: l.label, icon: logoFor(l.href), href: l.href })
    }
  }
  return rows
}

function dedupe(rows: OverviewRow[]): OverviewRow[] {
  const seen = new Set<string>()
  return rows.filter((r) => {
    const k = r.href ?? r.key
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/* ── A task session ─────────────────────────────────────────────────────── */

export function taskOverview({ scenario, pg, task, taskId, messages }: {
  scenario: Scenario | null; pg: PlaygroundState; task: Task | null; taskId: string | null; messages: Message[]
}): OverviewData {
  const artifacts: OverviewRow[] = []
  if (hasPreview(scenario)) {
    const tab = workspaceTabFor('preview', taskId, task?.title)
    artifacts.push({ key: tab.id, icon: { tab: 'preview' }, label: tab.label, meta: pageUrl(scenario) ?? undefined, tab })
  }
  for (const { tab, legacy } of suggestedTabs(pg, taskId, scenario)) {
    if (legacy === 'evidence') continue // context, not an output — listed below
    artifacts.push({ key: tab.id, icon: { tab: tab.type }, label: tab.label, meta: scenario?.tests.file, tab })
  }

  const context: OverviewRow[] = []
  const ctx = task?.context
  if (ctx) {
    /* The ticket the task came from — the same link the session header's
       ticket chip opens, whichever tracker it lives in. */
    const href = ctx.ticketUrl ?? JIRA + ctx.ticket
    const icon: OverviewIcon = /confluence/i.test(ctx.ticketSource) ? { logo: 'confluence' } : logoFor(href)
    context.push({ key: `ticket:${ctx.ticket}`, icon, label: ctx.ticket, meta: task?.title, href })
    for (const r of ctx.related ?? []) {
      context.push({ key: `jira:${r.id}`, icon: { logo: 'jira' }, label: r.id, meta: r.title, href: JIRA + r.id })
    }
  }
  for (const c of ctx?.connected ?? []) {
    if (c.kind === 'design' && !c.denied) {
      context.push({ key: `figma:${c.label}`, icon: { logo: 'figma' }, label: c.label, meta: 'Figma', href: `https://www.figma.com/design/aava-demo/${slug(c.label)}` })
    }
  }
  /* Every branch the run opened, one per repo — the new branches, by name. */
  const branches = new Map<string, string>()
  for (const g of scenario?.diff ?? []) branches.set(g.branch, g.repo)
  for (const c of ctx?.connected ?? []) if (c.kind === 'git' && !branches.has(c.label)) branches.set(c.label, 'GitHub')
  for (const [branch, repo] of branches) {
    context.push({ key: `gh:${branch}`, icon: { logo: 'github' }, label: branch, meta: repo, mono: true,
      href: `https://github.com/aava-demo/${slug(repo).toLowerCase()}/tree/${branch}` })
  }
  const evidence = suggestedTabs(pg, taskId, scenario).find((e) => e.legacy === 'evidence')
  if (evidence) {
    context.push({ key: evidence.tab.id, icon: { tab: 'evidence' }, label: 'Evidence',
      meta: `${Object.keys(scenario?.evidence ?? {}).length} sources checked`, tab: evidence.tab })
  }

  return {
    tools: openableTabs(pg, taskId, scenario),
    artifacts,
    context: dedupe([...context, ...conversationLinks(messages)]),
  }
}

/* ── An object session ──────────────────────────────────────────────────── */

/* The source each kind of run starts from — what its session header names. */
const SOURCE: Partial<Record<ActiveObject['kind'], OverviewRow>> = {
  prd: { key: 'src:prd', icon: { tab: 'doc' }, label: 'PRD_v2.4.docx', meta: 'Attached' },
  backlog: { key: 'src:prd', icon: { tab: 'doc' }, label: 'PRD_v2.4.docx', meta: 'Attached' },
  insight: { key: 'src:ga', icon: { tab: 'browser' }, label: 'Google Analytics', meta: 'Production v3.4', href: 'https://analytics.google.com' },
  report: { key: 'src:ga', icon: { tab: 'browser' }, label: 'Google Analytics', meta: 'Production v3.4', href: 'https://analytics.google.com' },
  agent: { key: 'src:catalog', icon: { tab: 'agent' }, label: 'Golden Artifact Catalog', meta: 'Source' },
}

/** The file a document tab is named by — a backlog phase file, or the PRD. */
export function documentFile(object: ActiveObject, doc?: BacklogDoc): string {
  return object.kind === 'backlog' ? BACKLOG_FILE[doc ?? object.activeDoc ?? 'intake'] : `${prdFileName(object.subject)}.md`
}

/* A document tab is named by its file, and a file can be written more than
   once (epics.md, then its revision). It shows the latest — the one the run is
   on if it is this file, else the newest the session produced. */
export function docForFile(object: ActiveObject | null, files: SessionFile[], file: string): BacklogDoc | undefined {
  if (object?.activeDoc && BACKLOG_FILE[object.activeDoc] === file) return object.activeDoc
  return files.find((f) => f.doc && BACKLOG_FILE[f.doc] === file)?.doc
}

/** The tab a session file opens in. A document is keyed by the file the
    canvas writes it to, whatever the conversation's card called it. */
export function tabForFile(object: ActiveObject, f: SessionFile): WorkspaceTab {
  if (f.report) return reportTab(f.report)
  if (f.insight) return insightTab(f.insight)
  return docTab(f.doc ? documentFile(object, f.doc) : f.name)
}

export function objectOverview({ object, pg, files, messages, processName }: {
  object: ActiveObject; pg: PlaygroundState; files: SessionFile[]; messages: Message[]; processName?: string
}): OverviewData {
  const artifacts: OverviewRow[] = []
  if (object.kind === 'agent' && object.docReady && processName) {
    const tab = agentTab(processName)
    artifacts.push({ key: tab.id, icon: { tab: 'agent' }, label: tab.label, meta: object.agentCloned ? 'Working copy' : 'Golden artifact', tab })
    if (object.agentDocOpen) {
      const sample = agentSampleTab()
      artifacts.push({ key: sample.id, icon: { tab: 'doc' }, label: sample.label, tab: sample })
    }
  }
  for (const f of files) {
    const tab = tabForFile(object, f)
    if (artifacts.some((a) => a.key === tab.id)) continue // two versions, one file
    artifacts.push({ key: tab.id, icon: { tab: tab.type }, label: tab.label, meta: `Today, ${f.when}`, mono: true, tab })
  }

  const source = SOURCE[object.kind]
  return {
    tools: openableTabs(pg, object.taskId, null),
    artifacts,
    context: dedupe([...(source ? [source] : []), ...conversationLinks(messages)]),
  }
}

/* ── Recents ────────────────────────────────────────────────────────────── */

export function recentRows(recents: WorkspaceTab[], scenario: Scenario | null): OverviewRow[] {
  return recents.map((tab) => tab.type === 'preview'
    /* A page reads as its address, the way a browser's history does. */
    ? { key: tab.id, icon: { tab: 'preview' }, label: pageUrl(scenario) ?? tab.label, meta: tab.label, mono: true, tab }
    : { key: tab.id, icon: { tab: tab.type }, label: tab.label, mono: tab.type === 'file' || tab.type === 'doc', tab })
}
