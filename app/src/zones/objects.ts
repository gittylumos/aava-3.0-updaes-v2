/* Canvas objects and their views — what the Toolbar switches between.
 *
 * The deck is precise about the Toolbar: "views of the current object, slots
 * fixed, widgets bound, fires events into Canvas." So the Toolbar is not a bag
 * of buttons that happens to sit near the Canvas — it is the view switcher for
 * whatever OBJECT the Canvas is holding, and the object's KIND decides the
 * views. That is what makes it persona- and SDLC-aware without any persona code:
 * a PM working a PRD object gets PRD views; a developer working an App object
 * gets code and preview. The object carries its own toolbar.
 *
 * This mirrors how v0, bolt, lovable and Claude's artifacts all work — a central
 * Preview/Code switch plus a few object actions — except the view set is derived
 * from the object rather than hardcoded, so a new object kind is a new entry
 * here, not a new toolbar.
 */
import type { ChannelCapability } from './types'
import type { ViewIconId } from './toolbarIcons'

/** The kinds of thing the Canvas can hold. Extend as modules land. */
export type CanvasObjectKind = 'prd' | 'app' | 'agent' | 'backlog'

/* A view needs a surface to be fully usable. `render` = something must display
 * (a preview); `runtime` = something must execute. On a channel that cannot
 * offer it, the view is not deleted — it is DELEGATED (opens by reference, deck
 * slide 14) or handed to the host (IDE, slide 13). The Toolbar shows that state
 * rather than hiding the view, so the user always knows the view exists. */
export type ViewSurface = 'render' | 'runtime'

export interface ObjectView {
  id: string
  label: string
  icon: ViewIconId
  needs?: ViewSurface
}

/** How a view resolves on a given channel. */
export type ViewAvailability = 'available' | 'delegated' | 'native'

const VIEWS: Record<CanvasObjectKind, ObjectView[]> = {
  /* PM-facing. A PRD run emits structured content (title, goals, requirements,
     risks, stakeholders, open questions) — the schema-emitted Canvas of deck
     slide 18 — and these are the ways of looking at it. Pure content, so every
     view is available on every channel. */
  prd: [
    { id: 'document', label: 'Document', icon: 'document' },
    { id: 'stories', label: 'User stories', icon: 'stories' },
    { id: 'requirements', label: 'Requirements', icon: 'table' },
    { id: 'risks', label: 'Risks', icon: 'risk' },
    { id: 'stakeholders', label: 'Stakeholders', icon: 'people' },
    { id: 'questions', label: 'Open questions', icon: 'question' },
    { id: 'versions', label: 'Versions', icon: 'history' },
  ],

  /* Developer-facing. The existing playground artefacts, named as object views.
     Preview needs a render surface; Code and Diff go native inside an IDE. */
  app: [
    { id: 'preview', label: 'Preview', icon: 'preview', needs: 'render' },
    { id: 'code', label: 'Code', icon: 'code', needs: 'runtime' },
    { id: 'diff', label: 'Diff', icon: 'diff' },
    { id: 'tests', label: 'Tests', icon: 'tests' },
    { id: 'evidence', label: 'Evidence', icon: 'evidence' },
  ],

  /* Author-facing. An agent under configuration. */
  agent: [
    { id: 'config', label: 'Configuration', icon: 'settings' },
    { id: 'runs', label: 'Runs', icon: 'history' },
    { id: 'evidence', label: 'Evidence', icon: 'evidence' },
    { id: 'manifest', label: 'Manifest', icon: 'document' },
  ],

  /* A PRD-to-backlog run. Rendered through the document canvas rather than this
     view switcher, so the list is nominal (kept for the type's completeness). */
  backlog: [
    { id: 'document', label: 'Document', icon: 'document' },
  ],
}

export function viewsFor(kind: CanvasObjectKind): ObjectView[] {
  return VIEWS[kind]
}

/* Resolve one view against a channel's capability — the seam where the zone
 * design meets the surface. Same view, different reachability per channel:
 *   - a render view on a dissolved-canvas channel (mobile, CLI) is delegated
 *   - code/diff on a borrowed-canvas channel (IDE) are handed to the host
 *   - everything else is simply available. */
export function availabilityOf(view: ObjectView, cap: ChannelCapability): ViewAvailability {
  if (view.needs === 'render' && cap.canvas === 'dissolved') return 'delegated'
  if (cap.canvas === 'borrowed' && (view.id === 'code' || view.id === 'diff')) return 'native'
  if (view.needs === 'runtime' && !cap.runtime) return 'delegated'
  return 'available'
}
