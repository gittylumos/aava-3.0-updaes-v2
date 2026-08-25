/* Zone — the reusable block.
 *
 * One component, five identities. Every channel variant composes the same
 * <Zone> blocks; what differs between web, mobile and the rest is which zones
 * are present and how they are folded, which resolveFrame decides — not a
 * different component per surface. A Zone carries its own colour (from the
 * --zone-* tokens) and, when dissolved, renders nothing at all, so a channel
 * that dissolves the Canvas simply gets no Canvas in its tree.
 */
import type { CSSProperties, ReactNode } from 'react'
import { ZONE_QUESTION, type ZoneId, type ZoneState } from './types'

/** CSS custom props exposed on every zone block, so children can reach the
 *  zone's colour without importing anything. */
interface ZoneVars extends CSSProperties {
  '--zone-tint': string
  '--zone-accent': string
}

function zoneVars(id: ZoneId): ZoneVars {
  return {
    '--zone-tint': `var(--zone-${id}-tint)`,
    '--zone-accent': `var(--zone-${id}-accent)`,
  }
}

interface ZoneProps {
  id: ZoneId
  state: ZoneState
  children: ReactNode
  /** When true, paints the zone's tint as the block background. Off by default
   *  — most zones sit on the app ground and use their accent only for markers,
   *  same as the deck, where the tint is a legend swatch, not a fill. */
  tinted?: boolean
  className?: string
  style?: CSSProperties
}

export function Zone({ id, state, children, tinted = false, className = '', style }: ZoneProps) {
  // Dissolved means dissolved: absent from the render tree, not hidden with CSS.
  if (state.presence === 'dissolved') return null

  return (
    <section
      data-zone={id}
      data-presence={state.presence}
      data-appearance={state.appearance}
      aria-label={`${id} — ${ZONE_QUESTION[id]}`}
      className={className}
      style={{
        ...zoneVars(id),
        ...(tinted ? { background: 'var(--zone-tint)' } : null),
        ...style,
      }}
    >
      {children}
    </section>
  )
}
