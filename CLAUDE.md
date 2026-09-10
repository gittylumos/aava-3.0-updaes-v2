# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

AAVA 3.0 — a working prototype of "The Experience Engine" (TEE): an agentic-assistant UI built as one
frame of five fixed zones (Sidebar, Conversation, Canvas, Toolbar, Watch), re-arranged per device by
folding or dissolving zones rather than by drawing new layouts. Everything is scripted playback on a
simulated clock (no backend, no live model) — it exists to be demoed end to end in a room. The full
architecture is documented in **`docs/Architecture.md`** (read this first for anything beyond a small,
local change) and **`docs/scenario-blueprint.md`** (the format for authoring a new scripted flow); this
file is the quick-start companion to both, not a replacement.

For *what AAVA 3.0 is as a product* — the backstory, the definition, the audience, the layout model at
a concept level, none of it tied to this codebase's implementation — see **`docs/Product-Context.md`**.
It's written to be portable outside this repo (dropped into any AI tool as context) and is the thing to
check a new idea against, not this file.

**Before adding or changing a scenario/flow, check `docs/DECISIONS.md`.** It's the log of why an
established pattern exists — usually because an earlier attempt shipped without it and had to be
retrofitted. It's short; read it, and add an entry when you make a decision of that same shape (a
pattern every flow must follow, a constraint that isn't obvious from the code alone).

**Before shipping a new UI element, screen, or flow, check it against `docs/UX-Principles.md`.** Six
product-level principles from the PI planning deck (Zero Ceremony, Eager to Collaborate, Meet People
Where They Are, Work Finds You, Trust is the Currency, Depth on Demand), each grounded in how it
already shows up in this codebase, plus a six-question pass to run before calling something done. Where
the honest answer is "no, and that's deliberate," write that down in `docs/DECISIONS.md` rather than
leaving it unstated.

**For the human-AI *interaction* itself — how a run tells you what it's doing, when it stops, how it
hands control back — use `docs/AI-Interaction-Checklist.md`.** It folds established research (Microsoft
HAX's 18 guidelines, Google PAIR, Apple's generative-AI HIG, the 2026 workplace-agent framework)
together with AAVA's own principles into a phase-by-phase checklist, plus a register documenting how
each existing scenario stacks up (and the cross-cutting gaps). Walk it when crafting a scenario, and add
the new scenario to its coverage register.

Two kinds of flow live in the app:
- **Task flows** (`src/scenarios/t1.ts`, `t7.ts`) — a Jira-style task opened from the board. T1 is a
  finished run parked on a review gate; T7 is a run that *stopped* at a validator gate.
