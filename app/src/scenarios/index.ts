import type { Scenario } from '../state/types'
import { t1 } from './t1'
import { t7 } from './t7'

/** Register Personas 2 & 3 here — no engine changes required. */
const SCENARIOS: Record<string, Scenario> = { T1: t1, T7: t7 }

export function getScenario(taskId: string): Scenario | null {
  return SCENARIOS[taskId] ?? null
}

export function routeBeat(scenario: Scenario, text: string): string | null {
  for (const rule of scenario.router) {
    if (rule.match.test(text)) return rule.beat
  }
  return null
}

export { t1, t7 }
