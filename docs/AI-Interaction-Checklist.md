# AAVA — Human + AI Interaction Checklist

The check to run **while crafting any scenario**, and the register of **how each
scenario already stacks up** against it.

Two bodies of guidance feed this:

- **AAVA's own six UX principles** (`docs/UX-Principles.md`) — the product's
  stated definition of good.
- **Established human-AI interaction research** — Microsoft's 18 Guidelines for
  Human-AI Interaction (HAX Toolkit), Google PAIR's People + AI Guidebook,
  Apple's HIG generative-AI guidance, and a 2026 framework of UX principles for
  workplace AI agents ([arXiv 2607.19941](https://arxiv.org/html/2607.19941v1)).
  These are decades of synthesized research — we don't re-derive them, we check
  against them.

Neither is a style guide. This is about the *interaction* between a person and
an agent: what it tells you, when it stops, how it hands control back. Visual/
motion polish lives elsewhere (`docs/microinteractions.md`).

**How to use it.** When you draft a new scenario, walk the checklist in §1 and
answer each check honestly for that flow — "yes, here," "no, and that's a
deliberate exception because…," or "no, gap." Then add the scenario to the
coverage register in §2 with a one-line note per principle it leans on. A "no"
that isn't a stated exception is a gap to fix or to log in `docs/DECISIONS.md` —
never a silent skip. `docs/scenario-blueprint.md`'s injection checklist ends by
pointing back here.

---

## 1. The checklist — grouped by interaction phase

Each check names the framework(s) it comes from and the AAVA principle it
serves, so a "why does this matter" is always one glance away. `[GAP]` marks a
check the product does **not** currently meet well anywhere (see §3).

### A. Before the run starts

- [ ] **Names what process/capability took this, up front.** The run opens by
  saying which agentic process picked it up, before doing anything.
  *(HAX G1 "make clear what the system can do" · AAVA: Eager to Collaborate,
  Trust)*
- [ ] **States how well / how confidently it can do it — not just that it can.**
  A signal of certainty or limits, not only a capability name. **`[GAP]`** —
  qualitative results exist ("11 passed · 87%") but no confidence signal; the
  PI deck implies one ("94% Confidence") the product doesn't ship.
  *(HAX G2 "make clear how well" · AAVA: Trust)*
- [ ] **Starts on a real trigger or context, not a cold blank.** The task is
  already prepared, or it opens from a genuine ticket/intent — no empty setup
  ritual first.
  *(HAX G3 "time services based on context" · AAVA: Work Finds You, Zero
  Ceremony)*
- [ ] **Shows what it accessed — and marks what it was denied.** Connected
  sources are visible; a source it reached for and couldn't get is shown as
  denied, not silently dropped.
  *(2026 framework #3 Privacy & Governance · AAVA: Trust)*

### B. While it works

- [ ] **Makes its reasoning visible as it goes.** Tool steps resolve one by one
  with their results; thinking is shown, not hidden behind one spinner.
  *(HAX G11 · Apple "process signaling" · AAVA: Trust, Eager to Collaborate)*
- [ ] **Shows only context-relevant evidence, kept quiet until needed.**
  Evidence is available to open, not dumped inline; finished work collapses.
  *(HAX G4 "show contextually relevant information" · Apple Deference · AAVA:
  Depth on Demand)*
- [ ] **Lets the person stop or interrupt an in-flight run.** A visible way to
  halt work in progress, before it reaches a consequence. **`[GAP]`** — no
  Stop/interrupt affordance exists; the composer isn't even disabled during
  playback, so interrupting is undefined, not designed.
  *(HAX G8 "efficient dismissal" · 2026 framework #1 Human Control · AAVA:
  a currently-unnamed control principle)*

### C. At a decision gate (the heart of it)

- [ ] **Parks at genuine ambiguity and asks a specific, answerable question.**
  It stops where a human must decide — and the question is concrete, not "is
  this OK?"
  *(HAX G10 "scope services when in doubt" · 2026 #1 Human Control · AAVA:
  Depth on Demand)*
- [ ] **The decision is unmissable and answered in place.** A live gate is
  visually distinct and takes the input focus (replaces the composer), not one
  more card to scroll past.
  *(2026 #1 Human Control · AAVA: principle P4 "answer in place")*
- [ ] **Conveys the consequence before an irreversible or external action.**
  Anything that leaves AAVA (a PR, a ticket, a push) first shows exactly what
  will happen and who sees it.
  *(HAX G16 "convey the consequences of user actions" · AAVA: Trust)*
- [ ] **Records and shows back what the person chose.** Once answered, the gate
  displays the choice ("Your input"), so scrolling back tells you what was
  decided. **`[GAP for task flows]`** — object flows (PM) do this; T1/T7 gates
  don't record the choice back.
  *(HAX G12 "remember recent interactions" · AAVA: Trust)*

### D. When it's uncertain, wrong, or the person changes their mind

- [ ] **Explains *why* it did what it did, at the point it did it.** Not just
  the outcome — the reason (which trigger matched, which rule fired).
  **`[GAP, partial]`** — capability cards name the process but not *why this
  message* matched it; that reasoning only lives in code (`prd/data.ts`).
  *(HAX G11 "make clear why the system did what it did" · AAVA: Trust)*
- [ ] **Supports correcting a choice — including reopening an answered gate.**
  A wrong pick, or a changed mind, has a path back. **`[GAP]`** — an answered
  gate is set `live: false` permanently; the only recovery is starting over.
  *(HAX G9 "support efficient correction" · 2026 #1 Control: reversibility)*
- [ ] **Supports editing the generated output in place.** The person can revise
  what was produced, not just accept/reject it. *(Strength — Monaco code edits,
  inline document comments.)*
  *(HAX G9 · PAIR bidirectional feedback · AAVA: Eager to Collaborate)*
- [ ] **Fails loudly and recoverably.** An error opens itself into view (rather
  than needing to be found) and says what to do next.
  *(2026 framework "structured error recovery" · AAVA: Trust)*

### E. Across the session / over time

- [ ] **Every action lands in an append-only log; trouble surfaces itself.** The
  Watch log is always present and opens on a warning.
  *(HAX G16 · 2026 #5 Transparency · AAVA: Trust)*
- [ ] **Leaving and returning loses nothing.** The thread is resumable; state
  comes back exactly as left.
  *(AAVA: Meet People Where They Are · PAIR "continue everywhere")*
- [ ] **Invites granular feedback on the output.** A way to tell AAVA a specific
  thing was good/wrong, feeding back in. **`[GAP]`** — no per-output feedback
  affordance today.
  *(HAX G15 "encourage granular feedback" · PAIR bidirectional loop)*
- [ ] **Stays quiet once a thing is resolved.** Answered gates, finished runs,
  and completed steps settle into quiet records — they don't keep competing for
  attention.
  *(Apple Deference · AAVA: Depth on Demand)*

### Not applicable here — stated on purpose

- **HAX G5/G6 (match social norms / mitigate social bias)** — AAVA is an
  internal B2B tool with no user-generated content or demographic-sensitive
  output; these two genuinely don't apply. Named here so no one later wonders
  why they're unaddressed.

---

## 2. Current scenario coverage register

How each shipped scenario stacks up. Add a row when you add a scenario; keep it
to the principles the flow genuinely leans on and its honest gaps.

### T1 — Add feedback form (developer, task-based) · `scenarios/t1.ts`

- **Leans on:** Trust (evidence at every prep step, running preview before any
  ask), Work Finds You (opens already parked on review — work done before Dev
  arrives), consequence-before-action (the `ship` gate lists both PRs, exact
  branches, what's in each), Privacy/Governance (connected sources shown,
  including the anonymous-submission field *denied* by the API contract).
- **Gaps:** no confidence signal (A); no Stop control (B); gate choice not
  recorded back (C); no reopen-after-answer (D).

### T7 — Migrate refunds API (developer, task-based) · `scenarios/t7.ts`

- **Leans on:** Human Control / scope-down (the single strongest example — it
  *stops* at exactly the 2 fields it can't map and asks, rather than guessing),
  Trust (a separate Validator agent replays 1,200 recorded refunds; nothing
  applied before sign-off), consequence-before-action (two named gates before
  staging, "real money moves through staging").
- **Gaps:** same four as T1 (confidence, Stop, choice-recorded-back, reopen).

### PRD draft + PRD→backlog (PM, intent-based) · `prd/flow.ts`, `prd/backlogFlow.ts`

- **Leans on:** Eager to Collaborate (starts from typed intent, no setup),
  edit-in-place (inline document comments, filename switcher), Depth on Demand
  (collapsed capability/plan records), consequence-before-action (the Jira
  `sync` push names what publishes).
- **Gaps:** confidence (A); Stop (B); why-this-match at capability card (D).

### Analytics insight (PM, intent-based) · `prd/insightFlow.ts`

- **Leans on:** Trust (each step reveals its evidence dashboard; conclusions
  trace to funnel/logs/feedback), scope-down (advances one investigation step
  at a time via suggested next prompts, not one giant leap).
- **Deliberate exceptions:** no execution-activity graph or files panel — it's a
  light investigation, not a multi-artifact run (logged in `DECISIONS.md`).
- **Gaps:** confidence (A); Stop (B).

### Analytics → triage report (PM, intent-based) · `prd/pmReportFlow.ts`

- **Leans on:** everything the insight run does, **plus** gate-input
  registration (the one flow that records and shows back the choice at each
  gate — "Your input"), consequence-before-action (the raise-ticket gate names
  the board and assignee), Depth on Demand (artifact card sits between the
  explanation and the next question — the ordering rule from `DECISIONS.md`).
- **Gaps:** confidence (A); Stop (B); why-this-match (D).

---

## 3. The cross-cutting gaps (fix once, everywhere)

Five things are missing across *most or all* flows — worth fixing at the engine
level, not per scenario. In rough priority (Human Control ranks first in every
external framework):

1. **A visible Stop/interrupt during an active run** (check B) — nothing lets a
   person halt work in flight.
2. **Gate-input registration for task flows** (check C) — T1/T7 should record
   the chosen option back the way the PM report flow already does.
3. **A confidence / how-well signal** (check A) — build it, or stop implying it
   in deck mockups.
4. **A reopen path for an answered gate** (check D) — correcting a choice
   shouldn't mean starting over.
5. **"Why this match" in the capability card** (check D) — surface the trigger
   the router already reasons about in code.

Each of these, when taken on, belongs in `docs/DECISIONS.md` as its own entry.

---

*Source frameworks: Microsoft [HAX Toolkit / 18 Guidelines](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/),
Google [People + AI Guidebook](https://pair.withgoogle.com/guidebook/),
Apple [HIG — Generative AI](https://developer.apple.com/design/human-interface-guidelines/generative-ai),
[UX Principles for Human-AI Agent Interaction in the Workplace](https://arxiv.org/html/2607.19941v1).
Keep this document in step with `docs/UX-Principles.md`; if a framework we cite
is revised, re-check the affected rows here.*
