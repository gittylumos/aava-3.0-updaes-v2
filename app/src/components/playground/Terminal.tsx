/* The terminal artifact — a console pane, no mini-header (per the reference the
 * terminal renders bare). A scripted session, not a live shell: enough output
 * to read as a real dev terminal for the demo, ending on a live prompt. */
import type { Scenario } from '../../state/types'

type Line = { text: string; tone?: 'dim' | 'ok' | 'warn' | 'cmd' }

function sessionFor(scenario: Scenario | null): Line[] {
  /* A session with no code (a PRD, an analytics run) has no dev server to
     show — just a shell, waiting. */
  if (!scenario) return [{ text: 'aava workspace · zsh', tone: 'dim' }, { text: '' }]
  const port = scenario?.fileOrder.some((f) => f.endsWith('.html')) ? '4200' : '5173'
  return [
    { text: '$ npm run dev', tone: 'cmd' },
    { text: '' },
    { text: '> aava@0.0.1 dev', tone: 'dim' },
    { text: '> vite', tone: 'dim' },
    { text: '' },
    { text: `  VITE ready in 412 ms`, tone: 'ok' },
    { text: '' },
    { text: `  ➜  Local:   http://localhost:${port}/`, tone: 'ok' },
    { text: `  ➜  Network: use --host to expose`, tone: 'dim' },
    { text: '' },
    { text: '  watching for file changes…', tone: 'dim' },
  ]
}

const TONE: Record<NonNullable<Line['tone']>, string> = {
  dim: 'var(--muted)',
  ok: 'var(--done)',
  warn: 'var(--warn)',
  cmd: 'var(--text)',
}

export function TerminalBody({ scenario }: { scenario: Scenario | null }) {
  const lines = sessionFor(scenario)
  return (
    <div className="mono h-full min-h-0 overflow-auto px-4 py-3 text-[12px] leading-[1.7]"
      style={{ background: 'var(--ground)', color: 'var(--text-dim)' }}>
      {lines.map((l, i) => (
        <div key={i} style={{ color: l.tone ? TONE[l.tone] : 'var(--text-dim)', whiteSpace: 'pre' }}>
          {l.text || ' '}
        </div>
      ))}
      {/* A live prompt with a blinking caret — the session is idle, waiting. */}
      <div className="flex items-center gap-1" style={{ color: 'var(--text)' }}>
        <span>$</span>
        <span className="inline-block h-[14px] w-[7px] animate-pulse" style={{ background: 'var(--muted)' }} aria-hidden />
      </div>
    </div>
  )
}
