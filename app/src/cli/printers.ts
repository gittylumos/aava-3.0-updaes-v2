/* Artifact printers (Task B) — the canvas tabs, dissolved into text.
 *
 * Each reads the same scenario/playground data the web tab renders from, so
 * the terminal and the web can never tell different stories: the diff mirrors
 * playground/Changes.tsx, validation mirrors playground/Tests.tsx, steps mirror
 * chat/RunStrip.tsx, context mirrors the task-context pane.
 */
import type { DiffGroup, Message, PlaygroundState, Scenario } from '../state/types'
import { fileText } from '../state/workspace'
import { JIRA_BROWSE, LOCAL_URL, kvRows } from './render'
import type { Line, RenderCtx, Seg, Tone } from './types'

const seg = (text: string, tone?: Tone, link?: Seg['link']): Seg =>
  link ? { text, tone, link } : tone ? { text, tone } : { text }

const dimLine = (text: string): Line => [seg(text, 'dim')]

/* ── Diff ────────────────────────────────────────────────────────────────── */

type DTone = 'add' | 'del' | 'ctx'
interface FileChange {
  path: string
  status: '+' | '~' | '-'
  add: number | null
  del: number | null
  body: { tone: DTone; text: string }[] | null
}

/* Same derivation as Changes.tsx `filesOf`: a new file the run ships source for
   is all additions; the group's snippet is the hunk of the first modified file
   the run ships; everything else is a stat-only row. */
function filesOf(g: DiffGroup, scenario: Scenario, pg: PlaygroundState): FileChange[] {
  const snippet = (g.lines ?? [])
    .filter((l) => !(l.tone === 'ctx' && l.text.trim().startsWith('…')))
    .map((l) => ({ tone: l.tone, text: l.text.replace(/^[+\- ] ?/, '') }))
  let snippetUsed = false
  const out: FileChange[] = []
  for (const raw of g.files) {
    const m = raw.match(/^([+~-])\s+(.+)$/)
    if (!m || /more files?$/.test(m[2])) continue
    const status = m[1] as FileChange['status']
    const path = m[2]
    const base = path.split('/').pop() ?? path
    const source = scenario.files[base] ? base : null
    const stat = g.stats?.[path]
    let body: FileChange['body'] = null
    if (source && status === '+') {
      body = fileText(scenario, pg, source).split('\n').map((text) => ({ tone: 'add' as const, text }))
    } else if (source && status === '~' && !snippetUsed && snippet.some((l) => l.tone !== 'ctx')) {
      body = snippet
      snippetUsed = true
    }
    const add = stat?.[0] ?? (body ? body.filter((l) => l.tone === 'add').length : null)
    const del = stat?.[1] ?? (body ? body.filter((l) => l.tone === 'del').length : null)
    out.push({ path, status, add, del, body })
  }
  return out
}

export function printDiff(ctx: RenderCtx): Line[] {
  const sc = ctx.j.scenario
  if (!sc || !sc.diff.length) return [dimLine('No changes in this session.')]
  const pg = ctx.j.state.playground
  const repos = sc.diff.map((g) => ({ g, files: filesOf(g, sc, pg) }))
  const all = repos.flatMap((r) => r.files)
  const totalAdd = all.reduce((s, f) => s + (f.add ?? 0), 0)
  const totalDel = all.reduce((s, f) => s + (f.del ?? 0), 0)

  const out: Line[] = [[seg(`${all.length} files changed, `, 'dim'), seg(`+${totalAdd}`, 'success'), seg(' '), seg(`-${totalDel}`, 'error')]]
  for (const { g, files } of repos) {
    out.push([])
    out.push([seg(g.repo, 'bold'), seg(` · ${g.branch}`, 'dim')])
    for (const f of files) {
      const fileLink: Seg['link'] = sc.files[f.path.split('/').pop() ?? ''] ? { kind: 'file', file: f.path.split('/').pop()! } : undefined
      out.push([seg('diff --git ', 'bold'), seg(`a/${f.path} b/${f.path}`, 'bold', fileLink)])
      if (f.status === '+') out.push(dimLine('new file mode 100644'))
      if (f.status === '-') out.push(dimLine('deleted file mode 100644'))
      if (!f.body) {
        out.push(dimLine(`  (+${f.add ?? 0} -${f.del ?? 0}, not shown)`))
        continue
      }
      out.push(dimLine(f.status === '+' ? '--- /dev/null' : `--- a/${f.path}`))
      out.push(dimLine(f.status === '-' ? '+++ /dev/null' : `+++ b/${f.path}`))
      out.push([seg(f.status === '+' ? `@@ -0,0 +1,${f.body.length} @@` : '@@ … @@', 'accent')])
      for (const l of f.body) {
        if (l.tone === 'add') out.push([seg('+' + l.text, 'success')])
        else if (l.tone === 'del') out.push([seg('-' + l.text, 'error')])
        else out.push([seg(' ' + l.text, 'dim')])
      }
    }
  }
  return out
}

