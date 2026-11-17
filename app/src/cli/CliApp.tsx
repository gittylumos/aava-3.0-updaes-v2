import { useEffect, useLayoutEffect, useRef } from 'react'
import { FeedbackApp, previewTemplate, readTemplate } from '../components/playground/FeedbackApp'
import { INK, INK_DIM, LineView, TerminalWindow } from './Terminal'
import { LOCAL_URL } from './text'
import type { Seg } from './types'
import { useCli } from './useCli'

/** AAVA as a CLI: a terminal window running `aava`, on the same journey engine. */
export default function CliApp() {
  const cli = useCli()
  const { j, list, preview } = cli
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  /* Follow the output, like a terminal does. Keyed on a cheap signature of the
     tail so it fires while a reply streams, not on unrelated renders. */
  const last = cli.lines[cli.lines.length - 1]
  const sig = `${cli.lines.length}|${last?.map((s) => s.text).join('') ?? ''}|${list?.key ?? ''}|${cli.promptLabel ?? ''}|${cli.promptHint ?? ''}|${cli.busy}`
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [sig])

  /* The "browser window" is modal: it takes focus (its close button), closes
     on Esc wherever focus is, and swallows every other key aimed outside it,
     so nothing reaches the prompt or a gate behind it. On close the prompt
     takes focus back. */
  const close = preview.close
  const closeRef = useRef(close)
  useEffect(() => { closeRef.current = close })
  useEffect(() => {
    if (!preview.open) { inputRef.current?.focus(); return }
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return }
      if (!(e.target instanceof Node && dialogRef.current?.contains(e.target))) {
        e.preventDefault(); e.stopPropagation()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [preview.open])

  /* Clicking a link must not leave the caret behind on the link. */
  const onLink = (l: NonNullable<Seg['link']>) => {
    cli.onLink(l)
    inputRef.current?.focus()
  }

  /* A click anywhere in the window puts the caret back in the prompt — unless
     the user is selecting text to copy. */
  const refocus = () => {
    if (window.getSelection()?.isCollapsed !== false) inputRef.current?.focus()
  }

  return (
    <>
      <TerminalWindow title="alex@macbook — aava — 120×40">
        <div
          ref={scrollRef}
          onClick={refocus}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.5, color: INK }}
        >
          <div role="log" aria-live="polite" aria-label="aava output">
            {cli.lines.map((line, i) => <LineView key={i} line={line} onLink={onLink} />)}
          </div>

          {list && (
            <div className="mb-1">
              {list.title && <div style={{ fontWeight: 600 }}>{list.title}</div>}
              {list.items.map((it, i) => {
                const on = i === list.sel
                const w = Math.max(...list.items.map((x) => [...x.label].length))
                return (
                  <div key={i} className="cursor-pointer whitespace-pre"
                    onClick={(e) => { e.stopPropagation(); cli.pick(i); inputRef.current?.focus() }}
                    style={{ fontWeight: on ? 600 : 400, opacity: on ? 1 : 0.75 }}>
                    {`${on ? '❯' : ' '} ${i + 1}. ${it.label.padEnd(w)}`}
                    {it.hint && <span style={{ opacity: 0.6 }}>{`   · ${it.hint}`}</span>}
                  </div>
                )
              })}
              <div style={{ color: INK_DIM }}>{'  ↑/↓ or type a number · enter to choose · esc to close'}</div>
              <div aria-hidden>{' '}</div>
            </div>
          )}

          {cli.busy && <div style={{ color: INK_DIM }}>✻ Working… <span style={{ opacity: 0.7 }}>(esc to interrupt)</span></div>}

          {cli.promptLabel && <div style={{ fontWeight: 600 }}>{cli.promptLabel}</div>}
          {cli.promptHint && <div style={{ color: INK_DIM }}>{cli.promptHint}</div>}
          <div className="flex items-center py-[3px]"
            style={{ borderTop: `1px solid ${INK_DIM}55`, borderBottom: `1px solid ${INK_DIM}55` }}>
            <span className="shrink-0 whitespace-pre" style={{ color: INK_DIM }}>{'› '}</span>
            <input
              ref={inputRef}
              autoFocus
              aria-label={cli.promptLabel ?? 'aava prompt'}
              spellCheck={false}
              autoComplete="off"
              value={cli.input}
              onChange={(e) => cli.setInput(e.target.value)}
              onKeyDown={cli.onKeyDown}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 outline-none"
              style={{ font: 'inherit', color: INK, caretColor: INK }}
            />
          </div>
          {cli.status
            ? <LineView line={cli.status} onLink={onLink} />
            : <div style={{ color: INK_DIM }}>{'  ? /help for commands · ↑/↓ to select · enter to open'}</div>}
        </div>
      </TerminalWindow>

      {preview.open && j.scenario && (
        <div className="fixed inset-0 z-50 grid place-items-center p-6" style={{ background: 'var(--scrim)' }}
          onClick={preview.close}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Browser — localhost:4200"
            className="flex h-[78dvh] w-full max-w-[880px] flex-col overflow-hidden rounded-[10px]"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-pop)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex h-[38px] shrink-0 items-center gap-3 px-3"
              style={{ background: 'var(--wash-2)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex gap-[7px]" aria-hidden>
                {[0, 1, 2].map((i) => <span key={i} className="block h-[11px] w-[11px] rounded-full" style={{ background: 'var(--border)' }} />)}
              </div>
              <div className="min-w-0 flex-1 truncate rounded-[6px] px-3 py-[3px] text-[12px]"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {`${LOCAL_URL}/feedback`}
              </div>
              <button ref={closeBtnRef} type="button" aria-label="Close browser" onClick={preview.close}
                className="grid h-[24px] w-[24px] place-items-center rounded-[6px] text-[16px] hover:bg-[var(--wash-4)]"
                style={{ color: 'var(--muted)' }}>×</button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto" style={{ background: 'var(--preview-bg)' }}>
              <FeedbackApp template={readTemplate(previewTemplate(j.scenario, j.state.playground))} onToast={() => {}} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
