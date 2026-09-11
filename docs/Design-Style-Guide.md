# AAVA 3.0 — Design Style Guide & Interaction Patterns

The single entry point for "what does AAVA look like, and how does it behave" —
written for the team, not just engineers. It doesn't replace the docs it draws
from; it's the index and the synthesis, and every fact in it traces to a
source file so it can't quietly drift from the real app.

**What's genuinely new here** (not duplicated from elsewhere): a foundations
section with the actual token values laid out as a usable style guide, and —
the gap this doc exists to close — a **Patterns & Flows by Scenario** section
(Part D) showing how the foundations and the interaction principles actually
compose into a real, shipped run, for both ways AAVA work starts (task-based
and intent-based).

**What this doc leans on, rather than repeats:**

| Source | What it owns |
| --- | --- |
| [`app/src/design/tokens.css`](../app/src/design/tokens.css) | The literal token values — colour, type, shape, motion. Part A quotes it; if the two ever disagree, the CSS file is correct and this doc is stale. |
| [`docs/microinteractions.md`](./microinteractions.md) | The full interaction-principle set (P1–P7) and the exhaustive per-component motion catalogue. Part B summarises; that doc is canonical. |
| [`docs/UX-Principles.md`](./UX-Principles.md) | The six product-level principles ("why", not "how") and the ship-checklist. |
| [`docs/DECISIONS.md`](./DECISIONS.md) | Why a pattern exists the way it does, and the layout laws every screen answers to. |
| [`docs/scenario-blueprint.md`](./scenario-blueprint.md) | The fixed spine every scenario runs on, and the vocabulary (gate types, artifact shapes) a new scenario is built from. |
| [`docs/Architecture.md`](./Architecture.md) | The five-zone model and where each piece of chrome lives. |

