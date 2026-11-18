/* "Open this link inside the prototype." The web app provides it, so Jira,
 * GitHub and Figma links open as browser tabs in the right-hand canvas instead
 * of leaving the page. Surfaces that do not provide it (the IDE and CLI demos)
 * get null and keep their own link behaviour.
 */
import { createContext, useContext } from 'react'

export interface OpenUrl {
  open: (url: string) => void
  /** The active task's ticket — a Jira source with no key of its own means this one. */
  ticket?: string
}

export const OpenUrlContext = createContext<OpenUrl | null>(null)
export const useOpenUrl = () => useContext(OpenUrlContext)
