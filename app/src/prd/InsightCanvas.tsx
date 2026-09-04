/* The analytics-insight viewer.
 *
 * What the Canvas becomes when the object it holds is a Product-Analytics run
 * (Example 3). It mirrors DocumentCanvas's shell — a card with a toolbar, a
 * scrollable body, and the Watch zone docked beneath — but instead of a single
 * document it renders one of five evidence dashboards (funnel, feedback, log
 * audit, impact, PRD), switched from the toolbar or advanced by the run itself.
 * The content is data in ./insight; this file only lays it out. */
import { WatchBar } from '../zones/WatchBar'
import type { ActiveObject, WatchEntry } from '../state/types'
import {
  type InsightView, type Kpi, type Delta,
  INSIGHT_ORDER, INSIGHT_FILE,
  FUNNEL_KPIS, FUNNEL_STEPS,
  FRICTION_KPIS, FEEDBACK_SYNTHESIS, FEEDBACK_ITEMS,
  AUDIT_KPIS, TIMELINE_PRE, TIMELINE_POST, LOG_ENTRIES,
  IMPACT_BOXES, IMPACT_STATUS_QUO, IMPACT_WITH_FIX,
  PRD_META, PRD_SECTIONS,
} from './insight'

interface Props {
  object: ActiveObject
  watch: WatchEntry[]
  onCollapse: () => void
  onSelectView: (view: InsightView) => void
  onToast: (text: string) => void
}

const VIEW_LABEL: Record<InsightView, string> = {
  funnel: 'Funnel', feedback: 'Feedback', audit: 'Log audit', impact: 'Impact', prd: 'PRD',
}
const VIEW_TITLE: Record<InsightView, { title: string; subtitle: string; source?: boolean }> = {
  funnel: { title: 'Product funnel performance & anomaly detection', subtitle: 'Self-serve onboarding and checkout stream, post-Release v3.4', source: true },
  feedback: { title: 'Step 3 friction & customer feedback', subtitle: 'Session duration, bounce, and 42 incoming complaints', source: true },
  audit: { title: 'Application-log audit · #submit-payment-btn', subtitle: 'FormValidationBypass · pre vs post-Release v3.4' },
  impact: { title: 'Business & revenue impact modelling', subtitle: 'Conversion leakage, affected cohort, and support surge' },
  prd: { title: 'PRD specification (read & edit view)', subtitle: 'Synthesised from logs, event telemetry and feedback' },
}

/* Token colours for the small semantic tones the data carries. */
const TONE: Record<'pos' | 'neg' | 'warn' | 'flat', string> = {
  pos: 'var(--ok)', neg: 'var(--danger)', warn: 'var(--warn)', flat: 'var(--muted)',
}
const VAL_TONE: Record<NonNullable<Kpi['tone']>, string> = {
  text: 'var(--text)', danger: 'var(--danger)', warn: 'var(--warn)', ok: 'var(--ok)', blue: 'var(--zone-canvas-accent)',
}
const BAR: Record<'blue' | 'danger' | 'ok', string> = {
  blue: 'var(--zone-canvas-accent)', danger: 'var(--danger)', ok: 'var(--ok)',
}

export function InsightCanvas({ object, watch, onCollapse, onSelectView, onToast }: Props) {
  const view: InsightView = object.activeInsight ?? 'funnel'
  const head = VIEW_TITLE[view]
  const file = INSIGHT_FILE[view]

  return (
    <section aria-label="Canvas — analytics" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="relative m-[12px] mb-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[var(--r-md)]"
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)', borderBottom: 'none' }}>

        {/* Toolbar — the five views on the left, the filename and Close on the right. */}
        <div className="relative flex items-center gap-2 px-2.5 py-2" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          <div className="flex items-center gap-1 rounded-[11px] p-[3px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
            {INSIGHT_ORDER.map((v) => {
              const active = v === view
              return (
                <button key={v} onClick={() => onSelectView(v)} aria-pressed={active}
                  className="press rounded-[8px] px-2.5 py-1 text-[11.5px] font-medium"
                  style={active
                    ? { background: 'var(--text)', color: 'var(--on-text)' }
                    : { color: 'var(--muted)' }}>
                  {VIEW_LABEL[v]}
                </button>
              )
            })}
          </div>
          <span className="mono ml-1 hidden truncate text-[11.5px] sm:block" style={{ color: 'var(--muted-deep)' }}>{file}</span>
          <div className="ml-auto flex items-center gap-1 rounded-[11px] p-[3px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
            <button onClick={() => onToast('Share link copied')} aria-label="Share" title="Share" className="icon-btn">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" /></svg>
            </button>
            <span className="mx-0.5 h-4 w-px" style={{ background: 'var(--glass-line-soft)' }} aria-hidden />
            <button onClick={onCollapse} aria-label="Close" title="Close" className="icon-btn">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </div>

        {/* Body — the current dashboard, scrollable. */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <header className="mb-3.5 flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--glass-line-soft)' }}>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>{head.title}</h3>
              <p className="mt-1 text-[12px]" style={{ color: 'var(--muted)' }}>{head.subtitle}</p>
            </div>
            {head.source && (
              <a href="https://analytics.google.com" target="_blank" rel="noreferrer"
                className="press flex shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[11.5px] font-medium"
                style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--zone-canvas-accent)' }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>
                Google Analytics
              </a>
            )}
          </header>

          {view === 'funnel' && <FunnelView />}
          {view === 'feedback' && <FeedbackView />}
          {view === 'audit' && <AuditView />}
          {view === 'impact' && <ImpactView />}
          {view === 'prd' && <PrdView />}
        </div>
      </div>

      <div className="mx-[12px] mb-[12px] overflow-hidden rounded-b-[var(--r-md)]" style={{ border: '1px solid var(--glass-line-soft)', borderTop: 'none' }}>
        <WatchBar entries={watch} />
      </div>
    </section>
  )
}

