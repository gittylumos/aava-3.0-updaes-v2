import { describe, it, expect } from 'vitest'
import { viewsFor, availabilityOf } from './objects'
import { CHANNELS } from './types'

describe('viewsFor — the object carries its own toolbar', () => {
  it('a PRD object exposes PM views (document, stories, requirements…)', () => {
    const ids = viewsFor('prd').map((v) => v.id)
    expect(ids).toContain('document')
    expect(ids).toContain('stories')
    expect(ids).toContain('requirements')
  })

  it('an App object exposes developer views (preview, code, diff…)', () => {
    const ids = viewsFor('app').map((v) => v.id)
    expect(ids).toEqual(['preview', 'code', 'diff', 'tests', 'evidence'])
  })
})

describe('availabilityOf — the same view resolves per channel', () => {
  const preview = viewsFor('app').find((v) => v.id === 'preview')!
  const code = viewsFor('app').find((v) => v.id === 'code')!
  const document = viewsFor('prd').find((v) => v.id === 'document')!

  it('Preview is available on Web but delegated on Mobile (canvas dissolved)', () => {
    expect(availabilityOf(preview, CHANNELS.web)).toBe('available')
    expect(availabilityOf(preview, CHANNELS.mobile)).toBe('delegated')
  })

  it('Code goes native inside the IDE host', () => {
    expect(availabilityOf(code, CHANNELS.ide)).toBe('native')
    expect(availabilityOf(code, CHANNELS.web)).toBe('delegated') // web declares no runtime
    expect(availabilityOf(code, CHANNELS.desktop)).toBe('available')
  })

  it('pure content views (a PRD document) are available everywhere', () => {
    for (const cap of Object.values(CHANNELS)) {
      expect(availabilityOf(document, cap)).toBe('available')
    }
  })
})