**How to use it:** skim Part A once to know the actual values (not "roughly
indigo" — `#6366F1`); read Part B once for the principle vocabulary; use Part
C as a quick index into the full catalogue; read Part D per scenario, when
you're building or reviewing that scenario specifically.

---

## Part A — Visual foundations

Everything below is quoted directly from `tokens.css`'s numbered spec
sections. AAVA ships **dark as the product's default look** regardless of OS
setting; light mode is a fully designed second ramp, not an inversion (see
`tokens.css`'s own comment on why — surfaces lift by getting lighter in dark
and lift by going whiter in light, and there is nothing to glow against on a
white ground, so light mode leans on borders instead of bloom).

### A.1 Brand

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--brand` | `#6366F1` | `#4F46E5` | CTAs, active nav, key links, focus ring |
| `--brand-hover` | `#818CF8` | `#6366F1` | hover |
| `--brand-pressed` | `#4F46E5` | `#3730A3` | selected tabs, pressed state |

Light mode's brand is deliberately darker than dark mode's (`#4F46E5` vs.
`#6366F1`) — it's tuned to hold 6.29:1 contrast on white (AA), not a straight
palette swap.

### A.2 Surfaces & elevation

| Token | Dark | Light | Role |
| --- | --- | --- | --- |
| `--ground` | `#0F1117` | `#F3F4F6` | page canvas |
| `--slab` | `#181B25` | `#FAFBFC` | cards, panels |
| `--slab-raised` | `#212530` | `#FFFFFF` | popovers, modals, **tooltips** |
| `--card` / `--card-hover` | `#181B25` / `#212530` | `#FFFFFF` / `#EEF0F3` | task cards |

Cards are **fully opaque by design** — the recommended-task card's aurora
ring bloom must never tint the card's interior into reading as a different
background; that's the one thing the ring affordance can't survive.

Shadows (`--shadow-panel`, `-pop`, `-composer`, `-drawer`) are a heavier flat
black in dark (`rgba(0,0,0,.5–.55)`) and a shallower, cooler tint in light
(`rgba(17,24,39,.08–.12)`) — dark separates surfaces with glow/translucency,
light separates them with shadow + border since there's nothing to glow
against.

**Code and terminal surfaces stay dark in both themes, deliberately**
(`--code-bg: #0B0A12`) — every serious dev tool (Stripe, Linear, Vercel) does
this, and retuning six syntax colours for light mode would be effort for no
real gain. The **preview** panel is the exception: it's the user's own app,
not code, so it follows the active theme (`--preview-bg`) or it renders
dark-on-dark in light mode.

### A.3 Typography

**Family:** `Geist Variable` (UI), `Geist Mono Variable` (code, IDs, numbers)
— `--font-ui` / `--font-mono`.

**Text colour ramp** — four steps, AA/AAA-verified against their actual
ground (not just the page background):

| Token | Dark | Light | Contrast |
| --- | --- | --- | --- |
| `--text` | `#F1F5F9` | `#111827` | 17.2–17.7:1, AAA |
| `--text-dim` | `#CBD5E1` | `#374151` | between primary and secondary |
| `--muted` | `#94A3B8` | `#4B5563` | 7.5:1, descriptions/metadata |
| `--muted-deep` | `#79889F` | `#6B7280` | 4.5–4.8:1, AA — placeholders/labels |

Both `--muted-deep` values were **raised from an earlier, failing tone**
(dark was originally `#64748B`, ~3.8:1 on a card, under AA; light was
`#9CA3AF`, 2.6:1, also failing) — this is a live accessibility fix baked
into the token, not a starting design, and it's the reason `--muted-deep`
should never be treated as "just a lighter grey, pick whatever."

**Type scale — there is no named scale (no `--text-sm`/`--text-lg`
tokens); every size is an inline Tailwind arbitrary value chosen per
component.** This doc is not going to claim a formal scale that doesn't
exist in the code. What's actually there, from a sweep of every
`text-[Npx]` in the codebase:

| Tier | Sizes in use | Typical role |
| --- | --- | --- |
| Micro | 7–10.5px | badges, uppercase eyebrow labels, mono counters |
| Body-small | 11–13.5px | the app's actual reading size — labels, list rows, message text, buttons |
| Body/emphasis | 14–16px | section headers, card titles, the composer |
| Heading | 17–24px | screen-level headings ("Good morning, Deepak") |
| Hero | 44px | the single largest moment: the home greeting |

**If you're touching typography:** the working default for anything that
reads as "normal text in a dense product UI" is **12–12.5px**, which is
where the two largest clusters (63 and 56 uses) actually sit — don't reach
for 14px+ by habit; that tier is reserved for things that are genuinely a
step up in hierarchy.

### A.4 Borders & separators

| Token | Dark | Light |
| --- | --- | --- |
| `--border` / `--glass-line` | `#2D3348` | `#E2E5EA` |
| `--glass-line-soft` | `#232839` | `#E9ECF0` |

Plus a **six-step neutral wash ladder** (`--wash-1` … `--wash-6`) — the
*only* mechanism translucent chrome (hover states, glass overlays) should
resolve through, rather than hand-rolling `rgba(255,255,255,…)` (invisible
on a white ground). In dark these lift a surface toward white
(`rgba(255,255,255,.02–.22)`); in light they press toward ink
(`rgba(17,24,39,.022–.2)`) — the light-mode values were **deliberately
nudged up** from a first pass that read as literally invisible (2.8% ink on
white was imperceptible).

### A.5 Semantic colours

One colour, one meaning, everywhere — never reused for a second purpose
(see D9 in `DECISIONS.md`).

| Token | Dark | Light | Meaning |
| --- | --- | --- | --- |
| `--ok` / `-surface` | `#34D399` / `#064E3B` | `#047857` / `#ECFDF5` | success, done — 9.8:1 AA |
| `--warn` / `-surface` | `#FBBF24` / `#451A03` | `#B45309` / `#FFFBEB` | waiting on you, review |
| `--danger` / `-surface` | `#FCA5A5` / `#450A0A` | `#DC2626` / `#FEF2F2` | error, failed — 9.9:1 AA |
| `--done` / `-surface` | `#60A5FA` / `#1E3A5F` | `#1D4ED8` / `#EFF6FF` | info, running |
| `--pending` | `#64748B` | `#9CA3AF` | not started, neutral |

### A.6 Zone identity — the five-zone colour language

Each of the five zones (`Architecture.md` §3) owns exactly one hue, constant
across themes and (eventually) channels — a Sidebar block reads as the same
zone on mobile as on web because the hue never changes, only its tint/accent
values per theme.

| Zone | Question it answers | Hue | Dark accent | Light accent |
| --- | --- | --- | --- | --- |
| Sidebar | "Where am I?" | violet | `#A99BEA` | `#6D5FC7` |
| Conversation | "What can I do?" | green | `#4FC2A3` | `#1E8F70` |
| Canvas | "What am I working on?" | blue | `#5B9DFF` | `#2F6FD0` |
| Toolbar | "How am I looking at it?" | amber | `#E0A65E` | `#B0741F` |
| Watch | "What is happening?" | slate | `#93A3B5` | `#5A6B7E` |

Each zone also has a `-tint` — its own faint background wash, used sparingly
to say "this block belongs to this zone" without shouting.

### A.7 Aurora — the one deliberate exception

`--aurora-1/2/3` (`#FF7AC6` pink → `#A78BFA` violet → `#5B9DFF` blue) is the
**only** decorative, non-semantic colour in the system, and it is used in
**exactly three places, nowhere else**:

1. The recommended-task card's ring (the *entire* affordance for "this one is
   recommended" — no badge, no star, no different background; if a reviewer
   asks for a badge, the ring has failed and should be fixed, not
   supplemented).
