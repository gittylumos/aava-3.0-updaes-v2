/* The report assets (Example 4) as workspace tabs.
 *
 * Each generated asset opens as its own tab, named by its file — an .html
 * analysis report and two .pdf reports. The .html renders the reused analytics
 * dashboards under the browser mini-header; a .pdf renders a report-styled
 * page under the file mini-header, whose only action is Download. */
import { BrowserMiniHeader, FileMiniHeader, MiniHeaderBtn } from '../components/playground/MiniHeader'
import { FunnelView, FeedbackView, ImpactView } from './InsightCanvas'
import {
  type ReportView, REPORT_ASSETS,
  REPORT_META, REPORT_SECTIONS, REPORT_IMPACT_SECTION, type ReportSection,
} from './report'

export function ReportBody({ view, onToast }: { view: ReportView; onToast: (text: string) => void }) {
  const asset = REPORT_ASSETS[view]
  if (asset.kind === 'html') {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <BrowserMiniHeader url={`reports/${asset.file}`} />
        <div className="min-h-0 flex-1 overflow-y-auto"><HtmlAsset /></div>
      </div>
    )
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <FileMiniHeader right={
        <MiniHeaderBtn label="Download" onClick={() => onToast(`Downloaded ${asset.file}`)}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 4v11M8 11l4 4 4-4M5 20h14" /></svg>
        </MiniHeaderBtn>
      } />
      <div className="min-h-0 flex-1 overflow-y-auto"><PdfAsset file={asset.file} view={view} /></div>
    </div>
  )
}

/* The .html analysis report — the reused dashboards, sourced from Analytics. */
function HtmlAsset() {
  return (
    <div className="p-4">
      <header className="mb-3.5 flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--glass-line-soft)' }}>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Analysis insights — Checkout post-v3.4</h3>
          <p className="mt-1 text-[12px]" style={{ color: 'var(--muted)' }}>Web analytics correlated with customer feedback</p>
        </div>
        <a href="https://analytics.google.com" target="_blank" rel="noreferrer"
          className="press flex shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[11.5px] font-medium"
          style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--zone-canvas-accent)' }}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>
          Google Analytics
        </a>
      </header>
      <div className="flex flex-col gap-5">
        <FunnelView />
        <FeedbackView interactive />
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
