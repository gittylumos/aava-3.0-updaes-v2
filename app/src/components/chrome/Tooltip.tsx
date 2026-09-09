import * as RadixTooltip from '@radix-ui/react-tooltip'

/* One tooltip for the whole app — light surface (bg.tertiary, the same
   surface popovers and modals use), a hairline border, the pop shadow, and a
   blur + scale-from-0.9 open/close (see .aava-tooltip in index.css). Every
   icon-only control should be wrapped in this instead of growing its own. */

export const TooltipProvider = RadixTooltip.Provider

interface Props {
  /** What the control does. Keep it to a few words — this is a label, not a description. */
  label: string
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  /** Skip the tooltip — e.g. a sidebar row once its own text label is already visible. */
  disabled?: boolean
}

export function Tooltip({ label, children, side = 'top', align = 'center', sideOffset = 8, disabled }: Props) {
  if (disabled) return <>{children}</>
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={8}
          className="aava-tooltip z-[80] rounded-[9px] px-2.5 py-1.5 text-[12px] font-medium leading-none whitespace-nowrap"
          style={{
            background: 'var(--slab-raised)',
            border: '1px solid var(--glass-line)',
            color: 'var(--text-dim)',
            boxShadow: 'var(--shadow-pop)',
          }}
        >
          {label}
          <RadixTooltip.Arrow width={10} height={5} style={{ fill: 'var(--slab-raised)' }} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