2. The brand mark.
3. The composer's send button.

(Plus the ambient background field it lends its name to.) If you're adding a
fourth aurora spot, that's very likely wrong — check `DECISIONS.md` D9 first.

### A.8 Shape, motion & metrics

| Token | Value |
| --- | --- |
| `--r-sm` / `-md` / `-lg` / `-xl` / `-pill` | 8 / 12 / 16 / 22 / 999px |
| `--ease` | `cubic-bezier(.22, .61, .36, 1)` — general |
| `--ease-out` | `cubic-bezier(.16, 1, .3, 1)` — reveals, expands |
| `--spring-fast` / `-slow` | 180ms / 340ms |
| `--dur` / `--dur-exit` | 180ms / 110ms — exits run faster than entries |
| `--rail-w` / `--sidebar-w` | 70px / 268px |
| `--hit` | 40px — minimum interactive target |

Full motion vocabulary (what a pulse vs. a shimmer vs. a flowing edge means)
is Part B below and `microinteractions.md` §2.

### A.9 Iconography — a stated, live inconsistency

Two conventions currently coexist in the codebase, and this guide says so
rather than papering over it:

- **14 hand-drawn inline-SVG components** in `src/components/chrome/icons.tsx`
  — the original convention, still used across most of the app (sidebar,
  topbar, canvases built before the Agent-Designer work).
- **`lucide-react`** — adopted for the newest surfaces (the Agent-Designer
  Orchestration Builder and Playground, the shared `Tooltip` component, one
  icon in the sidebar's account-switch row).

**If you're touching this:** there is no recorded decision yet on which
convention wins going forward or how/whether the two get reconciled — that
belongs in `DECISIONS.md` as its own entry once the team actually decides,
not assumed silently in either direction here.

---

## Part B — Interaction principles (the vocabulary)

Two principle sets exist, at two different altitudes. Neither replaces the
other:

- **Product-level — "why" (`UX-Principles.md`, six principles):** Zero
  Ceremony · Eager to Collaborate · Meet People Where They Are · Work Finds
  You · Trust is the Currency · Depth on Demand. These are the product's
  stated definition of *good* — the bar a whole flow has to clear, sourced
  from `AAVA 3.0_PI Planning.pdf`.
- **UI-level — "how" (`microinteractions.md`, P1–P7):** Make the reasoning
  visible · Keep run status in view · Morph, don't swap · Answer in place ·
  Give each motion one meaning · Motion is additive, never required · Keep
  it quick and quiet. These are the realization of a couple of the six
  product principles (mainly Trust and Depth) at the level of an actual
  component.

The motion vocabulary — the fixed mapping every surface must hold to — is
worth repeating here because it's the single most load-bearing table in the
whole system:

| Motion | Meaning | Colour |
| --- | --- | --- |
| Pulsing dot | the step running now | blue `--done` |
| Shimmer on a label | waiting on the user | amber `--warn` |
| Spinner ring | a tool call in flight | muted |
| Green check | done or confirmed | `--ok` |
| Flowing edge | data moving along the active path | blue |
| Clock icon | a step ahead, not yet started | muted-deep |

**A new interaction that doesn't map to a principle in either set, or that
reuses one of the six motions above for a second meaning, is very likely
wrong** — go read `microinteractions.md` §4's checklist before shipping it.

---

## Part C — Interaction pattern catalogue (index)

The full catalogue — every named pattern, which file it lives in, and which
principle(s) it serves — is `microinteractions.md` §3. This is a quick index
into it, grouped the same way:

| Group | Patterns | Principle |
| --- | --- | --- |
| **Agent presence** | Thinking dots · Streamed text (word-by-word) · Tool-step accordion (auto-folds on completion) · Execution-activity graph (state-derived, never random) | P1 |
| **Run status** | The run dock (Dynamic-Island style, morphs open rather than opening a panel) · Task progress (joined to the composer) | P2 |
| **Decisions & gates** | Gate → inline Cancel/Send (replaces the two option buttons in place) · Pinned gate in the composer slot · Plan → "Edit plan" · Honest after-state labels (Pushed vs. Skipped, never a lie) | P3, P4 |
| **Canvas & documents** | Preview/Code segmented pill (inactive tab collapses to icon-only) · Inline comments (CSS Custom Highlight API, numbered markers) · Changes tray (stack + Apply as a batch) · Filename dropdown | P3, P5 |
| **Feedback & ambient** | Suggestion chips (40ms stagger) · Toast (`aria-live="polite"`) · Press feedback (`.press`, universal `scale(0.97)`) · Ambient field/aurora drift | P7 |

---

## Part D — Patterns & flows by scenario

**This is the part that doesn't exist anywhere else yet** — everything above
is abstract (a token, a principle, a component pattern); this section shows
how they actually compose into a real, shipped run. Every scenario, whatever
the persona, runs on the same fixed spine (`scenario-blueprint.md` §1):

```
ENTRY (intent typed, or a task card opened)
  → CAPABILITY MATCH (a named badge, before anything executes)
  → PROCESS PLAN (a numbered plan, gated on Proceed)
  → THE RUN — a loop of steps, each: thinking → AAVA speaks → artifact → progress advances
      → HITL gate? → yes: park until answered, then continue the loop
                    → no: continue the loop
  → HANDOFF / END
```

**The only thing that varies between "intent-based" and "task-based" is
Entry.** Everything after it is identical in shape.

Three scenarios are documented below — one task-based, two intent-based —
chosen because they're the three fully-modelled, shipped flows. (The
Agent-Designer/Ajay flow is still in progress as of this writing and is
deliberately left out until it's stable enough to document without this
guide going stale on day one.)

