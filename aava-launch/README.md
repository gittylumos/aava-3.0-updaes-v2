# AAVA 3.0 — pitch film (64 s, narrated) + launch cut (29 s)

A code-rendered film: real AAVA UI flying in, soft blur-in headlines, and a clean end card.
- **Pitch cut (current `film.js`)**: 64 s, explanatory pitch with a voice-over (`docs/vo_script.md`).
  Final cut: `out/aava-launch/final.mp4` (+ `poster.png`). Narration: Kokoro-82M offline TTS, warm US
  male voice, built by `audio/vo.py` (see `docs/vo_script.md`).
- **Launch cut**: the original 29 s music-only version, `out/aava-launch/launch-29s.mp4`
  (+ `launch-29s-poster.png`); its source is the first commit that added this directory.

- **Plan:** `docs/shotlist.md` (launch cut, 124 bpm) and `docs/vo_script.md` (pitch cut: script + slot per line on the 120 bpm grid in `beats.json`). Shots 2–6 of the pitch reuse the launch choreography through a time warp (`WARP` in `film.js`).
- **Review log:** `docs/critique.md`, three critique rounds with scores.
- **Film:** `film.js` is a pure function of time. `window.seek(t)` paints frame `t`, and
  `lib/motion.js` is the harness.
- **Screens:** `assets/shots/` holds real captures of this repo's prototype (`app/`) at 1600×1000 @2x,
  taken with Playwright against `npm run dev`: home, the T1 review gate, the T7 validator gate, a PRD
  draft, the run-progress dock, and the canvas tabs (Overview, Code, Terminal, Changes, Execution activity). Nothing in the film is a mock screen.
- **Brand:** colours from `app/src/design/tokens.css` (the aurora is the single accent), Geist + Geist
  Mono from the app's bundled fonts, and the AAVA mark redrawn as vectors from `app/src/assets/aava-logo.png`.
- **Copy:** the product's own lines (`assets/copy.md`).

Preview it in a browser by serving the repo root (`npx serve .` or similar) and opening `/aava-launch/`.
Space plays or pauses, ←/→ steps a frame, and a click scrubs. The audio (`audio/*.wav`) and render
outputs are regenerated with the motion-reel skill's `beats.py`, `sfx.mjs`, `mix.mjs` and `render.mjs`
scripts and aren't committed, except the final MP4 and the poster.
