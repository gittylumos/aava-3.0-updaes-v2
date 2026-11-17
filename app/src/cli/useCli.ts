/* The CLI controller: scrollback, prompt, lists, slash commands, keys.
 *
 * The scrollback is not a log of what was printed — it is re-derived from the
 * journey on every render (banner + home or the session's messages), so the
 * engine's streaming shows up exactly as it does on the web. The only things
 * the CLI itself prints are "extras" (slash-command output, dissolved canvas
 * printouts, opened files), each anchored to the message count at the time it
 * was printed and kept per screen, so a resumed session gets its printouts back.
 *
 * Keys never act on bare letters or digits while the user could be typing: a
 * list item is picked with Enter (on the highlighted row, or on a lone number
 * typed into the prompt), so any text — "2 more fields" — can be typed.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useJourney } from '../state/useJourney'
import { TAG_META } from '../state/reducer'
import { sessionRows } from '../state/sessions'
import { fileText, hasPreview } from '../state/workspace'
import type { TabId, Thread } from '../state/types'
import { PROFILES } from '../data/user'
import { gateChoices, liveGate, renderMessage } from './render'
import { ngServeLines, printContext, printDiff, printSteps, printValidation, statusLine } from './printers'
import { LOCAL_URL, scenarioPath } from './text'
import type { Choice, Line, RenderCtx, Seg } from './types'

export interface ListItem { label: string; hint?: string; pick: () => void }
export interface ActiveList { key: string; title?: string; items: ListItem[]; sel: number }

interface Extra { at: number; lines: Line[] }

const dim = (text: string): Line => [{ text, tone: 'dim' }]
const plain = (text: string): Line => [{ text }]

/* Claude Code's welcome box. */
function banner(): Line[] {
  const W = 46
  const row = (segs: Seg[]): Line => {
    const len = segs.reduce((n, s) => n + [...s.text].length, 0)
    return [{ text: '│ ', tone: 'dim' }, ...segs, { text: ' '.repeat(Math.max(0, W - 4 - len)) + ' │', tone: 'dim' }]
  }
  return [
    dim('╭' + '─'.repeat(W - 2) + '╮'),
    row([{ text: '✻ ', tone: 'accent' }, { text: 'Welcome to ' }, { text: 'AAVA', tone: 'bold' }]),
    row([]),
    row([{ text: '  /help for commands', tone: 'dim' }]),
    row([]),
    row([{ text: '  cwd: ~/product-web', tone: 'dim' }]),
    dim('╰' + '─'.repeat(W - 2) + '╯'),
  ]
}

const HELP: [string, string][] = [
  ['/home', 'Back to the home screen'],
  ['/new', 'Start a new session (type your first message)'],
  ['/resume', 'Pick a session (★ pinned first)'],
  ['/pin', 'Pin or unpin this session'],
  ['/steps', 'Print the run’s steps'],
  ['/context', 'Print the task context'],
  ['/diff', 'Print the unified diff'],
  ['/validation', 'Print the validation results'],
  ['/tasks', 'Show background tasks (ng serve)'],
  ['/open', 'Open the preview in the browser'],
  ['/user general|first', 'Switch user type'],
  ['/clear', 'Clear printed output'],
  ['/help', 'This list'],
]

/** Trailing blank rows are the caller's to add, so messages space evenly. */
function trimEnd(lines: Line[]): Line[] {
  let n = lines.length
  while (n > 0 && lines[n - 1].length === 0) n--
  return lines.slice(0, n)
}

