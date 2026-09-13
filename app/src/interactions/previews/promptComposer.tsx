/* Prompt composer — the one bar you talk to AAVA through, carrying every way
 * in: type @ to pull in a source (a ticket, a frame, a PR) that lands as a
 * chip, / to reach for a command, + to attach files and connectors, a model
 * picker and dictation alongside. A faithful, self-contained twin of
 * src/components/chrome/Composer.tsx — interactive, so a visitor drives it. No
 * status tab, no permissions strip: the bare card, the way AAVA ships it. */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SOURCE_META, type SourceKind } from '../../components/chat/InlineSource'

const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
const Icon = {
  Plus: () => <svg {...svg} width="18" height="18"><path d="M12 5v14M5 12h14" /></svg>,
  X: () => <svg {...svg} width="17" height="17" strokeWidth={2}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  XSmall: () => <svg {...svg} width="11" height="11" strokeWidth={2}><path d="M5 5l10 10M15 5 5 15" /></svg>,
  Chevron: () => <svg {...svg} width="13" height="13"><path d="m6 9 6 6 6-6" /></svg>,
  Check: () => <svg {...svg} width="14" height="14" strokeWidth={2}><path d="M5 12.5 10 17l9-10" /></svg>,
  Mic: () => <svg {...svg} width="17" height="17"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>,
  Send: () => <svg {...svg} width="17" height="17" strokeWidth={1.9}><path d="M12 19V5.5M12 5.5 6 11.5M12 5.5l6 6" /></svg>,
  Paperclip: () => <svg {...svg} width="16" height="16"><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.6 1.6 0 0 1-2.4-2.4l7.3-7.3" /></svg>,
  Connector: () => <svg {...svg} width="16" height="16"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" /></svg>,
  At: () => <svg {...svg} width="15" height="15"><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></svg>,
  Slash: () => <svg {...svg} width="15" height="15"><path d="M15 4 9 20" /></svg>,
  ChevronRight: () => <svg {...svg} width="14" height="14"><path d="m9 6 6 6-6 6" /></svg>,
  Gear: () => <svg {...svg} width="16" height="16"><path d="M4 8h9M17 8h3M4 16h3M11 16h9" /><circle cx="15" cy="8" r="2.1" /><circle cx="9" cy="16" r="2.1" /></svg>,
}

const MODELS = ['Claude Opus 4.8', 'Claude Sonnet 4.5', 'GPT-5.6']

interface Source { kind: SourceKind; label: string; sub: string }
const AT_SOURCES: Source[] = [
  { kind: 'jira', label: 'MOB-2841', sub: 'Add a feedback form' },
  { kind: 'figma', label: 'Feedback Form v3', sub: 'Mobile Components' },
  { kind: 'github', label: 'PR #2841', sub: 'feat: feedback form screen' },
  { kind: 'confluence', label: 'Payments spec', sub: 'Checkout · Confluence' },
]
const SLASH_COMMANDS = [
  { cmd: 'summarize', hint: 'Condense the thread so far' },
  { cmd: 'draft-reply', hint: 'Write a reply for review' },
  { cmd: 'find-tickets', hint: 'Search related Jira issues' },
  { cmd: 'write-tests', hint: 'Generate unit specs' },
  { cmd: 'explain', hint: 'Walk through the selection' },
]

/* The mic's listening state — a three-bar equalizer bouncing in place. */
function Waveform() {
  return (
    <span className="flex h-3.5 items-center gap-[2.5px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="ilib-eq w-[2.5px] rounded-full bg-current" style={{ height: '100%', animation: `eq-bounce 900ms ease-in-out ${i * 150}ms infinite` }} />
      ))}
      <style>{`.ilib-eq { transform-origin: center; }
        @keyframes eq-bounce { 0%,100% { transform: scaleY(.35); } 50% { transform: scaleY(1); } }
        @media (prefers-reduced-motion: reduce) { .ilib-eq { animation: none !important; transform: scaleY(.6); } }`}</style>
    </span>
  )
}

type Menu = 'none' | 'at' | 'slash' | 'plus' | 'connectors' | 'model' | 'effort'
type Phase = 'idle' | 'busy'
type Effort = 'High' | 'Medium' | 'Low'
const EFFORTS: Effort[] = ['High', 'Medium', 'Low']

