import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Group, Panel, Separator, useGroupRef, usePanelRef } from 'react-resizable-panels'
import { panelSetKey, type PanelLayout } from '../../state/workspace'

/* The three-region shell.
 *
 * Ownership, which is the whole reason this file exists:
 *
 *   React  →  whether a region is open        (intent)
 *   Panel  →  how many pixels wide it is      (geometry)
 *
 * Nothing else gets an opinion. There is no CSS width transition, no inline
 * min/max-width derived from `sidebarOpen`, and no React-held width — each of
 * those was a second source of truth fighting the panel library mid-drag.
 * Sizes go to the library in explicit px because v4 accepts unit strings, so
 * the design's 220/268/420 survives as itself rather than as a percentage
 * guess that drifts with the viewport.
 */

/** Matches --rail-w. The collapsed sidebar is a rail, not nothing. */
const RAIL_PX = 70

interface Props {
  sidebar: ReactNode
  main: ReactNode
  /* Passed whenever a task is open — NOT gated on the panel being visible.
     A closed right panel is a collapsed panel, so the workspace inside it keeps
     its model, its tabs and its scroll positions (§14). */
  right?: ReactNode
  sidebarOpen: boolean
  rightOpen: boolean
  /* Inside a task the nav gives up its column entirely and becomes a hover
     drawer: the work is the screen, and a rail sitting next to it is 70px of
     permanent furniture for something you touch once a session. */
  autoHideSidebar?: boolean
  onSidebarOpenChange: (open: boolean) => void
  onRightOpenChange: (open: boolean) => void
}

