# AAVA 3.0 Clickable Prototype (Persona 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hardcoded React prototype of the AAVA 3.0 Persona 1 journey (Dev · "Add feedback form to AAVA") that runs as one screen with three arrangements and a fully scripted, evidence-backed task execution.

**Architecture:** One mounted screen, one reducer, no router. Arrangements (`start` / `conversation` / `split`) swap the middle region while rail, topbar and composer stay mounted. The scripted journey is **data**: a `Scenario` object holds prep steps, evidence, files, tests, diff and beats, where a beat is a list of `Effect` objects interpreted by a scenario-agnostic reducer. Adding Personas 2 & 3 later means adding `scenarios/t2.ts` with no engine changes.

**Tech Stack:** Vite · React 19 · TypeScript · Tailwind CSS v4 · Radix UI primitives · Motion (framer-motion) · `@fontsource-variable/geist` + `geist-mono` · Vitest

## Global Constraints

Copied verbatim from `docs/superpowers/specs/2026-08-03-aava-3-prototype-design.md`. **Every task's requirements implicitly include this section.**

- **One screen.** No routes, no page reloads, nothing navigates away, nothing opens in a new page.
- **Three arrangements, not three pages:** `start` → `conversation` → `split`. The user moves between them in place.
- **Rail, header and composer are present in all three and never move or re-render.** They are mounted once, outside the arrangement-switching region.
- **Chat always holds the left.** Task cards, playground and artifacts always come in on the right. This never flips.
- **The recommended card is signalled by an animated aurora ring and nothing else.** Same size as the others. No badge, no star, no label, no different background.
- **Replies are never instant.** Typing indicator first, ~620ms, then text.
- **Only user messages get a container.** AAVA replies are plain text, no bubble.
- **One task executes at a time.** Mid-task switching is blocked with a toast, and a *disabled* "Open as a separate thread" affordance is shown.
- **Enter sends; Shift+Enter is a line break.**
- **Aurora colours (`#FF7AC6` / `#A78BFA` / `#5B9DFF`) appear only in:** the recommended ring, the logo mark, the send button. Nowhere else.
- **Semantic status colours are separate from aurora:** `#4ADE80` wip · `#FBBF24` clarify · `#8B98A8` pending · `#5B9DFF` done.
- **Glass for chrome only** (`rgba(255,255,255,.045)`); **opaque slab** (`#100F1A` / `#181626`) under all dense content — playground, evidence, code, tests, diff.
- **No font CDN.** Fonts come from `@fontsource-variable` packages bundled by Vite.
- **No API calls, no backend, no persistence, no auth, no router.**
- **`prefers-reduced-motion: reduce` collapses every delay to 0** and stops the ambient drift.
- Desktop only, 1280px and up.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/main.tsx` | React root. |
| `src/App.tsx` | The one screen. Mounts chrome once; swaps the middle region by arrangement. |
| `src/state/types.ts` | `AppState`, `Action`, `Effect`, `Scenario`, `Task`, `Message` and friends. No logic. |
| `src/state/reducer.ts` | Pure reducer: arrangement transitions + effect interpreter. No timing, no React. |
| `src/state/useJourney.ts` | Hook. Owns the effect queue and all timing (typing pause, terminal line delays, `wait`). |
| `src/scenarios/index.ts` | Scenario registry, keyed by task id. |
| `src/scenarios/t1.ts` | All T1 data: task, 10 prep steps, 10 evidence blocks, files, specs, diff, beats, router, chips. |
| `src/components/chrome/Rail.tsx` | 70px left rail. Logo, Search, Threads, Pinned, avatar. |
| `src/components/chrome/Topbar.tsx` | Brand, notifications, tasks button. |
| `src/components/chrome/Composer.tsx` | Textarea, autogrow, Think Harder, dictate, send. Never moves. |
| `src/components/start/Hero.tsx` | Greeting + contextual subline. |
| `src/components/start/TaskCard.tsx` | One task card. Carries `layoutId` for the flight to the rail. |
| `src/components/start/AuroraRing.tsx` | The rotating conic-gradient ring + bloom. |
| `src/components/chat/Thread.tsx` | Message list, autoscroll. |
| `src/components/chat/Message.tsx` | User bubble vs AAVA plain text; renders `BlockSpec`. |
| `src/components/chat/TypingDots.tsx` | Three-dot indicator. |
| `src/components/chat/PrepList.tsx` | 10 collapsible prep rows + "Open evidence". |
| `src/components/chat/Blocks.tsx` | `coverage`, `confirm`, `links` block renderers. |
| `src/components/chat/Chips.tsx` | Suggested reply chips. |
| `src/components/chat/TaskRail.tsx` | Collapsible right-hand task list (conversation arrangement). |
| `src/components/playground/Playground.tsx` | Slab panel: header, run state, tabs, body switch. |
| `src/components/playground/Evidence.tsx` | Keyed evidence blocks + focus highlight + Figma lightbox. |
| `src/components/playground/Preview.tsx` | Browser chrome + `FeedbackApp` + `Terminal`. |
| `src/components/playground/FeedbackApp.tsx` | The genuinely interactive mock feedback form. |
| `src/components/playground/Terminal.tsx` | Appended terminal lines. |
| `src/components/playground/Code.tsx` | File switcher + highlighted body. |
| `src/components/playground/Tests.tsx` | 11 specs + coverage bar. |
| `src/components/playground/Diff.tsx` | Two repo diff groups. |
| `src/components/overlays/TaskWindow.tsx` | Kanban dialog + mid-task blocked notice. |
| `src/components/overlays/Threads.tsx` | Resumable threads dialog. |
| `src/components/overlays/Toast.tsx` | Transient status line. |
| `src/components/ambient/AmbientField.tsx` | Three drifting aurora lobes + pointer parallax. |
| `src/design/tokens.css` | Colour, type, spacing, radii, easing custom properties. |
| `src/design/fonts.css` | `@fontsource-variable` imports. |
| `src/state/journey.test.ts` | The single end-to-end journey test. |

---

## Task 1: Scaffold, design tokens, ambient field

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`
- Create: `src/main.tsx`, `src/App.tsx`, `src/design/tokens.css`, `src/design/fonts.css`, `src/index.css`
- Create: `src/components/ambient/AmbientField.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `<AmbientField />` (no props). CSS custom properties listed in `tokens.css` below, consumed by every later task.

- [ ] **Step 1: Initialise the repo and scaffold**

This folder is not yet a git repository.

```bash
cd /Users/narahari.nalluri/Desktop/AAVA_3.0
git init
npm create vite@latest app -- --template react-ts
cd app
npm install
npm install motion @fontsource-variable/geist @fontsource-variable/geist-mono
npm install -D tailwindcss @tailwindcss/vite vitest
npm install @radix-ui/react-tabs @radix-ui/react-collapsible @radix-ui/react-dialog @radix-ui/react-scroll-area @radix-ui/react-tooltip
```

- [ ] **Step 2: Write `.gitignore` at the repo root**

```gitignore
node_modules/
app/node_modules/
app/dist/
.superpowers/
.DS_Store
```

- [ ] **Step 3: Wire Tailwind into Vite**

`app/vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
```

Add to `app/package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 4: Write `src/design/fonts.css`**

```css
@import '@fontsource-variable/geist';
@import '@fontsource-variable/geist-mono';
```

- [ ] **Step 5: Write `src/design/tokens.css`**

```css
@property --aurora-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

:root {
  --ground: #06070B;
  --slab: #100F1A;
  --slab-raised: #181626;
  --glass: rgba(255, 255, 255, .045);
  --glass-strong: rgba(255, 255, 255, .07);
  --glass-line: rgba(255, 255, 255, .075);
  --glass-line-soft: rgba(255, 255, 255, .055);

  --text: #F3F1FA;
  --text-dim: #DEDBEC;
  --muted: #9590AC;
  --muted-deep: #8B86A3;

  --aurora-1: #FF7AC6;
  --aurora-2: #A78BFA;
  --aurora-3: #5B9DFF;

  --ok: #4ADE80;
  --warn: #FBBF24;
  --pending: #8B98A8;
  --done: #5B9DFF;
  --danger: #FF6B6B;

  --r-sm: 8px;  --r-md: 12px;  --r-lg: 16px;  --r-xl: 22px;  --r-pill: 999px;

  --ease: cubic-bezier(.22, .61, .36, 1);
  --spring-fast: 180ms;
  --spring-slow: 340ms;
  --layout: 460ms;

  --rail-w: 70px;
  --font-ui: 'Geist Variable', -apple-system, system-ui, sans-serif;
  --font-mono: 'Geist Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
```

- [ ] **Step 6: Write `src/index.css`**

```css
@import 'tailwindcss';
@import './design/fonts.css';
@import './design/tokens.css';

html, body, #root { height: 100%; }

body {
  margin: 0;
  background: var(--ground);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: -.011em;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

button, textarea, input { font: inherit; color: inherit; }
button { background: none; border: 0; padding: 0; cursor: pointer; }

:focus-visible {
  outline: 2px solid var(--aurora-2);
  outline-offset: 3px;
  border-radius: var(--r-sm);
}

.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
```

- [ ] **Step 7: Write `src/components/ambient/AmbientField.tsx`**

```tsx
import { useEffect, useRef } from 'react'

/** Three drifting aurora lobes behind everything. Pointer parallax, reduced-motion aware. */
export function AmbientField() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      const x = e.clientX / window.innerWidth - 0.5
      const y = e.clientY / window.innerHeight - 0.5
      frame = requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.setProperty('--px', `${x * 26}px`)
          ref.current.style.setProperty('--py', `${y * 26}px`)
        }
        frame = 0
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        translate: 'var(--px, 0px) var(--py, 0px)',
        transition: 'translate 600ms var(--ease)',
        background: `
          radial-gradient(56% 44% at 12% 6%, rgba(91,157,255,.20), transparent 66%),
          radial-gradient(50% 46% at 96% 78%, rgba(167,139,250,.19), transparent 64%),
          radial-gradient(36% 32% at 54% 110%, rgba(255,122,198,.12), transparent 68%)
        `,
      }}
    />
  )
}
```

- [ ] **Step 8: Write a placeholder `src/App.tsx` and `src/main.tsx`**

```tsx
// src/App.tsx
import { AmbientField } from './components/ambient/AmbientField'

export default function App() {
  return (
    <>
      <AmbientField />
      <div className="relative z-10 grid h-full place-items-center">
        <p style={{ color: 'var(--muted)' }}>AAVA 3.0</p>
      </div>
    </>
  )
}
```

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
```

- [ ] **Step 9: Verify it runs**

Run: `npm run dev` and open the printed URL.
Expected: near-black page with three soft coloured lobes that shift slightly as you move the pointer; "AAVA 3.0" centred in muted violet-grey.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite/React/Tailwind prototype with Ambient design tokens"
```

---

## Task 2: State model and reducer

**Files:**
- Create: `app/src/state/types.ts`
- Create: `app/src/state/reducer.ts`
- Test: `app/src/state/reducer.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: everything below is used by every later task —
  `initialState: AppState`, `reducer(state: AppState, action: Action): AppState`,
  `applyEffects(state: AppState, effects: Effect[]): AppState`,
  and all types in `types.ts`.

- [ ] **Step 1: Write `src/state/types.ts`**

```ts
export type Arrangement = 'start' | 'conversation' | 'split'
export type TaskStatus = 'wip' | 'clarify' | 'pending' | 'done'
export type TabId = 'evidence' | 'preview' | 'code' | 'tests' | 'diff'
export type RunKind = 'prep' | 'live' | 'shipped'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  est: string
  priority: 'P1' | 'P2' | 'P3'
  dep: string
  recommended?: boolean
}

export interface Thread {
  kind: 'chat' | 'task'
  title: string
  when: string
}

export interface CoverageGroup {
  title: string
  items: string[]
  tone?: 'assumed'
}

export interface ConfirmRow {
  repo: string
  branch: string
  what: string
}

export type BlockSpec =
  | { kind: 'prep' }
  | { kind: 'coverage'; groups: CoverageGroup[] }
  | { kind: 'confirm'; rows: ConfirmRow[]; acceptLabel: string; cancelLabel: string; acceptBeat: string }
  | { kind: 'links'; links: { label: string }[] }

export interface Message {
  id: string
  from: 'user' | 'aava'
  lines: string[]
  block?: BlockSpec
  typing?: boolean
  /** Set false once the confirm block has been accepted or dismissed. */
  live?: boolean
}

export type TerminalTone = 'cmd' | 'dim' | 'ok'
export interface TerminalLine { tone: TerminalTone; text: string; delay: number }

export type Effect =
  | { type: 'say'; lines: string[]; block?: BlockSpec }
  | { type: 'showTab'; tab: TabId }
  | { type: 'enableTab'; tab: TabId; badge?: number }
  | { type: 'runState'; kind: RunKind; label: string }
  | { type: 'terminal'; lines: TerminalLine[] }
  | { type: 'codeVersion'; file: string; version: number }
  | { type: 'previewVariant'; variant: string }
  | { type: 'taskStatus'; taskId: string; status: TaskStatus }
  | { type: 'chips'; stage: string }
  | { type: 'wait'; ms: number }

