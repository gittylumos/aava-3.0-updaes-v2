import { useState } from 'react'
import { motion } from 'motion/react'
import type { Message as Msg, TabId } from '../../state/types'
import { TypingDots } from './TypingDots'
import { StreamedText } from './StreamedText'
import { Block } from './Blocks'
import { fadeUp } from '../../design/motion'
import type { BacklogDoc } from '../../prd/backlog'

interface Props {
  msg: Msg
  preview: React.ReactNode
  onAccept: (beat: string) => void
  onDismiss: (id: string) => void
  onOpenFile?: (file: string) => void
  onOpenTab?: (tab: TabId) => void
  onOpenArtifact?: (doc?: BacklogDoc) => void
  onRecordAnswer?: (messageId: string, text: string) => void
}

export function Message({ msg, preview, onAccept, onDismiss, onOpenFile, onOpenTab, onOpenArtifact, onRecordAnswer }: Props) {
  if (msg.from === 'user') {
    return (
      <motion.div {...fadeUp(6)}
        className="mb-4 self-end rounded-[14px_14px_4px_14px] px-3.5 py-2 text-[14px] backdrop-blur-[16px]"
        style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-line)', maxWidth: '78%' }}>
        {msg.lines[0]}
      </motion.div>
    )
  }

  /* No name label. Only one of the two speakers gets a bubble, and only one is
     right-aligned — the side of the column a message sits on already says who
     said it, so the label was repeating that on every single turn. */
  return (
    <motion.div {...fadeUp(6)} className="mb-5">
      {msg.typing ? <TypingDots /> : (
        <>
          {msg.stream
            ? <StreamingLines msg={msg} />
            : msg.lines.map((line, i) => <Line key={i}>{line}</Line>)}
          {msg.block && (
            <Block block={msg.block} live={msg.live !== false} preview={preview}
              onAccept={onAccept} onDismiss={() => onDismiss(msg.id)} onOpenFile={onOpenFile}
              onOpenTab={onOpenTab} onOpenArtifact={onOpenArtifact}
              onRecordAnswer={(text) => onRecordAnswer?.(msg.id, text)} answer={msg.answer} />
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
function StreamingLines({ msg }: { msg: Msg }) {
  const [at, setAt] = useState(0)

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
