# AAVA 3.0 — Micro‑interactions

A catalogue of the small, deliberate motions and state‑changes in the AAVA 3.0
prototype, and the principles behind each one. It exists so that every new
surface reaches for the *same* vocabulary — a pulse always means the same thing,
a morph always beats a swap — instead of re‑inventing feedback per screen.

Read it two ways:

- **Principles first** if you're designing something new — start from *why*.
- **The catalogue** if you're touching an existing surface — find the entry, match its behaviour.

Every entry names the file it lives in, so the doc and the code stay honest with
each other.

---

## 1. Principles

Seven rules govern the interactions in this document. Each entry in the
catalogue applies one or more of them; a new interaction that maps to none of
them is probably unnecessary.

### P1 — Make the reasoning visible
AAVA shows how it reaches an answer, not only the answer itself.

A response that appears fully formed reads as scripted. The interface therefore
exposes the intermediate steps: text streams in as it is generated, tool calls
resolve from pending to done, and the agent currently running is highlighted.
This motion reports progress; it is not decoration.

> Applies to: streamed text, thinking dots, tool steps, execution‑activity graph.

### P2 — Keep run status in view
The state of an active or parked run is always on screen.

Whether a run is waiting on the user, and at which step, should never require
scrolling back through the transcript to find. Progress is pinned near the
header and the composer. It can be collapsed to a single line, but it is never
lost.

> Applies to: the run dock, task progress, the pinned gate.

### P3 — Morph, don't swap
When a control changes role, the same element reshapes into its new form.

A capsule that expands stretches into a panel rather than being replaced by one.
A pair of option buttons that need a text field are replaced in place by a
Cancel/Send pair on the same footprint. Reshaping the existing element keeps the
user's attention on it; replacing one element with another forces them to locate
it again.

> Applies to: the run dock expand, gate → Cancel/Send, plan → edit, Preview/Code pill.

### P4 — Answer in place
The control for responding sits with the thing being responded to.

A decision that needs the user's input takes over the composer rather than
appearing as another card in the stream. The question and the field for
answering it occupy the same place, so it is clear both what the user is acting
on and where to act.

> Applies to: the pinned gate in the composer slot, task progress joined to the composer.

### P5 — Give each motion one meaning
Motion is a fixed vocabulary: each kind of movement signals one thing, and that
mapping does not vary between surfaces.

| Motion | Meaning | Colour |
| --- | --- | --- |
| **Pulsing dot** | the step running now | blue `#5B9DFF` |
| **Shimmer on a label** | waiting on the user | amber `--warn` |
| **Spinner ring** | a tool call in flight | muted |
| **Green check** | done or confirmed | `--ok` |
| **Flowing edge** | data moving along the active agent path | blue |
| **Clock icon** | a step ahead, not yet started | muted‑deep |

To signal something new, add a row deliberately rather than reusing an existing
motion for a second purpose.

### P6 — Motion is additive, never required
No interaction depends on animation to function, and motion never repeats or
distorts content.

- **Never replays** — streamed text completes once per line and does not re‑type
  when a thread remounts.
- **Never distorts** — morphs animate measured width and height, not a scale
  transform, so text does not stretch.
- **Always degrades** — every animation has a `prefers-reduced-motion` path that
  falls back to a near‑instant transition or a static state.

> Applies to: every interaction. This is the baseline, not a feature.

### P7 — Keep it quick and quiet
Feedback is fast and restrained, physical only where that is the point.

Transitions run in roughly 150–350ms, eased and understated. Springs are
reserved for elements that should feel physical — the dock dropping into place, a
pill sliding — and everything else uses a plain tween. Nothing animates longer or
louder than its purpose requires.

> Applies to: the shared motion tokens every surface draws from.

---

## 2. Motion foundations

One shared vocabulary, defined once, so surfaces stay in sync.
(`src/design/tokens.css`, `src/design/motion.ts`.)

### Durations & easings (`tokens.css`)
| Token | Value | Use |
| --- | --- | --- |
| `--dur` | `180ms` | default transition |
| `--dur-exit` | `110ms` | exits (leave faster than you enter) |
| `--ease` | `cubic-bezier(.22, .61, .36, 1)` | general ease |
| `--ease-out` | `cubic-bezier(.16, 1, .3, 1)` | reveals, expands |
| `--spring-fast` / `--spring-slow` | `180ms` / `340ms` | spring‑ish timings |
| radii | `--r-sm 8` · `--r-md 12` · `--r-lg 16` · `--r-pill 999` | corner language |

### Shared helpers (`motion.ts`)
- `easeOut = [0.16, 1, 0.3, 1]` — the canonical reveal curve.
- `fadeUp(y)` / `slideIn(x)` / `stagger(i)` — enter/exit presets that already
  carry their reduced‑motion fallbacks, so no surface hand‑rolls magic numbers.
- `slideIn` uses a spring (`stiffness 260, damping 30`) — the physical default.

