/* The report-asset viewer (Example 4).
 *
 * Same dashboard visuals as InsightCanvas, but the toolbar is a Deepak-canvas
 * tab strip: each generated asset (an .html analysis report, a .pdf impact /
 * recommendations report) opens as a named-file tab, with a trailing "+".
 * The .html tab renders the reused analytics dashboards under browser chrome;
 * the .pdf tabs render a report-styled document. */
import { WatchBar } from '../zones/WatchBar'
import type { ActiveObject, WatchEntry } from '../state/types'
import { FunnelView, FeedbackView, AuditView, ImpactView } from './InsightCanvas'
import {
  type ReportView, REPORT_ASSETS, REPORT_ORDER,
  REPORT_META, REPORT_SECTIONS, REPORT_IMPACT_SECTION, type ReportSection,
} from './report'

interface Props {
  object: ActiveObject
  /** Which assets have been generated (their tabs are open). */
  tabs: ReportView[]
  watch: WatchEntry[]
  onCollapse: () => void
  onSelectReport: (view: ReportView) => void
  onToast: (text: string) => void
}

export function ReportCanvas({ object, tabs, watch, onCollapse, onSelectReport, onToast }: Props) {
  const openTabs = REPORT_ORDER.filter((v) => tabs.includes(v))
  const active: ReportView = object.activeReport && openTabs.includes(object.activeReport)
    ? object.activeReport
    : openTabs[openTabs.length - 1] ?? 'analysis'
  const asset = REPORT_ASSETS[active]

  return (
    <section aria-label="Canvas — report" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="relative m-[12px] mb-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[var(--r-md)]"
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)', borderBottom: 'none' }}>

        {/* Tab strip — named-file tabs + a trailing "+", Deepak-canvas style. */}
        <div className="relative flex items-center gap-1.5 px-2 py-1.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          <div role="tablist" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {openTabs.map((v) => {
              const isActive = v === active
              return (
                <button key={v} role="tab" aria-selected={isActive} onClick={() => onSelectReport(v)}
                  className="press group flex shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11.5px] font-medium"
                  style={isActive
                    ? { background: 'var(--wash-3)', color: 'var(--text)', boxShadow: 'inset 0 0 0 1px var(--glass-line-soft)' }
                    : { color: 'var(--muted)' }}>
                  <FileGlyph kind={REPORT_ASSETS[v].kind} />
                  <span className="max-w-[180px] truncate">{REPORT_ASSETS[v].file}</span>
                  <span aria-hidden className="grid h-4 w-4 place-items-center rounded-[4px] opacity-0 transition-opacity group-hover:opacity-60" style={{ color: 'var(--muted)' }}>
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                  </span>
                </button>
              )
            })}
            <button aria-label="New tab" title="New tab" className="icon-btn shrink-0" onClick={() => onToast('AAVA opens asset tabs as it produces them')}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1 rounded-[11px] p-[3px]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
            <button onClick={() => onToast('Share link copied')} aria-label="Share" title="Share" className="icon-btn">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" /></svg>
            </button>
            <span className="mx-0.5 h-4 w-px" style={{ background: 'var(--glass-line-soft)' }} aria-hidden />
            <button onClick={onCollapse} aria-label="Close" title="Close" className="icon-btn">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </div>

        {/* Asset body. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {asset.kind === 'html'
            ? <HtmlAsset file={asset.file} />
            : <PdfAsset file={asset.file} view={active} />}
        </div>
      </div>

      <div className="mx-[12px] mb-[12px] overflow-hidden rounded-b-[var(--r-md)]" style={{ border: '1px solid var(--glass-line-soft)', borderTop: 'none' }}>
        <WatchBar entries={watch} />
      </div>
    </section>
  )
}

function FileGlyph({ kind }: { kind: 'html' | 'pdf' }) {
  const c = kind === 'pdf' ? 'var(--danger)' : 'var(--zone-canvas-accent)'
  return (
    <span className="grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[3px] text-[7px] font-bold uppercase" style={{ background: c, color: '#fff' }}>
      {kind === 'pdf' ? 'P' : '<>'}
    </span>
  )
}

/* The .html analysis report — browser chrome, then the reused dashboards. */
function HtmlAsset({ file }: { file: string }) {
  return (
    <div className="p-3">
      <div className="mb-3 flex items-center gap-2 rounded-[8px] px-3 py-2" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--danger)' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--warn)' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--ok)' }} />
        </span>
        <span className="mono truncate text-[11.5px]" style={{ color: 'var(--muted)' }}>{file}</span>
        <a href="https://analytics.google.com" target="_blank" rel="noreferrer"
          className="press ml-auto flex shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[11px] font-medium"
          style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)', color: 'var(--zone-canvas-accent)' }}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>
          Google Analytics
        </a>
      </div>
      <div className="px-1">
        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Analysis insights — Checkout post-v3.4</h3>
        <p className="mb-3.5 mt-1 text-[12px]" style={{ color: 'var(--muted)' }}>Web analytics correlated with customer feedback</p>
        <div className="flex flex-col gap-5">
          <FunnelView />
          <FeedbackView />
          <AuditView />
        </div>
      </div>
    </div>
  )
}

/* The .pdf reports — a document-styled page. The impact PDF also leads with the
   impact dashboard; both carry the written report sections. */
function PdfAsset({ file, view }: { file: string; view: ReportView }) {
  const sections: ReportSection[] = view === 'impact'
    ? [...REPORT_SECTIONS.slice(0, 2), REPORT_IMPACT_SECTION, ...REPORT_SECTIONS.slice(2)]
    : REPORT_SECTIONS
  return (
    <div className="mx-auto max-w-[760px] p-4">
      <div className="rounded-[var(--r-md)] p-6" style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
        <div className="mb-4 flex items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--glass-line-soft)' }}>
          <div className="min-w-0">
            <div className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>{file}</div>
            <h2 className="mt-1 text-[17px] font-semibold" style={{ color: 'var(--text)' }}>{REPORT_META.title}</h2>
            <p className="mt-1 text-[12px]" style={{ color: 'var(--muted)' }}>{REPORT_META.subtitle}</p>
          </div>
          <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'color-mix(in srgb, var(--warn) 18%, transparent)', color: 'var(--warn)' }}>{REPORT_META.severity}</span>
        </div>
        {view === 'impact' && <div className="mb-4"><ImpactView /></div>}
        {sections.map((s) => (
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
    </div>
  )
}
