import { useCallback, useRef, useState } from 'react'
import { useDismiss } from '../../state/useDismiss'

/* The prompt bar.
 *
 * The AAVA composer, patterned on Claude's: a `+` menu for attachments and
 * connectors, a model picker, an effort selector, voice input, and send. No
 * Chat/Cowork tabs — this product has one mode. The selectors are prototype
 * state (they persist in the parent so the bar survives its remount when the
 * arrangement changes) and are cosmetic for now; wiring them to real behaviour
 * is a later step.
 */

export type Effort = 'High' | 'Medium' | 'Low'
export interface Connector { id: string; name: string; hue: string; on: boolean }

export const MODELS = ['Claude Opus 4.8', 'Claude Sonnet 4.5', 'GPT-5.6'] as const

interface Props {
  onSend: (text: string) => void
  value: string
  onChange: (v: string) => void
  className?: string
  placeholder?: string
  joined?: boolean

  /* Prompt-bar settings, held above the composer so they outlive its remount. */
  model: string
  onModel: (m: string) => void
  effort: Effort
  onEffort: (e: Effort) => void
  connectors: Connector[]
  onToggleConnector: (id: string) => void
  files: string[]
  onAddFiles: (names: string[]) => void
  onRemoveFile: (name: string) => void
}

type MenuId = 'none' | 'plus' | 'model' | 'effort'