export function useCli() {
  const j = useJourney()
  const ctx: RenderCtx = { j }
  const s = j.state
  const pg = s.playground

  const home = s.arrangement === 'start' || s.arrangement === 'tasks'
  /* /new is the home arrangement too (the web's "New chat" is goHome), shown as
     an empty session waiting for its first message rather than the task list. */
  const [fresh, setFresh] = useState(false)
  const newSession = home && fresh
  const screenKey = home ? (fresh ? 'new' : 'home') : `s:${s.activeThreadId ?? s.activeTaskId ?? 'new'}`

  const [extras, setExtras] = useState<Record<string, Extra[]>>({})
  const [previewOn, setPreviewOn] = useState<Record<string, boolean>>({})
  const [previewOpen, setPreviewOpen] = useState(false)
  const [input, setInput] = useState('')
  const [collect, setCollect] = useState<Choice | null>(null)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [dismissed, setDismissed] = useState<string | null>(null)
  const [sel, setSel] = useState<{ key: string; i: number }>({ key: '', i: 0 })
  /* A journey toast (e.g. a /resume row with nothing parked) shown as a dim
     note until the next input. `inputs` re-arms it when the same text repeats. */
  const [note, setNote] = useState<string | null>(null)
  const [inputs, setInputs] = useState(0)
  /* Set when Enter was pressed on an empty collect prompt. */
  const [collectHint, setCollectHint] = useState(false)
  const history = useRef<string[]>([])
  const histAt = useRef(-1)
  /** Per screen: how many tabLog entries have been printed. */
  const seenReq = useRef<Record<string, number>>({})

  const print = (lines: Line[], key = screenKey) =>
    setExtras((x) => ({ ...x, [key]: [...(x[key] ?? []), { at: s.messages.length, lines }] }))

  const previewRunning = !home && !!previewOn[screenKey]
  const canPreview = !home && hasPreview(j.scenario)
  const openPreview = () => setPreviewOpen(true)

  useEffect(() => { if (s.toast) setNote(s.toast) }, [s.toast, inputs])
  /** Something the user did — clears the last note and re-arms it. */
  const tookInput = () => {
    setNote(null); setCollectHint(false)
    if (s.toast) j.toast(null)
    setInputs((n) => n + 1)
  }

  /* ── Dissolved canvas ────────────────────────────────────────────
     A beat asking for a tab (showTab / SET_TAB) appends to playground.tabLog.
     Each entry prints the artefact inline, once, where the thread is — even
     when several land in one render (reduced motion plays beats with no delay). */
  const fileLinks = (): Line[] => {
    const sc = j.scenario
    if (!sc) return []
    return sc.fileOrder.map((f, i) => [
      { text: i === 0 ? '  ⎿  ' : '     ', tone: 'dim' },
      { text: scenarioPath(sc, f), link: { kind: 'file', file: f } },
    ])
  }
  const canvasLines = (tab: TabId): Line[] => {
    switch (tab) {
      case 'tests': return printValidation(ctx)
      case 'diff': return printDiff(ctx)
      case 'evidence': return printSteps(ctx)
      case 'code': return fileLinks()
      case 'preview': return [
        ...ngServeLines(),
        [
          { text: 'ng serve is running in the background · /tasks to see output · /open or click to open ', tone: 'dim' },
          { text: LOCAL_URL, tone: 'dim', link: { kind: 'url', url: LOCAL_URL } },
        ],
      ]
    }
  }

  const tabLog = pg.tabLog ?? []
  useEffect(() => {
    if (home) return
    const key = screenKey
    let from = seenReq.current[key] ?? 0
    if (tabLog.length < from) {
      /* The session restarted from scratch: throw away what was printed into
         the old run, and print the new run's requests from the top. */
      setExtras((x) => ({ ...x, [key]: [] }))
      setPreviewOn((p) => ({ ...p, [key]: false }))
      from = 0
    }
    seenReq.current[key] = tabLog.length
    for (const tab of tabLog.slice(from)) {
      const lines = canvasLines(tab)
      if (tab === 'preview') setPreviewOn((p) => ({ ...p, [key]: true }))
      if (lines.length) print(lines, key)
    }
    /* Fires on the request log only; everything else it reads is current at
       that moment. */
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [tabLog.length, screenKey, home])

  /* ── Sessions (/resume) — same rows as the web sidebar ───────────── */
  const sessions = (): Thread[] => {
    const { pinned, recents } = sessionRows(s.threads, s.tasks, s.pinnedThreadIds)
    return [...pinned, ...recents]
  }
  const openSession = (t: Thread) => (t.taskId ? j.openTask(t.taskId) : j.openThread(t))

  /* ── Home ─────────────────────────────────────────────────────── */
  const homeTasks = (s.profileId === 'raman' ? s.tasks.filter((t) => t.tag !== 'done') : s.tasks).slice(0, 3)
  const subtitle = s.firstTime
    ? "I'm AAVA. Tell me what you'd like to build, and I'll take it from there."
    : homeTasks.length === 0
      ? 'What would you like to work on?'
      : 'I have worked on a couple of your tasks. Would you like to review these?'

  /* ── The active selectable list ─────────────────────────────────── */
  const gate = home ? null : liveGate(s.messages)
  let list: Omit<ActiveList, 'sel'> | null = null
  if (collect) list = null
  else if (resumeOpen) {
    const all = sessions()
    if (all.length) list = {
      key: 'resume',
      title: 'Resume a session',
      items: all.map((t) => ({
        label: `${s.pinnedThreadIds.includes(t.id) ? '★' : ' '} ${t.title}`,
        hint: t.when,
        pick: () => { setResumeOpen(false); openSession(t) },
      })),
    }
  } else if (gate) {
    const choices = gateChoices(gate, ctx)
    if (choices.length) list = {
      key: `gate:${gate.id}`,
      items: choices.map((c) => ({
        label: c.label,
        pick: () => {
          if (c.collect) { setCollect(c); setInput('') } else c.run()
        },
      })),
    }
  } else if (home && !newSession && !s.firstTime && homeTasks.length) {
    list = {
      key: 'home',
      items: homeTasks.map((t) => ({ label: t.title, hint: TAG_META[t.tag].label, pick: () => j.openTask(t.id) })),
    }
  }
  if (list && (list.key === dismissed || !list.items.length)) list = null
  /* A lone number typed into the prompt highlights that row; Enter picks it. */
  const typed = /^[1-9]$/.test(input.trim()) ? Number(input.trim()) - 1 : -1
  const active: ActiveList | null = list
    ? {
        ...list,
        sel: typed >= 0 && typed < list.items.length ? typed
          : sel.key === list.key ? Math.min(sel.i, list.items.length - 1) : 0,
      }
    : null

  /* ── Scrollback ───────────────────────────────────────────────── */
  const lines: Line[] = [...banner(), []]
  const ex = extras[screenKey] ?? []
  const pushExtras = (pred: (e: Extra) => boolean) => {
    for (const e of ex) if (pred(e)) lines.push(...e.lines, [])
  }
  if (newSession) {
    lines.push([{ text: 'New session', tone: 'bold' }], dim('─'.repeat(11)), [],
      dim('Type what you’d like to build to start. /home for your tasks.'), [])
    pushExtras(() => true)
  } else if (home) {
    lines.push([{ text: `Good evening, ${PROFILES[s.profileId].name}`, tone: 'bold' }], dim(subtitle), [])
    pushExtras(() => true)
  } else {
    const task = s.tasks.find((t) => t.id === s.activeTaskId)
    const thread = s.threads.find((t) => t.id === s.activeThreadId)
    const header = task ? `${task.context.ticket} · ${task.title}` : thread?.title ?? s.activeObject?.title ?? 'New session'
    lines.push([{ text: header, tone: 'bold' }], dim('─'.repeat(Math.min(80, [...header].length))), [])
    s.messages.forEach((m, i) => {
      pushExtras((e) => e.at === i)
      const out = trimEnd(renderMessage(m, ctx))
      if (out.length) lines.push(...out, [])
    })
    pushExtras((e) => e.at >= s.messages.length)
  }
  if (note) lines.push(dim(`ℹ ${note}`), [])

  /* ── Slash commands ───────────────────────────────────────────── */
  const needTask = (f: () => Line[]): Line[] => (j.scenario ? f() : [dim('No task open — /resume to pick one.')])

  const resetAll = () => {
    setExtras({}); setPreviewOn({}); seenReq.current = {}
    setResumeOpen(false); setCollect(null); setPreviewOpen(false); setFresh(false)
  }

  const command = (raw: string) => {
    const [cmd, ...args] = raw.trim().split(/\s+/)
    const out = (ls: Line[]) => print([dim(`› ${raw.trim()}`), ...ls])
    switch (cmd) {
      case '/home':
        j.goHome(); setFresh(false); setResumeOpen(false); setDismissed(null); return
      case '/new':
        j.goHome(); setFresh(true); setResumeOpen(false); setDismissed(null)
        setExtras((x) => ({ ...x, new: [] }))
        return
      case '/resume':
        if (!sessions().length) { out([dim('No sessions yet')]); return }
        setResumeOpen(true); setDismissed(null); return
      case '/pin': {
        const id = s.activeThreadId
        if (home || !id) { out([dim('No session to pin — open one first.')]); return }
        const was = s.pinnedThreadIds.includes(id)
        j.togglePinThread(id)
        out([plain(was ? 'Unpinned this session.' : '★ Pinned this session.')])
        return
      }
      case '/steps': out(needTask(() => printSteps(ctx))); return
      case '/context': out(needTask(() => printContext(ctx))); return
      case '/diff': out(needTask(() => printDiff(ctx))); return
      case '/validation': out(needTask(() => printValidation(ctx))); return
      case '/tasks': out(previewRunning ? ngServeLines() : [dim('No background tasks')]); return
      case '/open':
        if (canPreview) openPreview()
        else out([dim('Nothing to open — this session has no preview.')])
        return
      case '/user': {
        const want = args[0]
        if (want !== 'general' && want !== 'first') {
          out([dim(`User type: ${s.firstTime ? 'first' : 'general'} · /user general | /user first`)])
          return
        }
        const on = want === 'first'
        if (on === s.firstTime) { out([dim(`Already a ${want === 'first' ? 'first time' : 'general'} user.`)]); return }
        resetAll()
        j.setFirstTime(on)
        return
      }
      case '/clear':
        setExtras((x) => ({ ...x, [screenKey]: [] })); return
      case '/help': {
        const w = Math.max(...HELP.map(([c]) => c.length)) + 3
        out(HELP.map(([c, d]) => [{ text: '  ' + c.padEnd(w), tone: 'bold' }, { text: d, tone: 'dim' }]))
        return
      }
      default:
        out([[{ text: `Unknown command: ${cmd}`, tone: 'error' }], dim('/help for commands')])
    }
  }

  const submit = (text: string) => {
    const t = text.trim()
    if (!t) return
    tookInput()
    history.current.push(t)
    histAt.current = -1
    setDismissed(null)
    if (t.startsWith('/')) command(t)
    else { setResumeOpen(false); setFresh(false); j.send(t) }
  }

  const pick = (i: number) => {
    if (!active || !active.items[i]) return
    tookInput()
    setSel({ key: active.key, i })
    setFresh(false)
    active.items[i].pick()
  }

  const interrupt = () => {
    j.stop()
    print([dim('  ⎿  Interrupted by user')])
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const k = e.key
    /* The preview "browser" is in front: the prompt takes nothing but Esc. */
    if (previewOpen) {
      e.preventDefault()
      if (k === 'Escape') setPreviewOpen(false)
      return
    }
    if (e.ctrlKey && (k === 'c' || k === 'C')) {
      e.preventDefault()
      if (j.busy) interrupt()
      else { setInput(''); setCollect(null); setCollectHint(false) }
      return
    }
    if (k === 'Escape') {
      /* Innermost first: collect prompt, then an open list, then the run. */
      e.preventDefault()
      if (collect) { setCollect(null); setInput(''); setCollectHint(false) }
      else if (resumeOpen) setResumeOpen(false)
      else if (active) setDismissed(active.key)
      else if (j.busy) interrupt()
      return
    }
    if (k === 'Enter') {
      e.preventDefault()
      if (collect) {
        const text = input.trim()
        /* A slash command still runs as a command, and drops the collect. */
        if (text.startsWith('/')) {
          setCollect(null); setInput('')
          submit(text)
          return
        }
        if (!text) { setCollectHint(true); return }
        const c = collect
        tookInput()
        setCollect(null); setInput('')
        c.run(text)
        return
      }
      if (active && (!input.trim() || (typed >= 0 && typed < active.items.length))) {
        setInput('')
        pick(active.sel)
        return
      }
      submit(input)
      setInput('')
      return
    }
    if (k === 'ArrowUp' || k === 'ArrowDown') {
      e.preventDefault()
      const d = k === 'ArrowUp' ? -1 : 1
      if (active && !input) {
        const n = active.items.length
        if (n) setSel({ key: active.key, i: (active.sel + d + n) % n })
        return
      }
      const h = history.current
      if (!h.length) return
      let at = histAt.current === -1 ? h.length : histAt.current
      at = Math.max(0, Math.min(h.length, at + d))
      histAt.current = at >= h.length ? -1 : at
      setInput(at >= h.length ? '' : h[at])
      return
    }
  }

  const onLink = (l: NonNullable<Seg['link']>) => {
    if (l.kind === 'url') {
      /* localhost is the app ng serve is running — the "system browser" opens
         on it. Anything else (a Jira ticket) is outside the demo. */
      if (l.url.startsWith(LOCAL_URL) && (canPreview || previewRunning)) openPreview()
      else print([dim(`↗ ${l.url} (external link, not opened in this demo)`)])
      return
    }
    const sc = j.scenario
    const path = scenarioPath(sc, l.file)
    if (!sc || !sc.files[l.file]) { print([dim(`${path}: not in this workspace`)]); return }
    print([dim(`── ${path} ──`), ...fileText(sc, pg, l.file).split('\n').map(plain)])
  }

  return {
    j,
    lines,
    list: active,
    /** Set while a "Refine"-style choice is waiting for its free text. */
    promptLabel: collect ? collect.placeholder ?? 'What should change?' : null,
    /** Dim nudge under an empty collect prompt that was submitted. */
    promptHint: collect && collectHint ? 'Type what should change, or Esc to cancel' : null,
    input,
    setInput: (v: string) => { setInput(v); setCollectHint(false); histAt.current = -1 },
    onKeyDown,
    pick,
    onLink,
    status: home ? null : statusLine(ctx),
    busy: j.busy,
    home,
    preview: { open: previewOpen, close: () => setPreviewOpen(false), available: canPreview },
  }
}
