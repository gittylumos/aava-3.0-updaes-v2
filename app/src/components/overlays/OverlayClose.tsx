import * as Dialog from '@radix-ui/react-dialog'
import { IconClose } from '../chrome/icons'

/** Shared overlay dismiss control — meets hit-target floor, uses IconClose. */
export function OverlayClose({ label = 'Close' }: { label?: string }) {
  return (
    <Dialog.Close
      aria-label={label}
      className="icon-btn hit rounded-[10px]"
    >
      <IconClose size={16} />
    </Dialog.Close>
  )
}
