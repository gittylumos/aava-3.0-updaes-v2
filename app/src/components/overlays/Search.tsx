import { useEffect, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { matchHits, type SearchHit } from '../../data/chrome'
import { IconChat, IconTasks } from '../chrome/icons'
import { OverlayClose } from './OverlayClose'

export function Search({
  open,
  hits,
  onClose,
  onSelect,
}: {
  open: boolean
  hits: SearchHit[]
  onClose: () => void
  onSelect: (hit: SearchHit) => void
}) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const list = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => matchHits(hits, q), [hits, q])

  // A new query means a new first result; the highlight cannot stay where it was.
  useEffect(() => setActive(0), [q])
  useEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const move = (delta: number) =>
    setActive((i) => (filtered.length === 0 ? 0 : (i + delta + filtered.length) % filtered.length))

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setQ('')
          setActive(0)
          onClose()
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: 'var(--scrim)', backdropFilter: 'blur(4px)' }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-[18%] z-50 w-[min(560px,92vw)] -translate-x-1/2 rounded-[var(--r-xl)] p-4"
          style={{ background: 'var(--slab)', border: '1px solid var(--glass-line)' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-[16px] font-semibold">Search</Dialog.Title>
            <OverlayClose label="Close search" />
          </div>

          {/* The palette is driven from the field — the arrow keys never leave it,
              so typing and picking are one gesture. */}
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
              else if (e.key === 'Enter' && filtered[active]) { e.preventDefault(); onSelect(filtered[active]) }
            }}
            role="combobox"
            aria-expanded
            aria-controls="search-results"
            aria-activedescendant={filtered[active]?.id}
            placeholder="Search your sessions"
            className="mb-3 w-full rounded-[var(--r-md)] px-3 py-2.5 text-[13.5px]"
            style={{
              background: 'var(--glass)',
              border: '1px solid var(--glass-line)',
              color: 'var(--text)',
            }}
          />

          <div id="search-results" ref={list} role="listbox" aria-label="Results"
            className="grid max-h-[min(50vh,360px)] gap-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="rounded-[var(--r-sm)] p-3 text-[12.5px]" style={{ color: 'var(--muted-deep)' }}>
                No matches for “{q.trim()}”.
              </div>
            )}
            {filtered.map((h, i) => {
              const task = h.kind === 'task'
              return (
                <button
                  key={h.id}
                  id={h.id}
                  role="option"
                  aria-selected={i === active}
                  onClick={() => onSelect(h)}
                  onMouseMove={() => setActive(i)}
                  className="press flex items-center gap-3 rounded-[var(--r-sm)] p-2.5 text-left"
                  style={{
                    background: i === active ? 'var(--wash-4)' : 'var(--glass)',
                    // Ring rather than a bolder fill: the row has to read as
                    // selected in both themes, where the washes differ very little.
                    boxShadow: i === active ? 'inset 0 0 0 1px var(--glass-line)' : undefined,
                  }}
                >
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px]"
                    style={{
                      background: task ? 'rgba(167,139,250,.16)' : 'var(--wash-3)',
                      color: task ? 'var(--aurora-2)' : 'var(--muted)',
                    }}
                  >
                    {task ? <IconTasks size={15} /> : <IconChat size={15} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{h.title}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mono mt-3 flex gap-3 px-1 text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>
            <span className="ml-auto">{filtered.length} of {hits.length}</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
