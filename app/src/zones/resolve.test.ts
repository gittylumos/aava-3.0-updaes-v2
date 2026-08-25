import { describe, it, expect } from 'vitest'
import { resolveFrame, presentZones } from './resolve'
import { CHANNEL_IDS, ZONE_IDS } from './types'

describe('resolveFrame — the five zones are always resolvable', () => {
  it('every channel × mode resolves all five zones', () => {
    for (const channel of CHANNEL_IDS) {
      for (const mode of ['rest', 'work'] as const) {
        const frame = resolveFrame(channel, mode)
        expect(Object.keys(frame).sort()).toEqual([...ZONE_IDS].sort())
      }
    }
  })
})

describe('Web — two resting configurations (deck slide 11)', () => {
  it('rest: sidebar expanded, conversation centred, canvas/toolbar/watch dissolved', () => {
    const f = resolveFrame('web', 'rest')
    expect(f.sidebar).toEqual({ presence: 'primary', appearance: 'expanded' })
    expect(f.conversation.presence).toBe('primary')
    expect(f.canvas.presence).toBe('dissolved')
    expect(f.toolbar.presence).toBe('dissolved')
    expect(f.watch.presence).toBe('dissolved')
    expect(presentZones(f)).toEqual(['sidebar', 'conversation'])
  })

  it('work: sidebar folds to a rail, canvas docks, toolbar and watch appear', () => {
    const f = resolveFrame('web', 'work')
    expect(f.sidebar).toEqual({ presence: 'folded', appearance: 'rail' })
    expect(f.canvas.presence).toBe('primary')
    expect(f.toolbar.presence).toBe('primary')
    expect(f.watch.presence).toBe('primary')
  })
})

describe('Desktop — same frame as Web, differs only in capability (deck slide 12)', () => {
  it('resolves the same zone presences as Web in both modes', () => {
    for (const mode of ['rest', 'work'] as const) {
      const web = resolveFrame('web', mode)
      const desk = resolveFrame('desktop', mode)
      for (const z of ZONE_IDS) expect(desk[z].presence).toBe(web[z].presence)
    }
  })
})

describe('IDE in situ — canvas surrendered, watch dissolved (deck slide 13)', () => {
  it('never renders its own Canvas or Watch', () => {
    for (const mode of ['rest', 'work'] as const) {
      const f = resolveFrame('ide', mode)
      expect(f.canvas.presence).toBe('dissolved')
      expect(f.watch.presence).toBe('dissolved')
    }
  })
})

describe('Mobile and CLI — canvas dissolved (deck slide 14)', () => {
  it('mobile: conversation only, no canvas, no watch', () => {
    const f = resolveFrame('mobile', 'work')
    expect(f.canvas.presence).toBe('dissolved')
    expect(f.watch.presence).toBe('dissolved')
    expect(f.conversation.presence).toBe('primary')
  })

  it('cli: canvas dissolved but Watch runs inline', () => {
    const f = resolveFrame('cli', 'work')
    expect(f.canvas.presence).toBe('dissolved')
    expect(f.watch).toEqual({ presence: 'primary', appearance: 'inline' })
  })
})