export interface PrepStep {
  key: string
  label: string
  result: string
  detail: string
}

export interface EvidenceBlock {
  name: string
  source: string
  /** Rendered by Evidence.tsx. `figma` gets the SVG frame treatment. */
  body: { kind: 'kv'; pairs: [string, string][] }
      | { kind: 'text'; text: string }
      | { kind: 'columns'; found: string[]; missing: string[]; lead: string }
      | { kind: 'figma'; caption: string }
}

export interface DiffGroup {
  repo: string
  branch: string
  files: string[]
  lines?: { tone: 'ctx' | 'del' | 'add'; text: string }[]
}

export interface Chip { label: string; sends: string }

export interface Scenario {
  task: Task
  prep: PrepStep[]
  evidence: Record<string, EvidenceBlock>
  files: Record<string, { versions: string[] }>
  fileOrder: string[]
  tests: { specs: string[]; coveragePct: number; gatePct: number }
  diff: DiffGroup[]
  beats: Record<string, Effect[]>
  router: { match: RegExp; beat: string }[]
  chips: Record<string, Chip[]>
  fallback: string[]
}

export interface PlaygroundState {
  taskId: string | null
  activeTab: TabId
  enabledTabs: TabId[]
  runState: { kind: RunKind; label: string }
  focusedEvidence: string | null
  fileVersions: Record<string, number>
  activeFile: string | null
  terminal: TerminalLine[]
  diffBadge: number | null
  previewVariant: string
}

export interface AppState {
  arrangement: Arrangement
  activeTaskId: string | null
  tasks: Task[]
  messages: Message[]
  threads: Thread[]
  playground: PlaygroundState
  toast: string | null
  overlay: 'none' | 'tasks' | 'threads'
  chipStage: string | null
  thinkHarder: boolean
}

export type Action =
  | { type: 'GO_HOME' }
  | { type: 'USER_SAY'; text: string }
  | { type: 'TYPING' }
  | { type: 'OPEN_TASK'; taskId: string; scenario: Scenario | null }
  | { type: 'CLOSE_PLAYGROUND' }
  | { type: 'APPLY'; effect: Effect }
  | { type: 'SET_TAB'; tab: TabId }
  | { type: 'SET_FILE'; file: string }
  | { type: 'FOCUS_EVIDENCE'; key: string }
  | { type: 'DISMISS_BLOCK'; messageId: string }
  | { type: 'OVERLAY'; overlay: 'none' | 'tasks' | 'threads' }
  | { type: 'TOAST'; text: string | null }
  | { type: 'TOGGLE_THINK_HARDER' }
```

- [ ] **Step 2: Write the failing test `src/state/reducer.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { initialState, reducer, applyEffects } from './reducer'
import type { Effect } from './types'

describe('reducer', () => {
  it('moves from start to conversation when the user sends a message', () => {
    const s = reducer(initialState, { type: 'USER_SAY', text: 'hello' })
    expect(s.arrangement).toBe('conversation')
    expect(s.messages).toHaveLength(1)
    expect(s.messages[0]).toMatchObject({ from: 'user', lines: ['hello'] })
  })

  it('replaces the trailing typing indicator when AAVA speaks', () => {
    let s = reducer(initialState, { type: 'TYPING' })
    expect(s.messages.at(-1)?.typing).toBe(true)
    s = applyEffects(s, [{ type: 'say', lines: ['Done.'] }])
    expect(s.messages).toHaveLength(1)
    expect(s.messages[0]).toMatchObject({ from: 'aava', lines: ['Done.'], typing: false })
  })

  it('enables a tab with a badge without switching to it', () => {
    const effects: Effect[] = [{ type: 'enableTab', tab: 'diff', badge: 1 }]
    const s = applyEffects(initialState, effects)
    expect(s.playground.enabledTabs).toContain('diff')
    expect(s.playground.diffBadge).toBe(1)
    expect(s.playground.activeTab).toBe('evidence')
  })

  it('appends terminal lines rather than replacing them', () => {
    let s = applyEffects(initialState, [
      { type: 'terminal', lines: [{ tone: 'cmd', text: '$ npm run start', delay: 0 }] },
    ])
    s = applyEffects(s, [
      { type: 'terminal', lines: [{ tone: 'ok', text: '✓ Compiled successfully.', delay: 0 }] },
    ])
    expect(s.playground.terminal.map((l) => l.text)).toEqual([
      '$ npm run start',
      '✓ Compiled successfully.',
    ])
  })

  it('blocks opening a second task while one is running', () => {
    const running = { ...initialState, arrangement: 'split' as const, activeTaskId: 'T1' }
    const s = reducer(running, { type: 'OPEN_TASK', taskId: 'T3', scenario: null })
    expect(s.activeTaskId).toBe('T1')
    expect(s.toast).toMatch(/one task/i)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './reducer'`.

- [ ] **Step 4: Write `src/state/reducer.ts`**

```ts
import type { Action, AppState, Effect, PlaygroundState, Task } from './types'

export const TASKS: Task[] = [
  { id: 'T1', title: 'Add feedback form to AAVA',                     status: 'wip',     est: '2 hrs',   priority: 'P1', dep: 'None',               recommended: true },
  { id: 'T2', title: 'Create PRD for Rate Limiting for Engineers',    status: 'clarify', est: '1.5 hrs', priority: 'P2', dep: 'Platform team' },
  { id: 'T3', title: 'Migrate data from MySQL to MongoDB (NoSQL)',    status: 'pending', est: '3 hrs',   priority: 'P2', dep: 'Maintenance window' },
  { id: 'T4', title: 'Instrument AAVA Edge telemetry',                status: 'wip',     est: '4 hrs',   priority: 'P3', dep: 'None' },
  { id: 'T5', title: 'Deprecate the legacy artifact store',           status: 'done',    est: '—',       priority: 'P3', dep: 'None' },
  { id: 'T6', title: 'Write the Experience Studio migration runbook', status: 'done',    est: '—',       priority: 'P3', dep: 'None' },
]

export const STATUS_LABELS: Record<Task['status'], string> = {
  wip: 'Partially done',
  clarify: 'Awaiting clarifications',
  pending: 'Pending',
  done: 'Done',
}

const emptyPlayground: PlaygroundState = {
  taskId: null,
  activeTab: 'evidence',
  enabledTabs: ['evidence', 'code', 'tests'],
  runState: { kind: 'prep', label: 'Prep ready' },
  focusedEvidence: null,
  fileVersions: {},
  activeFile: null,
  terminal: [],
  diffBadge: null,
  previewVariant: 'default',
}

export const initialState: AppState = {
  arrangement: 'start',
  activeTaskId: null,
  tasks: TASKS,
  messages: [],
  threads: [
    { kind: 'chat', title: 'Sprint scope questions', when: 'Yesterday' },
    { kind: 'task', title: 'T4 · Instrument AAVA Edge telemetry', when: '2 days ago' },
  ],
  playground: emptyPlayground,
  toast: null,
  overlay: 'none',
  chipStage: null,
  thinkHarder: false,
}

let seq = 0
const nextId = () => `m${++seq}`
/** Test-only: keeps message ids deterministic across test cases. */
export const __resetIds = () => { seq = 0 }

export function applyEffect(state: AppState, effect: Effect): AppState {
  const pg = state.playground

  switch (effect.type) {
    case 'wait':
      return state

    case 'say': {
      const trailing = state.messages.at(-1)
      const said = {
        id: trailing?.typing ? trailing.id : nextId(),
        from: 'aava' as const,
        lines: effect.lines,
        block: effect.block,
        typing: false,
        live: true,
      }
      const messages = trailing?.typing
        ? [...state.messages.slice(0, -1), said]
        : [...state.messages, said]
      return { ...state, messages }
    }

    case 'showTab':
      return {
        ...state,
        playground: {
          ...pg,
          activeTab: effect.tab,
          enabledTabs: pg.enabledTabs.includes(effect.tab)
            ? pg.enabledTabs
            : [...pg.enabledTabs, effect.tab],
          diffBadge: effect.tab === 'diff' ? null : pg.diffBadge,
        },
      }

    case 'enableTab':
      return {
        ...state,
        playground: {
          ...pg,
          enabledTabs: pg.enabledTabs.includes(effect.tab)
            ? pg.enabledTabs
            : [...pg.enabledTabs, effect.tab],
          diffBadge: effect.tab === 'diff' ? effect.badge ?? null : pg.diffBadge,
        },
      }

    case 'runState':
      return { ...state, playground: { ...pg, runState: { kind: effect.kind, label: effect.label } } }

    case 'terminal':
      return { ...state, playground: { ...pg, terminal: [...pg.terminal, ...effect.lines] } }

    case 'codeVersion':
      return {
        ...state,
        playground: {
          ...pg,
          activeFile: effect.file,
          fileVersions: { ...pg.fileVersions, [effect.file]: effect.version },
        },
      }

    case 'previewVariant':
      return { ...state, playground: { ...pg, previewVariant: effect.variant } }

    case 'taskStatus':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === effect.taskId ? { ...t, status: effect.status } : t,
        ),
      }

    case 'chips':
      return { ...state, chipStage: effect.stage }
  }
}

export function applyEffects(state: AppState, effects: Effect[]): AppState {
  return effects.reduce(applyEffect, state)
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'GO_HOME':
      return {
        ...initialState,
        tasks: state.tasks,
        threads: state.threads,
      }

    case 'USER_SAY':
      return {
        ...state,
        arrangement: state.arrangement === 'start' ? 'conversation' : state.arrangement,
        chipStage: null,
        messages: [
          ...state.messages,
          { id: nextId(), from: 'user', lines: [action.text], typing: false },
        ],
      }

    case 'TYPING':
      return {
        ...state,
        messages: [...state.messages, { id: nextId(), from: 'aava', lines: [], typing: true }],
      }

    case 'OPEN_TASK': {
      if (state.arrangement === 'split' && state.activeTaskId) {
        return { ...state, toast: 'One task runs at a time. Close the playground to start another.' }
      }
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task) return state
      return {
        ...state,
        arrangement: 'split',
        activeTaskId: task.id,
        overlay: 'none',
        tasks: state.tasks.map((t) =>
          t.id === task.id && t.status !== 'done' ? { ...t, status: 'wip' } : t,
        ),
        threads: [
          { kind: 'task', title: `${task.id} · ${task.title}`, when: 'Just now' },
          ...state.threads,
        ],
        messages: [
          ...state.messages,
          { id: nextId(), from: 'user', lines: [`Let's work on: ${task.title}`], typing: false },
        ],
        playground: {
          ...emptyPlayground,
          taskId: task.id,
          activeFile: action.scenario?.fileOrder[0] ?? null,
        },
      }
    }

    case 'CLOSE_PLAYGROUND':
      return { ...state, arrangement: 'conversation', activeTaskId: null, playground: emptyPlayground }

    case 'APPLY':
      return applyEffect(state, action.effect)

    case 'SET_TAB':
      return {
        ...state,
        playground: {
          ...state.playground,
          activeTab: action.tab,
          diffBadge: action.tab === 'diff' ? null : state.playground.diffBadge,
        },
      }

    case 'SET_FILE':
      return { ...state, playground: { ...state.playground, activeFile: action.file } }

    case 'FOCUS_EVIDENCE':
      return {
        ...state,
        playground: { ...state.playground, activeTab: 'evidence', focusedEvidence: action.key },
      }

    case 'DISMISS_BLOCK':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.messageId ? { ...m, live: false } : m,
        ),
      }

    case 'OVERLAY':
      return { ...state, overlay: action.overlay }

    case 'TOAST':
      return { ...state, toast: action.text }

    case 'TOGGLE_THINK_HARDER':
      return { ...state, thinkHarder: !state.thinkHarder }
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add app/src/state
git commit -m "feat: add app state model, reducer and effect interpreter"
```

---

## Task 3: The T1 scenario data

**Files:**
- Create: `app/src/scenarios/t1.ts`
- Create: `app/src/scenarios/index.ts`
- Test: `app/src/scenarios/t1.test.ts`

**Interfaces:**
- Consumes: `Scenario`, `Effect`, `PrepStep`, `EvidenceBlock`, `DiffGroup` from `src/state/types.ts`.
- Produces: `t1: Scenario`; `getScenario(taskId: string): Scenario | null`; `routeBeat(scenario: Scenario, text: string): string | null`.

- [ ] **Step 1: Write the failing test `src/scenarios/t1.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { t1 } from './t1'
import { getScenario, routeBeat } from './index'

