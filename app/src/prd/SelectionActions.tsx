/* The inline comment bar — a contextual AI toolbar anchored beneath a text
 * selection in the document canvas. Select text, pick a quick action or
 * describe the edit, watch the rewrite stream in, then Keep or Discard.
 *
 * Keep doesn't apply anything by itself — it hands the rewrite to the same
 * changes tray every other inline comment already stages into (so several
 * edits still batch into one "Applying your comments" turn); this component
 * only owns the per-selection capture, not the apply/narrate step.
 *
 * Text edits are scripted, not a live model — the quick actions and the
 * free-text prompt both run a small deterministic rewrite so the demo never
 * needs a real LLM call to feel alive. */
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { StreamedText } from '../components/chat/StreamedText'

type Mode = 'idle' | 'thinking' | 'streaming' | 'result'
type ActionId = 'explain' | 'improve' | 'shorten' | 'grammar' | 'prompt'

interface QuickAction { id: ActionId; label: string; icon: React.ReactNode; busyLabel: string }

const ICONS = {
  explain: <path d="M12 17h.01M12 13.5a1.5 1.5 0 1 1 1.5-1.5c0 1-1.5 1.2-1.5 2.5M12 3a9 9 0 1 0 9 9" />,
  improve: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
  shorten: <><path d="M6 6l12 12M6 18 18 6" /></>,
  grammar: <><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 9h8M8 13h5" /></>,
  send: <path d="M12 19V5M5 12l7-7 7 7" />,
  check: <path d="m5 12 4 4L19 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  retry: <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />,
}
const svgProps = { viewBox: '0 0 24 24', width: 13, height: 13, fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

const ACTIONS: QuickAction[] = [
  { id: 'explain', label: 'Explain', icon: ICONS.explain, busyLabel: 'Explaining' },
  { id: 'improve', label: 'Improve', icon: ICONS.improve, busyLabel: 'Improving' },
  { id: 'shorten', label: 'Shorten', icon: ICONS.shorten, busyLabel: 'Shortening' },
  { id: 'grammar', label: 'Fix grammar', icon: ICONS.grammar, busyLabel: 'Fixing grammar' },
]

/* No live model behind this — three small, honest, deterministic rewrites
   stand in for one. A free-text prompt reuses "improve", since interpreting
   an arbitrary instruction needs a real model this prototype doesn't have. */
function rewrite(action: ActionId, text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (action === 'shorten') {
    const words = clean.split(' ')
    const cut = Math.max(4, Math.round(words.length * 0.65))
    const short = words.slice(0, cut).join(' ').replace(/[,.;:]+$/, '')
    return short + '.'
  }
  if (action === 'grammar') {
    const capped = clean.charAt(0).toUpperCase() + clean.slice(1)
    return capped.replace(/\.*$/, '.')
  }
  // improve / prompt: tighten filler words, keep the meaning.
  return clean
    .replace(/\b(just|really|very|actually|basically)\b\s*/gi, '')
    .replace(/\bcan\b/i, 'should')
    .replace(/\s+/g, ' ')
    .trim()
}
function explanation(text: string): string {
  const words = text.trim().split(' ').length
  return `This passage sets ${words > 10 ? 'the specific constraint' : 'a short but load-bearing requirement'} the rest of the section depends on — worth keeping precise if it changes.`
}

export interface SelectionActionsProps {
  quote: string
  top: number
  left: number
  onKeep: (rewrite: string) => void
  onDiscard: () => void
}

export function SelectionActions({ quote, top, left, onKeep, onDiscard }: SelectionActionsProps) {
  const [mode, setMode] = useState<Mode>('idle')
  const [action, setAction] = useState<ActionId>('improve')
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  /* Bumped on every run so Retry gets a fresh StreamedText id — reusing the
     same id would read as "already finished" and skip straight to the end
     instead of streaming again. */
  const runId = useRef(0)

  useEffect(() => { inputRef.current?.focus() }, [])

  const run = (id: ActionId) => {
    runId.current += 1
    setAction(id)
    setMode('thinking')
  }

  useEffect(() => {
    if (mode !== 'thinking') return
    const t = window.setTimeout(() => {
      setOutput(action === 'explain' ? explanation(quote) : rewrite(action, quote))
      setMode('streaming')
    }, 620)
    return () => clearTimeout(t)
  }, [mode, action, quote])

  const busyLabel = ACTIONS.find((a) => a.id === action)?.busyLabel ?? 'Working'
  const hasPrompt = prompt.trim().length > 0

  return (
    <div
      className="absolute z-20"
      style={{ top, left, animation: 'aava-pop-in 200ms var(--ease-out) both', transformOrigin: 'top left' }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex max-w-[380px] flex-col overflow-hidden rounded-[14px] shadow-xl" style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
        <div className="border-b px-3 py-2" style={{ borderColor: 'var(--glass-line-soft)' }}>
          <span className="line-clamp-2 text-[11px] italic" style={{ color: 'var(--muted)' }}>“{quote}”</span>
        </div>

        <div className="flex h-11 items-center gap-1 px-1.5">
          {(mode === 'thinking' || mode === 'streaming') && (
            <span className="flex min-w-0 items-center gap-2 px-2 text-[12.5px]" style={{ color: 'var(--text-dim)' }}>
              <span className="size-3 shrink-0 rounded-full" style={{ border: '1.5px solid var(--glass-line)', borderTopColor: 'var(--text-dim)', animation: 'aava-sel-spin .7s linear infinite' }} />
              {mode === 'thinking' ? (
                <span className="aava-sel-shimmer whitespace-nowrap">{busyLabel}…</span>
              ) : (
                <span className="min-w-0 truncate">
                  <StreamedText id={`selaction-${runId.current}`} text={output} onDone={() => setMode('result')} />
                </span>
              )}
            </span>
          )}

          {mode === 'result' && (
            <>
              {action === 'explain' ? (
                <>
                  <span className="min-w-0 flex-1 truncate px-2 text-[12.5px]" style={{ color: 'var(--text-dim)' }}>{output}</span>
                  <button type="button" onClick={onDiscard}
                    className="press inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-medium transition-colors hover:bg-[var(--wash-3)]"
                    style={{ color: 'var(--muted)' }}>
                    <svg {...svgProps}>{ICONS.close}</svg>Close
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => { onKeep(output); }}
                    className="press inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-medium transition-[opacity,transform] hover:opacity-90 active:scale-[0.96]"
                    style={{ background: 'var(--text)', color: 'var(--on-text)' }}>
                    <svg {...svgProps}>{ICONS.check}</svg>Keep
                  </button>
                  <button type="button" onClick={onDiscard}
                    className="press inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-medium transition-colors hover:bg-[var(--wash-3)]"
                    style={{ color: 'var(--muted)' }}>
                    <svg {...svgProps}>{ICONS.close}</svg>Discard
                  </button>
                  <span className="mx-0.5 h-4 w-px shrink-0" style={{ background: 'var(--glass-line)' }} />
                  <button type="button" aria-label="Try again" onClick={() => run(action)}
                    className="press grid size-7 shrink-0 place-items-center rounded-full transition-[background-color,transform] hover:bg-[var(--wash-3)] active:scale-[0.96]"
                    style={{ color: 'var(--muted)' }}>
                    <svg {...svgProps}>{ICONS.retry}</svg>
                  </button>
                </>
              )}
            </>
          )}

          {mode === 'idle' && (
            <>
              <AnimatePresence initial={false} mode="wait">
                {hasPrompt ? (
                  <motion.form key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                    className="flex min-w-0 flex-1 items-center"
                    onSubmit={(e) => { e.preventDefault(); run('prompt') }}>
                    <input ref={inputRef} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe edits" aria-label="Describe edits"
                      className="h-7 min-w-0 flex-1 bg-transparent px-2 text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-none"
                      style={{ color: 'var(--text)' }} />
                    <button type="submit" aria-label="Send edit instruction"
                      className="press ml-1 grid size-7 shrink-0 place-items-center rounded-full active:scale-[0.94]"
                      style={{ background: 'var(--text)', color: 'var(--on-text)' }}>
                      <svg {...svgProps} strokeWidth={2.3}>{ICONS.send}</svg>
                    </button>
                  </motion.form>
                ) : (
                  <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                    className="flex min-w-0 flex-1 items-center gap-0.5">
                    <input ref={inputRef} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe edits" aria-label="Describe edits"
                      className="h-7 w-[104px] shrink-0 bg-transparent pl-2 text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-none"
                      style={{ color: 'var(--text)' }} />
                    <span className="mx-0.5 h-4 w-px shrink-0" style={{ background: 'var(--glass-line)' }} />
                    {ACTIONS.map((a) => (
                      <button key={a.id} type="button" onClick={() => run(a.id)}
                        className="press flex h-7 shrink-0 items-center gap-1 rounded-full px-2 text-[12px] font-medium transition-colors hover:bg-[var(--wash-3)]"
                        style={{ color: 'var(--muted)' }}>
                        <svg {...svgProps}>{a.icon}</svg>{a.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes aava-sel-spin { to { transform: rotate(360deg) } }
        .aava-sel-shimmer {
          background: linear-gradient(90deg, var(--muted-deep) 0%, var(--text) 20%, var(--muted-deep) 40%);
          background-size: 200% 100%; -webkit-background-clip: text; background-clip: text;
          color: transparent; animation: aava-sel-sheen 1.4s linear infinite;
        }
        @keyframes aava-sel-sheen { to { background-position: -200% 0; } }
      `}</style>
    </div>
  )
}
