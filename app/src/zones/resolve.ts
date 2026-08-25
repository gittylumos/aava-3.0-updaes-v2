/* resolveFrame — the one function the deck's channel diagrams reduce to.
 *
 * Given a channel and a mode, it returns the state of all five zones. Every
 * per-channel picture in the deck (Web rest/work, Desktop, IDE, Mobile, CLI) is
 * one call to this. Adding a channel is a capability declaration plus, at most,
 * a clause here — never a new layout component. That is what "the same five
 * zones, folded or dissolved to fit" means in code.
 */
import {
  CHANNELS, ZONE_IDS,
  type ChannelId, type Frame, type FrameMode, type ZoneId, type ZoneState,
} from './types'

const state = (presence: ZoneState['presence'], appearance: string): ZoneState =>
  ({ presence, appearance })

/** Base owned-canvas frame (Web/Desktop), the two configurations of slide 11. */
function ownedFrame(mode: FrameMode, watch: 'panel' | 'inline'): Frame {
  if (mode === 'rest') {
    return {
      sidebar: state('primary', 'expanded'),
      conversation: state('primary', 'centred'),
      canvas: state('dissolved', 'none'),
      toolbar: state('dissolved', 'none'),
      watch: state('dissolved', 'none'),
    }
  }
  // work: sidebar folds to a rail, canvas docks, toolbar and watch appear.
  return {
    sidebar: state('folded', 'rail'),
    conversation: state('primary', 'docked'),
    canvas: state('primary', 'docked'),
    toolbar: state('primary', 'attached'),
    watch: state('primary', watch === 'panel' ? 'panel' : 'inline'),
  }
}

export function resolveFrame(channelId: ChannelId, mode: FrameMode): Frame {
  const cap = CHANNELS[channelId]

  switch (cap.canvas) {
    case 'owned':
      // Web and Desktop run one frame; they differ only in declared capability,
      // which changes which widgets resolve, not where the zones sit (slide 12).
      return ownedFrame(mode, cap.watch === 'inline' ? 'inline' : 'panel')

    case 'borrowed': {
      // IDE: the host owns the Canvas, so AAVA surrenders it and never renders a
      // Watch — the IDE owns its own console (slide 13).
      const base = ownedFrame(mode, 'panel')
      return {
        ...base,
        canvas: state('dissolved', 'surrendered'),
        watch: state('dissolved', 'none'),
        // With no canvas to dock beside, the conversation carries the frame.
        conversation: state('primary', mode === 'rest' ? 'centred' : 'docked'),
        toolbar: mode === 'rest' ? state('dissolved', 'none') : state('folded', 'attached'),
      }
    }

    case 'dissolved': {
      // Mobile and CLI declare no owned surface, so the Canvas is dissolved and
      // preview is delegated by reference (slide 14). The difference between
      // them is entirely how Watch appears.
      const watch =
        cap.watch === 'inline' ? state('primary', 'inline') : state('dissolved', 'none')
      return {
        sidebar: state('folded', 'rail'),
        conversation: state('primary', 'centred'),
        canvas: state('dissolved', 'delegated'),
        toolbar: state('dissolved', 'none'),
        watch,
      }
    }
  }
}

/** Zones that actually render, in frame order — the render list for a channel. */
export function presentZones(frame: Frame): ZoneId[] {
  return ZONE_IDS.filter((id) => frame[id].presence !== 'dissolved')
}