---

### D.1 T1 — task-based: "Add product feedback form" (Deepak, developer)

**Entry — task.** The work was assigned before the user sat down. The task
board shows *"Add product feedback form · Ready for review"* — opening it
does **not** replay a loading state; it opens straight to the exact point
that needs a human (constitution law: finished/prepared work renders
already-complete, never fake-loading — see `DECISIONS.md`, "Finished/
prepared work renders already-complete").

**Capability match — tucked away, not a big card.** Because the match
already happened before the user arrived, *"Capabilities matched — UI
Screen Generator Process"* renders as a quiet, already-resolved record (Part
B's Depth on Demand: everyday, already-resolved state reads as context, not
a competing headline) — not the searching-shimmer-then-card sequence an
intent-based run gets.

**The run — two step accordions, already resolved:**

1. *"Reading the ticket & the design"* — "MOB‑2841 matched the Feedback Form
   v3 frame cleanly. Six PLAY components in the design — four already in the
   library, two I built and staged for their own PR."
2. *"Building & wiring the screen"* — "The endpoint was already live, so no
   contract change. I generated the Angular page, wired it to
   `POST /api/v1/feedback` and registered the route — seven files in all."

**Canvas: `TabWorkspace`** (not `DocumentCanvas`) — the task-flow tabbed
workspace: code, a **live, interactable** preview (not a screenshot — you
can actually pick a rating and type a comment in it before approving
anything), unit tests, and a working diff.

**Gate — `confirm`.** *"Waiting on you · Step 10 — Raise both pull
requests"* replaces the composer (P4, Answer in place) and lists exactly
what will happen: *"PLAY: FormField, CharacterCounter. Product: Feedback
page, API integration, 11 specs passing."* Accept → *"Both PRs raised."*

**Handoff:** done — the artifact (the running app) stays open to use.

**What this scenario demonstrates that the others don't:** the "already
resolved" rendering of prior work (P1 honesty — a `tools` accordion emitted
at `ms: 0` shows no spinner, because nothing about it should look like it's
happening live when it already happened), and the only scenario using
`TabWorkspace` instead of a document/dashboard canvas.

---

### D.2 PRD → Stories — intent-based: PM (Raman)

**Entry — intent.** Raman's home is empty (Zero Ceremony — nothing sits
there until he starts something) — he types *"Here is my PRD, help me
create epics and user stories"* and sends it. No wizard, no picker.

**Capability match — the full sequence, since this is genuinely happening
now.** A "matching a capability" shimmer, then: *"This maps to the 'Epics
and Features Generator' agentic process. I can take it end-to-end:"* —
badge **`EFG-1.0`**, chips: *PRD parsing & requirement extraction · Backlog
decomposition (epics → features → stories) · Definition-of-Ready checks ·
Sprint planning & story mapping.*

**Process plan (Proceed-gated):** Intake & understanding → Draft epics
(pause for review) → Break into features (pause for review) → Write user
stories → Publish to Jira.

**The run — four steps, each producing a document artifact in
`DocumentCanvas`:**

