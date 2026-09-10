# Decision log

Why a change was made, not just what changed — the part a diff and a squashed
PR both throw away. `git log`/`git blame` tell you *what*; this tells you
*why*, so the same mistake doesn't get made twice by someone (human or an AI
agent) who wasn't in the room the first time.

**When to add an entry:** a decision that isn't obvious from reading the code
alone, and would cause a real regression if reversed by accident — a pattern
every flow must follow, a constraint that looks arbitrary until you know the
incident or the rationale behind it, a tradeoff that was deliberately made one
way over another. Not every commit needs one; most don't.

**Format** — keep each entry short:

```
## YYYY-MM-DD — Title

**Context:** what was being built, and what went wrong or was at stake.
**Decision:** what we now do (or must always do) because of it.
**If you're touching this:** the concrete thing to check before you ship.
**Reference:** commit / PR / doc section.
```

This file has three parts: the **layout laws** and **founding decisions** the
whole prototype answers to (from the original design spec, 2026-08-03 — most
of the rationale below is compressed from there and from `docs/Architecture.md`,
not invented here — those two docs are still where the full detail lives),
**structural decisions** made while building the engine and the zones out, and
an **ongoing log** of decisions made day to day as the prototype grew. Newest
first within each part.

---

## Part 1 — Layout laws (non-negotiable)

**Context:** `Common_Journey_v0.docx` is the product's constitution for this
prototype — the layout rules in it are not stylistic preferences, they're what
the whole demo is built to prove ("AAVA does the heavy lifting, the human
makes the decisions" only reads true if the frame itself never destabilises
around the human).

**Decision — these ten hold everywhere, in every flow:**
1. One screen. No routes, no page reloads, nothing navigates away or opens in
   a new page.
2. Four arrangements, not pages (`start` → `conversation` → `split` → `tasks`)
   — the user moves between them in place. The original spec named three
   (`Start`/`Conversation`/`Split`); `tasks` (the full board) is the
   prototype's own addition — see Part 3's closing note on why that isn't
   individually dated.
3. Rail, header and composer are present in every arrangement and never move
   or re-render. Only the area between them changes.
4. Chat always holds the left. Task cards, the playground and artifacts
   always come in on the right. This never flips.
5. The recommended task card is signalled by an animated aurora ring and
   nothing else — same size as the others, no badge, no star, no different
   background. *"The ring is the entire affordance. If a reviewer asks for a
   badge, the ring has failed and should be fixed, not supplemented."*
6. Replies are never instant — a typing indicator first, then text. The pause
   is what reads as thinking rather than lookup.
7. Only user messages get a container. AAVA's replies are plain text, no
   bubbles.
8. One task executes at a time.
9. Every chat and every task is a resumable thread.
10. Enter sends; Shift+Enter is a line break. Smooth scroll to newest message.

**If you're touching this:** any UI change that would violate one of these —
a second scroll region for chat, a modal that takes over the screen, an
artifact opening anywhere but the right, a task card getting a badge instead
of relying on the ring — needs a deliberate, stated exception here, not a
silent drift.

**Reference:** `Common_Journey_v0.docx`; compressed in
`docs/superpowers/specs/2026-08-03-aava-3-prototype-design.md` §2.

---

## Part 2 — Founding product & technical decisions (2026-08-03)

**Context:** the initial build call, made before any code existed, on how to
interpret the constitution above and what to build it with.

