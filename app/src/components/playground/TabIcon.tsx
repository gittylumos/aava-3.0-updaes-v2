import type { WorkspaceTab } from '../../state/workspace'

/* One icon per artifact kind — the leading glyph on a tab, and the same glyph
   wherever that kind is listed (the "+" menu, the Overview). A rendered page
   and a new browser tab are both a browser; one source file and the whole
   editor are both code. */
const p = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
}

/* A file shows its format's own standard mark, the way editors do — the
   Markdown "M↓" for .md, a red PDF badge for .pdf. Anything else falls back to
   the icon of the kind of tab it is. */
function FormatIcon({ name, size }: { name: string; size: number }) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'md') {
    return (
      <svg viewBox="0 0 24 24" width={size + 1} height={size + 1} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3.5 16.5v-9l4 5 4-5v9M17.5 7.5v9M14.5 13.5l3 3 3-3" />
      </svg>
    )
  }
  if (ext === 'pdf') {
    return (
      <span aria-hidden className="grid place-items-center font-bold tracking-[-.02em]"
        style={{ width: size + 5, height: size, fontSize: Math.round(size * 0.58), color: '#F0566A', lineHeight: 1 }}>
        PDF
      </span>
    )
  }
  return null
}

export function TabTypeIcon({ type, size = 15, name }: { type: WorkspaceTab['type']; size?: number; name?: string }) {
  const s = { ...p, width: size, height: size }
  const format = name ? FormatIcon({ name, size }) : null
  if (format) return format
  switch (type) {
    case 'overview': return <svg {...s}><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" /></svg>
    case 'preview':
    case 'browser': return <svg {...s}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
    case 'terminal': return <svg {...s}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M13 15h4" /></svg>
    case 'code':
    case 'file': return <svg {...s}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" /></svg>
    case 'tests': return <svg {...s}><path d="M20 6 9 17l-5-5" /></svg>
    /* Changes: the ± review glyph — a plus over a minus, boxed. */
    case 'diff': return <svg {...s}><rect x="3.5" y="3.5" width="17" height="17" rx="3.5" /><path d="M12 7.5v6M9 10.5h6M9 16.5h6" /></svg>
    /* A dashboard or a generated report — a chart. */
    case 'insight':
    case 'report': return <svg {...s}><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></svg>
    /* The run's process map. */
    case 'activity': return <svg {...s}><rect x="3" y="4" width="7" height="5" rx="1.5" /><rect x="14" y="15" width="7" height="5" rx="1.5" /><rect x="3" y="15" width="7" height="5" rx="1.5" /><path d="M6.5 9v6M10 17.5h4M6.5 12h8.5a2 2 0 0 1 2 2v1" /></svg>
    /* An agent workflow — nodes on a line. */
    case 'agent': return <svg {...s}><circle cx="5" cy="12" r="2.2" /><circle cx="12" cy="6" r="2.2" /><circle cx="19" cy="12" r="2.2" /><circle cx="12" cy="18" r="2.2" /><path d="M6.8 10.6 10.2 7.4M13.8 7.4l3.4 3.2M17.2 13.4l-3.4 3.2M10.2 16.6 6.8 13.4" /></svg>
    default: return <svg {...s}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /></svg>
  }
}
