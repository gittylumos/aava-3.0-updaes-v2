# /brag plan — AAVA 3.0

## Understanding
- **What it is:** an agentic assistant that starts work on your behalf, gathers what it needs before you arrive, and stops exactly where a human has to decide.
- **For:** the people who do the actual work (engineers, PMs, QA, designers) and lose hours to coordination, not judgment.
- **What sets it apart:** you don't kick it off and babysit it. It's triggered, does the prep, and *parks on purpose* at a visible decision gate.
- **Most impressive claim (the product's own):** one feedback screen = ~10 manual steps across 8+ tools, 15+ context switches. AAVA collapses that to a handful.
- **Visual hook:** the home screen opening with "I have worked on a couple of your tasks."
- **Real UI shown:** start screen → finished feedback-form task, raising both PRs from its review gate → refunds-API run stopped at a validator gate → a PRD drafted from one typed sentence.
- **Tone:** `polished`, leaning a little `app-store`. It's a serious product, and the humor is just the contrast between the grind and "it's already done."
- **Share caption:** "AAVA does the heavy lifting. You make the decisions."

## Angle
**"The work's already done. You just decide."** Open on the cost of coordination, then reveal an assistant that greets you with finished work and only asks for your judgment.

## Visual identity (from `app/src/design/tokens.css`)
- Ground `#0F1117`, slab `#181B25`, border `#2D3348`, text `#F1F5F9`, muted `#94A3B8`.
- Status: success green, "waiting on you" amber. Aurora gradient appears only on the brand mark (as in the product).
- Type: Geist Variable / Geist Mono (the app's bundled fonts).
- All UI is frame-stepped captures of the real running app (Playwright with a fake clock), framed in a floating window with slow camera moves.

## Privacy
Demo personas (Deepak, etc.) are the prototype's fictional seed data. No org names, hostnames or secrets appear. The `localhost:4200` preview URL is scripted demo text, not real infrastructure.

## Music
120 BPM (0.5s beat, 2s bar), A minor, 30fps. Soft four-on-the-floor kick, offbeat hats, sub bass, warm pad, pluck arpeggio. Every cut lands on a beat. SFX (whoosh into cuts, soft clicks, a chime when the PRs land) are in key and tucked under the music.

## Storyboard v2 (32.0s, extended cut: brag.mp4)

Extended on request to show the Canvas tools, the task-progress notch, source citations, the evidence panel and the execution flow. That takes it past the usual 15–25s window, a deliberate trade for coverage. The original 22.5s cut is kept as `brag-v1-22s.mp4`.

| # | Time | Beat | On screen | Text |
|---|---|---|---|---|
| 1 | 0.0–4.0 | Hook | Tool chips (ticket, design file, IDE, terminal, PR…) pile up | "Shipping one feedback screen" / "8 tools. 15+ context switches." |
| 2 | 4.0–7.0 | Reveal | AAVA home, push in on "I have worked on a couple of your tasks", click the feedback-form task | "Or just open AAVA." |
| 3 | 7.0–10.5 | Canvas tools | Canvas "+" menu, then Code (Monaco + explorer), Terminal (dev server), Changes (diff), Browser preview, one tab per beat. Tool-chip row tracks the active tool | "Built before you got here." |
| 4 | 10.5–15.0 | Evidence | Task-progress notch drops open (9/10 steps, each with its proof). Click "Verified API contract" and the Evidence panel opens on the right. Then a Jira citation pill's hover card | "Every step cites its evidence." |
| 5 | 15.0–17.5 | Execution flow | Execution activity graph (agent / tool / human nodes), panning to the amber Human-in-the-loop Review node | "See the whole run." |
| 6 | 17.5–21.0 | Approve | Click Raise both PRs; push, PR and link rows resolve; "Both PRs raised." | "You approve. It ships." |
| 7 | 21.0–25.0 | Gate | Refunds-API validator 18/2, pan to the amber approval gate | "Unsure? It stops and asks you." |
| 8 | 25.0–28.5 | Intent | Type "Create a PRD for a referral program", then the PRD canvas | "Or just say what you want." |
| 9 | 28.5–32.0 | Punchline | AAVA mark | "AAVA does the heavy lifting. / You make the decisions. / AAVA 3.0" |

Music: same 120 BPM A-minor score, retimed. Soft UI ticks on each tool-tab cut, clicks on the notch row and the PR button, and in-key chimes when evidence opens, the review node lights, the PRs land, the gate lights and the PRD appears. Final chord at 30.0s.

## Storyboard v1 (22.5s): brag-v1-22s.mp4

| # | Time | Beat | On screen | Text (hold) |
|---|---|---|---|---|
| 1 | 0.0–3.5 | Hook | Dark ground. The coordination grind as faint texture words (ticket, design, components, API contract, IDE, terminal, review, PR) drifting and stacking up. | "Shipping one feedback screen" → "8 tools. 15+ context switches." |
| 2 | 3.5–6.5 | Reveal | Hard cut on the downbeat. AAVA home slides up in a window and the camera pushes in on the greeting and the three task cards. | "Or open AAVA. It already started." |
| 3 | 6.5–11.0 | Highlight 1 | Feedback-form task, already built, live preview on the right, parked at "Raise both pull requests". Cursor clicks **Raise both PRs** and the tool rows resolve one by one: "All steps complete · Both PRs raised." | "Built before you got here." |
| 4 | 11.0–15.0 | Highlight 2 | Refunds-API run: Validator results 18 passed / 2 failed, then a pan down to the amber gate "Approve how the two unmapped fields are handled". | "It stops where you decide." |
| 5 | 15.0–18.5 | Highlight 3 | Composer types "Create a PRD for a referral program", then cut to the PRD canvas filling in. | "Or just say what you want." |
| 6 | 18.5–22.0 | Punchline | AAVA mark with aurora, the line, then the product name. | "AAVA does the heavy lifting." / "You make the decisions." / "AAVA 3.0" |
