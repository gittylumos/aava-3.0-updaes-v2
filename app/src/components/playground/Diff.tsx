import type { DiffGroup } from '../../state/types'

const TONE = {
  ctx: { color: 'var(--muted-deep)', background: 'transparent' },
  del: { color: 'var(--danger)', background: 'rgba(255,107,107,.08)' },
  add: { color: 'var(--ok)', background: 'rgba(74,222,128,.10)' },
}

export function Diff({ groups }: { groups: DiffGroup[] }) {
  return (
    <div className="grid gap-3">
      {groups.map((g) => (
        <div key={g.repo} className="rounded-[var(--r-sm)] p-3" style={{ background: 'var(--slab)' }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold">{g.repo}</span>
            <span className="mono text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{g.branch}</span>
          </div>
          {g.files.map((f) => (
            <div key={f} className="mono text-[11.5px]" style={{ color: 'var(--muted)' }}>{f}</div>
          ))}
          {g.lines?.map((l, i) => (
            <div key={i} className="mono -mx-1 rounded px-1 text-[11.5px]" style={TONE[l.tone]}>{l.text}</div>
          ))}
        </div>
      ))}
    </div>
  )
}
