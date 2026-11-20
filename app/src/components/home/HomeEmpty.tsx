import { useMemo } from 'react'
import { motion } from 'motion/react'
import { pickGreeting } from '../../data/greetings'
import { fadeUp } from '../../design/motion'
import { BrandMark } from '../chrome/icons'

/* The home screen once sessions live in the secondary list: an empty state,
 * the way Codex's new-chat screen is — the brand mark and greeting centred,
 * the prompt bar anchored at the bottom. The work itself is one glance left,
 * in the session list, so the home no longer repeats it as cards.
 */
export function HomeEmpty({ name, subtitle, composer }: { name: string; subtitle: string; composer: React.ReactNode }) {
  const greeting = useMemo(() => pickGreeting(name), [name])
  return (
    <motion.div {...fadeUp(8)} className="mx-auto flex h-full w-full max-w-[860px] flex-col px-8">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <BrandMark size={52} />
        <h1 className="mt-5 text-[30px] font-medium leading-tight tracking-[-.03em] text-balance">{greeting}</h1>
        {subtitle && (
          <p className="mt-2 max-w-[520px] text-[15px] leading-relaxed text-pretty" style={{ color: 'var(--muted)' }}>{subtitle}</p>
        )}
      </div>
      <div className="pb-2">{composer}</div>
    </motion.div>
  )
}
