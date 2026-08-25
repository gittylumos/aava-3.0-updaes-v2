/* View icons for the Toolbar zone.
 *
 * Same hand as components/chrome/icons.tsx — 24x24 grid, stroke 1.6, round
 * caps/joins, currentColor, no fills — so the toolbar reads as part of the one
 * product icon system rather than a second set bolted on.
 */
type IconProps = { size?: number; className?: string }

const base = (size: number) => ({
  viewBox: '0 0 24 24',
  width: size,
  height: size,
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export type ViewIconId =
  | 'document' | 'stories' | 'table' | 'risk' | 'people' | 'question' | 'history'
  | 'preview' | 'code' | 'diff' | 'tests' | 'evidence' | 'settings'

function Document({ size = 18, className }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 15.5h6" /></svg>)
}
function Stories({ size = 18, className }: IconProps) {
  return (<svg {...base(size)} className={className}><rect x="4" y="5" width="16" height="4.5" rx="1" /><rect x="4" y="14.5" width="16" height="4.5" rx="1" /></svg>)
}
function Table({ size = 18, className }: IconProps) {
  return (<svg {...base(size)} className={className}><rect x="4" y="5" width="16" height="14" rx="1.5" /><path d="M4 10h16M10 5v14" /></svg>)
}
function Risk({ size = 18, className }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M12 4 3 19h18z" /><path d="M12 10v4M12 16.5v.5" /></svg>)
}
function People({ size = 18, className }: IconProps) {
  return (<svg {...base(size)} className={className}><circle cx="9" cy="9" r="3" /><path d="M4 19a5 5 0 0 1 10 0" /><path d="M16 7a3 3 0 0 1 0 6M20 19a5 5 0 0 0-3-4.6" /></svg>)
}
function Question({ size = 18, className }: IconProps) {
  return (<svg {...base(size)} className={className}><circle cx="12" cy="12" r="8.5" /><path d="M9.5 9.5a2.5 2.5 0 0 1 4.8.9c0 1.7-2.3 2-2.3 3.6" /><path d="M12 17v.5" /></svg>)
}
function History({ size = 18, className }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M4 12a8 8 0 1 1 2.3 5.6" /><path d="M4 12H2m2 0V9.5M4 12l2 .3" /><path d="M12 8v4l2.5 2" /></svg>)
}
function Preview({ size = 18, className }: IconProps) {
  return (<svg {...base(size)} className={className}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18" /><circle cx="6" cy="7" r=".3" /></svg>)
}
function Code({ size = 18, className }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" /></svg>)
}
function Diff({ size = 18, className }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M6 3v7M3 6.5h6M6 21v-4" /><path d="M18 21v-7M15 17.5h6M18 3v4" /></svg>)
}
function Tests({ size = 18, className }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M5 12.5 10 17l9-10" /></svg>)
}
function Evidence({ size = 18, className }: IconProps) {
  return (<svg {...base(size)} className={className}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>)
}
function Settings({ size = 18, className }: IconProps) {
  return (<svg {...base(size)} className={className}><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></svg>)
}

export const VIEW_ICON: Record<ViewIconId, (p: IconProps) => React.JSX.Element> = {
  document: Document, stories: Stories, table: Table, risk: Risk, people: People,
  question: Question, history: History, preview: Preview, code: Code, diff: Diff,
  tests: Tests, evidence: Evidence, settings: Settings,
}
