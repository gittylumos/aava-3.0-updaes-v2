/* Inline source citations — a claim that carries its receipts. This preview
 * plays on a loop (video-like) so a visitor sees the pattern without hovering:
 * an AAVA message ends with three source pills — a Jira ticket, a Figma frame,
 * a GitHub PR — and the preview card below cycles through each in turn, the
 * active pill lifting in sync, an Open control on every one. Hovering pauses
 * the loop and lets you page by hand; the real component (CitationPills in
 * src/components/chat/InlineSource.tsx) is hover-driven and portaled — this is
 * its always-open, self-contained twin, tuned to read as a demo reel. */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AavaAvatar, PreviewBox } from '../shared'
import { SOURCE_META, type InlineSourceRef } from '../../components/chat/InlineSource'

const SOURCES: InlineSourceRef[] = [
  { kind: 'jira', label: 'MOB-2841', title: 'Add a feedback form to the mobile app',
    meta: 'Jira · Mobile Platform',
    description: 'A 1–5 rating and an optional comment, posted to the feedback endpoint — the acceptance criteria the build was matched against.',
    date: 'Opened Sep 8, 2026' },
  { kind: 'figma', label: 'Feedback Form v3', title: 'Feedback Form v3',
    meta: 'Figma · Mobile Components',
    description: 'The approved frame in the Mobile Components file — six components matched against it, four reused from the PLAY library.',
    date: 'Updated Sep 9, 2026' },
  { kind: 'github', label: 'PR #2841', title: 'feat: feedback form screen',
    meta: 'GitHub · aava/mobile',
    description: 'Seven files, +214 −0. Wires the screen to POST /api/v1/feedback and registers the route. Checks green.',
    date: 'Opened Sep 11, 2026' },
]
const CYCLE_MS = 2600

function CitationsDemo({ gen }: { gen: number }) {
  const [at, setAt] = useState(0)
  const [paused, setPaused] = useState(false)

  // Restart the reel on Replay.
  useEffect(() => { setAt(0) }, [gen])
  useEffect(() => {
    if (paused) return
    const t = window.setInterval(() => setAt((n) => (n + 1) % SOURCES.length), CYCLE_MS)
    return () => window.clearInterval(t)
  }, [paused, gen])

  const active = SOURCES[at]
  const activeMeta = SOURCE_META[active.kind]

  return (
    <div className="w-full max-w-[440px]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* The message the citations trail. */}
      <div className="flex gap-2.5">
        <AavaAvatar />
        <p className="pt-0.5 text-[13.5px] leading-[1.6]" style={{ color: 'var(--text-dim)' }}>
          MOB-2841 matched the Feedback Form v3 frame cleanly, and the screen shipped in a single PR.
          <span className="ml-1.5 inline-flex flex-wrap items-center gap-1.5 align-middle">
            {SOURCES.map((s, i) => {
              const meta = SOURCE_META[s.kind]
              const on = i === at
              return (
                <button key={i} type="button" onMouseEnter={() => setAt(i)}
                  className="press inline-flex h-[24px] shrink-0 items-center gap-1.5 rounded-full py-[3px] pl-[3px] pr-2.5 align-middle text-[12px] font-medium transition-colors"
                  style={{
                    background: on ? 'var(--wash-5)' : 'var(--wash-3)',
                    border: `1px solid ${on ? 'var(--glass-line)' : 'var(--glass-line-soft)'}`,
                    color: on ? 'var(--text)' : 'var(--text-dim)',
                  }}>
                  <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full" style={{ background: 'var(--wash-4)' }}>
                    <meta.Logo size={10} />
                  </span>
                  {meta.name}
                </button>
              )
            })}
          </span>
        </p>
      </div>

      {/* The preview card — one source at a time, crossfading as the reel turns. */}
      <div className="relative mt-3 ml-[38px] h-[150px]">
        <AnimatePresence mode="wait">
          <motion.div key={at}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 top-0 overflow-hidden rounded-[12px] shadow-xl"
            style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
            <div className="flex items-center gap-2 px-2.5 pb-1 pt-2.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px]" style={{ background: 'var(--wash-3)' }}>
                <activeMeta.Logo size={13} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-[.06em]" style={{ color: activeMeta.tint }}>{activeMeta.name}</span>
              <span className="flex items-center gap-1">
                {SOURCES.map((_, i) => (
                  <span key={i} className="h-[5px] rounded-full transition-all duration-300"
                    style={{ width: i === at ? 14 : 5, background: i === at ? 'var(--text-dim)' : 'var(--wash-5)' }} />
                ))}
              </span>
            </div>
            <div className="px-2.5 pb-2 pt-1">
              <div className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--text)' }}>{active.title}</div>
              <div className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>{active.description}</div>
              <div className="mt-1.5 text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{active.date}</div>
            </div>
            <button type="button"
              className="press flex w-full items-center gap-1.5 px-2.5 py-2 text-left text-[11.5px] font-medium transition-colors hover:bg-[var(--wash-3)]"
              style={{ borderTop: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>
              Open in {activeMeta.name}
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export function InlineCitationsPreview() {
  const [gen, setGen] = useState(0)
  return (
    <PreviewBox onReplay={() => setGen((g) => g + 1)} minHeight={280}>
      <CitationsDemo gen={gen} />
    </PreviewBox>
  )
}
