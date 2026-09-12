/* The Interaction Library — a live, browsable catalogue of every interaction
 * pattern in the AAVA 3.0 demo. beautifui.dev's shape (a rail of names, a pane
 * that shows one live) re-skinned entirely in AAVA's own tokens: this page is
 * a showcase OF the design system, so it has to look like the product, not a
 * generic component-library shell.
 *
 * Fully standalone — see interaction-main.tsx. Never imports App.tsx, the
 * reducer, or useJourney; the product itself stays "one screen, no routes,"
 * and this lives entirely outside that law as its own small page. */
import { useMemo, useState } from 'react'
import { GROUPS, PATTERNS } from './data'
import { ImplementationNote } from './shared'
import {
  ThinkingDotsPreview, StreamedTextPreview, ToolStepsPreview, CapabilityShimmerPreview, ExecutionGraphPreview,
} from './previews/agentPresence'
import { RunDockPreview } from './previews/runStatus'
import { InlineGatePreview, HitlGatePreview, PlanEditPreview, HonestAfterStatePreview } from './previews/decisionsGates'
import { ViewTabsPreview, InlineCommentsPreview, ChangesTrayPreview, MatchCardPreview, SplitTabsPreview } from './previews/canvasDocuments'
import { ChipsPreview, ToastPreview, TooltipPreview, PressFeedbackPreview, AmbientFieldPreview } from './previews/feedbackAmbient'

const PREVIEWS: Record<string, React.ComponentType> = {
  'thinking-dots': ThinkingDotsPreview,
  'streamed-text': StreamedTextPreview,
  'tool-steps': ToolStepsPreview,
  'capability-shimmer': CapabilityShimmerPreview,
  'execution-graph': ExecutionGraphPreview,
  'run-dock': RunDockPreview,
  'gate-inline': InlineGatePreview,
  'hitl-gate': HitlGatePreview,
  'plan-edit': PlanEditPreview,
  'honest-afterstate': HonestAfterStatePreview,
  'preview-code-pill': ViewTabsPreview,
  'inline-comments': InlineCommentsPreview,
  'changes-tray': ChangesTrayPreview,
  'match-card': MatchCardPreview,
  'split-tabs': SplitTabsPreview,
  'chips': ChipsPreview,
  'toast': ToastPreview,
  'tooltip': TooltipPreview,
  'press-feedback': PressFeedbackPreview,
  'ambient-field': AmbientFieldPreview,
}

export function InteractionLibrary() {
  const [activeId, setActiveId] = useState(PATTERNS[0].id)
  const [query, setQuery] = useState('')
  const [railOpen, setRailOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return PATTERNS
    return PATTERNS.filter((p) => p.label.toLowerCase().includes(q) || p.group.toLowerCase().includes(q))
  }, [query])

  const active = PATTERNS.find((p) => p.id === activeId) ?? PATTERNS[0]
  const Preview = PREVIEWS[active.id]

  const select = (id: string) => { setActiveId(id); setRailOpen(false) }

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: 'var(--ground)' }}>
      {/* ── Rail ──────────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] shrink-0 flex-col overflow-hidden transition-transform duration-200 md:static md:translate-x-0
          ${railOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--slab)', borderRight: '1px solid var(--glass-line-soft)' }}>
        <div className="flex items-center gap-2 px-4 pb-3 pt-5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px]" style={{ background: 'var(--wash-3)' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>AAVA</div>
            <div className="truncate text-[10.5px] uppercase tracking-[.1em]" style={{ color: 'var(--muted)' }}>Interaction Library</div>
          </div>
        </div>

        <div className="px-3 pb-3">
          <div className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patterns…"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-none" style={{ color: 'var(--text-dim)' }} />
          </div>
        </div>

        <nav aria-label="Interaction patterns" className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {GROUPS.map((group) => {
            const rows = filtered.filter((p) => p.group === group)
            if (rows.length === 0) return null
            return (
              <div key={group} className="mb-1">
                <div className="px-2.5 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>{group}</div>
                {rows.map((p) => {
                  const isActive = p.id === activeId
                  return (
                    <button key={p.id} onClick={() => select(p.id)} aria-current={isActive}
                      className="press relative flex w-full items-center gap-2 rounded-[8px] px-2.5 py-[7px] text-left text-[12.5px]"
                      style={{ background: isActive ? 'var(--wash-3)' : 'transparent', color: isActive ? 'var(--text)' : 'var(--muted)', fontWeight: isActive ? 600 : 400 }}>
                      {isActive && <span className="absolute -left-2 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full" style={{ background: 'var(--brand)' }} />}
                      {p.label}
                    </button>
                  )
                })}
              </div>
            )
          })}
          {filtered.length === 0 && <p className="px-2.5 py-4 text-[12px]" style={{ color: 'var(--muted-deep)' }}>No patterns match "{query}".</p>}
        </nav>
      </aside>

      {railOpen && <div className="fixed inset-0 z-30 md:hidden" style={{ background: 'var(--scrim)' }} onClick={() => setRailOpen(false)} />}

      {/* ── Right pane ────────────────────────────────────────────────── */}
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 px-5 py-3 md:hidden" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          <button onClick={() => setRailOpen(true)} className="icon-btn" aria-label="Open pattern list">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="text-[13px] font-medium" style={{ color: 'var(--text-dim)' }}>{active.label}</span>
        </div>

        <div className="mx-auto max-w-[720px] px-6 py-10 md:px-10">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--brand)' }}>{active.group}</div>
          <h1 className="text-[26px] font-bold tracking-[-.01em]" style={{ color: 'var(--text)' }}>{active.label}</h1>
          <p className="mt-2 max-w-[560px] text-[13.5px] leading-[1.6]" style={{ color: 'var(--muted)' }}>{active.blurb}</p>

          <div className="mt-6">{Preview && <Preview />}</div>

          <ImplementationNote meta={active} />
        </div>
      </main>
    </div>
  )
}
