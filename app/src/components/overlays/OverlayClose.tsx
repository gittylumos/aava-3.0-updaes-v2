import * as Dialog from '@radix-ui/react-dialog'
import { IconClose } from '../chrome/icons'

/** Shared overlay dismiss control — meets hit-target floor, uses IconClose. */
export function OverlayClose({ label = 'Close' }: { label?: string }) {
  return (
    <Dialog.Close
      aria-label={label}
      className="press hit grid place-items-center rounded-[10px] transition-colors hover:bg-[var(--wash-4)]"
      style={{ color: 'var(--muted)' }}
    >
      <IconClose size={16} />
    </Dialog.Close>
  )
}
