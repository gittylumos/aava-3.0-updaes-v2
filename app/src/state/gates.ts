import type { Message } from './types'

/** The live human-in-the-loop gate: the latest message whose block is a
    decision or confirm and that has not been answered (`live !== false`).
    ConversationView pins it in the composer's place; the IDE raises its
    notification from it. */
export function liveGate(messages: Message[]): Message | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.live !== false && (m.block?.kind === 'decision' || m.block?.kind === 'confirm')) return m
  }
  return undefined
}
