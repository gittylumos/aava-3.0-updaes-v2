# AAVA 3.0 — Clickable Prototype (Persona 1) · Design

**Date:** 2026-08-03
**Milestone:** Clickable Prototype, Persona 1 — 6th August 2026 (Personas 2 & 3 — 11th August)
**Status:** Approved, ready for implementation planning

---

## 1. What this is

A React prototype of AAVA 3.0 used to validate the Persona 1 journey with stakeholders. Everything is
hardcoded — no API calls, no backend, no persistence. It exists to be walked through in a room.

### Source material

| Source | Role |
| --- | --- |
| `Common_Journey_v0.docx` | **The constitution.** Layout laws are non-negotiable and quoted below. |
| `AAVA 3.0_PI Planning.pdf` | UX principles, personas, the 10-step→6-step thesis, direction themes. |
| `sample_reference/` (jQuery) | Reference implementation of the T1 journey. Functional reference, **not** visual target. |

### The thesis being demonstrated

Dev, a Senior Angular Developer, builds a feedback screen today in **10 manual steps across 8+ tools,
15+ context switches, 2–4 hours**. AAVA 3.0 collapses this to **6 steps in one workspace**, and critically
does the preparation *before* Dev arrives. The line the deck closes on:
*"AAVA 3.0 does the heavy lifting. Dev makes the decisions."*

---

## 2. Laws (from the Common Journey doc — must not be violated)

1. **One screen.** No routes, no page reloads, nothing navigates away, nothing opens in a new page.
2. **Three arrangements, not three pages:** `Start` → `Conversation` → `Split`. The user moves between
   them in place.
3. **Rail, header and composer are present in all three and never move or re-render.** Only the area
   between them changes.
4. **Chat always holds the left.** Task cards, playground and artifacts always come in on the right.
   This never flips between arrangements.
5. **The recommended card is signalled by an animated aurora ring and nothing else.** Same size as the
   others. No badge, no star, no label, no different background. Pink → purple → blue, rotating slowly,
   with a soft bloom behind the card. *"The ring is the entire affordance. If a reviewer asks for a
   badge, the ring has failed and should be fixed, not supplemented."*
6. **Replies are never instant.** Three-dot typing indicator first, ~600ms, then text. The pause is what
   reads as thinking rather than lookup.
7. **Only user messages get a container.** AAVA's replies are plain text — no bubbles.
8. **One task executes at a time.**
9. **Every chat and every task is a resumable thread.**
10. Enter sends; Shift+Enter is a line break. Smooth scroll to newest message. Long replies break into
    paragraphs.

---

## 3. Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| D1 | **T1 only, modelled end to end.** T2–T6 stay shells. | T1 is the journey the entire deck narrates. Personas 2 & 3 arrive 11th Aug as new scenario data. |
| D2 | **Redesign, not a port.** Doc is law; the jQuery reference is one interpretation of it. | User's explicit call. The reference reads as a wireframe that works; the prototype must read as a product. |
| D3 | **Ambient visual direction.** | Promotes the reference's ambient navy/violet field from background noise to the organising idea. Best demo theatre; serves "Eager To Collaborate". |
| D4 | **Glass chrome, solid slab.** Glass for chrome only; opaque surfaces under all dense content. | Ambient's one real weakness is legibility of code/evidence on frosted glass, and the playground is ~70% of the demo. A solid panel floating on a living field still reads as Ambient. Also avoids stacking a dozen `backdrop-filter` layers. |
| D5 | **Vite + React + TypeScript · Tailwind · Radix (shadcn) · Motion.** | Radix primitives are copied in and fully restyleable — correct for a bespoke redesign, where a batteries-included library would fight the direction. Only ~5 primitives needed (Tabs, Collapsible, Dialog, ScrollArea, Tooltip); Radix supplies focus management and ARIA. Motion's shared-layout animation is how cards "relocate rather than disappear". |
| D6 | **Mid-task switching: blocked, with the door shown.** Toast explains; a disabled "Open as a separate thread" affordance is visible. | Resolves the doc's open call #1. Keeps "one task at a time" a visible product principle while signalling intent, without building concurrent threads. |
| D7 | **Keyword routing + suggested reply chips.** | Free-text routing stays live so it feels like a real product; chips give the presenter a guaranteed-clean path and teach the audience what AAVA can do. |
| D8 | **Sidebar icons: Search, Threads, Pinned.** | Resolves the doc's open call #2. Threads is the only one the journey needs; the other two are present and inert. |
| D9 | **Move off `#55FF99` acid-green-on-near-black.** | That exact pairing is the most common "AI-generated dark developer tool" look. Since D2 chose redesign, the one bold colour is better spent elsewhere. Aurora carries the brand instead. |

