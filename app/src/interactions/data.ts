/* The Interaction Library's metadata — one entry per pattern in the rail.
 * Grouped and ordered exactly as `docs/microinteractions.md` §3 (the catalogue
 * these previews stand in for), plus two patterns that shipped after that doc
 * was last extended: the capability-match shimmer and the HITL run gate. */

export type Principle = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7'

export interface PatternMeta {
  id: string
  group: string
  label: string
  blurb: string
  principles: Principle[]
  file: string
  mechanism: string
}

export const GROUPS = [
  'Agent presence',
  'Run status',
  'Decisions & gates',
  'Canvas & documents',
  'Feedback & ambient',
] as const

export const PATTERNS: PatternMeta[] = [
  // ── Agent presence — make the reasoning visible (P1) ──────────────────
  {
    id: 'thinking-dots',
    group: 'Agent presence',
    label: 'Thinking dots',
    blurb: 'Three dots pulse while AAVA composes, before any text exists to stream.',
    principles: ['P1'],
    file: 'src/components/chat/TypingDots.tsx',
    mechanism: 'Opacity keyframes .25 → 1 → .25 on a 1.2s ease-in-out loop, each dot delayed 0.16s from the last — the smallest possible "it\'s alive" tell.',
  },
  {
    id: 'streamed-text',
    group: 'Agent presence',
    label: 'Streamed text',
    blurb: 'Replies reveal word-by-word with a live caret — never fully-formed on arrival.',
    principles: ['P1', 'P6'],
    file: 'src/components/chat/StreamedText.tsx',
    mechanism: 'Per-word delay derives from the character rate, so long words take longer. A `finished` set guarantees each line streams once, ever — remounting a thread never re-types it.',
  },
  {
    id: 'tool-steps',
    group: 'Agent presence',
    label: 'Tool-step accordion',
    blurb: 'A run of tool calls resolving pending → running → done, auto-folding once finished.',
    principles: ['P1', 'P2'],
    file: 'src/components/chat/ToolSteps.tsx',
    mechanism: 'Running = a spinner ring (.7s linear); done = a green check with the result. With a title, the whole run is a collapsible accordion — open while working, auto-folds to "n/n" the instant it completes.',
  },
  {
    id: 'capability-shimmer',
    group: 'Agent presence',
    label: 'Capability-match shimmer',
    blurb: 'A single shimmering line while AAVA searches, then a card naming what it matched.',
    principles: ['P1'],
    file: "src/components/chat/Blocks.tsx (Capability)",
    mechanism: 'A text-clip gradient sweeps left on a 1.4s linear loop (background-position 0 → -200%) while searching; on match, it becomes a card with the capability name, what it maps to, and check-mark chips.',
  },
  {
    id: 'execution-graph',
    group: 'Agent presence',
    label: 'Execution-activity graph',
    blurb: 'The agent topology — state derived from the run, never randomised.',
    principles: ['P1', 'P5'],
    file: 'src/prd/AgentGraph.tsx',
    mechanism: 'Everything grey while planning; only the node genuinely running carries a pulsing stroke and a flowing edge; done nodes go green, a gate node reads REVIEW in amber, the rest read QUEUED.',
  },

  // ── Run status — always in view (P2) ───────────────────────────────────
  {
    id: 'run-dock',
    group: 'Run status',
    label: 'Task progress Dock',
    blurb: 'A capsule hanging from the header that morphs — not opens — into the full phase list.',
    principles: ['P2', 'P3', 'P5', 'P6'],
    file: 'src/components/chat/RunStrip.tsx',
    mechanism: 'The same shell springs its measured width/height downward (stiffness 320, damping 26) rather than revealing a separate panel. Pulsing dot: blue while drafting, amber while it waits on you; the label shimmers only in the waiting state.',
  },

  // ── Decisions & gates — human-in-the-loop (P3, P4) ─────────────────────
  {
    id: 'gate-inline',
    group: 'Decisions & gates',
    label: 'Gate → inline Cancel/Send',
    blurb: 'Choosing an option that needs a note replaces the two buttons in place.',
    principles: ['P3'],
    file: 'src/components/chat/Blocks.tsx (ButtonsGate)',
    mechanism: 'The two option buttons are replaced — same footprint — by a textarea + Cancel/Send. Cancel returns to the original buttons; Send records the note and retires the gate.',
  },
  {
    id: 'hitl-gate',
    group: 'Decisions & gates',
    label: 'HITL run gate',
    blurb: 'A human sign-off pauses the run — Comments, then Approve or Reject.',
    principles: ['P3', 'P4'],
    file: 'src/prd/AgentExecution.tsx (HitlCard)',
    mechanism: 'An amber card pauses the scripted run driver mid-execution; Approve/Reject resolves the pending step and the run continues from exactly where it paused.',
  },
  {
    id: 'plan-edit',
    group: 'Decisions & gates',
    label: 'Plan → Edit plan',
    blurb: 'The plan card\'s secondary action morphs into a textarea on the same card.',
    principles: ['P3'],
    file: 'src/components/chat/Blocks.tsx (Plan)',
    mechanism: 'No modal severs you from the plan — editing happens inline, on the same numbered-step card, and Send retires it into the conversation.',
  },
  {
    id: 'honest-afterstate',
    group: 'Decisions & gates',
    label: 'Honest after-state',
    blurb: '"Pushed" only if you actually pushed — "Skipped" if you chose not to.',
    principles: [],
    file: 'src/components/chat/Blocks.tsx (Sync)',
    mechanism: 'A push card offers a primary (push now) and secondary ("Proceed for now"). Once retired, the label truthfully reflects which one you picked — the transcript never lies about what happened.',
  },

  // ── Canvas & documents (P3, P5) ─────────────────────────────────────────
  {
    id: 'preview-code-pill',
    group: 'Canvas & documents',
    label: 'Preview/Code segmented pill',
    blurb: 'One control that reshapes — the inactive tab collapses to its icon alone.',
    principles: ['P3'],
    file: 'src/prd/DocumentCanvas.tsx (ViewTabs)',
    mechanism: 'A spring layout animation (stiffness 520, damping 40) resizes the pill; the inactive label glides to width:0 over 160ms — one object changing selection, not two buttons toggling.',
  },
  {
    id: 'inline-comments',
    group: 'Canvas & documents',
    label: 'Inline comments',
    blurb: 'A highlighted span with a numbered marker tied to its comment.',
    principles: ['P5'],
    file: 'src/prd/DocumentCanvas.tsx',
    mechanism: 'Painted via the CSS Custom Highlight API (::highlight(aava-comment)) — no DOM surgery on the document — with a numbered marker matching the entry in the changes tray, so note and passage are spatially unmistakable.',
  },
  {
    id: 'changes-tray',
    group: 'Canvas & documents',
    label: 'Changes tray',
    blurb: 'Pending edits stack above the composer; Apply commits them as a batch.',
    principles: ['P2'],
    file: 'src/components/chat/ConversationView.tsx (ChangesTray)',
    mechanism: 'Edits are staged and reviewable before they act, not fired one at a time. Apply runs the same tool-step accordion pattern while it merges each edit, then lifts the whole stack into the conversation as one turn and clears the tray.',
  },
  {
    id: 'match-card',
    group: 'Canvas & documents',
    label: 'Match card',
    blurb: 'A ranked process match — fit % as the hero, workflow steps, adoption metrics.',
    principles: ['P1', 'P5'],
    file: 'src/components/chat/Blocks.tsx (MatchCard)',
    mechanism: 'The fit percentage is the hero number with a meter bar under it; the workflow renders as step chips; runs/teams/version share one line — three-across in a compact grid, so a full match set reads in one viewport.',
  },
  {
    id: 'split-tabs',
    group: 'Canvas & documents',
    label: 'Split-tab workspace',
    blurb: 'Drag a tab to the edge and it splits into its own pane — a real docking workspace, not a fixed layout.',
    principles: ['P3'],
    file: 'src/components/playground/TabWorkspace.tsx',
    mechanism: 'A flexlayout-react Model backs the panel; dragging a tab to an edge calls Actions.addNode(..., DockLocation.RIGHT) to dock it into a new tabset. The drag itself renders FlexLayout\'s own drag-rect (brand 18% fill) and edge-rect (brand 40% tint) tokens from flexlayout-theme.css — bold on arrival, then a quieter hold. Persisted to localStorage, so a user\'s arrangement survives a reload.',
  },

  // ── Feedback & ambient ──────────────────────────────────────────────────
  {
    id: 'chips',
    group: 'Feedback & ambient',
    label: 'Suggestion chips',
    blurb: 'Chips fade-and-rise in with a 40ms stagger, not a block snapping in.',
    principles: ['P7'],
    file: 'src/components/chat/Chips.tsx',
    mechanism: 'Each chip animates opacity 0→1, y 4→0 over 180ms (easeOut), delayed i × 40ms from the last — reads as options arriving for you.',
  },
  {
    id: 'toast',
    group: 'Feedback & ambient',
    label: 'Toast',
    blurb: 'Transient confirmation that announces itself, then leaves without ceremony.',
    principles: ['P6', 'P7'],
    file: 'src/components/overlays/Toast.tsx',
    mechanism: 'Slides y:10→0 on enter, drops to y:8 on exit, via AnimatePresence. role="status" aria-live="polite" so assistive tech hears it without a focus change.',
  },
  {
    id: 'tooltip',
    group: 'Feedback & ambient',
    label: 'Tooltip',
    blurb: 'One tooltip for the whole app — a blur-and-scale reveal on every icon-only control.',
    principles: ['P7'],
    file: 'src/components/chrome/Tooltip.tsx',
    mechanism: 'The real component, live — it auto-triggers here so you see it without hovering, but it still responds to a real hover too. Opens with a 180ms scale(.9→1) + blur(4px→0) via Radix state, closes the same way in 140ms; the arrow tracks Radix\'s own collision-aware placement.',
  },
  {
    id: 'press-feedback',
    group: 'Feedback & ambient',
    label: 'Press feedback',
    blurb: 'The universal "I felt that" — one class, on every tactile control.',
    principles: ['P7'],
    file: 'src/index.css (.press)',
    mechanism: 'scale(0.96) on :active, transform-only so it never fights layout, applied to every card, chip, icon button and send control in the app.',
  },
  {
    id: 'ambient-field',
    group: 'Feedback & ambient',
    label: 'Ambient field',
    blurb: 'A slow, low-contrast background drift — life without distraction.',
    principles: ['P6', 'P7'],
    file: 'src/components/ambient/AmbientField.tsx',
    mechanism: 'Large, soft radial lobes drift on a multi-minute loop, opacity capped low enough that it never competes with content; honours prefers-reduced-motion by freezing in place.',
  },
]
