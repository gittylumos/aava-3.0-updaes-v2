import { useEffect, useState } from 'react'
import { useRunTimeline } from '../../state/runTimeline'
import { ToolSteps } from './ToolSteps'
import { CitationPills } from './InlineSource'
import { useOpenUrl } from '../../state/openUrl'
import { urlForCitation, urlForSource } from '../../state/web'

/* The run, as a short numbered timeline in the conversation.
 *
 * The scenario's prep steps are grouped into a handful of stages (a 10-step
 * run reads as 6), one node each on a single line. Every stage folds to one
 * line: done ones show a tick and their headline result. Opened, a stage reads
 * the way the conversation used to — the tool rows with their sources, then a
 * one-line summary with its citations — on the page itself, no card around it.
 * The stage the run is parked on opens by itself and says it is waiting on you.
 */
export function RunTimeline() {
  const ctx = useRunTimeline()
  const openUrl = useOpenUrl()
  const sc = ctx?.scenario
  const stages = sc?.timeline ?? []
  const at = ctx?.prepAt ?? 0
  const keyIndex = (k: string) => sc?.prep.findIndex((p) => p.key === k) ?? -1

  /* A stage is done when every step in it is behind the run, current when the
     run is parked inside it. */
  const status = stages.map((st) => {
    const idx = st.keys.map(keyIndex).filter((i) => i >= 0)
    const last = Math.max(...idx)
    const first = Math.min(...idx)
    return last < at ? 'done' : first <= at && at <= last ? 'current' : 'todo'
  })
  const currentIdx = status.indexOf('current')

  const [open, setOpen] = useState<Set<number>>(() => new Set(currentIdx >= 0 ? [currentIdx] : []))
  useEffect(() => {
    if (currentIdx >= 0) setOpen((s) => (s.has(currentIdx) ? s : new Set([...s, currentIdx])))
  }, [currentIdx])

  if (!sc || !stages.length) return null
  const toggle = (i: number) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n })
  const doneCount = status.filter((s) => s === 'done').length

  return (
    <div className="mb-5">
      <p className="mb-2.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>{sc.capability?.name ?? 'Run'}</span>
        {' · '}{doneCount} of {stages.length} done
      </p>
      <ol>
        {stages.map((st, i) => {
          const state = status[i]
          const isOpen = open.has(i)
          const last = i === stages.length - 1
          const headline = st.tools?.at(-1)?.result
          return (
            <li key={st.title} className="grid grid-cols-[24px_1fr] gap-x-3">
              <div className="flex flex-col items-center">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums" aria-hidden
                  style={{
                    background: state === 'done' ? 'var(--wash-4)' : state === 'current' ? 'var(--text)' : 'transparent',
                    color: state === 'current' ? 'var(--on-text)' : state === 'done' ? 'var(--text-dim)' : 'var(--muted)',
                    border: state === 'todo' ? '1.5px dashed var(--glass-line)' : 'none',
                    boxShadow: state === 'current' && ctx?.waiting ? '0 0 0 3px var(--warn)' : undefined,
                  }}>
                  {state === 'done'
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17l9-10" /></svg>
                    : i + 1}
                </span>
                {!last && <span className="w-px flex-1" style={{ background: 'var(--glass-line)', minHeight: 10 }} aria-hidden />}
              </div>

              <div className={last ? '' : 'pb-2'}>
                <button type="button" onClick={() => toggle(i)} aria-expanded={isOpen}
                  className="press flex min-h-6 w-full items-center gap-2 text-left">
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium"
                    style={{ color: state === 'todo' ? 'var(--muted)' : 'var(--text)' }}>{st.title}</span>
                  {state === 'current' && ctx?.waiting ? (
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold" style={{ background: 'var(--wash-3)', color: 'var(--text-dim)' }}>Waiting on you</span>
                  ) : state === 'done' && headline ? (
                    <span className="mono hidden max-w-[180px] shrink-0 truncate text-[11.5px] sm:inline" style={{ color: 'var(--muted)' }}>{headline}</span>
                  ) : state === 'todo' ? (
                    <span className="shrink-0 text-[11.5px]" style={{ color: 'var(--muted)' }}>Up next</span>
                  ) : null}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
                    className="shrink-0 transition-transform" style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(90deg)' : 'none' }}>
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>

                {isOpen && state !== 'todo' && (
                  <div className="mb-2 mt-2 grid gap-2.5">
                    {st.tools && st.tools.length > 0 && (
                      <ToolSteps steps={st.tools} done={st.tools.length}
                        onOpenSource={(step) => {
                          const url = openUrl && urlForSource(step.source, step.result, openUrl.ticket)
                          if (url) openUrl!.open(url)
                          else ctx?.onToast(`Opening ${step.result} in ${step.source}`)
                        }}
                        onOpenTab={ctx?.onOpenTab} />
                    )}
                    {st.summary?.map((line, k) => (
                      <p key={k} className="text-[14px] leading-relaxed" style={{ color: 'var(--text)' }}>
                        {line}
                        {k === st.summary!.length - 1 && st.citations && (
                          <CitationPills sources={st.citations} onOpen={(s) => {
                            const url = openUrl && urlForCitation(s as Parameters<typeof urlForCitation>[0], openUrl.ticket)
                            if (url) openUrl!.open(url)
                            else ctx?.onToast(`Opening ${s.title}`)
                          }} />
                        )}
                      </p>
                    ))}
                    {st.app && ctx?.preview && (
                      <div className="mt-1 w-full max-w-[440px] overflow-hidden rounded-[var(--r-md)]" style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
                        <div className="relative h-[150px] overflow-hidden" style={{ background: 'var(--preview-bg)' }}>
                          <div aria-hidden className="pointer-events-none origin-top-left select-none" style={{ transform: 'scale(.62)', width: '161%' }}>{ctx.preview}</div>
                        </div>
                        <div className="flex items-center gap-3 px-3.5 py-3" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>
                          <div className="grid min-w-0 flex-1 gap-0.5">
                            <span className="truncate text-[13px] font-semibold">feedback-form</span>
                            <span className="mono truncate text-[11px]" style={{ color: 'var(--muted)' }}>localhost:4200 · Running</span>
                          </div>
                          <button type="button" onClick={() => ctx.onOpenTab('preview')}
                            className="press rounded-full px-3.5 py-1.5 text-[12px] font-medium hover:bg-[var(--wash-4)] hover:text-[var(--text)]"
                            style={{ background: 'var(--wash-3)', color: 'var(--text-dim)', minHeight: 'var(--hit)', border: '1px solid var(--glass-line)' }}>
                            Open
                          </button>
                        </div>
                      </div>
                    )}
                    {st.tab && (
                      <button type="button" onClick={() => ctx?.onOpenTab(st.tab!.id)}
                        className="mono press w-fit text-[12px] underline underline-offset-[3px]" style={{ color: 'var(--text-dim)' }}>
                        {st.tab.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
