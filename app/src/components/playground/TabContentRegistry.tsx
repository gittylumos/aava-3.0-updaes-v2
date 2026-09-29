import { useState } from 'react'
import type { ActiveObject, PlaygroundState, Scenario, Task } from '../../state/types'
import {
  fileTab, fileText, hasPreview, pageUrl, parseTabId, workspaceTabFor, type SessionFile, type WorkspaceTab,
} from '../../state/workspace'
import { docForFile, type OverviewData, type OverviewRow } from '../../state/overview'
import type { InsightView } from '../../prd/insight'
import type { ReportView } from '../../prd/report'
import { DocumentBody } from '../../prd/DocumentCanvas'
import { InsightBody } from '../../prd/InsightCanvas'
import { ReportBody } from '../../prd/ReportCanvas'
import { AgentWorkflow } from '../../prd/OrchestrationCanvas'
import { HldDocument } from '../../prd/HldDocument'
import { Preview } from './Preview'
import { previewTemplate } from './FeedbackApp'
import { Code, FileEditor } from './Code'
import { Tests } from './Tests'
import { Changes } from './Changes'
import { Evidence } from './Evidence'
import { Overview } from './Overview'
import { BrowserMiniHeader, FileMiniHeader } from './MiniHeader'
import { TerminalBody } from './Terminal'

/* Resolves a workspace tab id to the thing that renders it — for every kind of
 * session. A task's page, code and diff; an object's documents, dashboards,
 * reports and workflow; the execution graph; the Overview. Adding a kind of tab
 * is a case here plus a type in state/workspace.ts; the workspace shell never
 * learns what is inside its tabs.
 */
type Change = { quote: string; note: string; range?: Range }

export interface WorkspaceCtx {
  scenario: Scenario | null
  task: Task | null
  taskId: string | null
  object: ActiveObject | null
  pg: PlaygroundState
  theme: 'dark' | 'light'
  overview: OverviewData
  recents: OverviewRow[]
  /** The object session's produced files, newest first. */
  files: SessionFile[]
  /** This session's execution-activity graph, when it has one. */
  activity: React.ReactNode
  /** Pending inline comments on the open document. */
  changes: Change[]
  onOpenTab: (tab: WorkspaceTab) => void
  onToast: (text: string) => void
  onFile: (file: string) => void
  onEdit: (file: string, text: string) => void
  onAddChange?: (change: Change) => void
  onClone?: () => void
}

