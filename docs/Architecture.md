# AAVA 3.0 — Architecture

How the AAVA 3.0 prototype is put together: the **five‑zone frame** it is built
on, the **design elements** that live in each zone and how they behave, the
**behaviour engine** that drives them, and the **design principles** everything
answers to.

This is the companion to [`microinteractions.md`](./microinteractions.md): that
document catalogues the small motions; this one is the structure they sit inside.
Every section names the files it describes, so the doc and the code stay honest
with each other.

Read it two ways:

- **Top‑down** if you're new — start at §1 (the model) and §2 (the map).
- **By zone** if you're touching one surface — jump to its section (§4–§8),
  which lists that zone's inventory and each element's behaviour.

---

## 1. What AAVA 3.0 is

AAVA 3.0 is a working prototype of **"The Experience Engine" (TEE)** — an
agentic assistant whose interface is not a pile of screens but **one frame of
five fixed zones**, re‑arranged per device by folding or dissolving zones rather
than by drawing new layouts.

The product argument the prototype dramatises: **work finds you.** Agentic
processes run ahead of the user (on a Jira webhook, before anyone sits down),
produce evidence a human can check, and **stop at the calls a human must make**
(human‑in‑the‑loop gates). Two demo runs carry this:

- **T1 — "Add product feedback form"** — finished work: everything ran, the run
  is parked on the review gate, approve the PRs. (`src/scenarios/t1.ts`)
- **T7 — "Migrate the refunds API to the v2 schema"** — the run that *stopped*:
  a validator found two undecidable fields and the chain paused at a gate rather
  than guessing. (`src/scenarios/t7.ts`)

Alongside the task runs there are two **object flows** driven from the composer:
a PRD authoring flow and a PRD‑to‑backlog (Epics → Features → Stories → Jira)
flow, both human‑in‑the‑loop. (`src/prd/*`)

### Tech stack

| Concern | Choice |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 + CSS custom‑property design tokens (`src/design/tokens.css`) |
| Motion | `motion/react` (springs, `AnimatePresence`, `useAnimationControls`), measured morphs via a local `useMeasure` |
| Layout | `react-resizable-panels` (the three‑column shell) |
| Editor | Monaco (the Canvas code view) |
| State | one `useReducer` store + an effect/beat interpreter (no external state lib) |
| Tests | Vitest (65 tests) · lint via oxlint |

---

## 2. The map — how the frame is assembled

At the top, `App.tsx` composes everything through `WorkspaceShell` and a single
journey hook.

```
App.tsx
├─ useJourney()                      ← the whole store + actions (state/useJourney.ts)
├─ AmbientField                      ← ambient background (start surface)
└─ WorkspaceShell                    ← the 3‑region resizable frame (layout/WorkspaceShell.tsx)
   ├─ sidebar:  <Sidebar/>                         → ZONE 1 (Sidebar)
   ├─ main:     <StartView/> | <ConversationView/> | <TasksView/>
   │             └─ ConversationView                → ZONE 2 (Conversation) + the run dock
   └─ right:    <TabWorkspace/> | <DocumentCanvas/> | <ScenarioGraph/AgentGraph/…>
                 └─ these host                       → ZONE 3 (Canvas), ZONE 4 (Toolbar), ZONE 5 (Watch)
```

`WorkspaceShell` owns a strict division of responsibility that the whole layout
depends on: **React decides whether a region is open (intent); the panel library
decides how many pixels wide it is (geometry).** Nothing else gets an opinion —
there is no CSS width transition or React‑held width fighting the library
mid‑drag. The sidebar collapses to a **70px rail** (`--rail-w`), never to
nothing; the right panel collapses to `0` but **stays mounted** so a task keeps
its tabs, model and scroll positions while the panel is shut.

### The arrangement enum (the running realization)

The live app switches between four top‑level arrangements
(`state/types.ts` → `Arrangement`):

| Arrangement | What's on screen |
| --- | --- |
| `start` | Home: greeting + task board + composer (Sidebar + Conversation only) |
| `conversation` | A task/object thread, right panel collapsed |
| `split` | Thread **and** the right panel (Canvas/Toolbar/Watch) |
| `tasks` | The full task board |

