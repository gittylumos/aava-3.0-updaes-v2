import type { CSSProperties, ReactNode } from 'react'
import type { Line, Seg, Tone } from './types'

/* The light ink is only ever used on --code-bg; the page is grayscale-filtered. */
export const INK = '#e5e5e5'
export const INK_DIM = '#a3a3a3'

/** A macOS-style terminal window, centred on the page. */
export function TerminalWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-4" style={{ background: 'var(--ground)' }}>
      <div
        className="flex w-full max-w-[1100px] flex-col overflow-hidden rounded-[10px]"
        style={{ height: '88dvh', background: 'var(--code-bg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-pop)' }}
      >
        <div className="relative flex h-[30px] shrink-0 items-center px-3"
          style={{ borderBottom: `1px solid ${INK_DIM}33` }}>
          <div className="flex gap-[7px]" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="block h-[11px] w-[11px] rounded-full" style={{ background: INK_DIM, opacity: 0.55 }} />
            ))}
          </div>
          <span className="pointer-events-none absolute inset-x-0 text-center text-[12px]"
            style={{ color: INK_DIM, fontFamily: 'var(--font-ui)' }}>{title}</span>
        </div>
        {children}
      </div>
    </div>
  )
}

/* Grayscale only: tones become weight, opacity and slant. */
const TONE: Record<Tone, CSSProperties> = {
  normal: {},
  dim: { opacity: 0.6 },
  bold: { fontWeight: 600 },
  accent: { fontWeight: 600 },
  success: { fontWeight: 500 },
  warn: { fontWeight: 600, fontStyle: 'italic' },
  error: { fontWeight: 700, fontStyle: 'italic' },
}

/** One terminal row. An empty line still takes a row. */
export function LineView({ line, onLink }: { line: Line; onLink: (l: NonNullable<Seg['link']>) => void }) {
  if (line.length === 0) return <div aria-hidden>{' '}</div>
  return (
    <div className="whitespace-pre-wrap break-words">
      {line.map((s, i) => {
        const style = TONE[s.tone ?? 'normal']
        if (!s.link) return <span key={i} style={style}>{s.text}</span>
        const link = s.link
        return (
          <span key={i} role="link" tabIndex={-1} style={{ ...style, textDecoration: 'underline', cursor: 'pointer', textUnderlineOffset: 2 }}
            onClick={(e) => { e.stopPropagation(); onLink(link) }}>
            {s.text}
          </span>
        )
      })}
    </div>
  )
}
