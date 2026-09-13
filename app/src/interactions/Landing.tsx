/* The library's front door. Before the rail-and-preview catalogue, a single
 * page that says what this collection is for and why it exists — the design
 * philosophy, the four families of pattern — with one way in: View Library. */
import { motion } from 'motion/react'

const SPARKLE = <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />

interface Item { title: string; body: string; icon: React.ReactNode }
const svg = { viewBox: '0 0 24 24', width: 17, height: 17, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

const FOUNDATIONS: Item[] = [
  { title: 'Predictable Autonomy', body: 'Balance fluid AI responses with deterministic visual feedback and explicit user control.',
    icon: <svg {...svg}><path d="M12 3a9 9 0 1 0 9 9" /><path d="M12 7v5l3 2" /></svg> },
  { title: 'Systemic Coherence', body: 'Move from isolated script writing to scalable structural patterns, state flows, and error recovery.',
    icon: <svg {...svg}><rect x="3" y="3" width="7" height="7" rx="1.6" /><rect x="14" y="3" width="7" height="7" rx="1.6" /><rect x="3" y="14" width="7" height="7" rx="1.6" /><rect x="14" y="14" width="7" height="7" rx="1.6" /></svg> },
  { title: 'Transparent Trust', body: 'Expose intent, data sources, actions, and confirmations before executing system-level changes.',
    icon: <svg {...svg}><path d="M12 3l7 3v5c0 4.5-3 7.6-7 8.9C8 17.6 5 14.5 5 10V6z" /><path d="m9.5 12 1.8 1.8L15 10" /></svg> },
]

const PATTERNS: Item[] = [
  { title: 'Invocation & Input', body: 'Triggering mechanisms, contextual prompts, and multi-modal input constraints.',
    icon: <svg {...svg}><path d="M12 19V5M5 12l7-7 7 7" /></svg> },
  { title: 'State Signals', body: 'Micro-motion and visual cues for thinking, listening, composing, planning, connecting, solving, and working.',
    icon: <svg {...svg}><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></svg> },
  { title: 'Action & Verification', body: 'Pre-execution previews, high-stakes confirmation modals, and inline undo controls.',
    icon: <svg {...svg}><path d="m5 12 4 4L19 7" /></svg> },
  { title: 'Error & Recovery', body: 'Graceful degradation, ambiguous query clarification, and path reassignment.',
    icon: <svg {...svg}><path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" /></svg> },
]

function Card({ item, tint }: { item: Item; tint: string }) {
  return (
    <div className="rounded-[var(--r-md)] p-4 transition-colors hover:border-[var(--glass-line)]"
      style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
      <span className="grid h-8 w-8 place-items-center rounded-[9px]" style={{ background: `color-mix(in srgb, ${tint} 14%, transparent)`, color: tint }}>{item.icon}</span>
      <div className="mt-3 text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>{item.title}</div>
      <p className="mt-1 text-[12.5px] leading-[1.6]" style={{ color: 'var(--muted)' }}>{item.body}</p>
    </div>
  )
}

export function InteractionLanding({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="h-screen w-full overflow-y-auto" style={{ background: 'var(--ground)' }}>
      {/* Soft brand wash behind the hero. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px]" aria-hidden
        style={{ background: 'radial-gradient(60% 100% at 50% 0%, color-mix(in srgb, var(--brand) 12%, transparent), transparent 70%)' }} />

      <div className="relative mx-auto max-w-[880px] px-6 py-14 md:px-10 md:py-20">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
          {/* Brand + eyebrow */}
          <div className="mb-8 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-[8px]" style={{ background: 'var(--wash-3)' }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{SPARKLE}</svg>
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[.14em]" style={{ color: 'var(--muted)' }}>AAVA · Interaction Library</span>
          </div>

          {/* Hero */}
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-[.16em]" style={{ color: 'var(--brand)' }}>AAVA 3.0</div>
          <h1 className="max-w-[16ch] text-[38px] font-bold leading-[1.08] tracking-[-.02em] md:text-[46px]" style={{ color: 'var(--text)' }}>
            Interaction Pattern Library
          </h1>
          <p className="mt-4 max-w-[42ch] text-[17px] leading-[1.4]" style={{ color: 'var(--text-dim)' }}>
            Let AI speak naturally. Let the system behave predictably.
          </p>
          <p className="mt-5 max-w-[62ch] text-[14px] leading-[1.7]" style={{ color: 'var(--muted)' }}>
            Designing conversational experiences isn't about scripting every word — it's about building a dependable
            framework where intent, permissions, actions, and outcomes are explicit. This library translates recurring
            generative interactions into reusable patterns that keep AAVA 3.0 coherent, intuitive, and trustworthy.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <button type="button" onClick={onEnter}
              className="press inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-[filter,transform] hover:brightness-90 active:scale-[0.98]"
              style={{ background: 'var(--text)', color: 'var(--on-text)' }}>
              View Library
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <span className="text-[12px]" style={{ color: 'var(--muted-deep)' }}>{FOUNDATIONS.length + PATTERNS.length} foundations & families · 20+ live patterns</span>
          </div>
        </motion.div>

        {/* Design Foundations */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }} className="mt-16">
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="text-[15px] font-semibold tracking-[-.01em]" style={{ color: 'var(--text)' }}>Design Foundations</h2>
            <span className="h-px flex-1" style={{ background: 'var(--glass-line-soft)' }} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {FOUNDATIONS.map((f) => <Card key={f.title} item={f} tint="var(--brand)" />)}
          </div>
        </motion.section>

        {/* Pattern Index */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14, ease: [0.16, 1, 0.3, 1] }} className="mt-12">
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="text-[15px] font-semibold tracking-[-.01em]" style={{ color: 'var(--text)' }}>Pattern Index</h2>
            <span className="h-px flex-1" style={{ background: 'var(--glass-line-soft)' }} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {PATTERNS.map((p) => <Card key={p.title} item={p} tint="var(--zone-canvas-accent)" />)}
          </div>
        </motion.section>

        <div className="mt-14 flex items-center justify-between border-t pt-6" style={{ borderColor: 'var(--glass-line-soft)' }}>
          <span className="text-[12px]" style={{ color: 'var(--muted-deep)' }}>A showcase of the design system, built in AAVA's own tokens.</span>
          <button type="button" onClick={onEnter} className="press inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--brand)' }}>
            View Library
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
