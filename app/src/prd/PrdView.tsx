/* The PRD workspace body — just the content, no shell.
 *
 * This is what renders inside a standard workspace tab. The Toolbar (tab strip)
 * and Watch (bottom bar) come from the shared TabWorkspace now, so the PRD is a
 * first-class artefact in the same frame as a task's code/preview/diff rather
 * than a bespoke panel of its own. The body still evolves by phase.
 */
import type { ActiveObject, PrdPhase } from '../state/types'
import { EPICS, STORIES, CLARIFICATIONS, SPRINTS, JIRA_TARGET } from './flow'

export const PRD_PHASE_NAME: Record<PrdPhase, string> = {
  analysis: 'Requirement Analysis',
  stories: 'User Story Backlog',
  release: 'Implementation Backlog',
  done: 'PRD → Jira Traceability',
}

export function PrdView({ object }: { object: ActiveObject }) {
  switch (object.phase) {
    case 'analysis': return <AnalysisView subject={object.subject} />
    case 'stories': return <StoriesView />
    case 'release': return <ReleaseView />
    case 'done': return <DoneView />
  }
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-2 mt-6 text-[13px] font-semibold uppercase tracking-wide first:mt-0" style={{ color: 'var(--muted)' }}>{children}</h3>
)

function AnalysisView({ subject }: { subject: string }) {
  const featureCount = EPICS.reduce((n, e) => n + e.features.length, 0)
  return (
    <article className="max-w-[760px]">
      <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text)' }}>Requirement analysis</h1>
      <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: 'var(--text-dim)' }}>
        PRD for {subject} ingested and cross-referenced with the workspace architecture. Scope resolved to{' '}
        <b style={{ color: 'var(--text)' }}>{EPICS.length} Epics</b> and{' '}
        <b style={{ color: 'var(--text)' }}>{featureCount} Features</b>.
      </p>
      <SectionLabel>Epics & features</SectionLabel>
      <div className="grid gap-2">
        {EPICS.map((e) => (
          <div key={e.id} className="rounded-[10px] p-3" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
            <div className="flex items-baseline gap-2">
              <span className="mono text-[11px]" style={{ color: 'var(--zone-canvas-accent)' }}>{e.id}</span>
              <span className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>{e.name}</span>
              <span className="ml-auto text-[11px]" style={{ color: 'var(--muted-deep)' }}>{e.features.length} features</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {e.features.map((f) => (
                <span key={f} className="rounded-[6px] px-2 py-0.5 text-[11.5px]" style={{ background: 'var(--wash-3)', color: 'var(--text-dim)' }}>{f}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function StoriesView() {
  return (
    <article className="max-w-[760px]">
      <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text)' }}>User story backlog</h1>
      <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: 'var(--text-dim)' }}>
        24 stories generated across the approved features, with Gherkin acceptance criteria. {CLARIFICATIONS.length} need a clarification before they meet the Definition of Ready.
      </p>
      <SectionLabel>Stories</SectionLabel>
      <div className="overflow-hidden rounded-[10px]" style={{ border: '1px solid var(--glass-line-soft)' }}>
        {STORIES.map((s, i) => (
          <div key={s.id} className="flex items-baseline gap-3 px-3 py-2.5 text-[14px]"
            style={{ borderTop: i ? '1px solid var(--glass-line-soft)' : undefined, color: 'var(--text-dim)' }}>
            <span className="mono w-20 shrink-0 text-[11px]" style={{ color: 'var(--muted-deep)' }}>{s.id}</span>
            <span className="min-w-0 flex-1">{s.title}</span>
            <span className="mono shrink-0 text-[11px]" style={{ color: 'var(--muted)' }}>{s.points} pt</span>
            <span className="shrink-0 rounded-[6px] px-1.5 py-0.5 text-[11px] font-medium"
              style={s.ready ? { color: 'var(--ok)', background: 'var(--ok-surface)' } : { color: 'var(--warn)', background: 'var(--warn-surface)' }}>
              {s.ready ? 'Ready' : 'Needs input'}
            </span>
          </div>
        ))}
      </div>
      <SectionLabel>Open clarifications</SectionLabel>
      <div className="rounded-[10px] p-3" style={{ background: 'var(--warn-surface)', border: '1px solid var(--glass-line-soft)' }}>
        {CLARIFICATIONS.map((c) => (
          <p key={c.id} className="text-[13px] leading-[1.6]" style={{ color: 'var(--text-dim)' }}>
            <span className="mono" style={{ color: 'var(--warn)' }}>{c.domain} · {c.id}</span> — {c.q}
          </p>
        ))}
      </div>
    </article>
  )
}

function ReleaseView() {
  return (
    <article className="max-w-[760px]">
      <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text)' }}>Implementation backlog</h1>
      <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: 'var(--text-dim)' }}>
        Stories bucketed into {SPRINTS.length} sprints, ready to publish into Jira.
      </p>
      <SectionLabel>Sprint allocation</SectionLabel>
      <div className="grid gap-2">
        {SPRINTS.map((sp) => (
          <div key={sp.name} className="rounded-[10px] p-3" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
            <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{sp.name}</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sp.stories.map((id) => (
                <span key={id} className="mono rounded-[6px] px-2 py-0.5 text-[11px]" style={{ background: 'var(--wash-3)', color: 'var(--text-dim)' }}>{id}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <SectionLabel>Export target</SectionLabel>
      <div className="rounded-[10px] p-3 text-[13px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>
        <p><span style={{ color: 'var(--muted)' }}>Instance</span> — <span className="mono">{JIRA_TARGET.instance}</span></p>
        <p className="mt-1"><span style={{ color: 'var(--muted)' }}>Project</span> — <span className="mono">{JIRA_TARGET.projectKey}</span> · {JIRA_TARGET.board}</p>
        <p className="mt-1"><span style={{ color: 'var(--muted)' }}>Items</span> — {JIRA_TARGET.counts}</p>
      </div>
    </article>
  )
}

function DoneView() {
  return (
    <article className="max-w-[760px]">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full" style={{ background: 'var(--ok-surface)', color: 'var(--ok)' }}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5 10 17l9-10" /></svg>
        </span>
        <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text)' }}>Exported to Jira</h1>
      </div>
      <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--text-dim)' }}>
        4 Epics and 24 Stories created in project <span className="mono" style={{ color: 'var(--text)' }}>{JIRA_TARGET.projectKey}</span>, with issue links and parent–child hierarchies applied.
      </p>
      <SectionLabel>Traceability</SectionLabel>
      <div className="overflow-hidden rounded-[10px]" style={{ border: '1px solid var(--glass-line-soft)' }}>
        {EPICS.map((e, i) => (
          <div key={e.id} className="flex items-baseline gap-3 px-3 py-2.5 text-[14px]"
            style={{ borderTop: i ? '1px solid var(--glass-line-soft)' : undefined, color: 'var(--text-dim)' }}>
            <span className="mono w-8 shrink-0 text-[11px]" style={{ color: 'var(--zone-canvas-accent)' }}>{e.id}</span>
            <span className="min-w-0 flex-1">{e.name}</span>
            <span className="mono shrink-0 text-[11px]" style={{ color: 'var(--ok)' }}>created</span>
          </div>
        ))}
      </div>
    </article>
  )
}