### Press affordance (`index.css`)
`.press` → `transform: scale(0.97)` on `:active`. Every button that should feel
tactile gets this one class. Universal, tiny, consistent.

### Reduced motion (`tokens.css`)
A global guard collapses `animation-duration` and `transition-duration` to
`~0ms` under `prefers-reduced-motion: reduce`; individual components additionally
short‑circuit their JS‑driven motion (e.g. streamed text renders whole, the dock
skips its spring). Motion is always additive, never load‑bearing.

---

## 3. The catalogue

### 3.1 Agent presence — make the reasoning visible (P1)

#### Thinking dots
`src/components/chat/TypingDots.tsx`
- **What** — three dots fade `.25 → 1 → .25` on a staggered 1.2s loop while AAVA
  composes.
- **Why** — the smallest possible "it's alive and working" tell, before any text
  exists to stream. (P1)

#### Streamed text
`src/components/chat/StreamedText.tsx`
- **What** — replies reveal **word by word** (not character by character), with a
  blinking caret at the live edge; per‑word delay is derived from the character
  rate, so long words take longer.
- **Why** — text that appears fully‑formed is the strongest "this is canned"
  tell. Word‑level reveal matches how tokens actually arrive and avoids the
  typewriter‑toy feel. A `finished` set guarantees each line streams **once,
  ever** — remounting a thread never re‑types it. (P1, P6)

#### Tool steps — thinking → done accordion
`src/components/chat/ToolSteps.tsx`
- **What** — a run of tool calls, each row `pending → running → done`. Running =
  a spinner ring (`tool-spin .7s linear`); done = a green `✓` with the result it
  returned. Given a title, the whole run is a collapsible accordion that is
  **open while working and auto‑folds to a one‑line summary** (`n/n`, chevron to
  reopen) the moment it completes.
- **Why** — this is what makes AAVA read as an *agent* fetching what it needs
  rather than a chatbot guessing. Auto‑folding keeps a finished sequence from
  cluttering the transcript, while leaving it one click away. (P1, P2)

#### Execution‑activity graph
`src/prd/AgentGraph.tsx`
- **What** — the agent topology. State is **derived from the run**, not random:
  everything grey while planning; only the agent that is *genuinely running*
  carries the pulsing stroke and a flowing edge; done nodes go green, a gate
  node goes amber (`REVIEW`), the rest read `QUEUED`.
- **Why** — an honest picture of who is doing what. Random blinking would be
  theatre; state‑driven motion is information. (P1, P5)

---

### 3.2 Run status — always in view (P2)

#### The run dock (Dynamic‑Island style)
`src/components/chat/RunStrip.tsx`
- **What** — a compact, centred capsule that **hangs from the session‑header
  hairline** (flat top merged into the line, rounded bottom — a dock, not a
  floating pill). It carries: a **pulsing status dot** (blue while a phase
  drafts, amber while it waits on you), the current‑phase label (which
  **shimmers only in the waiting state**), a step count, and a chevron.
- **Expand** — clicking it does **not** reveal a separate panel; the *same shell*
  springs its **measured** width and height downward into the full phase list —
  one continuous surface. It floats over the conversation (absolute, over a
  reserved collapsed‑height slot) so opening it never reflows the chat.
- **Entrance** — on *Proceed* it drops down out of the header (`y:-14 → 0`, 550ms
  ease).
- **Row markers** — green check (done) · pulsing dot in a ring (current) · clock
  (ahead) · a `YOU` badge on gate steps.
- **Why** — the run's state is the most important thing on screen, so it lives at
  a fixed, glanceable spot attached to the header. The morph (P3) and the
  measured sizing (P6) keep the expand from feeling like a second object
  appearing. The dot/shimmer split is the motion vocabulary doing its job (P5).

#### Task progress (scenario runs)
`src/components/chat/TaskProgress.tsx`
- **What** — a collapsible progress panel **joined to the composer** (shared
  tinted surface, no gap). Collapsed, it's one line: the step you're on. A thin
  fill bar carries the `done/total` even when shut. The current gate reads
  *"Waiting on you"* (amber) only when it genuinely is; mid‑generation it reads
  *"Drafting…"* instead of falsely claiming your attention.
- **Why** — same instinct as the dock (P2): never make the user scroll to learn
  where a parked run stands. Joining it to the composer says *this is the run you
  answer here* (P4).

---

### 3.3 Decisions & gates — human‑in‑the‑loop (P3, P4)

#### Gate → inline Cancel/Send
`src/components/chat/Blocks.tsx` (`ButtonsGate`, `Decision`)
- **What** — a gate normally shows its option buttons ("Yes, this is accurate" /
  "No, something is off"). Choosing an option that needs a note doesn't add a
  fourth button — the **two options are replaced in place** by a textarea +
  **Cancel / Send** on the same footprint. Cancel returns to the original
  buttons; Send records the note and retires the gate.
- **Why** — the gate stays one object that changes mode, rather than sprouting
  extra controls the user has to parse. (P3)

