/* A small markdown renderer — enough for the documents this app generates.
 *
 * Deliberately not a full CommonMark implementation: it handles the constructs
 * these documents use (h1–h3, paragraphs, bullet lists, bold, inline code, a
 * horizontal rule, blockquote callouts and pipe tables) and nothing else, so it
 * stays small and cannot surprise us. The Code view shows the same source
 * verbatim; this is the Preview.
 */
import { Fragment } from 'react'

/** Inline: **bold** and `code`. Splits on the two, leaves the rest as text. */
function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>)
    if (m[2] != null) out.push(<b key={i++} style={{ color: 'var(--text)', fontWeight: 600 }}>{m[2]}</b>)
    else out.push(<code key={i++} className="mono rounded px-1 py-0.5 text-[.9em]" style={{ background: 'var(--wash-3)' }}>{m[3]}</code>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>)
  return out
}

/** Split a pipe-table row into its cells, dropping the leading/trailing pipes. */
function cells(row: string): string[] {
  return row.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim())
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let para: string[] = []
  let list: string[] = []
  let quote: string[] = []
  let key = 0

  const flushPara = () => {
    if (!para.length) return
    blocks.push(<p key={key++} className="mt-3 text-[14px] leading-[1.7]" style={{ color: 'var(--text-dim)' }}>{inline(para.join(' '))}</p>)
    para = []
  }
  const flushList = () => {
    if (!list.length) return
    blocks.push(
      <ul key={key++} className="mt-2 space-y-1.5">
        {list.map((li, i) => (
          <li key={i} className="flex gap-2 text-[14px] leading-[1.6]" style={{ color: 'var(--text-dim)' }}>
            <span aria-hidden style={{ color: 'var(--zone-canvas-accent)' }}>•</span>
            <span>{inline(li)}</span>
          </li>
        ))}
      </ul>,
    )
    list = []
  }
  /* A blockquote callout — used for the "off-standard" and "missing fields"
     warnings. Rendered as a tinted, left-ruled panel. */
  const flushQuote = () => {
    if (!quote.length) return
    blocks.push(
      <div key={key++} className="mt-3 rounded-r-[8px] py-2 pl-3 pr-3 text-[13px] leading-[1.6]"
        style={{ background: 'var(--warn-surface)', borderLeft: '2px solid var(--warn)', color: 'var(--text-dim)' }}>
        {quote.map((q, i) => <div key={i}>{inline(q)}</div>)}
      </div>,
    )
    quote = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd()

    /* A pipe table: a header row, a |---| separator, then body rows. Consumed as
       a block so the small line-loop below never sees the individual rows. */
    if (/^\s*\|/.test(line) && /^\s*\|?[\s:-]*-[\s:|-]*$/.test((lines[i + 1] ?? '').trim())) {
      flushPara(); flushList(); flushQuote()
      const head = cells(line)
      const rows: string[][] = []
      let j = i + 2
      while (j < lines.length && /^\s*\|/.test(lines[j])) { rows.push(cells(lines[j])); j++ }
      i = j - 1
      blocks.push(
        <div key={key++} className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>{head.map((h, c) => (
                <th key={c} className="border px-2.5 py-1.5 text-left font-semibold"
                  style={{ borderColor: 'var(--glass-line-soft)', background: 'var(--wash-2)', color: 'var(--text)' }}>{inline(h)}</th>
              ))}</tr>
            </thead>
            <tbody>{rows.map((r, ri) => (
              <tr key={ri}>{r.map((cell, c) => (
                <td key={c} className="border px-2.5 py-1.5 align-top"
                  style={{ borderColor: 'var(--glass-line-soft)', color: 'var(--text-dim)' }}>{inline(cell)}</td>
              ))}</tr>
            ))}</tbody>
          </table>
        </div>,
      )
      continue
    }

    if (/^\s*>\s?/.test(line)) { flushPara(); flushList(); quote.push(line.replace(/^\s*>\s?/, '')); continue }
    flushQuote()
    if (/^\s*[-*]\s+/.test(line)) { flushPara(); list.push(line.replace(/^\s*[-*]\s+/, '')); continue }
    flushList()
    if (line.trim() === '') { flushPara(); continue }
    if (line.trim() === '---') { flushPara(); blocks.push(<hr key={key++} className="my-6" style={{ border: 'none', borderTop: '1px solid var(--glass-line-soft)' }} />); continue }
    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      flushPara()
      const level = h[1].length
      const cls = level === 1 ? 'text-[24px] font-semibold mt-0' : level === 2 ? 'text-[17px] font-semibold mt-7' : 'text-[14px] font-semibold mt-5'
      blocks.push(<div key={key++} className={cls} style={{ color: 'var(--text)' }}>{inline(h[2])}</div>)
      continue
    }
    para.push(line.trim())
  }
  flushPara(); flushList(); flushQuote()

  return <article className="max-w-[760px]">{blocks}</article>
}
