# AAVA 3.0 — Product Context

**What this document is.** A single, portable source of truth for what AAVA
3.0 *is*, at the product and layout level — not a UI spec, not a component
inventory, not a codebase reference. It's meant to be lifted out of this repo
and dropped into any AI tool or conversation as context: to explain the
product to someone new, to check whether a new idea still fits the definition
below, and to periodically re-validate whether the principles and direction
here still hold as AI-native platforms and their expectations keep moving.
Nothing in this document depends on how any of it is currently implemented —
that's `docs/Architecture.md`'s job, one layer down.

Source: `AAVA 3.0_PI Planning.pdf` and `Common_Journey_v0.docx` (the internal
design deck and constitution this was built from). Keep this document in step
with those if the product's direction is formally revised — and revise this
document, not just the deck, so it stays the thing people actually read.

---

## 1. Why AAVA 3.0 — the backstory

Three things converged to start this:

- **AI itself is moving toward autonomy.** The industry's shifted from plain
  AI assistance, to agentic systems that can act, to a push toward higher
  autonomy still — and that shift is already underway, not speculative.
- **Customers asked for it directly.** The consistent feedback from the field
  was for greater autonomy, fewer manual steps, and faster outcomes — not
  incrementally better assistance inside the same number of steps.
- **The ecosystem finally caught up.** Models, protocols, and developer
  tooling have matured to the point where this is practical to build now,
  not just to design.

**AAVA 3.0 is the response to that: the next generation of software**, built
around one thesis — an engineer today builds something as simple as a
feedback screen through roughly ten manual steps across eight or more tools
(Jira for the ticket, Figma for the design, a component library, an API
contract, an IDE, a terminal, a review, a PR) — fifteen-plus context
switches, two to four hours, most of it coordination rather than judgment.
AAVA 3.0's bet is that an agentic system can do that preparation *before* the
person arrives, collapsing it to a handful of steps in one place. The line
this is built to prove: **"AAVA does the heavy lifting. You make the
decisions."**

## 2. What AAVA 3.0 is — the definition

**AAVA 3.0 is an agentic assistant that starts work on a person's behalf,
gathers what it needs from across their real ecosystem before execution
begins, and stops precisely at the moments a human has to decide something —
never earlier, never later.**

Concretely, that means two things happening that don't happen in a chat tool:

- **It's triggered, not just asked.** Real-time signals (a message in a chat
  tool, a new or updated ticket) can start a run before anyone opens AAVA at
  all. By the time a person does look, the groundwork — reading the design,
  checking what components already exist, confirming the API contract, and
  so on — is already done, pulled from the actual systems the work lives in
  (the design tool, the code repository, the product documentation, the API
  registry, the design system), not guessed at.
- **It stops on purpose, not by accident.** Where a decision genuinely needs
  a person — an ambiguous requirement, a judgment call, a sign-off before
  something ships — the run parks there visibly and waits. It doesn't guess
  past that point, and it doesn't hide the fact that it's waiting.

The result a person experiences is a handful of steps instead of many: the
work is either already done and waiting for review, or it's stopped at
exactly the one question that needed a human — either way, the person's time
goes to reviewing and deciding, not to coordinating.

## 3. Who it's for — the audience

Not one persona, and not two — a cohort, plus two smaller groups around it.

- **Basic User — roughly 95% of usage.** "Does the actual work," across many
  profiles: **Frontend Engineer, Backend Engineer, QA/Tester, Platform
  Engineer, Product Manager, Data Engineer, DevOps Engineer, UI/UX
  Designer.** What they ask for is faster coding, less boilerplate, fewer
  interruptions — what they actually need runs deeper: **the coordination
  removed, not the typing**, so their time goes back to design and review.
- **Agentic Designer — few.** Sets the standards, writes the policy gates,
  builds the boundaries the agents operate inside. Their ask is to say yes to
  AI without losing control of the codebase; their need is rules that
  enforce themselves, because they can't review every output and shouldn't
  become the bottleneck for everyone else's work.
- **Executive Buyer.** Signs off on the investment and carries it to the
  board. Wants a productivity number and a competitive story; needs proof
  it's safe, a defensible baseline to measure from, and adoption that
  survives past the second month. Not a hands-on user of the product at all.

A persona's stated want is a starting point, not the answer — what solves
their problem is often one level underneath what they first ask for (the
Basic User cohort asks for "faster coding" but needs "coordination removed";
that gap is deliberate and worth checking against for any new capability).

## 4. How someone engages AAVA — the two entry points

- **Task-based** — starts from a predefined task or ticket already sitting
  in the system.
- **Intent-based** — starts from a person simply stating a goal, with no
  ticket or task behind it yet.

Both are first-class, and a person should be able to move fluidly between
them — picking up a task, or just saying what they want done.

## 5. The principles — how it should feel, and why

Six principles define the *feel* AAVA is meant to have, at the product
level — independent of any particular screen:

1. **Zero Ceremony.** No setup ritual, no configuration screens to get
   through first. AAVA adapts to the person before they have to adapt to it;
   work begins the moment they arrive.
