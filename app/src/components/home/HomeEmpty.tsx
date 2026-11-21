import { motion } from 'motion/react'
import { fadeUp } from '../../design/motion'
import { BrandMark } from '../chrome/icons'

/* The home screen once sessions live in the secondary list: the brand mark and
 * a plain question, four starting points, and the prompt bar anchored at the
 * bottom. The work itself is one glance left, in the session list.
 * A suggestion does not send anything — it puts its prompt in the bar, so the
 * user can finish the sentence before it goes.
 */
const svg = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

const SUGGESTIONS: { title: string; hint: string; prompt: string; icon: React.ReactNode }[] = [
  { title: 'Ask about the codebase', hint: '“Where do we format prices?”', prompt: 'Where do we format prices?',
    icon: <svg {...svg}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></svg> },
  { title: 'Investigate a problem', hint: '“Why did the checkout bundle grow?”', prompt: 'Why did the checkout bundle grow?',
    icon: <svg {...svg}><path d="M4 18l5-6 4 3 7-9" /><path d="M4 21h16" /></svg> },
  { title: 'Plan a change', hint: '“Plan the Tailwind upgrade”', prompt: 'Plan the Tailwind upgrade',
    icon: <svg {...svg}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></svg> },
  { title: 'Build from a design', hint: 'Paste a Figma link or drop a PNG', prompt: 'Build this screen from the design: ',
    icon: <svg {...svg}><path d="M14 4l6 6-9 9H5v-6z" /><path d="M12 6l6 6" /></svg> },
]

export function HomeEmpty({ onPick, composer }: { onPick: (prompt: string) => void; composer: React.ReactNode }) {
  return (
    <motion.div {...fadeUp(8)} className="mx-auto flex h-full w-full max-w-[860px] flex-col px-8">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <BrandMark size={52} />
        <h1 className="mt-5 text-[30px] font-medium leading-tight tracking-[-.03em] text-balance">What would you like to do?</h1>
        <p className="mt-2 max-w-[520px] text-[15px] leading-relaxed text-pretty" style={{ color: 'var(--muted)' }}>
          Tell AAVA your intent in plain words. Questions stay a conversation; work can become a task when you say so.
        </p>
        <div className="mt-8 grid w-full max-w-[640px] grid-cols-1 gap-3 text-left sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button key={s.title} type="button" onClick={() => onPick(s.prompt)}
              className="press grid justify-items-start gap-1 rounded-[var(--r-md)] p-4 text-left transition-colors hover:bg-[var(--wash-3)]"
              style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
              <span style={{ color: 'var(--text-dim)' }}>{s.icon}</span>
              <span className="mt-1.5 text-[14.5px] font-semibold" style={{ color: 'var(--text)' }}>{s.title}</span>
              <span className="text-[13px] leading-snug" style={{ color: 'var(--muted)' }}>{s.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="pb-2">{composer}</div>
    </motion.div>
  )
}