This enum is the *pragmatic* form of the zone model: `start`/`conversation` are
the frame's **rest** mode, `split` is **work** mode. The formal zone engine
(§3, `src/zones/`) encodes the full deck and is wired in for the object flows;
the task flows still resolve through the arrangement enum. See §9 for the honest
wired‑vs‑foundational split.

---

## 3. The five‑zone model (the spine)

Source of truth: the TEE deck. Encoded in code under `src/zones/`
(`types.ts`, `resolve.ts`, `Zone.tsx`) and the `--zone-*` tokens in
`src/design/tokens.css`.

### The five zones — and only five

Each zone answers exactly one question and carries one colour identity (dark
tints are the deck's exact fills; a light palette mirrors them):

| # | Zone | Question it answers | Tint (dark) | Accent |
| --- | --- | --- | --- | --- |
| 1 | **Sidebar** | *Where am I?* | `#201C33` | violet |
| 2 | **Conversation** | *What can I do?* | `#0F2723` | green |
| 3 | **Canvas** | *What am I working on?* | `#101F33` | blue |
| 4 | **Toolbar** | *How am I looking at it?* | `#2A1D0F` | amber |
| 5 | **Watch** | *What is happening?* | `#191F27` | slate |

**Elements cannot leave their zone.** Four zones hold a *fixed inventory*; only
the **Canvas** is declarative — what it shows is generated at runtime (a
document, a code workspace, a graph). (`ZONE_QUESTION`, `ZONE_IDS` in
`src/zones/types.ts`.)

### The vocabulary — fold vs dissolve

The engine is one axis, `ZonePresence` (`src/zones/types.ts`):

- **primary** — the zone holds a first‑class position in the frame.
- **folded** — moved to a secondary position, **still present, addressable and
  stateful** (e.g. Sidebar → 70px rail).
- **dissolved** — **removed from the render tree entirely.** Not present, holds
  no state.

`folded` keeps state; `dissolved` does not exist. That distinction is the entire
reason both words are in the vocabulary — none of Zone / Element / Channel /
Surface / Fold / Dissolve are interchangeable.

### Channels and modes

A **channel** is a client AAVA ships to. It declares a *capability*; the engine
resolves the frame against it — the channel never positions a zone itself.
(`CHANNELS` in `src/zones/types.ts`.)

| Channel | Canvas | Runtime | Watch |
| --- | --- | --- | --- |
| **Web** | owned | no | panel |
| **Desktop** | owned | yes | panel |
| **IDE in situ** | **borrowed** (host owns it) | host | dissolved |
| **Mobile** | **dissolved** (conversation only) | no | dissolved |
| **CLI** | dissolved | yes | inline |

Within a channel the user moves between two **modes** (`FrameMode`): **rest** (no
active object — Sidebar expanded, Conversation centred, the rest dissolved) and
**work** (Sidebar folds to a rail, Canvas docks, Toolbar and Watch appear).

Every per‑channel picture in the deck reduces to one function:

```ts
resolveFrame(channel, mode): Frame   // → the presence+appearance of all five zones
presentZones(frame): ZoneId[]        // → the zones that actually render, in order
```

Adding a channel is a capability declaration plus, at most, one clause in
`resolveFrame` — **never a new layout component.** That is what "the same five
zones, folded or dissolved to fit" means in code (`src/zones/resolve.ts`).

---

## 4. Zone 1 — Sidebar · *"Where am I?"*

`src/components/chrome/Sidebar.tsx` · tint `--zone-sidebar-tint`

Navigation and identity. Present on every channel; **folds to a 70px icon rail**
in work mode rather than dissolving, so the app never loses its "where am I".

**Inventory**

- **Home / New session**, **My Tasks**, **Search** (opens the search overlay).
- **Recents & Pinned threads** — the thread list; pin toggles per thread.
- **Account menu** — current profile, a **Switch profile** row (Deepak · Admin ↔
  Raman · Product Manager), Settings, and a theme toggle. The popover is
  **portalled to `document.body`** so the panel's own overflow can't clip it when
  the nav is a rail.

**Behaviour**

- **Rail vs expanded** follows `state.sidebarOpen` directly. Opening a task or
  object sets `sidebarOpen: false`, so **entering the playground auto‑collapses
  the nav to the rail** (the work is the screen); the user can re‑expand it and
  it stays put.
- **Intent vs geometry** — the toggle sets intent; `WorkspaceShell` reconciles it
  with the drag geometry so a drag past the minimum collapses to the rail and
  reads back as intent, without the two sources fighting.

---

## 5. Zone 2 — Conversation · *"What can I do?"*

`src/components/chat/ConversationView.tsx` (+ `Thread`, `Message`, `Blocks`, and
the run dock) · tint `--zone-conversation-tint`

The primary zone and the richest. It is the message stream, the agent's visible
reasoning, the human‑in‑the‑loop gates, the run status dock, and the composer.
On mobile this zone carries the whole frame (Canvas dissolved).

### 5.1 The session header

A thin bar with a subtle bottom hairline (`border-b`, `px-6 pb-3 pt-4`) that
turns the header into a rail the **run dock hangs from**. It carries the session
name + the attached source pill (e.g. `PRD_v2.4.docx`), and **edge toggles** on
the right: **Execution activity** (the graph), **Files in this session**, and the
way back into the workspace.

### 5.2 Agent presence — making the reasoning visible (P1)

- **Thinking dots** (`TypingDots.tsx`) — three dots on a staggered 1.2s loop
  while AAVA composes, before any text exists.
- **Streamed text** (`StreamedText.tsx`) — replies reveal **word by word** with a
  live caret; a `finished` set guarantees each line streams **once, ever**, so
  remounting a thread never re‑types it.
- **Tool‑step accordions** (`ToolSteps.tsx`) — see §5.5.

### 5.3 Message blocks — the attachment vocabulary

A message can carry one typed **block** (`BlockSpec` in `state/types.ts`,
rendered in `Blocks.tsx`). One vocabulary, reused across every flow:

| Kind | What it is |
| --- | --- |
| `tools` | a run of tool calls → the thinking‑to‑done accordion (§5.5) |
| `capability` | "Capabilities matched" — which agentic process took the task, as a collapsible record + a badge (e.g. `USG-1.0`, `SMA-2.0`) + capability chips |
| `plan` | the numbered plan; collapsible record, or an "Initiate Process" card with a Proceed action |
| `validation` | a validator's scoreboard — tests / passed / failed / warnings + the failing checks; clicks through to the Tests tab |
| `app` | the generated app, shown as a live inert miniature + "Open" |
| `coverage` | Done / Not done / I assumed / Open scenarios groups |
| `document` | an artefact card (name + format + Open) → opens it in the Canvas |
| `links` | file links (open in the workspace) and external hyperlinks |
| `sync` | a "Push to Jira" offer — primary (Publish) + secondary (Skip) |
| `connect` | a connector card (e.g. Azure DevOps: search → Connect → connecting → connected) |
| `decision` / `confirm` | the human‑in‑the‑loop gates (§5.6) |

**Collapsed records.** `capability` and `plan` support a `collapsed` variant
(`SubtleRecord`) — a one‑line header (icon · title · badge · chevron) that opens
to its detail. Pre‑filled runs use these so already‑done work reads as quiet
context, not a front‑and‑centre card.

### 5.4 The run dock (task progress) — Dynamic‑Island style · P2, P3

`src/components/chat/RunStrip.tsx` — the marquee element.

- **What** — a compact, centred capsule that **hangs from the session‑header
  hairline**: flat top merged into the line via two concave corner *fillets*
  (a CSS `radial-gradient` mask), deeply rounded bottom — a *dock*, not a
  floating pill. It carries a **pulsing status dot**, the current‑step label, a
  `done/total` count, and a chevron.
- **Colour = state** (P5): the dot and label are **blue `#5B9DFF` while a step is
  running**, **amber `--warn` while the step is a gate waiting on you** — and the
  label **shimmers only in the waiting state**.
- **Expand ≠ swap** (P3): clicking it does not open a separate panel; the *same
  shell* **springs its measured width and height downward** into the full step
  list — one continuous surface. It floats over the conversation (absolute, over
  a reserved collapsed‑height slot) so opening it **never reflows the chat**.
- **Row markers**: green check (done) · pulsing dot in a ring (current, blue/amber)
  · clock (ahead). Clicking a row opens that step's evidence/document.
- **Entrance**: drops down out of the header (`y:-14 → 0`, ~550ms) when the run
  starts.
- **One dock, both flows.** The backlog object flow drives it from
  `backlogProgress(messages)`; the scenario task flow drives it from the
  scenario's `prep` steps + `playground.prepAt`. `App.tsx` builds
  `taskProgress = { steps, at, waiting }`; `waiting` is true only when the
  current step is a gate.

> `TaskProgress.tsx` is the earlier above‑the‑composer version, superseded by the
> hanging dock and no longer mounted.

### 5.5 Thinking accordions (tool steps) — P1, P2

`src/components/chat/ToolSteps.tsx`

- **What** — a run of tool calls, each row `pending → running → done`. Running is
  a **spinner ring**; done is a **green ✓** with the result it returned. Given a
  `title`, the whole run is a **collapsible accordion**: open and spinning while
  working, then **auto‑folds to a one‑line summary** (`n/n`, chevron to reopen)
  the moment it completes.
- **Why** — this is what makes AAVA read as an *agent fetching what it needs*
  rather than a chatbot guessing. Auto‑folding keeps a finished sequence from
  cluttering the transcript while leaving it one click away.
- **Pacing is meaningful, not uniform.** Each row resolves on its own measured
  latency (`state/timing.ts`), so a build visibly costs more than a Jira fetch.
  **Prepared work** — steps that already ran before the user arrived — is emitted
  with zero delay, so a finished run's accordions appear **already complete**
  with no fake loading (this is how T1 opens straight on its review gate, and T7
  opens straight on step 3).

### 5.6 Human‑in‑the‑loop gates (HITL blocks) — P3, P4

`src/components/chat/Blocks.tsx` (`confirm`, and `Decision` → `ButtonsGate` /
`ClarifyGate` / action / approve variants).

A gate is **not just another card** — while live it is the only thing on screen
that can move the run, and it is treated so:

- **Golden border while live.** A `warn`‑bordered card headed **"Waiting on you ·
  Step N"** with a person glyph; once answered it settles back to a plain record
  headed **"Answered"**.
- **Answer where you type** (P4). The live gate is **pinned into the composer's
  place** — it *replaces the prompt bar* — via `pinnedGate` in
  `ConversationView` (the newest live `decision`/`confirm` message). The prompt
  bar is always present otherwise; only a live gate replaces it, and the answered
  gate drops back into the thread as a record. Push/connect cards stay inline —
  only decision/confirm pin.
- **Right‑aligned footer.** Secondary on the left, **primary on the right**,
  primary is plain **white on `--text`** (no gradient) — the same footer treatment
  across `confirm` and the decision gates.
- **Morph, don't sprout** (P3). Choosing an option that needs a note doesn't add
  a fourth button — the two options are **replaced in place** by a textarea +
  **Cancel / Send** on the same footprint. Cancel restores the buttons; Send
  records the note (shown back as "Your note" on the retired gate) and fires the
  beat.
- **Clearing a gate advances the run.** The accept beat moves `prepAt`
  step‑by‑step to the next gate (each intermediate step goes blue in the dock,
  with real delay, before parking on the next gate — never a jump). A gate can
  also be cleared **by typing** an approval; the engine resolves *which* gate from
  where the run is parked (`acceptBeatAt`), so approval words stay out of the
  router.
- **Re‑asking is free.** Reading around a gate (asking for the diff, the
  validation, what's open) re‑appends the gate to the bottom via `withGate`, so
  reading never costs you the gate.

### 5.7 Composer, chips, and the changes tray

- **Composer** (`chrome/Composer.tsx`) — the prompt bar: a `+` menu (files +
  connector toggles), model dropdown, effort selector, voice, send. The draft and
  the model/effort/connector/file settings live in `App.tsx` **above** the
  arrangements so they survive the composer's remount when the layout changes.
- **Suggestion chips** (`chat/Chips.tsx`) — fade‑and‑rise in with a 40ms stagger;
  a chip already taken doesn't come back (read off the thread's own user
  messages, not a separate list).
- **Changes tray** (`ConversationView` → `ChangesTray`) — pending inline‑comment
  edits **stack above the prompt bar** with Discard / Apply; Apply lifts them into
  the conversation as a turn.

---

## 6. Zone 3 — Canvas · *"What am I working on?"*

tint `--zone-canvas-tint`. The **only declarative zone** — its content is
generated at runtime. It mounts in the right panel and takes three forms
depending on the flow (`App.tsx` `right={…}`, keyed off `canvasMode`):

### 6.1 The workspace Canvas (task flows)

`src/components/playground/TabWorkspace.tsx` + `TabContentRegistry.tsx`

A tabbed workspace (flexlayout‑style) hosting the artefacts of a task run:

- **Code** (`Code.tsx`, Monaco) · **Preview** (`Preview.tsx`, the running app) ·
  **Tests** (`Tests.tsx`) · **Diff** (`Diff.tsx`) · **Evidence** (`Evidence.tsx`).
- Which tabs exist is resolved per scenario (`state/workspace.ts`) — e.g. T7
  ships no preview (no page to render) but does ship Tests.
- Stays **mounted for the whole task** even when the panel is collapsed, so tabs
  and scroll survive.

### 6.2 The document Canvas (object flows)

`src/prd/DocumentCanvas.tsx`

The Claude/Manus‑style artefact panel for PRD and backlog documents:

- **Preview / Code** segmented pill (one control that reshapes — active = icon +
  label, inactive = icon only, label glides away).
- Toolbar actions: **Share**, **Expand** (fullscreen overlay), **Download ▾**
  (Markdown real Blob / PDF / DOCX), **History** (timestamped versions,
  Preview/Restore), **Close**.
- **Filename dropdown** — the filename is itself the switcher (`FileSwitcher`),
  listing the session's documents.
- **Inline comments** — arming Comment lets you select text; the passage is
  painted via the **CSS Custom Highlight API** (`::highlight(aava-comment)`, no
  DOM surgery) with a **numbered marker** matching the changes tray.
- Renders a "Drafting…" placeholder until the document is ready; the panel only
  mounts once a document exists, so intake/thinking runs against the conversation
  alone first.

### 6.3 The Execution‑activity graph & the files list (Canvas overlays)

Opened from the header edge toggles, these **overlay** the Canvas as an opaque
layer (so the tab layout survives switching to them and back):

- **Execution activity** — `ScenarioGraph.tsx` (task flows) / `AgentGraph.tsx`
  (object flows). The agent topology, **state‑driven not random**: grey while
  planning; only the agent *genuinely running* carries a pulsing stroke and a
  flowing edge; done nodes go green, a gate node goes amber (`REVIEW`), the rest
  read `QUEUED`. `AgentGraph` derives every node's state from the message history
  with zero timers (`deriveRun`).
- **Files in this session** — `ScenarioFiles.tsx` / `FilesPanel.tsx`. The
  artefacts the run produced (read off the `document` cards, deduped, newest
  first); picking one opens it in the Canvas.

On **IDE in situ** this whole zone is *borrowed* (surrendered to the host); on
**mobile/CLI** it is *dissolved* and preview is delegated by reference.

---

## 7. Zone 4 — Toolbar · *"How am I looking at it?"*

`src/zones/Toolbar.tsx` (+ `objects.ts`, `toolbarIcons.tsx`) · tint
`--zone-toolbar-tint`

"How am I looking at the current object" — the **view switcher** for the Canvas.
The zone's principle: **views come from the object, not from a hardcoded list**
(`viewsFor(kind)` → a PRD exposes document/stories/requirements/…; an app exposes
preview/code/diff/tests/evidence), and each view's availability resolves per
channel (`availabilityOf` — a render view on a dissolved‑canvas channel is
*delegated* ↗, code/diff on IDE is *native*).

In the running app the Toolbar is **folded into the surfaces it controls** rather
than standing as a separate strip: the `TabWorkspace` tab bar, the
`DocumentCanvas` Preview/Code pill and filename dropdown, and the header edge
toggles (Execution activity / Files) are the Toolbar's realized inventory. The
standalone `Toolbar.tsx` (segmented, responsive icon/label collapse, delegated
views shown with ↗) is built and tested for the channel‑switching future.

---

## 8. Zone 5 — Watch · *"What is happening?"*

`src/zones/WatchBar.tsx` · tint `--zone-watch-tint`

The run log, as a **thin always‑present bar at the foot of the workspace**:

- **Collapsed** — one line showing the latest entry + a status dot.
- **Expand** — click to reveal the full append‑only log (`max-h 168px`, live‑edge
  scroll).
- **Auto‑opens on trouble** — the moment a `warn` (error/retry) entry lands, the
  bar opens itself and the dot turns amber; that is the one time the log needs to
  be seen without being asked for.
- **Never interactive beyond expand/collapse.** Append‑only, tone‑coloured
  (`info` / `ok` / `warn`), fed by the `watch` effect.

On channels where it doesn't belong it changes form per capability: **panel** on
Web/Desktop, **inline** on CLI, **dissolved** on IDE (the host owns its console)
and Mobile.

---

## 9. The behaviour engine

The zones are the *what*; this is the *how it moves*. All of it lives in
`src/state/` and the flow scripts in `src/scenarios/` and `src/prd/`.

### 9.1 One store, one interpreter

- **`state/reducer.ts`** — a single `useReducer` store. Actions mutate state
  (`OPEN_TASK`, `OPEN_OBJECT`, `USER_SAY`, `APPLY`, `SET_TAB`, `SET_SIDEBAR_OPEN`,
  `RESUME_THREAD`, …). Opening a task/object also collapses the sidebar and seeds
  the playground.
- **`state/useJourney.ts`** — the interpreter. It exposes `send`, `openTask`,
  `runBeat`, etc., and a `play(effects)` loop that schedules **Effects** on a real
  clock via `after(ms, …)`.

### 9.2 Effects and beats

A **beat** is an ordered list of **Effects** — the script's unit of playback:

- `say` (a message, streamed or instant), `tools` (a tool‑step accordion),
  `prepAt` (advance the run to a step), `runState`, `showTab`, `watch`,
  `chips`, `wait`, `setDoc`/`openPanel`/`prdPhase`, …
- Latency is deliberately **non‑uniform** (`state/timing.ts`): a bare ack returns
  fast, a reasoned answer costs think‑time, each tool carries its measured
  duration scaled by a single `SPEED` dial so ratios stay truthful. A
  `prefers-reduced-motion` path collapses every delay to ~0.
- `stream: false` marks **prepared work** — it lands whole, with no typing
  indicator, because it was finished before the user arrived.

### 9.3 Runs, steps and gates

A **scenario** (`Scenario` in `state/types.ts`) declares `prep` steps
(`PrepStep`: key, label, result, detail, optional `pending`/`gate`), the
`evidence` behind each step, its `files`, `beats`, `chips` and a `router`.

- `playground.prepAt` is where the run is parked. The **first `pending` step** is
  the opening park point.
- A step with a `gate` is a human stop: the run halts there, and that gate's beat
  is **replayed after every answer** (`withGate`) until it's cleared.
- Clearing a gate advances `prepAt` **one step at a time** to the next gate, each
  intermediate step going blue in the dock with real delay.

### 9.4 Routing what the user types

`send` (in `useJourney.ts`) resolves a typed message in order: object flows
(PRD/backlog) first; then, inside a task, an **approval at the parked gate**
(`acceptBeatAt` + an anchored `APPROVES` regex — approval words are kept out of
the router so they can't clear a gate you were only asking about); then the
scenario `router`; then an **out‑of‑scope** check that offers a new thread rather
than answering off‑context; then the fallback.

---

## 10. Design principles

Everything above answers to seven rules, documented in full (with the motion
vocabulary table) in [`microinteractions.md`](./microinteractions.md) §1.
In brief:

| | Principle | In this architecture |
| --- | --- | --- |
| **P1** | Make the reasoning visible | streamed text, thinking dots, tool accordions, the state‑driven Execution graph (§5.2, §5.5, §6.3) |
| **P2** | Keep run status in view | the hanging run dock + the pinned gate; Watch always present (§5.4, §8) |
| **P3** | Morph, don't swap | dock expand, gate → Cancel/Send, Preview/Code pill (§5.4, §5.6, §6.2) |
| **P4** | Answer in place | the live gate replaces the composer (§5.6) |
| **P5** | Give each motion one meaning | dot = running (blue), shimmer = waiting (amber), spinner = tool, check = done, flowing edge = active path |
| **P6** | Motion is additive, never required | streamed text never replays; morphs animate measured px, not scale; every animation has a reduced‑motion path |
| **P7** | Keep it quick and quiet | 150–350ms tweens; springs only where a thing should feel physical (the dock, a pill) |

**Colour identity** doubles as principle: each zone owns one hue
(`--zone-*-accent`), and the state colours (blue running / amber waiting / green
done) are constant across every surface, so a colour never means two things.

---

## 11. Wired vs foundational — an honest status

The prototype **evolves in place** (it stays runnable at every step), so some of
the zone engine is fully driving the UI and some is built‑and‑tested ahead of
being wired:

| Piece | Status |
| --- | --- |
| Five zones as colour‑identified surfaces (`--zone-*`) | **wired** — tokens used by Watch, graphs, dock, gates |
| Conversation zone + all message blocks + run dock + HITL gates | **wired** |
| Canvas (TabWorkspace, DocumentCanvas, graphs, files) | **wired** |
| Watch bar | **wired** (panel form) |
| Sidebar (fold to rail) | **wired** |
| `resolveFrame` channel/mode engine (`src/zones/`) | **foundational** — encodes the full deck; object flows use it, task flows still resolve through the `Arrangement` enum |
| Channel switching (mobile/IDE/CLI variants) | **foundational** — capability table + resolver exist; no runtime channel picker yet |
| Toolbar as a standalone zone (`Toolbar.tsx`) | **foundational** — folded into the tab bar / pill / edge toggles in the live UI |
| Schema‑emitted Canvas (model emits data, Canvas plots certified widgets) | **not built** — Canvas content is authored, not schema‑plotted |

---

## 12. Where things live

```
src/
├─ App.tsx                     the composition root (§2)
├─ design/
│  ├─ tokens.css               colours, radii, durations, --zone-* identities
│  └─ motion.ts                easeOut, fadeUp/slideIn/stagger presets
├─ zones/                      THE ZONE MODEL (spine)
│  ├─ types.ts                 ZoneId, presence, channels, modes
│  ├─ resolve.ts               resolveFrame() + presentZones()
│  ├─ Zone.tsx                 the reusable zone block
│  ├─ Toolbar.tsx              the view‑switcher zone (foundational)
│  └─ WatchBar.tsx             the Watch zone (wired)
├─ components/
│  ├─ layout/WorkspaceShell.tsx   the 3‑region resizable frame
│  ├─ chrome/                     Sidebar, Composer, Topbar, icons
│  ├─ chat/                       ConversationView, Thread, Message, Blocks,
│  │                              RunStrip (the dock), ToolSteps, StreamedText,
│  │                              TypingDots, Chips
│  ├─ playground/                 TabWorkspace, Code, Preview, Tests, Diff,
│  │                              Evidence, ScenarioGraph, ScenarioFiles
│  ├─ start/  tasks/  overlays/   home, board, notifications/search/toast
│  └─ ambient/                    the background field
├─ prd/                        object flows: PRD + backlog
│  ├─ flow.ts  backlogFlow.ts     the HITL scripts + backlogProgress()
│  ├─ DocumentCanvas.tsx          the document Canvas
│  ├─ AgentGraph.tsx              Execution‑activity graph (object)
│  └─ FilesPanel.tsx              session files (object)
├─ scenarios/                  task flows: t1 (finished), t7 (stopped)
└─ state/                      reducer.ts, useJourney.ts, types.ts,
                               timing.ts, workspace.ts
```

---

*Keep this document in step with the code: when a zone gains an element, or a
foundational piece gets wired, update its section here in the same change — the
same contract [`microinteractions.md`](./microinteractions.md) holds for motion.*