export function Composer({
  onSend, value, onChange, className = '', joined = false,
  placeholder = 'Ask AAVA anything…',
  model, onModel, effort, onEffort, connectors, onToggleConnector,
  files, onAddFiles, onRemoveFile,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [menu, setMenu] = useState<MenuId>('none')
  /* The Connectors flyout, nested under the + menu. Opened on hover/click of the
     "Connectors" row and kept open while the pointer is over the row or the
     flyout — a short close timer bridges the gap between the two so moving
     across it doesn't dismiss it. */
  const [sub, setSub] = useState(false)
  const subTimer = useRef<number | undefined>(undefined)
  const openSub = useCallback(() => { window.clearTimeout(subTimer.current); setSub(true) }, [])
  const closeSub = useCallback(() => {
    window.clearTimeout(subTimer.current)
    subTimer.current = window.setTimeout(() => setSub(false), 130)
  }, [])
  const bar = useRef<HTMLDivElement>(null)
  useDismiss(menu !== 'none', bar, useCallback(() => { setMenu('none'); setSub(false) }, []))

  const submit = () => {
    const text = value.trim()
    if (!text) return
    onSend(text)
    onChange('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  const enabledConnectors = connectors.filter((c) => c.on).length

  return (
    <div className={`w-full ${joined ? '' : 'pb-7 pt-2'} ${className}`}>
      <form
        onSubmit={(e) => { e.preventDefault(); submit() }}
        className="rounded-[var(--r-lg)] px-4 pb-2.5 pt-3.5 backdrop-blur-[24px]"
        style={{
          background: joined ? 'var(--slab)' : 'var(--glass-strong)',
          border: joined ? 'none' : '1px solid var(--glass-line)',
          boxShadow: joined ? 'none' : 'var(--shadow-composer)',
        }}
      >
        {/* Attached files, as removable pills above the field. */}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {files.map((f) => (
              <span key={f} className="flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-[12px]"
                style={{ background: 'var(--wash-3)', color: 'var(--text-dim)' }}>
                <Icon.File />
                <span className="max-w-[160px] truncate">{f}</span>
                <button type="button" aria-label={`Remove ${f}`} onClick={() => onRemoveFile(f)}
                  className="press grid h-4 w-4 place-items-center rounded-full hover:bg-[var(--wash-4)]" style={{ color: 'var(--muted)' }}>
                  <Icon.X />
                </button>
              </span>
            ))}
          </div>
        )}

        <label htmlFor="prompt" className="sr-only">Message AAVA</label>
        <textarea
          id="prompt" ref={ref} rows={1} value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
          }}
          className="max-h-[168px] w-full resize-none bg-transparent text-[14px] placeholder:text-[var(--muted)] focus-visible:outline-none"
        />

        <input
          ref={fileInput} type="file" multiple className="hidden"
          onChange={(e) => {
            const names = Array.from(e.target.files ?? []).map((f) => f.name)
            if (names.length) onAddFiles(names)
            e.target.value = ''
          }}
        />

        <div ref={bar} className="relative mt-2 flex items-center gap-1.5">
          {/* + menu: attachments and a Connectors submenu (a side flyout rather
              than a wall of toggles dumped inline). */}
          <PillButton label="Add files or connectors" onClick={() => { setMenu(menu === 'plus' ? 'none' : 'plus'); setSub(false) }} active={menu === 'plus'} round>
            <Icon.Plus />
          </PillButton>

          {menu === 'plus' && (
            <Menu>
              <MenuItem onClick={() => { fileInput.current?.click(); setMenu('none') }}>
                <Icon.Paperclip /> <span>Add files or photos</span>
                <span className="mono ml-auto text-[11px]" style={{ color: 'var(--muted-deep)' }}>⌘U</span>
              </MenuItem>
              <div className="my-1 h-px" style={{ background: 'var(--glass-line-soft)' }} />
              {/* Connectors — opens a flyout to the right. */}
              <button
                type="button" role="menuitem" aria-haspopup="menu" aria-expanded={sub}
                onClick={() => (sub ? setSub(false) : openSub())}
                onMouseEnter={openSub}
                onMouseLeave={closeSub}
                className="menu-item"
                style={sub ? { color: 'var(--text)', background: 'var(--wash-3)' } : undefined}
              >
                <Icon.Connector />
                <span>Connectors</span>
                {enabledConnectors > 0 && (
                  <span className="mono ml-auto mr-1 text-[11px]" style={{ color: 'var(--muted)' }}>{enabledConnectors} on</span>
                )}
                <span className={enabledConnectors > 0 ? '' : 'ml-auto'} style={{ color: 'var(--muted-deep)' }}><Icon.ChevronRight /></span>
              </button>
            </Menu>
          )}

          {/* Connectors flyout — sibling of the menu (not a child, so the menu's
              overflow-hidden can't clip it), opening to the right of it. */}
          {menu === 'plus' && sub && (
            <div
              role="menu" aria-label="Connectors"
              onMouseEnter={openSub}
              onMouseLeave={closeSub}
              className="absolute bottom-full left-[254px] z-50 mb-2 w-[236px] overflow-hidden rounded-[12px] p-1 shadow-lg"
              style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}
            >
              <MenuItem onClick={() => { setMenu('none'); setSub(false) }}>
                <Icon.Gear /> <span>Manage connectors</span>
              </MenuItem>
              <div className="my-1 h-px" style={{ background: 'var(--glass-line-soft)' }} />
              {connectors.map((c) => (
                <button key={c.id} type="button" role="menuitemcheckbox" aria-checked={c.on}
                  onClick={() => onToggleConnector(c.id)}
                  className="menu-item" style={{ color: 'var(--text-dim)' }}>
                  <span className="h-4 w-4 shrink-0 rounded-[5px]" style={{ background: c.hue }} aria-hidden />
                  <span>{c.name}</span>
                  <Toggle on={c.on} />
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            {/* Model picker. */}
            <PillButton label="Select model" onClick={() => setMenu(menu === 'model' ? 'none' : 'model')} active={menu === 'model'}>
              <span className="text-[12.5px]" style={{ color: 'var(--text-dim)' }}>{model}</span>
              <Icon.Chevron />
            </PillButton>
            {menu === 'model' && (
              <Menu align="right" width={168}>
                {MODELS.map((m) => (
                  <MenuItem key={m} onClick={() => { onModel(m); setMenu('none') }} selected={m === model}>
                    <span>{m}</span>
                    {m === model && <span className="ml-auto"><Icon.Check /></span>}
                  </MenuItem>
                ))}
              </Menu>
            )}

            {/* Effort. */}
            <PillButton label="Select effort" onClick={() => setMenu(menu === 'effort' ? 'none' : 'effort')} active={menu === 'effort'}>
              <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{effort}</span>
              <Icon.Chevron />
            </PillButton>
            {menu === 'effort' && (
              <Menu align="right" width={140}>
                {(['High', 'Medium', 'Low'] as Effort[]).map((e) => (
                  <MenuItem key={e} onClick={() => { onEffort(e); setMenu('none') }} selected={e === effort}>
                    <span>{e}</span>
                    {e === effort && <span className="ml-auto"><Icon.Check /></span>}
                  </MenuItem>
                ))}
              </Menu>
            )}

            {/* Voice input. Prototype: toggles a listening state only. */}
            <PillButton label="Voice input" onClick={() => {}} round>
              <Icon.Mic />
            </PillButton>

            <button
              type="submit" disabled={!value.trim()} aria-label="Send message"
              className="press hit grid place-items-center rounded-full disabled:opacity-35 disabled:active:transform-none"
              style={{ background: 'var(--primary-grad)', color: '#fff' }}
            >
              <Icon.Send />
            </button>
          </div>
        </div>
      </form>
      {enabledConnectors > 0 && (
        <p className="mt-1.5 pl-1 text-[11px]" style={{ color: 'var(--muted-deep)' }}>
          {enabledConnectors} connector{enabledConnectors > 1 ? 's' : ''} active
        </p>
      )}
    </div>
  )
}

function PillButton({ children, label, onClick, active, round }: {
  children: React.ReactNode; label: string; onClick: () => void; active?: boolean; round?: boolean
}) {
  return (
    <button
      type="button" onClick={onClick} aria-label={label} title={label} aria-pressed={active}
      className={`press flex items-center gap-1 ${round ? 'h-8 w-8 justify-center rounded-full' : 'h-8 rounded-full px-2.5'} transition-colors hover:bg-[var(--wash-4)] hover:text-[var(--text-dim)]`}
      style={{ color: active ? 'var(--text)' : 'var(--muted)', background: active ? 'var(--wash-4)' : 'transparent' }}
    >
      {children}
    </button>
  )
}

/* Opens upward from the control row — the composer sits at the bottom of the
   column, so a downward menu would fall off-screen. */
function Menu({ children, align = 'left', width = 248 }: {
  children: React.ReactNode; align?: 'left' | 'right'; width?: number
}) {
  return (
    <div
      role="menu"
      className="absolute bottom-full z-50 mb-2 overflow-hidden rounded-[12px] p-1 shadow-lg"
      style={{ [align]: 0, width, background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}
    >
      {children}
    </div>
  )
}

function MenuItem({ children, onClick, selected }: {
  children: React.ReactNode; onClick: () => void; selected?: boolean
}) {
  return (
    <button type="button" role="menuitem" onClick={onClick}
      className="menu-item"
      style={{ color: selected ? 'var(--text)' : 'var(--text-dim)' }}>
      {children}
    </button>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className="ml-auto flex h-[18px] w-[30px] shrink-0 items-center rounded-full px-[2px] transition-colors"
      style={{ background: on ? 'var(--brand)' : 'var(--wash-4)' }} aria-hidden>
      <span className="h-[14px] w-[14px] rounded-full bg-white transition-transform"
        style={{ transform: on ? 'translateX(12px)' : 'none' }} />
    </span>
  )
}

/* House-style icons, 24x24, stroke 1.7, currentColor. */
const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
const Icon = {
  Plus: () => <svg {...svg} width="18" height="18"><path d="M12 5v14M5 12h14" /></svg>,
  Paperclip: () => <svg {...svg} width="16" height="16"><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.6 1.6 0 0 1-2.4-2.4l7.3-7.3" /></svg>,
  Chevron: () => <svg {...svg} width="13" height="13"><path d="m6 9 6 6 6-6" /></svg>,
  Mic: () => <svg {...svg} width="17" height="17"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>,
  Send: () => <svg {...svg} width="17" height="17" strokeWidth={1.9}><path d="M12 19V5.5M12 5.5 6 11.5M12 5.5l6 6" /></svg>,
  Check: () => <svg {...svg} width="14" height="14" strokeWidth={2}><path d="M5 12.5 10 17l9-10" /></svg>,
  File: () => <svg {...svg} width="13" height="13"><path d="M6 3h7l4 4v14H6z" /><path d="M13 3v4h4" /></svg>,
  X: () => <svg {...svg} width="11" height="11" strokeWidth={2}><path d="M5 5l10 10M15 5 5 15" /></svg>,
  Connector: () => <svg {...svg} width="16" height="16"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" /></svg>,
  ChevronRight: () => <svg {...svg} width="14" height="14"><path d="m9 6 6 6-6 6" /></svg>,
  Gear: () => <svg {...svg} width="16" height="16"><path d="M4 8h9M17 8h3M4 16h3M11 16h9" /><circle cx="15" cy="8" r="2.1" /><circle cx="9" cy="16" r="2.1" /></svg>,
}
