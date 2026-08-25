/* The latency model.
 *
 * Every duration in the prototype resolves through here, so the demo has ONE
 * pacing dial rather than magic numbers scattered across the scenario data.
 *
 * The numbers on the left are what these operations genuinely cost against real
 * services — measured/observed ranges, midpoints taken. We then scale them by a
 * single factor so nothing exceeds ~5s live, while the RATIOS stay truthful: a
 * build still costs ~10x a Jira fetch, which is what makes the system feel real.
 * Compressing everything to a flat 600ms is what makes a prototype read as canned.
 */

/** Scale applied to every real-world duration. 1 = true latency. */
export const SPEED = 0.4

const t = (realMs: number) => Math.max(60, Math.round(realMs * SPEED))

export const T = {
  /* ---- model latency ---- */
  /** Time to first token for a cheap acknowledgement. Real: 400ms–1.2s. */
  ttftFast: t(700),
  /** TTFT when the answer needs reasoning over gathered context. Real: 1.8–3s. */
  ttftReason: t(2400),
  /** Characters revealed per second while streaming. Real: ~45 tok/s ≈ 180 c/s.
   *  Not scaled by SPEED — streaming that is too fast stops reading as streaming. */
  streamCps: 120,

  /* ---- tool calls ---- */
  jira: t(450),        // Jira REST issue fetch. Real: 200–600ms
  figma: t(1600),      // Figma node fetch. Real: 0.8–2.5s, files are large
  repo: t(1200),       // repo scan / code search. Real: 0.5–2s
  contract: t(300),    // OpenAPI contract lookup. Real: 150–400ms
  library: t(400),     // component library index. Real: 200–500ms
  diffScan: t(900),    // read working diff. Real: 0.4–1.5s

  /* ---- build & test ---- */
  npmInstall: t(2800), // warm install. Real: 2–4s
  ngBuild: t(12000),   // Angular first build. Real: 8–20s — the big one
  hmr: t(2000),        // Angular HMR rebuild. Real: 1–3s
  karma: t(6500),      // 11 Karma specs. Real: 4–9s

  /* ---- git ---- */
  prCreate: t(1400),   // create one PR via API. Real: 0.5–1.5s each
} as const

/** Milliseconds to reveal `text` at the streaming rate. */
export const streamMs = (text: string) => Math.round((text.length / T.streamCps) * 1000)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
