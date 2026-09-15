/* Sidebar — the REAL component (src/components/chrome/Sidebar.tsx), not a
 * recreation, mounted live with the app's own sample threads/tasks/profile
 * data so this is pixel-for-pixel what the product ships. Fully interactive —
 * collapse it, pick a row, pin a thread, switch profile — and it auto-plays
 * the collapse↔expand toggle on a loop when left alone, so it reads like a
 * short reel. Hovering (or touching any control) pauses the loop. */
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Sidebar } from '../../components/chrome/Sidebar'
import { TASKS } from '../../state/reducer'
import { PROFILES, PROFILE_ORDER, DEFAULT_PROFILE, type ProfileId } from '../../data/user'
import type { Thread } from '../../state/types'
import { PreviewBox } from '../shared'

/* The real <Sidebar> fills 100% of its parent — geometry belongs to whatever
   wraps it (react-resizable-panels' Panel in the real shell: 268px default,
   collapsing to a 70px rail). Reproduced here at those same widths so the
   real component gets the same sizing contract it expects. */
const RAIL_PX = 70
const OPEN_PX = 268

const THREADS: Thread[] = [
  { id: 'th-sprint-scope', kind: 'chat', title: 'Sprint scope questions', when: 'Yesterday' },
  { id: 'th-t4', kind: 'task', taskId: 'T4', title: 'Add telemetry functionality', when: '2 days ago' },
]

function SidebarNavDemo() {
  const [open, setOpen] = useState(true)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [pinnedIds, setPinnedIds] = useState<string[]>(['th-t4'])
  const [profileId, setProfileId] = useState<ProfileId>(DEFAULT_PROFILE)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const paused = useRef(false)

  // Auto-play the collapse↔expand toggle while the visitor isn't interacting.
  useEffect(() => {
    const iv = window.setInterval(() => { if (!paused.current) setOpen((o) => !o) }, 3000)
    return () => window.clearInterval(iv)
  }, [])

  const pause = () => { paused.current = true }
  const resume = () => { paused.current = false }

  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-[14px]" style={{ border: '1px solid var(--glass-line)', background: 'var(--ground)' }}
      onMouseEnter={pause} onMouseLeave={resume}>
      <div className="flex h-full">
        <motion.div className="h-full shrink-0 overflow-hidden" animate={{ width: open ? OPEN_PX : RAIL_PX }} transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}>
          <Sidebar
            open={open}
            threads={THREADS}
            tasks={TASKS}
            pinnedIds={pinnedIds}
            activeThreadId={activeThreadId}
            activeTaskId={activeTaskId}
            onHome={() => { setActiveThreadId(null); setActiveTaskId(null); pause() }}
            onNewChat={() => { setActiveThreadId(null); setActiveTaskId(null); pause() }}
            onMyTasks={() => pause()}
            onSearch={() => pause()}
            onToggle={() => { setOpen((o) => !o); pause() }}
            onOpenThread={(t) => { setActiveThreadId(t.id); setActiveTaskId(null); pause() }}
            onOpenTask={(taskId) => { setActiveTaskId(taskId); setActiveThreadId(null); pause() }}
            onTogglePin={(id) => { setPinnedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])); pause() }}
            profile={PROFILES[profileId]}
            otherProfiles={PROFILE_ORDER.filter((id) => id !== profileId).map((id) => PROFILES[id])}
            onSwitchTo={(id) => { setProfileId(id); pause() }}
            theme={theme}
            onToggleTheme={() => { setTheme((t) => (t === 'dark' ? 'light' : 'dark')); pause() }}
          />
        </motion.div>
        {/* Faint main area, so the rail reads as part of an app shell. */}
        <div className="min-w-0 flex-1 px-6 py-5" style={{ background: 'var(--ground)' }}>
          <div className="h-4 w-44 rounded-full" style={{ background: 'var(--wash-2)' }} />
          <div className="mt-3.5 grid grid-cols-2 gap-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-[10px]" style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SidebarNavPreview() {
  return <PreviewBox minHeight={600}><SidebarNavDemo /></PreviewBox>
}
