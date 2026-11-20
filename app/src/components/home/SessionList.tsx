import { useMemo, useState, type ReactNode } from 'react'
import type { Task, Thread } from '../../state/types'
import { dayPart } from '../../data/greetings'
import type { ListView } from '../chrome/NavRail'
import { ASK, needsOf, sessionTasks } from './sessionGroups'

/* The secondary sidebar: every session, grouped by what it needs from you.
 *
 * Concept: AAVA-Web-demo ("Today" list). Sections follow the PRD's task view
 * (US17 / FR20): Needs you, Ready for review, Agent at work (running slots and
 * the Up next queue, reorderable per FR8), Conversations, Completed. Each
 * section folds like Codex's sidebar groups.
 *
 * The prototype's scripted tasks (from journey state) are real and open a
 * session. The other rows are sample data that show what a full day looks
 * like; clicking one says so instead of pretending to open it.
 */

interface Props {
  view: ListView
  onView: (v: ListView) => void
  /** The user's scripted tasks — the home board, live from journey state. */
  tasks: Task[]
  threads: Thread[]
  firstTime: boolean
  activeTaskId: string | null
  activeThreadId: string | null
  onOpenTask: (id: string) => void
  onOpenThread: (id: string) => void
  onNewChat: () => void
  onSample: (title: string) => void
  onHide: () => void
}

interface Row { tone?: 'warn' | 'ok' | 'done' | 'danger'; id: string; title: string; meta: string; trail?: string; icon: ReactNode; sample?: boolean; onPick: () => void; selected?: boolean }

const svg = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
const I = {
  q: <svg {...svg}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.3" /><path d="M12 16.8h.01" /></svg>,
  a: <svg {...svg}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>,
  eye: <svg {...svg}><path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></svg>,
  chat: <svg {...svg}><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 20 12z" /></svg>,
  done: <svg {...svg}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>,
  list: <svg {...svg}><path d="M4 7h16M4 12h16M4 17h10" /></svg>,
  blank: <svg {...svg}><circle cx="12" cy="12" r="9" strokeDasharray="3 3" /></svg>,
  chev: (open: boolean) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
      style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}><path d="M9 6l6 6-6 6" /></svg>
  ),
}
const ring = (pct: number, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="9" fill="none" stroke="var(--wash-5)" strokeWidth="3" />
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" pathLength="100" strokeDasharray={`${pct} 100`} transform="rotate(-90 12 12)" />
  </svg>
)

/* Sample rows (from the concept), so the list shows a realistic day. */
const SAMPLE = {
  review: [
    { id: 'r1', title: 'Order summary card — responsive layout', meta: 'Done · 12 tests pass, 1 warning to check', trail: '1 h' },
    { id: 'r2', title: 'Dark mode tokens for Settings', meta: 'Done · 2 contrast warnings to check', trail: '2 h' },
  ],
  work: [
    { id: 'w1', title: 'Promo code field validation', meta: 'Writing tests · 7 of 8 pass', pct: 64 },
    { id: 'w2', title: 'Visible focus rings in top navigation', meta: 'Auditing the nav · 6 issues found', pct: 25 },
    { id: 'w3', title: 'Skeleton loaders for product grid', meta: 'Implementing the loading state', pct: 50 },
  ],
  queue: [
    { id: 'n1', title: 'Toast notification spacing', meta: 'PAY-1445 · UI Component Builder' },
    { id: 'n2', title: 'Tooltip on truncated labels', meta: '#8830 · Accessibility Fixer' },
    { id: 'n3', title: 'Breadcrumb overflow menu', meta: 'PAY-1449 · UI Component Builder' },
  ],
  convs: [
    { id: 'c1', title: 'Why did the checkout bundle grow this week?', meta: 'Intent: investigate · answered', trail: '9:40' },
    { id: 'c2', title: 'Plan the Tailwind upgrade for the web app', meta: 'Intent: plan · waiting on you', trail: 'Yesterday' },
  ],
  done: [
    { id: 'd1', title: 'Pagination component', meta: 'Accepted 8:12', trail: '8:12' },
    { id: 'd2', title: 'Form error message alignment', meta: 'Accepted 9:05', trail: '9:05' },
    { id: 'd3', title: 'Sticky table header', meta: 'Accepted 10:30', trail: '10:30' },
  ],
  notStarted: [
    { id: 'm1', title: 'Investigate flaky checkout e2e on CI', meta: 'No golden agent · not started', trail: '2 d' },
    { id: 'm2', title: 'Write Q4 front-end hiring rubric', meta: 'No golden agent · not started', trail: '5 d' },
  ],
}

