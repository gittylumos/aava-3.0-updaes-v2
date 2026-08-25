/* Shared motion defaults — every Motion surface should use these so reduced-motion
   and enter/exit timing stay consistent without per-file magic numbers. */
import { prefersReducedMotion } from '../state/timing'

export const easeOut = [0.16, 1, 0.3, 1] as const

export function fadeUp(y = 8) {
  if (prefersReducedMotion()) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.01 },
    }
  }
  return {
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: Math.round(y * 0.6) },
    transition: { duration: 0.22, ease: easeOut },
  }
}

export function slideIn(x = 28) {
  if (prefersReducedMotion()) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.01 },
    }
  }
  return {
    initial: { opacity: 0, x },
    animate: { opacity: 1, x: 0 },
    transition: { type: 'spring' as const, stiffness: 260, damping: 30 },
  }
}

export function stagger(i: number) {
  if (prefersReducedMotion()) return { delay: 0 }
  return { delay: i * 0.04 }
}