2. **Eager to Collaborate.** Conversational, proactive, context-aware,
   continuously learning. AAVA behaves like a teammate, not a tool — it
   asks, suggests, adapts, and acts, rather than waiting to be told exactly
   what to do next.
3. **Meet People Where They Are.** Teams, web, IDE, phone, voice — with
   seamless hand-off between them. Work starts anywhere and continues
   anywhere; a conversation, a task, and its context move with the person
   instead of resetting per surface.
4. **Work Finds You.** Attention is delivered, not searched for. The
   platform pulls a person to wherever their attention creates the most
   value right now; a notification is only ever sent when a decision
   actually needs them there.
5. **Trust is the Currency.** Trust is earned through transparency — every
   action is backed by evidence, and every outcome is measurable, optimized,
   and observable. Nothing asks to be taken on faith.
6. **Depth on Demand.** AI should reduce cognitive load, not critical
   thinking. Everyday work stays effortless; depth is revealed only when it
   actually matters, so a person's judgment stays engaged exactly where it
   creates value — not everywhere, and not nowhere.

Any new capability or interaction should hold up against all six — not as a
UI checklist (that's a separate, implementation-level concern) but as a
product-level question: does this still feel like zero ceremony, still earn
trust through evidence, still surface depth only when it's earned?

## 6. The layout model — one frame, five zones

AAVA's interface is deliberately **not a pile of screens**. It's one
consistent frame made of five zones, each answering exactly one question:

| Zone | The question it answers |
| --- | --- |
| **Where am I** | orientation and identity — navigation, the current context |
| **What can I do** | the actual work surface — the conversation, the reasoning, the decisions waiting on a person |
| **What am I working on** | the object of the work itself — whatever's being built, reviewed, or investigated |
| **How am I looking at it** | the current lens over that object — which view, which format |
| **What's happening** | transparency into activity — what's running, what's finished, what needs attention |

The same five zones exist on every surface AAVA runs on. What changes per
device or channel is *presence*, not the model itself: a zone can be
**primary** (front and centre), **folded** (compressed to a minimal form but
still present and remembering its state — collapsed, not gone), or
**dissolved** (not present at all on that surface, because it genuinely
doesn't apply there). A phone might dissolve the zone that shows the
work-object entirely and lean on conversation alone; an IDE panel might
borrow that same zone from the host editor rather than drawing its own. What
never happens is a *different* layout being designed per surface — the
frame folds and dissolves to fit; it is never rebuilt.

*(This section deliberately stops at the concept. How each zone is actually
rendered, styled, or interacted with belongs in the implementation-level
architecture docs, not here.)*

## 7. What's been validated so far

As of this writing, AAVA 3.0 is in **Phase A — Design & Discovery**:

- The direction, personas, and the six principles above: **agreed.**
- A critical user journey and the overall experience map for the first
  persona (the developer, building something as small as a feedback
  screen): **agreed and validated** through a clickable prototype.
- Further journeys for more of the Basic User cohort — starting with a
  product manager's work (drafting a requirements document, breaking it into
  a backlog, investigating what happened after a release) — have also been
  modelled and demoed the same way.
- **System design** — how the platform actually functions behind the scenes
  to handle all of this — is **in progress**, not finished.

Target for a release candidate: **Q1 2027.**

## 8. Where it's heading — the emerging direction

Five themes are shaping where AAVA goes next, still under active discussion
rather than committed:

1. **Plugin-first, thick client** — AAVA works where people already work,
   rather than pulling them somewhere new.
2. **One platform, unified experience** — capabilities converge into a
   single intelligent workspace instead of staying scattered.
3. **Ask AAVA, conversation first** — asking AAVA becomes the default way to
   interact; AI becomes the primary interface, not an add-on to one.
4. **Proactive by default** — event-driven, notification-driven work, mobile
   for taking action, web kept light and reserved for admin and reporting.
5. **Simplicity by design** — only two or three core screen patterns; the
   lightest version of AAVA that's still the most capable one.

## 9. How to use this document

Come back to this document — not the deck, not the code — whenever:

- **Someone new needs the product explained.** Hand them this, not a
  screen-by-screen walkthrough.
- **A new idea or capability is being considered.** Check it against §2 (is
  this still "prepare, then stop at the decision"?), §3 (does it serve the
  actual eight-role cohort, or just the one or two personas already built
  out?), and the six principles in §5.
- **The product's direction needs re-validating**, especially as what
  "AI-native" means keeps shifting industry-wide. Worth asking periodically:
  - Do the six principles in §5 still describe what a genuinely AI-native
    experience should feel like — or has the bar moved?
  - Is §3's audience still accurate, or has usage shown a different cohort
    actually needs a different treatment?
  - Is §7 still true, or has "validated" quietly started to mean something
    weaker than an actual clickable, agreed-upon journey?
  - Are any of §8's five directional themes now decided, abandoned, or
    superseded by something not listed here yet?

If the answer to any of those has changed, update this document itself —
it's the thing meant to stay current, not a historical snapshot of one
planning session.