/* ── Validation ──────────────────────────────────────────────────────────── */

function lastValidation(messages: Message[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const b = messages[i].block
    if (b?.kind === 'validation') return b
  }
  return null
}

export function printValidation(ctx: RenderCtx): Line[] {
  const sc = ctx.j.scenario
  if (!sc) return [dimLine('No validation results in this session.')]
  const { specs, coveragePct, gatePct, file, failing, failUntil } = sc.tests
  /* Tests.tsx: failures belong to a moment in the run — past `failUntil` they read green. */
  const open = ctx.j.state.playground.prepAt <= (failUntil ?? -1)
  const failed = new Set(open ? failing ?? [] : [])
  const specFile = file ?? 'feedback-form.component.spec.ts'
  const w = Math.max(...specs.map((s) => s.length))

  const out: Line[] = [[seg('Validation · ', 'bold'), seg(specFile, 'accent', { kind: 'file', file: specFile })]]

  const v = lastValidation(ctx.j.state.messages)
  if (v) {
    const { tests, passed, failed: f, warnings } = v.counts
    out.push([seg(`  ${v.agent}  `, 'dim'), seg(`${tests} checks · `), seg(`${passed} passed`, 'success'), seg(' · '),
      seg(`${f} failed`, f ? 'error' : 'dim'), seg(' · '), seg(`${warnings} warnings`, warnings ? 'warn' : 'dim')])
  }

  out.push([])
  out.push(dimLine('  Specs'))
  specs.forEach((s, i) => {
    const bad = failed.has(s)
    out.push([seg(bad ? '  ✗ ' : '  ✓ ', bad ? 'error' : 'success'), seg(s.padEnd(w + 2), bad ? 'error' : undefined), seg(`${8 + i * 3}ms`, 'dim')])
  })
  out.push([seg('  '), seg(`${specs.length - failed.size} passed`, 'success'),
    ...(failed.size ? [seg(' · '), seg(`${failed.size} failed`, 'error')] : [])])

  out.push([])
  const ok = coveragePct >= gatePct
  out.push([seg('  Coverage  ', 'dim'), seg(`${coveragePct}%`, ok ? 'success' : 'error'), seg(`  gate ${gatePct}% `, 'dim'), seg(ok ? '✓' : '✗', ok ? 'success' : 'error')])

  /* The self-check step's evidence, when the run has one (build · lint · contract). */
  const checks = sc.evidence.checks?.body
  if (checks?.kind === 'kv') {
    out.push([])
    out.push(dimLine('  Checks'))
    const kw = Math.max(...checks.pairs.map(([k]) => k.length))
    for (const [k, val] of checks.pairs) {
      const assumed = /assum/i.test(k)
      out.push([seg(assumed ? '  ! ' : '  ✓ ', assumed ? 'warn' : 'success'), seg(k.padEnd(kw + 2)), seg(val, 'dim')])
    }
  }
  return out
}

/* ── Steps ───────────────────────────────────────────────────────────────── */

export function printSteps(ctx: RenderCtx): Line[] {
  const sc = ctx.j.scenario
  if (!sc || !sc.prep.length) return [dimLine('No steps — this session has no scripted run.')]
  const steps = sc.prep
  const at = ctx.j.state.playground.prepAt
  const done = Math.min(at, steps.length)
  const out: Line[] = [[seg(`Steps · ${done}/${steps.length}`, 'bold'),
    ...(sc.capability ? [seg(`  ${sc.capability.name} · ${sc.capability.badge}`, 'dim')] : [])]]
  const nw = String(steps.length).length
  steps.forEach((s, i) => {
    const n = `${String(i + 1).padStart(nw)}. `
    if (i < at) {
      out.push([seg('  ✓ ', 'success'), seg(n, 'dim'), seg(s.label), seg(`  ${s.result}`, 'dim')])
    } else if (i === at) {
      out.push([seg('  ● ', s.gate ? 'warn' : 'accent'), seg(n, 'dim'), seg(s.label, 'bold'),
        ...(s.gate ? [seg('  waiting on you', 'warn')] : [])])
    } else {
      out.push([seg('  ○ ', 'dim'), seg(n, 'dim'), seg(s.label, 'dim')])
    }
  })
  if (at >= steps.length) out.push(dimLine('  All steps complete'))
  return out
}

/* ── Context ─────────────────────────────────────────────────────────────── */

function activeTask(ctx: RenderCtx) {
  const id = ctx.j.state.activeTaskId
  return id ? ctx.j.state.tasks.find((t) => t.id === id) ?? null : null
}