| # | Decision | Why |
| --- | --- | --- |
| D1 | **T1 only, modelled end to end; other personas stay shells until their own data lands.** | T1 is the journey the whole narrative is built around — better one flow that's fully real than several that are half-real. |
| D2 | **Redesign, not a port of the jQuery reference.** | The doc is law; the jQuery reference is one interpretation of it and reads as a wireframe that works — the prototype has to read as a product. |
| D3 | **Ambient visual direction** (the drifting navy/violet field). | Promotes the reference's background noise to the organising idea — best demo theatre, and it's what "eager to collaborate" is supposed to feel like. |
| D4 | **Glass chrome, solid slab surfaces underneath.** | Glass is for chrome only (rail, header, composer); every dense-content surface (code, evidence, the Canvas) is opaque. Frosted glass under code/evidence is genuinely hard to read, and the playground is most of the demo. A solid panel floating on a living ambient field still reads as "ambient" — it doesn't need to be transparent too. |
| D5 | **Vite + React + TypeScript, Tailwind, Radix primitives, Motion.** | Radix primitives are copied in and fully restyleable — right for a bespoke redesign, where a batteries-included component library would fight the visual direction. Motion's shared-layout animation is how cards "relocate rather than disappear." |
| D6 | **Mid-task switching is blocked, with the door visibly shown** (a toast + a disabled "open as a separate thread" affordance). | Keeps "one task at a time" a *visible* product principle instead of a silent limitation, without building real concurrent threads. |
| D7 | **Keyword routing + suggested reply chips, not a fixed script only.** | Free-text routing stays live so the demo feels like a real product; chips give a presenter a guaranteed-clean path and teach the audience what AAVA can do, without being the only way through. |
| D8 | **Sidebar icons: Search, Threads, Pinned.** | Threads is the only one the original T1 journey actually needs; the other two ship present (not hidden) so the sidebar reads as finished rather than a work in progress. |
| — | **One reducer, not component state, not an external state library.** (Not in the original D1–D9; added from spec §4.4.) | Every beat mutates several regions of the UI at once — chat, tab availability, code version, preview, task status. Centralising that in one reducer keeps those regions consistent with each other and makes the whole journey drivable from a test without mounting React. |
| D9 | **No colour used for two different meanings.** (Aurora — pink/purple/blue — is reserved for exactly three places: the recommended-card ring, the brand mark, the composer send button. Semantic status — running/waiting/done — is a *separate* palette, never aurora.) | The prototype moved off the "acid-green-on-near-black" AI-tool cliché; the one bold colour it kept had to mean one specific thing (this brand) or it stops meaning anything. |

**If you're touching this:** don't reach for aurora as a decorative accent
anywhere new, and don't let a semantic-status colour (running/waiting/done)
bleed into a spot aurora already owns — that collision is the thing D9 (above)
exists to prevent.

**Reference:** `docs/superpowers/specs/2026-08-03-aava-3-prototype-design.md`
§3 (Decisions D1–D9) and §4.4; `design/tokens.css`'s `--aurora-*` comment.

---

## Part 3 — Structural decisions (the engine and the zones)

### The five zones, and the fold/dissolve vocabulary

**Context:** the constitution's layout laws had to become something a channel
(web, desktop, an IDE panel, mobile, CLI) could each realize without becoming
five different layout components.

**Decision:** the frame is exactly five zones — Sidebar ("where am I"),
Conversation ("what can I do"), Canvas ("what am I working on"), Toolbar
("how am I looking at it"), Watch ("what's happening") — each with one fixed
colour identity, and each zone's presence is one of three states:
**primary** (first-class position), **folded** (moved to a secondary
position, still present/stateful — e.g. Sidebar → a 70px rail), or
**dissolved** (removed from the render tree, holds no state). Adding a new
channel is a capability declaration plus at most one clause in
`resolveFrame()` — never a new layout component. Only the Canvas is
declarative (its content is generated at runtime); the other four have a
fixed inventory.

**If you're touching this:** a new piece of chrome belongs to exactly one
zone — if you can't say which of the five it answers to, it likely doesn't
belong as a sixth. And "folded" vs "dissolved" is not a synonym pair: folding
something that should dissolve leaks state a channel was never meant to keep
(e.g. a mobile client rendering hidden Canvas state); dissolving something
that should fold loses the "where am I" orientation the Sidebar rail exists
to preserve.

**Reference:** `docs/Architecture.md` §3; `src/zones/types.ts`, `resolve.ts`.

### The run dock hangs from the header; expanding it doesn't open a new panel

**Context:** run progress needed to be always-visible (constitution law: every
task is a resumable thread with visible state) without competing with the
conversation for screen space or forcing a modal/drawer detour to see it.

**Decision:** the run dock (`RunStrip`) is a compact capsule fused to the
session header's bottom hairline; clicking it doesn't swap to a separate
view — the *same shell* springs its own measured height downward into the
full step list, then springs back. Colour carries exactly one meaning across
the whole app: blue = running, amber = a gate waiting on you, green = done —
never reused for anything else.

**If you're touching this:** don't build a second "progress" surface (a
sidebar badge, a toast) for something the dock already reports — one
place, one meaning per colour, is the point.

**Reference:** `docs/Architecture.md` §5.4; `docs/microinteractions.md` §1
(principles P2, P3, P5); `src/components/chat/RunStrip.tsx`.

### A live gate replaces the composer; it doesn't add a new place to answer

