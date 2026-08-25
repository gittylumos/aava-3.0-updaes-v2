import { motion } from 'motion/react'
import type { Task } from '../../state/types'
import { TASK_COLUMNS } from '../../state/reducer'
import { TaskCard } from '../start/TaskCard'
import { fadeUp } from '../../design/motion'

/* The task board, on the main screen. It was a right-edge drawer over whatever
   you were doing; a drawer says "glance and dismiss", and this is a place you
   go to work. Same cards as the start view, so a task looks like itself. */
export function TasksView({ tasks, onOpenTask }: { tasks: Task[]; onOpenTask: (id: string) => void }) {
  return (
    <motion.div
      {...fadeUp(8)}
      className="mx-auto w-full max-w-[1180px] px-8 py-8 sm:px-10"
    >
      <h1 className="mb-6 text-[19px] font-semibold tracking-[-.014em]">
        My Tasks
        
      </h1>

      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-3">
        {TASK_COLUMNS.map((col) => {
          const rows = tasks.filter((t) => t.status === col.key)
          return (
            <section key={col.key} className="min-w-0">
              <div
                className="mb-3 flex items-center gap-2 px-0.5 text-[11px]"
                style={{ color: 'var(--muted-deep)' }}
              >
                <span className="uppercase tracking-[.13em]">{col.name}</span>
                <span
                  className="mono grid h-[16px] min-w-[16px] place-items-center rounded-full px-1 text-[10px] leading-none"
                  style={{ background: 'var(--wash-3)' }}
                >
                  {rows.length}
                </span>
              </div>

              <div className="grid gap-4">
                {rows.length === 0 ? (
                  <p
                    className="rounded-[var(--r-sm)] p-3 text-[11.5px]"
                    style={{ background: 'var(--wash-1)', color: 'var(--muted-deep)' }}
                  >
                    Empty
                  </p>
                ) : (
                  rows.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} />)
                )}
              </div>
            </section>
          )
        })}
      </div>
    </motion.div>
  )
}