#### Pinned gate in the composer slot
`src/components/chat/ConversationView.tsx` (`pinnedGate`)
- **What** — the live decision/plan block is rendered **in the composer's place**
  instead of as another card in the stream.
- **Why** — you answer where you type. Collapsing "the question" and "the place
  you respond" into one location removes the hunt for the active control. (P4)

#### Plan → "Edit plan"
`src/components/chat/Blocks.tsx` (`Plan`)
- **What** — the Initiate‑Process plan card's secondary action morphs into a
  textarea + Cancel/Send; Send records the edits and retires the card into the
  conversation.
- **Why** — editing happens inline on the same card, not in a modal that severs
  you from the plan. (P3)

#### "Proceed for now" → Skipped / Pushed
`src/components/chat/Blocks.tsx` (`Sync`)
- **What** — a push‑to‑Jira card offers a primary (push now) and a secondary
  ("Proceed for now"). Once retired, the card **truthfully reflects the choice**:
  *"Pushed"* only if you actually pushed, *"Skipped for now"* if you proceeded.
- **Why** — the after‑state must never lie about what happened. Honest retirement
  labels keep the transcript trustworthy. (honest after‑states)

---

### 3.4 Canvas & documents (P3, P5)

#### Preview / Code segmented pill
`src/prd/DocumentCanvas.tsx` (`ViewTabs`)
- **What** — one segmented control. The active tab is a filled pill with **icon +
  label**; the inactive one collapses to its **icon alone** and the label
  *glides away* (`width: auto → 0`, 160ms) while the pill springs
  (`stiffness 520, damping 40`).
- **Why** — a single control that reshapes, so the switch reads as one object
  changing selection rather than two buttons toggling. (P3)

#### Inline comments — highlight + numbered markers
`src/prd/DocumentCanvas.tsx`
- **What** — commenting on canvas text paints the passage via the **CSS Custom
  Highlight API** (`::highlight(aava-comment)`, no DOM surgery) and drops a
  **numbered marker** whose number matches the entry in the changes tray —
  `1`, `2`, `3` … tying each note to its exact span.
- **Why** — the link between "the note" and "the words it's about" is spatial and
  unmistakable, and the highlight never mangles the document's DOM. (P5)

#### Changes tray — stacking + Apply
`src/components/chat/ConversationView.tsx` (`ChangesTray`), `App.tsx`
- **What** — pending comment‑changes **stack** in a tray just above the prompt
  bar (the way generative editors surface edits before committing). **Apply**
  lifts them into the conversation as a turn and clears the tray.
- **Why** — edits are staged and reviewable as a batch before they act, not fired
  blindly one at a time. (P2 — the pending set is always visible)

#### Filename dropdown (canvas)
`src/prd/DocumentCanvas.tsx` (`FileSwitcher`)
- **What** — the canvas filename is a dropdown pill; opening it lists the
  session's documents to switch between.
- **Why** — the file you're viewing is also the control for changing it — one
  affordance, no separate file chrome. (P3/P4 family)

---

### 3.5 Feedback & ambient

#### Suggestion chips — staggered entrance
`src/components/chat/Chips.tsx`
- **What** — chips fade‑and‑rise in with a **40ms stagger** (`easeOut`, 180ms).
- **Why** — a staggered reveal reads as options arriving *for you* rather than a
  block snapping in; small, quick, then still. (P7)

#### Toast
`src/components/overlays/Toast.tsx`
- **What** — slides up `y:10 → 0` on enter, drops `y:0 → 8` on exit, via
  `AnimatePresence`; `role="status"`, `aria-live="polite"`.
- **Why** — transient confirmation that announces itself to assistive tech and
  leaves without ceremony. (P7, P6)

#### Press feedback
`index.css` (`.press`)
- **What** — a `scale(0.97)` on active press, on every tactile control.
- **Why** — the universal "I felt that" acknowledgement; one class, everywhere,
  so nothing feels dead. (P7)

#### Ambient field / aurora
`src/components/ambient/AmbientField.tsx`, `src/components/start/AuroraRing.tsx`,
`src/components/start/aurora.css`
- **What** — a slow, low‑contrast background drift on the start surface.
- **Why** — life without distraction; it sits far enough back that it never
  competes with content, and it too honours reduced‑motion. (P7, P6)

---

## 4. Adding a new micro‑interaction — checklist

Before shipping one, it should answer yes to all of these:

- [ ] It traces to a principle in §1 (if not, reconsider it).
- [ ] It reuses a motion token / helper from §2 (no fresh magic numbers).
- [ ] Its motion means what the §P5 vocabulary says it means (no overloading pulse/shimmer/spin).
- [ ] It **morphs** rather than swaps where a control changes role (P3).
- [ ] It has a `prefers-reduced-motion` path and doesn't replay or distort (P6).
- [ ] Its after‑state tells the truth about what happened (honest labels).
- [ ] It's quick and quiet — springs only where the thing should feel physical (P7).

---

*Keep this document in step with the code: when you add or change an interaction,
add or update its entry here in the same change.*
