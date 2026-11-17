/* Message → terminal rows, and gate → numbered choices (Task B).
 *
 * The CLI dissolves the canvas: every block a run can put in the thread is
 * printed as compact text the way Claude Code's CLI prints tool calls —
 * `⏺ label` with a dim `  ⎿ detail` under it. Gates print their title and
 * question only; what the user can pick comes from `gateChoices`, and each
 * choice does exactly what the web gate's button does.
 */
import type { BlockSpec, Citation, Message } from '../state/types'
import { JIRA_BROWSE, LOCAL_URL, scenarioPath as pathOf, seg } from './text'
import type { Choice, Line, RenderCtx, Seg, Tone } from './types'

/* ── Inline text ─────────────────────────────────────────────────────────── */

/** `**bold**` → bold segments; inline `code` → plain text (backticks dropped). */
export function inline(text: string, tone: Tone = 'normal'): Seg[] {
  const segs: Seg[] = []
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  for (const p of parts) {
    if (!p) continue
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) {
      segs.push({ text: p.slice(2, -2).replace(/`([^`]*)`/g, '$1'), tone: 'bold' })
    } else {
      segs.push({ text: p.replace(/`([^`]*)`/g, '$1'), tone })
    }
  }
  return segs.length ? segs : [{ text: '', tone }]
}

/** `⎿` sub-row under a `⏺` row. */
const sub = (rest: Seg[] | string, first = true): Line => [
  seg(first ? '  ⎿ ' : '    ', 'dim'),
  ...(typeof rest === 'string' ? [seg(rest, 'dim')] : rest),
]

/** Aligned `key  value` rows. */
export function kvRows(pairs: [string, string][], indent = '  '): Line[] {
  const w = Math.max(0, ...pairs.map(([k]) => k.length))
  return pairs.map(([k, v]) => [seg(indent + k.padEnd(w + 2), 'dim'), seg(v)])
}

/* ── Messages ────────────────────────────────────────────────────────────── */

export function renderMessage(m: Message, ctx: RenderCtx): Line[] {
  if (m.from === 'user') {
    return [[seg('› ', 'dim'), seg(m.lines.join(' '), 'bold')]]
  }
  /* A typing placeholder only means something while a run is going — after an
     interrupt it is a leftover, not a reply on its way. */
  if (m.typing && !m.lines.length && !m.block) return ctx.j.busy ? [[seg('✻ Thinking…', 'dim')]] : []

  const out: Line[] = []
  m.lines.forEach((l, i) => {
    out.push([seg(i === 0 ? '⏺ ' : '  ', i === 0 ? 'normal' : undefined), ...inline(l)])
  })
  if (m.citations?.length) out.push(...citationLines(m.citations))
  if (m.block) out.push(...renderBlock(m, m.block, ctx))
  return out
}

const CITE_NAME: Record<Citation['kind'], string> = {
  jira: 'Jira', figma: 'Figma', github: 'GitHub', confluence: 'Confluence', azure: 'Azure DevOps',
}

function citationLines(cs: Citation[]): Line[] {
  return cs.map((c, i) => {
    const kind = CITE_NAME[c.kind]
    const link: Seg['link'] = c.kind === 'jira' && /^[A-Z][A-Z0-9]+-\d+$/.test(c.label)
      ? { kind: 'url', url: JIRA_BROWSE + c.label }
      : undefined
    return sub([seg(`${kind} · `, 'dim'), seg(c.label, link ? 'accent' : 'dim', link), seg(` — ${c.title}`, 'dim')], i === 0)
  })
}

const scenarioPath = (ctx: RenderCtx, file: string): string => pathOf(ctx.j.scenario, file)

