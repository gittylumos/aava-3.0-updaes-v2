import { useCallback, useRef, useState } from 'react'
import { useDismiss } from '../../state/useDismiss'

/* The home screen's demo switch, centred above the greeting. "General user" is
   the product as it stands (seeded board, recents, pins, notifications);
   "First time user" is the same app on day one — everything empty, the home
   falling back to the greeting and the prompt bar. */
const OPTIONS = [
  { firstTime: false, label: 'General user' },
  { firstTime: true, label: 'First time user' },
] as const

export function UserTypeSwitch({ firstTime, onChange }: {
  firstTime: boolean
  onChange: (firstTime: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(open, root, useCallback(() => setOpen(false), []))
  const current = OPTIONS.find((o) => o.firstTime === firstTime) ?? OPTIONS[0]

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`User type: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        className="press flex h-[34px] items-center gap-2 rounded-[9px] px-3 text-[12.5px] font-medium transition-colors hover:bg-[var(--wash-4)]"
        style={{ color: 'var(--text-dim)', background: 'var(--glass)', border: '1px solid var(--glass-line)' }}
      >
        {current.label}
        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden
          style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 150ms var(--ease)' }}>
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="User type"
          className="absolute left-1/2 top-[calc(100%+6px)] z-[70] w-[180px] -translate-x-1/2 rounded-[var(--r-md)] p-1"
          style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)', boxShadow: 'var(--shadow-pop)' }}
        >
          {OPTIONS.map((o) => {
            const selected = o.firstTime === firstTime
            return (
              <button
                key={o.label}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => { setOpen(false); onChange(o.firstTime) }}
                className="press flex w-full items-center justify-between rounded-[var(--r-sm)] px-2.5 py-2 text-left text-[12.5px] transition-colors hover:bg-[var(--glass)]"
                style={{ color: selected ? 'var(--text)' : 'var(--text-dim)', fontWeight: selected ? 600 : 400 }}
              >
                {o.label}
                {selected && (
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                    <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