interface Conn { id: string; name: string; hue: string; on: boolean }
const CONNECTORS0: Conn[] = [
  { id: 'jira', name: 'Jira', hue: '#2684FF', on: true },
  { id: 'github', name: 'GitHub', hue: '#8B949E', on: true },
  { id: 'figma', name: 'Figma', hue: '#F24E1E', on: false },
  { id: 'slack', name: 'Slack', hue: '#E01E5A', on: false },
  { id: 'confluence', name: 'Confluence', hue: '#1868DB', on: false },
]

function Toggle({ on }: { on: boolean }) {
  return (
    <span className="ml-auto flex h-[18px] w-[30px] shrink-0 items-center rounded-full px-[2px] transition-colors" style={{ background: on ? 'var(--brand)' : 'var(--wash-4)' }} aria-hidden>
      <span className="h-[14px] w-[14px] rounded-full bg-white transition-transform" style={{ transform: on ? 'translateX(12px)' : 'none' }} />
    </span>
  )
}

function ComposerDemo() {
  const [value, setValue] = useState('')
  const [mentions, setMentions] = useState<Source[]>([])
  const [command, setCommand] = useState<string | null>(null)
  const [model, setModel] = useState(MODELS[0])
  const [effort, setEffort] = useState<Effort>('High')
  const [connectors, setConnectors] = useState<Conn[]>(CONNECTORS0)
  const [menu, setMenu] = useState<Menu>('none')
  const [listening, setListening] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const busyTimer = useRef<number | undefined>(undefined)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const hasContent = value.trim().length > 0 || mentions.length > 0 || !!command

  useEffect(() => () => window.clearTimeout(busyTimer.current), [])

  /* @ and / at the end of the input open their pickers; typing past them closes. */
  const onChange = (v: string) => {
    setValue(v)
    if (v.endsWith('@')) setMenu('at')
    else if (v.endsWith('/') && (v.length === 1 || v[v.length - 2] === ' ')) setMenu('slash')
    else if (menu === 'at' || menu === 'slash') setMenu('none')
  }
  const pickSource = (s: Source) => {
    setMentions((m) => (m.some((x) => x.label === s.label) ? m : [...m, s]))
    setValue((v) => v.replace(/@$/, ''))
    setMenu('none'); taRef.current?.focus()
  }
  const pickCommand = (cmd: string) => {
    setCommand(cmd)
    setValue((v) => v.replace(/\/$/, ''))
    setMenu('none'); taRef.current?.focus()
  }

  const send = () => {
    if (!hasContent) return
    setPhase('busy'); setValue(''); setMentions([]); setCommand(null); setMenu('none')
    busyTimer.current = window.setTimeout(() => setPhase('idle'), 2600)
  }
  const stop = () => { window.clearTimeout(busyTimer.current); setPhase('idle') }

  const pill = 'flex h-8 items-center gap-1 rounded-full px-2.5 text-[12.5px] transition-colors'

  return (
    <div className="w-full max-w-[480px]">
      <div className="relative rounded-[var(--r-lg)] px-4 pb-2.5 pt-3" style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-line)', boxShadow: 'var(--shadow-composer)' }}>
        {/* Context chips — @ sources and the active / command, above the field. */}
        {(mentions.length > 0 || command) && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {command && (
              <span className="flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-[12px] font-medium" style={{ background: 'var(--wash-4)', color: 'var(--text-dim)' }}>
                <span style={{ color: 'var(--muted)' }}><Icon.Slash /></span>{command}
                <button type="button" aria-label="Remove command" onClick={() => setCommand(null)} className="press grid h-4 w-4 place-items-center rounded-full hover:bg-[var(--wash-5)]" style={{ color: 'var(--muted)' }}><Icon.XSmall /></button>
              </span>
            )}
            {mentions.map((s) => {
              const meta = SOURCE_META[s.kind]
              return (
                <span key={s.label} className="flex items-center gap-1.5 rounded-[8px] py-1 pl-1.5 pr-1.5 text-[12px]" style={{ background: 'var(--wash-3)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>
                  <meta.Logo size={12} /><span className="max-w-[150px] truncate">{s.label}</span>
                  <button type="button" aria-label={`Remove ${s.label}`} onClick={() => setMentions((m) => m.filter((x) => x.label !== s.label))} className="press grid h-4 w-4 place-items-center rounded-full hover:bg-[var(--wash-4)]" style={{ color: 'var(--muted)' }}><Icon.XSmall /></button>
                </span>
              )
            })}
          </div>
        )}

        <textarea
          ref={taRef} rows={1} value={value} onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } if (e.key === 'Escape') setMenu('none') }}
          placeholder={phase === 'busy' ? 'AAVA is working…' : 'Ask anything — @ for sources, / for commands'}
          disabled={phase === 'busy'}
          className="h-[24px] max-h-[120px] w-full resize-none bg-transparent text-[14px] placeholder:text-[var(--muted)] focus-visible:outline-none"
          style={{ color: 'var(--text)' }} />

        {/* @ sources / commands / attach / connectors / model / effort menus all open upward. */}
        <AnimatePresence>
          {menu !== 'none' && (
            <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }} transition={{ duration: 0.14 }}
              role="menu"
              className={`absolute bottom-full z-50 mb-2 overflow-hidden rounded-[12px] p-1 shadow-xl ${menu === 'model' || menu === 'effort' ? 'right-4 w-[200px]' : 'left-4 w-[268px]'}`}
              style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
              {menu === 'at' && (<>
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[.1em]" style={{ color: 'var(--muted-deep)' }}>Add a source</div>
                {AT_SOURCES.map((s) => { const meta = SOURCE_META[s.kind]; return (
                  <button key={s.label} type="button" onClick={() => pickSource(s)} className="press flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-[var(--wash-3)]">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px]" style={{ background: 'var(--wash-3)' }}><meta.Logo size={13} /></span>
                    <span className="min-w-0"><span className="block truncate text-[12.5px]" style={{ color: 'var(--text-dim)' }}>{s.label}</span><span className="block truncate text-[11px]" style={{ color: 'var(--muted)' }}>{s.sub}</span></span>
                  </button>
                ) })}
              </>)}
              {menu === 'slash' && (<>
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[.1em]" style={{ color: 'var(--muted-deep)' }}>Commands</div>
                {SLASH_COMMANDS.map((c) => (
                  <button key={c.cmd} type="button" onClick={() => pickCommand(c.cmd)} className="press flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-[var(--wash-3)]">
                    <span className="mono text-[12.5px]" style={{ color: 'var(--text-dim)' }}>/{c.cmd}</span>
                    <span className="ml-auto truncate text-[11px]" style={{ color: 'var(--muted)' }}>{c.hint}</span>
                  </button>
                ))}
              </>)}
              {menu === 'plus' && (<>
                <button type="button" onClick={() => setMenu('none')} className="press flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[12.5px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--text-dim)' }}><Icon.Paperclip />Add files or photos<span className="mono ml-auto text-[11px]" style={{ color: 'var(--muted-deep)' }}>⌘U</span></button>
                <div className="my-1 h-px" style={{ background: 'var(--glass-line-soft)' }} />
                <button type="button" onClick={() => setMenu('connectors')} className="press flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[12.5px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--text-dim)' }}>
                  <Icon.Connector />Connectors
                  <span className="mono ml-auto mr-1 text-[11px]" style={{ color: 'var(--muted)' }}>{connectors.filter((c) => c.on).length} on</span>
                  <span style={{ color: 'var(--muted-deep)' }}><Icon.ChevronRight /></span>
                </button>
              </>)}
              {menu === 'connectors' && (<>
                <button type="button" onClick={() => setMenu('plus')} className="press flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-[.08em] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted-deep)' }}>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>Connectors
                </button>
                <button type="button" onClick={() => setMenu('none')} className="press flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[12.5px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--text-dim)' }}><Icon.Gear />Manage connectors</button>
                <div className="my-1 h-px" style={{ background: 'var(--glass-line-soft)' }} />
                {connectors.map((c) => (
                  <button key={c.id} type="button" role="menuitemcheckbox" aria-checked={c.on} onClick={() => setConnectors((cs) => cs.map((x) => (x.id === c.id ? { ...x, on: !x.on } : x)))} className="press flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[12.5px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--text-dim)' }}>
                    <span className="h-4 w-4 shrink-0 rounded-[5px]" style={{ background: c.hue }} aria-hidden />{c.name}<Toggle on={c.on} />
                  </button>
                ))}
              </>)}
              {menu === 'model' && MODELS.map((m) => (
                <button key={m} type="button" onClick={() => { setModel(m); setMenu('none') }} className="press flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-[12.5px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: m === model ? 'var(--text)' : 'var(--text-dim)' }}>
                  {m}{m === model && <span className="ml-auto"><Icon.Check /></span>}
                </button>
              ))}
              {menu === 'effort' && EFFORTS.map((e) => (
                <button key={e} type="button" onClick={() => { setEffort(e); setMenu('none') }} className="press flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-[12.5px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: e === effort ? 'var(--text)' : 'var(--text-dim)' }}>
                  {e}{e === effort && <span className="ml-auto"><Icon.Check /></span>}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative mt-1.5 flex items-center gap-1.5">
          {/* Attach — a filled disc that flips + to × while its menu is open. */}
          <button type="button" aria-label="Add files or connectors" aria-expanded={menu === 'plus'} onClick={() => setMenu(menu === 'plus' ? 'none' : 'plus')}
            className="press grid h-8 w-8 place-items-center rounded-full transition-colors" style={{ color: 'var(--text-dim)', background: menu === 'plus' ? 'var(--wash-5)' : 'var(--wash-4)' }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={menu === 'plus' ? 'x' : 'plus'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.14 }} className="grid place-items-center">
                {menu === 'plus' ? <Icon.X /> : <Icon.Plus />}
              </motion.span>
            </AnimatePresence>
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            {/* Model picker. */}
            <button type="button" aria-label="Select model" onClick={() => setMenu(menu === 'model' ? 'none' : 'model')} className={`press hover:bg-[var(--wash-4)] ${pill}`} style={{ color: 'var(--text-dim)', background: menu === 'model' ? 'var(--wash-4)' : 'transparent' }}>{model}<Icon.Chevron /></button>

            {/* Effort. */}
            <button type="button" aria-label="Select effort" onClick={() => setMenu(menu === 'effort' ? 'none' : 'effort')} className={`press hover:bg-[var(--wash-4)] ${pill}`} style={{ color: 'var(--muted)', background: menu === 'effort' ? 'var(--wash-4)' : 'transparent' }}>{effort}<Icon.Chevron /></button>

            {/* Dictation — mic becomes a three-bar equalizer while listening. */}
            <button type="button" aria-label={listening ? 'Stop dictation' : 'Start dictation'} aria-pressed={listening} onClick={() => setListening((l) => !l)}
              className="press grid h-8 w-8 place-items-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-[0.94] hover:bg-[var(--wash-4)]"
              style={listening ? { background: 'var(--wash-5)', color: 'var(--text)' } : { color: 'var(--muted)' }}>
              {listening ? <Waveform /> : <Icon.Mic />}
            </button>

            {/* Send ↔ Stop. */}
            {phase === 'busy' ? (
              <button type="button" aria-label="Stop" onClick={stop} className="press relative grid h-8 w-8 place-items-center rounded-full" style={{ background: 'var(--text)', color: 'var(--on-text)' }}>
                <span className="absolute inset-0 rounded-full" style={{ border: '1.5px solid transparent', borderTopColor: 'var(--on-text)', opacity: 0.5, animation: 'ilib-spin .7s linear infinite' }} />
                <span className="h-[9px] w-[9px] rounded-[2px]" style={{ background: 'var(--on-text)' }} />
              </button>
            ) : (
              <button type="button" aria-label="Send message" onClick={send} disabled={!hasContent} className="press grid h-8 w-8 place-items-center rounded-full transition-opacity disabled:opacity-35" style={{ background: 'var(--text)', color: 'var(--on-text)' }}>
                <Icon.Send />
              </button>
            )}
          </div>
          <style>{`@keyframes ilib-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    </div>
  )
}

export function PromptComposerPreview() {
  /* Bottom-anchored in a tall frame — the composer lives at the foot of the
     screen in the real app, so its @ / and model menus open upward into empty
     space above it. Room here for those menus rather than clipping them. */
  return (
    <div className="relative overflow-hidden rounded-[var(--r-lg)]"
      style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)', backgroundImage: 'radial-gradient(var(--glass-line-soft) 1px, transparent 1px)', backgroundSize: '22px 22px' }}>
      <div className="flex items-end justify-center p-8" style={{ minHeight: 420 }}>
        <ComposerDemo />
      </div>
    </div>
  )
}
