/* Small text helpers every CLI module shares: segment builder, the demo's
 * fixed URLs, and how a scenario file is shown as a path. */
import type { Scenario } from '../state/types'
import type { Seg, Tone } from './types'

export const JIRA_BROWSE = 'https://aava-demo.atlassian.net/browse/'
/** Where `ng serve` runs; the preview "browser" opens on it. */
export const LOCAL_URL = 'http://localhost:4200'

export const seg = (text: string, tone?: Tone, link?: Seg['link']): Seg =>
  link ? { text, tone, link } : tone ? { text, tone } : { text }

/** A scenario file as the user sees it: under the scenario's `fileRoot`. */
export function scenarioPath(scenario: Scenario | null | undefined, file: string): string {
  const root = scenario?.fileRoot
  return root ? `${root}/${file}` : file
}
