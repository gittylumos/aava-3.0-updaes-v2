# AAVA UX Principles — the check before you ship a UI change

Six principles, from `AAVA 3.0_PI Planning.pdf` §"UX Principles — How it should
feel, and why." They're the product's stated definition of *good* here — not
motion polish (that's `docs/microinteractions.md` §1's P1–P7, the UI-level
realization of a couple of these, mainly Trust and Depth) but the actual bar a
new screen, flow, or interaction is supposed to clear.

**Who this is for.** Not two personas — a cohort. **Basic User (95% of usage)**
covers eight named roles: Frontend Engineer, Backend Engineer, QA/Tester,
Platform Engineer, Product Manager, Data Engineer, DevOps Engineer, UI/UX
Designer. Two smaller cohorts sit around them: **Agentic Designer** (sets
standards, writes policy gates — needs rules that enforce themselves without
reviewing every output) and **Executive Buyer** (needs proof it's safe and a
defensible baseline, not a hands-on user). This build currently models two of
the eight Basic User roles end to end — the engineer (T1, T7) and the product
manager (PRD, backlog, analytics) — with more of the eight still to come; a
principle check should hold for all eight, not just the two that are built out.

**How to use this doc:** before calling a new UI element, screen, or flow
done, run it against the six checks below. Where you can't honestly answer
"yes," that's either a real gap to fix or a deliberate, statable exception
(the way `docs/DECISIONS.md` Part 3 records the Toolbar-zone gap as *stated*,
not accidental) — never a silent shrug.

---

## 1. Zero Ceremony

> *No Setup Ritual · No Config Screens · Personalized. AAVA adapts to you
> before you adapt to it. Work begins the moment you arrive.*

**In this build:** the home screen (`StartView`) opens straight into a
personalized greeting and a pre-populated task board — no onboarding flow, no
empty state that has to be configured. An object flow (a PRD, a backlog
decomposition, an analytics run) starts the moment its intent is typed in the
composer — there's no "create new →" wizard, no picker, no settings screen to
get through first.

**Check:** does the new thing require a setup step, a config screen, or a
mode to be picked before it's useful? If yes — can it default itself instead
and let the user override later, rather than asking first?

## 2. Eager to Collaborate

> *Conversational First · Proactive · Context Aware · Continuously Learning.
> AAVA behaves like a teammate, not a tool — it asks, suggests, adapts, acts.*

**In this build:** every run opens with a capability-match card naming *which*
agentic process picked up the task and why, before doing anything; a stopped
run (T7) doesn't fail silently — it asks a specific, answerable question
about the two fields it couldn't map; suggestion chips proactively offer the
next likely move instead of leaving a blank composer.

**Check:** does this surface just wait for the user to know what to ask next,
or does it suggest, explain itself, or offer the obvious next step? A dead
end with no chip, no suggestion, and no explanation is a tool moment, not a
teammate moment.

## 3. Meet People Where They Are

> *Teams, Web, IDE, Phone, Voice · Seamless hand-off. Start anywhere.
> Continue everywhere.*

**In this build:** this is what the five-zone/channel model
(`src/zones/resolve.ts`) exists for — a channel declares a capability and the
frame folds or dissolves zones to fit it, rather than the UI being redesigned
per surface. Only Web is fully wired today (see `docs/Architecture.md` §11,
"wired vs foundational"), but every chat and task is already a resumable
thread (`ThreadSnapshot`) — closing one and coming back never loses state,
which is the baseline "continue everywhere" needs even before other channels
exist.

**Check:** does the new UI assume one specific surface in a way that would
break the zone model's fold/dissolve contract (§3 in `Architecture.md`) if a
new channel needed it tomorrow? Does leaving mid-flow and coming back lose
anything it shouldn't?

## 4. Work Finds You

> *Attention is delivered instantly, not searched for. Every notification is
> intentional, taking you where a decision matters next.*

**In this build:** T1 opens already parked on its review gate — the work
happened before the user arrived, not on request; the task board orders by
*whose turn it is* (`BY_TURN` — input/blocked first, done last), not by
recency; the notification bell's unread badge exists to pull attention to
exactly the tasks waiting on a human, nothing else.

**Check:** does this surface make the user go looking for something AAVA
already knows is waiting on them, or does it put that thing in front of them?
A new list, badge, or card should sort by "does this need you" before
anything else.

## 5. Trust is the Currency

> *Evidence · Metrics · Analytics · Integrated Observability. Trust is earned
> through transparency — every action is backed by evidence and is
> observable.*

**In this build:** this is the most heavily wired principle in the codebase.
Every claim has a backing artifact — a `document`/`app` card with an Open
button, an `evidence` block, a `validation` scoreboard (tests/passed/failed/
warnings, not a bare "looks good"); the Watch bar (`zones/WatchBar.tsx`) is an
always-present, append-only log of what's actually happening, and it opens
itself the moment something goes wrong rather than waiting to be checked.

**Check:** if this UI makes a claim ("done," "passed," "found an anomaly"),
can the user click through to the evidence behind it in the same surface? A
claim with nothing to back it — no card, no log line, no scoreboard — doesn't
meet this bar.

## 6. Depth on Demand

> *Progressive Disclosure · Human-Centered Decisions. AI should reduce
> cognitive load, not critical thinking — reveal depth only when it matters.*

**In this build:** a finished capability/plan record collapses to a one-line
`SubtleRecord` (icon · title · badge · chevron), not a full card, once the
work is done; a tool-step accordion auto-folds to `n/n` the instant it
completes; a gate is only visually loud (the golden "waiting on you" border,
replacing the composer) while it's genuinely live — answered, it settles back
to a quiet record.

**Check:** does the new UI stay expanded/prominent after the moment it
mattered has passed? Everyday, already-resolved state should read as quiet
context, not compete for attention with whatever the user actually needs to
decide right now.

---

## Before you ship — the six-question pass

1. **Zero Ceremony** — does this need a setup step it shouldn't?
2. **Eager to Collaborate** — does it suggest/explain, or just sit there?
3. **Meet People Where They Are** — does it honour the zone/channel model and thread resumability?
4. **Work Finds You** — does it surface what's waiting on the user, or make them search?
5. **Trust is the Currency** — is every claim backed by an evidence trail the user can open?
6. **Depth on Demand** — does it quiet down once it's no longer the thing that needs a decision?

Where the honest answer is "no, and that's deliberate" — write it down (a line
in `docs/DECISIONS.md`, the same way the Toolbar-zone gap is recorded) rather
than leaving it unstated. A silent "no" is exactly the kind of drift
`docs/DECISIONS.md` exists to catch before a teammate repeats it.

**Source:** `AAVA 3.0_PI Planning.pdf`, "UX Principles" and "Who Uses AAVA"
slides. Keep this doc in step with that deck if the principles or cohorts
are ever revised there.
