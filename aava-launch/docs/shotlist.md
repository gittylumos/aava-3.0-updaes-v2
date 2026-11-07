# AAVA 3.0 — launch film · shot list

29.0 s · 16:9 1920×1080 · 60 fps · synthesized lo-fi bed, D dorian, 124.14 bpm (1 beat = 0.483 s, 60 beats).
Grid: `beats.json` — intro u0–8 (soft kick), main u8–56, end bar u56–60 (resolve chord).

**Look.** The product's own dark ground (`#0F1117`), slab cards (`#181B25`), text `#F1F5F9`.
One accent: the brand's aurora (`#FF7AC6 → #A78BFA → #5B9DFF`), used on one word per caption,
the low ambient field behind the UI, and the end-card sweep, nothing else. Display face Geist, UI face
Geist Mono (both the app's bundled fonts). All screens are real captures of the running prototype
(`assets/shots/`), only cropped, tilted and moved. Copy is the product's own lines from
`docs/Product-Context.md` / `docs/UX-Principles.md`.

| # | beats (s) | shot | asset | motion | transition out | sound |
|---|-----------|------|-------|--------|----------------|-------|
| 1 | 0–8 (0–3.9) | **Headline, soft blur-in.** "Ten steps." / "Eight tools." left-aligned, large. Frame 0: "Ten" already half-resolved. | type only, ambient aurora low right | each word resolves from blur 28 px + 6% scale + 30 px drift, word on each beat (u0, 1, 2, 3); slow 3% push throughout | words defocus back (blur up, scale 0.92) while the UI rises in behind (u6–8) | tick per word, swell into u8 |
| 2 | 8–20 (3.9–9.7) | **Home flies in.** The full AAVA home ("Good afternoon, Deepak", three task cards) arrives from below on a 3-D tilt and lands flat on the drop. Caption "Work *finds* you." | `shots/home.png` | tilt 58°→0 (spring, gentle), y from below, slight roll; lands u8; camera log-zooms into the task cards u13–19 | push into the "Add product feedback form" card | impact u8 (drop), pop on caption, whoosh into card |
| 3 | 20–32 (9.7–15.5) | **Ready for review.** The task's run: running preview + the review gate. Caption "Ready *before* you are." | `shots/review.png` | match-cut: card push ends, the run screen arrives already zooming out (log); u26 the real gate card lifts off the screen toward camera (2.5-D, shadow) | whip left: both screens on screen | thud u20, pop u22, whoosh+pop u26 |
| 4 | 32–44 (15.5–21.3) | **It stops where you decide.** The refunds migration parked at a validator gate. Stats card (20 / 18 / 2 / 3) pops forward, then the gate lifts; the approve button gets a press. | `shots/validator.png` | whip in from right u32; stats lift u34; gate lift u38; button press u41 | log pull-back (screen becomes one pane of four) | whoosh u32, click u34, pop u38, tick press u41 |
| 5 | 44–52 (21.3–25.1) | **One place.** Four real screens (home, PRD canvas, review, validator) fan into a floating stack in depth. Caption "One *place.*" pays off shot 1. | all four shots | panes fly in staggered on u44, 45, 46, 47 from depth; slow orbit | panes fall back and defocus, end card resolves through | whoosh per pane (pitched), pop u48 |
| 6 | 52–60 (25.1–29.0) | **End card.** AAVA two-tone mark, "AAVA 3.0", then "AAVA does the heavy lifting. You make the decisions." | brand mark (vector redraw of `assets/aava-logo.png`) | mark springs in from blur u52; wordmark per-glyph u52.5; tagline blur-in u54; aurora sweep across the mark on u56 (resolve chord); holds 3 s still | — | impact u52, bell u53, resolve chord u56 |

Formats: 16:9 only (the brief named no social cut). A 9:16 cut can follow from the same film with
`FORMAT.pick` layouts if wanted.
