/* A document as a workspace tab — a PRD, or one of the backlog's phase files.
 *
 * The tab carries the file's name; this is what sits under it. The mini-header
 * has the Preview/Source switch on the left and the document's own actions on
 * the right — inline Comment, Download in a chosen format, and version History
 * (Manus's drawer is the model: timestamped entries, Preview or Restore on
 * hover). Full screen and Close belong to the workspace shell now.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDismiss } from '../state/useDismiss'
import { Tooltip } from '../components/chrome/Tooltip'
import { Markdown } from '../components/playground/Markdown'
import { FileMiniHeader } from '../components/playground/MiniHeader'
import { SelectionActions } from './SelectionActions'
import { prdMarkdown } from './document'
import { backlogMarkdown, type BacklogDoc } from './backlog'
import { documentFile } from '../state/overview'
import type { ActiveObject } from '../state/types'

type View = 'preview' | 'code'
const FORMATS = ['Markdown', 'PDF', 'DOCX'] as const

interface Props {
  object: ActiveObject
  /** Which backlog document this tab shows — the latest one written to its file. */
  doc?: BacklogDoc
  onToast: (text: string) => void
  /** A comment was sent — it stacks in the changes tray above the composer.
      `range` is the live DOM selection, kept so the passage stays highlighted. */
  onAddChange?: (change: { quote: string; note: string; range?: Range }) => void
  /** The pending comment changes, so the selected passages stay highlighted with
      their change number until they are applied or discarded. */
  changes?: { quote: string; note: string; range?: Range }[]
}

