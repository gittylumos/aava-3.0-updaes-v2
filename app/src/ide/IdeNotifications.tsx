/* Gate notifications for the IDE surface (Task 4).
 *
 * surfaces-plan C5/C7: VS Code notifications are few, one at a time, with
 * actions, never modal — so AAVA raises a toast ONLY when a human-in-the-loop
 * gate opens. The gate itself stays pinned in the AAVA panel. */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { useJourney } from '../state/useJourney'
import type { Message } from '../state/types'
import { liveGate } from '../state/gates'
import type { IdeNotice } from './types'
import { sessionKeyOf } from './session'

type Journey = ReturnType<typeof useJourney>

const AUTO_DISMISS_MS = 8000

const none = (ns: IdeNotice[]): IdeNotice[] => (ns.length ? [] : ns)

function gateTitle(m: Message): string {
  const b = m.block
  if (b && (b.kind === 'decision' || b.kind === 'confirm') && b.title) return b.title
  return 'A decision'
}

// oxlint-disable-next-line react/only-export-components
export function useGateNotices(j: Journey, onReview: () => void): { notices: IdeNotice[]; dismiss: (id: string) => void } {
  const [notices, setNotices] = useState<IdeNotice[]>([])
  /* Gates already announced in this page session, by session + gate identity.
     The engine re-appends the same gate (a new message id) after every reply
     while it waits, so the message id cannot be the identity. */
  const seen = useRef(new Set<string>())
  const suppressed = useRef(false)
  const session = useRef<string | null | undefined>(undefined)
  const reviewRef = useRef(onReview)
  useEffect(() => { reviewRef.current = onReview }, [onReview])

  const dismiss = useCallback((id: string) => {
    setNotices((ns) => ns.filter((n) => n.id !== id))
  }, [])

  const sessionKey = sessionKeyOf(j.state)
  const gate = liveGate(j.state.messages)
  const title = gate ? gateTitle(gate) : ''
  const gateKey = gate
    ? `${sessionKey ?? 'home'}|${gate.block?.kind}|${title}|${j.state.playground.prepAt}`
    : null

  /* A General / First-time switch restarts the demo, so gates announced in
     the previous run should announce again when the presenter replays them. */
  useEffect(() => {
    seen.current.clear()
    suppressed.current = false
  }, [j.state.firstTime])

  useEffect(() => {
    // Session changed: drop any toast from the old one.
    if (session.current !== sessionKey) {
      session.current = sessionKey
      setNotices(none)
    }
    // Nothing waiting on the user: nothing to keep on screen.
    if (!gateKey) { setNotices(none); return }
    if (suppressed.current || seen.current.has(gateKey)) return
    seen.current.add(gateKey)
    const id = `gate:${gateKey}`
    // One at a time — a new gate replaces whatever was showing.
    setNotices([{
      id,
      text: `AAVA: ${title} — waiting on you.`,
      actions: [
        { label: "Don't show again", run: () => { suppressed.current = true; setNotices([]) } },
        { label: 'Open AAVA', primary: true, run: () => { reviewRef.current(); setNotices((ns) => ns.filter((n) => n.id !== id)) } },
      ],
    }])
  }, [sessionKey, gateKey, title])

  // Auto-dismiss the visible notice — the latest, the one NoticeStack shows.
  const visibleId = notices.at(-1)?.id
  useEffect(() => {
    if (!visibleId) return
    const t = window.setTimeout(() => dismiss(visibleId), AUTO_DISMISS_MS)
    return () => window.clearTimeout(t)
  }, [visibleId, dismiss])

  return { notices, dismiss }
}

export function NoticeStack({ notices, onDismiss }: { notices: IdeNotice[]; onDismiss: (id: string) => void }) {
  const notice = notices[notices.length - 1]
  return (
    <div role="status" aria-live="polite" className="fixed z-50" style={{ bottom: 30, right: 12 }}>
      <style>{noticeCss}</style>
      {notice && (
        <div key={notice.id} className="ide-notice grid gap-2.5 px-3 py-2.5"
          style={{ width: 380, background: 'var(--slab-raised)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-pop)', borderRadius: 4 }}>
          <div className="flex items-start gap-2">
            <span aria-hidden className="shrink-0 text-[14px] leading-[18px]" style={{ color: 'var(--text-dim)' }}>ⓘ</span>
            <p className="min-w-0 flex-1 text-[13px] leading-[18px]" style={{ color: 'var(--text)' }}>{notice.text}</p>
            <button type="button" onClick={() => onDismiss(notice.id)} aria-label="Close notification"
              className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[3px] text-[14px] leading-none hover:bg-[var(--wash-2)]"
              style={{ color: 'var(--muted)' }}>
              ×
            </button>
          </div>
          {notice.actions && notice.actions.length > 0 && (
            <div className="flex items-center justify-end gap-2">
              {notice.actions.map((a) => (
                <button key={a.label} type="button" onClick={a.run}
                  className="h-[24px] rounded-[2px] px-2.5 text-[12px]"
                  style={a.primary
                    ? { background: 'var(--text)', color: 'var(--on-text)', border: '1px solid var(--text)' }
                    : { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}>
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const noticeCss = `
@keyframes ide-notice-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.ide-notice { animation: ide-notice-in 160ms ease-out 1; }
@media (prefers-reduced-motion: reduce) { .ide-notice { animation: none; } }`
