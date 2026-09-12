/* Shared primitives for every preview in the Interaction Library — the framed
 * stage each pattern runs on, the Replay control for one-shot animations, and
 * the small mock chrome (avatar row, composer strip) previews compose from so
 * they read as a plausible slice of AAVA rather than an isolated widget. */
import { useState } from 'react'
import type { PatternMeta } from './data'

/* The preview stage — a lifted card with a faint dot-grid ground (the same
   texture the orchestration canvas uses), so it reads as "this is a demo
   surface" rather than another content card. `onReplay` bumps a key upstream
   to remount one-shot animations. */
export function PreviewBox({ children, onReplay, minHeight = 220 }: {
  children: React.ReactNode
  onReplay?: () => void
  minHeight?: number
}) {
  return (
    <div className="relative overflow-hidden rounded-[var(--r-lg)]"
      style={{
        background: 'var(--slab-raised)',
        border: '1px solid var(--glass-line)',
        backgroundImage: 'radial-gradient(var(--glass-line-soft) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}>
      <div className="flex items-center justify-center p-8" style={{ minHeight }}>
        {children}
      </div>
      {onReplay && (
        <button onClick={onReplay}
          className="press absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium"
          style={{ background: 'var(--slab)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 4v5h-5" />
          </svg>
          Replay
        </button>
      )}
    </div>
  )
}

/* Wraps a preview that needs to re-mount on Replay — a fresh `key` restarts
   every animation inside it from its initial state. */
export function Replayable({ render, minHeight }: { render: (key: number) => React.ReactNode; minHeight?: number }) {
  const [gen, setGen] = useState(0)
  return (
    <PreviewBox onReplay={() => setGen((g) => g + 1)} minHeight={minHeight}>
      {render(gen)}
    </PreviewBox>
  )
}

const PRINCIPLE_LABEL: Record<string, string> = {
  P1: 'Make the reasoning visible',
  P2: 'Keep run status in view',
  P3: 'Morph, don’t swap',
  P4: 'Answer in place',
  P5: 'Give each motion one meaning',
  P6: 'Motion is additive, never required',
  P7: 'Keep it quick and quiet',
}

export function PrincipleTag({ p }: { p: string }) {
  return (
    <span title={PRINCIPLE_LABEL[p]} className="mono rounded-full px-2 py-[3px] text-[10.5px] font-semibold"
      style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}>
      {p}
    </span>
  )
}

/* The block under the preview — source file + the real mechanism, in AAVA's
   own mono treatment, so this reads as documentation traced to code rather
   than a caption someone wrote once and forgot. */
export function ImplementationNote({ meta }: { meta: PatternMeta }) {
  return (
    <div className="mt-5 rounded-[var(--r-md)] p-4" style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[.14em]" style={{ color: 'var(--muted-deep)' }}>Implementation</span>
        <div className="ml-auto flex gap-1.5">
          {meta.principles.map((p) => <PrincipleTag key={p} p={p} />)}
        </div>
      </div>
      <div className="mono mb-2 text-[12px]" style={{ color: 'var(--brand)' }}>{meta.file}</div>
      <p className="text-[12.5px] leading-[1.6]" style={{ color: 'var(--text-dim)' }}>{meta.mechanism}</p>
    </div>
  )
}

/* A tiny AAVA avatar — the sparkle mark used beside agent messages throughout
   the app, reused here so mock message rows look like the real thing. */
export function AavaAvatar() {
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px]" style={{ background: 'var(--wash-3)' }}>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--brand)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
      </svg>
    </span>
  )
}

/* A minimal mock composer strip — enough chrome for previews that anchor to
   the composer (task progress, changes tray) to read as "this sits right
   above where you type," without pulling in the real Composer component. */
export function MockComposer() {
  return (
    <div className="flex items-center gap-2 rounded-[var(--r-md)] px-3.5 py-3" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
      <span className="text-[13px]" style={{ color: 'var(--muted-deep)' }}>Ask AAVA anything…</span>
      <span className="ml-auto grid h-7 w-7 place-items-center rounded-full" style={{ background: 'var(--brand)' }}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 19V5M5 12l7-7 7 7" /></svg>
      </span>
    </div>
  )
}
