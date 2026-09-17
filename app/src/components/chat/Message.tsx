import { useState } from 'react'
import { motion } from 'motion/react'
import type { Message as Msg, TabId } from '../../state/types'
import { TypingDots } from './TypingDots'
import { StreamedText } from './StreamedText'
import { Block } from './Blocks'
import { CitationPills } from './InlineSource'
import { Fragment } from 'react'
import { fadeUp } from '../../design/motion'
import type { BacklogDoc } from '../../prd/backlog'
import type { InsightView } from '../../prd/insight'
import type { ReportView } from '../../prd/report'

interface Props {
  msg: Msg
  preview: React.ReactNode
  onAccept: (beat: string) => void
  onDismiss: (id: string) => void
  onOpenFile?: (file: string) => void
  onOpenTab?: (tab: TabId) => void
  onOpenArtifact?: (doc?: BacklogDoc, insight?: InsightView, report?: ReportView) => void
  onOpenAgentArtifact?: (id: string) => void
  onOpenAgentDoc?: () => void
  onRecordAnswer?: (messageId: string, text: string) => void
  onToast?: (text: string) => void
  /** Rewind an executed gate — open the confirm modal, the id of the gate being
      edited in place, and the send/cancel of that edit. */
  onRevise?: (messageId: string) => void
  revisingId?: string | null
  onReviseSend?: (messageId: string, note: string, beat?: string) => void
  onReviseCancel?: () => void
  /** This message's block is pinned to the composer slot — skip it inline. */
  pinned?: boolean
}

export function Message({ msg, preview, onAccept, onDismiss, onOpenFile, onOpenTab, onOpenArtifact, onOpenAgentArtifact, onOpenAgentDoc, onRecordAnswer, onToast, onRevise, revisingId, onReviseSend, onReviseCancel, pinned }: Props) {
  if (msg.from === 'user') {
    return (
      <motion.div {...fadeUp(6)}
        className="mb-4 self-end rounded-[14px_14px_4px_14px] px-3.5 py-2 text-[14px] backdrop-blur-[16px]"
        style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-line)', maxWidth: '78%' }}>
        {msg.lines[0]}
      </motion.div>
    )
  }

  /* While this message's block is pinned to the composer slot, only its text
     lines belong in the thread. A block-only message (no lines) shows nothing
     inline until it is answered and un-pinned. */
  if (pinned && msg.lines.length === 0 && !msg.typing) return null

  /* No name label. Only one of the two speakers gets a bubble, and only one is
     right-aligned — the side of the column a message sits on already says who
     said it, so the label was repeating that on every single turn. */
  return (
    <motion.div {...fadeUp(6)} className="mb-5">
      {msg.typing ? <TypingDots /> : (
        <>
          {msg.stream
            ? <StreamingLines msg={msg} onToast={onToast} />
            : msg.lines.map((line, i) => (
                <Line key={i}>
                  {highlight(line)}
                  {i === msg.lines.length - 1 && msg.citations && (
                    <CitationPills sources={msg.citations} onOpen={onToast ? (s) => onToast(`Opening ${s.title}`) : undefined} />
                  )}
                </Line>
              ))}
          {msg.block && !pinned && (
            <Block block={msg.block} live={msg.live !== false} preview={preview}
              onAccept={onAccept} onDismiss={() => onDismiss(msg.id)} onOpenFile={onOpenFile}
              onOpenTab={onOpenTab} onOpenArtifact={onOpenArtifact} onOpenAgentArtifact={onOpenAgentArtifact} onOpenAgentDoc={onOpenAgentDoc}
              onRecordAnswer={(text) => onRecordAnswer?.(msg.id, text)} onToast={onToast} answer={msg.answer}
              revising={msg.id === revisingId}
              onRevise={onRevise ? () => onRevise(msg.id) : undefined}
              onReviseSend={onReviseSend ? (note, beat) => onReviseSend(msg.id, note, beat) : undefined}
              onReviseCancel={onReviseCancel} />
          )}
        </>
      )}
    </motion.div>
  )
}

/* Inline **highlight** for a non-streamed line — the emphasised phrase reads a
   shade brighter and heavier, so a skimming reader catches the key figures
   without reading the whole paragraph. Only applied to settled (non-streaming)
   lines, where the whole line is known up front. */
function highlight(text: string): React.ReactNode {
  if (!text.includes('**')) return text
  const out: React.ReactNode[] = []
  const re = /\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>)
    out.push(<strong key={i++} style={{ color: 'var(--text)', fontWeight: 600 }}>{m[1]}</strong>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>)
  return out
}

/* One line at a time. Mounting every line at once streamed them in parallel,
   which reads as a block of text materialising rather than an answer being
   written — and the second line finishing before the first is nonsense. A line
   that has already streamed resolves on mount, so a remounted thread cascades
   through in a few frames rather than replaying. */
function StreamingLines({ msg, onToast }: { msg: Msg; onToast?: (text: string) => void }) {
  const [at, setAt] = useState(0)
  const lastIdx = msg.lines.length - 1

  return (
    <>
      {msg.lines.slice(0, at + 1).map((line, i) => (
        <Line key={i}>
          {i < at ? line : (
            <StreamedText
              id={`${msg.id}:${i}`}
              text={line}
              onDone={() => setAt((n) => n + 1)}
            />
          )}
          {/* Only once the last line has actually finished revealing (i < at,
              not just i === at mid-stream) — a citation trailing text that is
              still typing would read as answered before it is. */}
          {i === lastIdx && i < at && msg.citations && (
            <CitationPills sources={msg.citations} onOpen={onToast ? (s) => onToast(`Opening ${s.title}`) : undefined} />
          )}
        </Line>
      ))}
    </>
  )
}

function Line({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
      {children}
    </p>
  )
}
