import { motion } from 'motion/react'
import type { AppState, Chip, TabId } from '../../state/types'
import { Thread } from './Thread'
import { ContextPane } from '../playground/ContextPane'
import { IconFolder, IconRightPanel } from '../chrome/icons'
import { prefersReducedMotion } from '../../state/timing'
import type { BacklogDoc } from '../../prd/backlog'

interface Props {
  state: AppState
  chips: Chip[]
  /** Where the run stands. Pinned above the composer, not a message. */
  progress: React.ReactNode
  preview: React.ReactNode
  onChip: (sends: string) => void
  onAccept: (beat: string) => void
  onDismiss: (id: string) => void
  onOpenFile?: (file: string) => void
  onOpenTab?: (tab: TabId) => void
  onOpenArtifact?: (doc?: BacklogDoc) => void
  onToggleContext?: () => void
  onTogglePanel?: () => void
  composer: React.ReactNode
}

/* The centre column: the conversation, and — when a task is open — the task
 * context beside it. Context sits left of the discussion because the ticket
 * detail belongs next to the talk about it, not behind a tab in the workspace.
 *
 * This is now the only conversation surface. It used to have a twin (SplitView)
 * that existed solely to bolt the artefact panel onto the right; the panel is a
 * region of the shell now, so the twin had nothing left to do.
 */
export function ConversationView({
  state, chips, progress, preview, onChip, onAccept, onDismiss, onOpenFile, onOpenTab, onOpenArtifact, composer, onToggleContext, onTogglePanel,
}: Props) {
  const task = state.activeTaskId ? state.tasks.find((t) => t.id === state.activeTaskId) : null
  const object = state.activeObject
  const contextOpen = state.playground.contextOpen
  const panelOpen = state.playground.panelOpen
  const reduced = prefersReducedMotion()

  /* The reading column widens when the workspace folds away. Not unbounded —
     prose past ~110 characters is hard to track back to the next line. */
  const colMax = task || object ? (panelOpen ? 620 : 880) : 760
  const colStyle = {
    maxWidth: colMax,
    transition: reduced ? undefined : 'max-width 320ms cubic-bezier(.16,1,.3,1)',
  }

  return (
    <motion.div className="flex h-full min-h-0 w-full">
      {task && <ContextPane open={contextOpen} ctx={task.context} />}

      <div className="flex min-w-0 flex-1 flex-col">
        {task && (
          <div className="flex shrink-0 items-center px-6 pt-4">
            <EdgeToggle
              on={contextOpen}
              onClick={onToggleContext}
              label={contextOpen ? 'Hide task context' : 'Show task context'}
            >
              <IconFolder size={15} />
            </EdgeToggle>

            {/* The task names itself here rather than only in the sidebar — this
                is the one header the conversation has. */}
            <h2 className="ml-2 min-w-0 truncate text-[13px] font-medium" style={{ color: 'var(--text-dim)' }}>
              {task.title}
            </h2>

            {/* The ticket is where the task came from — one click back to it. */}
            <a
              href={task.context.ticketUrl ?? `https://aava-demo.atlassian.net/browse/${task.context.ticket}`}
              target="_blank"
              rel="noreferrer"
              title={`Open ${task.context.ticket} in ${task.context.ticketSource.split(' · ')[0]}`}
              /* Colours live in classes, not style — an inline background would
                 outrank the hover rule and nothing would light up. */
              className="press ml-2 flex shrink-0 items-center gap-1.5 rounded-[7px] border border-[var(--glass-line-soft)] bg-[var(--wash-2)] px-2 py-[3px] text-[var(--muted)] transition-colors hover:border-[var(--glass-line)] hover:bg-[var(--wash-4)] hover:text-[var(--text-dim)]"
            >
              <span className="mono text-[11px]">{task.context.ticket}</span>
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
              </svg>
            </a>

            {/* Right edge, for the region it controls. Collapsing the workspace
                from inside it leaves no way back in — this is that way back. */}
            <EdgeToggle
              on={panelOpen}
              onClick={onTogglePanel}
              label={panelOpen ? 'Hide workspace' : 'Show workspace'}
              className="ml-auto"
            >
              <IconRightPanel size={15} />
            </EdgeToggle>
          </div>
        )}

        {/* An intent-opened object (a PRD) has no ticket and no task context, so
            its header is just the session name, the attached source and the one
            control that matters here — the way back into the workspace. */}
        {!task && object && (
          <div className="flex shrink-0 items-center px-6 pt-4">
            <h2 className="min-w-0 truncate text-[13px] font-medium" style={{ color: 'var(--text-dim)' }}>
              {object.title}
            </h2>
            <span className="mono ml-2 flex shrink-0 items-center gap-1.5 rounded-[7px] border border-[var(--glass-line-soft)] bg-[var(--wash-2)] px-2 py-[3px] text-[11px] text-[var(--muted)]">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" />
              </svg>
              PRD_v2.4.docx
            </span>
            <EdgeToggle
              on={panelOpen}
              onClick={onTogglePanel}
              label={panelOpen ? 'Hide workspace' : 'Show workspace'}
              className="ml-auto"
            >
              <IconRightPanel size={15} />
            </EdgeToggle>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-3">
          <div className="mx-auto w-full" style={colStyle}>
            <Thread messages={state.messages} chips={chips} preview={preview}
              onChip={onChip} onAccept={onAccept} onDismiss={onDismiss} onOpenFile={onOpenFile}
              onOpenTab={onOpenTab} onOpenArtifact={onOpenArtifact} />
          </div>
        </div>

        {/* px-8 outside the max-width, exactly as the thread above — with the
            padding inside it, the composer came out 64px narrower. */}
        {/* Progress sits WITH the composer, not in the scroll. Where the run
            stands is not something you should have to scroll back to find.
            One tinted surface holds both; the composer is a card ON it, which
            is what lets its corners stay curved all the way round. */}
        <div className="px-8">
          <div className="mx-auto w-full" style={colStyle}>
            {progress ? (
              <div className="mb-7 overflow-hidden rounded-[var(--r-lg)]"
                style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-line)' }}>
                {progress}
                {composer}
              </div>
            ) : composer}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* The two region toggles that frame the conversation. Same button, same
   pressed treatment — they control mirror images of each other. */
function EdgeToggle({ on, onClick, label, className = '', children }: {
  on: boolean
  onClick?: () => void
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`press grid h-8 w-8 place-items-center rounded-[8px] transition-colors hover:bg-[var(--wash-3)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] ${className}`}
      style={{
        color: on ? 'var(--text-dim)' : 'var(--muted)',
        background: on ? 'var(--wash-3)' : 'transparent',
      }}
    >
      {children}
    </button>
  )
}
