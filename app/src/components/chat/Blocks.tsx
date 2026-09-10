import { useState } from 'react'
import type { ArtifactMatch, BlockSpec, TabId } from '../../state/types'
import type { BacklogDoc } from '../../prd/backlog'
import type { InsightView } from '../../prd/insight'
import type { ReportView } from '../../prd/report'
import { ToolSteps } from './ToolSteps'

type DecisionSpec = Extract<BlockSpec, { kind: 'decision' }>

/* Artifact-type tone — reuses the orchestration canvas colour semantics:
   Process = indigo (brand), Workflow = blue, Agent = green. */
const ARTIFACT_TONE: Record<ArtifactMatch['type'], React.CSSProperties> = {
  Process: { background: 'color-mix(in srgb, var(--brand) 16%, transparent)', color: 'var(--brand)' },
  Workflow: { background: 'color-mix(in srgb, var(--zone-canvas-accent) 16%, transparent)', color: 'var(--zone-canvas-accent)' },
  Agent: { background: 'color-mix(in srgb, var(--ok) 18%, transparent)', color: 'var(--ok)' },
}

function ArtifactGlyph({ type }: { type: ArtifactMatch['type'] }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'Process') return <svg viewBox="0 0 24 24" width="15" height="15" {...p} aria-hidden><rect x="3" y="4" width="7" height="5" rx="1.5" /><rect x="14" y="15" width="7" height="5" rx="1.5" /><rect x="3" y="15" width="7" height="5" rx="1.5" /><path d="M6.5 9v6M10 17.5h4M6.5 12h8.5a2 2 0 0 1 2 2v1" /></svg>
  if (type === 'Workflow') return <svg viewBox="0 0 24 24" width="15" height="15" {...p} aria-hidden><path d="M4 7h10M4 12h16M4 17h7" /><circle cx="18" cy="7" r="2" /><circle cx="14" cy="17" r="2" /></svg>
  return <svg viewBox="0 0 24 24" width="15" height="15" {...p} aria-hidden><rect x="4" y="7" width="16" height="12" rx="2.5" /><path d="M12 3v4M9 13h.01M15 13h.01" /></svg>
}

type ArtifactsSpec = Extract<BlockSpec, { kind: 'artifacts' }>

/* The match badge — best fit reads amber ("Best fit"), the rest brand. */
function matchTone(best: boolean): React.CSSProperties {
  return best
    ? { background: 'color-mix(in srgb, var(--warn) 20%, transparent)', color: 'var(--warn)' }
    : { background: 'color-mix(in srgb, var(--brand) 16%, transparent)', color: 'var(--brand)' }
}

/* A small stat chip — the adoption signals under a match. */
function Stat({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className="flex items-center gap-1 rounded-[6px] px-1.5 py-[2px] text-[10.5px]"
      style={{ background: 'var(--wash-2)', color: tone ?? 'var(--muted)' }}>{children}</span>
  )
}

/* One ranked process match. Clicking it opens the builder on the canvas.
   Compact hierarchy: title + a prominent match %, the workflow as a quiet
   sub-line, the fit rationale, then the adoption stats as chips. */
function MatchCard({ a, best, onOpen }: { a: ArtifactMatch; best: boolean; onOpen?: (id: string) => void }) {
  return (
    <button onClick={() => onOpen?.(a.id)}
      className="press group relative flex w-full gap-3 overflow-hidden rounded-[var(--r-md)] p-3 pl-3.5 text-left transition-colors hover:bg-[var(--wash-3)]"
      style={{
        background: best ? 'color-mix(in srgb, var(--warn) 6%, var(--slab))' : 'var(--slab)',
        border: `1px solid ${best ? 'color-mix(in srgb, var(--warn) 38%, transparent)' : 'var(--glass-line)'}`,
      }}>
      {/* Best-fit accent rail. */}
      {best && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: 'var(--warn)' }} />}

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px]" style={ARTIFACT_TONE[a.type]}>
            <ArtifactGlyph type={a.type} />
          </span>
          <span className="truncate text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{a.title}</span>
          {best && (
            <span className="flex shrink-0 items-center gap-1 rounded-full px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-[.06em]" style={matchTone(true)}>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" aria-hidden><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              Best fit
            </span>
          )}
        </div>
        <div className="truncate text-[11px]" style={{ color: 'var(--muted-deep)' }} title={a.workflow}>{a.workflow}</div>
        <div className="text-[11.5px] leading-[1.45]" style={{ color: 'var(--text-dim)' }}>{a.why}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <Stat tone="var(--ok)"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12.5 4.5 4.5L19 7" /></svg><span className="mono">{a.uses}</span> uses</Stat>
          <Stat><span className="mono">{a.version}</span></Stat>
          {a.teams ? <Stat><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3 3 0 100-6 3 3 0 000 6M22 20v-1a4 4 0 0 0-3-3.87M16 5.13A4 4 0 0119 9" /></svg>{a.teams} teams</Stat> : null}
        </div>
      </div>

      {/* The match % — the card's headline stat. */}
      <div className="flex shrink-0 flex-col items-end justify-start">
        <span className="text-[17px] font-bold leading-none" style={{ color: best ? 'var(--warn)' : 'var(--brand)' }}>{a.match}%</span>
        <span className="text-[9px] font-semibold uppercase tracking-[.08em]" style={{ color: 'var(--muted-deep)' }}>match</span>
        <span className="mt-auto flex items-center gap-1 pt-2 text-[10.5px] font-medium opacity-0 transition-opacity group-hover:opacity-100" style={{ color: 'var(--brand)' }}>
          View
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
    </button>
  )
}

