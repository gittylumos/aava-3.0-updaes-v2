import { describe, it, expect } from 'vitest'
import { isPrdIntent, isBacklogIntent, prdSubject, prdTitle } from './data'

describe('isBacklogIntent — the PRD-to-backlog (Example 2) trigger', () => {
  it('matches "epics and user stories"', () => {
    expect(isBacklogIntent('here is my PRD, help me create epics and user stories')).toBe(true)
  })
  it('matches other decomposition phrasings', () => {
    expect(isBacklogIntent('break my PRD into epics and features')).toBe(true)
    expect(isBacklogIntent('turn this into a backlog')).toBe(true)
    expect(isBacklogIntent('features, stories and sprints from this PRD')).toBe(true)
  })
  it('does not fire on a single signal (that is a PRD-draft ask)', () => {
    expect(isBacklogIntent('create a PRD with a couple of user stories')).toBe(false)
  })
})

describe('isPrdIntent — catches both phrasings', () => {
  it('matches "create a PRD for X"', () => {
    expect(isPrdIntent('create a PRD for a customer referral program')).toBe(true)
  })
  it('matches "here is our PRD, extract epics and stories"', () => {
    expect(isPrdIntent('Here is our PRD v2.4. Please extract the requirements, group them into Epics, and generate the user stories.')).toBe(true)
  })
  it('does not match ordinary chat that merely says "prd"', () => {
    expect(isPrdIntent('what does PRD stand for?')).toBe(false)
  })
  it('does not match unrelated work', () => {
    expect(isPrdIntent('create a feedback form')).toBe(false)
  })
})

describe('prdSubject / prdTitle', () => {
  it('lifts a for-introduced subject', () => {
    expect(prdSubject('create a PRD for a customer referral program')).toBe('a customer referral program')
    expect(prdTitle('a customer referral program')).toBe('PRD · Customer referral program')
  })
  it('defaults when the PRD is named by version, not subject', () => {
    expect(prdSubject('Here is our PRD v2.4, extract the stories')).toBe('your product')
    expect(prdTitle('your product')).toBe('PRD · Epics & Stories')
  })
})
