import { describe, it, expect } from 'vitest'
import { t1 } from './t1'
import { getScenario, routeBeat } from './index'
import { hasPreview } from '../state/workspace'

describe('t1 scenario', () => {
  it('has ten prep steps, each with a matching evidence block', () => {
    expect(t1.prep).toHaveLength(10)
    for (const step of t1.prep) {
      expect(t1.evidence[step.key], `evidence missing for ${step.key}`).toBeDefined()
    }
  })

  /* The other half of T7's "offers no preview tab" — T1 ships a page, so
     removing the tab there would take the thing the run produced with it. */
  it('keeps its preview', () => {
    expect(hasPreview(t1)).toBe(true)
  })

  it('routes the demo phrases to the right beats', () => {
    expect(routeBeat(t1, 'run it')).toBe('run')
    expect(routeBeat(t1, 'show me the output')).toBe('run')
    expect(routeBeat(t1, "what's not covered?")).toBe('coverage')
    expect(routeBeat(t1, 'raise the PRs')).toBe('ship')
    expect(routeBeat(t1, 'what is the weather')).toBeNull()
  })

  it('routes "Show me the diff" to the diff beat, not run', () => {
    expect(routeBeat(t1, 'Show me the diff')).toBe('diff')
  })

  /* Really a test of router ORDER — the greedy preview rule matches "show" and
     "run", so it has to stay last. Fails the day someone appends a rule to the
     bottom of the list instead of placing it. */
  it('routes the review paths without the preview rule stealing them', () => {
    expect(routeBeat(t1, 'Review the code changes')).toBe('files')
    expect(routeBeat(t1, 'Show me the diff')).toBe('diff')
    expect(routeBeat(t1, 'run it')).toBe('run')
  })

  it('every file link opens a file the scenario actually has', () => {
    const links = t1.beats.files.flatMap((e) =>
      e.type === 'say' && e.block?.kind === 'links' ? e.block.links : [])
    expect(links).not.toHaveLength(0)
    for (const l of links) {
      expect(l.file, `"${l.label}" is not openable`).toBeDefined()
      expect(t1.files[l.file!], `no such file: ${l.file}`).toBeDefined()
    }
  })

  it('every chip sends text that routes to a beat', () => {
    for (const chips of Object.values(t1.chips)) {
      for (const chip of chips) {
        expect(routeBeat(t1, chip.sends), `chip "${chip.label}" routes nowhere`).not.toBeNull()
      }
    }
  })

  it('ships the form with Submit below the comment field', () => {
    const html = t1.files['feedback-form.component.html'].versions[0]
    expect(html.indexOf('play-button')).toBeGreaterThan(html.indexOf('play-character-counter'))
  })

  /* Raising a PR puts the work in front of other people, so it is a gate here
     exactly as it is in t7 — the last step is the one that asks. */
  it('gates the PRs on its final step, and shipping finishes the run', () => {
    expect(t1.prep.flatMap((s, i) => (s.gate ? [i] : []))).toEqual([9])
    expect(t1.prep[9].gate).toBe('ship')
    const ask = t1.beats.ship.find((e) => e.type === 'say' && e.block?.kind === 'confirm')
    if (ask?.type !== 'say' || ask.block?.kind !== 'confirm') throw new Error('ship asks nothing')
    expect(ask.block.step).toBe(10)
    expect(ask.block.acceptBeat).toBe('shipped')
    expect(t1.beats.shipped.flatMap((e) => (e.type === 'prepAt' ? [e.index] : []))).toEqual([10])
  })

  it('is registered under its task id', () => {
    expect(getScenario('T1')).toBe(t1)
    expect(getScenario('T3')).toBeNull()
  })
})