- **Object flows** (`src/prd/*`) — started from the composer by intent-matching what the user typed
  (`prd/data.ts`'s `isPrdIntent`/`isBacklogIntent`/`isInsightIntent`/`isReportIntent`): a PRD draft, a
  PRD-to-backlog decomposition (Epics → Features → Stories → Jira), a lighter product-analytics
  investigation, and a structured, gated analytics-triage-report run. Both kinds resolve through the
  same reducer/effect engine (below); only how they're entered differs.

## Commands

All commands run from `app/` — there is no root `package.json` (the repo root only holds reference
docs/assets and the Vercel project link).

```bash
cd app
npm run dev       # vite dev server
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm test          # vitest run
```

Single test file: `npx vitest run src/scenarios/t1.test.ts`
Single test by name: `npx vitest run -t "routes the demo phrases"`

Vitest's `include` in `vite.config.ts` is `src/**/*.test.ts` (not `.tsx`) — every test today is
pure-logic (a scenario/flow's beats, the reducer, intent matchers), no component rendering. Keep new
tests to that shape unless you also add a DOM test environment.

### Deploy

Production is a Vercel project (`aava-hoffman`, Root Directory = `app`). The project link
(`.vercel/project.json`) is gitignored — a fresh checkout needs `vercel link` before `vercel build --prod
&& vercel deploy --prebuilt --prod` (run from the repo root) will target it.

## Architecture

Read `docs/Architecture.md` top-down if you're new to the codebase; jump to its per-zone sections
(§4–§8) if you're only touching one surface. The load-bearing pieces to know before making a change
anywhere in the app:

### One reducer, one effect interpreter, no router

`state/reducer.ts` is a single `useReducer` store (`AppState`/`Action` in `state/types.ts`).
`state/useJourney.ts` is the interpreter: it exposes `send`, `openTask`, `runBeat`, and a `play(effects)`
loop that schedules **Effects** on a real clock (`window.setTimeout`), so a scripted **beat** — an
ordered `Effect[]` — reads like a live conversation (streamed text holds up the next effect until it
finishes "typing", tool-call rows resolve one after another, `wait`/wait-free "prepared work" controls
pacing). Never add an imperative side effect elsewhere for something a beat should drive.

### The scenario/flow pattern — how a new flow is added

A task flow is a `Scenario` (`state/types.ts`): `prep` steps, `evidence`, `files`, `beats: Record<string,
Effect[]>`, a `router` for free-text matching, and `chips`. Register it in `scenarios/index.ts` — no
engine changes. An object flow follows the same shape but is entered by intent rather than a task card:
add an `isXIntent(text)` matcher in `prd/data.ts` (checked in the right order in `useJourney.ts`'s
`send` — a more specific intent, like the structured report ask, must be checked *before* a more general
one it could also match, like the plain analytics ask), an `xOpening()` + `X_BEATS` flow file, an
`xProgress(messages)` selector for the run-status dock (`RunStrip`), and — only if the flow needs
custom visuals — its own Canvas component wired into `App.tsx`'s canvas-host switch (`insight`/`report`
are the two examples to copy from: `prd/insightFlow.ts` + `InsightCanvas.tsx`, `prd/pmReportFlow.ts` +
`ReportCanvas.tsx`/`ReportGraph.tsx`).

**Ordering rule for every flow, task or object** (documented in `docs/scenario-blueprint.md` §3.4): a
step's parts render in this order — the explanation `say`, then the artifact/document card it produced,
then the `say` that carries the next question or gate. The artifact sits *between* the explanation and
the question, never before it.

### Runs, steps and human-in-the-loop gates

`playground.prepAt` is where a run is parked; a step with a `gate` halts there and that gate's beat is
replayed after every answer (`withGate`) until cleared. A **gate** (`decision`/`confirm` blocks in
`chat/Blocks.tsx`) is not just another message card — while live it visually replaces the composer
(`pinnedGate` in `ConversationView`), and clearing it advances `prepAt` one step at a time (never a
jump), each intermediate step going blue in the run dock (`chat/RunStrip.tsx`) with real delay. A gate
can also be cleared by typing an approval — `useJourney.ts`'s `acceptBeatAt` resolves *which* gate from
where the run is parked, so approval words never appear in the scenario's own router.

### The Canvas is generated at runtime, in one of three shapes

The right panel (Zone 3) takes its content from `App.tsx`'s `right={…}`, keyed off which object/task is
active and `canvasMode`: the tabbed workspace (`playground/TabWorkspace.tsx`, task flows — Code/
Preview/Tests/Diff/Evidence), the document Canvas (`prd/DocumentCanvas.tsx`, PRD/backlog documents —
Preview/Code, Share/Download/History, inline comments via the CSS Custom Highlight API), or a flow's own
custom Canvas (insight/report). The Execution-activity graph and "files in this session" list overlay
whichever Canvas is mounted as an opaque layer, so switching to them and back never disturbs the
underlying tab layout or scroll position.

### Timing model

Every duration resolves through `state/timing.ts`'s `T` constants — observed real-world latencies per
operation kind, scaled by one global `SPEED` dial so nothing exceeds ~5s live while the *ratios* between
operations stay truthful (a build still costs far more than a Jira fetch). Add a named constant to `T`
rather than hardcoding a new delay in a scenario or flow file.

### Theming, fonts, Monaco

- Theme is `data-theme="dark"|"light"` on `<html>` (`state/useTheme.ts`); all color values are CSS
  custom properties in `design/tokens.css`, including the per-zone `--zone-*-tint`/`--zone-*-accent`
  identities the architecture doc's zone table maps to.
- Fonts are bundled local packages (`@fontsource-variable/geist*`), not a CDN link.
- `monaco.ts` points `@monaco-editor/react`'s loader at the bundled `monaco-editor` package instead of
  its default CDN loader — this prototype is demoed without reliable network.
- `vite.config.ts` carries a small build-only plugin (`nonBlockingCss`) that rewrites the built
  stylesheet `<link>` into a preload-then-apply pattern; it does not run in dev (HMR needs the plain
  `<link>` there).
