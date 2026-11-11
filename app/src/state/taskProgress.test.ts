import { describe, expect, it } from 'vitest'
import { TASKS } from './reducer'
import { t1 } from '../scenarios/t1'
import { t7 } from '../scenarios/t7'
import { deriveTaskBoard, formatEta, formatStageProgress, formatStageProgressAccessible, taskProgressText } from './taskProgress'

describe('task progress', () => {
  it('formats minute and half-hour ETAs', () => {
    expect(formatEta(59_000)).toBe('<1 min')
    expect(formatEta(60_000)).toBe('1 min')
    expect(formatEta(59 * 60_000)).toBe('59 min')
    expect(formatEta(59.5 * 60_000)).toBe('60 min')
    expect(formatEta(60 * 60_000)).toBe('1 hr')
    expect(formatEta(75 * 60_000)).toBe('1.5 hrs')
  })

  it('uses a screen-reader friendly phrase below one minute', () => {
    expect(formatStageProgressAccessible({ stage: 3, totalStages: 5, etaMs: 59_000 }))
      .toBe('Stage 3 of 5, less than 1 minute to next review')
    expect(formatStageProgressAccessible({ stage: 3, totalStages: 5, etaMs: 60_000 }))
      .toBe('Stage 3 of 5, about 1 min to next review')
  })

  it('shows estimating when a running stage has no estimate', () => {
    expect(formatStageProgress({ stage: 2, totalStages: 5 })).toBe('Stage 2 of 5 · estimating…')
    expect(taskProgressText({ ...TASKS[0], status: 'wip', runProgress: undefined })).toBe('estimating…')
  })

  it('derives stage, review, and completion from the live prep step', () => {
    const running = deriveTaskBoard(TASKS, { T1: { scenario: t1, prepAt: 0 } })
    expect(running.find((task) => task.id === 'T1')).toMatchObject({
      status: 'wip', tag: 'working', runProgress: { stage: 1, totalStages: 5 },
    })

    const review = deriveTaskBoard(TASKS, { T1: { scenario: t1, prepAt: 9 } })
    expect(taskProgressText(review.find((task) => task.id === 'T1')!)).toBe('Stage 5 of 5 · Needs your input')

    const complete = deriveTaskBoard(TASKS, { T1: { scenario: t1, prepAt: t1.prep.length } })
    expect(complete.find((task) => task.id === 'T1')).toMatchObject({ status: 'done', tag: 'done' })
  })

  it('keeps the migration review gate at stage four with no ETA', () => {
    const board = deriveTaskBoard(TASKS, { T7: { scenario: t7, prepAt: 3 } })
    const task = board.find((item) => item.id === 'T7')!
    expect(task).toMatchObject({ status: 'clarify', tag: 'input', runProgress: { stage: 4, totalStages: 5 } })
    expect(taskProgressText(task)).toBe('Stage 4 of 5 · Needs your input')
  })

  it('shows queue position without an ETA', () => {
    const tasks = [
      { ...TASKS[0], id: 'Q1', status: 'pending' as const },
      { ...TASKS[1], id: 'Q2', status: 'pending' as const },
    ]
    const queued = deriveTaskBoard(tasks, { Q1: { scenario: t1, prepAt: 0 } })
    expect(queued[0].status).toBe('wip')
    expect(taskProgressText(queued[1])).toBe('Queued · #1')

    const allQueued = deriveTaskBoard(tasks, {})
    expect(taskProgressText(allQueued[0])).toBe('Queued · #1')
    expect(taskProgressText(allQueued[1])).toBe('Queued · #2')
  })
})
