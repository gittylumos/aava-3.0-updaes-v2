import type { ReactNode } from 'react'
import type { Task } from '../../state/types'
import { jiraUrl, pageFor, prUrl, PULL_REQUESTS, type PullRequest } from '../../state/web'

/* A browser tab in the canvas showing an external page — a Jira issue, a GitHub
 * pull request, a Figma file — as a low-fidelity mock filled with this
 * session's own data. Links inside a page open further tabs, never a new
 * window: nothing leaves the prototype.
 */
export function WebPage({ url, tasks, shipped, onOpenUrl }: {
  url: string
  tasks: Task[]
  /** The run has raised its PRs — the ticket is In Review and links them. */
  shipped: boolean
  onOpenUrl: (url: string) => void
}) {
  const page = pageFor(url, tasks)
  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: 'var(--preview-bg)' }}>
      <AddressBar url={url} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {page.site === 'github-pr' && <GitHubPr pr={page.pr} onOpenUrl={onOpenUrl} />}
        {page.site === 'github-compare' && <GitHubCompare repo={page.repo} base={page.base} head={page.head} />}
        {page.site === 'jira' && <JiraIssue issueKey={page.key} task={page.task} shipped={shipped} onOpenUrl={onOpenUrl} />}
        {page.site === 'figma' && <FigmaFile file={page.file} />}
        {page.site === 'other' && <Placeholder url={url} />}
      </div>
    </div>
  )
}

/* ── Browser chrome ──────────────────────────────────────────────────────── */

