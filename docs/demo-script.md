# AAVA 3.0 — Demo Walkthrough Script

Spoken narration for a screen recording. Bracketed lines are stage directions
— everything else is meant to be read aloud. Quoted lines are the actual
on-screen AAVA copy; read them as they appear rather than paraphrasing, since
that's the moment the viewer is reading along with you.

Two runs, back to back, same engine: a PM who starts by describing what she
wants, and a developer who opens work AAVA already moved forward on its own.

Total runtime at a natural pace: roughly 8–10 minutes.

---

## 1. Open

**[SHOW: home screen, Deepak's board]**

> "This is AAVA 3.0. I want to show you two ways work actually starts here,
> because they're both real and they both matter.
>
> Sometimes you know what you want and you just say it — that's intent-based.
> And sometimes work is already assigned to AAVA before you sit down, it goes
> and does what it can, and it only comes back to you at the point it
> genuinely needs a decision — that's task-based. You're not watching a
> process run. You're stepping in exactly where your judgment is the thing
> that's missing.
>
> Let's watch both. First, a product manager turning a PRD into a working
> backlog by just describing it. Then, a developer opening a ticket AAVA
> already finished most of."

---

## 2. Intent-based — from a PRD to a working backlog

**[CLICK: account menu → Switch to Raman]**

> "This is Raman, a product manager. Notice his home is empty — nothing sits
> here until he actually starts something. No dashboard to read, nothing
> waiting on him that isn't real."

**[CLICK into composer, type:]**
> "Here is my PRD, help me create epics and user stories."

**[SEND]**

> "That's it — no wizard, no form. He just says what he wants done."

**[WAIT for the capability-matching shimmer, then the "Capabilities matched" card]**

> "Before AAVA touches anything, it does this — it matches the request to a
> process it actually knows how to run."

**[READ the card:]**
> "This maps to the 'Epics and Features Generator' agentic process. I can
> take it end-to-end: PRD parsing and requirement extraction, backlog
> decomposition — epics into features into stories, definition-of-ready
> checks, sprint planning and story mapping."

> "That distinction matters — it's not improvising. It's telling you which of
> its own capabilities this is, before it commits to anything."

**[WAIT for the plan card]**

> "And then it shows you the plan before running it."

**[READ:]**
> "Here's how I'll approach it — I'll pause for your review after every
> level, then publish the confirmed backlog to Jira and hand sprint planning
> to the scrum master."
>
> "Intake and understanding. Draft epics — pause for review. Break into
> features — pause for review. Write user stories. Publish to Jira."

> "So before a single line gets written, Raman already knows exactly where
> it's going to stop and check with him."

**[CLICK: "Proceed"]**

**[WAIT for the intake accordion to run]**

> "Watch this part closely — this is AAVA actually reading the document, not
> summarizing a title."

**[READ once it lands:]**
> "PRD received — WireFrame Studio, v1.0. I found 5 objectives, 6 user
> roles, 28 functional requirements across 6 categories, and 5
> non-functional areas. Before I build anything, here is what I understood."

**[CLICK: the intake.md card → opens in the canvas]**

> "And that's a real document, not a chat bubble — something you can read,
> comment on, download."

**[POINT: the status strip hanging from the header, reading the current step and "waiting on you"]**

> "This strip up here is the run's status, live. However far into a
> multi-step process this gets, you never have to scroll back up the
> conversation to find out where it stands or what it's waiting on."

**[READ the gate:]**
> "Take a look in the canvas and flag anything I have misread — I will not
> move on until you confirm."

**[CLICK: "Yes, this is accurate"]**

**[WAIT for epics]**

**[READ once they land:]**
> "7 epics drafted, open in the canvas — each on the same template:
> Background, Details, Benefits, Assumptions, Priority. Comment on any line,
> the way you would on code; I will fold every note back in before locking
> these."

> "Seven real epics, each with an actual priority — not filler text."

**[CLICK: "Yes, break them into features"]**

**[WAIT for the Jira offer]**

**[READ:]**
> "7 epics confirmed. Want me to push them to Jira now, or proceed for
> features creation and publish later?"

> "This choice comes up at every level — publish this piece now, or keep
> moving and publish later. Nothing gets forced on him."

**[CLICK: "Publish"]**

**[READ the confirmation:]**
> "Pushed the 7 epics to Jira with parent–child links. Continuing."

**[WAIT for features]**

**[READ once they land:]**
> "23 features across the 7 epics, open in the canvas. Three of them are
> missing fields I could not infer from the PRD — target start date, end
> date and priority: Feature 1.3, 5.3 and 7.2. I have highlighted the gaps
> right in the doc."
>
> "You can fill those in and I will fold them into the list, or proceed and
> leave them flagged for later."

> "This is the part I actually want you to notice. It's not faking
> completeness — it's telling you exactly what it couldn't decide on its
> own, and handing that decision to a person instead of guessing."

**[CLICK: "Proceed without this info"]**

**[CLICK: "Yes, decompose into stories"]**

**[WAIT for the Jira offer on features — this time CLICK "Skip"]**

> "This time I'll skip publishing — just to show it's optional, not a
> checkpoint you're forced through."

**[WAIT for stories]**

**[READ:]**
> "58 stories confirmed. Want me to push them to Jira now?"

**[CLICK: "Push the 58 stories to Jira"]**

**[WAIT for success]**

**[READ:]**
> "Successfully created the stories on Jira. As part of this process, the
> next step involves sprint planning and is assigned to the scrum master.
> No more actions on you for now."

**[WAIT — AAVA follows up on its own]**

**[READ:]**
> "One thing before you go — you skipped publishing the 23 features
> earlier. Want me to push it to Jira now?"

> "That's the detail worth pausing on. Three steps back, he skipped
> publishing the features. AAVA didn't forget — it's the one bringing it
> back up, at the natural moment, instead of that just quietly staying
> undone."

**[Optional — CLICK the "Execution activity" icon in the header]**

> "And any time you want to see who actually did the work — this is the
> real agent chain that ran it: the PRD parser, the epic generator, the
> feature generator, the story generator, the review gate. Colored by what
> genuinely happened in this run, not animated for effect."

> "That's the full arc — one sentence in, a reviewed, partially-published
> backlog out, with a human decision at every level that actually needed
> one."

---

## 3. Task-based — a ticket AAVA already moved on

**[CLICK: account menu → Switch to Deepak]**

> "Now the other side. This is Deepak, a developer — and unlike Raman's
> empty home, his board already has work sitting on it."

**[SHOW: task board — "Add product feedback form · Ready for review"]**

> "This ticket was assigned to AAVA before Deepak ever opened his laptop.
> Nobody prompted it this morning. It's already done what it could, and it's
> only sitting here because it's actually reached the point where it needs
> him."

**[CLICK: the task card]**

> "And notice — no loading, no 'let me think about it.' It opens straight to
> the exact point that needs a decision."

**[POINT: the status strip — "9/10 steps · Waiting on you · Human-in-the-loop Review"]**

> "Same idea as before — you can see at a glance this run is nine steps in
> and parked, waiting specifically on him."

**[POINT: "Capabilities matched — UI Screen Generator Process"]**

> "Same capability-matching under the hood — this run just already finished
> it, so it's tucked away as a quiet record instead of a big card up front."

**[CLICK to expand the "Reading the ticket & the design" step]**

**[READ:]**
> "MOB-2841 matched the Feedback Form v3 frame cleanly. Six PLAY components
> in the design — four already in the library, two I built and staged for
> their own PR."

**[POINT: "Building & wiring the screen"]**

**[READ:]**
> "The endpoint was already live, so no contract change. I generated the
> Angular page, wired it to POST /api/v1/feedback and registered the
> route — seven files in all."

**[READ the completion line:]**
> "All the requirements were clear — I read the ticket, matched the design
> against the PLAY library, and implemented the feedback screen end-to-end.
> It is running in the preview on the right, ready for your review."

**[SHOW: the live app in the preview panel — actually interact with it: pick a rating, type a comment]**

> "And that's not a screenshot — that's the real thing it built, running
> right there. You can use it before you ever approve anything."

**[READ:]**
> "Would you like to review the code changes?"

**[SCROLL to the gate at the bottom: "Waiting on you · Step 10 — Raise both pull requests"]**

> "And here's exactly where it stops. It will not open a pull request
> without Deepak saying so."

**[READ:]**
> "Raise both pull requests — PLAY: FormField, CharacterCounter. Product:
> Feedback page, API integration, 11 specs passing."

**[CLICK: "Raise both PRs"]**

**[WAIT for confirmation]**

**[READ:]**
> "Both PRs raised."

> "That's the whole shape of it — AAVA does everything it can safely do on
> its own, and it stops at precisely two moments: when there's something
> worth reviewing, and when the work is about to go in front of other
> people."

---

## 4. Close

**[SHOW: either home screen]**

> "Same engine both times. Raman drove it by just describing what he
> wanted. Deepak walked into work that was already moving without him.
> Either way, AAVA does everything it reasonably can on its own — and it
> only asks for you at the calls that were always yours to make."

**[END]**

---

### Notes for recording

- The **Publish → Skip → Publish** sequence in the backlog run isn't
  arbitrary — the "you skipped the features earlier" follow-up only fires if
  something was actually skipped, so that exact sequence is what produces
  that payoff moment. Keep it as written if you want that beat to land.
- Every quoted line is pulled verbatim from `src/prd/backlogFlow.ts` and
  `src/scenarios/t1.ts` (the second half was also spot-checked live in
  browser). If the copy in those files changes later, re-diff this script
  against them before recording again.
- To cut it to ~5 minutes: drop the Execution-activity aside, shorten each
  "read the card" moment to one sentence, and don't narrate the "why it
  matters" line after every single beat — save it for 2–3 key moments
  (capability match, the missing-fields gate, the skipped-features
  follow-up, the PR gate).
