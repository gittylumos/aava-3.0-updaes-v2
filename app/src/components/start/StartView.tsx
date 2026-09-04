import { motion } from 'motion/react'
import type { Task } from '../../state/types'
import { Hero } from './Hero'
import { TaskCard } from './TaskCard'
import { fadeUp } from '../../design/motion'

interface Props {
  name: string
  tasks: Task[]
  /** The line under the greeting — computed by the caller so it can fit the
      profile (a reviewer's board vs a PM's blank slate). */
  subtitle: string
  onOpenTask: (id: string) => void
  onViewAllTasks: () => void
  composer: React.ReactNode
}

export function StartView({ name, tasks, subtitle, onOpenTask, onViewAllTasks, composer }: Props) {
  /* No tasks, no board — the home collapses to a greeting and the prompt bar,
     centred. This is the product manager's opening screen: he starts by asking,
     not by reviewing a queue. The board reappears the moment something he
     started is waiting on him (a PRD parked at a gate shows as a card). */
  const hasBoard = tasks.length > 0

  return (
    <motion.div
      {...fadeUp(8)}
      className="mx-auto flex min-h-full w-full max-w-[1080px] flex-col justify-center px-8 pb-10 sm:px-10"
    >
      <Hero name={name} centered={!hasBoard} subtitle={subtitle} />

      {hasBoard && (
        <>
          {/* The full board lives one click away, next to the three it's
              surfacing — not behind an icon in the chrome. */}
          <div className="mb-3 flex justify-end">
            <button
              onClick={onViewAllTasks}
              className="press group flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[12.5px] hover:bg-[var(--glass)]"
              style={{ color: 'var(--muted)' }}
            >
              View all my tasks
              <svg
                viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
                strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                className="transition-transform duration-150 group-hover:translate-x-[2px]"
              >
                <path d="m9.5 5 6.5 7-6.5 7" />
              </svg>
            </button>
          </div>

          {/* Content-driven reflow rather than a device breakpoint: the cards
              collapse 3 → 2 → 1 as their own minimum width stops fitting, so
              there's a graceful two-up stage instead of jumping straight to one.
              auto-FILL (not auto-fit) keeps the empty column tracks, so a board
              with a single card (Raman's PRD-to-Stories) sits at one card's width
              like Deepak's rather than stretching to fill the whole row. */}
          <div className="grid items-stretch gap-5 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {tasks.slice(0, 3).map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} />)}
          </div>
        </>
      )}

      {/* On the minimal home the composer sits right under the greeting;
          otherwise it lines up with the outer edges of the card grid. */}
      <div className={hasBoard ? 'mt-14' : 'mt-4'}>{composer}</div>
    </motion.div>
  )
}
