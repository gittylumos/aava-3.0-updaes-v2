import { useState } from 'react'
import { motion } from 'motion/react'
import type { AppState, Chip, TabId } from '../../state/types'
import { Thread } from './Thread'
import { Block } from './Blocks'
import { RunStrip } from './RunStrip'
import { ContextPane } from '../playground/ContextPane'
import { IconFolder, IconRightPanel } from '../chrome/icons'
import { prefersReducedMotion } from '../../state/timing'
import type { BacklogDoc } from '../../prd/backlog'
import { backlogProgress, DOC_PHASE } from '../../prd/backlogFlow'

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
  onRecordAnswer?: (messageId: string, text: string) => void
  onToggleContext?: () => void
  onTogglePanel?: () => void
  /** Open the "all files in this session" modal. */
  onShowFiles?: () => void
  /** Show the agent-topology graph in the canvas. */
  onShowGraph?: () => void
  /** Pending inline-comment changes — shown in a tray above the composer. */
  changes?: { quote: string; note: string }[]
  onApplyChanges?: () => void
  onDiscardChanges?: () => void
  onRemoveChange?: (index: number) => void
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
  state, chips, progress, preview, onChip, onAccept, onDismiss, onOpenFile, onOpenTab, onOpenArtifact, onRecordAnswer, composer, onToggleContext, onTogglePanel, onShowFiles, onShowGraph,
  changes = [], onApplyChanges, onDiscardChanges, onRemoveChange,
}: Props) {
  const task = state.activeTaskId ? state.tasks.find((t) => t.id === state.activeTaskId) : null
  const object = state.activeObject
  const contextOpen = state.playground.contextOpen
  const panelOpen = state.playground.panelOpen
  const reduced = prefersReducedMotion()

  /* A live decision gate or the plan card takes over the prompt-bar's spot — the
     text input is hidden while it waits, and it drops back into the conversation
     as a record once answered. Push/connect cards stay inline in the thread. */
  const pinnedGate = [...state.messages].reverse().find(
    (m) => m.live !== false && (m.block?.kind === 'decision' || m.block?.kind === 'plan'),
  )

  /* The run-progress bar for the backlog flow — pinned below the session header,
     shown only once the run is underway (after Proceed). */
  const bp = object?.kind === 'backlog' ? backlogProgress(state.messages) : null
  /* Clicking a progress step reopens that phase's produced document. */
  const openPhaseDoc = (key: string) => {
    for (let i = state.messages.length - 1; i >= 0; i--) {
      const b = state.messages[i].block
      if (b?.kind === 'document' && b.doc && DOC_PHASE[b.doc] === key) { onOpenArtifact?.(b.doc); return }
    }
  }

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
          /* A subtle bottom hairline turns the session header into a bar the run
             dock can hang from — the dock's flat top merges into this line. */
          <div className="flex shrink-0 items-center border-b border-[var(--glass-line-soft)] px-6 pb-3 pt-4">
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
            <div className="ml-auto flex items-center gap-1">
              {/* The agentic process topology — opens the graph in the canvas. */}
              <EdgeToggle on={false} onClick={onShowGraph} label="Show agent workflow">
                <IconWorkflow size={15} />
              </EdgeToggle>
              {/* Every file created in this session. */}
              <EdgeToggle on={false} onClick={onShowFiles} label="All files in this session">
                <IconFileSearch size={15} />
              </EdgeToggle>
              <EdgeToggle
                on={panelOpen}
                onClick={onTogglePanel}
                label={panelOpen ? 'Hide workspace' : 'Show workspace'}
              >
                <IconRightPanel size={15} />
              </EdgeToggle>
            </div>
          </div>
        )}

        {/* Run progress — a status dock that hangs from the session-header
            hairline (its flat top merges into that line via -mt-px), drops in on
            Proceed, and morphs downward into the full phase list. Content-width
            and centered, it floats over the conversation on expand. Shown only
            once the backlog run is underway. */}
        {bp?.started && (
          <div className="relative z-20 shrink-0 px-6 -mt-px">
            <RunStrip steps={bp.steps} at={bp.at} waiting={bp.waiting} onOpenStep={openPhaseDoc} />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-3">
          <div className="mx-auto w-full" style={colStyle}>
            <Thread messages={state.messages} chips={chips} preview={preview}
              onChip={onChip} onAccept={onAccept} onDismiss={onDismiss} onOpenFile={onOpenFile}
              onOpenTab={onOpenTab} onOpenArtifact={onOpenArtifact} onRecordAnswer={onRecordAnswer}
              pinnedId={pinnedGate?.id} />
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
            {/* Pending inline-comment changes stack here, right above the prompt
                bar — the way generative editors surface edits before applying. */}
            {changes.length > 0 && (
              <ChangesTray changes={changes}
                onApply={onApplyChanges} onDiscard={onDiscardChanges} onRemove={onRemoveChange} />
            )}
            {pinnedGate?.block ? (
              /* The live gate replaces the prompt bar entirely. */
              <div className="mb-6">
                <Block block={pinnedGate.block} live preview={preview}
                  onAccept={onAccept} onDismiss={() => onDismiss(pinnedGate.id)}
                  onOpenFile={onOpenFile} onOpenTab={onOpenTab} onOpenArtifact={onOpenArtifact}
                  onRecordAnswer={(text) => onRecordAnswer?.(pinnedGate.id, text)} answer={pinnedGate.answer} />
              </div>
            ) : progress ? (
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

/* The pending inline-comment changes, stacked above the composer — a count that
   expands to the list, with Discard / Apply for the batch. */
function ChangesTray({ changes, onApply, onDiscard, onRemove }: {
  changes: { quote: string; note: string }[]
  onApply?: () => void; onDiscard?: () => void; onRemove?: (i: number) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-2.5 overflow-hidden rounded-[var(--r-lg)]"
      style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-line)' }}>
      {open && (
        <div className="max-h-[200px] overflow-auto px-3.5 pt-3" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          {changes.map((c, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] text-[10px] font-semibold" style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}>{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11.5px] italic" style={{ color: 'var(--muted)' }}>“{c.quote}”</span>
                <span className="block text-[13px]" style={{ color: 'var(--text-dim)' }}>{c.note}</span>
              </span>
              <button onClick={() => onRemove?.(i)} aria-label="Remove change"
                className="press mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[5px] hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted-deep)' }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <button onClick={() => setOpen((o) => !o)} className="press flex items-center gap-1.5 text-[13px] font-medium" style={{ color: 'var(--text-dim)' }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .15s' }}><path d="M9 6l6 6-6 6" /></svg>
          {changes.length} change{changes.length === 1 ? '' : 's'}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => { setOpen(false); onDiscard?.() }}
            className="press rounded-[9px] px-3.5 py-1.5 text-[12.5px] font-medium"
            style={{ background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--glass-line-soft)' }}>
            Discard
          </button>
          <button onClick={() => { setOpen(false); onApply?.() }}
            className="press rounded-[9px] px-4 py-1.5 text-[12.5px] font-medium"
            style={{ background: 'var(--brand)', color: '#fff' }}>
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

/* A document with a magnifier — "all files in this session". */
function IconFileSearch({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" /><path d="M14 3v4h4" />
      <circle cx="16.5" cy="15.5" r="2.6" /><path d="m20 19-1.6-1.6" />
    </svg>
  )
}

/* Three linked nodes — the agent-workflow topology. */
function IconWorkflow({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="7" height="5" rx="1.5" /><rect x="14" y="15" width="7" height="5" rx="1.5" />
      <rect x="3" y="15" width="7" height="5" rx="1.5" /><path d="M6.5 9v6M10 17.5h4M6.5 12h8.5a2 2 0 0 1 2 2v1" />
    </svg>
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
