import { useEffect, useRef } from 'react'
import type { TaskTag } from '../../state/types'
import type { ChromeNotification } from '../../data/chrome'
import { TAG_META } from '../../state/reducer'

/* The same tag the board shows, in the same colours — a notification about a
   task and the card for that task should never look like two different things. */
function TagChip({ tag }: { tag: TaskTag }) {
  const meta = TAG_META[tag]
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold leading-[1.6]"
      style={{ background: meta.bg, color: meta.fg }}
    >
      {meta.label}
    </span>
  )
}

/* A popover, not a dialog.
 *
 * Notifications are a glance, not a task: a scrim and a focus trap over the whole
 * workspace is the wrong weight for "what happened while I was away". This panel
 * hangs off the bell, dismisses on outside-click or Escape, and leaves the rest
 * of the page live and readable behind it.
 *
 * The dismiss logic mirrors the Profile popover in Sidebar.tsx — worth extracting to
 * a shared hook if a third popover appears. */
export function Notifications({
  open,
  items,
  onClose,
  onOpen,
}: {
  open: boolean
  items: ChromeNotification[]
  onClose: () => void
  onOpen: (item: ChromeNotification) => void
}) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (root.current?.contains(target)) return
      // The bell toggles this itself; closing here too would immediately reopen.
      if (target.closest?.('[aria-label="Notifications"]')) return
      onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, onClose])

  if (!open) return null

  const unread = items.filter((n) => n.unread).length

  return (
    <div
      ref={root}
      role="dialog"
      aria-label="Notifications"

      className="fixed right-4 top-[68px] z-[70] w-[min(400px,92vw)] overflow-hidden rounded-[var(--r-lg)]"
      style={{
        background: 'var(--slab-raised)',
        border: '1px solid var(--glass-line)',
        boxShadow: 'var(--shadow-pop)',
        animation: 'notif-in 180ms cubic-bezier(.16,1,.3,1)',
        transformOrigin: 'top right',
      }}
    >
      <style>{`
        @keyframes notif-in {
          from { opacity: 0; transform: translateY(-6px) scale(.97) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
      `}</style>

      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--glass-line-soft)' }}
      >
        <h2 className="text-[13px] font-semibold tracking-[-.01em]">Notifications</h2>
        {unread > 0 && (
          <span
            className="mono rounded-full px-2 py-0.5 text-[10.5px] leading-none"
            style={{ background: 'rgba(52,211,153,.14)', color: 'var(--ok)' }}
          >
            {unread} new
          </span>
        )}
      </div>

      {/* minmax(0,1fr): long bodies would otherwise widen the column past the panel. */}
      <div className="grid max-h-[min(58vh,420px)] grid-cols-[minmax(0,1fr)] gap-px overflow-y-auto p-1.5">
        {items.length === 0 && (
          <p className="px-2.5 py-6 text-center text-[12.5px]" style={{ color: 'var(--muted-deep)' }}>
            Nothing new.
          </p>
        )}
        {/* Read and unread differ in weight and colour only. Nothing moves, so a
            row settling from bold to plain reads as "seen", not as a new row. */}
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => onOpen(n)}
            aria-label={`${n.title}${n.unread ? ' — unread' : ''}`}
            className="press rounded-[var(--r-sm)] p-2.5 text-left hover:bg-[var(--glass)]"
            style={{ background: n.unread ? 'var(--wash-2)' : 'transparent' }}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <TagChip tag={n.tag} />
              <span className="mono ml-auto text-[11px]" style={{ color: 'var(--muted-deep)' }}>
                {n.when}
              </span>
            </div>
            <span
              className="block text-[13px] leading-snug"
              style={{
                fontWeight: n.unread ? 650 : 400,
                color: n.unread ? 'var(--text)' : 'var(--text-dim)',
              }}
            >
              {n.title}
            </span>
            <span
              className="mt-1 block text-[12px] leading-snug"
              style={{ color: n.unread ? 'var(--muted)' : 'var(--muted-deep)' }}
            >
              {n.body}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