function renderBlock(m: Message, b: BlockSpec, ctx: RenderCtx): Line[] {
  const live = m.live !== false
  switch (b.kind) {
    case 'tools': {
      const out: Line[] = []
      if (b.title) {
        const finished = b.done >= b.steps.length
        out.push([seg('⏺ ', finished ? 'success' : 'accent'), seg(b.title, 'bold'),
          seg(finished ? ` (${b.steps.length} step${b.steps.length === 1 ? '' : 's'})` : '…', 'dim')])
        b.steps.forEach((s, i) => {
          if (i > b.done) return
          const running = i === b.done
          out.push(sub([seg(s.label, running ? 'normal' : 'dim'), seg(running ? '…' : ` · ${s.result}`, 'dim')], i === 0))
        })
        return out
      }
      b.steps.forEach((s, i) => {
        if (i > b.done) return
        const running = i === b.done
        out.push([seg('⏺ ', running ? 'accent' : 'success'), seg(s.label + (running ? '…' : ''))])
        if (running) return
        out.push(sub(`${s.result} · ${s.source}`))
        s.diff?.forEach((d) => out.push(diffRow(d.tone, d.text)))
      })
      return out
    }

    case 'plan': {
      const out: Line[] = [[seg('⏺ ', 'success'), seg(`Plan · ${b.title ?? 'Initiate Process'}`, 'bold'),
        seg(` (${b.count} steps)`, 'dim')]]
      if (b.matched) out.push(sub(`Matched capability · ${b.matched}`))
      if (b.intro) out.push(sub(b.intro, !b.matched))
      b.steps.forEach((s, i) => out.push([seg(`    ${i + 1}. `, 'dim'), seg(s.title, 'dim'), seg(` — ${s.detail}`, 'dim')]))
      if (b.action && live) out.push(sub(`${b.action.label} to start`, false))
      return out
    }

    case 'capability': {
      if (b.searching) return [[seg('⏺ ', 'accent'), seg('Searching for the capabilities to complete this task…', 'dim')]]
      const out: Line[] = [[seg('⏺ ', 'success'), seg('Capabilities matched', 'bold'), ...(b.badge ? [seg(` · ${b.badge}`, 'dim')] : [])]]
      if (b.maps) out.push(sub(b.maps))
      b.chips?.forEach((c) => out.push([seg('    ✓ ', 'success'), seg(c, 'dim')]))
      return out
    }

    case 'coverage': {
      const out: Line[] = []
      for (const g of b.groups) {
        const [mark, tone] = coverageMark(g.title, g.tone)
        out.push([seg('  '), seg(g.title, 'bold')])
        g.items.forEach((it) => out.push([seg(`    ${mark} `, tone), seg(it)]))
      }
      return out
    }

    case 'validation': {
      const { tests, passed, failed, warnings } = b.counts
      const head: Line = [seg('⏺ ', failed ? 'warn' : 'success'), seg(`${b.agent} · Validation results`, 'bold')]
      if (b.file) head.push(seg('  '), seg(scenarioPath(ctx, b.file), 'accent', { kind: 'file', file: b.file }))
      const out: Line[] = [head,
        [seg('  Tests   Passed  Failed  Warnings', 'dim')],
        [seg('  ' + String(tests).padEnd(8)), seg(String(passed).padEnd(8), 'success'),
          seg(String(failed).padEnd(8), failed ? 'error' : 'dim'), seg(String(warnings), warnings ? 'warn' : 'dim')],
      ]
      b.failing?.forEach((f) => out.push([seg('  ✗ ', 'error'), seg(f)]))
      return out
    }

    case 'links': {
      return b.links.map((l, i) => {
        if (l.file) {
          const path = scenarioPath(ctx, l.file)
          return sub([seg(path, 'accent', { kind: 'file', file: l.file })], i === 0)
        }
        if (l.href) return sub([seg(l.label, 'normal'), seg('  '), seg(l.href, 'accent', { kind: 'url', url: l.href })], i === 0)
        if (l.tab === 'tests') return sub([seg(l.label), seg('  /validation', 'dim')], i === 0)
        if (l.tab === 'diff') return sub([seg(l.label), seg('  /diff', 'dim')], i === 0)
        return sub([seg(l.label)], i === 0)
      })
    }

    case 'app':
      return [
        [seg('⏺ ', 'success'), seg('App running · ', 'bold'), seg(LOCAL_URL, 'accent', { kind: 'url', url: LOCAL_URL })],
        sub(`${b.name} · ${b.status}`),
      ]

    case 'confirm': {
      const label = live ? 'Waiting on you' : 'Answered'
      const out: Line[] = [[seg('⏺ ', live ? 'warn' : 'dim'),
        seg(`${label}${b.step ? ` · Step ${b.step}` : ''}`, live ? 'warn' : 'dim'),
        ...(b.title ? [seg(' · ', 'dim'), seg(b.title, 'bold')] : [])]]
      for (const r of b.rows) {
        out.push([seg('  '), seg(r.repo, 'bold'), seg('  '), seg(r.branch, 'dim')])
        out.push([seg('    '), seg(r.what, 'dim')])
      }
      if (!live && m.answer) out.push(sub(m.answer))
      return out
    }

    case 'decision': {
      const label = live ? 'Waiting on you' : 'Answered'
      const out: Line[] = [[seg('⏺ ', live ? 'warn' : 'dim'),
        seg(`${label}${b.step ? ` · Gate ${b.step}` : ''}`, live ? 'warn' : 'dim'),
        seg(' · ', 'dim'), seg(b.title, 'bold'), ...(b.counter ? [seg(`  ${b.counter}`, 'dim')] : [])]]
      b.summary?.forEach((s) => out.push([seg('  '), seg(s.label), ...(s.detail ? [seg(` — ${s.detail}`, 'dim')] : [])]))
      out.push([seg('  '), ...inline(b.question, 'dim')])
      if (!live && m.answer) out.push(sub(`You: ${m.answer}`))
      return out
    }

    case 'callout': {
      const out: Line[] = b.lines.map((l, i) => [seg(i === 0 ? '⏺ ' : '  '), ...inline(l)])
      b.links?.forEach((l, i) => out.push(sub([seg(l.label), seg('  '), seg(l.href, 'accent', { kind: 'url', url: l.href })], i === 0)))
      return out
    }

    case 'divider':
      return [[seg(`── ${b.text} ──`, 'dim')]]

    case 'sync':
      return [[seg('⏺ ', live ? 'warn' : 'dim'), seg(b.title, 'bold')], sub(b.detail)]

    case 'connect':
      return [[seg('⏺ ', b.state === 'done' ? 'success' : 'accent'), seg(b.service, 'bold'), seg(` · ${b.state}`, 'dim')], sub(b.detail)]

    case 'document':
      return [[seg('⏺ ', 'success'), seg(b.name, 'bold'), seg(` · Document · ${b.format}`, 'dim')]]

    case 'process': {
      const out: Line[] = [[seg('⏺ ', 'success'), seg(b.title ?? 'Process', 'bold')]]
      b.steps.forEach((s, i) => out.push([seg(`    ${i + 1}. `, 'dim'), seg(s.label, s.added ? 'bold' : 'dim')]))
      return out
    }

    default:
      return [[seg(`[${b.kind}]`, 'dim')]]
  }
}

