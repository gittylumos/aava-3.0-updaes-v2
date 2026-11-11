import type { Scenario, Task } from './types'

export interface ScenarioTaskRun {
  scenario: Scenario
  prepAt: number
}

export function formatEta(etaMs?: number): string {
  if (etaMs === undefined || !Number.isFinite(etaMs) || etaMs < 0) return 'estimating…'
  if (etaMs < 60_000) return '<1 min'

  const minutes = Math.round(etaMs / 60_000)
  if (etaMs < 60 * 60_000) return `${minutes} min`

  const halfHours = Math.max(1, Math.round(minutes / 30))
  const hours = halfHours / 2
  return `${hours} hr${hours === 1 ? '' : 's'}`
}

export function formatStageProgress(
  progress: { stage?: number; totalStages?: number; etaMs?: number },
  waiting = false,
): string {
  const stage = progress.stage && progress.totalStages
    ? `Stage ${progress.stage} of ${progress.totalStages} · `
    : ''
  if (waiting) return `${stage}Needs your input`
  if (!progress.stage || !progress.totalStages) return 'estimating…'
  const eta = formatEta(progress.etaMs)
  return `${stage}${eta === 'estimating…' ? eta : `~${eta} to next review`}`
}

export function taskProgressText(task: Task): string | null {
  if (task.status === 'pending') return `Queued · #${task.queuePosition ?? '—'}`
  if (task.status === 'wip') return formatStageProgress(task.runProgress ?? {})
  if (task.status === 'clarify' && task.runProgress) {
    return formatStageProgress(task.runProgress, true)
  }
  return null
}

export function deriveScenarioTask(task: Task, scenario: Scenario, prepAt: number): Task {
  if (prepAt >= scenario.prep.length) {
    return { ...task, status: 'done', tag: 'done', runProgress: undefined, queuePosition: undefined }
  }

  const step = scenario.prep[prepAt]
  const stages = scenario.stages ?? []
  const stageIndex = stages.findIndex((stage) => stage.key === step?.stageKey)
  const runProgress = stageIndex >= 0
    ? { stage: stageIndex + 1, totalStages: stages.length, etaMs: step?.etaMs }
    : undefined

  if (step?.gate) {
    return { ...task, status: 'clarify', tag: 'input', runProgress, queuePosition: undefined }
  }
  return { ...task, status: 'wip', tag: 'working', runProgress, queuePosition: undefined }
}

export function deriveTaskBoard(
  tasks: Task[],
  runs: Readonly<Record<string, ScenarioTaskRun>>,
): Task[] {
  const derivedTasks = tasks.map((task) => {
    const run = runs[task.id]
    return run ? deriveScenarioTask(task, run.scenario, run.prepAt) : task
  })
  const queuePositions = new Map(
    derivedTasks.filter((task) => task.status === 'pending').map((task, index) => [task.id, index + 1]),
  )

  return derivedTasks.map((task) => task.status === 'pending'
    ? { ...task, queuePosition: queuePositions.get(task.id) }
    : task)
}
