/* The Integrated Browser as an editor tab (web: the Preview tab). The running
   app is the same FeedbackApp the web preview renders, fed by the same
   template — so an edit in a code tab shows here. Reload re-mounts it. */
import { useState, type ReactNode } from 'react'
import type { useJourney } from '../../state/useJourney'
import type { Scenario } from '../../state/types'
import { hasPreview } from '../../state/workspace'
import { FeedbackApp, previewTemplate, readTemplate } from '../../components/playground/FeedbackApp'

export function BrowserTab({ j, scenario, url }: {
  j: ReturnType<typeof useJourney>
  scenario: Scenario
  url: string
}) {
  const [nonce, setNonce] = useState(0)
  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: 'var(--slab)' }}>
      <div className="flex h-8 shrink-0 items-center gap-0.5 px-1.5"
        style={{ borderBottom: '1px solid var(--glass-line-soft)', background: 'var(--wash-1)' }}>
        <NavBtn label="Back" disabled><path d="M15 6l-6 6 6 6" /></NavBtn>
        <NavBtn label="Forward" disabled><path d="M9 6l6 6-6 6" /></NavBtn>
        <NavBtn label="Reload" onClick={() => setNonce((n) => n + 1)}>
          <path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" />
        </NavBtn>
        <input readOnly value={url} aria-label="Address"
          className="mono ml-1 h-[22px] min-w-0 flex-1 rounded-[3px] px-2 text-[11.5px] outline-none"
          style={{ color: 'var(--text-dim)', background: 'var(--slab)', border: '1px solid var(--glass-line)' }} />
      </div>
      <div key={nonce} className="min-h-0 flex-1 overflow-auto">
        {hasPreview(scenario) ? (
          <div className="mx-auto max-w-[520px] py-4">
            <FeedbackApp template={readTemplate(previewTemplate(scenario, j.state.playground))} onToast={j.toast} />
          </div>
        ) : (
          <p className="px-4 py-6 text-[12px]" style={{ color: 'var(--muted)' }}>
            This site can’t be reached — nothing is serving on localhost:4200.
          </p>
        )}
      </div>
    </div>
  )
}

function NavBtn({ label, disabled, onClick, children }: {
  label: string; disabled?: boolean; onClick?: () => void; children: ReactNode
}) {
  return (
    <button aria-label={label} title={label} disabled={disabled} onClick={onClick}
      className="grid h-6 w-6 place-items-center rounded-[3px] transition-colors enabled:hover:bg-[var(--wash-3)] disabled:opacity-40"
      style={{ color: 'var(--muted)' }}>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>
    </button>
  )
}