function AddressBar({ url }: { url: string }) {
  const icon = (d: string) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
  )
  return (
    <div className="flex shrink-0 items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--glass-line-soft)', background: 'var(--wash-2)' }}>
      <span className="flex items-center gap-1" style={{ color: 'var(--muted-deep)' }}>
        {icon('M15 18l-6-6 6-6')}{icon('M9 6l6 6-6 6')}{icon('M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7')}
      </span>
      <div className="mono flex min-w-0 flex-1 items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px]"
        style={{ background: 'var(--card)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>
        {icon('M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z')}
        <span className="truncate">{url.replace(/^https:\/\//, '')}</span>
      </div>
    </div>
  )
}

/* ── Shared bits ─────────────────────────────────────────────────────────── */

const Pill = ({ children, solid }: { children: ReactNode; solid?: boolean }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold"
    style={solid ? { background: 'var(--text)', color: 'var(--on-text)' } : { border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
    {children}
  </span>
)

const SideGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="py-3" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
    <div className="mb-1 text-[12px] font-semibold" style={{ color: 'var(--muted)' }}>{label}</div>
    <div className="text-[12.5px]" style={{ color: 'var(--text-dim)' }}>{children}</div>
  </div>
)

const LinkText = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="press text-left underline underline-offset-[3px] hover:text-[var(--text)]"
    style={{ color: 'var(--text-dim)' }}>{children}</button>
)

/* ── GitHub pull request ─────────────────────────────────────────────────── */

function GitHubTopBar({ repo }: { repo: string }) {
  const tabs = ['Code', 'Issues', 'Pull requests', 'Actions', 'Projects', 'Security', 'Insights', 'Settings']
  return (
    <div style={{ borderBottom: '1px solid var(--glass-line-soft)', background: 'var(--wash-1)' }}>
      <div className="flex items-center gap-2 px-6 pt-3 text-[14px]">
        <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold" style={{ background: 'var(--text)', color: 'var(--on-text)' }}>GH</span>
        <span style={{ color: 'var(--muted)' }}>aava-demo</span><span style={{ color: 'var(--muted-deep)' }}>/</span>
        <span className="font-semibold">{repo}</span>
      </div>
      <div className="flex gap-5 overflow-x-auto px-6 pt-2 text-[12.5px]">
        {tabs.map((t) => (
          <span key={t} className="shrink-0 pb-2" style={t === 'Pull requests'
            ? { borderBottom: '2px solid var(--text)', fontWeight: 600 } : { color: 'var(--muted)' }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

function GitHubPr({ pr, onOpenUrl }: { pr: PullRequest; onOpenUrl: (url: string) => void }) {
  const other = PULL_REQUESTS.find((p) => p !== pr)
  return (
    <div>
      <GitHubTopBar repo={pr.repo} />
      <div className="mx-auto max-w-[1060px] px-6 py-5">
        <h1 className="text-[24px] font-normal leading-tight">
          {pr.title} <span style={{ color: 'var(--muted-deep)' }}>#{pr.number}</span>
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          <Pill solid>⇄ Open</Pill>
          <span><b style={{ color: 'var(--text-dim)' }}>alex-apex</b> wants to merge {pr.commits.length} commit into</span>
          <code className="mono rounded px-1.5 py-0.5 text-[12px]" style={{ background: 'var(--wash-3)' }}>{pr.base}</code>
          <span>from</span>
          <code className="mono rounded px-1.5 py-0.5 text-[12px]" style={{ background: 'var(--wash-3)' }}>{pr.head}</code>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-5 text-[13px]" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          {[['Conversation', 1], ['Commits', pr.commits.length], ['Checks', 1], ['Files changed', pr.files.length]].map(([t, n], i) => (
            <span key={t} className="pb-2" style={i === 0 ? { borderBottom: '2px solid var(--text)', fontWeight: 600 } : { color: 'var(--muted)' }}>
              {t} <span className="ml-1 rounded-full px-1.5 text-[11px]" style={{ background: 'var(--wash-4)' }}>{n}</span>
            </span>
          ))}
          <span className="mono ml-auto pb-2 text-[12px]" style={{ color: 'var(--muted)' }}>+{pr.added} −{pr.removed}</span>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[8px]" style={{ border: '1px solid var(--border)' }}>
              <div className="px-4 py-2 text-[12.5px]" style={{ background: 'var(--wash-2)', borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                <b style={{ color: 'var(--text-dim)' }}>alex-apex</b> commented · generated by AAVA on behalf of Alex
              </div>
              <div className="px-4 py-3 text-[13.5px] leading-[1.6]">
                <h2 className="mb-2 text-[17px] font-semibold">Summary</h2>
                <ul className="ml-5 list-disc space-y-1">{pr.summary.map((s) => <li key={s}>{s}</li>)}</ul>
                <h2 className="mb-2 mt-4 text-[17px] font-semibold">Linked</h2>
                <ul className="ml-5 list-disc space-y-1">
                  <li>Jira: <LinkText onClick={() => onOpenUrl(jiraUrl(pr.linked))}>{pr.linked}</LinkText></li>
                  {other && <li>Related: <LinkText onClick={() => onOpenUrl(prUrl(other.repo, other.number))}>{other.repo} PR #{other.number}</LinkText></li>}
                </ul>
              </div>
            </div>

            <div className="rounded-[8px] px-4 py-3 text-[13px]" style={{ border: '1px solid var(--border)' }}>
              <div className="font-semibold">✓ {pr.checks}</div>
              <div className="mt-1" style={{ color: 'var(--muted)' }}>This branch has no conflicts with the base branch.</div>
              <button type="button" disabled className="mt-3 rounded-[6px] px-3 py-1.5 text-[13px] font-semibold opacity-60"
                style={{ background: 'var(--text)', color: 'var(--on-text)' }}>Merge pull request</button>
              <span className="ml-2 text-[12px]" style={{ color: 'var(--muted-deep)' }}>Waiting on review</span>
            </div>

            <div className="rounded-[8px]" style={{ border: '1px solid var(--border)' }}>
              <div className="px-4 py-2 text-[12.5px] font-semibold" style={{ borderBottom: '1px solid var(--border)', background: 'var(--wash-2)' }}>
                Files changed ({pr.files.length})
              </div>
              {pr.files.map((f) => (
                <div key={f} className="mono px-4 py-1.5 text-[12px]" style={{ borderBottom: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>{f}</div>
              ))}
            </div>
          </div>

          <aside>
            <SideGroup label="Reviewers">Review requested · @frontend-leads</SideGroup>
            <SideGroup label="Assignees">alex-apex</SideGroup>
            <SideGroup label="Labels">feature · aava-generated</SideGroup>
            <SideGroup label="Development">
              <LinkText onClick={() => onOpenUrl(jiraUrl(pr.linked))}>{pr.linked}</LinkText> — linked, In Review
            </SideGroup>
            <SideGroup label="Notifications">You're watching this pull request.</SideGroup>
          </aside>
        </div>
      </div>
    </div>
  )
}

function GitHubCompare({ repo, base, head }: { repo: string; base: string; head: string }) {
  const pr = PULL_REQUESTS.find((p) => p.repo === repo)
  return (
    <div>
      <GitHubTopBar repo={repo} />
      <div className="mx-auto max-w-[1060px] px-6 py-5">
        <h1 className="text-[22px]">Comparing changes</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          base: <code className="mono rounded px-1.5 py-0.5" style={{ background: 'var(--wash-3)' }}>{base}</code>
          ← compare: <code className="mono rounded px-1.5 py-0.5" style={{ background: 'var(--wash-3)' }}>{head}</code>
          <span>✓ Able to merge.</span>
        </div>
        <div className="mt-4 rounded-[8px]" style={{ border: '1px solid var(--border)' }}>
          <div className="px-4 py-2 text-[12.5px] font-semibold" style={{ borderBottom: '1px solid var(--border)', background: 'var(--wash-2)' }}>
            {pr?.files.length ?? 0} files changed · working diff
          </div>
          {(pr?.files ?? []).map((f) => (
            <div key={f} className="mono px-4 py-1.5 text-[12px]" style={{ borderBottom: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Jira issue ──────────────────────────────────────────────────────────── */

function JiraIssue({ issueKey, task, shipped, onOpenUrl }: {
  issueKey: string; task: Task | null; shipped: boolean; onOpenUrl: (url: string) => void
}) {
  const ctx = task?.context
  const project = issueKey.split('-')[0]
  const status = task?.id === 'T1' && shipped ? 'In Review' : 'In Progress'
  const sprint = ctx?.ticketSource.split(' · ')[1] ?? 'Current sprint'
  const linkedPrs = task?.id === 'T1' && shipped ? PULL_REQUESTS : []
  return (
    <div>
      <div className="flex items-center gap-3 px-6 py-2.5 text-[13px]" style={{ borderBottom: '1px solid var(--glass-line-soft)', background: 'var(--wash-1)' }}>
        <span className="grid h-6 w-6 place-items-center rounded-[5px] text-[11px] font-bold" style={{ background: 'var(--text)', color: 'var(--on-text)' }}>J</span>
        <span className="font-semibold">Jira</span>
        <span style={{ color: 'var(--muted)' }}>Your work · Projects · Filters · Dashboards</span>
      </div>
      <div className="mx-auto max-w-[1060px] px-6 py-5">
        <div className="text-[12.5px]" style={{ color: 'var(--muted)' }}>Projects / {project} / {issueKey}</div>
        <div className="mt-3 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <h1 className="text-[22px] font-semibold leading-snug">{task?.title ?? issueKey}</h1>
            <div className="mt-3 flex gap-2 text-[12.5px]">
              {['Attach', 'Add a child issue', 'Link issue'].map((b) => (
                <span key={b} className="rounded-[4px] px-2.5 py-1" style={{ background: 'var(--wash-3)' }}>{b}</span>
              ))}
            </div>

            <h2 className="mb-1.5 mt-6 text-[14px] font-semibold">Description</h2>
            <p className="text-[13.5px] leading-[1.6]" style={{ color: 'var(--text-dim)' }}>
              {ctx?.description ?? 'No description.'}
            </p>

            {ctx && (
              <>
                <h2 className="mb-1.5 mt-6 text-[14px] font-semibold">Acceptance criteria</h2>
                <ul className="space-y-1.5 text-[13.5px]">
                  {ctx.criteria.map((c) => (
                    <li key={c.text} className="flex gap-2">
                      <span aria-hidden>{c.met ? '☑' : '☐'}</span>
                      <span>{c.text}{c.note && <span style={{ color: 'var(--muted)' }}> — {c.note}</span>}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h2 className="mb-2 mt-6 text-[14px] font-semibold">Activity</h2>
            <div className="grid gap-2 text-[13px]">
              {linkedPrs.length > 0 && (
                <div className="rounded-[6px] px-3 py-2" style={{ border: '1px solid var(--glass-line-soft)' }}>
                  <b>AAVA</b> <span style={{ color: 'var(--muted)' }}>on behalf of @Alex · just now</span>
                  <div className="mt-1">Raised {linkedPrs.length} pull requests and moved this to In Review.</div>
                </div>
              )}
              <div className="rounded-[6px] px-3 py-2" style={{ border: '1px solid var(--glass-line-soft)' }}>
                <b>AAVA</b> <span style={{ color: 'var(--muted)' }}>on behalf of @Alex · earlier</span>
                <div className="mt-1">Picked up from {ctx?.ticketSource ?? 'Jira'}; matched to {ctx?.run.agent ?? 'an agentic process'}.</div>
              </div>
            </div>
          </div>

          <aside>
            <Pill solid>{status}</Pill>
            <div className="mt-4 rounded-[6px] px-3" style={{ border: '1px solid var(--glass-line-soft)' }}>
              <SideGroup label="Assignee">Alex</SideGroup>
              <SideGroup label="Reporter">Product owner</SideGroup>
              <SideGroup label="Priority">Medium</SideGroup>
              <SideGroup label="Sprint">{sprint}</SideGroup>
              <SideGroup label="Labels">aava</SideGroup>
              <SideGroup label="Development">
                {linkedPrs.length === 0 ? <span style={{ color: 'var(--muted)' }}>{ctx?.run.branch ?? 'No branch yet'}</span> : (
                  <div className="grid gap-1">
                    {linkedPrs.map((p) => (
                      <LinkText key={p.number} onClick={() => onOpenUrl(prUrl(p.repo, p.number))}>{p.repo} PR #{p.number} · Open</LinkText>
                    ))}
                  </div>
                )}
              </SideGroup>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

/* ── Figma file ──────────────────────────────────────────────────────────── */

function FigmaFile({ file }: { file: string }) {
  const layers = ['Title', 'Subtitle', 'Rating · 1–5', 'Comment field', 'Character counter', 'Submit button']
  return (
    <div className="flex h-full min-h-[480px] flex-col">
      <div className="flex items-center gap-3 px-4 py-2 text-[12.5px]" style={{ borderBottom: '1px solid var(--glass-line-soft)', background: 'var(--wash-1)' }}>
        <span className="grid h-6 w-6 place-items-center rounded-[5px] text-[11px] font-bold" style={{ background: 'var(--text)', color: 'var(--on-text)' }}>F</span>
        <span className="font-semibold">{file}</span>
        <span style={{ color: 'var(--muted)' }}>Drafts · Mobile app</span>
        <span className="ml-auto rounded-[5px] px-2.5 py-1 font-semibold" style={{ background: 'var(--text)', color: 'var(--on-text)' }}>Share</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[180px_minmax(0,1fr)_180px]">
        <div className="p-3 text-[12px]" style={{ borderRight: '1px solid var(--glass-line-soft)' }}>
          <div className="mb-2 font-semibold" style={{ color: 'var(--muted)' }}>Layers</div>
          <div className="font-semibold">▾ {file}</div>
          {layers.map((l) => <div key={l} className="py-0.5 pl-4" style={{ color: 'var(--text-dim)' }}>{l}</div>)}
        </div>
        <div className="grid place-items-center p-6" style={{ background: 'var(--wash-2)' }}>
          <div className="w-full max-w-[320px] rounded-[10px] p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="h-4 w-2/3 rounded" style={{ background: 'var(--wash-6)' }} />
            <div className="mt-2 h-2.5 w-5/6 rounded" style={{ background: 'var(--wash-4)' }} />
            <div className="mt-5 flex gap-2">{[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="grid h-8 w-8 place-items-center rounded-[6px] text-[11px]" style={{ border: '1px solid var(--border)' }}>{n}</div>
            ))}</div>
            <div className="mt-4 h-20 rounded-[6px]" style={{ border: '1px solid var(--border)' }} />
            <div className="mt-1 ml-auto h-2 w-12 rounded" style={{ background: 'var(--wash-4)' }} />
            <div className="mt-4 h-8 w-24 rounded-[6px]" style={{ background: 'var(--wash-6)' }} />
          </div>
        </div>
        <div className="p-3 text-[12px]" style={{ borderLeft: '1px solid var(--glass-line-soft)' }}>
          <div className="mb-2 font-semibold" style={{ color: 'var(--muted)' }}>Design</div>
          {[['Frame', '375 × 812'], ['Fill', 'Surface'], ['Text', 'Body / 14'], ['Radius', '10']].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1"><span style={{ color: 'var(--muted)' }}>{k}</span><span>{v}</span></div>
          ))}
          <div className="mt-3" style={{ color: 'var(--muted-deep)' }}>Last modified 3 days ago</div>
        </div>
      </div>
    </div>
  )
}

function Placeholder({ url }: { url: string }) {
  return (
    <div className="grid h-full place-items-center p-10 text-center">
      <div>
        <div className="text-[15px] font-semibold">{url.replace(/^https?:\/\//, '').split('/')[0]}</div>
        <div className="mt-1 text-[12.5px]" style={{ color: 'var(--muted)' }}>A placeholder page for this demo.</div>
      </div>
    </div>
  )
}
