/* Floating panels for the orchestration canvas.
 *
 * These FLOAT over the canvas the same way the Add library does — a rounded,
 * shadowed card pinned near a corner, not a fixed full-height drawer docked to
 * the edge. Version history is the one here; the node config panel floats the
 * same way from OrchestrationCanvas. */
import { motion } from 'motion/react'
import { X, Info, Search, ChevronDown, Check, MoreHorizontal } from 'lucide-react'
import { Tooltip } from '../components/chrome/Tooltip'

const POP = { type: 'spring' as const, stiffness: 320, damping: 26 }

interface Version { v: string; when: string; author: string; live?: boolean }
const VERSIONS: Version[] = [
  { v: 'v1.0.0.0', when: '10 Sept, 16:56', author: 'Sreeram Kammara', live: true },
]

export function VersionHistoryPanel({ onClose, onToast }: { onClose: () => void; onToast: (t: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -4 }} transition={POP}
      className="absolute right-3 top-3 z-30 flex max-h-[calc(100%-24px)] w-[320px] flex-col overflow-hidden rounded-[var(--r-md)] shadow-xl"
      style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)', transformOrigin: 'top right' }}
      aria-label="Version history">
      <div className="flex shrink-0 items-center gap-2 px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
        <span className="grid h-6 w-6 place-items-center rounded-[7px]" style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}><Info size={13} /></span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Version history</span>
        <Tooltip label="Close" side="bottom" align="end">
          <button onClick={onClose} className="icon-btn h-7 w-7" aria-label="Close"><X size={15} /></button>
        </Tooltip>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Sync banner */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ok)' }} />
          Synced with Dataverse — 1 server-side version
        </div>

        {/* Search */}
        <div className="px-3.5 pb-2">
          <div className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
            <Search size={13} style={{ color: 'var(--muted)' }} />
            <input placeholder="Search by title, author, or date" className="min-w-0 flex-1 bg-transparent text-[11.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-none" style={{ color: 'var(--text-dim)' }} />
          </div>
        </div>

        {/* LIVE group */}
        <div className="px-2.5 pb-2 pt-1.5">
          <div className="flex items-center gap-1.5 px-1 pb-1">
            <ChevronDown size={13} style={{ color: 'var(--muted)' }} />
            <span className="text-[11px] font-bold uppercase tracking-[.08em]" style={{ color: 'var(--text-dim)' }}>Live</span>
            <span className="ml-auto text-[11px]" style={{ color: 'var(--muted-deep)' }}>{VERSIONS.length}</span>
          </div>
          {VERSIONS.map((ver) => (
            <div key={ver.v} className="group/ver flex items-start gap-2.5 rounded-[9px] px-2.5 py-2 transition-colors hover:bg-[var(--wash-2)]">
              <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full" style={{ background: 'color-mix(in srgb, var(--brand) 20%, transparent)', color: 'var(--brand)' }}><Check size={11} strokeWidth={3} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>{ver.v}</span>
                  {ver.live && <span className="rounded-full px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-[.06em]" style={{ background: 'color-mix(in srgb, var(--ok) 16%, transparent)', color: 'var(--ok)' }}>Live</span>}
                  <Tooltip label="More" side="bottom" align="end">
                    <button onClick={() => onToast('Version options')} aria-label="More" className="icon-btn ml-auto h-6 w-6 opacity-0 group-hover/ver:opacity-100"><MoreHorizontal size={14} /></button>
                  </Tooltip>
                </div>
                <div className="mt-0.5 text-[11px]" style={{ color: 'var(--muted)' }}>{ver.when} · {ver.author}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
