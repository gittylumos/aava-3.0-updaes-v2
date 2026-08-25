/* The Toolbar zone.
 *
 * A segmented view-switcher for the current Canvas object. It is the same shape
 * every generative-build tool converged on — v0 and Claude's artifacts put a
 * Preview/Code switch at the top of the workbench; bolt and lovable add a device
 * toggle and a few object actions — and it follows their responsive rule: label
 * beside the icon when there is room, icon alone with a tooltip when there is
 * not. Here the views come from the object (objects.ts), not from a hardcoded
 * list, and each view is resolved against the channel so a view that cannot run
 * on this surface reads as "delegated" rather than vanishing.
 *
 * `compact` forces icon-only regardless of width — that is how a narrow channel
 * (mobile) pins the toolbar to icons. Otherwise width decides, measured here.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { Zone } from './Zone'
import { availabilityOf, type ObjectView } from './objects'
import { VIEW_ICON } from './toolbarIcons'
import { CHANNELS, type ChannelId, type ZoneState } from './types'

interface Props {
  state: ZoneState
  channel: ChannelId
  views: ObjectView[]
  activeView: string
  onSelect: (viewId: string) => void
  /** Force icon-only. When unset, width decides. */
  compact?: boolean
}

/** Below this container width the labels drop and the switcher goes icon-only. */
const LABEL_BUDGET = 108 // px of room each labelled segment wants, roughly

export function Toolbar({ state, channel, views, activeView, onSelect, compact }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [autoCompact, setAutoCompact] = useState(false)
  const cap = CHANNELS[channel]

  /* Measure rather than guess: the toolbar collapses when its own row runs out
     of room, not at an arbitrary viewport breakpoint — the same toolbar reads
     as full in a wide panel and compact in a narrow one. */
  useLayoutEffect(() => {
    if (compact !== undefined) return
    const el = ref.current
    if (!el) return
    const measure = () => setAutoCompact(el.clientWidth < views.length * LABEL_BUDGET)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [compact, views.length])

  const iconOnly = compact ?? autoCompact

  return (
    <Zone
      id="toolbar"
      state={state}
      className="flex w-full items-center gap-1 overflow-x-auto px-2 py-1.5"
      style={{ borderBottom: '1px solid var(--glass-line-soft)' }}
    >
      <div ref={ref} className="flex min-w-0 flex-1 items-center gap-1" role="tablist" aria-label="Object views">
        {views.map((view) => {
          const Icon = VIEW_ICON[view.icon]
          const active = view.id === activeView
          const avail = availabilityOf(view, cap)
          const hint =
            avail === 'delegated' ? `Opens on another surface — ${cap.label} has no canvas`
            : avail === 'native' ? `Handed to the ${cap.label} host`
            : undefined
          return (
            <button
              key={view.id}
              role="tab"
              aria-selected={active}
              title={iconOnly ? `${view.label}${hint ? ` · ${hint}` : ''}` : hint}
              onClick={() => onSelect(view.id)}
              className="press relative flex shrink-0 items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[12px] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              style={{
                color: active ? 'var(--text)' : 'var(--muted)',
                background: active ? 'var(--wash-3)' : 'transparent',
                /* The active view is marked in the zone's own colour — the amber
                   Toolbar accent — so the frame's colour language is visible. */
                boxShadow: active ? 'inset 0 -2px 0 var(--zone-accent)' : 'none',
                opacity: avail === 'delegated' ? 0.55 : 1,
              }}
            >
              <Icon size={16} />
              {!iconOnly && <span className="truncate">{view.label}</span>}
              {avail === 'delegated' && (
                <span aria-hidden className="ml-0.5 text-[9px]" style={{ color: 'var(--zone-accent)' }}>↗</span>
              )}
            </button>
          )
        })}
      </div>
    </Zone>
  )
}
