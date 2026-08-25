import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { TASKS, initialState, prepStart, reducer, threadIdForTask } from './reducer'
import { getScenario, routeBeat } from '../scenarios'
import { prdSubject, prdTitle, isPrdIntent, isBacklogIntent } from '../prd/data'
import { prdOpening, prdCreateDocument, prdReviseDocument, prdRouter, PRD_BEATS } from '../prd/flow'
import { backlogOpening, backlogReply, BACKLOG_BEATS } from '../prd/backlogFlow'
import type { BacklogDoc } from '../prd/backlog'
import { searchHits, taskNotifications } from '../data/chrome'
import type { Effect, Overlay, Scenario, TabId, Thread } from './types'
import { T, prefersReducedMotion, streamMs } from './timing'

const REDUCED = prefersReducedMotion

/* Scope is a vocabulary check, not a classifier: a message that names nothing in
   this task's world — its systems, its artefacts, the work itself — is a new
   topic. Cheap, and wrong in the harmless direction (it offers, never assumes). */
const IN_SCOPE =
  /\b(task|ticket|jira|figma|design|frame|api|contract|endpoint|schema|code|file|test|spec|coverage|repo|branch|commit|pr|prs|merge|ship|raise|build|lint|component|library|play|form|feedback|submit|button|field|rating|comment|preview|diff|deploy|bug|error|fix|change|move|rerun|run|status|review|approve|assum|cover|blocked|open item|next step|you|your)\b/i

const AGREES = /^(alright|all right|ok|okay|yes|yep|yeah|sure|please|go ahead|do it|start (a )?new thread)\b/i

/* Clearing a gate by typing rather than clicking. Anchored on purpose: a gate's
   own words turn up all over the reading branches — "approve the mapping" is a
   step label — and a mid-sentence match would clear a gate the user was only
   asking about. Which gate it clears is never written down here; the run is
   parked on exactly one, and that one's accept beat is the answer. */
const APPROVES = /^(approve|approved|approval|go ahead|do it|yes|yep|yeah|sure|sign.?off|proceed|confirm|ship it)\b/i

/** The beat behind the accept button of the gate the run is parked on, if any. */
export function acceptBeatAt(sc: Scenario, at: number): string | null {
  const asks = sc.prep[at]?.gate ? sc.beats[sc.prep[at].gate!] : undefined
  const confirm = asks?.find((e) => e.type === 'say' && e.block?.kind === 'confirm')
  if (confirm?.type !== 'say' || confirm.block?.kind !== 'confirm') return null
  return sc.beats[confirm.block.acceptBeat] ? confirm.block.acceptBeat : null
}

/* The parked question gets answered in the new thread, not deflected. Anything
   answerable from what the app actually has — the clock, right now — is answered
   outright; anything needing a source it is not wired into says so in one line
   and stops. Refusing to answer "what time is it" is the thing that makes an
   assistant feel like a form. */
export function replyNewTopic(question: string): string[] {
  //const parked = 'New thread — the task one is parked as it was, and comes back from the sidebar.'

  if (/\b(time|clock|what.?s the hour)\b/i.test(question)) {
    const now = new Date()
    return [`It is ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}, ${now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}.`]
  }

  if (/\b(weather|temperature|forecast|rain|raining|hot|cold outside)\b/i.test(question)) {
    return ['No weather source is wired into me — connect one and I will answer from it. Everything I answer comes from a system I am connected to.']
  }

  return ['I answer from the systems I am wired into — Jira, the repo, Figma, the API contract. Point me at a source for this and I will use it.']
}

/* Nothing survives a reload, on purpose. This is a prototype that gets demoed:
   every run has to start from the same state and tell the same story, and a
   half-finished thread from the last run leaking into the next one is the one
   thing that cannot happen in front of a room. */
