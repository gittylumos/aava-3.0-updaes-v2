/* Overview — the tab every workspace opens on, in every session.
 *
 *   tools              Browser · Code · Terminal · Changes — the same four the
 *                      "+" opens, as tiles (locked where the session has no code)
 *   Artifacts          what this session produced
 *   Connected context  where the work came from — tickets, designs, branches,
 *                      sources — as real links
 *   Recents            what was opened here lately; open by default
 *
 * Left-aligned, compact accordions — the Claude Code side-panel shape. What
 * goes in each list is state/overview.ts's call; this only lays it out.
 */
import { useState } from 'react'
import type { OverviewData, OverviewIcon, OverviewRow } from '../../state/overview'
import type { WorkspaceTab } from '../../state/workspace'
import { SOURCE_META } from '../chat/InlineSource'
import { Tooltip } from '../chrome/Tooltip'
import { TabTypeIcon } from './TabIcon'

interface Props {
  data: OverviewData
  recents: OverviewRow[]
  onOpen: (tab: WorkspaceTab) => void
}

function RowIcon({ icon, name }: { icon: OverviewIcon; name?: string }) {
  if ('tab' in icon) return <TabTypeIcon type={icon.tab} size={14} name={name} />
  const { Logo } = SOURCE_META[icon.logo]
  /* Figma's mark is taller than wide — size it by height so the column lines up. */
  return <span className="grid h-4 w-4 place-items-center overflow-hidden">{icon.logo === 'figma' ? <Logo size={10.5} /> : <Logo size={14} />}</span>
}

export function Overview({ data, recents, onOpen }: Props) {
  return (
    <div className="@container h-full min-h-0 overflow-auto px-4 pb-6 pt-4">
      {/* The tools — same four as the "+", as tiles. */}
      <div className="grid grid-cols-2 gap-2 @sm:grid-cols-4">
        {data.tools.map(({ tab, locked, hint }) => (
          <Tooltip key={tab.id} label={locked ? (hint ?? 'Not ready yet') : `Open ${tab.label}`} side="bottom">
            <button disabled={locked} onClick={() => onOpen(tab)}
              className="press flex flex-col items-start gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-[var(--wash-3)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[var(--wash-1)]"
              style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
              <span style={{ color: 'var(--muted)' }}><TabTypeIcon type={tab.type} size={16} /></span>
              <span className="text-[12.5px] font-medium" style={{ color: 'var(--text-dim)' }}>{tab.label}</span>
            </button>
          </Tooltip>
        ))}
      </div>

      <Section title="Artifacts" rows={data.artifacts} defaultOpen onOpen={onOpen} />
      <Section title="Connected context" rows={data.context} onOpen={onOpen} />
      <Section title="Recents" rows={recents} defaultOpen onOpen={onOpen} />
    </div>
  )
}

const FOLD = 5

/* An empty section is just its header reading 0 — the count says it. */
function Section({ title, rows, defaultOpen, onOpen }: {
  title: string; rows: OverviewRow[]; defaultOpen?: boolean; onOpen: (tab: WorkspaceTab) => void
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  const [all, setAll] = useState(false)
  const shown = all ? rows : rows.slice(0, FOLD)
  return (
    <section className="mt-5">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="press flex items-center gap-2 rounded-[6px] py-0.5 text-[12.5px] transition-colors hover:text-[var(--text-dim)]"
        style={{ color: 'var(--muted)' }}>
        {title}
        <span className="mono grid h-[18px] min-w-[20px] place-items-center rounded-[6px] px-1.5 text-[10.5px] tabular-nums"
          style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}>{rows.length}</span>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
          style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform var(--dur) var(--ease)' }}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
      {open && rows.length > 0 && (
        <div className="mt-1.5 grid">
          {shown.map((r) => <RowItem key={r.key} row={r} onOpen={onOpen} />)}
          {rows.length > FOLD && (
            <button onClick={() => setAll((a) => !a)}
              className="press mt-0.5 w-fit rounded-[6px] py-1 text-left text-[12px] transition-colors hover:text-[var(--text-dim)]"
              style={{ color: 'var(--muted-deep)' }}>
              {all ? 'Show less' : `See all (${rows.length})`}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function RowItem({ row, onOpen }: { row: OverviewRow; onOpen: (tab: WorkspaceTab) => void }) {
  const inner = (
    <>
      <span className="grid h-5 w-5 shrink-0 place-items-center" style={{ color: 'var(--muted)' }}><RowIcon icon={row.icon} name={row.label} /></span>
      <span className={`min-w-0 truncate ${row.mono ? 'mono text-[12px]' : 'text-[13px]'}`} style={{ color: 'var(--text-dim)' }}>{row.label}</span>
      {row.meta && <span className="min-w-0 flex-1 truncate text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>{row.meta}</span>}
      {row.href && (
        <svg className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ color: 'var(--muted)' }}>
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      )}
    </>
  )
  const cls = 'group -mx-2 flex min-w-0 items-center gap-2.5 rounded-[8px] px-2 py-[6px] text-left transition-colors'
  if (row.href) return <a href={row.href} target="_blank" rel="noreferrer" className={`${cls} hover:bg-[var(--wash-2)]`}>{inner}</a>
  if (row.tab) {
    const tab = row.tab
    return <button onClick={() => onOpen(tab)} className={`press ${cls} hover:bg-[var(--wash-2)]`}>{inner}</button>
  }
  return <div className={cls}>{inner}</div>
}
