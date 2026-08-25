/* The document artefact viewer.
 *
 * This is what the Canvas becomes when the object it holds is a document (a
 * PRD). The layout follows the pattern the generative tools converged on: a
 * Preview/Code switch on the left of the toolbar, and object actions — Share,
 * Expand to full screen, Download in a chosen format, and version History — on
 * the right, with a Close that folds the panel away. Manus's history drawer is
 * the model for the version list: timestamped entries, each offering Preview or
 * Restore on hover. The Watch zone stays docked beneath it.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useDismiss } from '../state/useDismiss'
import { WatchBar } from '../zones/WatchBar'
import { Markdown } from '../components/playground/Markdown'
import { prdMarkdown, prdFileName } from './document'
import { backlogMarkdown, BACKLOG_FILE } from './backlog'
import type { ActiveObject, WatchEntry } from '../state/types'

type View = 'preview' | 'code'
const FORMATS = ['Markdown', 'PDF', 'DOCX'] as const

interface Props {
  object: ActiveObject
  watch: WatchEntry[]
  onToast: (text: string) => void
  onCollapse: () => void
}

export function DocumentCanvas({ object, watch, onToast, onCollapse }: Props) {
  const isBacklog = object.kind === 'backlog'
  const doc = object.activeDoc ?? 'intake'
  const md = useMemo(
    () => (isBacklog ? backlogMarkdown(doc) : prdMarkdown(object.subject)),
    [isBacklog, doc, object.subject],
  )
  const file = isBacklog ? BACKLOG_FILE[doc] : `${prdFileName(object.subject)}.md`
  const [view, setView] = useState<View>('preview')
  const [expanded, setExpanded] = useState(false)
  const [menu, setMenu] = useState<'none' | 'download' | 'history'>('none')
  const bar = useRef<HTMLDivElement>(null)
  useDismiss(menu !== 'none', bar, useCallback(() => setMenu('none'), []))

  const download = (format: (typeof FORMATS)[number]) => {
    setMenu('none')
    if (format === 'Markdown') {
      const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }))
      const a = document.createElement('a')
      a.href = url; a.download = file; a.click()
      URL.revokeObjectURL(url)
      onToast(`Downloaded ${file}`)
    } else {
      onToast(`Exporting ${file.replace(/\.md$/, '')}.${format.toLowerCase()}…`)
    }
  }

  const body = (
    <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
      {view === 'preview'
        ? <Markdown source={md} />
        : <pre className="mono max-w-full overflow-x-auto whitespace-pre-wrap text-[12.5px] leading-[1.65]" style={{ color: 'var(--text-dim)' }}>{md}</pre>}
    </div>
  )

  /* Until the draft exists, the canvas shows a quiet drafting state rather than
     the document — the clarifying turn in the conversation comes first. */
  if (!object.docReady) {
    return (
      <section aria-label="Canvas — drafting" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="m-[12px] mb-0 grid min-h-0 flex-1 place-items-center overflow-hidden rounded-t-[var(--r-md)]"
          style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)', borderBottom: 'none' }}>
          <div className="max-w-[280px] px-8 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full" style={{ border: '2px solid var(--glass-line)', borderTopColor: 'var(--zone-canvas-accent)' }} />
            <p className="text-[13px] font-medium" style={{ color: 'var(--text-dim)' }}>Drafting the document</p>
            <p className="mt-1.5 text-[12px] leading-[1.5]" style={{ color: 'var(--muted-deep)' }}>
              The PRD will appear here once it is ready to review.
            </p>
          </div>
        </div>
        <div className="mx-[12px] mb-[12px] overflow-hidden rounded-b-[var(--r-md)]" style={{ border: '1px solid var(--glass-line-soft)', borderTop: 'none' }}>
          <WatchBar entries={watch} />
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Canvas — document" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div
        className="m-[12px] mb-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[var(--r-md)]"
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)', borderBottom: 'none' }}
      >
        {/* Toolbar — the Preview/Code switch on the left, object actions right. */}
        <div ref={bar} className="relative flex items-center gap-2.5 px-2.5 py-2" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          <ViewTabs view={view} onChange={setView} />
          <span className="mono min-w-0 truncate text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>{file}</span>

          <div className="ml-auto flex items-center gap-1 rounded-[11px] p-[3px]"
            style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
            <ToolBtn label="Share" onClick={() => onToast('Share link copied')}><Icon.Share /></ToolBtn>
            <ToolBtn label="Expand" onClick={() => setExpanded(true)}><Icon.Expand /></ToolBtn>
            <ToolBtn label="Download" active={menu === 'download'} onClick={() => setMenu(menu === 'download' ? 'none' : 'download')}><Icon.Download /></ToolBtn>
            <ToolBtn label="Version history" active={menu === 'history'} onClick={() => setMenu(menu === 'history' ? 'none' : 'history')}><Icon.History /></ToolBtn>
            <span className="mx-0.5 h-4 w-px" style={{ background: 'var(--glass-line-soft)' }} aria-hidden />
            <ToolBtn label="Close" onClick={onCollapse}><Icon.Close /></ToolBtn>
          </div>

          {menu === 'download' && (
            <Dropdown>
              {FORMATS.map((f) => (
                <DropItem key={f} onClick={() => download(f)}>
                  <FormatIcon format={f} /> <span>{f}</span>
                </DropItem>
              ))}
            </Dropdown>
          )}
          {menu === 'history' && <HistoryDrawer onAction={(what, when) => { setMenu('none'); onToast(`${what} version from ${when}`) }} />}
        </div>

        {body}
      </div>

      <div className="mx-[12px] mb-[12px] overflow-hidden rounded-b-[var(--r-md)]" style={{ border: '1px solid var(--glass-line-soft)', borderTop: 'none' }}>
        <WatchBar entries={watch} />
      </div>

      {/* Full-screen document view. */}
      {expanded && (
        <div className="fixed inset-0 z-[90] flex flex-col" style={{ background: 'var(--ground)' }}>
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
            <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{object.title}</span>
            <span className="mono text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>{file}</span>
            <div className="ml-auto flex items-center gap-2">
              <ViewTabs view={view} onChange={setView} />
              <ToolBtn label="Exit full screen" onClick={() => setExpanded(false)}><Icon.Collapse /></ToolBtn>
            </div>
          </div>
          <div className="mx-auto min-h-0 w-full max-w-[860px] flex-1 overflow-auto px-8 py-8">
            {view === 'preview'
              ? <Markdown source={md} />
              : <pre className="mono whitespace-pre-wrap text-[13px] leading-[1.7]" style={{ color: 'var(--text-dim)' }}>{md}</pre>}
          </div>
        </div>
      )}
    </section>
  )
}

