/* Contracts for the CLI-surface demo (branch feat/lowfi-cli).
 *
 * A web page that looks like a terminal window running `aava`. It drives the
 * SAME journey engine as the web app (useJourney + scenarios t1/t7 + the T2
 * task). Per docs/surfaces-plan.md §2 the CLI has: canvas DISSOLVED (every
 * artifact is printed as text or a path/URL), code runtime (ng serve runs as a
 * background task), watch INLINE (one status line under the prompt).
 *
 * Two build tasks share this file:
 *   Task A (CliApp.tsx, Terminal.tsx, useCli.ts): window, scrollback, prompt,
 *     keyboard, screens (home / resume list / session), slash commands.
 *   Task B (render.ts, printers.ts): message → lines, gates → choices,
 *     artifact printers (diff, validation, steps, context, ng serve).
 */
import type { useJourney } from '../state/useJourney'

export type Journey = ReturnType<typeof useJourney>

/** Text weight/role. Everything renders grayscale; tones map to weight/opacity. */
export type Tone = 'normal' | 'dim' | 'bold' | 'accent' | 'success' | 'warn' | 'error'

/** One styled run of text inside a terminal row. */
export interface Seg {
  text: string
  tone?: Tone
  /** Underlined, clickable (OSC-8 style hyperlink): a file path or URL. */
  link?: { kind: 'file'; file: string } | { kind: 'url'; url: string }
}

/** One terminal row. An empty array is a blank line. */
export type Line = Seg[]

/** A numbered option the user can pick at a gate (↑/↓ + Enter, or its number). */
export interface Choice {
  /** "1", "2", … */
  key: string
  label: string
  primary?: boolean
  /** True when picking it needs free text first (e.g. "Refine changes"):
      the CLI then prompts "› What should change?" and passes the text. */
  collect?: boolean
  run: (text?: string) => void
}

/** What a printer/renderer may need besides the message itself. */
export interface RenderCtx {
  j: Journey
}
