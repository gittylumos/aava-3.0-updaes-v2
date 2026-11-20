import { createContext, useContext, type ReactNode } from 'react'
import type { Scenario, TabId } from './types'

/* What the run timeline block needs that a message does not carry: the live
   scenario and where its run stands. Provided by App around the conversation. */
export interface RunTimelineCtx {
  scenario: Scenario | null
  prepAt: number
  waiting: boolean
  preview: ReactNode
  onOpenTab: (tab: TabId) => void
  onToast: (text: string) => void
}
export const RunTimelineContext = createContext<RunTimelineCtx | null>(null)
export const useRunTimeline = () => useContext(RunTimelineContext)
