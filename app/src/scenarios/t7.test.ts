import { describe, it, expect } from 'vitest'
import { t7 } from './t7'
import { getScenario, routeBeat } from './index'
import { initialState, prepStart } from '../state/reducer'
import { openableTabs } from '../state/workspace'
import { acceptBeatAt } from '../state/useJourney'
import type { Effect } from '../state/types'

describe('t7 scenario', () => {
  it('has ten prep steps, each with a matching evidence block', () => {
    expect(t7.prep).toHaveLength(10)
    for (const step of t7.prep) {
      expect(t7.evidence[step.key], `evidence missing for ${step.key}`).toBeDefined()
    }
  })

  /* The shape of the whole demo: three gates, and the run parked on the first. */
  it('gates sit at steps 4, 7 and 10, and the run opens parked on step 4', () => {
    expect(t7.prep.flatMap((s, i) => (s.gate ? [i] : []))).toEqual([3, 6, 9])
    expect(prepStart(t7.prep)).toBe(3)
  })

  it('leaves steps 1-3 done, with the Validator agent third', () => {
    expect(t7.prep.slice(0, 3).map((s) => s.pending)).toEqual([undefined, undefined, undefined])
    expect(t7.prep[2].label).toMatch(/validator agent/i)
  })

  /* Clearing a gate has to MOVE the run, not just talk about it. */
  it('each approval beat advances the run past its gate', () => {
    const jumps = (name: string) =>
      t7.beats[name].flatMap((e: Effect) => (e.type === 'prepAt' ? [e.index] : []))
    expect(jumps('approved1')).toEqual([6])
    expect(jumps('approved2')).toEqual([9])
    expect(jumps('raised')).toEqual([t7.prep.length])
  })

  it('the opening leads with the validation results', () => {
    const blocks = t7.beats.prep.flatMap((e: Effect) =>
      e.type === 'say' && e.block ? [e.block.kind] : [])
    expect(blocks[0]).toBe('validation')
    // The gate is appended by the engine from prep[3].gate, never inlined here —
    // inlining it is what stranded it the moment a chip was clicked.
    expect(blocks).not.toContain('confirm')
  })

  /* The card and the Tests tab read the same run — a failure named in one and
     absent from the other is the prototype contradicting itself on screen. */
  it('the validation card agrees with the tests tab', () => {
    const card = t7.beats.prep.find((e: Effect) => e.type === 'say' && e.block?.kind === 'validation')
    if (card?.type !== 'say' || card.block?.kind !== 'validation') throw new Error('no validation card')
    const { counts, failing } = card.block
    expect(counts.passed + counts.failed).toBe(counts.tests)
    expect(failing).toHaveLength(counts.failed)
    expect(t7.tests.failing).toHaveLength(counts.failed)
    for (const spec of t7.tests.failing!) expect(t7.tests.specs).toContain(spec)
    expect(t7.tests.specs).toHaveLength(counts.tests)
  })

  /* Both gates are named steps, and the numbers match where they sit. */
  it('each gate confirm names the step it belongs to', () => {
    for (const [name, index] of [['gate1', 3], ['gate2', 6], ['gate3', 9]] as const) {
      const ask = t7.beats[name].find((e: Effect) => e.type === 'say' && e.block?.kind === 'confirm')
      if (ask?.type !== 'say' || ask.block?.kind !== 'confirm') throw new Error(`${name} asks nothing`)
      expect(ask.block.step).toBe(index + 1)
      expect(ask.block.title).toBeTruthy()
    }
  })

  /* Nothing suggests; the gate asks. A beat that set a chip stage would put
     suggestions back under the one card that is supposed to hold the glance. */
  it('offers no chips at all', () => {
    expect(t7.chips).toEqual({})
    for (const [name, beat] of Object.entries(t7.beats)) {
      expect(beat.some((e: Effect) => e.type === 'chips'), `${name} sets a chip stage`).toBe(false)
    }
  })

  /* With the chips gone, typing IS the only way to the reading branches — so
     the phrases a demo would actually type have to land, and none of them may
     move the run. */
  it('every reading branch is reachable by typing, and none of them advance the run', () => {
    for (const said of [
      'Show the validation results', 'Review the mapping code',
      'Show me the diff', 'What is still open?',
    ]) {
      const name = routeBeat(t7, said)
      expect(name, `"${said}" routes nowhere`).not.toBeNull()
      const beat = t7.beats[name!]
      expect(beat, `"${said}" routes to a missing beat`).toBeDefined()
      expect(beat.some((e: Effect) => e.type === 'prepAt'), `"${said}" advances the run`).toBe(false)
    }
  })

  /* Typing an approval clears the gate the run is ON — which is why the router
     must not carry approval words at all. The only input left is the composer,
     so this is now the whole keyboard path through the run. */
  it('resolves the accept beat from the parked step, not from the router', () => {
    expect(acceptBeatAt(t7, 3)).toBe('approved1')
    expect(acceptBeatAt(t7, 6)).toBe('approved2')
    expect(acceptBeatAt(t7, 9)).toBe('raised')
    expect(acceptBeatAt(t7, 0)).toBeNull()
    expect(acceptBeatAt(t7, t7.prep.length)).toBeNull()
    for (const rule of t7.router) {
      expect(rule.match.test('approve'), `router steals "approve": ${rule.match}`).toBe(false)
      expect(rule.match.test('sign off'), `router steals "sign off": ${rule.match}`).toBe(false)
    }
  })

  it('every confirm block accepts into a beat that exists', () => {
    const accepts = Object.values(t7.beats).flatMap((beat) =>
      beat.flatMap((e: Effect) => (e.type === 'say' && e.block?.kind === 'confirm' ? [e.block.acceptBeat] : [])))
    expect(accepts.sort()).toEqual(['approved1', 'approved2', 'raised'])
    for (const name of accepts) expect(t7.beats[name], `no beat: ${name}`).toBeDefined()
  })

  it('routes the demo phrases to the right beats', () => {
    expect(routeBeat(t7, 'Show the validation results')).toBe('validation')
    expect(routeBeat(t7, 'Show me the diff')).toBe('diff')
    expect(routeBeat(t7, 'What is still open?')).toBe('open')
    expect(routeBeat(t7, 'what is the weather')).toBeNull()
  })

  /* Router ORDER, not just membership — "Show the validation results" contains
     "show", and "Review the mapping code" contains "review". */
  it('keeps the specific rules ahead of the greedy ones', () => {
    expect(routeBeat(t7, 'Review the mapping code')).toBe('files')
    expect(routeBeat(t7, 'Show the validation results')).toBe('validation')
  })

  it('every file link opens a file the scenario actually has', () => {
    const links = t7.beats.files.flatMap((e: Effect) =>
      e.type === 'say' && e.block?.kind === 'links' ? e.block.links : [])
    expect(links).not.toHaveLength(0)
    for (const l of links) {
      expect(l.file, `"${l.label}" is not openable`).toBeDefined()
      expect(t7.files[l.file!], `no such file: ${l.file}`).toBeDefined()
    }
  })

  /* No .html to render, so a preview tab here could only ever show the empty
     state — it is not offered at all. T1, which ships a page, still gets it. */
  it('offers no preview tab', () => {
    const tabs = openableTabs(initialState.playground, 'T7', t7).map((e) => e.legacy)
    expect(tabs).not.toContain('preview')
    expect(tabs).toContain('tests')
  })

  /* The card's file link, the results tab header and the file tree all name
     `tests.file` — it has to be a file the editor can actually open, and its
     source has to hold the specs the tab lists. */
  it('ships the spec file the validation card links to', () => {
    const spec = t7.files[t7.tests.file!]
    expect(spec, `no such file: ${t7.tests.file}`).toBeDefined()
    expect(t7.fileOrder).toContain(t7.tests.file)
    for (const title of t7.tests.specs) {
      expect(spec.versions[0], `spec missing: ${title}`).toContain(title)
    }
  })

  it('is registered under its task id', () => {
    expect(getScenario('T7')).toBe(t7)
  })
})
