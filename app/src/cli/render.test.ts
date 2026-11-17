import { describe, expect, it, vi } from 'vitest'
import { t1 } from '../scenarios/t1'
import { initialState } from '../state/reducer'
import type { Message } from '../state/types'
import { gateChoices, liveGate, renderMessage } from './render'
import { printDiff, printSteps, statusLine } from './printers'
import type { Journey, RenderCtx } from './types'

function fakeCtx(prepAt = 9): { ctx: RenderCtx; j: Record<string, ReturnType<typeof vi.fn>> } {
  const j = { runBeat: vi.fn(), dismissBlock: vi.fn(), recordAnswer: vi.fn() }
  const state = {
    ...initialState, activeTaskId: 'T1', activeThreadId: 'th-t1',
    playground: { ...initialState.playground, prepAt },
  }
  const journey = { ...j, state, scenario: t1, busy: false } as unknown as Journey
  return { ctx: { j: journey }, j }
}

const readyGate = (): Message => {
  const eff = t1.beats.prep.at(-1)!
  if (eff.type !== 'say') throw new Error('expected say')
  return { id: 'g1', from: 'aava', lines: eff.lines, block: eff.block }
}

describe('cli render', () => {
  it('READY_GATE gives two choices, Review changes first and primary', () => {
    const { ctx, j } = fakeCtx()
    const cs = gateChoices(readyGate(), ctx)
    expect(cs.map((c) => c.label)).toEqual(['Review changes', 'Refine changes'])
    expect(cs[0].primary).toBe(true)
    expect(cs[1].collect).toBe(true)
    cs[0].run()
    expect(j.recordAnswer).toHaveBeenCalledWith('g1', 'Review changes')
    expect(j.dismissBlock).toHaveBeenCalledWith('g1')
    expect(j.runBeat).toHaveBeenCalledWith('files')
    cs[1].run('  make it blue ')
    expect(j.recordAnswer).toHaveBeenLastCalledWith('g1', 'make it blue')
    expect(j.runBeat).toHaveBeenLastCalledWith('feedback')
  })

  it('a retired gate has no choices and is not the live gate', () => {
    const { ctx } = fakeCtx()
    const m = { ...readyGate(), live: false }
    expect(gateChoices(m, ctx)).toEqual([])
    expect(liveGate([m])).toBeNull()
    expect(liveGate([readyGate(), m])?.id).toBe('g1')
  })

  it('renders user messages and bold markers', () => {
    const { ctx } = fakeCtx()
    expect(renderMessage({ id: 'u', from: 'user', lines: ['hi'] }, ctx)[0].map((s) => s.text).join('')).toBe('› hi')
    const rows = renderMessage({ id: 'a', from: 'aava', lines: ['a **b** `c`'] }, ctx)
    expect(rows[0].find((s) => s.text === 'b')?.tone).toBe('bold')
    expect(rows[0].map((s) => s.text).join('')).toBe('⏺ a b c')
  })

  it('printSteps header counts done steps', () => {
    const { ctx } = fakeCtx(9)
    expect(printSteps(ctx)[0][0].text).toBe('Steps · 9/10')
    expect(statusLine(ctx).map((s) => s.text).join('')).toBe('● Waiting on you · 9/10 steps · MOB-2841')
  })

  it('printDiff prints a git header per file', () => {
    const { ctx } = fakeCtx()
    const text = printDiff(ctx).map((l) => l.map((s) => s.text).join(''))
    expect(text.filter((t) => t.startsWith('diff --git')).length).toBe(9)
  })
})
