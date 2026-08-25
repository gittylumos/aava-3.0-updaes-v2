import type { Scenario } from '../../state/types'

export function Tests({ scenario, prepAt }: { scenario: Scenario; prepAt: number }) {
  const { specs, coveragePct, gatePct, file, failing, failUntil } = scenario.tests
  /* Failures belong to a moment in the run, not to the scenario. Once the run
     is past the step that resolves them, the tab has to say so — otherwise it
     sits there red while the conversation says it is green. */
  const open = prepAt <= (failUntil ?? -1)
  const failed = new Set(open ? failing ?? [] : [])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="mono text-[12px]">{file ?? 'feedback-form.component.spec.ts'}</span>
        <span className="text-[10px] uppercase tracking-[.13em]">
          <span style={{ color: 'var(--ok)' }}>{specs.length - failed.size} passed</span>
          {!!failed.size && <span style={{ color: 'var(--danger)' }}> · {failed.size} failed</span>}
        </span>
      </div>

      {specs.map((s, i) => (
        <div key={s} className="flex items-center gap-2 py-1 text-[12px]">
          <span style={{ color: failed.has(s) ? 'var(--danger)' : 'var(--ok)' }}>{failed.has(s) ? '✕' : '✓'}</span>
          <span className="flex-1" style={{ color: failed.has(s) ? 'var(--danger)' : 'var(--text-dim)' }}>{s}</span>
          <span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>{8 + i * 3}ms</span>
        </div>
      ))}

      <div className="mt-3 flex items-center gap-3">
        <span className="mono text-[18px] font-semibold" style={{ color: 'var(--ok)' }}>{coveragePct}%</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--wash-4)' }}>
          <div className="h-full rounded-full" style={{ width: `${coveragePct}%`, background: 'var(--ok)' }} />
        </div>
        <span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>gate {gatePct}%</span>
      </div>
    </div>
  )
}