function coverageMark(title: string, tone?: 'assumed'): [string, Tone] {
  if (/not done|fail/i.test(title)) return ['✗', 'error']
  if (tone === 'assumed' || /warn|assum/i.test(title)) return ['!', 'warn']
  if (/open/i.test(title)) return ['○', 'dim']
  return ['✓', 'success']
}

export function diffRow(tone: 'ctx' | 'del' | 'add', text: string): Line {
  const t: Tone = tone === 'add' ? 'success' : tone === 'del' ? 'error' : 'dim'
  return [seg('    '), seg(text, t)]
}

/* ── Gates ───────────────────────────────────────────────────────────────── */

const isGate = (m: Message) => m.block?.kind === 'decision' || m.block?.kind === 'confirm'

/** The latest live decision/confirm — the same gate the web pins in the
    composer's place (ConversationView's `pinnedGate`). */
export function liveGate(messages: Message[]): Message | null {
  return [...messages].reverse().find((m) => m.live !== false && isGate(m)) ?? null
}

/** Numbered choices for a LIVE gate; each `run` mirrors the web button.
 *  Primary first, so `1` is the recommended answer. */
export function gateChoices(m: Message, ctx: RenderCtx): Choice[] {
  const b = m.block
  if (!b || m.live === false) return []
  const { j } = ctx
  /* Blocks.tsx `fire`: retire the card, then run the branch. */
  const fire = (beat: string) => { j.dismissBlock(m.id); j.runBeat(beat) }

  type Draft = Omit<Choice, 'key'>
  let drafts: Draft[] = []

  if (b.kind === 'confirm') {
    drafts = [
      /* Accept: onDismiss(); onAccept(acceptBeat). */
      { label: b.acceptLabel, primary: true, run: () => fire(b.acceptBeat) },
      /* Cancel: onDismiss() only — retires the gate, runs nothing. */
      { label: b.cancelLabel, run: () => j.dismissBlock(m.id) },
    ]
  } else if (b.kind === 'decision') {
    const variant = b.variant ?? 'buttons'
    if (variant === 'action') {
      const opt = b.options[0]
      if (opt) drafts = [{ label: opt.label, primary: true, run: () => fire(opt.beat) }]
    } else if (variant === 'buttons') {
      /* ButtonsGate: a plain option records its label, then fires; a `collect`
         option records the typed note (ignored when blank), then fires. */
      drafts = b.options.map((opt) => opt.collect
        ? { label: opt.label, primary: opt.primary, collect: true, placeholder: b.placeholder, run: (text?: string) => {
            const note = text?.trim()
            if (!note) return
            j.recordAnswer(m.id, note)
            fire(opt.beat)
          } }
        : { label: opt.label, primary: opt.primary, run: () => { j.recordAnswer(m.id, opt.label); fire(opt.beat) } })
    } else {
      /* clarify / approve: the picked option fires straight away. */
      drafts = b.options.map((opt) => ({ label: opt.label, primary: opt.primary, run: () => fire(opt.beat) }))
    }
  } else {
    return []
  }

  const ordered = [...drafts.filter((d) => d.primary), ...drafts.filter((d) => !d.primary)]
  return ordered.map((d, i) => ({ ...d, key: String(i + 1) }))
}
