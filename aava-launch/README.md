# AAVA 3.0 — launch film (29 s)

A code-rendered launch film: real AAVA UI flying in, soft blur-in headlines, and a clean end card.
The final cut is `out/aava-launch/final.mp4` (1920×1080, 60 fps, H.264 + AAC, mastered to -14 LUFS),
and its poster frame is `out/aava-launch/poster.png`.

- **Plan:** `docs/shotlist.md`, six shots on a 124 bpm beat grid (`beats.json`).
- **Review log:** `docs/critique.md`, three critique rounds with scores.
- **Film:** `film.js` is a pure function of time. `window.seek(t)` paints frame `t`, and
  `lib/motion.js` is the harness.
- **Screens:** `assets/shots/` holds real captures of this repo's prototype (`app/`) at 1600×1000 @2x,
  taken with Playwright against `npm run dev`: home, the T1 review gate, the T7 validator gate, and a
  PRD draft. Nothing in the film is a mock screen.
- **Brand:** colours from `app/src/design/tokens.css` (the aurora is the single accent), Geist + Geist
  Mono from the app's bundled fonts, and the AAVA mark redrawn as vectors from `app/src/assets/aava-logo.png`.
- **Copy:** the product's own lines (`assets/copy.md`).

Preview it in a browser by serving the repo root (`npx serve .` or similar) and opening `/aava-launch/`.
Space plays or pauses, ←/→ steps a frame, and a click scrubs. The audio (`audio/*.wav`) and render
outputs are regenerated with the motion-reel skill's `beats.py`, `sfx.mjs`, `mix.mjs` and `render.mjs`
scripts and aren't committed, except the final MP4 and the poster.