**Context:** a human-in-the-loop gate is the one moment the human, not AAVA,
moves the run forward — the constitution treats "waiting on you" as a state
that must be unmissable.

**Decision:** while a gate (`decision`/`confirm`) is live, it visually
*replaces* the prompt bar rather than appearing as one more card the user has
to notice among others; once answered it settles back into the thread as a
plain record ("Answered"), and the composer returns. A gate needing a note
doesn't sprout a fourth button — its two options are replaced in place by a
textarea + Cancel/Send on the same footprint.

**If you're touching this:** a new gate type still pins to the composer's
slot while live — don't design one that sits inline and easy to scroll past
instead.

**Reference:** `docs/Architecture.md` §5.6; `components/chat/ConversationView.tsx`
(`pinnedGate`), `components/chat/Blocks.tsx`.

### Finished/prepared work renders already-complete — never fake loading

**Context:** T1 opens already parked on a review gate (the work happened
before the user sat down); T7 opens already parked on step 3 (the run
genuinely stopped there). Replaying a spinner for work that's already done
would be a lie the constitution's "make the reasoning visible" principle
doesn't allow.

**Decision:** a `tools` accordion emitted with `ms: 0` per step renders
already-complete, with no spinner, no delay — "prepared work" and "work
happening live" use the same component, distinguished only by whether the
step actually costs time.

**If you're touching this:** don't add an artificial delay to make a
seeded/pre-filled run "feel more real" — that's the opposite of what this
decision protects.

**Reference:** `docs/Architecture.md` §5.5, §9.2 (`stream: false`).

### Object flows are entered by intent-matching what the user typed, not a menu

**Context:** the composer had to be able to start a PRD draft, a backlog
decomposition, an analytics investigation, or a triage report — without a
"new flow" picker that would break the illusion of talking to one assistant.

**Decision:** each object flow gets an `isXxxIntent(text)` detector in
`prd/data.ts`; `useJourney.send()` checks them in order (most specific first
— a flow whose ask could also match a more general flow's keywords must be
checked before it) and opens straight into that flow's opening beats. No
command palette, no explicit "start a new PRD" button.

**If you're touching this:** when two intents could both match the same
phrasing, the more specific one goes first in `send()` — `isReportIntent`
before `isInsightIntent` is the worked example (a triage-report ask also
contains analytics keywords the lighter insight ask matches on, so it has to
be checked first or it never gets reached).

**Reference:** `docs/Architecture.md` §9.4; `prd/data.ts`, `state/useJourney.ts`.

### Two Canvas renderers (task flows vs. object flows), not one generic one

**Context:** a task run needs a tabbed code/preview/tests/diff workspace; an
object flow needs a document/dashboard viewer with share/download/history.
Forcing both through one generic component was tried against the grain of
what each actually shows.

