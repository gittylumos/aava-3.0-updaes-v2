/* A pixel-grid loader for genuinely long-running work (drafting a document,
 * building a screen) — a 3×3 grid with a chevron wavefront driving across it,
 * paired with a shimmering label and a live elapsed timer in tabular mono
 * figures. Distinct from TypingDots (which says "composing, any second now")
 * and the tool-step spinner (says "this one call") — this says "this is going
 * to take a moment, and here's how long it's taken so far." */
import { useEffect, useState } from 'react'

/* Cell delays around the wavefront: row/col distance from the centre column
   sets when each cell lights, so the "chevron" sweeps left→right. */
const CHEVRON = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3), c = i % 3
  return (c + Math.abs(r - 1)) * 90
})
const DUR = 650

function LoaderGrid() {
  return (
    <span aria-hidden className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]">
      {CHEVRON.map((delay, i) => (
        <span key={i} className="size-[4px] rounded-[1px]" style={{
          background: 'var(--text)', opacity: 0.15,
          animation: `aava-pixel-on ${DUR}ms ease-in-out ${delay}ms infinite`,
        }} />
      ))}
      <style>{`@keyframes aava-pixel-on { 0%,100% { opacity: .15 } 50% { opacity: .9 } }
        @media (prefers-reduced-motion: reduce) { span { animation: none !important; opacity: .4 !important; } }`}</style>
    </span>
  )
}

function useElapsed() {
  const [ds, setDs] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setDs((d) => d + 1), 100)
    return () => clearInterval(t)
  }, [])
  const total = ds / 10
  return total < 60 ? `${total.toFixed(1)}s` : `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`
}

export function LoadingState({ label }: { label: string }) {
  const elapsed = useElapsed()
  return (
    <div role="status" className="flex w-fit items-center gap-2.5">
      <LoaderGrid />
      <span
        className="bg-clip-text text-[13px] font-medium text-transparent"
        style={{
          backgroundImage: 'linear-gradient(90deg, var(--muted-deep) 35%, var(--text) 50%, var(--muted-deep) 65%)',
          backgroundSize: '200% 100%',
          animation: 'aava-shimmer-text 1.4s linear infinite',
        }}
      >
        {label}
      </span>
      <span className="mono text-[12px] tabular-nums" style={{ color: 'var(--muted-deep)' }}>{elapsed}</span>
      <style>{`@keyframes aava-shimmer-text { to { background-position: -200% 0; } }`}</style>
    </div>
  )
}
