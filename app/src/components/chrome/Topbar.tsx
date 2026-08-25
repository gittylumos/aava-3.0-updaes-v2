import * as Tooltip from '@radix-ui/react-tooltip'
import { IconBell, IconMoon, IconSun } from './icons'

interface Props {
  onHome: () => void
  onNotifications: () => void
  /** Set while a task is open — becomes the page header. */
  activeTaskTitle?: string | null
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  unread?: number | null
}

const tipClass = 'z-[80] rounded-[7px] px-2.5 py-1.5 text-[12px] leading-none shadow-lg'
const tipStyle = {
  background: 'var(--slab-raised)',
  border: '1px solid var(--glass-line)',
  color: 'var(--text-dim)',
}

function IconButton({
  label, onClick, children, dot,
}: {
  label: string
  onClick?: () => void
  children: React.ReactNode
  dot?: boolean
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className="press hit relative grid place-items-center rounded-[10px] hover:bg-[var(--wash-4)] hover:text-[var(--text-dim)]"
          style={{ color: 'var(--muted)' }}
        >
          {children}
          {dot && (
            <span
              aria-hidden="true"
              className="absolute right-[9px] top-[9px] h-[6px] w-[6px] rounded-full"
              style={{ background: 'var(--ok)', boxShadow: '0 0 0 2.5px var(--slab)' }}
            />
          )}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom" sideOffset={8} align="end" className={tipClass} style={tipStyle}>
          {label}
          <Tooltip.Arrow width={9} height={4} style={{ fill: 'var(--slab-raised)' }} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export function Topbar({ onHome, onNotifications, theme, onToggleTheme, unread = 0, activeTaskTitle }: Props) {
  return (
    <Tooltip.Provider delayDuration={320} skipDelayDuration={140}>
      <header
        className="flex shrink-0 items-center justify-between gap-4 px-5 py-3 backdrop-blur-[14px]"
        style={{
          background: 'var(--wash-1)',
          borderBottom: '1px solid var(--glass-line-soft)',
        }}
      >
        {/* Brand at home; a breadcrumb only once you are inside a task. */}
        <div className="flex min-w-0 items-baseline gap-2">
          {activeTaskTitle ? (
            <>
              <button
                onClick={onHome}
                className="press shrink-0 rounded-[8px] px-2 py-1.5 text-[14px] font-semibold tracking-[-.012em] transition-colors hover:bg-[var(--wash-2)]"
                style={{ color: 'var(--muted)' }}
              >
                Home
              </button>
              <span className="shrink-0 text-[13px]" style={{ color: 'var(--muted-deep)' }}>/</span>
              <h1 className="min-w-0 truncate text-[14px] font-semibold tracking-[-.012em]">
                {activeTaskTitle}
              </h1>
            </>
          ) : (
            <button
              onClick={onHome}
              className="press shrink-0 rounded-[10px] px-2 py-1.5 transition-colors hover:bg-[var(--wash-2)]"
            >
              {/* The wordmark now carries the aurora itself. Slightly larger and
                  wider-tracked than the old "AAVA 3.0" so it still holds the
                  corner without the version number propping it up. */}
              <span
                className="text-[16px] font-bold tracking-[.02em]"
                style={{
                  background: 'linear-gradient(96deg, var(--aurora-1), var(--aurora-2), var(--aurora-3))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                AAVA
              </span>
            </button>
          )}
        </div>

        {/* My Tasks lives in the sidebar now — one route to the board, not two. */}
        <div
          className="flex items-center gap-0.5 rounded-[12px] p-0.5"
          style={{
            background: 'var(--wash-2)',
            border: '1px solid var(--glass-line-soft)',
          }}
        >
          <IconButton
            label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </IconButton>
          <IconButton label="Notifications" onClick={onNotifications} dot={!!unread}>
            <IconBell />
          </IconButton>
        </div>
      </header>
    </Tooltip.Provider>
  )
}