**Decision:** `TabWorkspace.tsx` (flexlayout-style tabs) serves task flows;
`DocumentCanvas.tsx` (Preview/Code pill, share/download/history, inline
comments via the CSS Custom Highlight API) serves object flows; a flow may
also bring its own Canvas when neither fits (`InsightCanvas.tsx`,
`ReportCanvas.tsx`). All three mount in the same right-hand slot
(`App.tsx`'s `right={…}`) and share the Execution-activity-graph/Files-panel
overlay pattern.

**If you're touching this:** a new flow's Canvas doesn't have to reuse
`DocumentCanvas` if the content genuinely doesn't fit its shape — but it does
have to honour the shared overlay pattern (graph/files as an opaque layer
over whichever Canvas is mounted) and the toolbar parity (Share/Download/
Close) users already expect from every other Canvas. See the 2026-09-04
entry below for what happens when a new Canvas skips part of that parity.

**Reference:** `docs/Architecture.md` §6, §11 ("wired vs foundational");
`prd/DocumentCanvas.tsx`, `components/playground/TabWorkspace.tsx`.

### Toolbar (Zone 4) is folded into the surfaces it controls, not a standalone strip — for now

**Context:** the zone model calls for a Toolbar zone ("how am I looking at
it") as a first-class piece of chrome; building it as a separate strip before
any channel needed to switch views on it would have been speculative.

**Decision:** in the running app today, Toolbar's inventory lives folded into
`TabWorkspace`'s tab bar, `DocumentCanvas`'s Preview/Code pill and filename
dropdown, and the header's edge toggles — not as `zones/Toolbar.tsx`
standing alone. `Toolbar.tsx` itself is built and tested, ready for when a
channel actually needs the standalone form.

**If you're touching this:** this is a *stated*, not accidental, gap — see
`docs/Architecture.md` §11's "wired vs foundational" table before assuming
something there is unfinished by accident.

**Reference:** `docs/Architecture.md` §7, §11.

### A note on dating the entries above

The entries in this part (the zone model, the run dock, the pinned gate,
prepared-work rendering, intent routing, the two Canvas renderers, and the
Toolbar gap) aren't individually dated. This repo's own git history
starts from an already-evolved snapshot — its first commit already contains
the zone model, both scenarios, and the object flows — so there's no honest
"before/after" moment inside *this* repo to pin each one to. `state/types.ts`
and `docs/Architecture.md` are the living source of truth for the current
shape of things; the original design spec (Parts 1–2 above, dated
2026-08-03) is kept for the *rationale* behind the founding calls, not as an
up-to-date reference — don't infer a build timeline from it. When code and
`Architecture.md` disagree on a concrete shape, the code and `Architecture.md`
win; update `Architecture.md` in the same change you add a new arrangement,
effect, or action, so the two don't silently drift apart.

---

## Part 4 — Ongoing log (decisions made during build, newest first)

### 2026-09-10 — The Agent-Designer (HLD) run reuses the object-flow spine; the builder canvas has a read-only→clone gate

**Context:** the first pass of Ajay's HLD flow (`prd/agentFlow.ts`) was a
"lite" version — it skipped the capability card and the process-plan dock, and
showed golden matches as a flat card grid. That broke the one-shape-per-scenario
promise (`scenario-blueprint.md` §1): every other object flow opens with a
capability match (shimmer → card) and a numbered plan that feeds the hanging
dock, and this one didn't. It also meant the "Agentic Designer" persona read as
a different kind of surface than the PM/engineer ones, when it should read as
the same product doing a different job.

**Decision:** the Agent-Designer run is a normal object flow on the fixed spine —
capability **Artifact Identification** (`AID-1.0`) → a 5-step plan (Refine the
requirement · Identify matching artifacts · Create or clone · Assess · Send for
approval) tracked by `agentProgress` in the dock → gated steps. Two new
patterns it introduces, both of which a teammate could regress:

1. **The golden matches render in a "catalog window", not loose cards.** A
   titled container (code-block styling: header + a maximise-to-modal control,
   *no* copy control) holding the ranked matches, each with a **% match** and a
   "Best fit" marker. The modal is what keeps a 10+ match list usable — don't
   revert it to a bare grid.
2. **The builder canvas opens read-only and is cloned into a working copy.**
   Opening a match shows `OrchestrationCanvas` with `readOnly` — the top bar is
   just a Clone button + an amber read-only banner, and the floating library /
   per-node config are hidden. Clone (from the canvas button *or* the
   conversation gate) fires `setAgentCloned`, which flips the canvas to editable
   **and retires the live read-only gate** — cloning can start from the canvas,
   which bypasses the gate's own dismiss, so the retirement lives in the reducer
   (`setAgentCloned`), not only in the gate. A live node-add (`setAgentStakeholder`
   appends Stakeholder Review after HITL) reflects a typed change on the canvas.

**If you're touching this:** keep the read-only→clone two-state on the builder —
a match must never open straight into an editable copy (the whole point is
"reuse a golden artifact, then fork it"). And if you add a new agent beat, set
its dock step with `setAgentPhase` at the head of the beat, the way the others
do — the dock reads the object's `agentPhase`, not the message list.

**Reference:** `prd/agentFlow.ts`, `prd/OrchestrationCanvas.tsx`
(`readOnly`/`onClone`/`stakeholderAdded`), `components/chat/Blocks.tsx`
(`ArtifactCatalog`), `state/reducer.ts` (`setAgentCloned` gate retirement);
`prd/agentFlow.test.ts`. Trigger: "looking for an agentic process to build HLDs".

### 2026-09-05 — AAVA is built for an 8-role cohort, not "the developer and the PM"

**Context:** in conversation, this build's audience got described as two
personas (an engineer and a product manager) — a reasonable-looking inference
from what's actually built (T1/T7 model the engineer; PRD/backlog/analytics
model the PM), but wrong. `AAVA 3.0_PI Planning.pdf` ("Who Uses AAVA") names
three cohorts: **Basic User (95% of usage)** — eight named roles: Frontend
Engineer, Backend Engineer, QA/Tester, Platform Engineer, Product Manager,
Data Engineer, DevOps Engineer, UI/UX Designer; **Agentic Designer** (few —
sets standards, writes policy gates); **Executive Buyer** (signs off the bet,
not a hands-on user). The two flows built so far are two footholds in the
eight-role cohort, not the whole target audience.

**Decision:** treat "Basic User" as the real audience for any new flow or UI
decision — eight roles, not two — and the six UX principles
(`docs/UX-Principles.md`) as governing all eight, even though only two are
modelled end to end today.

**If you're touching this:** don't reason about "what would the developer
persona want" or "what would the PM persona want" as if those were the whole
audience — check whether a QA/Tester, Platform Engineer, Data Engineer, DevOps
Engineer, or UI/UX Designer would hit the same UI differently before assuming
a pattern generalizes. When Personas 2 & 3 (more of the eight) get modelled,
they extend this cohort, not a new one.

**Reference:** `AAVA 3.0_PI Planning.pdf`, "Who Uses AAVA" (pp. 4–5);
`docs/UX-Principles.md`.

### 2026-09-04 — Every object flow must wire the Execution-activity graph and Files panel

**Context:** Adding the PM Analytics → Report scenario, the first pass
(`prd/pmReportFlow.ts`, `ReportCanvas.tsx`) shipped without the "Execution
activity" and "Files in this session" header toggles that every other object
flow has (`prd/backlogFlow.ts`, `prd/flow.ts`). It wasn't a deliberate
omission — the scenario-blueprint's own "injection checklist"
(`docs/scenario-blueprint.md` §6) said to wire the object kind through
`types.ts`, `reducer.ts`, `useJourney.ts`, `App.tsx`, "mirror `backlog` /
`insight`" — and that's true, but it isn't the whole list. The toggles
themselves live in a fifth file, `components/chat/ConversationView.tsx`,
gated by a per-kind condition (`object.kind !== 'insight'`), and nothing
forced that file into view. It only got caught because it was checked by hand
against the other flows before merging, not because anything would have
flagged it otherwise.

**Decision:** every object flow gets an Execution-activity graph (its own, if
the generic `AgentGraph` blueprint doesn't fit — see `prd/ReportGraph.tsx`)
and a Files panel, unless there's a deliberate, stated reason a flow doesn't
need one (the lighter analytics-insight run intentionally has neither — it's
a light investigation, not a multi-artifact run — so its `ConversationView`
condition is an explicit exclusion, not a gap).

**If you're touching this:** when you add a new object flow (or edit an
existing one's header), check `ConversationView.tsx`'s two `EdgeToggle`
blocks (`Show execution activity` / `Files in this session`) by name — don't
rely on "mirror an existing flow" being enough to catch every file it touches.
`docs/scenario-blueprint.md` §6's checklist item 6 now names this file
explicitly; keep that in sync if the wiring ever changes shape again.

**Reference:** `prd/pmReportFlow.ts`, `prd/ReportCanvas.tsx`,
`prd/ReportGraph.tsx`, `components/chat/ConversationView.tsx`; squash-merged
in PR #9 (`ab2f570`) — the gap and the fix both landed in that one merge
commit, so it isn't visible from `main`'s history alone.

### 2026-09-04 — Artifact cards sit between the explanation and the next question, in every scenario

**Context:** The report scenario's first-pass `startAnalysis` beat (and, it
turned out, five older beats in `prd/insightFlow.ts` and
`prd/backlogFlow.ts`) revealed the artifact card *before* the message
explaining what it contains — the reader hit the card, then the explanation,
then the question. One flow (`pmReportFlow.calcImpact`) already did it in the
right order, which is what made the inconsistency visible.

**Decision:** a step's parts render in one fixed order — the explanation
`say`, then the artifact/document reveal, then the `say` that carries the
next question or gate. The artifact sits *between* the explanation and the
question it leads into, never before the explanation.

**If you're touching this:** when a beat both explains a finding and reveals
a document/dashboard, split it into two `say` effects with the artifact
`reveal()` (or equivalent) between them — don't fold the explanation into the
same `say` as the gate with the artifact emitted ahead of both.

**Reference:** `docs/scenario-blueprint.md` §3.4 ("Ordering rule") has the
worked correct/wrong example; commit `89c3b01` fixed all six beats that had
drifted from it.
