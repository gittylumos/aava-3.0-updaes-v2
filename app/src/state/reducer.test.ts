import { describe, it, expect } from 'vitest'
import { initialState, reducer, applyEffects, threadIdForTask } from './reducer'
import { matchHits, searchHits, taskNotifications } from '../data/chrome'
import type { Effect } from './types'

describe('reducer', () => {
  it('moves from start to conversation when the user sends a message', () => {
    const s = reducer(initialState, { type: 'USER_SAY', text: 'hello' })
    expect(s.arrangement).toBe('conversation')
    expect(s.messages).toHaveLength(1)
    expect(s.messages[0]).toMatchObject({ from: 'user', lines: ['hello'] })
  })

  it('replaces the trailing typing indicator when AAVA speaks', () => {
    let s = reducer(initialState, { type: 'TYPING' })
    expect(s.messages.at(-1)?.typing).toBe(true)
    s = applyEffects(s, [{ type: 'say', lines: ['Done.'] }])
    expect(s.messages).toHaveLength(1)
    expect(s.messages[0]).toMatchObject({ from: 'aava', lines: ['Done.'], typing: false })
  })

  it('enables a tab with a badge without switching to it', () => {
    const effects: Effect[] = [{ type: 'enableTab', tab: 'diff', badge: 1 }]
    const s = applyEffects(initialState, effects)
    expect(s.playground.enabledTabs).toContain('diff')
    expect(s.playground.diffBadge).toBe(1)
    expect(s.playground.activeTab).toBe(initialState.playground.activeTab)
  })

  /* Asking for the tab that is already active still has to count as a request —
     otherwise the Open button does nothing once the user closes that tab. */
  it('counts every explicit tab request, repeats included', () => {
    const before = initialState.playground.openRequest
    let s = reducer(initialState, { type: 'SET_TAB', tab: 'preview' })
    expect(s.playground.openRequest).toBe(before + 1)
    s = reducer(s, { type: 'SET_TAB', tab: 'preview' })
    expect(s.playground.openRequest).toBe(before + 2)
    // Editing is not a tab request.
    s = reducer(s, { type: 'EDIT_FILE', file: 'a.ts', text: 'x' })
    expect(s.playground.openRequest).toBe(before + 2)
  })

  /* Same rule for progress steps: clicking a second step while evidence is
     already the active tab has to reopen it after the user closed the tab. */
  it('counts every evidence focus, repeats included', () => {
    const before = initialState.playground.openRequest
    let s = reducer(initialState, { type: 'FOCUS_EVIDENCE', key: 'step-1' })
    expect(s.playground.openRequest).toBe(before + 1)
    s = reducer(s, { type: 'FOCUS_EVIDENCE', key: 'step-2' })
    expect(s.playground.activeTab).toBe('evidence')
    expect(s.playground.focusedEvidence).toBe('step-2')
    expect(s.playground.openRequest).toBe(before + 2)
  })

  it('gives a task opened over a running one its own thread', () => {
    let s = reducer(initialState, { type: 'OPEN_TASK', taskId: 'T1', scenario: null })
    s = applyEffects(s, [{ type: 'say', lines: ['Analyzed the task.'] }])
    s = reducer(s, { type: 'TYPING' })

    s = reducer(s, { type: 'OPEN_TASK', taskId: 'T3', scenario: null })
    expect(s.activeTaskId).toBe('T3')
    expect(s.arrangement).toBe('split')
    // Nothing of T1 leaks in: one opening line, and T3's own playground.
    expect(s.messages).toHaveLength(1)
    expect(s.messages[0].lines[0]).toContain('Reduce the page load time')
    expect(s.playground.taskId).toBe('T3')

    // T1 is parked whole, and settled — no typing dot left mid-beat.
    const parked = s.stashed[threadIdForTask('T1')]
    expect(parked.activeTaskId).toBe('T1')
    expect(parked.messages).toHaveLength(2)
    expect(parked.messages.some((m) => m.typing)).toBe(false)
  })

  it('parks the task thread when a new topic opens, and gives it back on resume', () => {
    let s = reducer(initialState, { type: 'OPEN_TASK', taskId: 'T1', scenario: null })
    s = applyEffects(s, [
      { type: 'say', lines: ['Analyzed the task.'] },
      { type: 'showTab', tab: 'preview' },
    ])
    const parkedMessages = s.messages.length

    s = reducer(s, { type: 'NEW_THREAD', text: 'What is the weather today?' })
    expect(s.arrangement).toBe('conversation')
    expect(s.activeTaskId).toBeNull()
    expect(s.messages).toHaveLength(1)
    expect(s.messages[0]).toMatchObject({ from: 'user', lines: ['What is the weather today?'] })
    expect(s.threads[0].title).toBe('What is the weather today?')
    expect(s.stashed['th-t1']).toBeDefined()

    s = reducer(s, { type: 'RESUME_THREAD', threadId: 'th-t1' })
    expect(s.activeTaskId).toBe('T1')
    // Coming back to it makes it the most recent thread, not a stale row.
    expect(s.threads[0].id).toBe('th-t1')
    expect(s.arrangement).toBe('split')
    expect(s.messages).toHaveLength(parkedMessages)
    expect(s.playground.activeTab).toBe('preview')
    // The topic thread we just left is parked in turn — nothing is ever lost.
    expect(Object.keys(s.stashed)).toHaveLength(1)
  })

  it('opens a Recents row for a chat started from the start view, once', () => {
    let s = reducer(initialState, { type: 'USER_SAY', text: 'Where did the migration stall?' })
    const before = s.threads.length
    expect(s.threads[0]).toMatchObject({ kind: 'chat', title: 'Where did the migration stall?' })
    expect(s.activeThreadId).toBe(s.threads[0].id)

    s = reducer(s, { type: 'USER_SAY', text: 'and who owns it?' })
    expect(s.threads).toHaveLength(before)
  })

  it('parks the open thread when you go home, so its sidebar row still resumes', () => {
    let s = reducer(initialState, { type: 'USER_SAY', text: 'Sprint status?' })
    const threadId = s.activeThreadId as string

    s = reducer(s, { type: 'GO_HOME' })
    expect(s.arrangement).toBe('start')
    expect(s.messages).toHaveLength(0)

    s = reducer(s, { type: 'RESUME_THREAD', threadId })
    expect(s.messages[0]).toMatchObject({ lines: ['Sprint status?'] })
  })

  /* My Tasks is a board you look at. The work behind it is not disturbed by
     looking, and closing the board puts you back exactly where you were. */
  it('shows the board over the live task without touching it, and comes back', () => {
    let s = reducer(initialState, { type: 'OPEN_TASK', taskId: 'T1', scenario: null })
    s = applyEffects(s, [{ type: 'showTab', tab: 'preview' }])
    const messages = s.messages.length

    s = reducer(s, { type: 'SHOW_TASKS' })
    expect(s.arrangement).toBe('tasks')
    expect(s.activeTaskId).toBe('T1')
    expect(s.activeThreadId).toBe(threadIdForTask('T1'))
    expect(s.messages).toHaveLength(messages)
    expect(s.stashed).toEqual({})

    s = reducer(s, { type: 'CLOSE_TASKS' })
    expect(s.arrangement).toBe('split')
    expect(s.playground.activeTab).toBe('preview')
  })

  /* A thread parked while the board is up must remember the arrangement behind
     it — otherwise its sidebar row resumes into the board, not the work. */
  it('never parks the board itself into a snapshot', () => {
    let s = reducer(initialState, { type: 'USER_SAY', text: 'Sprint status?' })
    const threadId = s.activeThreadId as string

    s = reducer(s, { type: 'SHOW_TASKS' })
    s = reducer(s, { type: 'GO_HOME' })
    expect(s.stashed[threadId].arrangement).toBe('conversation')
  })

  /* Pinning a task the user has never opened writes the derived id, so the row
     OPEN_TASK creates later has to be that same id or the pin points at nothing. */
  it('opens a task onto the thread id the sidebar pins', () => {
    const s = reducer(initialState, { type: 'OPEN_TASK', taskId: 'T2', scenario: null })
    expect(s.activeThreadId).toBe(threadIdForTask('T2'))
    expect(s.threads.filter((t) => t.id === threadIdForTask('T2'))).toHaveLength(1)
  })

  /* Opening the panel is not reading the rows in it — the badge and the bold
     titles both have to survive until a row is actually opened. */
  it('marks a notification read only when its row is opened', () => {
    const s = reducer(initialState, { type: 'OVERLAY', overlay: 'notifications' })
    expect(s.overlay).toBe('notifications')
    expect(s.readNotifications).toEqual(initialState.readNotifications)

    const read = reducer(s, { type: 'READ_NOTIFICATION', taskId: 'T1' })
    expect(read.readNotifications).toContain('T1')
    // Reading it twice must not stack a duplicate id.
    expect(reducer(read, { type: 'READ_NOTIFICATION', taskId: 'T1' })).toBe(read)
  })

  it('searches tasks and chats, on more than the visible text', () => {
    const hits = searchHits(initialState.tasks, initialState.threads)
    expect(hits.filter((h) => h.kind === 'task')).toHaveLength(initialState.tasks.length)
    // Task threads are not separate hits — the task row already opens them.
    expect(hits.filter((h) => h.kind === 'chat').map((h) => h.title)).toEqual(['Sprint scope questions'])

    // Ticket key and task id are searchable although neither is in the title.
    expect(matchHits(hits, 'MOB-2841').map((h) => h.taskId)).toEqual(['T1'])
    expect(matchHits(hits, 't4').map((h) => h.taskId)).toEqual(['T4'])
    // Every term has to hit, and order does not matter.
    expect(matchHits(hits, 'progress bar')).toHaveLength(1)
    expect(matchHits(hits, 'bar progress')).toHaveLength(1)
    expect(matchHits(hits, 'progress telemetry')).toHaveLength(0)
    expect(matchHits(hits, '   ')).toHaveLength(hits.length)
  })

  it('builds one notification per task, unread until read', () => {
    const items = taskNotifications(initialState.tasks, initialState.readNotifications)
    expect(items).toHaveLength(initialState.tasks.length)
    expect(items[0]).toMatchObject({ id: 'T1', tag: 'review', unread: true })
    // T5 and T6 are the finished ones, seeded as already read.
    expect(items.filter((n) => n.unread).map((n) => n.id).sort()).toEqual(['T1', 'T2', 'T3', 'T4', 'T7'])
    expect(items.every((n) => n.title && n.body && n.when)).toBe(true)
  })
})
