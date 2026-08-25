import { motion } from 'motion/react'
import type { Task } from '../../state/types'
import { TAG_META } from '../../state/reducer'
import { AuroraRing } from './AuroraRing'

export function TaskCard({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const tag = TAG_META[task.tag]

  const body = (
    /* No layoutId. It had no partner to morph into — the start view is swapped
       out wholesale when a task opens — so all it did was turn every reflow into
       a layout animation, which is why collapsing the nav sent the cards swinging
       80px the wrong way before they settled. */
    <motion.button
      onClick={() => onOpen(task.id)}
      className="press group flex h-full w-full flex-col rounded-[var(--r-lg)] px-5 pb-[18px] pt-[18px] text-left backdrop-blur-[20px] hover:bg-[var(--card-hover)]"
      style={{ background: 'var(--card)', border: '1px solid var(--glass-line)', minHeight: 152 }}
    >
      <h2 className="text-[15px] font-semibold leading-[1.35] tracking-[-.014em] text-pretty">{task.title}</h2>

      {/* Two lines, doing two different jobs.
          One: the state, as a tag — scannable across three cards without reading.
          Two: what AAVA actually noticed. Specific, under ten words, and the
          reason the tag is what it is. A label alone tells you nothing you
          could not guess; the observation is where the intelligence shows. */}
      <div className="mt-auto grid gap-2 pt-5">
        <span
          className="inline-flex w-fit items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-[11px] font-semibold leading-none"
          style={{ background: tag.bg, color: tag.fg }}
        >
          <span className="h-[5px] w-[5px] rounded-full" style={{ background: 'currentColor' }} />
          {tag.label}
        </span>
        <span className="text-[12px] leading-[1.45] text-pretty" style={{ color: 'var(--muted)' }}>
          {task.note}
        </span>
      </div>
    </motion.button>
  )

  return task.recommended ? <AuroraRing>{body}</AuroraRing> : body
}