describe('t1 scenario', () => {
  it('has ten prep steps, each with a matching evidence block', () => {
    expect(t1.prep).toHaveLength(10)
    for (const step of t1.prep) {
      expect(t1.evidence[step.key], `evidence missing for ${step.key}`).toBeDefined()
    }
  })

  it('routes the demo phrases to the right beats', () => {
    expect(routeBeat(t1, 'run it')).toBe('run')
    expect(routeBeat(t1, 'show me the output')).toBe('run')
    expect(routeBeat(t1, "what's not covered?")).toBe('coverage')
    expect(routeBeat(t1, 'move Submit below the comment')).toBe('move')
    expect(routeBeat(t1, 'raise the PRs')).toBe('ship')
    expect(routeBeat(t1, 'what is the weather')).toBeNull()
  })

  it('every chip sends text that routes to a beat', () => {
    for (const chips of Object.values(t1.chips)) {
      for (const chip of chips) {
        expect(routeBeat(t1, chip.sends), `chip "${chip.label}" routes nowhere`).not.toBeNull()
      }
    }
  })

  it('has two versions of the file whose Submit button moves', () => {
    expect(t1.files['feedback-form.component.html'].versions).toHaveLength(2)
  })

  it('is registered under its task id', () => {
    expect(getScenario('T1')).toBe(t1)
    expect(getScenario('T3')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './t1'`.

- [ ] **Step 3: Write `src/scenarios/t1.ts`**

```ts
import type { Scenario } from '../state/types'

const submitAbove = `<form [formGroup]="form" (ngSubmit)="submit()">
  <h3>How was your experience?</h3>

  <play-button type="submit">Submit</play-button>

  <play-rating-scale formControlName="rating"></play-rating-scale>

  <play-form-field label="Comment">
    <textarea formControlName="comment" maxlength="500"></textarea>
    <play-character-counter [max]="500"></play-character-counter>
  </play-form-field>
</form>`

const submitBelow = `<form [formGroup]="form" (ngSubmit)="submit()">
  <h3>How was your experience?</h3>

  <play-rating-scale formControlName="rating"></play-rating-scale>

  <play-form-field label="Comment">
    <textarea formControlName="comment" maxlength="500"></textarea>
    <play-character-counter [max]="500"></play-character-counter>
  </play-form-field>

@@<play-button type="submit">Submit</play-button>@@
</form>`

const componentTs = `@Component({
  selector: 'app-feedback-form',
  templateUrl: './feedback-form.component.html'
})
export class FeedbackFormComponent {
  form = this.fb.group({
    rating:  [null, Validators.required],
    comment: ['', [Validators.required, Validators.maxLength(500)]]
  });

  submit() {
    if (this.form.invalid) return;
    this.api.send(this.form.value).subscribe(() => this.form.reset());
  }
}`

const serviceTs = `@Injectable({ providedIn: 'root' })
export class FeedbackService {
  send(payload: Feedback) {
    return this.http.post<FeedbackResponse>('/api/v1/feedback', payload);
  }
}`

export const t1: Scenario = {
  task: {
    id: 'T1',
    title: 'Add feedback form to AAVA',
    status: 'wip',
    est: '2 hrs',
    priority: 'P1',
    dep: 'None',
    recommended: true,
  },

  prep: [
    { key: 'jira',   label: 'Read Jira',                   result: 'AAVA-2841',              detail: 'Ticket, acceptance criteria and sprint pulled from the connected Jira project.' },
    { key: 'figma',  label: 'Identified image from Figma', result: 'Feedback Form v3',       detail: 'Matched the ticket to a frame in the product file. Open the evidence to see the design.' },
    { key: 'play',   label: 'Verified PLAY components',    result: '6 needed',               detail: 'Broke the design into six components and checked each one against the PLAY library.' },
    { key: 'build',  label: 'Identified build vs use',     result: '4 reused · 2 built',     detail: 'Four components already existed. Two did not, so I built them. They need their own PR into PLAY.' },
    { key: 'api',    label: 'Verified API contract',       result: 'POST /api/v1/feedback',  detail: 'Endpoint is live and the schema matches what the form needs. No contract change required.' },
    { key: 'repo',   label: 'Identified code from repo',   result: 'src/app/feedback/',      detail: 'Located the feature module and the routing entry the form belongs to.' },
    { key: 'inject', label: 'Injected the feedback form',  result: '7 files changed',        detail: 'Built the Angular page, wired it to the endpoint, registered the route.' },
    { key: 'tests',  label: 'Ran unit tests',              result: '11 passed · 87%',        detail: 'All specs pass. Coverage is above the 80% gate.' },
    { key: 'checks', label: 'Checks passed',               result: 'build · lint · contract', detail: 'Build clean, lint clean, response shape matches the contract. Three assumptions logged.' },
    { key: 'ready',  label: 'Prep is ready',               result: 'awaiting your review',   detail: 'Nothing is pushed. Ask me to run it, or tell me what to change.' },
  ],

  evidence: {
    jira: { name: 'Read Jira', source: 'Jira', body: { kind: 'kv', pairs: [
      ['Ticket', 'AAVA-2841'],
      ['Title', 'Add feedback form to AAVA'],
      ['Sprint', 'Sprint 34'],
      ['Acceptance', 'Rating 1–5 · comment up to 500 characters · success and error states'],
      ['Status', 'In Progress'],
    ] } },
    figma: { name: 'Identified image from Figma', source: 'Figma', body: {
      kind: 'figma', caption: 'Feedback Form v3 · last modified 3 days ago · click to enlarge' } },
    play: { name: 'Verified PLAY components', source: 'PLAY library', body: {
      kind: 'columns',
      lead: 'Design broken into six components, each checked against the library index.',
      found: ['Input', 'Textarea', 'RatingScale', 'Button'],
      missing: ['FormField', 'CharacterCounter'] } },
    build: { name: 'Identified build vs use', source: 'Decision', body: { kind: 'kv', pairs: [
      ['Reused', 'Input · Textarea · RatingScale · Button'],
      ['Built', 'FormField · CharacterCounter'],
      ['Destination', 'Separate PR into the PLAY library'],
    ] } },
    api: { name: 'Verified API contract', source: 'OpenAPI', body: { kind: 'kv', pairs: [
      ['Endpoint', 'POST /api/v1/feedback'],
      ['Request', '{ rating: number, comment: string }'],
      ['Response', '201 { id: string, createdAt: string }'],
      ['Status', 'Live · no contract change needed'],
    ] } },
    repo: { name: 'Identified code from repo', source: 'Repo', body: { kind: 'kv', pairs: [
      ['Repo', 'aava-product'],
      ['Branch', 'feat/AAVA-2841-feedback-form'],
      ['Module', 'src/app/feedback/'],
      ['Route', '/feedback registered in app.routes.ts'],
    ] } },
    inject: { name: 'Injected the feedback form', source: '7 files', body: { kind: 'kv', pairs: [
      ['Added', 'feedback-form.component.ts · .html · .scss · .spec.ts'],
      ['Added', 'feedback.service.ts'],
      ['Modified', 'feedback.module.ts · app.routes.ts'],
    ] } },
    tests: { name: 'Ran unit tests', source: 'Karma', body: { kind: 'text',
      text: '11 specs, all passing. Coverage 87%, above the 80% gate. The full run is on the Tests tab.' } },
    checks: { name: 'Checks passed', source: 'Self-check', body: { kind: 'kv', pairs: [
      ['Build', 'Clean'],
      ['Lint', 'Clean'],
      ['Contract', 'Response shape matches'],
      ['Assumed', 'Comment required · rating starts unselected · form resets after submit'],
    ] } },
    ready: { name: 'Prep is ready', source: 'Status', body: { kind: 'text',
      text: 'Nothing has been pushed. Two PRs are staged and waiting on your approval.' } },
  },

  fileOrder: ['feedback-form.component.html', 'feedback-form.component.ts', 'feedback.service.ts'],
  files: {
    'feedback-form.component.html': { versions: [submitAbove, submitBelow] },
    'feedback-form.component.ts': { versions: [componentTs] },
    'feedback.service.ts': { versions: [serviceTs] },
  },

  tests: {
    coveragePct: 87,
    gatePct: 80,
    specs: [
      'creates the component', 'renders the rating scale', 'renders the comment field',
      'requires a rating', 'requires a comment', 'caps the comment at 500 characters',
      'counts characters as you type', 'posts to the feedback endpoint',
      'shows the success state', 'shows the error state', 'resets after a successful submit',
    ],
  },

  diff: [
    { repo: 'PLAY component library', branch: 'feat/play-formfield-charactercounter', files: [
      '+ src/lib/form-field/form-field.component.ts',
      '+ src/lib/character-counter/character-counter.component.ts',
    ] },
    { repo: 'Product', branch: 'feat/AAVA-2841-feedback-form',
      files: ['~ src/app/feedback/feedback-form.component.html', '+ 6 more files'],
      lines: [
        { tone: 'ctx', text: '  </play-form-field>' },
        { tone: 'del', text: '- <play-button type="submit">Submit</play-button>  (was above the fields)' },
        { tone: 'add', text: '+ <play-button type="submit">Submit</play-button>  (now below)' },
      ] },
  ],

  beats: {
    prep: [
      { type: 'say', lines: ['I have done some pre-work.'], block: { kind: 'prep' } },
      { type: 'wait', ms: 500 },
      { type: 'say', lines: ['Nothing is pushed. Ask me to run it when you want to see it.'] },
      { type: 'chips', stage: 'prepReady' },
    ],

    run: [
      { type: 'enableTab', tab: 'preview' },
      { type: 'showTab', tab: 'preview' },
      { type: 'runState', kind: 'live', label: 'Running' },
      { type: 'terminal', lines: [
        { tone: 'cmd', text: '$ npm install', delay: 500 },
        { tone: 'dim', text: 'up to date, 1284 packages in 2.1s', delay: 600 },
        { tone: 'cmd', text: '$ npm run start', delay: 500 },
        { tone: 'dim', text: 'Building...', delay: 900 },
        { tone: 'ok',  text: '✓ Browser application bundle generation complete.', delay: 500 },
        { tone: 'ok',  text: '✓ Compiled successfully.', delay: 400 },
        { tone: 'dim', text: '→ Local: http://localhost:4200', delay: 300 },
      ] },
      { type: 'say', lines: [
        'Starting the dev server.',
        'Running on :4200. It is live — type in it and submit it. Submissions hit a stubbed response, not the real endpoint.',
      ] },
      { type: 'chips', stage: 'running' },
    ],

    coverage: [
      { type: 'say', lines: ["Here is where it stands."], block: { kind: 'coverage', groups: [
        { title: 'Done', items: [
          'Form layout matching the Figma frame',
          'Rating scale, 1–5',
          'Comment field with a 500 character limit',
          'POST to the feedback endpoint',
          'Success and error states',
          '11 unit specs',
        ] },
        { title: 'Not done', items: [
          'File attachments — in the Figma frame, not in the acceptance criteria',
          'Anonymous submission — no field in the API contract. Blocked on the platform team.',
        ] },
        { title: 'I assumed', tone: 'assumed', items: [
          'The comment field is required',
          'Rating starts unselected rather than at 3',
          'The form resets after a successful submit',
        ] },
        { title: 'Open scenarios', items: [
          'Empty submit',
          'Network failure mid-submit',
          'Character limit hit exactly',
          'Duplicate submit from a double click',
        ] },
      ] } },
      { type: 'chips', stage: 'reviewed' },
    ],

    move: [
      { type: 'say', lines: ['Moving Submit below the comment field. One file — feedback-form.component.html.'] },
      { type: 'codeVersion', file: 'feedback-form.component.html', version: 1 },
      { type: 'showTab', tab: 'code' },
      { type: 'wait', ms: 1100 },
      { type: 'previewVariant', variant: 'submit-bottom' },
      { type: 'terminal', lines: [{ tone: 'ok', text: '✓ Compiled successfully. Reloading...', delay: 300 }] },
      { type: 'enableTab', tab: 'diff', badge: 1 },
      { type: 'showTab', tab: 'preview' },
      { type: 'say', lines: ['Done. Reloaded — check the preview. Tests still pass.'] },
      { type: 'chips', stage: 'moved' },
    ],

    ship: [
      { type: 'say', lines: ['Two PRs, two repos. Both linked to AAVA-2841. Confirm and I will raise them.'],
        block: { kind: 'confirm', acceptLabel: 'Raise both PRs', cancelLabel: 'Not yet', acceptBeat: 'shipped', rows: [
          { repo: 'PLAY', branch: 'feat/play-formfield-charactercounter → main', what: 'FormField, CharacterCounter' },
          { repo: 'Product', branch: 'feat/AAVA-2841-feedback-form → develop', what: 'Feedback page, API integration, 11 specs passing' },
        ] } },
    ],

    shipped: [
      { type: 'runState', kind: 'shipped', label: 'In review' },
      { type: 'taskStatus', taskId: 'T1', status: 'done' },
      { type: 'say', lines: ['Both raised.'], block: { kind: 'links', links: [
        { label: 'PLAY → PR #218' },
        { label: 'Product → PR #1043' },
      ] } },
      { type: 'wait', ms: 400 },
      { type: 'say', lines: ['AAVA-2841 moved to In Review. This thread is saved — reopen it from the rail any time.'] },
    ],
  },

  router: [
    { match: /\b(pr|prs|raise|ship|merge|approve|push)\b/i, beat: 'ship' },
    { match: /(move|bottom|below|reorder)/i,                beat: 'move' },
    { match: /(not covered|covered|coverage|done|scenario|missing|gap|assum)/i, beat: 'coverage' },
    { match: /(run|show|output|preview|see it|live|npm|diff)/i, beat: 'run' },
  ],

  chips: {
    prepReady: [
      { label: 'Run it', sends: 'Run it and show me the output' },
      { label: "What's not covered?", sends: "What's not covered?" },
    ],
    running: [
      { label: "What's not covered?", sends: "What's not covered?" },
      { label: 'Move Submit below the comment', sends: 'Move Submit below the comment field' },
    ],
    reviewed: [
      { label: 'Move Submit below the comment', sends: 'Move Submit below the comment field' },
      { label: 'Raise the PRs', sends: 'Raise the PRs' },
    ],
    moved: [
      { label: 'Raise the PRs', sends: 'Raise the PRs' },
      { label: 'Show me the diff', sends: 'Show me the diff' },
    ],
  },

  fallback: ['I can run it, show you what is covered, change something, or raise the PRs. Say which.'],
}
```

> **Note on `router` ordering:** the list is evaluated top-down and the first match wins. `ship` is
> deliberately first so "raise the PRs" is not swallowed by the broader `run` pattern, and `move`
> precedes `coverage` so "move Submit **below**" is not caught by `done`.

- [ ] **Step 4: Write `src/scenarios/index.ts`**

```ts
import type { Scenario } from '../state/types'
import { t1 } from './t1'

/** Register Personas 2 & 3 here — no engine changes required. */
const SCENARIOS: Record<string, Scenario> = { T1: t1 }

export function getScenario(taskId: string): Scenario | null {
  return SCENARIOS[taskId] ?? null
}

export function routeBeat(scenario: Scenario, text: string): string | null {
  for (const rule of scenario.router) {
    if (rule.match.test(text)) return rule.beat
  }
  return null
}

export { t1 }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 10 tests total (5 reducer + 5 scenario).

- [ ] **Step 6: Commit**

```bash
git add app/src/scenarios
git commit -m "feat: add T1 scenario data, beats and intent router"
```

---

## Task 4: The journey hook (timing and effect queue)

**Files:**
- Create: `app/src/state/useJourney.ts`

**Interfaces:**
- Consumes: `reducer`, `initialState` from `src/state/reducer.ts`; `getScenario`, `routeBeat` from `src/scenarios`.
- Produces: `useJourney()` returning
  `{ state, scenario, send(text), openTask(taskId), runBeat(name), closePlayground, setTab, setFile, focusEvidence, dismissBlock, setOverlay, toast, goHome, toggleThinkHarder }`.

- [ ] **Step 1: Write `src/state/useJourney.ts`**

```tsx
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { initialState, reducer } from './reducer'
import { getScenario, routeBeat } from '../scenarios'
import type { Effect, TabId } from './types'

const REDUCED = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const TYPING_MS = 620

export function useJourney() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const timers = useRef<number[]>([])

  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const after = useCallback((ms: number, fn: () => void) => {
    const delay = REDUCED() ? 0 : ms
    const id = window.setTimeout(fn, delay)
    timers.current.push(id)
  }, [])

  const scenario = useMemo(
    () => (state.activeTaskId ? getScenario(state.activeTaskId) : null),
    [state.activeTaskId],
  )

  /** Play a list of effects, honouring `wait` and per-line terminal delays. */
  const play = useCallback((effects: Effect[]) => {
    let elapsed = 0
    for (const effect of effects) {
      if (effect.type === 'wait') { elapsed += effect.ms; continue }

      if (effect.type === 'say') {
        const at = elapsed
        after(at, () => dispatch({ type: 'TYPING' }))
        after(at + TYPING_MS, () => dispatch({ type: 'APPLY', effect }))
        elapsed = at + TYPING_MS
        continue
      }

      if (effect.type === 'terminal') {
        let lineAt = elapsed
        for (const line of effect.lines) {
          lineAt += line.delay
          after(lineAt, () =>
            dispatch({ type: 'APPLY', effect: { type: 'terminal', lines: [line] } }),
          )
        }
        elapsed = lineAt
        continue
      }

      const at = elapsed
      after(at, () => dispatch({ type: 'APPLY', effect }))
    }
  }, [after])

  const runBeat = useCallback((name: string) => {
    const sc = state.activeTaskId ? getScenario(state.activeTaskId) : null
    const beat = sc?.beats[name]
    if (beat) play(beat)
  }, [state.activeTaskId, play])

  const send = useCallback((text: string) => {
    dispatch({ type: 'USER_SAY', text })
    const sc = state.activeTaskId ? getScenario(state.activeTaskId) : null

    if (sc) {
      const beat = routeBeat(sc, text)
      if (beat && sc.beats[beat]) { play(sc.beats[beat]); return }
      play([{ type: 'say', lines: sc.fallback }])
      return
    }

    play([{ type: 'say', lines: replyOffTask(text) }])
  }, [state.activeTaskId, play])

  const openTask = useCallback((taskId: string) => {
    const sc = getScenario(taskId)
    dispatch({ type: 'OPEN_TASK', taskId, scenario: sc })
    if (sc) { play(sc.beats.prep) }
    else {
      play([{ type: 'say', lines: [
        'I have not done the pre-work for this one yet.',
        'T1 is the modelled scenario in this prototype.',
      ] }])
    }
  }, [play])

  const toast = useCallback((text: string | null) => {
    dispatch({ type: 'TOAST', text })
    if (text) after(3400, () => dispatch({ type: 'TOAST', text: null }))
  }, [after])

  return {
    state,
    scenario,
    send,
    openTask,
    runBeat,
    goHome: () => dispatch({ type: 'GO_HOME' }),
    closePlayground: () => dispatch({ type: 'CLOSE_PLAYGROUND' }),
    setTab: (tab: TabId) => dispatch({ type: 'SET_TAB', tab }),
    setFile: (file: string) => dispatch({ type: 'SET_FILE', file }),
    focusEvidence: (key: string) => dispatch({ type: 'FOCUS_EVIDENCE', key }),
    dismissBlock: (messageId: string) => dispatch({ type: 'DISMISS_BLOCK', messageId }),
    setOverlay: (overlay: 'none' | 'tasks' | 'threads') => dispatch({ type: 'OVERLAY', overlay }),
    toggleThinkHarder: () => dispatch({ type: 'TOGGLE_THINK_HARDER' }),
    toast,
  }
}

function replyOffTask(text: string): string[] {
  if (/(why|recommend|first)/i.test(text)) {
    return ['T1 is first because every dependency is resolved. T2 is waiting on two answers from the platform team, and T3 needs a maintenance window.']
  }
  return ['One task is partly done, one is waiting on clarifications, one has not started. Pick any of them and I will take it into the playground.']
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/state/useJourney.ts
git commit -m "feat: add journey hook owning effect queue and timing"
```

---

## Task 5: Chrome — Rail, Topbar, Composer

**Files:**
- Create: `app/src/components/chrome/Rail.tsx`, `Topbar.tsx`, `Composer.tsx`
- Modify: `app/src/App.tsx`

**Interfaces:**
- Consumes: `useJourney()` from Task 4.
- Produces: `<Rail onHome onThreads />`, `<Topbar onHome onTasks locked />`, `<Composer onSend thinkHarder onToggleThinkHarder />`.

These three are mounted **once** in `App.tsx`, outside the arrangement-switching region. That is what makes Global Constraint #3 structural rather than a convention someone can break later.

- [ ] **Step 1: Write `src/components/chrome/Rail.tsx`**

```tsx
interface Props { onHome: () => void; onThreads: () => void }

const icon = 'h-[38px] w-[38px] grid place-items-center rounded-[10px] text-[--muted] ' +
  'hover:bg-[--glass] hover:text-[--text] transition-colors'

export function Rail({ onHome, onThreads }: Props) {
  return (
    <nav
      aria-label="Primary"
      className="flex w-[var(--rail-w)] flex-col items-center gap-2 py-3 backdrop-blur-[14px]"
      style={{ background: 'rgba(255,255,255,.022)', borderRight: '1px solid var(--glass-line-soft)' }}
    >
      <button onClick={onHome} aria-label="AAVA home"
        className="mb-2 grid h-8 w-8 place-items-center rounded-[10px]"
        style={{ background: 'linear-gradient(140deg, var(--aurora-1), var(--aurora-2))' }}>
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <path d="M12 3 3.5 20h3.2l1.9-4h6.8l1.9 4h3.2L12 3Zm-2 10.2L12 8.6l2 4.6h-4Z" fill="#0B0A12" />
        </svg>
      </button>

      <button className={icon} aria-label="Search">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="m16 16 4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <button className={icon} aria-label="Threads" onClick={onThreads}>
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
          <path d="M4 6.5h16M4 12h16M4 17.5h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <button className={icon} aria-label="Pinned">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
          <path d="M14.5 3 21 9.5l-2.4.5-3.2 3.2.4 3.4-1.6 1.6L9 13l-4.6 4.6M9 13 4.4 8.4 6 6.8l3.4.4 3.2-3.2L14.5 3Z"
            fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </button>

      <button className="mt-auto grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold"
        style={{ background: 'var(--glass-strong)', color: 'var(--text-dim)' }} aria-label="Dev — account">D</button>
    </nav>
  )
}
```

- [ ] **Step 2: Write `src/components/chrome/Topbar.tsx`**

```tsx
interface Props { onHome: () => void; onTasks: () => void; locked: boolean }

export function Topbar({ onHome, onTasks, locked }: Props) {
  return (
    <header className="flex items-center justify-between px-5 py-3"
      style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
      <button onClick={onHome} className="flex items-center gap-2 text-[14px] font-semibold tracking-[-.01em]">
        AAVA{' '}
        <span style={{
          background: 'linear-gradient(96deg, var(--aurora-1), var(--aurora-2), var(--aurora-3))',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        }}>3.0</span>
      </button>

      <div className="flex items-center gap-1">
        <button aria-label="Notifications" className="grid h-8 w-8 place-items-center rounded-[10px] text-[--muted] hover:bg-[--glass]">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M18 15.5V11a6 6 0 1 0-12 0v4.5L4.5 18h15L18 15.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M10 20.5a2.2 2.2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <button aria-label="Tasks" onClick={onTasks}
          className="grid h-8 w-8 place-items-center rounded-[10px] hover:bg-[--glass]"
          style={{ color: locked ? 'var(--muted-deep)' : 'var(--muted)' }}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="m4 7.5 2.2 2.2L10.5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m4 17 2.2 2.2L10.5 14.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.5 8h6.5M13.5 17.5H20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Write `src/components/chrome/Composer.tsx`**

```tsx
import { useRef, useState } from 'react'

interface Props {
  onSend: (text: string) => void
  thinkHarder: boolean
  onToggleThinkHarder: () => void
}

export function Composer({ onSend, thinkHarder, onToggleThinkHarder }: Props) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const text = value.trim()
    if (!text) return
    onSend(text)
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  return (
    <div className="mx-auto w-full max-w-[880px] px-8 pb-6">
      <form
        onSubmit={(e) => { e.preventDefault(); submit() }}
        className="rounded-[var(--r-lg)] p-3 backdrop-blur-[24px]"
        style={{
          background: 'var(--glass-strong)',
          border: '1px solid var(--glass-line)',
          boxShadow: '0 12px 40px rgba(0,0,0,.5)',
        }}
      >
        <label htmlFor="prompt" className="sr-only">Message AAVA</label>
        <textarea
          id="prompt" ref={ref} rows={1} value={value}
          placeholder="You can ask me about the pending tasks or chat about something else…"
          onChange={(e) => {
            setValue(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
          }}
          className="max-h-[168px] w-full resize-none bg-transparent text-[14px] outline-none placeholder:text-[--muted-deep]"
        />

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button" onClick={onToggleThinkHarder} aria-pressed={thinkHarder}
            className="rounded-full px-3 py-1.5 text-[12px] transition-colors"
            style={{
              background: thinkHarder ? 'rgba(167,139,250,.18)' : 'var(--glass)',
              color: thinkHarder ? 'var(--aurora-2)' : 'var(--muted)',
            }}
          >
            Think Harder
          </button>

          <button
            type="submit" disabled={!value.trim()} aria-label="Send message"
            className="grid h-8 w-8 place-items-center rounded-full transition-opacity disabled:opacity-35"
            style={{ background: 'linear-gradient(140deg, var(--aurora-1), var(--aurora-2))', color: '#fff' }}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
              <path d="M12 19V5.5M12 5.5 6 11.5M12 5.5l6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Wire the shell in `src/App.tsx`**

```tsx
import { AmbientField } from './components/ambient/AmbientField'
import { Rail } from './components/chrome/Rail'
import { Topbar } from './components/chrome/Topbar'
import { Composer } from './components/chrome/Composer'
import { useJourney } from './state/useJourney'

export default function App() {
  const j = useJourney()

  return (
    <>
      <AmbientField />
      <div className="relative z-10 flex h-full">
        <Rail onHome={j.goHome} onThreads={() => j.setOverlay('threads')} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            onHome={j.goHome}
            onTasks={() => j.setOverlay('tasks')}
            locked={j.state.arrangement === 'split'}
          />
          {/* Arrangement region — replaced in Tasks 6-8. Chrome above and below never remounts. */}
          <main className="min-h-0 flex-1" />
          <Composer
            onSend={j.send}
            thinkHarder={j.state.thinkHarder}
            onToggleThinkHarder={j.toggleThinkHarder}
          />
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 5: Verify**

Run: `npm run dev`
Expected: glass rail on the left, glass topbar with a gradient "3.0", glass composer pinned to the bottom over the ambient field. Typing enables the send button; Enter clears it; Shift+Enter adds a line and grows the box.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/chrome app/src/App.tsx
git commit -m "feat: add persistent chrome — rail, topbar, composer"
```

---

## Task 6: Start arrangement — hero, task cards, aurora ring

**Files:**
- Create: `app/src/components/start/AuroraRing.tsx`, `TaskCard.tsx`, `Hero.tsx`, `StartView.tsx`
- Modify: `app/src/App.tsx`

**Interfaces:**
- Consumes: `Task`, `STATUS_LABELS` from Task 2.
- Produces: `<StartView tasks onOpenTask />`. `TaskCard` exposes `layoutId={`card-${task.id}`}` — Task 7 relies on that exact id string for the flight animation.

- [ ] **Step 1: Write `src/components/start/AuroraRing.tsx`**

```tsx
import './aurora.css'

/** The entire affordance for "recommended". No badge, no star, no size change. */
export function AuroraRing({ children }: { children: React.ReactNode }) {
  return <div className="aurora-ring">{children}</div>
}
```

`src/components/start/aurora.css`:

```css
.aurora-ring {
  position: relative;
  border-radius: var(--r-lg);
  padding: 1px;
  background: conic-gradient(
    from var(--aurora-angle),
    var(--aurora-1), var(--aurora-2), var(--aurora-3), var(--aurora-2), var(--aurora-1)
  );
  animation: aurora-spin 7s linear infinite;
}

.aurora-ring::after {
  content: '';
  position: absolute;
  inset: -18px;
  z-index: -1;
  border-radius: var(--r-xl);
  background: radial-gradient(closest-side, rgba(167, 139, 250, .38), transparent 70%);
}

@keyframes aurora-spin { to { --aurora-angle: 360deg; } }

@media (prefers-reduced-motion: reduce) {
  .aurora-ring { animation: none; }
}
```

- [ ] **Step 2: Write `src/components/start/TaskCard.tsx`**

```tsx
import { motion } from 'motion/react'
import type { Task } from '../../state/types'
import { STATUS_LABELS } from '../../state/reducer'
import { AuroraRing } from './AuroraRing'

const DOT: Record<Task['status'], string> = {
  wip: 'var(--ok)', clarify: 'var(--warn)', pending: 'var(--pending)', done: 'var(--done)',
}

export function TaskCard({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const body = (
    <motion.button
      layoutId={`card-${task.id}`}
      onClick={() => onOpen(task.id)}
      className="flex h-full w-full flex-col rounded-[var(--r-lg)] p-4 text-left backdrop-blur-[20px] transition-colors hover:bg-[rgba(255,255,255,.07)]"
      style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)', minHeight: 148 }}
    >
      <h2 className="text-[15px] font-semibold leading-snug tracking-[-.012em]">{task.title}</h2>
      <div className="mt-auto flex items-center gap-2 pt-4">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: DOT[task.status] }} />
        <span className="mono text-[11px]" style={{ color: 'var(--muted)' }}>
          {STATUS_LABELS[task.status]} · {task.est}
        </span>
      </div>
    </motion.button>
  )

  return task.recommended ? <AuroraRing>{body}</AuroraRing> : body
}
```

- [ ] **Step 3: Write `src/components/start/Hero.tsx` and `StartView.tsx`**

```tsx
// Hero.tsx
export function Hero() {
  return (
    <section className="mb-9">
      <h1 className="text-[42px] font-medium leading-[1.1] tracking-[-.035em]">Good morning, Dev</h1>
      <p className="mt-2 max-w-[52ch] text-[15px]" style={{ color: 'var(--muted)' }}>
        Three tasks are ready for your attention. One of them I've already prepared end to end.
      </p>
    </section>
  )
}
```

```tsx
// StartView.tsx
import { motion } from 'motion/react'
import type { Task } from '../../state/types'
import { Hero } from './Hero'
import { TaskCard } from './TaskCard'

export function StartView({ tasks, onOpenTask }: { tasks: Task[]; onOpenTask: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 0.61, 0.36, 1] }}
      className="mx-auto w-full max-w-[1120px] px-8 pt-14"
    >
      <Hero />
      <div className="grid grid-cols-3 gap-4">
        {tasks.slice(0, 3).map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} />)}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 4: Render it in `App.tsx`**

Replace the empty `<main className="min-h-0 flex-1" />` with:

```tsx
<main className="min-h-0 flex-1 overflow-y-auto">
  {j.state.arrangement === 'start' && (
    <StartView tasks={j.state.tasks} onOpenTask={j.openTask} />
  )}
</main>
```

Add the import: `import { StartView } from './components/start/StartView'`.

- [ ] **Step 5: Verify**

Run: `npm run dev`
Expected: greeting, subline, three equal-height cards. Card 1 carries a slowly rotating pink→violet→blue ring with a soft bloom behind it; cards 2 and 3 are plain glass and **the same size**. No badge or star anywhere.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/start app/src/App.tsx
git commit -m "feat: add start arrangement with aurora-ringed recommended card"
```

---

## Task 7: Conversation arrangement — thread, chips, task rail, card flight

**Files:**
- Create: `app/src/components/chat/TypingDots.tsx`, `Message.tsx`, `Blocks.tsx`, `Chips.tsx`, `Thread.tsx`, `TaskRail.tsx`, `ConversationView.tsx`
- Modify: `app/src/App.tsx`

**Interfaces:**
- Consumes: `Message`, `BlockSpec`, `Chip` types; `layoutId={`card-${task.id}`}` from Task 6.
- Produces: `<ConversationView state chips onOpenTask onChip onFocusEvidence onDismissBlock onRunBeat />`, `<Thread …>`, `<Chips …>`.

`PrepList` is built in Task 9 alongside the evidence panel it drives; `Message` renders `{ kind: 'prep' }` via a prop so the two tasks stay independently reviewable.

- [ ] **Step 1: Write `src/components/chat/TypingDots.tsx`**

```tsx
export function TypingDots() {
  return (
    <div className="flex gap-1 py-1" aria-label="AAVA is thinking">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full"
          style={{
            background: 'var(--muted)',
            animation: 'typing 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.16}s`,
          }} />
      ))}
      <style>{`@keyframes typing { 0%,60%,100% { opacity:.25 } 30% { opacity:1 } }`}</style>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/components/chat/Blocks.tsx`**

```tsx
import type { BlockSpec } from '../../state/types'

interface Props {
  block: BlockSpec
  live: boolean
  prep: React.ReactNode
  onAccept: (beat: string) => void
  onDismiss: () => void
}

export function Block({ block, live, prep, onAccept, onDismiss }: Props) {
  if (block.kind === 'prep') return <>{prep}</>

  if (block.kind === 'coverage') {
    return (
      <div className="mt-3 grid gap-2">
        {block.groups.map((g) => (
          <div key={g.title} className="rounded-[var(--r-md)] p-3"
            style={{
              background: 'var(--glass)',
              border: `1px solid ${g.tone === 'assumed' ? 'rgba(251,191,36,.26)' : 'var(--glass-line)'}`,
            }}>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.14em]"
              style={{ color: g.tone === 'assumed' ? 'var(--warn)' : 'var(--muted)' }}>{g.title}</h4>
            <ul className="grid gap-1 text-[13px]" style={{ color: 'var(--text-dim)' }}>
              {g.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  if (block.kind === 'links') {
    return (
      <div className="mt-3 flex gap-2">
        {block.links.map((l) => (
          <span key={l.label} className="mono rounded-full px-3 py-1.5 text-[12px]"
            style={{ background: 'rgba(91,157,255,.14)', color: 'var(--done)' }}>{l.label}</span>
        ))}
      </div>
    )
  }

  // confirm
  return (
    <div className="mt-3 rounded-[var(--r-md)] p-3"
      style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
      {block.rows.map((r) => (
        <div key={r.repo} className="mb-2 grid gap-0.5">
          <span className="text-[12px] font-semibold">{r.repo}</span>
          <span className="mono text-[11px]" style={{ color: 'var(--muted)' }}>{r.branch}</span>
          <span className="text-[12px]" style={{ color: 'var(--text-dim)' }}>{r.what}</span>
        </div>
      ))}
      {live && (
        <div className="mt-3 flex gap-2">
          <button onClick={() => { onDismiss(); onAccept(block.acceptBeat) }}
            className="rounded-full px-3.5 py-1.5 text-[12px] font-medium"
            style={{ background: 'linear-gradient(140deg, var(--aurora-1), var(--aurora-2))', color: '#fff' }}>
            {block.acceptLabel}
          </button>
          <button onClick={onDismiss} className="rounded-full px-3.5 py-1.5 text-[12px]"
            style={{ background: 'var(--glass)', color: 'var(--muted)' }}>{block.cancelLabel}</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write `src/components/chat/Message.tsx`**

```tsx
import { motion } from 'motion/react'
import type { Message as Msg } from '../../state/types'
import { TypingDots } from './TypingDots'
import { Block } from './Blocks'

interface Props {
  msg: Msg
  prep: React.ReactNode
  onAccept: (beat: string) => void
  onDismiss: (id: string) => void
}

export function Message({ msg, prep, onAccept, onDismiss }: Props) {
  if (msg.from === 'user') {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="mb-4 self-end rounded-[14px_14px_4px_14px] px-3.5 py-2 text-[14px] backdrop-blur-[16px]"
        style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-line)', maxWidth: '78%' }}>
        {msg.lines[0]}
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[.16em]"
        style={{ color: 'var(--muted-deep)' }}>AAVA</p>
      {msg.typing ? <TypingDots /> : (
        <>
          {msg.lines.map((line, i) => (
            <p key={i} className="mb-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>{line}</p>
          ))}
          {msg.block && (
            <Block block={msg.block} live={msg.live !== false} prep={prep}
              onAccept={onAccept} onDismiss={() => onDismiss(msg.id)} />
          )}
        </>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 4: Write `src/components/chat/Chips.tsx`**

```tsx
import { motion } from 'motion/react'
import type { Chip } from '../../state/types'

export function Chips({ chips, onPick }: { chips: Chip[]; onPick: (sends: string) => void }) {
  if (!chips.length) return null
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {chips.map((c, i) => (
        <motion.button key={c.label} onClick={() => onPick(c.sends)}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-full px-3 py-1.5 text-[12.5px] transition-colors hover:bg-[rgba(255,255,255,.09)]"
          style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)', color: 'var(--text-dim)' }}>
          {c.label}
        </motion.button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Write `src/components/chat/Thread.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import type { Chip, Message as Msg } from '../../state/types'
import { Message } from './Message'
import { Chips } from './Chips'

interface Props {
  messages: Msg[]
  chips: Chip[]
  prep: React.ReactNode
  onChip: (sends: string) => void
  onAccept: (beat: string) => void
  onDismiss: (id: string) => void
}

export function Thread({ messages, chips, prep, onChip, onAccept, onDismiss }: Props) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'end',
    })
  }, [messages])

  return (
    <div role="log" aria-live="polite" aria-label="Conversation" className="flex flex-col">
      {messages.map((m) => (
        <Message key={m.id} msg={m} prep={prep} onAccept={onAccept} onDismiss={onDismiss} />
      ))}
      <Chips chips={chips} onPick={onChip} />
      <div ref={end} />
    </div>
  )
}
```

- [ ] **Step 6: Write `src/components/chat/TaskRail.tsx`**

```tsx
import { useState } from 'react'
import { motion } from 'motion/react'
import type { Task } from '../../state/types'
import { STATUS_LABELS } from '../../state/reducer'

const DOT: Record<Task['status'], string> = {
  wip: 'var(--ok)', clarify: 'var(--warn)', pending: 'var(--pending)', done: 'var(--done)',
}

export function TaskRail({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: string) => void }) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)} aria-label="Expand task list"
        className="mr-6 mt-6 h-fit rounded-[var(--r-md)] px-3 py-4 text-[11px]"
        style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)', color: 'var(--muted)' }}>
        {tasks.length} Tasks
      </button>
    )
  }

  return (
    <aside className="mr-6 mt-6 w-[320px] shrink-0" aria-label="Your tasks">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[.16em]" style={{ color: 'var(--muted-deep)' }}>Tasks</span>
        <button onClick={() => setCollapsed(true)} aria-label="Collapse task list" style={{ color: 'var(--muted)' }}>›</button>
      </div>
      <div className="grid gap-1.5">
        {tasks.map((t) => (
          <motion.button key={t.id} layoutId={`card-${t.id}`} onClick={() => onOpen(t.id)}
            className="rounded-[var(--r-md)] p-3 text-left backdrop-blur-[20px] transition-colors hover:bg-[rgba(255,255,255,.07)]"
            style={{
              background: 'var(--glass)', border: '1px solid var(--glass-line)',
              opacity: t.status === 'done' ? 0.55 : 1,
            }}>
            <span className="block text-[13px] font-medium leading-snug">{t.title}</span>
            <span className="mt-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: DOT[t.status] }} />
              <span className="mono text-[10.5px]" style={{ color: 'var(--muted)' }}>
                {STATUS_LABELS[t.status]} · {t.est}
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </aside>
  )
}
```

Both `TaskCard` and this rail row use `layoutId={`card-${t.id}`}`. Motion matches those ids across the arrangement change, so the three Start cards **physically fly** into their rail rows rather than fading. That is Global Constraint "they don't disappear — they relocate", executed literally.

- [ ] **Step 7: Write `src/components/chat/ConversationView.tsx`**

```tsx
import { motion } from 'motion/react'
import type { AppState, Chip } from '../../state/types'
import { Thread } from './Thread'
import { TaskRail } from './TaskRail'

interface Props {
  state: AppState
  chips: Chip[]
  prep: React.ReactNode
  onOpenTask: (id: string) => void
  onChip: (sends: string) => void
  onAccept: (beat: string) => void
  onDismiss: (id: string) => void
}

export function ConversationView({ state, chips, prep, onOpenTask, onChip, onAccept, onDismiss }: Props) {
  return (
    <motion.div className="flex h-full min-h-0">
      <div className="mx-auto min-w-0 max-w-[760px] flex-1 overflow-y-auto px-8 pt-8">
        <Thread messages={state.messages} chips={chips} prep={prep}
          onChip={onChip} onAccept={onAccept} onDismiss={onDismiss} />
      </div>
      <TaskRail tasks={state.tasks} onOpen={onOpenTask} />
    </motion.div>
  )
}
```

- [ ] **Step 8: Wire into `App.tsx`**

```tsx
import { AnimatePresence } from 'motion/react'
import { ConversationView } from './components/chat/ConversationView'

// inside <main>:
<AnimatePresence mode="wait">
  {j.state.arrangement === 'start' && (
    <StartView key="start" tasks={j.state.tasks} onOpenTask={j.openTask} />
  )}
  {j.state.arrangement === 'conversation' && (
    <ConversationView
      key="conversation"
      state={j.state}
      chips={j.scenario && j.state.chipStage ? j.scenario.chips[j.state.chipStage] ?? [] : []}
      prep={null}
      onOpenTask={j.openTask}
      onChip={j.send}
      onAccept={j.runBeat}
      onDismiss={j.dismissBlock}
    />
  )}
</AnimatePresence>
```

- [ ] **Step 9: Verify**

Run: `npm run dev`
Expected: type "hello" and press Enter. Greeting and cards clear; the three cards **animate across** into a right-hand rail; your message appears as a glass bubble on the right; typing dots appear for ~620ms then AAVA replies as plain text with no bubble. The composer does not move at any point.

- [ ] **Step 10: Commit**

```bash
git add app/src/components/chat app/src/App.tsx
git commit -m "feat: add conversation arrangement with relocating task cards"
```

---

## Task 8: Split arrangement — playground shell, evidence, prep list

**Files:**
- Create: `app/src/components/playground/Playground.tsx`, `Evidence.tsx`
- Create: `app/src/components/chat/PrepList.tsx`
- Create: `app/src/components/playground/SplitView.tsx`
- Modify: `app/src/App.tsx`

**Interfaces:**
- Consumes: `Scenario`, `PlaygroundState`, `EvidenceBlock`.
- Produces: `<SplitView … />`, `<Playground … />`, `<Evidence scenario focused />`, `<PrepList steps onOpenEvidence />`.

- [ ] **Step 1: Write `src/components/chat/PrepList.tsx`**

```tsx
import * as Collapsible from '@radix-ui/react-collapsible'
import type { PrepStep } from '../../state/types'

export function PrepList({ steps, onOpenEvidence }: {
  steps: PrepStep[]
  onOpenEvidence: (key: string) => void
}) {
  return (
    <div className="mt-3 grid gap-px">
      {steps.map((step, i) => (
        <Collapsible.Root key={step.key} className="rounded-[var(--r-sm)]"
          style={{ background: 'rgba(255,255,255,.028)' }}>
          <Collapsible.Trigger className="flex w-full items-center gap-2.5 px-3 py-2 text-left">
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px]"
              style={{ background: 'rgba(74,222,128,.16)', color: 'var(--ok)' }}>✓</span>
            <span className="flex-1 truncate text-[12.5px]" style={{ color: 'var(--text-dim)' }}>
              {i + 1}. {step.label}
            </span>
            <span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>{step.result}</span>
          </Collapsible.Trigger>
          <Collapsible.Content className="px-3 pb-3 pl-[38px]">
            <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>{step.detail}</p>
            <button onClick={() => onOpenEvidence(step.key)}
              className="mt-1.5 text-[12px] underline underline-offset-2" style={{ color: 'var(--aurora-3)' }}>
              Open evidence
            </button>
          </Collapsible.Content>
        </Collapsible.Root>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write `src/components/playground/Evidence.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import type { Scenario } from '../../state/types'

const FigmaFrame = () => (
  <svg viewBox="0 0 520 300" className="w-full cursor-zoom-in rounded-[var(--r-sm)]" role="img"
    aria-label="Feedback Form v3 design frame">
    <rect width="520" height="300" fill="#0B0D12" />
    <rect x="130" y="24" width="260" height="252" rx="10" fill="#15181F" stroke="rgba(255,255,255,.1)" />
    <rect x="150" y="46" width="112" height="12" rx="3" fill="rgba(255,255,255,.75)" />
    <rect x="150" y="66" width="168" height="7" rx="3" fill="rgba(255,255,255,.22)" />
    {[150, 182, 214, 246, 278].map((x, i) => (
      <rect key={x} x={x} y="108" width="26" height="26" rx="6"
        fill={i === 2 ? 'var(--aurora-2)' : 'none'} stroke={i === 2 ? 'none' : 'rgba(255,255,255,.22)'} />
    ))}
    <rect x="150" y="166" width="220" height="58" rx="7" fill="none" stroke="rgba(255,255,255,.22)" />
    <rect x="150" y="244" width="86" height="26" rx="7" fill="rgba(255,255,255,.85)" />
    <text x="24" y="34" fill="#6B7280" fontFamily="monospace" fontSize="11">Feedback Form v3</text>
  </svg>
)

export function Evidence({ scenario, focused }: { scenario: Scenario; focused: string | null }) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!focused) return
    refs.current[focused]?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center',
    })
  }, [focused])

  return (
    <>
      {scenario.prep.map((step) => {
        const block = scenario.evidence[step.key]
        const isFocus = focused === step.key
        return (
          <div key={step.key} ref={(el) => { refs.current[step.key] = el }}
            className="mb-2 rounded-[var(--r-sm)] p-3 transition-colors"
            style={{
              background: 'var(--slab)',
              border: `1px solid ${isFocus ? 'rgba(167,139,250,.5)' : 'var(--glass-line-soft)'}`,
            }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-semibold">{block.name}</span>
              <span className="text-[9.5px] font-semibold uppercase tracking-[.13em]"
                style={{ color: 'var(--muted-deep)' }}>{block.source}</span>
            </div>

            {block.body.kind === 'kv' && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[11.5px]">
                {block.body.pairs.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt style={{ color: 'var(--muted-deep)' }}>{k}</dt>
                    <dd className="mono m-0" style={{ color: 'var(--text-dim)' }}>{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {block.body.kind === 'text' && (
              <p className="text-[12px]" style={{ color: 'var(--muted)' }}>{block.body.text}</p>
            )}

            {block.body.kind === 'columns' && (
              <>
                <p className="mb-2 text-[12px]" style={{ color: 'var(--muted)' }}>{block.body.lead}</p>
                <div className="grid grid-cols-2 gap-3 text-[11.5px]">
                  <div>
                    <h5 className="mb-1 text-[9.5px] uppercase tracking-[.13em]" style={{ color: 'var(--ok)' }}>Found</h5>
                    <ul className="mono grid gap-0.5" style={{ color: 'var(--text-dim)' }}>
                      {block.body.found.map((c) => <li key={c}>{c}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h5 className="mb-1 text-[9.5px] uppercase tracking-[.13em]" style={{ color: 'var(--warn)' }}>Missing</h5>
                    <ul className="mono grid gap-0.5" style={{ color: 'var(--text-dim)' }}>
                      {block.body.missing.map((c) => <li key={c}>{c}</li>)}
                    </ul>
                  </div>
                </div>
              </>
            )}

            {block.body.kind === 'figma' && (
              <div onClick={() => setLightbox(true)}>
                <FigmaFrame />
                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--muted-deep)' }}>{block.body.caption}</p>
              </div>
            )}
          </div>
        )
      })}

      {lightbox && (
        <div onClick={() => setLightbox(false)}
          className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center p-16"
          style={{ background: 'rgba(4,4,8,.86)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-[860px]"><FigmaFrame /></div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Write `src/components/playground/Playground.tsx`**

```tsx
import * as Tabs from '@radix-ui/react-tabs'
import type { PlaygroundState, Scenario, TabId } from '../../state/types'
import { Evidence } from './Evidence'

const TABS: { id: TabId; label: string }[] = [
  { id: 'evidence', label: 'Evidence' },
  { id: 'preview', label: 'Preview' },
  { id: 'code', label: 'Code' },
  { id: 'tests', label: 'Tests' },
  { id: 'diff', label: 'Diff' },
]

const RUN_COLOR = { prep: 'var(--muted)', live: 'var(--ok)', shipped: 'var(--done)' }

interface Props {
  title: string
  pg: PlaygroundState
  scenario: Scenario | null
  onTab: (t: TabId) => void
  onClose: () => void
  surfaces: Partial<Record<TabId, React.ReactNode>>
}

export function Playground({ title, pg, scenario, onTab, onClose, surfaces }: Props) {
  return (
    <section aria-label="Playground"
      className="flex min-w-0 flex-1 flex-col rounded-[var(--r-lg)] overflow-hidden"
      style={{ background: 'var(--slab)', border: '1px solid var(--glass-line)', boxShadow: '0 16px 50px rgba(0,0,0,.55)' }}>
      <header className="flex items-start justify-between px-4 pb-2 pt-3.5">
        <div>
          <p className="mb-0.5 text-[9.5px] font-semibold uppercase tracking-[.19em]" style={{ color: 'var(--muted-deep)' }}>Playground</p>
          <h2 className="text-[15px] font-semibold tracking-[-.015em]">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
            style={{ background: 'rgba(255,255,255,.05)', color: RUN_COLOR[pg.runState.kind] }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'currentColor' }} />
            {pg.runState.label}
          </span>
          <button onClick={onClose} aria-label="Close playground" style={{ color: 'var(--muted)' }} className="px-1">✕</button>
        </div>
      </header>

      <Tabs.Root value={pg.activeTab} onValueChange={(v) => onTab(v as TabId)}
        className="flex min-h-0 flex-1 flex-col">
        <Tabs.List className="flex gap-0.5 px-4">
          {TABS.map((t) => {
            const enabled = pg.enabledTabs.includes(t.id)
            return (
              <Tabs.Trigger key={t.id} value={t.id} disabled={!enabled}
                className="relative rounded-t-[var(--r-sm)] px-3 py-2 text-[12px] transition-colors disabled:opacity-30 data-[state=active]:bg-[var(--slab-raised)] data-[state=active]:text-[var(--text)]"
                style={{ color: 'var(--muted-deep)' }}>
                {t.label}
                {t.id === 'diff' && pg.diffBadge !== null && (
                  <span className="ml-1.5 rounded-full px-1.5 text-[10px]"
                    style={{ background: 'var(--aurora-2)', color: '#14121F' }}>{pg.diffBadge}</span>
                )}
              </Tabs.Trigger>
            )
          })}
        </Tabs.List>

        <div className="m-2 mt-0 min-h-0 flex-1 overflow-y-auto rounded-[var(--r-md)] p-3"
          style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)' }}>
          <Tabs.Content value="evidence">
            {scenario && <Evidence scenario={scenario} focused={pg.focusedEvidence} />}
          </Tabs.Content>
          {TABS.filter((t) => t.id !== 'evidence').map((t) => (
            <Tabs.Content key={t.id} value={t.id}>{surfaces[t.id] ?? null}</Tabs.Content>
          ))}
        </div>
      </Tabs.Root>
    </section>
  )
}
```

- [ ] **Step 4: Write `src/components/playground/SplitView.tsx`**

```tsx
import { motion } from 'motion/react'
import type { AppState, Chip, Scenario, TabId } from '../../state/types'
import { Thread } from '../chat/Thread'
import { Playground } from './Playground'

interface Props {
  state: AppState
  scenario: Scenario | null
  chips: Chip[]
  prep: React.ReactNode
  surfaces: Partial<Record<TabId, React.ReactNode>>
  onChip: (sends: string) => void
  onAccept: (beat: string) => void
  onDismiss: (id: string) => void
  onTab: (t: TabId) => void
  onClose: () => void
}

export function SplitView(p: Props) {
  const title = p.state.tasks.find((t) => t.id === p.state.activeTaskId)?.title ?? ''
  return (
    <div className="flex h-full min-h-0 gap-0">
      <div className="min-w-0 flex-1 overflow-y-auto px-7 pt-6">
        <Thread messages={p.state.messages} chips={p.chips} prep={p.prep}
          onChip={p.onChip} onAccept={p.onAccept} onDismiss={p.onDismiss} />
      </div>
      <motion.div
        initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        className="flex min-w-0 flex-1 pb-3 pr-3 pt-2"
      >
        <Playground title={title} pg={p.state.playground} scenario={p.scenario}
          onTab={p.onTab} onClose={p.onClose} surfaces={p.surfaces} />
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 5: Wire into `App.tsx`**

Add inside `<AnimatePresence>`:

```tsx
{j.state.arrangement === 'split' && (
  <SplitView
    key="split"
    state={j.state}
    scenario={j.scenario}
    chips={j.scenario && j.state.chipStage ? j.scenario.chips[j.state.chipStage] ?? [] : []}
    prep={j.scenario ? <PrepList steps={j.scenario.prep} onOpenEvidence={j.focusEvidence} /> : null}
    surfaces={{}}
    onChip={j.send}
    onAccept={j.runBeat}
    onDismiss={j.dismissBlock}
    onTab={j.setTab}
    onClose={j.closePlayground}
  />
)}
```

Also pass the same `prep` prop into `ConversationView`.

- [ ] **Step 6: Verify**

Run: `npm run dev`
Expected: click the ringed card. Split arrangement appears, playground slides in from the right on a spring. AAVA types, then "I have done some pre-work." with 10 collapsible rows. Expand row 2, click **Open evidence** — the Evidence tab scrolls the Figma block into view with a violet border. Click the frame to open the lightbox; Escape or click closes it. Preview and Diff tabs are visibly disabled.

- [ ] **Step 7: Commit**

```bash
git add app/src/components/playground app/src/components/chat/PrepList.tsx app/src/App.tsx
git commit -m "feat: add split arrangement with playground, evidence and prep list"
```

---

## Task 9: Playground surfaces — preview, terminal, code, tests, diff

**Files:**
- Create: `app/src/components/playground/FeedbackApp.tsx`, `Terminal.tsx`, `Preview.tsx`, `Code.tsx`, `Tests.tsx`, `Diff.tsx`
- Modify: `app/src/App.tsx` (fill the `surfaces` prop)

**Interfaces:**
- Consumes: `Scenario`, `PlaygroundState`, `TerminalLine`.
- Produces: `<Preview variant terminal onToast />`, `<Code scenario pg onFile />`, `<Tests scenario />`, `<Diff groups />`.

- [ ] **Step 1: Write `src/components/playground/FeedbackApp.tsx`**

```tsx
import { useState } from 'react'

/** The mock app inside the preview. Genuinely interactive — this is the point of the beat. */
export function FeedbackApp({ variant, onToast }: { variant: string; onToast: (t: string) => void }) {
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div className="grid h-full place-items-center p-8 text-center text-[13px]" style={{ color: 'var(--ok)' }}>
        Thanks — your feedback was submitted.<br />
        <span style={{ color: 'var(--muted-deep)' }}>(Stubbed response, not the live endpoint.)</span>
      </div>
    )
  }

  const submit = (
    <button
      onClick={() => {
        if (rating === null || !comment.trim()) {
          onToast('Rating and comment are both required — that is one of the assumptions.')
          return
        }
        setSent(true)
      }}
      className="rounded-[var(--r-sm)] px-4 py-2 text-[13px] font-medium"
      style={{ background: 'var(--text)', color: '#0B0A12' }}
    >
      Submit
    </button>
  )

  return (
    <div className="grid gap-3 p-5">
      <h3 className="text-[15px] font-semibold">How was your experience?</h3>
      <p className="text-[12px]" style={{ color: 'var(--muted-deep)' }}>
        Your feedback goes straight to the product team.
      </p>

      {variant !== 'submit-bottom' && <div>{submit}</div>}

      <div>
        <label className="mb-1.5 block text-[11px]" style={{ color: 'var(--muted)' }}>Rating</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}
              className="h-8 w-8 rounded-[var(--r-sm)] text-[12px] transition-colors"
              style={{
                background: rating === n ? 'var(--aurora-2)' : 'rgba(255,255,255,.05)',
                color: rating === n ? '#14121F' : 'var(--text-dim)',
                border: '1px solid var(--glass-line)',
              }}>{n}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px]" style={{ color: 'var(--muted)' }}>Comment</label>
        <textarea rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)}
          className="w-full resize-none rounded-[var(--r-sm)] p-2 text-[13px] outline-none"
          style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--glass-line)' }} />
        <div className="mono mt-1 text-right text-[11px]" style={{ color: 'var(--muted-deep)' }}>
          {comment.length} / 500
        </div>
      </div>

      {variant === 'submit-bottom' && <div>{submit}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Write `src/components/playground/Terminal.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import type { TerminalLine } from '../../state/types'

const TONE = { cmd: 'var(--text)', dim: 'var(--muted-deep)', ok: 'var(--ok)' }

export function Terminal({ lines }: { lines: TerminalLine[] }) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [lines])

  return (
    <div className="mono mt-2 h-[132px] overflow-y-auto rounded-[var(--r-sm)] p-2.5 text-[11px] leading-relaxed"
      style={{ background: '#0B0A12', border: '1px solid var(--glass-line-soft)' }}>
      {lines.map((l, i) => <div key={i} style={{ color: TONE[l.tone] }}>{l.text}</div>)}
      <div ref={end} />
    </div>
  )
}
```

- [ ] **Step 3: Write `src/components/playground/Preview.tsx`**

```tsx
import type { TerminalLine } from '../../state/types'
import { FeedbackApp } from './FeedbackApp'
import { Terminal } from './Terminal'

export function Preview({ variant, terminal, onToast }: {
  variant: string
  terminal: TerminalLine[]
  onToast: (t: string) => void
}) {
  return (
    <div>
      <div className="overflow-hidden rounded-[var(--r-sm)]" style={{ border: '1px solid var(--glass-line-soft)' }}>
        <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(255,255,255,.04)' }}>
          <span className="flex gap-1.5" aria-hidden="true">
            {['#FF6B6B', '#FBBF24', '#4ADE80'].map((c) => (
              <i key={c} className="h-2 w-2 rounded-full" style={{ background: c, display: 'block' }} />
            ))}
          </span>
          <span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>localhost:4200</span>
        </div>
        <div style={{ background: '#0D0C14' }}>
          <FeedbackApp variant={variant} onToast={onToast} />
        </div>
      </div>
      <Terminal lines={terminal} />
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/playground/Code.tsx`**

```tsx
import type { PlaygroundState, Scenario } from '../../state/types'

export function Code({ scenario, pg, onFile }: {
  scenario: Scenario
  pg: PlaygroundState
  onFile: (f: string) => void
}) {
  const active = pg.activeFile ?? scenario.fileOrder[0]
  const version = pg.fileVersions[active] ?? 0
  const body = scenario.files[active].versions[version]

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {scenario.fileOrder.map((f) => (
          <button key={f} onClick={() => onFile(f)}
            className="mono rounded-[var(--r-sm)] px-2.5 py-1.5 text-[11px] transition-colors"
            style={{
              background: f === active ? 'rgba(255,255,255,.07)' : 'transparent',
              color: f === active ? 'var(--text)' : 'var(--muted-deep)',
            }}>
            {f}
            {(pg.fileVersions[f] ?? 0) > 0 && <span style={{ color: 'var(--aurora-2)' }}> ●</span>}
          </button>
        ))}
      </div>

      <pre className="mono overflow-x-auto rounded-[var(--r-sm)] p-3 text-[11.5px] leading-[1.7]"
        style={{ background: '#0B0A12', border: '1px solid var(--glass-line-soft)' }}>
        {body.split('\n').map((line, i) =>
          line.startsWith('@@') ? (
            <span key={i} className="-mx-1 block rounded px-1"
              style={{ background: 'rgba(74,222,128,.14)', color: 'var(--ok)' }}>
              {'  ' + line.replaceAll('@@', '')}
            </span>
          ) : (
            <span key={i} className="block">{line}</span>
          ),
        )}
      </pre>
    </div>
  )
}
```

- [ ] **Step 5: Write `src/components/playground/Tests.tsx` and `Diff.tsx`**

```tsx
// Tests.tsx
import type { Scenario } from '../../state/types'

export function Tests({ scenario }: { scenario: Scenario }) {
  const { specs, coveragePct, gatePct } = scenario.tests
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="mono text-[12px]">feedback-form.component.spec.ts</span>
        <span className="text-[10px] uppercase tracking-[.13em]" style={{ color: 'var(--ok)' }}>
          {specs.length} passed
        </span>
      </div>

      {specs.map((s, i) => (
        <div key={s} className="flex items-center gap-2 py-1 text-[12px]">
          <span style={{ color: 'var(--ok)' }}>✓</span>
          <span className="flex-1" style={{ color: 'var(--text-dim)' }}>{s}</span>
          <span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>{8 + i * 3}ms</span>
        </div>
      ))}

      <div className="mt-3 flex items-center gap-3">
        <span className="mono text-[18px] font-semibold" style={{ color: 'var(--ok)' }}>{coveragePct}%</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,.07)' }}>
          <div className="h-full rounded-full" style={{ width: `${coveragePct}%`, background: 'var(--ok)' }} />
        </div>
        <span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>gate {gatePct}%</span>
      </div>
    </div>
  )
}
```

```tsx
// Diff.tsx
import type { DiffGroup } from '../../state/types'

const TONE = {
  ctx: { color: 'var(--muted-deep)', background: 'transparent' },
  del: { color: 'var(--danger)', background: 'rgba(255,107,107,.08)' },
  add: { color: 'var(--ok)', background: 'rgba(74,222,128,.10)' },
}

export function Diff({ groups }: { groups: DiffGroup[] }) {
  return (
    <div className="grid gap-3">
      {groups.map((g) => (
        <div key={g.repo} className="rounded-[var(--r-sm)] p-3" style={{ background: 'var(--slab)' }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold">{g.repo}</span>
            <span className="mono text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{g.branch}</span>
          </div>
          {g.files.map((f) => (
            <div key={f} className="mono text-[11.5px]" style={{ color: 'var(--muted)' }}>{f}</div>
          ))}
          {g.lines?.map((l, i) => (
            <div key={i} className="mono -mx-1 rounded px-1 text-[11.5px]" style={TONE[l.tone]}>{l.text}</div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Fill the `surfaces` prop in `App.tsx`**

```tsx
surfaces={j.scenario ? {
  preview: <Preview variant={j.state.playground.previewVariant}
             terminal={j.state.playground.terminal} onToast={j.toast} />,
  code: <Code scenario={j.scenario} pg={j.state.playground} onFile={j.setFile} />,
  tests: <Tests scenario={j.scenario} />,
  diff: <Diff groups={j.scenario.diff} />,
} : {}}
```

- [ ] **Step 7: Verify the full journey manually**

Run: `npm run dev`, then click the ringed card and use the chips in order.
Expected: **Run it** unlocks Preview, boots the terminal line by line, shows a working form (rating + live counter; submitting empty raises the toast). **What's not covered?** shows four blocks with "I assumed" in amber. **Move Submit below the comment** switches to Code with the moved line highlighted green and a `●` on the file, then flips to Preview where Submit now sits at the bottom, and Diff unlocks with badge `1`. **Raise the PRs** shows the two-repo confirm; accepting shows the PR links, sets run state to "In review" and flips T1 to Done in the rail.

- [ ] **Step 8: Commit**

```bash
git add app/src/components/playground app/src/App.tsx
git commit -m "feat: add preview, terminal, code, tests and diff surfaces"
```

---

## Task 10: Overlays — task window, threads, toast

**Files:**
- Create: `app/src/components/overlays/TaskWindow.tsx`, `Threads.tsx`, `Toast.tsx`
- Modify: `app/src/App.tsx`

**Interfaces:**
- Consumes: `Task`, `Thread`, `STATUS_LABELS`.
- Produces: `<TaskWindow open tasks locked lockedTitle onOpenTask onClose />`, `<Threads open threads onClose onResume />`, `<Toast text />`.

- [ ] **Step 1: Write `src/components/overlays/TaskWindow.tsx`**

```tsx
import * as Dialog from '@radix-ui/react-dialog'
import type { Task } from '../../state/types'

const COLUMNS: { key: Task['status']; name: string }[] = [
  { key: 'pending', name: 'Backlog' },
  { key: 'clarify', name: 'Needs clarification' },
  { key: 'wip', name: 'In progress' },
  { key: 'done', name: 'Done' },
]

interface Props {
  open: boolean
  tasks: Task[]
  locked: boolean
  lockedTitle: string
  onOpenTask: (id: string) => void
  onClose: () => void
}

export function TaskWindow({ open, tasks, locked, lockedTitle, onOpenTask, onClose }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: 'rgba(4,4,8,.7)', backdropFilter: 'blur(4px)' }} />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[min(1080px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--r-xl)] p-5"
          style={{ background: 'var(--slab)', border: '1px solid var(--glass-line)' }}>
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-[16px] font-semibold">
              Tasks <span className="mono ml-1 text-[13px]" style={{ color: 'var(--muted-deep)' }}>{tasks.length}</span>
            </Dialog.Title>
            <Dialog.Close aria-label="Close tasks" style={{ color: 'var(--muted)' }}>✕</Dialog.Close>
          </div>

          {locked && (
            <div className="mb-3 flex items-center gap-3 rounded-[var(--r-md)] px-3 py-2.5 text-[12.5px]"
              style={{ background: 'rgba(251,191,36,.10)', border: '1px solid rgba(251,191,36,.24)' }}>
              <span style={{ color: 'var(--text-dim)' }}>
                One task runs at a time. Finish or close <strong>{lockedTitle}</strong> to start another.
              </span>
              <button disabled title="Coming in a later release"
                className="ml-auto shrink-0 rounded-full px-3 py-1 text-[11.5px] opacity-40"
                style={{ background: 'var(--glass)', color: 'var(--muted)', cursor: 'not-allowed' }}>
                Open as a separate thread
              </button>
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            {COLUMNS.map((col) => {
              const rows = tasks.filter((t) => t.status === col.key)
              return (
                <div key={col.key}>
                  <div className="mb-2 flex items-center justify-between text-[11px]" style={{ color: 'var(--muted-deep)' }}>
                    <span className="uppercase tracking-[.13em]">{col.name}</span>
                    <span className="mono">{rows.length}</span>
                  </div>
                  <div className="grid gap-1.5">
                    {rows.length === 0 && (
                      <div className="rounded-[var(--r-sm)] p-3 text-[11.5px]"
                        style={{ background: 'rgba(255,255,255,.02)', color: 'var(--muted-deep)' }}>Empty</div>
                    )}
                    {rows.map((t) => (
                      <button key={t.id} onClick={() => onOpenTask(t.id)}
                        className="rounded-[var(--r-sm)] p-2.5 text-left transition-colors hover:bg-[rgba(255,255,255,.07)]"
                        style={{ background: 'var(--glass)', border: '1px solid var(--glass-line-soft)' }}>
                        <span className="block text-[12.5px] leading-snug">{t.title}</span>
                        <span className="mono mt-1 block text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>
                          {t.priority} · {t.est}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 2: Write `src/components/overlays/Threads.tsx`**

```tsx
import * as Dialog from '@radix-ui/react-dialog'
import type { Thread } from '../../state/types'

export function Threads({ open, threads, onClose, onResume }: {
  open: boolean
  threads: Thread[]
  onClose: () => void
  onResume: () => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: 'rgba(4,4,8,.7)', backdropFilter: 'blur(4px)' }} />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--r-xl)] p-5"
          style={{ background: 'var(--slab)', border: '1px solid var(--glass-line)' }}>
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-[16px] font-semibold">Threads</Dialog.Title>
            <Dialog.Close aria-label="Close threads" style={{ color: 'var(--muted)' }}>✕</Dialog.Close>
          </div>
          <div className="grid gap-1.5">
            {threads.map((t, i) => (
              <button key={i} onClick={onResume}
                className="flex items-center gap-3 rounded-[var(--r-sm)] p-2.5 text-left transition-colors hover:bg-[rgba(255,255,255,.07)]"
                style={{ background: 'var(--glass)' }}>
                <span className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[.12em]"
                  style={{
                    background: t.kind === 'task' ? 'rgba(167,139,250,.16)' : 'rgba(255,255,255,.06)',
                    color: t.kind === 'task' ? 'var(--aurora-2)' : 'var(--muted)',
                  }}>{t.kind}</span>
                <span className="flex-1 text-[13px]">{t.title}</span>
                <span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>{t.when}</span>
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 3: Write `src/components/overlays/Toast.tsx`**

```tsx
import { AnimatePresence, motion } from 'motion/react'

export function Toast({ text }: { text: string | null }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div role="status" aria-live="polite"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2.5 text-[13px] backdrop-blur-[20px]"
          style={{ background: 'rgba(24,22,38,.94)', border: '1px solid var(--glass-line)', color: 'var(--text-dim)' }}>
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 4: Wire into `App.tsx`, and show the toast when `state.toast` is set by the reducer**

Add before the closing fragment:

```tsx
<TaskWindow
  open={j.state.overlay === 'tasks'}
  tasks={j.state.tasks}
  locked={j.state.arrangement === 'split'}
  lockedTitle={j.state.tasks.find((t) => t.id === j.state.activeTaskId)?.title ?? 'the current task'}
  onOpenTask={j.openTask}
  onClose={() => j.setOverlay('none')}
/>
<Threads
  open={j.state.overlay === 'threads'}
  threads={j.state.threads}
  onClose={() => j.setOverlay('none')}
  onResume={() => {
    j.setOverlay('none')
    j.toast('Resuming — memory and evidence come back with the thread.')
  }}
/>
<Toast text={j.state.toast} />
```

The reducer sets `state.toast` directly when a blocked `OPEN_TASK` is attempted, so that message
appears without any extra wiring. Add this effect in `App.tsx` so reducer-set toasts also auto-clear:

```tsx
useEffect(() => {
  if (!j.state.toast) return
  const id = window.setTimeout(() => j.toast(null), 3400)
  return () => clearTimeout(id)
}, [j.state.toast])
```

- [ ] **Step 5: Verify**

Run: `npm run dev`
Expected: the tasks icon opens a four-column kanban. While T1 is running, opening it shows the amber notice naming the running task and a visibly **disabled** "Open as a separate thread" button; clicking any other card raises the toast and does not switch tasks. The threads icon lists two prior sessions plus the T1 thread once started. Escape closes both.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/overlays app/src/App.tsx
git commit -m "feat: add task window, threads and toast overlays"
```

---

## Task 11: The journey test and final pass

**Files:**
- Create: `app/src/state/journey.test.ts`
- Modify: `app/src/App.tsx` (Escape handling)

**Interfaces:**
- Consumes: `reducer`, `applyEffects`, `initialState`, `__resetIds`; `t1`, `routeBeat`.
- Produces: nothing consumed by later tasks — this is the final task.

- [ ] **Step 1: Write the failing test `src/state/journey.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { initialState, reducer, applyEffects, __resetIds } from './reducer'
import { t1 } from '../scenarios/t1'
import { routeBeat } from '../scenarios'
import type { AppState } from './types'

/** Drives the whole T1 demo through the reducer, ignoring timing. */
function runJourney(): AppState {
  let s = reducer(initialState, { type: 'OPEN_TASK', taskId: 'T1', scenario: t1 })
  s = applyEffects(s, t1.beats.prep)

  for (const phrase of [
    'Run it and show me the output',
    "What's not covered?",
    'Move Submit below the comment field',
    'Raise the PRs',
  ]) {
    const beat = routeBeat(t1, phrase)
    expect(beat, `"${phrase}" routed nowhere`).not.toBeNull()
    s = reducer(s, { type: 'USER_SAY', text: phrase })
    s = applyEffects(s, t1.beats[beat!])
  }

  // The presenter accepts the confirm card, which fires the `shipped` beat.
  return applyEffects(s, t1.beats.shipped)
}

describe('T1 journey', () => {
  beforeEach(__resetIds)

  it('ends with both PRs raised and the task done', () => {
    const s = runJourney()

    expect(s.tasks.find((t) => t.id === 'T1')!.status).toBe('done')
    expect(s.playground.runState).toEqual({ kind: 'shipped', label: 'In review' })

    const links = s.messages.flatMap((m) =>
      m.block?.kind === 'links' ? m.block.links.map((l) => l.label) : [],
    )
    expect(links).toEqual(['PLAY → PR #218', 'Product → PR #1043'])
  })

  it('unlocks every playground surface along the way', () => {
    const s = runJourney()
    for (const tab of ['evidence', 'preview', 'code', 'tests', 'diff']) {
      expect(s.playground.enabledTabs, `${tab} never unlocked`).toContain(tab)
    }
  })

  it('leaves the moved-submit version of the template on screen', () => {
    const s = runJourney()
    expect(s.playground.fileVersions['feedback-form.component.html']).toBe(1)

    const shown = t1.files['feedback-form.component.html'].versions[1]
    expect(shown).toContain('@@<play-button type="submit">Submit</play-button>@@')
    expect(shown.indexOf('play-character-counter')).toBeLessThan(shown.indexOf('@@<play-button'))
  })

  it('never leaves a dangling typing indicator', () => {
    const s = runJourney()
    expect(s.messages.some((m) => m.typing)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `journey.test.ts` cannot resolve `__resetIds` if Task 2 Step 4 was not applied exactly; otherwise it fails on an assertion.

- [ ] **Step 3: Make it pass**

No new implementation should be required — this test exercises code written in Tasks 2 and 3. If it fails, the failure is a real defect in `reducer.ts` or `t1.ts`. Fix the source, not the test.

- [ ] **Step 4: Run the whole suite**

Run: `npm test`
Expected: PASS — 14 tests across `reducer.test.ts`, `t1.test.ts` and `journey.test.ts`.

- [ ] **Step 5: Add Escape handling in `App.tsx`**

```tsx
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    if (j.state.overlay !== 'none') { j.setOverlay('none'); return }
    if (j.state.arrangement === 'split') j.closePlayground()
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}, [j.state.overlay, j.state.arrangement])
```

- [ ] **Step 6: Reduced-motion and accessibility pass**

Run: `npm run dev` with macOS **System Settings → Accessibility → Display → Reduce motion** enabled.
Expected: no ambient drift, no ring rotation, no card flight, replies appear immediately, terminal lines land at once. The journey still completes.

Then, with motion enabled, tab through the whole screen.
Expected: every control has a visible violet focus ring; the rail buttons, composer, chips, prep rows, tabs and dialogs are all reachable; dialogs trap focus and return it on close.

- [ ] **Step 7: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no type errors; build succeeds.

- [ ] **Step 8: Commit**

```bash
git add app/src
git commit -m "test: add end-to-end T1 journey test; add escape handling and a11y pass"
```

---

## Self-Review

**Spec coverage.** Every section of the design doc maps to a task: laws §2 → Global Constraints and Tasks 5–8; decisions D1–D9 → D1/D2 Task 3, D3/D4 Tasks 1 & 8, D5 Task 1, D6 Task 10, D7 Tasks 3 & 7, D8 Task 5, D9 Task 1 tokens; architecture §4 → Tasks 2–4; visual system §5 → Tasks 1, 6, 7; the T1 journey §6 → Tasks 8–9 (beats 0–4, all five surfaces, §6.8 non-modelled tasks handled in `useJourney.openTask`); file structure §7 → the File Structure table; testing §8 → Task 11.

**Type consistency.** `layoutId={`card-${task.id}`}` is identical in `TaskCard.tsx` (Task 6) and `TaskRail.tsx` (Task 7) — the flight breaks silently if these ever diverge. `applyEffects` / `applyEffect` / `__resetIds` are exported in Task 2 and consumed unchanged in Tasks 4 and 11. `Scenario.fileOrder` is defined in Task 2 types, populated in Task 3, and read by `Code.tsx` and `OPEN_TASK`.

**One refinement against the spec.** The spec sketched `confirm` as `{ type:'confirm'; spec; onAccept: Effect[] }`. The plan instead makes it a `BlockSpec` carrying `acceptBeat: string`, so accepting dispatches the named `shipped` beat. This avoids nesting effect arrays inside effects, keeps `Scenario` flat and JSON-shaped, and makes the accept path testable without simulating a click. Behaviour is identical.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-03-aava-3-prototype.md`.
