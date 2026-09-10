import { describe, it, expect } from 'vitest'
import { isBacklogIntent, isInsightIntent, isPrdIntent } from './data'
import {
  isArtifactIntent, agentOpening, agentProgress, agentRouter, matchById, ARTIFACT_MATCHES, AGENT_BEATS,
} from './agentFlow'
import type { Effect, Message, BlockSpec } from '../state/types'

/** The effect types a beat emits — used to assert a beat sets the dock phase,
    flips the clone, or adds the stakeholder node. */
function types(beat: Effect[]): string[] {
  return beat.map((e) => e.type)
}

describe('isArtifactIntent', () => {
  it('fires on "looking for an agentic process to build HLDs"', () => {
    expect(isArtifactIntent("I'm looking for an agentic process to build HLDs")).toBe(true)
    expect(isArtifactIntent('find a golden artifact to create HLDs')).toBe(true)
  })

  it('does not steal the backlog / insight / PRD intents, or lose them to it', () => {
    const backlog = 'Here is my PRD — create the epics and user stories.'
    const insight = 'Show me the latest analytics data after release 3.4.'
    const prd = 'Draft a PRD for the onboarding flow.'
    expect(isArtifactIntent(backlog)).toBe(false)
    expect(isArtifactIntent(insight)).toBe(false)
    // and the reverse — the HLD ask is none of the others
    const hld = "I'm looking for an agentic process to build HLDs"
    expect(isBacklogIntent(hld)).toBe(false)
    expect(isInsightIntent(hld)).toBe(false)
    expect(isPrdIntent(hld)).toBe(false)
    expect(isArtifactIntent(prd)).toBe(false)
  })
})

describe('agentOpening', () => {
  it('matches the Artifact Identification capability and proposes a 5-step plan', () => {
    const eff = agentOpening()
    const cap = eff.find((e) => e.type === 'say' && e.block?.kind === 'capability')
    expect(cap?.type === 'say' && cap.block?.kind === 'capability' && cap.block.badge).toBe('AID-1.0')
    const plan = eff.find((e) => e.type === 'say' && e.block?.kind === 'plan')
    expect(plan?.type === 'say' && plan.block?.kind === 'plan' && plan.block.count).toBe(5)
    expect(plan?.type === 'say' && plan.block?.kind === 'plan' && plan.block.action?.beat).toBe('refineProcess')
    expect(AGENT_BEATS.refineProcess).toBeTruthy()
  })
})

describe('the golden-process matches', () => {
  it('are three ranked processes, HLD Architecture Builder the best fit at 97%', () => {
    expect(ARTIFACT_MATCHES).toHaveLength(3)
    const best = [...ARTIFACT_MATCHES].sort((a, b) => b.match - a.match)[0]
    expect(best.title).toBe('HLD Architecture Builder')
    expect(best.match).toBe(97)
    expect(ARTIFACT_MATCHES.every((a) => a.type === 'Process')).toBe(true)
  })

  it('matchById resolves a card, falling back to the best fit', () => {
    expect(matchById('4567').title).toBe('System Architect Builder')
    expect(matchById(undefined).title).toBe('HLD Architecture Builder')
  })
})

describe('the run beats drive the dock and the canvas', () => {
  it('refine adds C4 as a new step and re-asks for confirmation', () => {
    const proc = AGENT_BEATS.refine.find((e) => e.type === 'say' && e.block?.kind === 'process')
    const steps = proc?.type === 'say' && proc.block?.kind === 'process' ? proc.block.steps : []
    expect(steps.some((s) => s.added && /c4/i.test(s.label))).toBe(true)
  })

  it('matchArtifacts sets dock phase 1 and shows the catalog window', () => {
    expect(AGENT_BEATS.matchArtifacts.some((e) => e.type === 'setAgentPhase' && e.phase === 1)).toBe(true)
    const cat = AGENT_BEATS.matchArtifacts.find((e) => e.type === 'say' && e.block?.kind === 'artifacts')
    expect(cat?.type === 'say' && cat.block?.kind === 'artifacts' && cat.block.items.length).toBe(3)
  })

  it('cloneArtifact flips the canvas to a working copy', () => {
    expect(types(AGENT_BEATS.cloneArtifact)).toContain('setAgentCloned')
  })

  it('addStakeholder inserts the node on the canvas', () => {
    expect(types(AGENT_BEATS.addStakeholder)).toContain('setAgentStakeholder')
  })

  it('the run ends by routing for approval (dock reaches all 5 steps)', () => {
    expect(AGENT_BEATS.approve.some((e) => e.type === 'setAgentPhase' && e.phase === 5)).toBe(true)
  })
})

describe('agentProgress — the hanging dock', () => {
  const noMsgs: Message[] = []
  it('is dormant until the run starts', () => {
    expect(agentProgress(noMsgs, undefined).started).toBe(false)
  })

  it('advances with the object phase and finishes at 5', () => {
    expect(agentProgress(noMsgs, 0).at).toBe(0)
    expect(agentProgress(noMsgs, 2).at).toBe(2)
    expect(agentProgress(noMsgs, 5).at).toBe(5)
  })

  it('reads "waiting on you" while a live gate is parked', () => {
    const gate: Message[] = [{ id: 'g', from: 'aava', lines: [], live: true, block: { kind: 'decision', variant: 'action', title: 't', question: 'q', options: [] } as BlockSpec }]
    expect(agentProgress(gate, 2).waiting).toBe(true)
    expect(agentProgress(noMsgs, 2).waiting).toBe(false)
  })
})

describe('agentRouter — typed input inside the run', () => {
  it('routes a stakeholder request to the node-add, and a C4 change to the refine', () => {
    expect(agentRouter('Add a Stakeholder Review step after the HITL Review node')).toBe(AGENT_BEATS.addStakeholder)
    expect(agentRouter('Add C4 diagram generation after solution proposal')).toBe(AGENT_BEATS.refine)
    expect(agentRouter('identify the matching artifacts')).toBe(AGENT_BEATS.matchArtifacts)
    expect(agentRouter('thanks, that looks great')).toBeNull()
  })
})
