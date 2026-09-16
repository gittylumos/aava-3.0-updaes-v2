import { useEffect, useRef, useState } from 'react'
import type { Chip, Message as Msg, TabId } from '../../state/types'
import { Message } from './Message'
import { Chips } from './Chips'
import type { BacklogDoc } from '../../prd/backlog'
import type { InsightView } from '../../prd/insight'
import type { ReportView } from '../../prd/report'

interface Props {
  messages: Msg[]
  chips: Chip[]
  preview: React.ReactNode
  onChip: (sends: string) => void
  onAccept: (beat: string) => void
  onDismiss: (id: string) => void
  onOpenFile?: (file: string) => void
  onOpenTab?: (tab: TabId) => void
  onOpenArtifact?: (doc?: BacklogDoc, insight?: InsightView, report?: ReportView) => void
  onOpenAgentArtifact?: (id: string) => void
  onOpenAgentDoc?: () => void
  onRecordAnswer?: (messageId: string, text: string) => void
  onToast?: (text: string) => void
  onRevise?: (messageId: string) => void
  revisingId?: string | null
  onReviseSend?: (messageId: string, note: string) => void
  onReviseCancel?: () => void
  /** The message whose block is pinned to the composer slot — its block is
      skipped inline while it waits there. */
  pinnedId?: string
}

export function Thread({ messages, chips, preview, onChip, onAccept, onDismiss, onOpenFile, onOpenTab, onOpenArtifact, onOpenAgentArtifact, onOpenAgentDoc, onRecordAnswer, onToast, onRevise, revisingId, onReviseSend, onReviseCancel, pinnedId }: Props) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'end',
    })
  }, [messages])

  /* Contiguous superseded messages (a revised step's invalidated downstream) fold
     into a single "v1" record rather than a run of dimmed rows. */
  const rows: ({ kind: 'msg'; m: Msg } | { kind: 'superseded'; items: Msg[] })[] = []
  for (const m of messages) {
    if (m.superseded) {
      const last = rows[rows.length - 1]
      if (last && last.kind === 'superseded') last.items.push(m)
      else rows.push({ kind: 'superseded', items: [m] })
    } else {
      rows.push({ kind: 'msg', m })
    }
  }

  return (
    <div role="log" aria-live="polite" aria-label="Conversation" className="flex flex-col">
      {rows.map((row, i) => row.kind === 'superseded' ? (
        <SupersededGroup key={`sup-${i}`} items={row.items} />
      ) : (
        <Message key={row.m.id} msg={row.m} preview={preview} onAccept={onAccept} onDismiss={onDismiss}
          onOpenFile={onOpenFile} onOpenTab={onOpenTab} onOpenArtifact={onOpenArtifact} onOpenAgentArtifact={onOpenAgentArtifact} onOpenAgentDoc={onOpenAgentDoc} onRecordAnswer={onRecordAnswer}
          onToast={onToast} onRevise={onRevise} revisingId={revisingId} onReviseSend={onReviseSend} onReviseCancel={onReviseCancel} pinned={row.m.id === pinnedId} />
      ))}
      <Chips chips={chips} onPick={onChip} />
      <div ref={end} />
    </div>
  )
}

/* A short label for a superseded message — what it was, so the collapsed v1
   record reads as a real list of the work being replaced. */
function summarise(m: Msg): string {
  const b = m.block
  if (b?.kind === 'document') return b.name
  if (b?.kind === 'tools') return b.title ?? 'Tool run'
  if (b?.kind === 'decision') return b.title
  if (b?.kind === 'sync') return b.title
  if (b?.kind === 'links') return 'Jira links'
  return m.lines[0]?.slice(0, 64) ?? 'Step'
}

/* The kept "v1" record — invalidated downstream, collapsed by default, expandable
   to the list of steps it replaced. Never deleted, per the revise design. */
function SupersededGroup({ items }: { items: Msg[] }) {
  const [open, setOpen] = useState(false)
  const labels = items.map(summarise).filter(Boolean)
  return (
    <div className="mb-5 rounded-[var(--r-md)]" style={{ background: 'var(--wash-1)', border: '1px dashed var(--glass-line)' }}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3 py-2 text-left">
        <span className="grid h-4 w-4 shrink-0 place-items-center" style={{ color: 'var(--muted-deep)' }}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 7v5h5" /><path d="M3.5 12a8.5 8.5 0 1 0 2.2-8L3 7" />
          </svg>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[.1em]" style={{ color: 'var(--muted-deep)' }}>Superseded · v1</span>
        <span className="text-[12px]" style={{ color: 'var(--muted)' }}>{labels.length} step{labels.length === 1 ? '' : 's'} replaced by your revision</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
          className="ml-auto shrink-0 transition-transform" style={{ color: 'var(--muted-deep)', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul className="grid gap-1 px-3 pb-2.5 pl-9">
          {labels.map((l, i) => (
            <li key={i} className="text-[12.5px] line-through" style={{ color: 'var(--muted)' }}>{l}</li>
          ))}
          <li className="mt-1 text-[11px] no-underline" style={{ color: 'var(--muted-deep)' }}>Kept as a record — not deleted.</li>
        </ul>
      )}
    </div>
  )
}
