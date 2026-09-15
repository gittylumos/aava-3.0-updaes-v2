/* The notification bell glyph — swings on a new arrival (impulse-driven, real
 * spring physics, not a fixed keyframe loop) and carries a real count badge
 * instead of a bare dot, popping in when the count changes. Trimmed from a
 * fuller reference (which also rolls each digit through its own odometer
 * column): at the 34px this sits in, a scale/fade badge reads exactly as
 * clearly as a full column-mask roll would, for a fraction of the code.
 *
 * The real unread count barely changes within one sitting — nothing in this
 * scripted prototype invents new tasks on its own — so left alone the swing
 * (which only fires on an *increase*) would never actually play. `useDemoBump`
 * adds a slow, capped drip of simulated arrivals on top of the real count so
 * the ring physics reads as alive in a demo, the way the reference bell is
 * meant to be seen, without inventing fake unread *tasks*. */
import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform, useVelocity,
  type AnimationPlaybackControls,
} from 'motion/react'

const SWING_SPRING = { type: 'spring' as const, stiffness: 220, damping: 10, mass: 1, restDelta: 0.01 }
const CLAPPER_SPRING = { stiffness: 300, damping: 14, mass: 1 }
const IMPULSE = 34 // degrees/second of angular velocity injected per new notification
const MAX_VELOCITY = 60
const CLAPPER_SWEEP = 9
const CLAPPER_VELOCITY = 30
const DEMO_BUMP_MS = 120_000 // a simulated arrival roughly every 2 minutes
const DEMO_BUMP_MAX = 4 // stop drip-feeding after a few — a long-idle tab shouldn't run the count away

function useDemoBump(reduced: boolean) {
  const [bump, setBump] = useState(0)
  useEffect(() => {
    if (reduced) return
    const t = window.setInterval(() => {
      setBump((b) => (b >= DEMO_BUMP_MAX ? b : b + 1))
    }, DEMO_BUMP_MS)
    return () => window.clearInterval(t)
  }, [reduced])
  return bump
}

const clamp = (v: number, limit: number) => Math.max(-limit, Math.min(limit, v))

function useBellRing(count: number, reduced: boolean) {
  const swing = useMotionValue(0)
  const swingVelocity = useVelocity(swing)
  const clapperLag = useTransform(swingVelocity, [-CLAPPER_VELOCITY, 0, CLAPPER_VELOCITY], [CLAPPER_SWEEP, 0, -CLAPPER_SWEEP], { clamp: true })
  const clapper = useSpring(clapperLag, CLAPPER_SPRING)
  const previous = useRef(count)
  const ringing = useRef<AnimationPlaybackControls | null>(null)

  useEffect(() => {
    const delta = count - previous.current
    previous.current = count
    if (delta <= 0 || reduced) return
    const moving = swing.getVelocity()
    const along = moving > 1 ? 1 : -1
    ringing.current = animate(swing, 0, { ...SWING_SPRING, velocity: clamp(moving + along * IMPULSE, MAX_VELOCITY) })
  }, [count, reduced, swing])

  useEffect(() => () => ringing.current?.stop(), [])
  return { swing, clapper }
}

export function NotificationBell({ size = 17, count = 0 }: { size?: number; count?: number }) {
  const reduced = useReducedMotion() ?? false
  const real = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
  const total = real + useDemoBump(reduced)
  const { swing, clapper } = useBellRing(total, reduced)

  return (
    <span className="relative inline-grid place-items-center">
      <motion.svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden
        style={{ rotate: swing, transformOrigin: '50% 14%' }}>
        <path fillOpacity={0.55} d="M18 15.25V10.5a6 6 0 0 0-12 0v4.75L4.5 17.5h15Z" />
        <motion.path style={{ rotate: clapper, transformBox: 'fill-box', transformOrigin: '50% 0%' }} d="M10 20.25a2.15 2.15 0 0 0 4 0h-4Z" />
      </motion.svg>
      <AnimatePresence initial={false}>
        {total > 0 && (
          <motion.span
            key={total > 9 ? '9+' : total}
            aria-hidden="true"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            transition={reduced ? { duration: 0.12 } : { type: 'spring', stiffness: 600, damping: 20 }}
            className="mono absolute -right-[6px] -top-[5px] grid h-[14px] min-w-[14px] place-items-center rounded-full px-[3px] text-[8.5px] font-bold leading-none"
            style={{ background: 'var(--danger)', color: 'var(--on-text)', boxShadow: '0 0 0 1.5px var(--ground)' }}
          >
            {total > 9 ? '9+' : total}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