export function printContext(ctx: RenderCtx): Line[] {
  const task = activeTask(ctx)
  if (!task) return [dimLine('No task in this session.')]
  const c = task.context
  const url = c.ticketUrl ?? JIRA_BROWSE + c.ticket
  const out: Line[] = [
    [seg(c.ticket, 'bold', { kind: 'url', url }), seg(` · ${c.ticketSource}`, 'dim')],
    [seg(task.title, 'bold')],
    [seg(c.description)],
  ]

  if (c.criteria.length) {
    out.push([])
    out.push(dimLine('Acceptance criteria'))
    for (const cr of c.criteria) {
      out.push([seg(cr.met ? '  ✓ ' : '  ○ ', cr.met ? 'success' : 'warn'), seg(cr.text, cr.met ? undefined : 'normal')])
      if (cr.note) out.push(dimLine(`    ⎿ ${cr.note}`))
    }
  }

  if (c.connected?.length) {
    out.push([])
    out.push(dimLine('Connected sources'))
    const w = Math.max(...c.connected.map((s) => s.label.length))
    for (const s of c.connected) {
      out.push(s.denied
        ? [seg('  ✗ ', 'error'), seg(s.label.padEnd(w + 2), 'error'), seg(`${s.source} · access denied`, 'error')]
        : [seg('  · ', 'dim'), seg(s.label.padEnd(w + 2)), seg(s.source, 'dim')])
    }
  }

  if (c.capabilities?.length) {
    out.push([])
    out.push([seg('Capabilities  ', 'dim'), seg(c.capabilities.join(' · '))])
  }
  if (c.related?.length) {
    out.push([seg('Related       ', 'dim'), ...c.related.flatMap((r, i): Seg[] => [
      ...(i ? [seg(' · ', 'dim')] : []), seg(r.id, 'accent', { kind: 'url', url: JIRA_BROWSE + r.id }), seg(` ${r.title}`, 'dim'),
    ])])
  }

  const run = c.run
  const pairs: [string, string][] = [
    ['Agent', `${run.agent}${run.golden ? ' · golden' : ''}${run.certified ? ` · certified ${run.certified}` : ''}${run.accepts ? ` · ${run.accepts} accepts` : ''}`],
  ]
  if (run.branch) pairs.push(['Branch', run.branch])
  if (run.tokens || run.cost) pairs.push(['Usage', [run.tokens && `${run.tokens} tokens`, run.cost].filter(Boolean).join(' · ')])
  if (run.halted) pairs.push(['Halted', run.halted])
  out.push([])
  out.push(dimLine('Run'))
  out.push(...kvRows(pairs))
  return out
}

/* ── ng serve ────────────────────────────────────────────────────────────── */

export function ngServeLines(): Line[] {
  return [
    [seg('$ ng serve', 'dim')],
    [seg('✔ ', 'success'), seg('Browser application bundle generation complete.')],
    [seg('  ➜  Local:   ', 'dim'), seg(`${LOCAL_URL}/`, 'accent', { kind: 'url', url: `${LOCAL_URL}/` })],
    [seg('✔ ', 'success'), seg('Compiled successfully.')],
  ]
}

/* ── Inline watch line ───────────────────────────────────────────────────── */

export function statusLine(ctx: RenderCtx): Line {
  const { state, scenario, busy } = ctx.j
  const task = activeTask(ctx)
  if (!state.activeThreadId && !task) {
    return [seg(`aava · ${state.firstTime ? 'First time' : 'General'} user · /help`, 'dim')]
  }

  let label: string
  let tone: Tone
  let steps = ''
  if (scenario) {
    const at = state.playground.prepAt
    const total = scenario.prep.length
    const gate = !!scenario.prep[at]?.gate
    steps = ` · ${Math.min(at, total)}/${total} steps`
    if (busy) { label = 'Working'; tone = 'accent' }
    else if (at >= total) { label = 'Done'; tone = 'success' }
    else if (gate) { label = 'Waiting on you'; tone = 'warn' }
    else { label = 'Working'; tone = 'accent' }
  } else if (busy) {
    label = 'Working'; tone = 'accent'
  } else if (task && (task.tag === 'input' || task.tag === 'review' || task.tag === 'blocked')) {
    label = task.tag === 'blocked' ? 'Blocked' : 'Waiting on you'; tone = task.tag === 'blocked' ? 'error' : 'warn'
  } else {
    label = 'Ready'; tone = 'dim'
  }

  const line: Line = [seg('● ', tone), seg(label + steps, tone === 'dim' ? 'dim' : 'normal')]
  if (task) line.push(seg(` · ${task.context.ticket}`, 'dim'))
  return line
}