export function WorkspaceShell({
  sidebar,
  main,
  right,
  sidebarOpen,
  rightOpen,
  onSidebarOpenChange,
  onRightOpenChange,
  autoHideSidebar = false,
}: Props) {
  const groupRef = useGroupRef()
  const sidebarRef = usePanelRef()
  const rightRef = usePanelRef()

  const layoutKey = panelSetKey([
    ...(autoHideSidebar ? [] : ['sidebar']),
    'main',
    ...(right ? ['right'] : []),
  ])
  const prevKey = useRef(layoutKey)

  /* Every geometry this session has seen, kept in a ref rather than state: a
     drag fires a layout change per frame, and the ref is only ever read when
     the panel set changes. */
  const known = useRef<Record<string, PanelLayout>>({})

  /* The sidebar width the user last dragged to. One preference — "this is how
     wide I keep my nav" — reapplied when the panel set changes, because a
     percentage means a different width in a two-panel split than a three. */
  const latestPx = useRef<number | null>(null)

  /** The last collapsed state the GEOMETRY reported, so onResize can tell a
   *  real transition from a frame where intent has simply outrun layout. */
  const wasCollapsed = useRef(!sidebarOpen)

  /* Every move below produces resize events indistinguishable from a drag, and
     reading those back as the user's choice is how opening a task ends up
     rewriting the saved preference — the app would then come back collapsed
     forever after one task.
     `commanded` holds the collapsed state WE asked for and is cleared the
     moment geometry reports it. Deterministic on purpose: the library delivers
     its resize callback some frames after the call, so releasing the guard on a
     timer is a race that silently loses on a slow frame. */
  const commanded = useRef<boolean | null>(null)
  const command = (collapsedTarget: boolean, move: () => void) => {
    commanded.current = collapsedTarget
    move()
  }

  /* Widths, unlike collapse, settle within the frame — a flag is enough to keep
     a restored percentage from being saved as the user's chosen pixel width. */
  const programmatic = useRef(false)
  const asProgrammatic = (move: () => void) => {
    programmatic.current = true
    move()
    requestAnimationFrame(() => { programmatic.current = false })
  }

  /* The right panel arrives later — when a task opens — and that is a different
     panel set with its own remembered geometry, so it has to be applied
     imperatively or the split silently resets every time you open a task. */
  useEffect(() => {
    if (prevKey.current === layoutKey) return
    prevKey.current = layoutKey

    /* One frame's grace. React has already re-rendered, but the Group registers
       and unregisters its panels across the same commit, so applying a layout
       synchronously here hands a two-panel map to a group that still counts
       three — which the library rejects outright. */
    const id = requestAnimationFrame(() => {
      const group = groupRef.current
      if (!group) return
      /* If it still has not settled, do nothing: leaving the geometry alone is
         always safe, and the next drag re-persists it anyway. */
      if (panelSetKey(Object.keys(group.getLayout())) !== layoutKey) return

      asProgrammatic(() => {
        const stored = known.current[layoutKey]
        if (stored && panelSetKey(Object.keys(stored)) === layoutKey) group.setLayout(stored)

        /* A stored layout is a snapshot of percentages taken before any of this,
           and it knows nothing about whether the nav is meant to be a rail right
           now. So intent is reasserted immediately after applying it — otherwise
           opening a task restores a layout captured while the sidebar was still
           open and re-expands the sidebar that same task just collapsed. */
        if (!sidebarOpen) command(true, () => sidebarRef.current?.collapse())
        else if (latestPx.current) sidebarRef.current?.resize(`${latestPx.current}px`)
      })
    })
    return () => cancelAnimationFrame(id)
  }, [layoutKey, groupRef, sidebarRef, sidebarOpen])

  /* Intent → geometry. Guarded on the panel's own answer so this only ever runs
     when the two have actually diverged; without the guard it re-collapses a
     panel the user is mid-drag on. */
  useEffect(() => {
    const panel = sidebarRef.current
    if (!panel) return
    if (sidebarOpen && panel.isCollapsed()) command(false, () => panel.expand())
    else if (!sidebarOpen && !panel.isCollapsed()) command(true, () => panel.collapse())
  }, [sidebarOpen, sidebarRef])

  /* Hover intent for the drawer. Held here rather than in journey state: it is
     pointer position, not a decision — it must not survive anything. */
  const [peek, setPeek] = useState(false)
  useEffect(() => { if (!autoHideSidebar) setPeek(false) }, [autoHideSidebar])

  useEffect(() => {
    const panel = rightRef.current
    if (!panel) return
    if (rightOpen && panel.isCollapsed()) panel.expand()
    else if (!rightOpen && !panel.isCollapsed()) panel.collapse()
  }, [rightOpen, rightRef])

  return (
    <div className="relative h-full w-full">
    <Group
      groupRef={groupRef}
      orientation="horizontal"
      className="flex h-full w-full"
      /* Key off the layout the library just reported, not off this closure's
         `layoutKey`. During the frame where the right panel appears or leaves,
         the two disagree — and filing a two-panel map under the three-panel key
         means restoring it later throws "Invalid 3 panel layout". */
      onLayoutChanged={(layout) => {
        known.current[panelSetKey(Object.keys(layout))] = layout
      }}
      /* Widens the grab target without widening the 1px line it draws. Touch
         needs the bigger one; a mouse would feel it as a sloppy edge. */
      resizeTargetMinimumSize={{ coarse: 20, fine: 9 }}
    >
      {!autoHideSidebar && (
      <>
      <Panel
        id="sidebar"
        panelRef={sidebarRef}
        collapsible
        collapsedSize={`${RAIL_PX}px`}
        minSize="220px"
        maxSize="420px"
        defaultSize="268px"
        /* Opening the right panel takes its space from main, not from the nav.
           Without this the sidebar shrinks proportionally every time a task
           opens, which reads as the layout drifting. */
        groupResizeBehavior="preserve-pixel-size"
        /* Dragging the sidebar past its minimum collapses it to the rail, and
           that has to read back as intent or the rail's own toggle would still
           think it is expanded.
           Report a TRANSITION, never a disagreement with React. Comparing
           against `sidebarOpen` makes this fire whenever geometry has not yet
           caught up with a just-changed intent — and the right panel mounting
           re-lays out the group at exactly that moment, so an auto-collapse got
           read as "the user expanded it" and was pushed straight back open. */
        onResize={(size) => {
          const collapsed = size.inPixels <= RAIL_PX + 1
          if (collapsed !== wasCollapsed.current) {
            wasCollapsed.current = collapsed
            /* Ours: swallow it, React already believes this. Anyone else's —
               a drag past the minimum — is the user telling us something. */
            if (commanded.current === collapsed) commanded.current = null
            else onSidebarOpenChange(!collapsed)
          }
          if (!collapsed && !programmatic.current) latestPx.current = Math.round(size.inPixels)
        }}
        className="flex min-w-0"
      >
        {sidebar}
      </Panel>

      <ShellSeparator label="Resize sidebar" />
      </>
      )}

      <Panel id="main" minSize="380px" className="flex min-w-0 flex-col">
        {main}
      </Panel>

      {right && (
        <>
          <ShellSeparator label="Resize workspace" />
          <Panel
            id="right"
            panelRef={rightRef}
            collapsible
            collapsedSize="0px"
            minSize="360px"
            maxSize="72%"
            defaultSize="60%"
            onResize={(size) => {
              const collapsed = size.inPixels < 1
              if (collapsed === rightOpen) onRightOpenChange(!collapsed)
            }}
            className="flex min-w-0 flex-col"
          >
            {right}
          </Panel>
        </>
      )}
    </Group>

      {/* The drawer. A 10px strip at the very edge is the handle — wide enough
          to hit by throwing the pointer left, narrow enough that nothing in the
          conversation is shadowed by it. Focus opens it too, or the nav would be
          keyboard-unreachable the moment a task is open. */}
      {autoHideSidebar && (
        <>
          <div
            className="absolute inset-y-0 left-0 z-40 w-[10px]"
            onMouseEnter={() => setPeek(true)}
          />
          <div
            onMouseEnter={() => setPeek(true)}
            onMouseLeave={() => setPeek(false)}
            onFocusCapture={() => setPeek(true)}
            onBlurCapture={() => setPeek(false)}
            className="absolute inset-y-0 left-0 z-50 flex w-[var(--sidebar-w)] transition-transform duration-[var(--dur)] ease-[var(--ease)]"
            style={{
              background: 'var(--slab)',
              transform: peek ? 'none' : 'translateX(-100%)',
              boxShadow: peek ? 'var(--shadow-panel)' : 'none',
            }}
            /* Hidden means hidden: off-screen chrome must not be tabbable. */
            inert={peek ? undefined : true}
          >
            {sidebar}
          </div>
        </>
      )}
    </div>
  )
}

/* The library gives the separator role="separator" and the ARIA value props;
   this only dresses it. Colour is the only thing that moves — a separator that
   changes width on hover shifts the layout under the cursor you are aiming. */
function ShellSeparator({ label }: { label: string }) {
  return (
    <Separator
      aria-label={label}
      className="
        w-px shrink-0 bg-[var(--glass-line-soft)] outline-none
        transition-colors duration-[var(--dur)] ease-[var(--ease)]
        hover:bg-[var(--brand)]
        focus-visible:bg-[var(--focus-ring)]
        data-[state=dragging]:bg-[var(--brand)]
      "
    />
  )
}