export function SessionList({ view, onView, tasks, threads, firstTime, activeTaskId, activeThreadId, onOpenTask, onOpenThread, onNewChat, onSample, onHide }: Props) {
  /* First open: what needs the user is expanded; the rest stays folded until
     they open it. */
  const [folded, setFolded] = useState<Set<string>>(() => new Set(['work', 'convs']))
  const [workOpen, setWorkOpen] = useState(false)
  const [nextOpen, setNextOpen] = useState(true)
  const [queue, setQueue] = useState(SAMPLE.queue.map((q) => q.id))
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const toggle = (k: string) => setFolded((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n })
  const sample = (title: string) => () => onSample(title)

  /* Scripted tasks, placed by their live state. */
  const scripted = sessionTasks(tasks, firstTime)
  const taskRow = (t: Task): Row => ({
    id: t.id, title: t.title,
    meta: t.tag === 'done' ? (t.note ?? 'Completed') : ASK[t.id]?.meta ?? t.note ?? '',
    trail: t.tag === 'done' ? 'Done' : ASK[t.id]?.trail,
    icon: t.tag === 'done' ? I.done : t.tag === 'review' ? I.eye : ASK[t.id]?.kind === 'a' ? I.a : I.q,
    tone: t.tag === 'input' ? 'warn' : t.tag === 'blocked' ? 'danger' : t.tag === 'review' ? 'ok' : t.tag === 'working' ? 'done' : undefined,
    onPick: () => onOpenTask(t.id), selected: activeTaskId === t.id,
  })
  const needs = needsOf(scripted).map(taskRow)
  const reviewReal = scripted.filter((t) => t.tag === 'review').map(taskRow)
  const doneReal = scripted.filter((t) => t.tag === 'done').map(taskRow)
  /* A session the user started that is now running on its own. */
  const workReal = scripted.filter((t) => t.tag === 'working').map((t) => ({ ...taskRow(t), icon: ring(50, 16), trail: 'Running' }))

  const review: Row[] = [...reviewReal, ...(firstTime ? [] : SAMPLE.review.map((r) => ({ ...r, icon: I.eye, tone: 'ok' as const, sample: true, onPick: sample(r.title) })))]
  const userChats = threads.filter((th) => th.kind === 'chat')
  const convs: Row[] = [
    ...userChats.map((th) => ({ id: th.id, title: th.title, meta: 'Intent · conversation', trail: th.when, icon: I.chat, onPick: () => onOpenThread(th.id), selected: activeThreadId === th.id && !activeTaskId })),
    ...(firstTime ? [] : SAMPLE.convs.map((c) => ({ ...c, icon: I.chat, sample: true, onPick: sample(c.title) }))),
  ]
  const done: Row[] = [...doneReal, ...(firstTime ? [] : SAMPLE.done.map((d) => ({ ...d, icon: I.done, sample: true, onPick: sample(d.title) })))]
  const work = firstTime ? [] : SAMPLE.work
  const queued = firstTime ? [] : queue.map((id) => SAMPLE.queue.find((q) => q.id === id)!)

  const greeting = useMemo(() => {
    const part = dayPart()
    const hello = part === 'morning' ? 'Good morning.' : part === 'afternoon' ? 'Good afternoon.' : 'Good evening.'
    if (firstTime) return `${hello} Nothing is assigned to you yet. Ask me something to start.`
    const bits = [
      needs.length ? `${needs.length} ${needs.length === 1 ? 'thing needs' : 'things need'} you` : null,
      review.length ? `${review.length} ${review.length === 1 ? 'is' : 'are'} ready for your review` : null,
    ].filter(Boolean)
    return `${hello} ${bits.join(', ')}${bits.length ? ', and ' : ''}I’m working on ${work.length}.`
  }, [firstTime, needs.length, review.length, work.length])

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  /* Reorder — drag on pointer devices, buttons for keyboard and touch. FR8:
     changes pending order only; nothing running is interrupted. */
  const move = (id: string, to: number) => setQueue((q) => {
    const from = q.indexOf(id); if (from < 0 || to < 0 || to >= q.length) return q
    const n = q.slice(); n.splice(from, 1); n.splice(to, 0, id); return n
  })

  const section = (key: string, title: string, count: string, body: ReactNode, tone?: 'warn' | 'ok') => {
    const open = !folded.has(key)
    return (
      <section key={key} className="mt-4">
        <button type="button" onClick={() => toggle(key)} aria-expanded={open}
          className="press group flex w-full items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-left transition-colors hover:bg-[var(--wash-2)]">
          {tone && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: `var(--${tone})` }} aria-hidden />}
          <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-dim)' }}>{title}</h3>
          <span className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" style={{ color: 'var(--muted)' }}>{I.chev(open)}</span>
          <span className="ml-auto text-[12px] font-medium tabular-nums" style={{ color: tone ? `var(--${tone})` : 'var(--muted)' }}>{count}</span>
        </button>
        {open && <div className="mt-1 overflow-hidden rounded-[12px]" style={{ background: 'var(--wash-2)' }}>{body}</div>}
      </section>
    )
  }

  const rowEl = (r: Row, extra?: ReactNode) => (
    <button key={r.id} type="button" onClick={r.onPick} aria-current={r.selected ? 'true' : undefined}
      className="press flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--wash-3)]"
      style={{ background: r.selected ? 'var(--wash-4)' : undefined, borderBottom: '1px solid var(--glass-line-soft)' }}>
      <span className="mt-0.5 shrink-0" style={{ color: r.tone ? `var(--${r.tone})` : r.selected ? 'var(--text)' : 'var(--text-dim)' }}>{r.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium" style={{ color: 'var(--text)' }}>{r.title}</span>
        <span className="block truncate text-[12px]" style={{ color: 'var(--muted)' }}>{r.meta}</span>
      </span>
      {r.trail && <span className="shrink-0 pt-0.5 text-[11.5px] font-medium tabular-nums" style={{ color: r.tone === 'warn' ? 'var(--warn)' : 'var(--text-dim)' }}>{r.trail}</span>}
      {extra}
    </button>
  )

  const empty = (text: string) => <p className="px-3 py-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>{text}</p>

  /* ── Views ─────────────────────────────────────────────────────────── */

  let content: ReactNode
  if (view === 'home') {
    content = (
      <>
        {firstTime && (
          <div className="mt-6 rounded-[12px] px-4 py-5 text-center" style={{ background: 'var(--wash-2)' }}>
            <p className="text-[14px] font-semibold">Nothing here yet</p>
            <p className="mt-1 text-[12.5px]" style={{ color: 'var(--muted)' }}>When I pick up your Jira or Azure DevOps work, it shows up here, grouped by what it needs from you.</p>
          </div>
        )}
        {needs.length > 0 && section('needs', 'Needs you', String(needs.length), needs.map((r) => rowEl(r)), 'warn')}
        {review.length > 0 && section('review', 'Ready for review', String(review.length), review.map((r) => rowEl(r)), 'ok')}
        {!firstTime && section('work', 'Agent at work', `${work.length} parallel slots`, (
          <>
            <button type="button" onClick={() => setWorkOpen((o) => !o)} aria-expanded={workOpen}
              className="press flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--wash-3)]"
              style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
              <span className="mt-0.5 shrink-0" style={{ color: 'var(--text)' }}>{ring(100)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium">Working on {work.length} of {work.length}</span>
                <span className="block truncate text-[12px]" style={{ color: 'var(--muted)' }}>{work.map((w) => w.title).join(', ')}</span>
              </span>
              <span className="pt-1" style={{ color: 'var(--muted)' }}>{I.chev(workOpen)}</span>
            </button>
            {workOpen && workReal.map((r) => rowEl(r))}
            {workOpen && work.map((w) => rowEl({ id: w.id, title: w.title, meta: w.meta, icon: ring(w.pct, 16), tone: 'done', sample: true, onPick: sample(w.title) }))}
            <button type="button" onClick={() => setNextOpen((o) => !o)} aria-expanded={nextOpen}
              className="press flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--wash-3)]"
              style={{ borderBottom: nextOpen ? '1px solid var(--glass-line-soft)' : undefined }}>
              <span className="mt-0.5 shrink-0" style={{ color: 'var(--text-dim)' }}>{I.list}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium">Up next</span>
                <span className="block truncate text-[12px]" style={{ color: 'var(--muted)' }}>{queued.length} waiting · {queued[0]?.title}</span>
              </span>
              <span className="flex items-center gap-1 pt-0.5 text-[11.5px] tabular-nums" style={{ color: 'var(--muted)' }}>{queued.length}{I.chev(nextOpen)}</span>
            </button>
            {nextOpen && (
              <ol aria-label="Up next, in priority order">
                {queued.map((q, i) => (
                  <li key={q.id}
                    draggable
                    onDragStart={(e) => { setDragId(q.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', q.id) }}
                    onDragOver={(e) => { e.preventDefault(); if (overId !== q.id) setOverId(q.id) }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverId((o) => (o === q.id ? null : o)) }}
                    onDrop={(e) => {
                      e.preventDefault()
                      /* The line marks "drop before this row". Moving down, the
                         dragged row's own slot closes up first, so aim one back. */
                      if (dragId) { const from = queue.indexOf(dragId); move(dragId, from < i ? i - 1 : i) }
                      setDragId(null); setOverId(null)
                    }}
                    onDragEnd={() => { setDragId(null); setOverId(null) }}
                    className="group flex items-center gap-2 pl-3 pr-1.5 transition-colors hover:bg-[var(--wash-3)]"
                    style={{
                      borderBottom: '1px solid var(--glass-line-soft)',
                      opacity: dragId === q.id ? 0.45 : 1,
                      boxShadow: overId === q.id && dragId && dragId !== q.id ? 'inset 0 2px 0 var(--text)' : undefined,
                      cursor: 'grab',
                    }}>
                    <span className="w-4 shrink-0 text-center text-[12px] font-semibold tabular-nums" style={{ color: 'var(--muted)' }}>{i + 1}</span>
                    <button type="button" onClick={sample(q.title)} className="press min-w-0 flex-1 py-2.5 text-left">
                      <span className="block truncate text-[13.5px] font-medium">{q.title}</span>
                      <span className="block truncate text-[12px]" style={{ color: 'var(--muted)' }}>{q.meta}</span>
                    </button>
                    <span className="flex shrink-0 opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <button type="button" onClick={() => move(q.id, i - 1)} disabled={i === 0} aria-label={`Move ${q.title} up`}
                        className="press grid h-7 w-7 place-items-center rounded-[6px] hover:bg-[var(--wash-4)] disabled:opacity-30" style={{ color: 'var(--text-dim)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 15l6-6 6 6" /></svg>
                      </button>
                      <button type="button" onClick={() => move(q.id, i + 1)} disabled={i === queued.length - 1} aria-label={`Move ${q.title} down`}
                        className="press grid h-7 w-7 place-items-center rounded-[6px] hover:bg-[var(--wash-4)] disabled:opacity-30" style={{ color: 'var(--text-dim)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
                      </button>
                    </span>
                  </li>
                ))}
                <li className="px-3 py-2 text-[11.5px]" style={{ color: 'var(--muted)' }}>Drag or use the arrows to reorder. Running work isn’t interrupted.</li>
              </ol>
            )}
          </>
        ))}
        {convs.length > 0 && section('convs', 'Conversations', String(convs.length), convs.map((r) => rowEl(r)))}
        {done.length > 0 && (
          <div className="mt-4 flex items-center justify-between px-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
            <span>Completed today · {done.length}</span>
            <button type="button" onClick={() => onView('completed')} className="press rounded-[6px] px-1.5 py-0.5 font-medium hover:bg-[var(--wash-3)]" style={{ color: 'var(--text-dim)' }}>View all</button>
          </div>
        )}
      </>
    )
  } else if (view === 'mytasks') {
    const withAava: Row[] = [
      ...needs, ...review,
      ...work.map((w) => ({ id: w.id, title: w.title, meta: w.meta, trail: 'Running', icon: ring(w.pct, 16), sample: true, onPick: sample(w.title) })),
      ...queued.map((q) => ({ id: q.id, title: q.title, meta: q.meta, trail: 'Queued', icon: I.list, sample: true, onPick: sample(q.title) })),
    ]
    content = (
      <>
        {section('mt-aava', 'With AAVA', String(withAava.length), withAava.length ? withAava.map((r) => rowEl(r)) : empty('Nothing assigned yet.'))}
        {!firstTime && section('mt-none', 'No golden agent', String(SAMPLE.notStarted.length), SAMPLE.notStarted.map((m) => rowEl({ ...m, icon: I.blank, sample: true, onPick: sample(m.title) })))}
      </>
    )
  } else if (view === 'conversations') {
    content = (
      <>
        <button type="button" onClick={onNewChat} className="press mt-3 h-9 rounded-[10px] px-3 text-[13px] font-medium" style={{ background: 'var(--text)', color: 'var(--on-text)' }}>New chat</button>
        {section('cv-recent', 'Recent', String(convs.length), convs.length ? convs.map((r) => rowEl(r)) : empty('No conversations yet.'))}
      </>
    )
  } else {
    content = section('cp-today', 'Today', String(done.length), done.length ? done.map((r) => rowEl(r)) : empty('Nothing completed yet.'))
  }

  const heading: Record<ListView, { eyebrow: string; title: string; summary?: string }> = {
    home: { eyebrow: today, title: 'Today' },
    mytasks: { eyebrow: 'Jira and Azure DevOps', title: 'My tasks', summary: 'Every ticket assigned to you, including ones AAVA can’t pick up yet.' },
    conversations: { eyebrow: 'Intent-based', title: 'Conversations', summary: 'Ask, investigate or plan with AAVA. A conversation becomes a task only when you say so.' },
    completed: { eyebrow: 'Today', title: 'Completed', summary: `${done.length} tasks accepted and closed today.` },
  }
  const h = heading[view]

  return (
    <aside aria-label="Sessions" className="flex h-full w-[296px] shrink-0 flex-col" style={{ borderRight: '1px solid var(--glass-line)' }}>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-4">
        <div className="flex items-start justify-between gap-2 px-2">
          <div className="min-w-0">
            <p className="text-[12px]" style={{ color: 'var(--muted)' }}>{h.eyebrow}</p>
            <h2 className="mt-0.5 text-[24px] font-semibold tracking-[-.02em]">{h.title}</h2>
          </div>
          <button type="button" onClick={onHide} aria-label="Hide session list" title="Hide session list"
            className="press mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-[8px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><path d="M9.5 4.5v15" /><path d="M15.5 10l-2 2 2 2" strokeLinecap="round" /></svg>
          </button>
        </div>
        {view === 'home'
          ? <p className="mt-2 px-2 text-[13.5px] leading-snug" style={{ color: 'var(--text-dim)' }}>{greeting}</p>
          : h.summary && <p className="mt-2 px-2 text-[13px] leading-snug" style={{ color: 'var(--muted)' }}>{h.summary}</p>}
        {content}
      </div>
    </aside>
  )
}
