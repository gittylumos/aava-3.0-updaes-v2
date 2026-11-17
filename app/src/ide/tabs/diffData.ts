/* What the diff editor compares, read off the scenario's diff groups — the
   same data the web Changes tab renders. Nothing is invented per view. */
import type { DiffGroup, Scenario } from '../../state/types'

interface Entry { status: '+' | '~' | '-'; file: string; group: DiffGroup }

/* The changed files the run ships source for, in diff order. */
function entries(scenario: Scenario): Entry[] {
  const out: Entry[] = []
  for (const group of scenario.diff) {
    for (const raw of group.files) {
      const m = raw.match(/^([+~-])\s+(.+)$/)
      if (!m) continue
      const file = m[2].split('/').pop() ?? m[2]
      if (scenario.files[file]) out.push({ status: m[1] as Entry['status'], file, group })
    }
  }
  return out
}

/** The file the Diff request opens: a modified file if the run has one (its
    hunk is the interesting part), else the first changed file. */
export function diffFileFor(scenario: Scenario): string | null {
  const all = entries(scenario)
  return (all.find((e) => e.status === '~') ?? all[0])?.file ?? scenario.fileOrder[0] ?? null
}

const strip = (text: string) => text.replace(/^[+\- ] ?/, '')

/** The left side of the diff. An earlier scripted version when there is one;
    empty for an added file; for a modified file, the latest text with its
    group's hunk reversed (added lines out, removed lines back in). */
export function originalOf(scenario: Scenario, file: string, modified: string): string {
  const versions = scenario.files[file]?.versions ?? []
  if (versions.length > 1) return versions[0].replaceAll('@@', '')
  const entry = entries(scenario).find((e) => e.file === file)
  if (!entry || entry.status === '+') return ''
  const hunk = entry.group.lines ?? []
  const adds = hunk.filter((l) => l.tone === 'add').map((l) => strip(l.text).trim())
  const dels = hunk.filter((l) => l.tone === 'del').map((l) => strip(l.text).trim())
  const lines = modified.split('\n')
  const at = lines.findIndex((l) => adds.includes(l.trim()))
  if (at === -1) return modified
  const indent = lines[at].match(/^\s*/)?.[0] ?? ''
  const kept = lines.filter((l, i) => i < at || !adds.includes(l.trim()))
  kept.splice(at, 0, ...dels.map((d) => indent + d))
  return kept.join('\n')
}