/* ── Shared bits ─────────────────────────────────────────────────────────── */

function Card({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-[var(--r-md)] p-3" style={{ background: 'var(--wash-2)', border: `1px solid ${tone ?? 'var(--glass-line-soft)'}` }}>
      {children}
    </div>
  )
}

function DeltaLine({ delta }: { delta?: Delta }) {
  if (!delta) return null
  return <span className="text-[11px] font-semibold" style={{ color: TONE[delta.tone] }}>{delta.text}</span>
}

function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {items.map((k) => (
        <div key={k.label} className="flex flex-col gap-1 rounded-[var(--r-md)] p-3"
          style={{ background: 'var(--wash-2)', border: `1px solid ${k.tone && k.tone !== 'text' ? `color-mix(in srgb, ${VAL_TONE[k.tone]} 40%, transparent)` : 'var(--glass-line-soft)'}` }}>
          <span className="text-[10.5px] uppercase tracking-[.05em]" style={{ color: 'var(--muted)' }}>{k.label}</span>
          <span className="mono text-[18px] font-bold leading-tight" style={{ color: k.tone ? VAL_TONE[k.tone] : 'var(--text)' }}>{k.value}</span>
          <DeltaLine delta={k.delta} />
        </div>
      ))}
    </div>
  )
}

function SectionTitle({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mb-2 mt-4 flex items-center justify-between">
      <h5 className="text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>{children}</h5>
      {note && <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{note}</span>}
    </div>
  )
}

/* ── View 1 · Funnel ─────────────────────────────────────────────────────── */

