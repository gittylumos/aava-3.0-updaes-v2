import { AnimatePresence, motion } from 'motion/react'
import type { TaskContext } from '../../state/types'
import { prefersReducedMotion } from '../../state/timing'

type ConnKind = NonNullable<TaskContext['connected']>[number]['kind']

const KIND_ICON: Record<ConnKind, React.ReactNode> = {
  file: (
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Zm0 0v5h5" />
  ),
  design: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16M10 4v16" />
    </>
  ),
  api: <path d="M8 6 3 12l5 6M16 6l5 6-5 6M13.5 4l-3 16" />,
  git: (
    <>
      <circle cx="7" cy="6.5" r="2.5" />
      <circle cx="7" cy="17.5" r="2.5" />
      <circle cx="17" cy="12" r="2.5" />
      <path d="M7 9v6M14.5 12H12a5 5 0 0 1-5-5" />
    </>
  ),
}

function Section({ label, count, children }: {
  label: string
  count?: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-5 first:mt-0">
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[.15em]" style={{ color: 'var(--muted-deep)' }}>
          {label}
        </h3>
        {count && (
          <span className="mono text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{count}</span>
        )}
      </div>
      {children}
    </section>
  )
}

/* Task context, grouped the way a reviewer reads it: what was asked, what was
 * agreed, what it took, what it touched, what it cost. Collapsed by default so
 * the split arrangement is unchanged until you go looking for the detail. */
export function ContextPane({ open, ctx }: { open: boolean; ctx: TaskContext }) {
  const met = ctx.criteria.filter((c) => c.met).length
  const reduced = prefersReducedMotion()

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          key="context-pane"
          aria-label="Task context"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 292, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={reduced ? { duration: 0.01 } : { duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0 overflow-hidden"
          style={{ borderRight: '1px solid var(--glass-line-soft)' }}
        >
          <div className="h-full w-[292px] overflow-y-auto px-4 py-4">
            {/* Ticket — the anchor everything else hangs off. */}
            <div
              className="mb-1 flex items-center gap-2 rounded-[var(--r-sm)] px-3 py-2.5"
              style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}
            >
              <span className="mono text-[12px] font-semibold">{ctx.ticket}</span>
              <span className="ml-auto text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>
                {ctx.ticketSource}
              </span>
            </div>

            <Section label="Description">
              <p className="text-[12.5px] leading-[1.6] text-pretty" style={{ color: 'var(--muted)' }}>
                {ctx.description}
              </p>
            </Section>

            <Section label="Acceptance criteria" count={`${met}/${ctx.criteria.length}`}>
              <ul className="grid gap-1.5">
                {ctx.criteria.map((c) => (
                  <li key={c.text} className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-2.5">
                    <span
                      className="mt-[1px] grid h-4 w-4 place-items-center rounded-[5px] text-[9px] leading-none"
                      style={{
                        background: c.met ? 'var(--ok-surface)' : 'var(--warn-surface)',
                        color: c.met ? 'var(--ok)' : 'var(--warn)',
                      }}
                    >
                      {c.met ? '✓' : '!'}
                    </span>
                    <span>
                      <span className="block text-[12.5px] leading-[1.45]" style={{ color: 'var(--text-dim)' }}>
                        {c.text}
                      </span>
                      {/* An unmet criterion without a reason is just a red mark. */}
                      {c.note && (
                        <span className="mt-1 block text-[11.5px] leading-[1.45]" style={{ color: 'var(--muted-deep)' }}>
                          {c.note}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            {ctx.capabilities?.length ? (
            <Section label="Capabilities used">
              <div className="flex flex-wrap gap-1.5">
                {ctx.capabilities.map((c) => (
                  <span
                    key={c}
                    className="rounded-[6px] px-2 py-1 text-[11px]"
                    style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </Section>
            ) : null}

            {ctx.related?.length ? (
            <Section label="Related work">
              <div className="grid grid-cols-[minmax(0,1fr)] gap-1">
                {ctx.related.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-[var(--r-sm)] px-2.5 py-2"
                    style={{ background: 'var(--wash-1)' }}
                  >
                    <span className="mono block text-[11px]" style={{ color: 'var(--muted-deep)' }}>{r.id}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug" style={{ color: 'var(--text-dim)' }}>
                      {r.title}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
            ) : null}

            {ctx.connected?.length ? (
            <Section label="Connected context">
              <div className="grid grid-cols-[minmax(0,1fr)] gap-1">
                {ctx.connected.map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center gap-2.5 rounded-[var(--r-sm)] px-2.5 py-2"
                    style={{
                      background: c.denied ? 'var(--danger-surface)' : 'var(--wash-1)',
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                      className="shrink-0"
                      style={{ color: c.denied ? 'var(--danger)' : 'var(--muted-deep)' }} aria-hidden="true">
                      {KIND_ICON[c.kind]}
                    </svg>
                    <span
                      className="mono min-w-0 flex-1 truncate text-[11.5px]"
                      style={{
                        color: c.denied ? 'var(--danger)' : 'var(--text-dim)',
                        textDecoration: c.denied ? 'line-through' : undefined,
                        textDecorationThickness: c.denied ? '1px' : undefined,
                      }}
                    >
                      {c.label}
                    </span>
                    <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-[.1em]"
                      style={{ color: c.denied ? 'var(--danger)' : 'var(--muted-deep)' }}>{c.source}</span>
                  </div>
                ))}
              </div>
            </Section>
            ) : null}

            <Section label="Run summary">
              <div
                className="rounded-[var(--r-sm)] px-3 py-2.5"
                style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--text-dim)' }}>
                    {ctx.run.agent}
                  </span>
                  {ctx.run.golden && (
                    <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.06em]"
                      style={{ background: 'var(--warn-surface)', color: 'var(--warn)' }}>
                      Golden
                    </span>
                  )}
                </div>
                {ctx.run.certified && (
                  <p className="mb-2 text-[11px]" style={{ color: 'var(--muted-deep)' }}>
                    Certified {ctx.run.certified} · {ctx.run.accepts} prior acceptances
                  </p>
                )}
                {/* Only rows that exist. A blank "Branch —" would imply work
                    that was never started. */}
                {([
                  ['Branch', ctx.run.branch],
                  ['Tokens', ctx.run.tokens],
                  ['Est. cost', ctx.run.cost],
                ] as const)
                  .filter(([, v]) => Boolean(v))
                  .map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-3 py-[3px]">
                      <span className="text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>{k}</span>
                      <span className="mono truncate text-[11.5px]" style={{ color: 'var(--text-dim)' }}>{v}</span>
                    </div>
                  ))}

                {/* Where it stopped, and why. The most useful line on an
                    unfinished task. */}
                {ctx.run.halted && (
                  <p
                    className="mt-2.5 rounded-[6px] px-2 py-1.5 text-[11.5px] leading-[1.45]"
                    style={{ background: 'var(--warn-surface)', color: 'var(--warn)' }}
                  >
                    {ctx.run.halted}
                  </p>
                )}
              </div>
            </Section>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
