import { describe, it, expect } from 'vitest'
import { isInsightIntent, isBacklogIntent, isPrdIntent } from './data'
import {
  insightOpening, insightProgress, insightChips, insightRouter, INSIGHT_BEATS,
} from './insightFlow'
import type { Effect, Message, BlockSpec } from '../state/types'
import type { InsightView } from './insight'

/* A fake message stream carrying the document (view) blocks a run has produced —
   what both the progress dock and the chip suggestion read from. */
function withViews(...views: InsightView[]): Message[] {
  return views.map((v, i) => ({
    id: `m${i}`, from: 'aava' as const, lines: [],
    block: { kind: 'document', name: `${v}.view`, format: 'LIVE', insight: v } as BlockSpec,
  }))
}

/** The insight view a beat reveals, if any. */
function viewOf(beat: Effect[]): InsightView | null {
  for (const e of beat) {
    if (e.type === 'say' && e.block?.kind === 'document') return e.block.insight ?? null
  }
  return null
}

describe('isInsightIntent', () => {
  it('fires on the analytics-after-a-release prompt', () => {
    expect(isInsightIntent('Show me the latest analytics data after release 3.4 that happened last night.')).toBe(true)
  })

  it('does not steal the backlog or PRD intents', () => {
    const backlog = 'Here is my PRD — create the epics and user stories.'
    const prd = 'Draft a PRD for the onboarding flow.'
    expect(isInsightIntent(backlog)).toBe(false)
    expect(isInsightIntent(prd)).toBe(false)
    // and the reverse: the analytics prompt is not a backlog/PRD intent
    const seed = 'Show me the latest analytics data after release 3.4 that happened last night.'
    expect(isBacklogIntent(seed)).toBe(false)
    expect(isPrdIntent(seed)).toBe(false)
  })
})

describe('insightOpening', () => {
  it('matches a capability and proposes a 5-step plan whose Proceed starts the run', () => {
    const eff = insightOpening()
    const cap = eff.find((e) => e.type === 'say' && e.block?.kind === 'capability')
    expect(cap).toBeTruthy()
    const plan = eff.find((e) => e.type === 'say' && e.block?.kind === 'plan')
    expect(plan?.type === 'say' && plan.block?.kind === 'plan' && plan.block.count).toBe(5)
    expect(plan?.type === 'say' && plan.block?.kind === 'plan' && plan.block.action?.beat).toBe('startAnalysis')
    // The Proceed beat exists and is the first analysis step.
    expect(INSIGHT_BEATS.startAnalysis).toBeTruthy()
  })
})

describe('the five steps reveal the five views in order', () => {
  const order: [string, InsightView][] = [
    ['startAnalysis', 'funnel'],
    ['correlate', 'feedback'],
    ['auditLogs', 'audit'],
    ['estimateImpact', 'impact'],
    ['draftPrd', 'prd'],
  ]
  it.each(order)('%s reveals the %s view', (beat, view) => {
    expect(viewOf(INSIGHT_BEATS[beat])).toBe(view)
  })
})

describe('insightProgress', () => {
  it('is dormant until the first view lands', () => {
    expect(insightProgress([]).started).toBe(false)
  })

  it('advances one step per view revealed', () => {
    expect(insightProgress(withViews('funnel')).at).toBe(0)
    expect(insightProgress(withViews('funnel', 'feedback')).at).toBe(1)
    expect(insightProgress(withViews('funnel', 'feedback', 'audit')).at).toBe(2)
    // Once the PRD (last) view lands the run's work is complete — all steps done.
    expect(insightProgress(withViews('funnel', 'feedback', 'audit', 'impact', 'prd')).at).toBe(5)
  })

  it('never claims a golden gate — the PM drives each step', () => {
    expect(insightProgress(withViews('funnel')).waiting).toBe(false)
  })
})

describe('insightChips — the next-step suggestion', () => {
  it('offers the next question after each view, and nothing after the PRD', () => {
    expect(insightChips(withViews('funnel')).length).toBe(1)
    expect(insightChips(withViews('funnel', 'feedback')).length).toBe(1)
    expect(insightChips(withViews('funnel', 'feedback', 'audit', 'impact', 'prd'))).toEqual([])
  })

  it('each suggested prompt routes to the next step', () => {
    const next: [InsightView, string][] = [
      ['funnel', 'correlate'],
      ['feedback', 'auditLogs'],
      ['audit', 'estimateImpact'],
      ['impact', 'draftPrd'],
    ]
    for (const [view, beat] of next) {
      const chip = insightChips(withViews(view))[0]
      expect(chip).toBeTruthy()
      expect(insightRouter(chip.sends)).toBe(INSIGHT_BEATS[beat])
    }
  })
})

describe('insightRouter', () => {
  it('maps free-typed questions to the right step, most-specific first', () => {
    expect(insightRouter('where are users getting stuck?')).toBe(INSIGHT_BEATS.correlate)
    expect(insightRouter('fetch the application logs for the submit button')).toBe(INSIGHT_BEATS.auditLogs)
    expect(insightRouter("what's the revenue impact over the weekend?")).toBe(INSIGHT_BEATS.estimateImpact)
    expect(insightRouter('draft the PRD and fix spec')).toBe(INSIGHT_BEATS.draftPrd)
    expect(insightRouter('raise the Jira ticket for the billing team')).toBe(INSIGHT_BEATS.raiseTicket)
    expect(insightRouter('thanks, looks good')).toBeNull()
  })
})