| # | Artifact | AAVA's finding | Gate |
| --- | --- | --- | --- |
| 1 | `intake.md` | 5 objectives, 6 roles, 28 requirements | **buttons** — "Does this match your PRD?" |
| 2 | `epics.md` | 7 epics, same template | **buttons**, then a **sync** offer (push to Jira now / skip) |
| 3 | `features.md` | 23 features; 3 missing target date/priority, highlighted in the doc | **buttons + collect** — fill the gaps, or proceed without |
| 4 | `stories.md` | 58 stories | **sync** — push to Jira |

**The pattern worth calling out specifically:** in the recorded demo run,
publishing the *features* is skipped at step 3 — and AAVA doesn't forget
it. After the stories are published, it proactively follows up: *"One thing
before you go — you skipped publishing the 23 features earlier. Want me to
push it to Jira now?"* This is Part B's Eager to Collaborate principle made
concrete: a `sync` gate's "skip" is tracked state, not a dead end, and
AAVA — not the user — is the one who brings it back up, at the natural
moment.

**Handoff:** stories published to Jira with parent–child links; sprint
planning is explicitly handed to the scrum master — a stated hand-off
message, not a silent "done."

**What this scenario demonstrates that the others don't:** the heaviest gate
density of any scenario (a pause after nearly every level — "a review-heavy
flow pauses after every level," per `scenario-blueprint.md` §3.5), the
`buttons + collect` gate variant, and the proactive-follow-up pattern.

---

### D.3 PM Analytics → Report — intent-based: PM (Raman), investigation-style

**Entry — intent.** An analytics ask (e.g. "why did checkout conversion
drop"). Same shimmer → capability-match sequence as D.2.

**Capability match.** *"This maps to the 'Product Analytics & Feedback
Triage' agentic process."* — badge **`PAT-1.0`**, chips: *Post-release
anomaly detection · Feedback synthesis & clustering · Application-log
root-cause audit · Impact modelling & PRD drafting.*

**Process plan — five steps:** Detect the anomaly → Correlate friction &
feedback → Audit the application logs → Estimate the business impact →
Draft the PRD & fix spec.

**The run — five steps, each opening a dashboard view in `InsightCanvas`,
not a document:**

1. **Detect the anomaly** — GA4 telemetry, a 22% checkout-conversion drop
   and a 310% rage-click spike on Step 3 → funnel view.
2. **Correlate friction & feedback** — Step-3 session telemetry + 42
   tickets/surveys synthesised (93% coherence) → feedback view.
3. **Audit the application logs** — 0 → 1,840 errors post-deploy, root
   cause isolated (`FormValidationBypass`, a Safari/WebKit autofill bug) →
   log-audit timeline view.
4. **Estimate the business impact** — 18,200 affected users, $42k/week,
   support-ticket forecast → impact-model view.
5. **Draft the PRD & fix spec** — `PRD-2026-084`, a P1 hotfix spec → opens
   as a document (the one artifact in this run that *is* a `.md`, at the
   very end).

**No HITL gate until the very end.** Unlike D.2, this run doesn't stop and
wait after every step — it's a *lighter, investigation-style* flow (per
`scenario-blueprint.md` §3.5: "an investigation pauses lightly and lets the
user drive via a suggested next prompt"). Each step ends with AAVA asking a
plain question in text ("Want me to isolate the friction points…?") and a
suggestion chip carries the obvious next move — the user is driving via
conversation, not clearing a sequence of stop-and-approve gates.

**Gate — only at the handoff, `sync`.** *"Raise a P1 Jira ticket · Billing"*
→ Raise ticket / Not yet.

**What this scenario demonstrates that the others don't:** the *absence* of
mid-run gates is itself a deliberate pattern (not every scenario needs the
same gate density — state it explicitly, per `scenario-blueprint.md`'s "how
many gates?" guidance), and it's the only scenario of the three whose Canvas
renders dashboard views (`InsightCanvas`) rather than documents for most of
its run.

---

## Governance

Keep this file in sync the way `DECISIONS.md` and `microinteractions.md`
already ask every doc to: when a token value changes, when a new
interaction pattern ships, or when a fourth scenario gets fully modelled,
update the relevant part **in the same change**, not as a follow-up. If code
and this doc ever disagree, the code (and `tokens.css`/`Architecture.md`
specifically) wins — file the correction here rather than trusting a stale
memory of what this doc says.

**Adding scenario D.4 and beyond:** use `scenario-blueprint.md` §5's blank
template to gather the content, then write it in the same shape as D.1–D.3
above (entry → capability → plan → the run, as a table where the pattern is
a document-artifact loop, as prose where it isn't → what it demonstrates
that the others don't). That last line matters — it's what keeps this
section from turning into three copies of the same description with the
nouns swapped.