---

## 4. Architecture

### 4.1 Shape

One mounted screen, one reducer, no router.

```ts
type Arrangement = 'start' | 'conversation' | 'split'

interface AppState {
  arrangement: Arrangement
  activeTaskId: string | null
  tasks: Task[]
  messages: Message[]
  threads: Thread[]
  playground: PlaygroundState
  toast: string | null
  overlay: 'none' | 'tasks' | 'threads'
}

interface PlaygroundState {
  taskId: string | null
  activeTab: TabId
  enabledTabs: TabId[]           // Preview and Diff start disabled, unlock via beats
  runState: { kind: 'prep' | 'live' | 'shipped'; label: string }
  focusedEvidence: string | null // evidence key pulled into view by a prep row
  fileVersions: Record<string, number>
  terminal: TerminalLine[]
  diffBadge: number | null
}

type TabId = 'evidence' | 'preview' | 'code' | 'tests' | 'diff'
```

### 4.2 The scenario layer

The engine is scenario-agnostic. A scenario is pure data:

```ts
interface Scenario {
  task:     Task
  prep:     PrepStep[]                      // label, result, detail, evidenceKey
  evidence: Record<string, EvidenceBlock>   // keyed so a prep row can point at one
  files:    Record<string, { versions: string[] }>
  tests:    { specs: string[]; coveragePct: number; gatePct: number }
  diff:     DiffGroup[]
  beats:    Record<string, Effect[]>
  router:   { match: RegExp; beat: string }[]
  chips:    Record<string, { label: string; sends: string }[]>  // keyed by conversation stage
  fallback: (input: string) => string[]     // reply when nothing matches
}
```

**Adding Personas 2 & 3 on the 11th means writing `scenarios/t2.ts` and `t3.ts` and registering them.
No engine code changes.** This is the primary architectural requirement.

### 4.3 Effects

Beats are lists of effects, interpreted by the reducer. Making them data (rather than imperative
callbacks as in the jQuery reference) is what makes the journey replayable and testable.

```ts
type Effect =
  | { type: 'say';        lines: string[]; block?: BlockSpec }
  | { type: 'showTab';    tab: TabId }
  | { type: 'enableTab';  tab: TabId; badge?: number }
  | { type: 'runState';   kind: 'prep' | 'live' | 'shipped'; label: string }
  | { type: 'terminal';   lines: TerminalLine[] }      // each carries its own delay
  | { type: 'codeVersion'; file: string; version: number }
  | { type: 'previewVariant'; variant: string }        // e.g. 'submit-bottom'
  | { type: 'taskStatus'; taskId: string; status: TaskStatus }
  | { type: 'confirm';    spec: ConfirmSpec; onAccept: Effect[] }
  | { type: 'chips';      stage: string }
  | { type: 'wait';       ms: number }
```

`wait` and the per-line terminal delays are the only timing primitives. Under
`prefers-reduced-motion: reduce` all delays collapse to 0.

### 4.4 Why a reducer rather than component state

Every beat mutates several regions at once — chat, tab availability, code version, preview, task status.
Centralising that in one reducer keeps those regions consistent and makes the whole journey drivable
from a test without mounting React.

---

## 5. Visual system

### 5.1 Colour

| Token | Value | Use |
| --- | --- | --- |
| `--ground` | `#06070B` | Page ground |
| `--slab` | `#100F1A` | Playground panel, evidence blocks |
| `--slab-raised` | `#181626` | Panel body, active tab, code surface |
| `--glass` | `rgba(255,255,255,.045)` | Rail, topbar, composer, user bubbles, task cards |
| `--glass-line` | `rgba(255,255,255,.075)` | Glass borders |
| `--text` | `#F3F1FA` | Primary |
| `--muted` | `#9590AC` | Secondary — a violet-biased neutral, not a pure grey |
| `--aurora-1/2/3` | `#FF7AC6` / `#A78BFA` / `#5B9DFF` | Recommended ring, logo mark, send button — **nowhere else** |
| `--ok` / `--warn` / `--pending` / `--done` | `#4ADE80` / `#FBBF24` / `#8B98A8` / `#5B9DFF` | Semantic status, kept separate from aurora |

