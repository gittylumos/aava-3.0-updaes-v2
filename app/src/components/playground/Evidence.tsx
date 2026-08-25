import { useEffect, useRef, useState } from 'react'
import type { Scenario } from '../../state/types'

const FigmaFrame = () => (
  <svg viewBox="0 0 520 300" className="w-full max-w-[380px] cursor-zoom-in rounded-[var(--r-sm)]" role="img"
    aria-label="Feedback Form v3 design frame">
    <rect width="520" height="300" fill="#0B0D12" />
    <rect x="130" y="24" width="260" height="252" rx="10" fill="#15181F" stroke="rgba(255,255,255,.10)" />
    <rect x="150" y="46" width="112" height="12" rx="3" fill="rgba(255,255,255,.75)" />
    <rect x="150" y="66" width="168" height="7" rx="3" fill="rgba(255,255,255,.22)" />
    {[150, 182, 214, 246, 278].map((x, i) => (
      <rect key={x} x={x} y="108" width="26" height="26" rx="6"
        fill={i === 2 ? 'var(--aurora-2)' : 'none'} stroke={i === 2 ? 'none' : 'rgba(255,255,255,.22)'} />
    ))}
    <rect x="150" y="166" width="220" height="58" rx="7" fill="none" stroke="rgba(255,255,255,.22)" />
    <rect x="150" y="244" width="86" height="26" rx="7" fill="rgba(255,255,255,.85)" />
    <text x="24" y="34" fill="#6B7280" fontFamily="monospace" fontSize="11">Feedback Form v3</text>
  </svg>
)

export function Evidence({ scenario, focused }: { scenario: Scenario; focused: string | null }) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!focused) return
    refs.current[focused]?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center',
    })
  }, [focused])

  return (
    <>
      {scenario.prep.map((step) => {
        const block = scenario.evidence[step.key]
        const isFocus = focused === step.key
        return (
          <div key={step.key} ref={(el) => { refs.current[step.key] = el }}
            className="mb-2.5 rounded-[var(--r-md)] p-4 transition-colors"
            style={{
              background: 'var(--slab)',
              border: `1px solid ${isFocus ? 'rgba(167,139,250,.5)' : 'var(--glass-line-soft)'}`,
            }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[12.5px] font-semibold tracking-[-.005em]">{block.name}</span>
              <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-[.13em]"
                style={{ color: 'var(--muted-deep)' }}>{block.source}</span>
            </div>

            {block.body.kind === 'kv' && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-[11.5px]">
                {/* Keyed by index, not label — the "Injected the feedback form"
                    block legitimately has two rows both labelled "Added". */}
                {block.body.pairs.map(([k, v], i) => (
                  <div key={`${k}-${i}`} className="contents">
                    <dt style={{ color: 'var(--muted-deep)' }}>{k}</dt>
                    <dd className="mono m-0" style={{ color: 'var(--text-dim)' }}>{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {block.body.kind === 'text' && (
              <p className="text-[12px]" style={{ color: 'var(--muted)' }}>{block.body.text}</p>
            )}

            {block.body.kind === 'columns' && (
              <>
                <p className="mb-2 text-[12px]" style={{ color: 'var(--muted)' }}>{block.body.lead}</p>
                <div className="grid grid-cols-2 gap-3 text-[11.5px]">
                  <div>
                    <h5 className="mb-1 text-[9.5px] uppercase tracking-[.13em]" style={{ color: 'var(--ok)' }}>Found</h5>
                    <ul className="mono grid gap-0.5" style={{ color: 'var(--text-dim)' }}>
                      {block.body.found.map((c) => <li key={c}>{c}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h5 className="mb-1 text-[9.5px] uppercase tracking-[.13em]" style={{ color: 'var(--warn)' }}>Missing</h5>
                    <ul className="mono grid gap-0.5" style={{ color: 'var(--text-dim)' }}>
                      {block.body.missing.map((c) => <li key={c}>{c}</li>)}
                    </ul>
                  </div>
                </div>
              </>
            )}

            {block.body.kind === 'figma' && (
              <div onClick={() => setLightbox(true)}>
                <FigmaFrame />
                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--muted-deep)' }}>{block.body.caption}</p>
              </div>
            )}
          </div>
        )
      })}

      {lightbox && (
        <div onClick={() => setLightbox(false)}
          className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center p-16"
          style={{ background: 'var(--scrim)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-[860px]"><FigmaFrame /></div>
        </div>
      )}
    </>
  )
}
