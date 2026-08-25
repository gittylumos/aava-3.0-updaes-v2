import { useMemo } from 'react'
import { pickGreeting } from '../../data/greetings'

interface Props {
  name: string
  /** The line under the greeting. Empty renders no subtitle. */
  subtitle?: string
  /** Centre-align for the minimal home (greeting + composer, no board). */
  centered?: boolean
}

export function Hero({ name, subtitle, centered = false }: Props) {
  const greeting = useMemo(() => pickGreeting(name), [name])

  return (
    <section className={`mb-10 ${centered ? 'text-center' : ''}`}>
      <h1 className="text-[44px] font-medium leading-[1.05] tracking-[-.038em] text-balance">
        {greeting}
      </h1>
      {subtitle && (
        <p className="mt-3 max text-[15px] leading-relaxed text-pretty" style={{ color: 'var(--muted)' }}>
          {subtitle}
        </p>
      )}
    </section>
  )
}