/* The catalog window — a titled container (no copy control) that holds the
   ranked matches and maximises to a modal, so a long match list stays usable. */
function ArtifactCatalog({ block, onOpen }: { block: ArtifactsSpec; onOpen?: (id: string) => void }) {
  const [modal, setModal] = useState(false)
  const items = [...block.items].sort((a, b) => b.match - a.match)
  const bestId = items[0]?.id
  const heading = block.title ?? `${items.length} matching artifacts`

  const Header = ({ inModal }: { inModal: boolean }) => (
    <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px]" style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></svg>
      </span>
      <span className="text-[12.5px] font-semibold" style={{ color: 'var(--text-dim)' }}>{heading}</span>
      <span className="mono ml-auto text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>Artifact catalog</span>
      {inModal ? (
        <button onClick={() => setModal(false)} aria-label="Close" className="press grid h-7 w-7 place-items-center rounded-[7px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      ) : (
        <button onClick={() => setModal(true)} aria-label="Maximize" title="Maximize" className="press grid h-7 w-7 place-items-center rounded-[7px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
        </button>
      )}
    </div>
  )

  return (
    <>
      <div className="mt-3 w-full max-w-[560px] overflow-hidden rounded-[var(--r-md)]" style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
        <Header inModal={false} />
        <div className="flex flex-col gap-2.5 p-3">
          {items.map((a) => <MatchCard key={a.id} a={a} best={a.id === bestId} onOpen={onOpen} />)}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4" style={{ background: 'var(--scrim)' }} onClick={() => setModal(false)}>
          <div className="flex max-h-[82vh] w-full max-w-[620px] flex-col overflow-hidden rounded-[var(--r-lg)]"
            style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)', boxShadow: 'var(--shadow-pop)' }}
            onClick={(e) => e.stopPropagation()}>
            <Header inModal />
            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3.5">
              {items.map((a) => <MatchCard key={a.id} a={a} best={a.id === bestId} onOpen={(id) => { setModal(false); onOpen?.(id) }} />)}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface Props {
  block: BlockSpec
  live: boolean
  /** The running app, for the `app` card's thumbnail. Injected rather than
      reached for — the conversation never touches the playground itself. */
  preview: React.ReactNode
  onAccept: (beat: string) => void
  onDismiss: () => void
  onOpenFile?: (file: string) => void
  onOpenTab?: (tab: TabId) => void
  /** Reveal the artefact panel — the document card's Open button. A doc opens
      that specific backlog document; no doc just reveals the panel. */
  onOpenArtifact?: (doc?: BacklogDoc, insight?: InsightView, report?: ReportView) => void
  /** An artifact match card's click — open the orchestration builder on it. */
  onOpenAgentArtifact?: (id: string) => void
  /** Record what the user typed into a gate's inline textarea (the gate's own
      message id is already bound in). */
  onRecordAnswer?: (text: string) => void
  /** The note the user recorded on this gate, shown back once it is answered. */
  answer?: string
}

