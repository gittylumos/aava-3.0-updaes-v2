import * as Dialog from '@radix-ui/react-dialog'
import { IconClose } from '../chrome/icons'
import { Tooltip } from '../chrome/Tooltip'

/** Shared overlay dismiss control — meets hit-target floor, uses IconClose. */
export function OverlayClose({ label = 'Close' }: { label?: string }) {
  return (
    <Tooltip label={label} side="bottom" align="end">
      <Dialog.Close
        aria-label={label}
        className="icon-btn hit hit-pad-md rounded-[10px]"
      >
        <IconClose size={16} />
      </Dialog.Close>
    </Tooltip>
  )
}
