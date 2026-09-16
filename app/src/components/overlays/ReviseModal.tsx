/* The rewind-confirm modal — platform-level (an overlay, not inside the gate).
 * Names the downstream artefacts that get marked invalid when a step is rewound;
 * each is a link that opens the artefact so you can see what you are invalidating.
 * Confirming opens the gate for in-place editing. */
import { useEffect } from 'react'
import { motion } from 'motion/react'
import type { BacklogDoc } from '../../prd/backlog'

export function ReviseModal({ items, onOpenDoc, onConfirm, onCancel }: {
  items: { label: string; doc: BacklogDoc }[]
  onOpenDoc: (doc: BacklogDoc) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  /* Enter confirms, Escape cancels — the modal is the focus while it is open. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); onConfirm() }
      if (e.key === 'Escape') { e.preventDefault(); onCancel() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onConfirm, onCancel])

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Confirm undo"
      style={{ background: 'color-mix(in srgb, var(--ground) 62%, transparent)', backdropFilter: 'blur(2px)' }}
      onClick={onCancel}>
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] rounded-[16px] p-5"
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)', boxShadow: '0 24px 60px -12px rgba(0,0,0,.55)' }}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Confirm Undo</h3>
          <button onClick={onCancel} aria-label="Close"
            className="press -mr-1 -mt-1 grid h-7 w-7 place-items-center rounded-[8px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>This ‘rewind’ action will result in the following changes:</p>

        <ul className="mt-3 grid gap-2">
          {items.map((it) => (
            <li key={it.doc} className="flex items-center gap-2 text-[13.5px]">
              <span className="grid h-5 w-5 shrink-0 place-items-center" style={{ color: 'var(--muted-deep)' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4" />
                </svg>
              </span>
              <button onClick={() => onOpenDoc(it.doc)} className="font-medium underline underline-offset-2 hover:opacity-80" style={{ color: 'var(--link, #4a9eff)' }}>
                {it.label}
              </button>
              <span style={{ color: 'var(--muted)' }}>— will be marked as</span>
              <span className="font-semibold" style={{ color: 'var(--danger)' }}>invalid</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[13px]" style={{ color: 'var(--text-dim)' }}>Do you wish to continue?</p>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn-primary">Confirm</button>
        </div>
      </motion.div>
    </div>
  )
}