export function Block({ block, live, preview, onAccept, onDismiss, onOpenFile, onOpenTab, onOpenArtifact, onOpenAgentArtifact, onRecordAnswer, answer }: Props) {
  if (block.kind === 'tools') return <ToolSteps steps={block.steps} done={block.done} title={block.title} />

  if (block.kind === 'capability') return <Capability block={block} />
  if (block.kind === 'connect') return <Connect block={block} live={live} onAccept={onAccept} />
  if (block.kind === 'plan') return <Plan block={block} live={live} onAccept={onAccept} onDismiss={onDismiss} onRecordAnswer={onRecordAnswer} answer={answer} />

  /* A Jira push offer — shown after every phase gate. The primary action carries
     the Jira logo and publishes that level; the secondary ("Proceed for now")
     continues the run without pushing. Both advance to the next phase. */
  if (block.kind === 'sync') {
    return (
      <div className="mt-3 w-full max-w-[460px] rounded-[var(--r-md)] px-3.5 py-3"
        style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[9px]"
            style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
            <JiraLogo size={22} />
          </span>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <span className="truncate text-[13px] font-semibold">{block.title}</span>
            <span className="text-[11.5px]" style={{ color: 'var(--muted)' }}>{block.detail}</span>
          </div>
          {/* Retired state reflects the choice — "Published" only if they actually
              pushed; "Skipped" if they chose to skip instead. */}
          {!live && <span className="shrink-0 text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>{answer === 'proceeded' ? 'Skipped' : 'Published'}</span>}
        </div>
        {live && (
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {block.secondaryLabel && block.secondaryBeat && (
              <button onClick={() => { onRecordAnswer?.('proceeded'); onAccept(block.secondaryBeat!) }}
                className="btn-secondary">
                {block.secondaryLabel}
              </button>
            )}
            <button onClick={() => { onDismiss(); onAccept(block.beat) }} className="btn-primary shrink-0">
              {block.primaryLabel ?? 'Publish'}
            </button>
          </div>
        )}
      </div>
    )
  }

  /* A generated document, as a card in the chat. The file's name and format sit
     beside a document glyph; Open reveals the document canvas on the right. */
  if (block.kind === 'document') {
    return (
      <div className="mt-3 flex w-full max-w-[440px] items-center gap-3 rounded-[var(--r-md)] px-3.5 py-3"
        style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[9px]"
          style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 15.5h6" />
          </svg>
        </span>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-[13px] font-semibold">{block.name}</span>
          <span className="text-[11.5px]" style={{ color: 'var(--muted)' }}>Document · {block.format}</span>
        </div>
        <button onClick={() => onOpenArtifact?.(block.doc, block.insight, block.report)}
          className="press rounded-full px-3.5 py-1.5 text-[12px] font-medium hover:bg-[var(--wash-4)] hover:text-[var(--text-dim)]"
          style={{ background: 'var(--glass)', color: 'var(--muted)', minHeight: 'var(--hit)', border: '1px solid var(--glass-line-soft)' }}>
          Open
        </button>
      </div>
    )
  }

  /* A validator's finding, as a scoreboard rather than a sentence. The four
     numbers are the whole verdict; the failing checks are printed because they
     are usually the reason the run stopped and asked for a human. */
  if (block.kind === 'validation') {
    const { tests, passed, failed, warnings } = block.counts
    const stats: [string, number, string][] = [
      ['Tests', tests, 'var(--text)'],
      ['Passed', passed, 'var(--ok)'],
      ['Failed', failed, failed ? 'var(--danger)' : 'var(--muted-deep)'],
      ['Warnings', warnings, warnings ? 'var(--warn)' : 'var(--muted-deep)'],
    ]
    const open = () => onOpenTab?.('tests')
    return (
      /* The card is the way into the full results — the scoreboard is a summary
         of a tab, so reading it and then hunting for that tab in the strip was a
         stop on the way to the thing it summarises. A div, not a button: the
         file link inside it is one already. */
      <div role="button" tabIndex={0} onClick={open}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } }}
        title="Open the Validation Agent results"
        className="press mt-3 cursor-pointer overflow-hidden rounded-[var(--r-md)] transition-colors hover:border-[var(--glass-line)] hover:bg-[var(--wash-3)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
        style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
        <div className="flex items-center gap-2.5 px-3.5 py-2.5"
          style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          <span className="rounded-full px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-[.12em]"
            style={{ background: 'var(--text)', color: 'var(--on-text)' }}>{block.agent}</span>
          <span className="text-[12.5px] font-medium">Validation results</span>
          {block.file && (
            /* Its own destination — the spec source, not the results tab. */
            <button onClick={(e) => { e.stopPropagation(); onOpenFile?.(block.file!) }}
              className="mono press ml-auto truncate text-[11.5px] underline underline-offset-[3px] hover:text-[var(--text)]"
              style={{ color: 'var(--done)' }}>{block.file}</button>
          )}
        </div>

        <div className="grid grid-cols-4">
          {stats.map(([label, n, tone], i) => (
            <div key={label} className="grid justify-items-center gap-0.5 py-3"
              style={{ borderLeft: i ? '1px solid var(--glass-line-soft)' : undefined }}>
              <span className="mono text-[19px] font-semibold tabular-nums" style={{ color: tone }}>{n}</span>
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{label}</span>
            </div>
          ))}
        </div>

        {!!block.failing?.length && (
          <div className="px-3.5 py-3" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>
            <h4 className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[.14em]"
              style={{ color: 'var(--danger)' }}>Failing</h4>
            <ul className="grid gap-1.5 text-[12.5px]" style={{ color: 'var(--text-dim)' }}>
              {block.failing.map((f) => (
                <li key={f} className="grid grid-cols-[12px_1fr] items-start gap-2">
                  <span style={{ color: 'var(--danger)' }}>✕</span>
                  <span className="text-pretty">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  /* What was generated: the thing itself on top, named underneath, with the way
     in beside the name. The thumbnail is the running app rendered small and
     inert — not a screenshot — so an edit in the workspace shows up here too. */
  if (block.kind === 'app') {
    return (
      /* Capped: a card is an object you can take in at a glance, and stretching
         it to a 880px reading column turns it into a banner. */
      <div className="mt-3 w-full max-w-[440px] overflow-hidden rounded-[var(--r-md)]"
        style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
        {preview && (
          <div className="relative h-[150px] overflow-hidden" style={{ background: 'var(--preview-bg)' }}>
            {/* Scaled from the top-left and widened to match, so the miniature
                fills the card rather than sitting in a third of it. */}
            <div aria-hidden="true" className="pointer-events-none origin-top-left select-none"
              style={{ transform: 'scale(.62)', width: '161%' }}>
              {preview}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 px-3.5 py-3"
          style={{ borderTop: preview ? '1px solid var(--glass-line-soft)' : undefined }}>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <span className="truncate text-[13px] font-semibold">{block.name}</span>
            <span className="mono truncate text-[11px]" style={{ color: 'var(--muted)' }}>{block.status}</span>
          </div>
          <button onClick={() => onOpenTab?.('preview')}
            className="press rounded-full px-3.5 py-1.5 text-[12px] font-medium hover:bg-[var(--wash-4)] hover:text-[var(--text-dim)]"
            style={{ background: 'var(--glass)', color: 'var(--muted)', minHeight: 'var(--hit)', border: '1px solid var(--glass-line-soft)' }}>
            Open
          </button>
        </div>
      </div>
    )
  }

  if (block.kind === 'coverage') {
    return (
      <div className="mt-3 grid gap-2">
        {block.groups.map((g) => (
          <div key={g.title} className="rounded-[var(--r-md)] p-3"
            style={{
              background: 'var(--glass)',
              border: `1px solid ${g.tone === 'assumed' ? 'rgba(251,191,36,.26)' : 'var(--glass-line)'}`,
            }}>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.14em]"
              style={{ color: g.tone === 'assumed' ? 'var(--warn)' : 'var(--muted)' }}>{g.title}</h4>
            <ul className="grid gap-1.5 text-[13px] leading-[1.5]" style={{ color: 'var(--text-dim)' }}>
              {g.items.map((i) => (
                <li key={i} className="grid grid-cols-[6px_1fr] items-start gap-2.5">
                  <span className="mt-[7px] h-[3px] w-[3px] rounded-full"
                    style={{ background: g.tone === 'assumed' ? 'var(--warn)' : 'var(--muted-deep)' }} />
                  <span className="text-pretty">{i}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  if (block.kind === 'links') {
    return (
      <div className="mt-3 flex flex-wrap items-start gap-x-4 gap-y-2">
        {block.links.map((l) =>
          /* A file link opens the file in the workspace; an href link points at an
             external destination (a raised Jira ticket). Both are real links —
             underlined, and they go somewhere. A reference with neither has
             nowhere to go in a prototype, so it stays a pill. */
          l.href ? (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
              className="mono press inline-flex items-center gap-1.5 text-[12px] underline underline-offset-[3px] transition-colors hover:text-[var(--text)]"
              style={{ color: 'var(--done)' }}>
              {l.label}
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
              </svg>
            </a>
          ) : l.file ? (
            <button key={l.label} onClick={() => onOpenFile?.(l.file!)}
              className="mono press text-[12px] underline underline-offset-[3px] transition-colors hover:text-[var(--text)]"
              style={{ color: 'var(--done)' }}>
              {l.label}
            </button>
          ) : (
            <span key={l.label} className="mono rounded-full px-3 py-1.5 text-[12px]"
              style={{ background: 'rgba(91,157,255,.14)', color: 'var(--done)' }}>{l.label}</span>
          ),
        )}
      </div>
    )
  }

  /* The agent-designer capability/step list — an ordered, editable-by-talking
     process, shown as a clean card (no dock pointer). A step the user just
     added lands highlighted. */
  if (block.kind === 'process') {
    return (
      <div className="mt-3 w-full max-w-[460px] overflow-hidden rounded-[var(--r-md)]"
        style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
        {block.title && (
          <div className="px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[.14em]"
            style={{ color: 'var(--muted-deep)', borderBottom: '1px solid var(--glass-line-soft)' }}>
            {block.title}
          </div>
        )}
        {block.steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3 px-3.5 py-2.5"
            style={{ borderTop: i ? '1px solid var(--glass-line-soft)' : undefined }}>
            <span className="mono grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px]"
              style={s.added
                ? { background: 'var(--brand)', color: '#fff' }
                : { background: 'var(--wash-3)', color: 'var(--muted)' }}>{i + 1}</span>
            <span className="min-w-0 flex-1 text-[13px]" style={{ color: 'var(--text)', fontWeight: s.added ? 600 : 400 }}>{s.label}</span>
            {s.added && (
              <span className="shrink-0 rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[.06em]"
                style={{ background: 'color-mix(in srgb, var(--brand) 18%, transparent)', color: 'var(--brand)' }}>New</span>
            )}
          </div>
        ))}
      </div>
    )
  }

  /* The golden-artifact matches — a titled "catalog" window (code-block style)
     that maximises to a modal; each card opens the builder on the canvas. */
  if (block.kind === 'artifacts') {
    return <ArtifactCatalog block={block} onOpen={onOpenAgentArtifact} />
  }

  /* A human-in-the-loop gate. Three variants share the golden "waiting on you"
     treatment while live; how they ask differs. */
  if (block.kind === 'decision') {
    return <Decision block={block} live={live} onAccept={onAccept} onDismiss={onDismiss} onRecordAnswer={onRecordAnswer} answer={answer} />
  }

  // confirm
  return (
    <div className="mt-3 rounded-[var(--r-md)] p-3"
      style={{
        background: 'var(--glass)',
        /* A gate is not another card in the thread. While it is live it is the
           only thing on screen that can move the run, and it is bordered to
           say so; once answered it settles back to a plain record. */
        border: `1px solid ${live && block.step ? 'var(--warn)' : 'var(--glass-line)'}`,
      }}>
      {block.step && (
        <div className="mb-2.5">
          <span className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[.13em]"
            style={{ color: live ? 'var(--warn)' : 'var(--muted-deep)' }}>
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
              <circle cx="12" cy="8" r="3.4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
            </svg>
            {live ? 'Waiting on you' : 'Answered'} · Step {block.step}
          </span>
          {block.title && <h4 className="mt-1.5 text-[13.5px] font-semibold">{block.title}</h4>}
        </div>
      )}
      {block.rows.map((r) => (
        <div key={r.repo} className="mb-2 grid gap-0.5">
          <span className="text-[12px] font-semibold">{r.repo}</span>
          <span className="mono text-[11px]" style={{ color: 'var(--muted)' }}>{r.branch}</span>
          <span className="text-[12px]" style={{ color: 'var(--text-dim)' }}>{r.what}</span>
        </div>
      ))}
      {live && (
        /* Right-aligned, secondary on the left and the primary on the right —
           the same footer treatment as the PRD flow's decision gate. */
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button onClick={onDismiss} className="btn-secondary">
            {block.cancelLabel}
          </button>
          <button onClick={() => { onDismiss(); onAccept(block.acceptBeat) }} className="btn-primary">
            {block.acceptLabel}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Decision gates ──────────────────────────────────────────────────────────
 *
 * One card, three ways of asking. All keep the golden border while live so a
 * pending decision reads the same wherever it appears; the body differs:
 *   buttons — a pill per branch (the phase gates)
 *   action  — a single primary action with a footer button (access, "start")
 *   clarify — lettered choices + an "Other…" free-text row + Continue
 */
function GateHeader({ block, live }: { block: DecisionSpec; live: boolean }) {
  const Glyph = GATE_GLYPH[block.icon ?? 'person']
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-5 w-5 shrink-0 place-items-center" style={{ color: live ? 'var(--warn)' : 'var(--muted)' }}>
        <Glyph />
      </span>
      <h4 className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{block.title}</h4>
      {block.counter && <span className="shrink-0 text-[11px]" style={{ color: 'var(--muted)' }}>{block.counter}</span>}
    </div>
  )
}

const gateShell = (live: boolean) => ({
  background: 'var(--glass)', border: `1px solid ${live ? 'var(--warn)' : 'var(--glass-line)'}`,
})

function Decision({ block, live, onAccept, onDismiss, onRecordAnswer, answer }: {
  block: DecisionSpec; live: boolean; onAccept: (beat: string) => void; onDismiss: () => void
  onRecordAnswer?: (text: string) => void; answer?: string
}) {
  const fire = (beat: string) => { onDismiss(); onAccept(beat) }

  if (block.variant === 'action') {
    const opt = block.options[0]
    return (
      <div className="mt-3 overflow-hidden rounded-[var(--r-md)]" style={gateShell(live)}>
        <div className="p-3.5">
          <GateHeader block={block} live={live} />
          <p className="mt-2 text-[12.5px] leading-[1.55]" style={{ color: 'var(--muted)' }}>{block.question}</p>
        </div>
        <div className="flex items-center justify-end px-3.5 py-2.5" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>
          {live ? (
            <button onClick={() => fire(opt.beat)}
              className="btn-primary">
              {opt.label}
            </button>
          ) : (
            <span className="text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>Answered</span>
          )}
        </div>
      </div>
    )
  }

  if (block.variant === 'clarify') return <ClarifyGate block={block} live={live} onFire={fire} />

  if (block.variant === 'approve') {
    return (
      <div className="mt-3 overflow-hidden rounded-[var(--r-md)]" style={gateShell(live)}>
        <div className="px-3.5 pb-3 pt-3.5">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.13em]"
            style={{ color: live ? 'var(--warn)' : 'var(--muted-deep)' }}>
            <span className="grid h-4 w-4 place-items-center"><GateGlyphPerson /></span>
            {block.title}
          </span>
          <p className="mt-2 text-[12.5px]" style={{ color: 'var(--text-dim)' }}>{block.question}</p>
          {live && (
            <textarea rows={2}
              placeholder={block.placeholder ?? 'Anything missing? Please add here…'}
              className="mt-2.5 w-full resize-none rounded-[9px] px-3 py-2 text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }} />
          )}
        </div>
        {live && (
          <div className="flex flex-wrap gap-2 px-3.5 pb-3">
            {block.options.map((opt) => (
              <button key={opt.label} onClick={() => fire(opt.beat)}
                className={opt.primary ? 'btn-primary' : 'btn-secondary'}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // buttons (default)
  return <ButtonsGate block={block} live={live} fire={fire} onRecordAnswer={onRecordAnswer} answer={answer} />
}

/* The phase gate — a pill per branch. A `collect` option does not fire straight
   away: it reveals an inline textarea, and Send records the note (shown back in
   the answered card) before the beat runs. */
function ButtonsGate({ block, live, fire, onRecordAnswer, answer }: {
  block: DecisionSpec; live: boolean; fire: (beat: string) => void
  onRecordAnswer?: (text: string) => void; answer?: string
}) {
  /* Which option opened its textarea, and what has been typed into it. */
  const [collecting, setCollecting] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const opts = [...block.options].sort((a, b) => (a.primary ? 1 : 0) - (b.primary ? 1 : 0))

  const pick = (opt: DecisionSpec['options'][number], i: number) => {
    if (opt.collect) { setCollecting(collecting === i ? null : i); return }
    /* Register the action the user took, so scrolling back shows what they
       chose at this gate — the same way a typed note is shown back. */
    onRecordAnswer?.(opt.label)
    fire(opt.beat)
  }
  const send = (beat: string) => {
    const text = note.trim()
    if (!text) return
    onRecordAnswer?.(text)   // records the note + retires the gate
    fire(beat)               // then runs the branch
  }

  return (
    <div className="mt-3 rounded-[var(--r-md)] p-3" style={gateShell(live)}>
      <div className="mb-2.5">
        <span className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[.13em]"
          style={{ color: live ? 'var(--warn)' : 'var(--muted-deep)' }}>
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <circle cx="12" cy="8" r="3.4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
          </svg>
          {live ? 'Waiting on you' : 'Answered'}{block.step ? ` · Gate ${block.step}` : ''}
        </span>
        {block.title && <h4 className="mt-1.5 text-[13.5px] font-semibold">{block.title}</h4>}
      </div>
      {block.summary && block.summary.length > 0 && (
        <div className="mb-2.5 grid gap-1">
          {block.summary.map((s) => (
            <div key={s.label} className="text-[12px]">
              <span className="font-medium" style={{ color: 'var(--text-dim)' }}>{s.label}</span>
              {s.detail && <span style={{ color: 'var(--muted)' }}> — {s.detail}</span>}
            </div>
          ))}
        </div>
      )}
      <p className="text-[12.5px]" style={{ color: 'var(--text-dim)' }}>{block.question}</p>

      {/* The recorded response, shown back once the gate is answered — the action
          the user picked ("Your input") or the note they typed ("Your note"). */}
      {!live && answer && (
        <div className="mt-2.5 rounded-[8px] px-3 py-2 text-[12.5px]"
          style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>
          <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>
            {block.options.some((o) => o.label === answer) ? 'Your input' : 'Your note'}
          </span>
          {answer}
        </div>
      )}

      {live && collecting !== null && (
        /* Collecting a note — the two option buttons are REPLACED by the textarea
           and a Cancel/Send pair. Cancel returns to the original buttons. */
        <div className="mt-3">
          <textarea autoFocus rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={block.placeholder ?? 'Please describe here…'}
            className="w-full resize-none rounded-[9px] px-3 py-2 text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }} />
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <button onClick={() => { setCollecting(null); setNote('') }} className="btn-secondary">
              Cancel
            </button>
            <button onClick={() => send(opts[collecting].beat)} disabled={!note.trim()} className="btn-primary">
              Send
            </button>
          </div>
        </div>
      )}

      {live && collecting === null && (
        /* Right-aligned, secondary on the left and the primary on the right.
            Primary is plain white on black, no gradient. */
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {opts.map((opt, i) => (
            <button key={opt.label} onClick={() => pick(opt, i)}
              className={opt.primary ? 'btn-primary' : 'btn-secondary'}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* The lettered clarification panel — pick a choice (or type your own) and
   Continue. The chosen option's beat fires; "Other…" carries the typed answer. */
function ClarifyGate({ block, live, onFire }: {
  block: DecisionSpec; live: boolean; onFire: (beat: string) => void
}) {
  const [pick, setPick] = useState<number | null>(null)
  const [other, setOther] = useState('')
  const letters = 'ABCDEFGH'

  const submit = () => {
    if (pick === null) return
    onFire(block.options[pick].beat)
  }

  return (
    <div className="mt-3 overflow-hidden rounded-[var(--r-md)]" style={gateShell(live)}>
      <div className="px-3.5 pb-3 pt-3.5">
        <GateHeader block={block} live={live} />
        <p className="mt-2.5 text-[13px] font-medium" style={{ color: 'var(--text)' }}>{block.question}</p>
        <div className="mt-2.5 grid gap-1.5">
          {block.options.map((opt, i) => {
            const active = pick === i
            const isOther = opt.beat === 'other' || /^other/i.test(opt.label)
            return (
              <button key={opt.label} type="button" disabled={!live} onClick={() => setPick(i)}
                className="press flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left"
                style={{ border: `1px solid ${active ? 'var(--brand)' : 'var(--glass-line-soft)'}`, background: active ? 'var(--wash-3)' : 'transparent' }}>
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[6px] text-[10px] font-semibold"
                  style={{ background: active ? 'var(--brand)' : 'var(--wash-3)', color: active ? '#fff' : 'var(--muted)' }}>
                  {letters[i]}
                </span>
                {isOther && active ? (
                  <input autoFocus value={other} onChange={(e) => setOther(e.target.value)}
                    placeholder={block.placeholder ?? 'Add your answer…'}
                    className="min-w-0 flex-1 bg-transparent text-[12.5px] placeholder:text-[var(--muted-deep)] focus-visible:outline-none"
                    style={{ color: 'var(--text-dim)' }} />
                ) : (
                  <span className="min-w-0 flex-1 truncate text-[12.5px]"
                    style={{ color: isOther ? 'var(--muted-deep)' : active ? 'var(--text)' : 'var(--text-dim)' }}>
                    {opt.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>
        <span className="text-[11px]" style={{ color: 'var(--muted-deep)' }}>AAVA will continue after your input</span>
        {live ? (
          <button onClick={submit} disabled={pick === null} className="btn-primary">
            Continue
          </button>
        ) : (
          <span className="text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>Answered</span>
        )}
      </div>
    </div>
  )
}

const GATE_GLYPH: Record<'person' | 'question' | 'shield' | 'sparkle', () => React.JSX.Element> = {
  person: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>,
  question: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="4" width="17" height="16" rx="3" /><path d="M9.5 9.2a2.5 2.5 0 0 1 4.8.9c0 1.6-2.3 1.9-2.3 3.4M12 17v.4" /></svg>,
  shield: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="m9 12 2 2 4-4" /></svg>,
  sparkle: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>,
}

/* Capability matching — the first beat of any run. While searching it is a
   single shimmering line; once matched it becomes a card naming the capability,
   what it maps to, and the things it can do (as check chips). */
function Capability({ block }: { block: Extract<BlockSpec, { kind: 'capability' }> }) {
  if (block.searching) {
    return (
      <div className="mt-2 flex items-center gap-2 text-[13px]">
        <span className="grid h-4 w-4 shrink-0 place-items-center" style={{ color: 'var(--muted)' }}><GateGlyphSparkle /></span>
        <span className="aava-shimmer">Searching for the capabilities to complete this task…</span>
        <style>{`.aava-shimmer{background:linear-gradient(90deg,var(--muted-deep) 0%,var(--text) 20%,var(--muted-deep) 40%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:aava-sheen 1.4s linear infinite}
          @keyframes aava-sheen{to{background-position:-200% 0}}
          @media (prefers-reduced-motion: reduce){.aava-shimmer{animation:none;color:var(--muted)}}`}</style>
      </div>
    )
  }
  const body = (
    <>
      {block.maps && <p className="mt-2 text-[12.5px] leading-[1.5]" style={{ color: 'var(--muted)' }}>{block.maps}</p>}
      {block.chips && block.chips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {block.chips.map((c) => (
            <span key={c} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]"
              style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--text-dim)' }}>
              <span style={{ color: 'var(--ok)' }}>✓</span>{c}
            </span>
          ))}
        </div>
      )}
    </>
  )
  // Pre-filled runs already matched their capability — show it as a subtle,
  // collapsed one-liner the user can open, rather than a full card up front.
  if (block.collapsed) {
    return <SubtleRecord icon={<GateGlyphSparkle />} title="Capabilities matched" badge={block.badge}>{body}</SubtleRecord>
  }
  return (
    <div className="mt-3 rounded-[var(--r-md)] p-3.5" style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
      <div className="flex items-center gap-2">
        <span className="grid h-5 w-5 shrink-0 place-items-center" style={{ color: 'var(--brand)' }}><GateGlyphSparkle /></span>
        <h4 className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">Capabilities matched</h4>
        {block.badge && <span className="mono shrink-0 text-[11px]" style={{ color: 'var(--muted-deep)' }}>{block.badge}</span>}
      </div>
      {body}
    </div>
  )
}

/* A subtle, collapsed record — a one-line header (icon · title · badge · chevron)
   that opens to its detail. Used for a pre-filled run's already-done Capabilities
   and Plan, which should read as quiet context, not front-and-centre cards. */
function SubtleRecord({ icon, title, badge, children }: {
  icon: React.ReactNode; title: string; badge?: string; children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2.5 overflow-hidden rounded-[var(--r-md)]" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="press flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--wash-3)]">
        <span className="grid h-4 w-4 shrink-0 place-items-center" style={{ color: 'var(--muted)' }}>{icon}</span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium" style={{ color: 'var(--text-dim)' }}>{title}</span>
        {badge && <span className="mono shrink-0 text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{badge}</span>}
        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden className="shrink-0 transition-transform duration-200"
          style={{ color: 'var(--muted-deep)', transform: open ? 'rotate(180deg)' : undefined }}>
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="px-3.5 pb-3 pt-0.5" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>{children}</div>}
    </div>
  )
}

/* The plan card. With an `action` it is the combined "Initiate Process" card —
   the plan and its approval in one: the numbered steps, then a Proceed CTA that
   both approves the plan and starts the run. Without one it is a plain record. */
function Plan({ block, live, onAccept, onDismiss }: {
  block: Extract<BlockSpec, { kind: 'plan' }>; live: boolean
  onAccept: (beat: string) => void; onDismiss: () => void
  onRecordAnswer?: (text: string) => void; answer?: string
}) {
  const proceed = () => { if (block.action) { onDismiss(); onAccept(block.action.beat) } }

  // A pre-filled run's plan is a record of what AAVA already ran — collapse it to
  // a subtle one-liner (no Proceed; the work is done) that opens to the steps.
  if (block.collapsed) {
    return (
      <SubtleRecord icon={<PlanGlyph />} title={`${block.title ?? 'Plan'} · ${block.count} steps`}>
        <div className="grid gap-2.5 pt-1.5">
          {block.steps.map((s, i) => (
            <div key={s.title} className="flex gap-2.5">
              <span className="mono mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px]"
                style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}>{i + 1}</span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium" style={{ color: 'var(--text-dim)' }}>{s.title}</div>
                <div className="mt-0.5 text-[11.5px] leading-[1.5]" style={{ color: 'var(--muted)' }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </SubtleRecord>
    )
  }

  return (
    <div className="mt-3 overflow-hidden rounded-[var(--r-md)]"
      style={{ background: 'var(--glass)', border: `1px solid ${live && block.action ? 'var(--warn)' : 'var(--glass-line)'}` }}>
      <div className="px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[.14em]"
        style={{ color: 'var(--muted-deep)', borderBottom: '1px solid var(--glass-line-soft)' }}>
        {block.title ?? 'Proposed plan'} · {block.count} steps
      </div>
      {block.steps.map((s, i) => (
        <div key={s.title} className="flex gap-3 px-3.5 py-2.5"
          style={{ borderTop: i ? '1px solid var(--glass-line-soft)' : undefined }}>
          <span className="mono mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px]"
            style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}>{i + 1}</span>
          <div className="min-w-0">
            <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{s.title}</div>
            <div className="mt-0.5 text-[12px] leading-[1.5]" style={{ color: 'var(--muted)' }}>{s.detail}</div>
          </div>
        </div>
      ))}

      {block.action && (
        <div className="px-3.5 py-2.5" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>
          <div className={`flex items-center ${live ? 'justify-end' : 'justify-between'}`}>
            {!live && (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.13em]"
                style={{ color: 'var(--muted-deep)' }}>
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" /></svg>
                Started
              </span>
            )}
            {live ? (
              <button onClick={proceed} className="btn-primary">
                {block.action.label}
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            ) : (
              <span className="text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>Approved</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* A connector card — the Azure DevOps push. It searches, offers a Connect
   button when nothing is wired, then shows connecting and connected states. */
function Connect({ block, live, onAccept }: {
  block: Extract<BlockSpec, { kind: 'connect' }>; live: boolean; onAccept: (beat: string) => void
}) {
  if (block.state === 'searching') {
    return (
      <div className="mt-2 flex items-center gap-2 text-[13px]">
        <span className="grid h-4 w-4 shrink-0 place-items-center" style={{ color: 'var(--muted)' }}><GateGlyphSparkle /></span>
        <span className="aava-shimmer">Searching for an {block.service} connector…</span>
      </div>
    )
  }
  const connecting = block.state === 'connecting'
  const done = block.state === 'done'
  return (
    <div className="mt-3 flex w-full max-w-[460px] items-center gap-3 rounded-[var(--r-md)] px-3.5 py-3"
      style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[9px]"
        style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
        <AzureLogo size={22} />
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-[13px] font-semibold">{block.service}</span>
        <span className="text-[11.5px]" style={{ color: 'var(--muted)' }}>{block.detail}</span>
      </div>
      {done ? (
        <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium" style={{ color: 'var(--ok)' }}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12 4 4L19 7" /></svg>
          Connected
        </span>
      ) : connecting ? (
        <span className="flex shrink-0 items-center gap-2 text-[12px]" style={{ color: 'var(--muted)' }}>
          <span className="h-4 w-4 animate-spin rounded-full" style={{ border: '2px solid var(--glass-line)', borderTopColor: 'var(--muted)' }} />
          Connecting…
        </span>
      ) : live ? (
        <button onClick={() => onAccept(block.beat)} className="btn-primary shrink-0">
          Connect
        </button>
      ) : (
        <span className="shrink-0 text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>Connect</span>
      )}
    </div>
  )
}

function GateGlyphPerson() {
  return <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
}
function GateGlyphSparkle() {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>
}

/* A checklist mark for the collapsed plan record. */
function PlanGlyph() {
  return <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></svg>
}

/* The Jira mark — three stacked chevrons in Jira blue. A clean recreation,
   used on the "Push to Jira" card and its action button. */
function JiraLogo({ size = 18 }: { size?: number }) {
  const el = 'h10 a2 2 0 0 1 2 2 v10 l-6 -6 h-4 a2 2 0 0 1 -2 -2 z'
  return (
    <svg viewBox="0 0 34 34" width={size} height={size} aria-hidden>
      <defs>
        <linearGradient id="jira-grad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0" stopColor="#0052CC" />
          <stop offset="1" stopColor="#2684FF" />
        </linearGradient>
      </defs>
      <path d={`M21 0 ${el}`} fill="url(#jira-grad)" />
      <path d={`M10.5 10.5 ${el}`} fill="#2684FF" />
      <path d={`M0 21 ${el}`} fill="url(#jira-grad)" />
    </svg>
  )
}

/* The Azure DevOps mark — the blue infinity/swirl, recreated as a clean SVG.
   Used on the "connect to Azure DevOps" card. */
function AzureLogo({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <path fill="#0078D4" d="M2 22.9 6.3 17l7.6-6.3 8.4-3.1v6.5l-7.3 4.9-8.5 5.5-1.2 3.6zm5.6 2.4 9.7-3.7v-9.3l5.3-3.1 5.8 2.6v9.4L23 27.9l-9.8 2.4-5.6-5z" />
    </svg>
  )
}
