import { useEffect, useRef } from 'react'
import type { Chip, Message as Msg, TabId } from '../../state/types'
import { Message } from './Message'
import { Chips } from './Chips'
import type { BacklogDoc } from '../../prd/backlog'

interface Props {
  messages: Msg[]
  chips: Chip[]
  preview: React.ReactNode
  onChip: (sends: string) => void
  onAccept: (beat: string) => void
  onDismiss: (id: string) => void
  onOpenFile?: (file: string) => void
  onOpenTab?: (tab: TabId) => void
  onOpenArtifact?: (doc?: BacklogDoc) => void
  onRecordAnswer?: (messageId: string, text: string) => void
}

export function Thread({ messages, chips, preview, onChip, onAccept, onDismiss, onOpenFile, onOpenTab, onOpenArtifact, onRecordAnswer }: Props) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'end',
    })
  }, [messages])

  return (
    <div role="log" aria-live="polite" aria-label="Conversation" className="flex flex-col">
      {messages.map((m) => (
        <Message key={m.id} msg={m} preview={preview} onAccept={onAccept} onDismiss={onDismiss}
          onOpenFile={onOpenFile} onOpenTab={onOpenTab} onOpenArtifact={onOpenArtifact} onRecordAnswer={onRecordAnswer} />
      ))}
      <Chips chips={chips} onPick={onChip} />
      <div ref={end} />
    </div>
  )
}