The ambient field is three radial lobes (blue top-left, violet bottom-right, pink bottom-centre) that
drift slowly and parallax on pointer movement.

### 5.2 Type

Two faces, both installed as local packages (`@fontsource-variable/geist`,
`@fontsource-variable/geist-mono`) and bundled by Vite — **no font CDN link**, so there is no silent
fallback and no network dependency during a live demo.

- **UI — Geist Variable.** Headings, body, labels. Deliberately not Inter: Inter is the default every
  comparable tool reaches for, and D2 committed to a redesign. The greeting is set large at weight 500
  with `-0.035em` tracking; that tight optical setting is the display treatment.
- **Mono — Geist Mono Variable**, with `font-variant-numeric: tabular-nums`. Used for every result,
  count, endpoint, coverage figure, file path and code block. Digits that sit in columns must line up.

Only two faces, sans + mono, is the intended system rather than an omission. A decorative display face
would read as costume on a developer workspace; the character here comes from the ambient field and the
mono/tabular data treatment, not from a third typeface.

Uppercase labels (`PLAYGROUND`, `AAVA`, evidence sources) carry `letter-spacing: .15em–.19em`.

### 5.3 Motion

| Moment | Treatment |
| --- | --- |
| Start → Conversation | Task cards carry a shared `layoutId` and physically fly from the 3-up grid into the right rail. This executes the doc's *"They don't disappear — they relocate"* literally. |
| Start/Conversation → Split | Playground enters from the right; chat column narrows in the same spring. |
| Composer | Sits outside the animating region. Never moves, resizes or animates — it is the anchor of the screen. |
| Prep list | Rows stagger in after AAVA's line lands. |
| Reply | Three dots, ~600ms, then text. Never instant. |
| Aurora ring | `@property --aurora-angle` rotated through a conic gradient border. Soft radial bloom behind the card. |
| Terminal | Lines append on their own per-line delays. |
| Reduced motion | All of the above collapse to instant; the ambient field stops drifting. |

---

## 6. The T1 journey

Task: **AAVA-2841 · Add feedback form to AAVA** — status Partially Done, 2 hrs, P1, no dependency,
recommended (carries the ring).

### 6.1 Entry

Click the ringed card (or its row in the task rail, or its card in the task window — three triggers,
identical behaviour). Arrangement moves to Split, a user message `Let's work on: Add feedback form to
AAVA` is appended, and the task is added to Threads.

### 6.2 Beat 0 — prep

AAVA: *"I have done some pre-work."* followed by ten collapsible rows. Each row shows tick, label and
result; expanding reveals the detail and an **Open evidence** action that switches to the Evidence tab,
scrolls the matching block into view and highlights it.

| # | Label | Result |
| --- | --- | --- |
| 1 | Read Jira | AAVA-2841 |
| 2 | Identified image from Figma | Feedback Form v3 |
| 3 | Verified PLAY components | 6 needed |
| 4 | Identified build vs use | 4 reused · 2 built |
| 5 | Verified API contract | POST /api/v1/feedback |
| 6 | Identified code from repo | src/app/feedback/ |
| 7 | Injected the feedback form | 7 files changed |
| 8 | Ran unit tests | 11 passed · 87% |
| 9 | Checks passed | build · lint · contract |
| 10 | Prep is ready | awaiting your review |

Closes with *"Nothing is pushed. Ask me to run it when you want to see it."*
Chips: `Run it` · `What's not covered?`

### 6.3 Beat 1 — run

Unlocks and switches to Preview. Run state → live. Terminal boots (`npm install` → `npm run start` →
compiled → `Local: http://localhost:4200`). Preview shows a **genuinely interactive** feedback form:
1–5 rating, comment with live 0/500 counter, Submit. Submitting with a missing rating or empty comment
raises a toast naming the assumption; a valid submit shows a stubbed success state.
Chips: `What's not covered?` · `Move Submit below the comment`

