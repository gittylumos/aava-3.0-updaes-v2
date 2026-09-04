import { describe, it, expect } from 'vitest'
import { isReportIntent, isInsightIntent } from './data'
import { pmReportOpening, reportProgress, PM_REPORT_BEATS } from './pmReportFlow'
import type { Effect, Message, BlockSpec } from '../state/types'
import type { ReportView } from './report'

function withAssets(...views: ReportView[]): Message[] {
  return views.map((v, i) => ({
    id: `m${i}`, from: 'aava' as const, lines: [],
    block: { kind: 'document', name: `${v}`, format: 'HTML', report: v } as BlockSpec,
  }))
}

/** The asset a beat reveals, if any. */
function assetOf(beat: Effect[]): ReportView | null {
  for (const e of beat) {
    if (e.type === 'say' && e.block?.kind === 'document') return e.block.report ?? null
  }
  return null
}

/** The option beats a beat's decision gate offers. */
function gateBeats(beat: Effect[]): string[] {
  for (const e of beat) {
    if (e.type === 'say' && e.block?.kind === 'decision') return e.block.options.map((o) => o.beat)
  }
  return []
}

describe('isReportIntent', () => {
  it('fires on a triage/report ask, and yields the plainer analytics ask to the insight run', () => {
    expect(isReportIntent('Prepare an analytics triage report for release v3.4')).toBe(true)
    expect(isReportIntent('Analyze the v3.4 analytics and prepare a triage report')).toBe(true)
    // the plain "show me analytics" ask has no report/triage deliverable cue
    expect(isReportIntent('Show me the latest analytics after release 3.4')).toBe(false)
    // and that plain ask still belongs to the insight run
    expect(isInsightIntent('Show me the latest analytics after release 3.4')).toBe(true)
  })
})

describe('pmReportOpening', () => {
  it('matches a capability and proposes a 4-step plan whose Proceed starts the run', () => {
    const eff = pmReportOpening()
    const cap = eff.find((e) => e.type === 'say' && e.block?.kind === 'capability')
    expect(cap).toBeTruthy()
    const plan = eff.find((e) => e.type === 'say' && e.block?.kind === 'plan')
    expect(plan?.type === 'say' && plan.block?.kind === 'plan' && plan.block.count).toBe(4)
    expect(plan?.type === 'say' && plan.block?.kind === 'plan' && plan.block.action?.beat).toBe('startAnalysis')
    expect(PM_REPORT_BEATS.startAnalysis).toBeTruthy()
  })
})

describe('the flow reveals the right assets and gates', () => {
  it('startAnalysis reveals the .html analysis asset and offers the A/B impact gate', () => {
    expect(assetOf(PM_REPORT_BEATS.startAnalysis)).toBe('analysis')
    expect(gateBeats(PM_REPORT_BEATS.startAnalysis)).toEqual(['calcImpact', 'prepSummary'])
  })

  it('branch A models impact, reveals the impact PDF, and offers the raise-ticket gate', () => {
    expect(assetOf(PM_REPORT_BEATS.calcImpact)).toBe('impact')
    expect(gateBeats(PM_REPORT_BEATS.calcImpact)).toEqual(['raiseTicket', 'ticketSkipped'])
  })

  it('branch B drafts a summary, reveals the recommendations PDF, and offers the raise-ticket gate', () => {
    expect(assetOf(PM_REPORT_BEATS.prepSummary)).toBe('recommendations')
    expect(gateBeats(PM_REPORT_BEATS.prepSummary)).toEqual(['raiseTicket', 'ticketSkipped'])
  })

  it('raising the ticket ends with the Jira links', () => {
    const raise = PM_REPORT_BEATS.raiseTicket
    const links = raise.find((e) => e.type === 'say' && e.block?.kind === 'links')
    expect(links).toBeTruthy()
  })
})

describe('reportProgress', () => {
  it('is dormant until an asset lands, then advances with the assets', () => {
    expect(reportProgress([]).started).toBe(false)
    expect(reportProgress(withAssets('analysis')).at).toBe(2)
    expect(reportProgress(withAssets('analysis', 'impact')).at).toBe(4)
    expect(reportProgress(withAssets('analysis', 'recommendations')).at).toBe(4)
  })
})