/* Manus-style version history: timestamped entries, Preview/Restore on hover. */
function HistoryDrawer({ onAction }: { onAction: (what: string, when: string) => void }) {
  const versions = [
    { when: '13:17', who: 'AAVA', note: 'Current draft' },
    { when: '13:02', who: 'Ram K', note: 'Requirements normalised' },
    { when: '12:18', who: 'Ram K', note: 'First draft from intent' },
  ]
  return (
    <div
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute right-2 top-[calc(100%+6px)] z-50 w-[264px] overflow-hidden rounded-[12px] shadow-lg"
      style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}
    >
      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-deep)', borderBottom: '1px solid var(--glass-line-soft)' }}>
        Version history
      </div>
      {versions.map((v, i) => (
        <div key={v.when} className="group flex items-center gap-2.5 px-3 py-2.5"
          style={{ borderTop: i ? '1px solid var(--glass-line-soft)' : undefined }}>
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold"
            style={{ background: 'var(--wash-3)', color: 'var(--text-dim)' }}>{v.who[0]}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-medium leading-tight" style={{ color: 'var(--text)' }}>{v.when}</span>
            <span className="block truncate text-[11px] leading-tight" style={{ color: 'var(--muted)' }}>{v.who} · {v.note}</span>
          </span>
          {/* Preview / Restore appear on hover, as in Manus. */}
          <span className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={() => onAction('Previewing', v.when)}
              className="press rounded-[6px] px-2 py-1 text-[11px]" style={{ color: 'var(--muted)', background: 'var(--wash-3)' }}>Preview</button>
            {i > 0 && (
              <button onClick={() => onAction('Restored', v.when)}
                className="press rounded-[6px] px-2 py-1 text-[11px] font-medium" style={{ color: 'var(--text-dim)', background: 'var(--wash-4)' }}>Restore</button>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

/* The Preview/Code switch — one segmented control. The active tab is a filled
   pill showing icon + label; the inactive one collapses to its icon alone and
   the label glides away, the way lovable's editor does it. */
function ViewTabs({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const tabs: { id: View; label: string; icon: () => React.JSX.Element }[] = [
    { id: 'preview', label: 'Preview', icon: Icon.Preview },
    { id: 'code', label: 'Code', icon: Icon.Code },
  ]
  return (
    <div className="flex items-center gap-0.5 rounded-[11px] p-[3px]"
      style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
      {tabs.map(({ id, label, icon: Ico }) => {
        const active = view === id
        return (
          <motion.button
            key={id} layout onClick={() => onChange(id)} aria-pressed={active} title={label}
            transition={{ type: 'spring', stiffness: 520, damping: 40 }}
            className="press flex items-center gap-1.5 rounded-[8px] text-[12.5px] font-medium focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            style={active
              ? { background: 'var(--brand)', color: '#fff', padding: '5px 11px', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }
              : { background: 'transparent', color: 'var(--muted)', padding: '5px 6px' }}
          >
            <Ico />
            <AnimatePresence initial={false}>
              {active && (
                <motion.span
                  layout
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.16 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}

function ToolBtn({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} aria-pressed={active}
      className="press grid h-8 w-8 place-items-center rounded-[8px] transition-colors hover:bg-[var(--wash-3)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
      style={{ color: active ? 'var(--text-dim)' : 'var(--muted)', background: active ? 'var(--wash-3)' : 'transparent' }}>
      {children}
    </button>
  )
}

function Dropdown({ children }: { children: React.ReactNode }) {
  return (
    <div role="menu" onMouseDown={(e) => e.stopPropagation()}
      className="absolute right-2 top-[calc(100%+6px)] z-50 w-[168px] overflow-hidden rounded-[10px] p-1 shadow-lg"
      style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
      {children}
    </div>
  )
}
function DropItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button role="menuitem" onClick={onClick}
      className="press flex w-full items-center gap-2.5 rounded-[7px] px-2 py-1.5 text-left text-[12.5px] hover:bg-[var(--glass)]"
      style={{ color: 'var(--text-dim)' }}>{children}</button>
  )
}

function FormatIcon({ format }: { format: string }) {
  const c = format === 'PDF' ? 'var(--danger)' : format === 'DOCX' ? 'var(--done)' : 'var(--muted)'
  return <span className="grid h-4 w-4 place-items-center rounded-[3px] text-[7px] font-bold" style={{ background: c, color: '#fff' }}>{format[0]}</span>
}

const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
const Icon = {
  Preview: () => <svg {...svg} width="15" height="15"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18" /></svg>,
  Code: () => <svg {...svg} width="15" height="15"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" /></svg>,
  Share: () => <svg {...svg} width="16" height="16"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>,
  Expand: () => <svg {...svg} width="16" height="16"><path d="M9 4H4v5M20 9V4h-5M15 20h5v-5M4 15v5h5" /></svg>,
  Collapse: () => <svg {...svg} width="16" height="16"><path d="M4 9h5V4M15 4v5h5M20 15h-5v5M9 20v-5H4" /></svg>,
  Download: () => <svg {...svg} width="16" height="16"><path d="M12 4v11M8 11l4 4 4-4M5 20h14" /></svg>,
  History: () => <svg {...svg} width="16" height="16"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4M12 8v4l3 2" /></svg>,
  Close: () => <svg {...svg} width="16" height="16"><path d="M6 6l12 12M18 6 6 18" /></svg>,
}