export function useJourney() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const timers = useRef<number[]>([])

  /* Leaving a thread cancels what it had scheduled. A beat is a chain of
     timeouts, and without this the task you just walked away from keeps speaking
     — into whichever thread you opened next. */
  const cancel = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => cancel, [cancel])

  const after = useCallback((ms: number, fn: () => void) => {
    const delay = REDUCED() ? 0 : ms
    const id = window.setTimeout(fn, delay)
    timers.current.push(id)
  }, [])

  const scenario = useMemo(
    () => (state.activeTaskId ? getScenario(state.activeTaskId) : null),
    [state.activeTaskId],
  )

  /* A pending decision outlives the answer you asked for.
   *
   * Reading around a gate — the validation results, the diff, what is still
   * open — must not cost you the gate: USER_SAY clears the chips, and the
   * confirm block that asked the question is now somewhere up the transcript.
   * So the gate is replayed onto the end of whatever was just said, which puts
   * the decision AND its chips back at the bottom where the user is looking.
   *
   * Which gate is not the beat's business — `prepAt` already knows. A beat that
   * moves the run (an approval) is read at its destination, so clearing gate 4
   * presents gate 7 without either beat naming the other. */
  const withGate = useCallback((sc: Scenario | null, beats: Effect[], from?: number) => {
    if (!sc) return beats
    const moved = beats.filter((e) => e.type === 'prepAt').at(-1)
    /* `from` is for the caller that runs BEFORE its own dispatch lands: opening
       a task still reads the outgoing thread's playground. The scenario comes in
       as an argument for the same reason — `state.activeTaskId` is a tick behind. */
    const at = moved?.type === 'prepAt' ? moved.index : from ?? state.playground.prepAt
    const gate = sc.prep[at]?.gate
    const asks = gate ? sc.beats[gate] : undefined
    // The gate replaying itself would append itself forever.
    return !asks || asks === beats ? beats : [...beats, ...asks]
  }, [state.playground.prepAt])

  /* Plays a beat on a real clock.
   *
   * Latency is deliberately NOT uniform: a bare acknowledgement returns at
   * `ttftFast`, an answer that reasons over gathered context costs `ttftReason`,
   * and every tool call and build carries its own measured duration from `T`.
   * Uniform pacing is what makes a prototype read as scripted. */
  const play = useCallback((effects: Effect[]) => {
    let elapsed = 0

    for (const effect of effects) {
      if (effect.type === 'wait') { elapsed += effect.ms; continue }

      /* Tool calls: each row resolves on its own latency before the next starts. */
      if (effect.type === 'tools') {
        const at = elapsed
        after(at, () => dispatch({ type: 'APPLY', effect }))
        let stepAt = at
        effect.steps.forEach((step, i) => {
          stepAt += step.ms
          const done = i + 1
          after(stepAt, () => dispatch({ type: 'APPLY', effect: { type: 'toolProgress', done } }))
        })
        elapsed = stepAt
        continue
      }

      if (effect.type === 'say') {
        const at = elapsed
        /* `stream: false` is work that was already finished before you arrived —
           prepared work has no think-time and nothing to reveal, so it lands
           whole, with no typing indicator in front of it. */
        if (effect.stream === false) {
          after(at, () => dispatch({ type: 'APPLY', effect }))
          continue
        }
        const ttft = effect.block || effect.lines.join(' ').length > 90 ? T.ttftReason : T.ttftFast

        after(at, () => dispatch({ type: 'TYPING' }))
        after(at + ttft, () => dispatch({ type: 'APPLY', effect }))
        // Hold the next effect until the text has finished streaming, so beats
        // don't stack on top of a half-revealed sentence.
        elapsed = at + ttft + streamMs(effect.lines.join(' '))
        continue
      }

      const at = elapsed
      after(at, () => dispatch({ type: 'APPLY', effect }))
    }
  }, [after])

  const runBeat = useCallback((name: string) => {
    /* Object decision cards fire beats from their own flow, not a scenario —
       the object path has no scenario to look them up in. */
    if (state.activeObject?.kind === 'backlog') {
      const beat = BACKLOG_BEATS[name]
      if (beat) play(beat)
      return
    }
    if (state.activeObject?.kind === 'prd') {
      const beat = PRD_BEATS[name]
      if (beat) play(beat)
      return
    }
    const sc = state.activeTaskId ? getScenario(state.activeTaskId) : null
    const beat = sc?.beats[name]
    if (beat) play(withGate(sc, beat))
  }, [state.activeTaskId, state.activeObject, play, withGate])

  const send = useCallback((text: string) => {
    const pending = state.pendingTopic

    /* Intent path: "create a PRD…" from a resting home screen walks straight
       into the playground with a PRD object — no task card. Checked before
       USER_SAY so the object's own opening thread carries the first line,
       exactly as opening a task does. Only from rest: inside a task or an object
       the message belongs to the work in front of the user. */
    /* Example 2 — attach a PRD and ask for epics + user stories. Checked before
       the PRD-draft intent because the phrasing mentions a PRD too. */
    if (!state.activeTaskId && !state.activeObject && !pending && isBacklogIntent(text)) {
      cancel()
      dispatch({ type: 'OPEN_OBJECT', kind: 'backlog', title: 'Backlog · WireFrame Studio', subject: 'WireFrame Studio', said: text })
      dispatch({ type: 'SET_SIDEBAR_OPEN', open: false })
      play(backlogOpening())
      return
    }

    if (!state.activeTaskId && !state.activeObject && !pending && isPrdIntent(text)) {
      cancel()
      const subject = prdSubject(text)
      dispatch({ type: 'OPEN_OBJECT', kind: 'prd', title: prdTitle(subject), subject, said: text })
      dispatch({ type: 'SET_SIDEBAR_OPEN', open: false })
      play(prdOpening(subject))
      return
    }

    /* Inside a PRD object: typed feedback drives the refinement loops, and the
       decision-card buttons run PRD beats through runBeat. Anything the router
       does not recognise gets a gentle nudge rather than a task-shaped reply. */
    /* Inside a backlog run: typed comments are acknowledged and folded into the
       current canvas draft; the phase gates advance via the decision buttons. */
    if (state.activeObject?.kind === 'backlog') {
      dispatch({ type: 'USER_SAY', text })
      play(backlogReply())
      return
    }

    if (state.activeObject?.kind === 'prd') {
      dispatch({ type: 'USER_SAY', text })
      const subject = state.activeObject.subject
      /* The first reply is the answer to the clarifying turn — that is what
         produces the document. After it exists, replies revise it. */
      const hasDoc = state.messages.some((m) => m.block?.kind === 'document')
      if (!hasDoc) { play(prdCreateDocument(subject)); return }
      const beats = prdRouter(text)
      if (beats) { play(beats); return }
      play(prdReviseDocument(subject))
      return
    }

    dispatch({ type: 'USER_SAY', text })

    // "alright" / the chip — carry the parked question into a fresh thread.
    if (pending && AGREES.test(text.trim())) {
      cancel()
      dispatch({ type: 'NEW_THREAD', text: pending })
      play([{ type: 'say', lines: replyNewTopic(pending) }])
      return
    }

    const sc = state.activeTaskId ? getScenario(state.activeTaskId) : null

    if (sc) {
      /* Yes, at the gate the run is actually parked on. The router is stateless
         and cannot tell step 4's approval from step 7's — this can, so the
         approval words stay out of the router entirely. */
      const accept = acceptBeatAt(sc, state.playground.prepAt)
      if (accept && APPROVES.test(text.trim())) { play(withGate(sc, sc.beats[accept])); return }

      const beat = routeBeat(sc, text)
      if (beat && sc.beats[beat]) { play(withGate(sc, sc.beats[beat])); return }
      // Nothing in the message belongs to this task's world. Say so and offer
      // the split rather than answering out of context inside a task thread.
      if (!IN_SCOPE.test(text)) {
        dispatch({ type: 'PENDING_TOPIC', text })
        play([{ type: 'say', lines: [
          'This is a new topic altogether! Do you want to start a new thread for this?',
          'This thread stays exactly as it is — I will keep the task, the evidence and the running app right here.',
        ] }])
        return
      }
      play(withGate(sc, [{ type: 'say', lines: sc.fallback }]))
      return
    }

    play([{ type: 'say', lines: replyOffTask(text) }])
  }, [state.activeTaskId, state.activeObject, state.pendingTopic, state.messages, state.playground.prepAt, play, cancel, withGate])

  const toast = useCallback((text: string | null) => {
    dispatch({ type: 'TOAST', text })
    if (text) after(3400, () => dispatch({ type: 'TOAST', text: null }))
  }, [after])

  /* Every route into a task comes through here — a card, the board, the sidebar,
     a notification. A task you already had open comes back as you left it: it is
     a parked thread like any other, so reopening it must never restart it from
     the prep beat and throw the run away. */
  const openTask = useCallback((taskId: string) => {
    const threadId = threadIdForTask(taskId)
    /* Working on a task is the moment the navigation stops earning its width —
       the conversation and the artefact workspace both want it. The rail keeps
       every destination one click away, and this is intent like any other, so
       the user can put the sidebar straight back and it stays put. */
    dispatch({ type: 'SET_SIDEBAR_OPEN', open: false })
    // Already the live thread. From the board that means "take me back into it";
    // anywhere else CLOSE_TASKS is a no-op, so this stays the dead click it was.
    if (threadId === state.activeThreadId) { dispatch({ type: 'CLOSE_TASKS' }); return }
    cancel()
    if (state.stashed[threadId]) {
      dispatch({ type: 'RESUME_THREAD', threadId })
      return
    }
    const sc = getScenario(taskId)
    dispatch({ type: 'OPEN_TASK', taskId, scenario: sc })
    if (sc) { play(withGate(sc, sc.beats.prep, prepStart(sc.prep))); return }
    // No scripted beats for this task, but the product must never say so —
    // AAVA speaks to where the work actually stands, from the task's own copy.
    const task = TASKS.find((t) => t.id === taskId)
    if (task) play([{ type: 'say', lines: task.opening }])
  }, [state.activeThreadId, state.stashed, play, cancel, withGate])

  /* One way into a thread, whatever the sidebar shows it as. A parked thread
     comes back whole; a task thread that was never parked (a seeded one, or one
     restored from storage) opens the task instead of dead-ending. */
  const openThread = useCallback((thread: Thread) => {
    if (thread.id === state.activeThreadId) { dispatch({ type: 'CLOSE_TASKS' }); return }
    if (state.stashed[thread.id]) {
      cancel()
      dispatch({ type: 'RESUME_THREAD', threadId: thread.id })
      return
    }
    if (thread.taskId) { openTask(thread.taskId); return }
    toast('Nothing parked on that thread yet.')
  }, [state.activeThreadId, state.stashed, openTask, toast, cancel])

  /* The panel is a view of the board, not a second copy of it — a task that
     changes tag changes what its notification says. */
  const notifications = taskNotifications(state.tasks, state.readNotifications)

  return {
    state,
    scenario,
    notifications,
    unreadCount: notifications.filter((n) => n.unread).length,
    searchHits: searchHits(state.tasks, state.threads),
    readNotification: (taskId: string) => dispatch({ type: 'READ_NOTIFICATION', taskId }),
    send,
    openTask,
    runBeat,
    openThread,
    goHome: () => { cancel(); dispatch({ type: 'GO_HOME' }) },
    switchProfile: () => { cancel(); dispatch({ type: 'SWITCH_PROFILE' }) },
    showTasks: () => dispatch({ type: 'SHOW_TASKS' }),
    closeTasks: () => dispatch({ type: 'CLOSE_TASKS' }),
    closePlayground: () => dispatch({ type: 'CLOSE_PLAYGROUND' }),
    setTab: (tab: TabId) => dispatch({ type: 'SET_TAB', tab }),
    /* An artefact card's Open — reveal that backlog document in the canvas. */
    openObjectDoc: (doc: BacklogDoc) => dispatch({ type: 'SET_OBJECT_DOC', doc }),
    setFile: (file: string) => dispatch({ type: 'SET_FILE', file }),
    /* A file link in the conversation opens that file in the workspace. Both
       halves are needed: the tab id resolves from the active file, and the
       workspace only opens a tab when the resolved id changes. */
    openFile: (file: string) => {
      dispatch({ type: 'SET_FILE', file })
      dispatch({ type: 'SET_TAB', tab: 'code' })
    },
    editFile: (file: string, text: string) => dispatch({ type: 'EDIT_FILE', file, text }),
    focusEvidence: (key: string) => dispatch({ type: 'FOCUS_EVIDENCE', key }),
    dismissBlock: (messageId: string) => dispatch({ type: 'DISMISS_BLOCK', messageId }),
    setOverlay: (overlay: Overlay) => dispatch({ type: 'OVERLAY', overlay }),
    toggleContext: () => dispatch({ type: 'TOGGLE_CONTEXT' }),
    togglePanel: () => dispatch({ type: 'TOGGLE_PANEL' }),
    setPanelOpen: (open: boolean) => dispatch({ type: 'SET_PANEL_OPEN', open }),
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    setSidebarOpen: (open: boolean) => dispatch({ type: 'SET_SIDEBAR_OPEN', open }),
    togglePinThread: (threadId: string) => dispatch({ type: 'TOGGLE_PIN_THREAD', threadId }),
    toast,
  }
}

function replyOffTask(text: string): string[] {
  if (/(why|recommend|first)/i.test(text)) {
    return ['The feedback form is first because it is finished — it only needs your review. The rate-limiting PRD is waiting on two answers from the platform team, and the migration is blocked until someone grants read access to the legacy cluster.']
  }
  return ['One is ready for your review, two are waiting on something from you, and one is still running. Pick any of them and I will take it into the playground.']
}
