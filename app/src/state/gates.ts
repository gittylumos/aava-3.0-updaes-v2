import type { Message } from './types'

/* The newest live HITL gate in a thread — a "waiting on you" decision or
   confirm block — or undefined when nothing is waiting. Pure, so the
   conversation view, the app shell and the journey engine all agree on which
   gate is open. */
export function livePinnedGate(messages: Message[]): Message | undefined {
  return [...messages].reverse().find(
    (m) => m.live !== false && (m.block?.kind === 'decision' || m.block?.kind === 'confirm'),
  )
}

/** The open gate's title, for copy that refers back to it. */
export function gateTitle(m: Message | undefined): string | undefined {
  const b = m?.block
  return b && (b.kind === 'decision' || b.kind === 'confirm') ? b.title : undefined
}