export function TabContentRegistry({ tabId, ctx }: { tabId: string; ctx: WorkspaceCtx }) {
  const { type, resourceId } = parseTabId(tabId)
  const { scenario, pg, theme, object } = ctx

  switch (type) {
    case 'overview':
      return <Overview data={ctx.overview} recents={ctx.recents} onOpen={ctx.onOpenTab} />

    case 'code':
      if (!scenario) return <EmptySurface />
      return (
        <Padded>
          <Code scenario={scenario} pg={pg} theme={theme} onFile={ctx.onFile} onEdit={ctx.onEdit} />
        </Padded>
      )

    /* One file, its own tab — the file's path is the only chrome it needs. */
    case 'file': {
      if (!scenario?.files[resourceId]) return <EmptySurface />
      const path = [scenario.fileRoot, resourceId].filter(Boolean).join('/')
      return (
        <div className="flex h-full min-h-0 flex-col">
          <FileMiniHeader left={<span className="mono min-w-0 truncate px-1.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>{path}</span>} />
          <FileEditor file={resourceId} value={fileText(scenario, pg, resourceId)} theme={theme} onEdit={ctx.onEdit} />
        </div>
      )
    }

    /* The rendered page — a browser tab named after the artifact, pointed at
       the dev server. Nothing to show unless the scenario ships a page: a
       migration parked at a review gate has not run anything. */
    case 'preview':
      if (!hasPreview(scenario)) return <EmptySurface />
      return <PageBrowser scenario={scenario} pg={pg} onToast={ctx.onToast} />

    /* A new browser tab — a start page with the session's own places. */
    case 'browser':
      return <NewTab scenario={scenario} task={ctx.task} taskId={ctx.taskId} onOpenTab={ctx.onOpenTab} />

    /* The terminal — no mini-header, just the console. */
    case 'terminal':
      return <TerminalBody scenario={scenario} />

    case 'tests':
      return scenario ? <Padded><Tests scenario={scenario} prepAt={pg.prepAt} /></Padded> : <EmptySurface />

    case 'diff':
      return scenario
        ? <Changes scenario={scenario} pg={pg} onToast={ctx.onToast} onOpenFile={(f) => ctx.onOpenTab(fileTab(f))} />
        : <EmptySurface />

    case 'evidence':
      return scenario
        ? <Padded><Evidence scenario={scenario} focused={pg.focusedEvidence} /></Padded>
        : <EmptySurface />

    /* ── Object sessions ── */

    case 'doc':
      return object
        ? <DocumentBody object={object} doc={docForFile(object, ctx.files, resourceId)} onToast={ctx.onToast}
            onAddChange={ctx.onAddChange} changes={ctx.changes} />
        : <EmptySurface />

    case 'insight':
      return <InsightBody view={resourceId as InsightView} />

    case 'report':
      return <ReportBody view={resourceId as ReportView} onToast={ctx.onToast} />

    case 'activity':
      return ctx.activity ? <>{ctx.activity}</> : <EmptySurface />

    case 'agent':
      return object ? <AgentWorkflow object={object} onToast={ctx.onToast} onClone={ctx.onClone} /> : <EmptySurface />

    case 'agent-sample':
      return <HldDocument />

    default:
      return <EmptySurface />
  }
}

/* FlexLayout's tab body is edge-to-edge by design — it has to be, for splitters
   to meet cleanly. The padding belongs to the content, not the frame. */
function Padded({ children }: { children: React.ReactNode }) {
  return <div className="h-full min-h-0 overflow-auto p-3">{children}</div>
}

/* The running page in browser chrome. Refresh re-mounts it so the demo reads
   as a real reload. */
function PageBrowser({ scenario, pg, onToast }: { scenario: Scenario; pg: PlaygroundState; onToast: (t: string) => void }) {
  const [nonce, setNonce] = useState(0)
  return (
    <div className="flex h-full min-h-0 flex-col">
      <BrowserMiniHeader url={pageUrl(scenario) ?? ''} onRefresh={() => setNonce((n) => n + 1)} />
      <div key={nonce} className="min-h-0 flex-1 overflow-auto p-3">
        <Preview template={previewTemplate(scenario, pg)} onToast={onToast} />
      </div>
    </div>
  )
}

/* A fresh browser tab: the search start page, with the session's own places as
   shortcuts — the running page first, when there is one. */
function NewTab({ scenario, task, taskId, onOpenTab }: {
  scenario: Scenario | null; task: Task | null; taskId: string | null; onOpenTab: (tab: WorkspaceTab) => void
}) {
  const [q, setQ] = useState('')
  const url = pageUrl(scenario)
  const page = url ? workspaceTabFor('preview', taskId, task?.title) : null
  const go = () => {
    const text = q.trim()
    if (!text) return
    if (page && /localhost|127\.0\.0\.1/i.test(text)) return onOpenTab(page)
    const isUrl = /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(text) || /^https?:\/\//.test(text)
    window.open(isUrl ? (text.startsWith('http') ? text : `https://${text}`) : `https://www.google.com/search?q=${encodeURIComponent(text)}`, '_blank', 'noreferrer')
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <BrowserMiniHeader url="google.com" />
      <div className="grid min-h-0 flex-1 place-items-center overflow-auto px-6 py-10">
        <div className="w-full max-w-[440px]">
          <form onSubmit={(e) => { e.preventDefault(); go() }}
            className="flex h-11 items-center gap-2.5 rounded-full px-4"
            style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line)' }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden style={{ color: 'var(--muted)' }}>
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Google or type a URL"
              aria-label="Search or type a URL"
              className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[var(--muted-deep)]"
              style={{ color: 'var(--text)' }} />
          </form>
          {page && url && (
            <div className="mt-6 flex justify-center">
              <button onClick={() => onOpenTab(page)}
                className="press flex w-[112px] flex-col items-center gap-2 rounded-[12px] px-2 py-3 transition-colors hover:bg-[var(--wash-2)]">
                <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: 'var(--wash-3)', color: 'var(--text-dim)' }}>
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
                    <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                  </svg>
                </span>
                <span className="w-full truncate text-center text-[11.5px]" style={{ color: 'var(--text-dim)' }}>{page.label}</span>
                <span className="mono -mt-1.5 w-full truncate text-center text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{url.split('/')[0]}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* Speaks to the state of the work, never to the state of the prototype. */
export function EmptySurface() {
  return (
    <div className="grid h-full min-h-[220px] place-items-center px-8 text-center">
      <div className="max-w-[280px]">
        <p className="text-[13px] font-medium" style={{ color: 'var(--text-dim)' }}>
          Nothing to show here yet
        </p>
        <p className="mt-1.5 text-[12px] leading-[1.5]" style={{ color: 'var(--muted-deep)' }}>
          Evidence appears as soon as I produce something you can check.
        </p>
      </div>
    </div>
  )
}