export function DocumentBody({ object, doc: docProp, onToast, onAddChange, changes = [] }: Props) {
  const isBacklog = object.kind === 'backlog'
  const doc = docProp ?? object.activeDoc ?? 'intake'
  const md = useMemo(
    () => (isBacklog ? backlogMarkdown(doc) : prdMarkdown(object.subject)),
    [isBacklog, doc, object.subject],
  )
  const file = documentFile(object, doc)
  const [view, setView] = useState<View>('preview')
  /* The Source view is a plain text editor — typing here edits this session's
     copy of the file, per filename, seeded from the scripted markdown the first
     time it is opened. Preview keeps rendering the original; this is scratch
     space for the user, not fed back into the render. */
  const [sourceEdits, setSourceEdits] = useState<Record<string, string>>({})
  const source = sourceEdits[file] ?? md
  const [menu, setMenu] = useState<'none' | 'download' | 'history'>('none')
  const bar = useRef<HTMLDivElement>(null)
  useDismiss(menu !== 'none', bar, useCallback(() => setMenu('none'), []))

  /* Inline commenting — toggle it on, select any text in the document, and a
     small input (a mini prompt bar) appears where the selection is. */
  const [commenting, setCommenting] = useState(false)
  const [pin, setPin] = useState<{ quote: string; top: number; left: number; range: Range } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const onSelect = () => {
    if (!commenting) return
    const s = window.getSelection()
    const text = s?.toString().trim() ?? ''
    if (!s || !text || s.rangeCount === 0) { setPin(null); return }
    const range = s.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const box = cardRef.current?.getBoundingClientRect()
    if (!box) return
    setPin({
      quote: text.length > 60 ? text.slice(0, 57) + '…' : text,
      top: rect.bottom - box.top + 8,
      left: Math.min(Math.max(rect.left - box.left, 12), box.width - 320),
      range: range.cloneRange(),
    })
  }
  /* Keep on the selection bar → the rewrite stacks in the changes tray above
     the composer, and the selected passage stays highlighted (with its change
     number) in the doc; commenting stays armed so more selections can be added
     before the whole batch is applied. */
  const keepEdit = (rewrite: string) => {
    if (!pin) return
    onAddChange?.({ quote: pin.quote, note: rewrite, range: pin.range })
    setPin(null)
    window.getSelection()?.removeAllRanges()
  }
  const discardEdit = () => {
    setPin(null)
    window.getSelection()?.removeAllRanges()
  }

  /* Paint the pending comment passages with the CSS Custom Highlight API — no DOM
     mutation, so it survives re-renders and clears itself when changes empty. */
  useEffect(() => {
    const HL = (globalThis as { Highlight?: typeof Highlight }).Highlight
    const store = (CSS as unknown as { highlights?: Map<string, Highlight> }).highlights
    if (!HL || !store) return
    const ranges = changes.map((c) => c.range).filter((r): r is Range => !!r)
    if (!ranges.length) { store.delete('aava-comment'); return }
    try { store.set('aava-comment', new HL(...ranges)) } catch { store.delete('aava-comment') }
    return () => { store.delete('aava-comment') }
  }, [changes])

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

  const switchView = (v: View) => { setView(v); if (v === 'code') { setCommenting(false); setPin(null) } }

  return (
    <div ref={cardRef} className="relative flex h-full min-h-0 flex-col">
      <div ref={bar} className="relative">
        <FileMiniHeader
          left={
            <span className="flex min-w-0 items-center gap-1.5 px-1.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
              docs
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
              <span className="truncate" style={{ color: 'var(--text-dim)' }}>{file}</span>
            </span>
          }
          right={<>
            <ViewTabs view={view} onChange={switchView} />
            <span className="mx-1 h-4 w-px" style={{ background: 'var(--glass-line-soft)' }} aria-hidden />
            {/* Inline commenting is a preview-only affordance — there is nothing
                to annotate in the raw source view. */}
            {view === 'preview' && (
              <ToolBtn label={commenting ? 'Done commenting' : 'Comment on the doc'} active={commenting}
                onClick={() => { setCommenting((c) => !c); setPin(null) }}><Icon.Comment /></ToolBtn>
            )}
            <ToolBtn label="Download" active={menu === 'download'} onClick={() => setMenu(menu === 'download' ? 'none' : 'download')}><Icon.Download /></ToolBtn>
            <ToolBtn label="Version history" active={menu === 'history'} onClick={() => setMenu(menu === 'history' ? 'none' : 'history')}><Icon.History /></ToolBtn>
          </>}
        />
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

      <div className="min-h-0 flex-1 overflow-auto px-6 py-5"
        onMouseUp={onSelect}
        style={commenting ? { cursor: 'text' } : undefined}>
        <style>{`::highlight(aava-comment){ background: rgba(124,124,255,.30); border-radius: 2px; }`}</style>
        <div ref={contentRef} className="relative mx-auto max-w-[860px]">
          {view === 'preview'
            ? <Markdown source={md} />
            : <textarea value={source} onChange={(e) => setSourceEdits((s) => ({ ...s, [file]: e.target.value }))} spellCheck={false}
                /* `rows` sized to the content, not `minHeight: 100%` — a percentage
                   height only resolves against an ancestor with a DEFINITE height,
                   and this textarea's parent is auto-height. Sizing rows from the
                   text makes the box exactly as tall as its content; the panel's
                   own scroll handles anything past that. */
                rows={Math.max(10, source.split('\n').length + 1)}
                className="mono w-full resize-none whitespace-pre-wrap bg-transparent text-[12.5px] leading-[1.65] focus-visible:outline-none"
                style={{ color: 'var(--text-dim)' }} />}
          {/* Numbered markers on each highlighted passage — the same numbers as the
              changes tray above the composer. Position is content-relative, so they
              stay glued to the text as the doc scrolls. */}
          {view === 'preview' && changes.map((c, i) => {
            if (!c.range) return null
            const r = c.range.getBoundingClientRect()
            const box = contentRef.current?.getBoundingClientRect()
            if (!box || (r.width === 0 && r.height === 0)) return null
            return (
              <span key={i} aria-hidden
                className="pointer-events-none absolute grid h-[18px] w-[18px] place-items-center rounded-full text-[10px] font-semibold shadow"
                style={{ top: r.top - box.top - 9, left: r.left - box.left - 9, background: 'var(--brand)', color: 'var(--on-text)', zIndex: 5 }}>
                {i + 1}
              </span>
            )
          })}
        </div>
      </div>

      {/* A hint while commenting is armed but nothing is selected yet. */}
      {commenting && !pin && (
        <div className="pointer-events-none absolute left-1/2 top-12 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-[11.5px]"
          style={{ background: 'var(--text)', color: 'var(--on-text)', opacity: .9 }}>
          Select any text to comment
        </div>
      )}

      {/* The inline comment bar — pick a quick AI action or describe the edit,
          watch the rewrite stream in, then Keep (stacks into the changes tray)
          or Discard. */}
      {pin && (
        <SelectionActions quote={pin.quote} top={pin.top} left={pin.left} onKeep={keepEdit} onDiscard={discardEdit} />
      )}
    </div>
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

/* The Preview/Source switch — two quiet text labels, the active one on a soft
   grey pill (the same neutral the artifact cards' Open button uses), never a
   loud filled control. Source is the plain markdown, editable in place. */
function ViewTabs({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const tabs: { id: View; label: string }[] = [{ id: 'preview', label: 'Preview' }, { id: 'code', label: 'Source' }]
  return (
    <div className="flex items-center gap-0.5">
      {tabs.map(({ id, label }) => {
        const active = view === id
        return (
          <button key={id} onClick={() => onChange(id)} aria-pressed={active}
            className="press rounded-[7px] px-2.5 py-1 text-[12.5px] transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            style={active ? { background: 'var(--wash-4)', color: 'var(--text)' } : { color: 'var(--muted)' }}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

function ToolBtn({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip label={label} side="bottom">
      <button onClick={onClick} aria-label={label} aria-pressed={active}
        className="icon-btn">
        {children}
      </button>
    </Tooltip>
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
  Comment: () => <svg {...svg} width="16" height="16"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
  Download: () => <svg {...svg} width="16" height="16"><path d="M12 4v11M8 11l4 4 4-4M5 20h14" /></svg>,
  History: () => <svg {...svg} width="16" height="16"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4M12 8v4l3 2" /></svg>,
}
