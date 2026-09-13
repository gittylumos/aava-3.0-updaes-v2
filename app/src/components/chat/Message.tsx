import { useState } from 'react'
import { motion } from 'motion/react'
import type { Message as Msg, TabId } from '../../state/types'
import { TypingDots } from './TypingDots'
import { StreamedText } from './StreamedText'
import { Block } from './Blocks'
import { CitationPills } from './InlineSource'
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
  /** This message's block is pinned to the composer slot — skip it inline. */
  pinned?: boolean
}

export function Message({ msg, preview, onAccept, onDismiss, onOpenFile, onOpenTab, onOpenArtifact, onOpenAgentArtifact, onOpenAgentDoc, onRecordAnswer, onToast, pinned }: Props) {
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
                  {line}
                  {i === msg.lines.length - 1 && msg.citations && (
                    <CitationPills sources={msg.citations} onOpen={onToast ? (s) => onToast(`Opening ${s.title}`) : undefined} />
                  )}
                </Line>
              ))}
          {msg.block && !pinned && (
            <Block block={msg.block} live={msg.live !== false} preview={preview}
              onAccept={onAccept} onDismiss={() => onDismiss(msg.id)} onOpenFile={onOpenFile}
              onOpenTab={onOpenTab} onOpenArtifact={onOpenArtifact} onOpenAgentArtifact={onOpenAgentArtifact} onOpenAgentDoc={onOpenAgentDoc}
              onRecordAnswer={(text) => onRecordAnswer?.(msg.id, text)} onToast={onToast} answer={msg.answer} />
          )}
        </>
      )}
    </motion.div>
  )
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
