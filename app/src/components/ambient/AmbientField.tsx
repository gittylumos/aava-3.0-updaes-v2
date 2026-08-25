import { useEffect, useRef } from 'react'

/** Three drifting aurora lobes behind everything. Pointer parallax, reduced-motion aware. */
export function AmbientField() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      const x = e.clientX / window.innerWidth - 0.5
      const y = e.clientY / window.innerHeight - 0.5
      frame = requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.setProperty('--px', `${x * 26}px`)
          ref.current.style.setProperty('--py', `${y * 26}px`)
        }
        frame = 0
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        translate: 'var(--px, 0px) var(--py, 0px)',
        transition: 'translate 600ms var(--ease)',
        /* Toned well down for the token spec's 80/20 rule: the canvas must read
           as neutral, with brand and semantic colour carrying the other 20%.
           The lobe alphas come from tokens because a glow that lifts a dark
           canvas only muddies a white one — light mode dials them right back. */
        background: `
          radial-gradient(56% 44% at 12% 6%, rgba(99,102,241,var(--lobe-1)), transparent 64%),
          radial-gradient(50% 46% at 96% 78%, rgba(167,139,250,var(--lobe-2)), transparent 62%),
          radial-gradient(36% 32% at 54% 110%, rgba(255,122,198,var(--lobe-3)), transparent 66%)
        `,
      }}
    />
  )
}