export function FunnelView() {
  return (
    <div className="flex flex-col gap-3">
      <KpiGrid items={FUNNEL_KPIS} />
      <Card>
        <SectionTitle note="Cohort · all web & mobile traffic (48h)">4-step acquisition & checkout funnel</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {FUNNEL_STEPS.map((s) => (
            <div key={s.name} className="relative rounded-[9px] p-2.5"
              style={{ background: 'var(--slab-raised)', border: `1px solid ${s.alert ? 'var(--danger)' : 'var(--glass-line-soft)'}` }}>
              <div className="flex items-start justify-between gap-1">
                <span className="text-[11px]" style={{ color: s.alert ? 'var(--danger)' : 'var(--muted)', fontWeight: s.alert ? 600 : 400 }}>{s.name}</span>
                {s.badge && <span className="rounded-[4px] px-1.5 py-[1px] text-[9px] font-semibold" style={{ background: 'var(--danger)', color: 'var(--on-text)' }}>{s.badge}</span>}
              </div>
              <div className="mono mt-1 text-[16px] font-bold" style={{ color: s.tone === 'danger' ? 'var(--danger)' : 'var(--text)' }}>{s.count}</div>
              <div className="my-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--wash-4)' }}>
                <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: BAR[s.tone] }} />
              </div>
              <div className="text-[10.5px]" style={{ color: s.alert ? 'var(--danger)' : 'var(--muted)', fontWeight: s.alert ? 600 : 400 }}>{s.drop}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ── View 2 · Feedback ───────────────────────────────────────────────────── */

export function FeedbackView() {
  return (
    <div className="flex flex-col gap-3">
      <KpiGrid items={FRICTION_KPIS} />
      <Card tone="color-mix(in srgb, var(--ok) 30%, transparent)">
        <div className="mb-2 flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--glass-line-soft)' }}>
          <span className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--text)' }}>
            <span style={{ color: 'var(--ok)' }}>✦</span> AI synthesis · key commonalities across all 42 tickets
          </span>
          <span className="rounded-[4px] px-2 py-[2px] text-[10px]" style={{ color: 'var(--ok)', background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>93% coherence</span>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {FEEDBACK_SYNTHESIS.map((s) => (
            <div key={s.title} className="rounded-[8px] p-2.5" style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)' }}>
              <div className="mono text-[12px] font-bold" style={{ color: 'var(--ok)' }}>{s.metric}</div>
              <div className="mt-0.5 text-[11.5px] leading-[1.4]" style={{ color: 'var(--muted)' }}>
                <b style={{ color: 'var(--text-dim)' }}>{s.title}:</b> {s.body}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle note={`Showing ${FEEDBACK_ITEMS.length} of ${FEEDBACK_ITEMS.length}`}>All {FEEDBACK_ITEMS.length} individual submissions</SectionTitle>
        <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto pr-1.5">
          {FEEDBACK_ITEMS.map((f, i) => (
            <div key={i} className="rounded-[8px] px-3 py-2" style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)', borderLeftWidth: 3, borderLeftColor: f.urgent ? 'var(--warn)' : 'var(--glass-line)' }}>
              <div className="text-[12px]" style={{ color: 'var(--text-dim)' }}>"{f.quote}"</div>
              <div className="mt-1 flex items-center justify-between text-[10.5px]" style={{ color: 'var(--muted)' }}>
                <span><b style={{ color: 'var(--muted)' }}>{f.user}</b> · {f.device}</span>
                <span>{f.time} · {f.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ── View 3 · Log audit ──────────────────────────────────────────────────── */

export function AuditView() {
  const maxH = 84
  return (
    <div className="flex flex-col gap-3">
      <KpiGrid items={AUDIT_KPIS} />
      <Card>
        <SectionTitle note="FormValidationBypass on #submit-payment-btn">CTA error-occurrence timeline (hourly)</SectionTitle>
        <div className="grid grid-cols-[1fr_auto_1.6fr] items-end gap-3 rounded-[8px] p-3" style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)' }}>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--ok)' }}>Pre-release (0 errors)</span>
            <div className="flex h-[84px] items-end gap-2">
              {TIMELINE_PRE.map((b) => (
                <div key={b.label} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[9px]" style={{ color: 'var(--muted)' }}>{b.count}</span>
                  <div className="w-full rounded-t-[3px]" style={{ height: 4, background: 'var(--wash-4)', borderTop: '2px solid var(--ok)' }} />
                  <span className="text-[9px]" style={{ color: 'var(--muted-deep)' }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex h-[100px] flex-col items-center justify-end px-1">
            <div className="w-px" style={{ height: 72, borderLeft: '1px dashed var(--warn)' }} />
            <span className="mt-1 whitespace-nowrap rounded-[4px] px-1.5 py-[2px] text-[9px] font-semibold" style={{ color: 'var(--warn)', background: 'var(--wash-2)', border: '1px solid var(--warn)' }}>🚀 v3.4 · 22:00 UTC</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--danger)' }}>Post-release surge (1,840 in 12h)</span>
            <div className="flex h-[84px] items-end gap-1.5">
              {TIMELINE_POST.map((b) => (
                <div key={b.label} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[9px] font-semibold" style={{ color: 'var(--danger)' }}>{b.count}</span>
                  <div className="w-full rounded-t-[3px]" style={{ height: Math.max(6, b.height * maxH), background: 'color-mix(in srgb, var(--danger) 45%, transparent)', borderTop: '2px solid var(--danger)' }} />
                  <span className="text-[8.5px]" style={{ color: 'var(--muted-deep)' }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
      <div className="overflow-hidden rounded-[var(--r-md)]" style={{ background: 'var(--slab-sunken, #0b0e14)', border: '1px solid var(--glass-line-soft)' }}>
        <div className="flex items-center justify-between px-3 py-2 text-[11px]" style={{ background: 'var(--wash-2)', borderBottom: '1px solid var(--glass-line-soft)' }}>
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--danger)' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--warn)' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--ok)' }} />
          </div>
          <span className="mono truncate" style={{ color: 'var(--muted)' }}>app-telemetry.audit.log · [#submit-payment-btn] AND [FormValidationBypass]</span>
          <span className="mono" style={{ color: 'var(--warn)' }}>1,840 MATCHES</span>
        </div>
        <div className="mono flex max-h-[240px] flex-col gap-2 overflow-y-auto p-3 text-[11px] leading-[1.55]">
          {LOG_ENTRIES.map((e, i) => (
            <div key={i} className="rounded-[4px] p-2.5" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', borderLeft: `3px solid ${e.kind === 'first' ? 'var(--warn)' : 'var(--danger)'}` }}>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold" style={{ color: e.kind === 'first' ? 'var(--warn)' : 'var(--danger)' }}>{e.head}<span className="ml-1.5 font-normal" style={{ color: 'var(--muted-deep)' }}>· {e.ts}</span></span>
                <span className="shrink-0 rounded-[4px] px-1.5 py-[1px] text-[9.5px] font-semibold" style={{ color: e.kind === 'first' ? 'var(--warn)' : 'var(--danger)', background: 'var(--wash-2)', border: `1px solid ${e.kind === 'first' ? 'var(--warn)' : 'var(--danger)'}` }}>{e.badge}</span>
              </div>
              {e.lines.map((l, j) => <div key={j} style={{ color: 'var(--text-dim)' }}>{l}</div>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── View 4 · Impact ─────────────────────────────────────────────────────── */

export function ImpactView() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {IMPACT_BOXES.map((b) => (
          <div key={b.label} className="rounded-[var(--r-md)] p-3.5 text-center"
            style={{ background: 'var(--wash-2)', border: `1px solid ${b.highlight ? 'var(--warn)' : 'var(--glass-line-soft)'}` }}>
            <div className="text-[10.5px] uppercase tracking-[.04em]" style={{ color: b.highlight ? 'var(--warn)' : 'var(--muted)' }}>{b.label}</div>
            <div className="mono my-1 text-[24px] font-bold" style={{ color: b.tone === 'blue' ? 'var(--zone-canvas-accent)' : b.tone === 'warn' ? 'var(--warn)' : 'var(--danger)' }}>{b.value}</div>
            <div className="text-[11px]" style={{ color: 'var(--muted)' }}>{b.sub}</div>
            <div className="mt-2 text-[11.5px] font-semibold" style={{ color: b.highlight ? 'var(--warn)' : 'var(--text-dim)' }}>{b.foot}</div>
          </div>
        ))}
      </div>
      <Card>
        <SectionTitle note="Model · post-fix conversion restoration">Funnel recovery opportunity</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-[8px] p-3" style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)' }}>
            <div className="mb-1.5 text-[12px] font-semibold" style={{ color: 'var(--danger)' }}>Current status quo (unresolved)</div>
            <ul className="flex flex-col gap-1 text-[11.5px] leading-[1.5]" style={{ color: 'var(--muted)' }}>
              {IMPACT_STATUS_QUO.map((l) => <li key={l}>• {l}</li>)}
            </ul>
          </div>
          <div className="rounded-[8px] p-3" style={{ background: 'var(--slab-raised)', border: '1px solid color-mix(in srgb, var(--ok) 40%, transparent)' }}>
            <div className="mb-1.5 text-[12px] font-semibold" style={{ color: 'var(--ok)' }}>With hotfix deployed (&lt; 24h)</div>
            <ul className="flex flex-col gap-1 text-[11.5px] leading-[1.5]" style={{ color: 'var(--muted)' }}>
              {IMPACT_WITH_FIX.map((l) => <li key={l}>• {l}</li>)}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

/* ── View 5 · PRD ────────────────────────────────────────────────────────── */

function PrdView() {
  return (
    <div className="rounded-[var(--r-md)] p-5" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
      <div className="border-b pb-3" style={{ borderColor: 'var(--glass-line-soft)' }}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-[4px] px-2 py-[2px] text-[11px] font-medium" style={{ background: 'color-mix(in srgb, var(--warn) 20%, transparent)', color: 'var(--warn)', border: '1px solid color-mix(in srgb, var(--warn) 50%, transparent)' }}>{PRD_META.id}</span>
          <span className="rounded-[4px] px-2 py-[2px] text-[11px] font-medium" style={{ background: 'color-mix(in srgb, var(--zone-canvas-accent) 18%, transparent)', color: 'var(--zone-canvas-accent)' }}>{PRD_META.tag}</span>
          <span className="ml-auto text-[11px]" style={{ color: 'var(--muted)' }}>Author: {PRD_META.author}</span>
        </div>
        <h2 className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>{PRD_META.title}</h2>
        <div className="mt-1.5 text-[12px]" style={{ color: 'var(--muted)' }}>
          Target release: <b style={{ color: 'var(--text-dim)' }}>{PRD_META.release}</b> · Impact scope: <b style={{ color: 'var(--text-dim)' }}>{PRD_META.scope}</b>
        </div>
      </div>
      {PRD_SECTIONS.map((s) => (
        <div key={s.title}>
          <div className="mb-1.5 mt-4 text-[12.5px] font-semibold uppercase tracking-[.04em]" style={{ color: 'var(--ok)' }}>{s.title}</div>
          {s.body && <p className="text-[12.5px] leading-[1.6]" style={{ color: 'var(--text-dim)' }}>{s.body}</p>}
          {s.items && (
            <ul className="ml-4 mt-1 flex flex-col gap-1 text-[12.5px] leading-[1.55]" style={{ color: 'var(--muted)', listStyle: 'disc' }}>
              {s.items.map((it, i) => <li key={i}>{it}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
