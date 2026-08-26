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
import { backlogMarkdown, BACKLOG_FILE, type BacklogDoc } from './backlog'
import type { SessionFile } from './FilesPanel'
import type { ActiveObject, WatchEntry } from '../state/types'

type View = 'preview' | 'code'
const FORMATS = ['Markdown', 'PDF', 'DOCX'] as const

interface Props {
  object: ActiveObject
  watch: WatchEntry[]
  onToast: (text: string) => void
  onCollapse: () => void
  /** Every artefact in the session, for the filename switcher dropdown. */
  files?: SessionFile[]
  /** Switch the canvas to another document (from the filename dropdown). */
  onSelectDoc?: (doc: BacklogDoc) => void
  /** A comment was sent — it stacks in the changes tray above the composer. */
  onAddChange?: (change: { quote: string; note: string }) => void
}

export function DocumentCanvas({ object, watch, onToast, onCollapse, files = [], onSelectDoc, onAddChange }: Props) {
  const isBacklog = object.kind === 'backlog'
  const doc = object.activeDoc ?? 'intake'
  const md = useMemo(
    () => (isBacklog ? backlogMarkdown(doc) : prdMarkdown(object.subject)),
    [isBacklog, doc, object.subject],
  )
  const file = isBacklog ? BACKLOG_FILE[doc] : `${prdFileName(object.subject)}.md`
  const [view, setView] = useState<View>('preview')
  const [expanded, setExpanded] = useState(false)
  const [menu, setMenu] = useState<'none' | 'download' | 'history' | 'files'>('none')
  const bar = useRef<HTMLDivElement>(null)
  useDismiss(menu !== 'none', bar, useCallback(() => setMenu('none'), []))

  /* Inline commenting — toggle it on, select any text in the document, and a
     small input (a mini prompt bar) appears where the selection is. */
  const [commenting, setCommenting] = useState(false)
  const [pin, setPin] = useState<{ quote: string; top: number; left: number } | null>(null)
  const [note, setNote] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)

  const onSelect = () => {
    if (!commenting) return
    const s = window.getSelection()
    const text = s?.toString().trim() ?? ''
    if (!s || !text || s.rangeCount === 0) { setPin(null); return }
    const rect = s.getRangeAt(0).getBoundingClientRect()
    const box = cardRef.current?.getBoundingClientRect()
    if (!box) return
    setNote('')
    setPin({
      quote: text.length > 60 ? text.slice(0, 57) + '…' : text,
      top: rect.bottom - box.top + 8,
      left: Math.min(Math.max(rect.left - box.left, 12), box.width - 320),
    })
  }
  /* Send a comment → it stacks in the changes tray above the composer;
     commenting stays armed so more selections can be added before applying. */
  const sendComment = () => {
    if (!note.trim() || !pin) return
    onAddChange?.({ quote: pin.quote, note: note.trim() })
    setPin(null); setNote('')
    window.getSelection()?.removeAllRanges()
  }

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
    <div className="min-h-0 flex-1 overflow-auto px-6 py-5"
      onMouseUp={onSelect}
      style={commenting ? { cursor: 'text' } : undefined}>
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
        ref={cardRef}
        className="relative m-[12px] mb-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[var(--r-md)]"
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)', borderBottom: 'none' }}
      >
        {/* Toolbar — the Preview/Code switch on the left, object actions right. */}
        <div ref={bar} className="relative flex items-center gap-2.5 px-2.5 py-2" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          <ViewTabs view={view} onChange={setView} />
          {/* Filename is a highlighted switcher — the chevron opens an overlay of
              every session file; picking one replaces the canvas content. */}
          <button onClick={() => setMenu(menu === 'files' ? 'none' : 'files')} aria-pressed={menu === 'files'}
            className="press mono flex min-w-0 items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11.5px]"
            style={{ background: 'var(--wash-3)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>
            <span className="truncate">{file}</span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: menu === 'files' ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }}><path d="M6 9l6 6 6-6" /></svg>
          </button>

          <div className="ml-auto flex items-center gap-1 rounded-[11px] p-[3px]"
            style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
            <ToolBtn label="Share" onClick={() => onToast('Share link copied')}><Icon.Share /></ToolBtn>
            <ToolBtn label={commenting ? 'Done commenting' : 'Comment on the doc'} active={commenting}
              onClick={() => { setCommenting((c) => !c); setPin(null) }}><Icon.Comment /></ToolBtn>
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
          {menu === 'files' && (
            <FileSwitcher files={files} activeName={file}
              onPick={(d) => { setMenu('none'); onSelectDoc?.(d) }} />
          )}
        </div>

        {body}

        {/* A hint while commenting is armed but nothing is selected yet. */}
        {commenting && !pin && (
          <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-[11.5px]"
            style={{ background: 'var(--text)', color: 'var(--on-text)', opacity: .9 }}>
            Select any text to comment
          </div>
        )}

        {/* The inline comment input — a mini prompt bar anchored to the selection. */}
        {pin && (
          <div className="absolute z-20 w-[312px] rounded-[12px] p-2 shadow-lg"
            style={{ top: pin.top, left: pin.left, background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}
            onMouseDown={(e) => e.stopPropagation()}>
            <div className="mb-1.5 truncate px-1 text-[11px] italic" style={{ color: 'var(--muted)' }}>“{pin.quote}”</div>
            <div className="flex items-end gap-1.5 rounded-[9px] px-2 py-1.5" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
              <textarea autoFocus rows={1} value={note} onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment() } }}
                placeholder="Add a comment…"
                className="min-h-[24px] flex-1 resize-none bg-transparent text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-none"
                style={{ color: 'var(--text-dim)' }} />
              <button onClick={sendComment} disabled={!note.trim()} aria-label="Send comment"
                className="press grid h-7 w-7 shrink-0 place-items-center rounded-[7px] disabled:opacity-40"
                style={{ background: 'var(--text)', color: 'var(--on-text)' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h13M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
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

/* The filename switcher — an overlay under the filename pill listing every
   session file; picking one replaces the canvas content. */
function FileSwitcher({ files, activeName, onPick }: {
  files: SessionFile[]; activeName: string; onPick: (doc: BacklogDoc) => void
}) {
  return (
    <div role="menu" onMouseDown={(e) => e.stopPropagation()}
      className="absolute left-[132px] top-[calc(100%-2px)] z-50 max-h-[300px] w-[248px] overflow-auto rounded-[10px] p-1 shadow-lg"
      style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
      <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-deep)' }}>
        Files in this session
      </div>
      {files.length === 0 && (
        <div className="px-2 py-2 text-[12px]" style={{ color: 'var(--muted)' }}>No other files yet.</div>
      )}
      {files.map((f) => {
        const active = f.name === activeName
        return (
          <button key={f.name + f.when} role="menuitem" onClick={() => onPick(f.doc)}
            className="press flex w-full items-center gap-2.5 rounded-[7px] px-2 py-1.5 text-left hover:bg-[var(--glass)]"
            style={active ? { background: 'var(--wash-3)' } : undefined}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px]"
              style={{ background: active ? 'var(--brand)' : 'var(--wash-2)', color: active ? '#fff' : 'var(--muted)' }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /></svg>
            </span>
            <span className="mono min-w-0 flex-1 truncate text-[12px]" style={{ color: 'var(--text-dim)' }}>{f.name}</span>
            {active && <span className="shrink-0 text-[10px]" style={{ color: 'var(--brand)' }}>current</span>}
          </button>
        )
      })}
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
  Comment: () => <svg {...svg} width="16" height="16"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
  Expand: () => <svg {...svg} width="16" height="16"><path d="M9 4H4v5M20 9V4h-5M15 20h5v-5M4 15v5h5" /></svg>,
  Collapse: () => <svg {...svg} width="16" height="16"><path d="M4 9h5V4M15 4v5h5M20 15h-5v5M9 20v-5H4" /></svg>,
  Download: () => <svg {...svg} width="16" height="16"><path d="M12 4v11M8 11l4 4 4-4M5 20h14" /></svg>,
  History: () => <svg {...svg} width="16" height="16"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4M12 8v4l3 2" /></svg>,
  Close: () => <svg {...svg} width="16" height="16"><path d="M6 6l12 12M18 6 6 18" /></svg>,
}
