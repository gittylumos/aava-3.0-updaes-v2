/* Layout switches, so a concept can be turned off without deleting it. */
export const FLAGS = {
  /* Two-sidebar layout (concept: AAVA-Web-demo): an icon nav rail plus a
     session list grouped by what each session needs, and a Codex-style empty
     home. false restores the original sidebar (expanded at start) and the three-card
     home. */
  SESSION_LIST_LAYOUT: true,
  /* A scenario run reads as a numbered step timeline in the conversation
     (all steps folded, the step it stopped at open) instead of narration, and
     the progress dock in the header goes. false restores the narration. */
  RUN_TIMELINE: true,
} as const
