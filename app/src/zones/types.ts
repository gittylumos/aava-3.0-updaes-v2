/* The zone model — the spine of the Experience Engine (TEE).
 *
 * The deck's central claim: the frame is ALWAYS the same five zones, and every
 * channel (web, desktop, IDE, mobile, CLI) is those same five zones with some
 * folded or dissolved. So a zone is a reusable block; a channel is an
 * arrangement of the blocks, not a different screen. This file names the blocks
 * and the two things that can happen to one — folding and dissolving — and
 * nothing else. How a zone renders is the block's business; whether it renders
 * at all, and where, is resolved here.
 */

/** The five zones, in frame order. There is no sixth (deck, slide 5). */
export const ZONE_IDS = ['sidebar', 'conversation', 'canvas', 'toolbar', 'watch'] as const
export type ZoneId = (typeof ZONE_IDS)[number]

/** The question each zone answers — its reason to exist (deck, slide 5). */
export const ZONE_QUESTION: Record<ZoneId, string> = {
  sidebar: 'Where am I?',
  conversation: 'What can I do?',
  canvas: 'What am I working on?',
  toolbar: 'How am I looking at it?',
  watch: 'What is happening?',
}

/* Presence is the fold/dissolve axis, and it is the whole engine in one type.
 *   primary   — the zone holds a first-class position in the frame
 *   folded    — moved to a secondary position, still present and addressable
 *   dissolved — not in the render tree at all (deck, slide 2/3)
 * `folded` keeps state; `dissolved` does not exist. That distinction is the
 * reason both words are in the vocabulary. */
export type ZonePresence = 'primary' | 'folded' | 'dissolved'

/* A zone's appearance is its own smaller ladder, only meaningful when present.
 * Sidebar: expanded → rail → hidden. Watch: panel → inline. Canvas: docked →
 * fullscreen → readonly. Kept as one open string union rather than five enums
 * so a block can declare the appearances it actually supports without the
 * engine having to know them all. */
export type ZoneAppearance = string

export interface ZoneState {
  presence: ZonePresence
  appearance: ZoneAppearance
}

export type Frame = Record<ZoneId, ZoneState>

/* ── Channels ────────────────────────────────────────────────────────────────
 *
 * A channel is a client AAVA ships to. It declares a capability, and the engine
 * resolves the frame against that declaration — the channel never positions a
 * zone itself (deck, slide 10). */
export const CHANNEL_IDS = ['web', 'desktop', 'ide', 'mobile', 'cli'] as const
export type ChannelId = (typeof CHANNEL_IDS)[number]

export interface ChannelCapability {
  id: ChannelId
  label: string
  /** owned = AAVA controls the canvas; borrowed = host owns it (IDE);
   *  dissolved = no render surface AAVA controls (mobile, CLI). */
  canvas: 'owned' | 'borrowed' | 'dissolved'
  /** Whether generated widgets that need execution can resolve here. */
  runtime: boolean
  /** How the Watch zone can appear on this channel. */
  watch: 'panel' | 'inline' | 'dissolved'
}

/** The five capability declarations, verbatim from the deck (slides 10–14). */
export const CHANNELS: Record<ChannelId, ChannelCapability> = {
  web: { id: 'web', label: 'Web', canvas: 'owned', runtime: false, watch: 'panel' },
  desktop: { id: 'desktop', label: 'Desktop', canvas: 'owned', runtime: true, watch: 'panel' },
  ide: { id: 'ide', label: 'IDE in situ', canvas: 'borrowed', runtime: true, watch: 'dissolved' },
  mobile: { id: 'mobile', label: 'Mobile', canvas: 'dissolved', runtime: false, watch: 'dissolved' },
  cli: { id: 'cli', label: 'CLI', canvas: 'dissolved', runtime: true, watch: 'inline' },
}

/* ── Modes ───────────────────────────────────────────────────────────────────
 *
 * Within a channel, the user moves between resting and working. These are the
 * two configurations the deck draws for the owned-canvas channels (slide 11):
 *   rest — no active object: Sidebar expanded, Conversation centred, the rest
 *          dissolved.
 *   work — an object is being worked: Sidebar folds to a rail, Canvas docks,
 *          Toolbar and Watch appear.
 * Channels that dissolve the canvas never reach `work` as drawn — resolveFrame
 * handles that below. */
export type FrameMode = 'rest' | 'work'
