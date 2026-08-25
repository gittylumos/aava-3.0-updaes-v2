import { useEffect, useRef, useState } from 'react'
import { T, prefersReducedMotion } from '../../state/timing'

/* Reveals text progressively, the way a model streams tokens.
 *
 * Text that appears fully formed is the single strongest "this is canned" tell,
 * stronger than any timing choice. Revealing by word (not character) matches how
 * tokens actually arrive and avoids the typewriter-toy feel.
 *
 * Streams once per line, ever — not once per mount. `stream` on the message
 * only says the line was new when it arrived, and nothing clears it, so without
 * this the whole transcript replays every time the thread is remounted: coming
 * back from the board, resuming a parked thread, reopening a task. */
const finished = new Set<string>()

export function StreamedText({ id, text, onTick, onDone }: {
  id: string
  text: string
  onTick?: () => void
  /** Fired once, when the last word lands. Drives the next line. */
  onDone?: () => void
}) {
  const words = useRef(text.split(' '))
  const [shown, setShown] = useState(() =>
    prefersReducedMotion() || finished.has(id) ? words.current.length : 0,
  )
  const done = shown >= words.current.length

  /* Held in a ref, and fired at most once: an inline `onDone` is a new function
     every parent render, so depending on it would restart the word timer — and
     would advance the caller's line counter again on every render after that. */
  const notify = useRef(onDone)
  notify.current = onDone
  const notified = useRef(false)

  useEffect(() => {
    if (done) {
      finished.add(id)
      if (!notified.current) { notified.current = true; notify.current?.() }
      return
    }
    // Per-word interval derived from the character rate, so long words take longer.
    const nextWord = words.current[shown] ?? ''
    const ms = Math.max(16, ((nextWord.length + 1) / T.streamCps) * 1000)
    const timer = window.setTimeout(() => {
      setShown((n) => n + 1)
      onTick?.()
    }, ms)
    return () => clearTimeout(timer)
  }, [shown, done, onTick, id])

  return (
    <>
      {words.current.slice(0, shown).join(' ')}
      {!done && (
        <span
          aria-hidden="true"
          className="ml-[2px] inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse"
          style={{ background: 'var(--muted)' }}
        />
      )}
    </>
  )
}