### 6.4 Beat 2 — coverage

Four blocks: **Done** (6 items) · **Not done** (file attachments — in the Figma frame but not in the
acceptance criteria; anonymous submission — no field in the API contract, blocked on the platform team)
· **I assumed** (3 items) · **Open scenarios** (4 items).
Chips: `Move Submit below the comment` · `Raise the PRs`

### 6.5 Beat 3 — move

AAVA: *"Moving Submit below the comment field. One file."* Code tab switches to version 1 of
`feedback-form.component.html` with the moved line highlighted; the file gets a changed marker. Preview
hot-reloads with Submit relocated. Diff tab unlocks with badge `1`. Terminal appends
`✓ Compiled successfully. Reloading...`.
Chips: `Raise the PRs` · `Show me the diff`

### 6.6 Beat 4 — ship

Two-repo confirmation card:

- **PLAY** — `feat/play-formfield-charactercounter → main` — FormField, CharacterCounter
- **Product** — `feat/AAVA-2841-feedback-form → develop` — Feedback page, API integration, 11 specs

On accept: run state → shipped ("In review"), PR links **#218** and **#1043**, T1 flips to Done in the
task rail, task window and thread, and AAVA notes the thread is saved and resumable.

### 6.7 Playground surfaces

`Evidence` (10 keyed blocks, one per prep row, including the Figma frame which opens full-size) ·
`Preview` (browser chrome + live app + terminal) · `Code` (file switcher + syntax-highlighted body) ·
`Tests` (11 specs with timings + 87% coverage against an 80% gate) · `Diff` (two repo groups).

Preview and Diff start disabled and unlock via beats.

### 6.8 Non-modelled tasks

T2–T6 open the Split arrangement with the playground shell and an honest message: the pre-work has not
been done for this one; T1 is the modelled scenario in this prototype.

---

## 7. File structure

```
src/
  App.tsx                       one screen, three arrangements
  state/
    types.ts                    AppState, Effect, Scenario, Task
    reducer.ts                  arrangement changes + effect interpreter
    useJourney.ts               hook: dispatch, effect queue, timing
  scenarios/
    index.ts                    registry
    t1.ts                       ← t2.ts, t3.ts land here on the 11th
  components/
    chrome/                     Rail · Topbar · Composer   (never unmount)
    start/                      Hero · TaskCard · AuroraRing
    chat/                       Thread · Message · TypingDots · PrepList · Chips · Blocks
    playground/                 Playground · Tabs · Evidence · Preview · FeedbackApp ·
                                Terminal · Code · Tests · Diff
    overlays/                   TaskWindow (kanban) · Threads · Toast · Lightbox
    ambient/                    AmbientField
  design/
    tokens.css                  colour, type, spacing, radii, easing
    fonts.css                   @fontsource-variable imports (Geist, Geist Mono)
```

Rail, Topbar and Composer are mounted once outside the arrangement-switching region so law #3 holds
structurally, not by convention.

---

## 8. Testing

One runnable check: a test that drives T1's complete beat sequence through the reducer and asserts the
end state — both PRs raised, T1 marked `done`, Preview and Diff enabled, `feedback-form.component.html`
on the moved-submit version, run state `shipped`.

This is deliberately the only test. It is the smallest thing that fails if the demo breaks, and it runs
without mounting React because the journey is data. No component-level suites, no fixtures.

---

## 9. Out of scope

- No API calls, no backend, no persistence, no auth.
- No real Jira, Figma, GitHub or PLAY integration — all evidence is authored data.
- No routing, no SSR, no deployment configuration.
- T2–T6 remain shells (§6.8).
- Notifications, Search and Pinned are visible but inert.
- Concurrent task threads are not built (D6).
- Mobile layout is not designed. The deck positions mobile as a separate surface
  ("Mobile for action. Web for admin and reporting."); this prototype is the web workspace. It targets
  desktop widths from 1280px up.

---

## 10. Resolved open calls

Both open calls listed in `Common_Journey_v0.docx` §"Open calls" are resolved here:

1. *Clicking another task mid-execution — blocked, or a new thread?* → **Blocked, with a disabled
   "Open as a separate thread" affordance visible** (D6).
2. *Sidebar icons — undecided.* → **Search, Threads, Pinned** (D8).
