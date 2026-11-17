/* "Validation results.md" in a read-only markdown preview (web: the
   Validation tab). Built from the same scenario data the web Tests tab reads,
   with the same rule for when a failing spec turns green — the preview and the
   conversation can never tell different stories. */
import type { ReactNode } from 'react'
import type { Scenario } from '../../state/types'

export function MarkdownTab({ scenario, prepAt }: { scenario: Scenario; prepAt: number }) {
  const { specs, coveragePct, gatePct, file, failing, failUntil } = scenario.tests
  const specFile = file ?? 'feedback-form.component.spec.ts'
  const failed = new Set(prepAt <= (failUntil ?? -1) ? failing ?? [] : [])
  const passed = specs.length - failed.size
  const coverageOk = coveragePct >= gatePct

  const checks: { ok: boolean; text: string }[] = [
    { ok: failed.size === 0, text: `Unit specs — ${passed} of ${specs.length} passing` },
    { ok: coverageOk, text: `Coverage gate — ${coveragePct}% against a ${gatePct}% minimum` },
    ...[...failed].map((s) => ({ ok: false, text: `Failing: ${s}` })),
  ]

  return (
    <div className="h-full min-h-0 overflow-auto" style={{ background: 'var(--slab)' }}>
      <article className="mx-auto max-w-[720px] px-8 py-7 text-[13px] leading-[1.6]" style={{ color: 'var(--text-dim)' }}>
        <h1 className="pb-2 text-[22px] font-semibold leading-tight"
          style={{ color: 'var(--text)', borderBottom: '1px solid var(--glass-line-soft)' }}>
          Validation results
        </h1>
        <p className="mt-3">
          <strong style={{ color: 'var(--text)' }}>{passed} of {specs.length} specs passing</strong>
          {' · '}coverage {coveragePct}% (gate {gatePct}%) · <code className="mono text-[12px]">{specFile}</code>
        </p>

        <h2 className="mt-6 pb-1 text-[16px] font-semibold"
          style={{ color: 'var(--text)', borderBottom: '1px solid var(--glass-line-soft)' }}>Checks</h2>
        <ul className="mt-2 grid gap-1">
          {checks.map((c) => (
            <li key={c.text} className="flex gap-2">
              <span aria-label={c.ok ? 'passed' : 'failed'} className="w-4 shrink-0 text-center"
                style={{ color: 'var(--text)' }}>{c.ok ? '✓' : '✗'}</span>
              <span>{c.text}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-6 pb-1 text-[16px] font-semibold"
          style={{ color: 'var(--text)', borderBottom: '1px solid var(--glass-line-soft)' }}>Specs</h2>
        <table className="mt-3 w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <Th>Spec</Th><Th>Result</Th><Th right>Time</Th>
            </tr>
          </thead>
          <tbody>
            {specs.map((s, i) => (
              <tr key={s}>
                <Td>{s}</Td>
                <Td>{failed.has(s) ? '✗ failed' : '✓ passed'}</Td>
                <Td right mono>{8 + i * 3}ms</Td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-6 pb-1 text-[16px] font-semibold"
          style={{ color: 'var(--text)', borderBottom: '1px solid var(--glass-line-soft)' }}>Coverage</h2>
        <table className="mt-3 w-full border-collapse text-[12.5px]">
          <thead>
            <tr><Th>Metric</Th><Th right>Value</Th></tr>
          </thead>
          <tbody>
            <tr><Td>Line coverage</Td><Td right mono>{coveragePct}%</Td></tr>
            <tr><Td>Gate</Td><Td right mono>{gatePct}%</Td></tr>
            <tr><Td>Result</Td><Td right>{coverageOk ? '✓ above gate' : '✗ below gate'}</Td></tr>
          </tbody>
        </table>
      </article>
    </div>
  )
}

function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return (
    <th className={`px-2.5 py-1.5 font-semibold ${right ? 'text-right' : 'text-left'}`}
      style={{ color: 'var(--text)', border: '1px solid var(--glass-line)', background: 'var(--wash-2)' }}>
      {children}
    </th>
  )
}

function Td({ children, right, mono }: { children: ReactNode; right?: boolean; mono?: boolean }) {
  return (
    <td className={`px-2.5 py-1 ${right ? 'text-right' : ''} ${mono ? 'mono tabular-nums' : ''}`}
      style={{ border: '1px solid var(--glass-line)' }}>
      {children}
    </td>
  )
}
