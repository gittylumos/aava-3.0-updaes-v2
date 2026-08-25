/* A small markdown renderer — enough for the documents this app generates.
 *
 * Deliberately not a full CommonMark implementation: it handles the constructs
 * the PRD document uses (h1–h3, paragraphs, bullet lists, bold, inline code, a
 * horizontal rule) and nothing else, so it stays a few lines and cannot surprise
 * us. The Code view shows the same source verbatim; this is the Preview.
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

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let para: string[] = []
  let list: string[] = []
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

  for (const raw of lines) {
    const line = raw.trimEnd()
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
  flushPara(); flushList()

  return <article className="max-w-[760px]">{blocks}</article>
}
