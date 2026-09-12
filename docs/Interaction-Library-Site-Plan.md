# AAVA Interaction Library — Execution Plan

**What this is:** a plan to build one standalone site — a live, browsable
catalogue of every interaction pattern used in the AAVA 3.0 v2 demo — styled
like [beautifui.dev](https://www.beautifui.dev/): a left rail listing every
component/pattern by name, a right pane that shows one at a time with a
heading, a live rendered preview (dummy content, the real animation/motion
running), and an implementation note.

This is a **plan document only** — no site code yet. It exists so the build
can be reviewed and approved before anything is written.

---

## 1. Goal & non-goals

**Goal.** One shareable page a designer, PM, or new engineer can open to see
*every* interaction AAVA uses — thinking dots, streamed text, the run dock,
HITL gates, the match-card grid, toasts, etc. — actually animating, with a
one-line "why" and a pointer to the real source file. It's the interactive
companion to `docs/Design-Style-Guide.md` (Part C, the pattern catalogue) —
that doc *describes* the patterns in prose; this site *shows* them running.

**Non-goals.**
- Not a component library others `import` from — it's read-only, for viewing.
- Not a copy of the real components' code — previews are **re-implemented
  small** to be self-contained and dependency-free (see §5), not literally
  mounting `TaskProgress.tsx` etc. inside the page. Each preview is verified
  against the real component's actual behavior (timings, easings, states) so
  it stays honest, but it does not import app code.
- Not a design tool — no props panel, no theme editor, no code-copy button
  (v1). Possible v2 additions, not blocking this build (§8).

---

## 2. Reference read: what beautifui.dev actually does

Two-pane app shell:
- **Left rail** — fixed width, a logo/wordmark at top, then a flat or grouped
  list of component names. One is always "active" (highlighted). Scoped
  search/filter at the top of the list.
- **Right pane** — scrolls independently of the rail. For the active item:
  a small eyebrow/category label, an `<h1>`-weight component name, a one-line
  description, then a **preview box** — a bordered/framed container, often
  with a subtle grid or dot background, that renders the live component with
  placeholder content — followed by usage/anatomy notes below the fold.
- Switching rail items swaps the right pane's content without a full page
  reload (client-side route/state swap).

AAVA's version keeps this shape exactly (it's a proven, legible IA for "many
small live things") and re-skins it in AAVA's own tokens rather than
introducing a new visual system — see §4.

---

## 3. Information architecture — the component inventory

Grouped exactly as `docs/microinteractions.md` §3 already groups them (source
of truth for names, files, and the P1–P7 principle each serves), **plus** two
patterns that shipped after that doc was last extended (the capability-match
shimmer and the HITL run gate) so the site stays current with the live app.

| # | Group | Component (rail label) | Real source file | Principle |
|---|---|---|---|---|
| 1 | Agent presence | Thinking dots | `src/components/chat/TypingDots.tsx` | P1 |
| 2 | Agent presence | Streamed text | `src/components/chat/StreamedText.tsx` | P1, P6 |
| 3 | Agent presence | Tool-step accordion | `src/components/chat/ToolSteps.tsx` | P1, P2 |
| 4 | Agent presence | Capability-match shimmer | `src/components/chat/Blocks.tsx` (`capability` block) | P1 |
| 5 | Agent presence | Execution-activity graph | `src/prd/AgentGraph.tsx` | P1, P5 |
| 6 | Run status | Run dock (Dynamic-Island) | `src/components/chat/RunStrip.tsx` | P2, P3, P5, P6 |
| 7 | Run status | Task progress | `src/components/chat/TaskProgress.tsx` | P2, P4 |
| 8 | Decisions & gates | Gate → inline Cancel/Send | `src/components/chat/Blocks.tsx` (`ButtonsGate`, `Decision`) | P3 |
| 9 | Decisions & gates | HITL run gate (approve/reject) | `src/prd/AgentExecution.tsx` (`HitlCard`) | P3, P4 |
| 10 | Decisions & gates | Plan → Edit plan | `src/components/chat/Blocks.tsx` (`Plan`) | P3 |
| 11 | Decisions & gates | Honest after-state (Pushed/Skipped) | `src/components/chat/Blocks.tsx` (`Sync`) | — |
| 12 | Canvas & documents | Preview/Code segmented pill | `src/prd/DocumentCanvas.tsx` (`ViewTabs`) | P3 |
| 13 | Canvas & documents | Inline comments (highlight + markers) | `src/prd/DocumentCanvas.tsx` | P5 |
| 14 | Canvas & documents | Changes tray | `src/components/chat/ConversationView.tsx` (`ChangesTray`) | P2 |
| 15 | Canvas & documents | Match card (fit % + workflow) | `src/components/chat/Blocks.tsx` (`MatchCard`) | P1, P5 |
| 16 | Feedback & ambient | Suggestion chips | `src/components/chat/Chips.tsx` | P7 |
| 17 | Feedback & ambient | Toast | `src/components/overlays/Toast.tsx` | P7, P6 |
| 18 | Feedback & ambient | Press feedback (`.press`) | `src/index.css` | P7 |
| 19 | Feedback & ambient | Ambient field / aurora | `src/components/ambient/AmbientField.tsx` | P7, P6 |

19 entries, 5 groups — matches the rail structure in the reference exactly
(grouped list, not flat). Order within a group follows the catalogue's own
order so this stays a drop-in companion to Part C, not a re-sort.

---

## 4. Visual identity — AAVA's own system, not a new one

This site is a showcase *of* AAVA's design system, so it must look like AAVA,
not like beautifui.dev's own neutral shell. Every value below is quoted from
`app/src/design/tokens.css` — nothing invented.

- **Ground / surfaces** — `--ground #0F1117` (page), `--slab #181B25` (rail +
  preview-box chrome), `--slab-raised #212530` (the preview box itself, so it
  lifts one step off its surroundings, matching how AAVA cards lift).
- **Brand** — `--brand #6366F1` (active rail item, focus ring, primary
  actions inside previews).
- **Text** — `--text #F1F5F9` / `--text-dim #CBD5E1` / `--muted #94A3B8` /
  `--muted-deep #79889F`.
- **Hairlines** — `--glass-line #2D3348` / `--glass-line-soft #232839`.
- **Semantic** — `--ok`, `--warn`, `--danger`, `--done` for state pills inside
  previews (tool-step done, HITL waiting, toast tone, etc.).
- **Zone accents** — the five TEE zone colours (violet/green/blue/amber/slate)
  used only where a preview genuinely lives in that zone (e.g. the run dock
  uses the conversation zone's green-adjacent brand, the canvas patterns use
  `--zone-canvas-accent`).
- **Type** — `Geist Variable` / `Geist Mono Variable` (AAVA's own faces),
  loaded the same way the app does, with the same fallback stack.
- **Shape & motion** — `--r-md`/`--r-lg` radii, `--ease`/`--ease-out`,
  `--dur`/`--spring-fast`/`--spring-slow` — every animation in every preview
  reuses these tokens, not new ad-hoc timings, so a thinking-dots stagger here
  matches the real one in the app exactly.
- **Theme** — dark only, matching the product ("dark is the product's look,
  whatever the OS is set to" — tokens.css header comment). No light-mode
  branch needed for v1; noted as a deliberate scope cut in §8.

---

## 5. Layout & interaction spec

```
┌───────────────┬──────────────────────────────────────────────┐
│  AAVA          │  AGENT PRESENCE                               │
│  Interactions  │  Streamed text                                │
│  [search]      │  Replies reveal word-by-word, not character-  │
│                │  by-character, with a live caret.             │
│ AGENT PRESENCE │  ┌──────────────────────────────────────────┐ │
│  ● Thinking... │  │  ░░ preview box — --slab-raised, dotted   │ │
│    Streamed... │  │     grid bg, --glass-line border          │ │
│    Tool-step.. │  │                                            │ │
│    Match shim. │  │   [ live component with dummy copy ]      │ │
│    Exec graph  │  │                                            │ │
│ RUN STATUS     │  │              [ ↻ Replay ]                  │ │
│    Run dock    │  └──────────────────────────────────────────┘ │
│    Task prog.  │  Implementation                                │
│ DECISIONS &... │  src/components/chat/StreamedText.tsx          │
│  ...           │  Per-word delay derives from character rate;   │
│                │  a `finished` set guarantees each line types   │
│                │  once, ever — remounting a thread never        │
│                │  re-plays it.  (P1, P6)                        │
└───────────────┴──────────────────────────────────────────────┘
```

- **Left rail** (≈260px, fixed) — grouped list (5 group headers, 19 rows),
  each row a button; active row gets a left brand-indigo bar + tinted
  background, matching AAVA's own nav-selection pattern. A search input at
  top filters rows by label across all groups. Rail scrolls independently.
- **Right pane** — for the active item: group eyebrow (uppercase, tracked,
  muted) → name (large, semibold) → one-line description (from the table in
  §3/§6) → **preview box**.
- **Preview box** — the single most important surface. Framed card
  (`--slab-raised`, `--glass-line` border, `--r-lg`), generous padding, a
  faint dot-grid background (reuses the orchestration-canvas dot pattern so
  it reads as "this is a demo stage"). Contains the live, running
  interaction built with real dummy content (see §6 for what each shows).
  A small **↻ Replay** control in the box's corner re-triggers
  one-shot animations (streamed text, thinking-dots entrance, toast) so a
  visitor doesn't have to reload the page to see it again.
- **Below the preview** — "Implementation" block: the real source file path
  (monospace, matches AAVA's `--font-mono` treatment elsewhere), a 2-3 line
  note on the mechanism (timings, why it's built that way), and the
  principle tag(s) (P1–P7) as small pills, cross-linking the idea back to
  `docs/microinteractions.md`.
- **Switching** — clicking a rail row swaps the right pane's content in
  place (no reload); the newly active preview's animation runs once on
  mount, matching how it behaves live in the app (e.g. thinking dots start
  immediately, streamed text starts immediately, the run dock is shown
  already expanded once so its morph can be replayed via the button).
- **Responsive** — rail collapses to a top dropdown under ~860px; preview box
  stays full-width. (Single self-contained page, no separate mobile design
  pass needed beyond this.)

---

## 6. What each preview actually shows (dummy content, not lorem)

Every preview uses realistic AAVA copy — the same register as the real app
(task names, agent phrasing) — never `lorem ipsum`, so the page reads as a
plausible slice of the product, not a placeholder gallery. Examples (final
copy decided at build time, this fixes the *kind* of content):

- **Thinking dots** — sits next to "AAVA" avatar, no text yet.
- **Streamed text** — "I'll check the connected Jira project for the ticket
  status first, then draft the summary." typed word-by-word on loop/replay.
- **Tool-step accordion** — `Fetch Jira ticket AAVA-482` → `pending → running
  → done`, auto-folds to "3/3 · done" after ~1.5s, click to reopen.
- **Capability-match shimmer** — the "Artifact Identification (AID-1.0)"
  card shimmering into its matched chips, as in the Agent-Designer flow.
- **Execution-activity graph** — the HLD Architecture Builder's 8-node chain,
  one node genuinely mid-run (pulsing stroke + flowing edge), rest
  QUEUED/DONE.
- **Run dock** — "Drafting solution proposal — step 3 of 5", collapsed;
  Replay expands it into the full phase list and back.
- **Task progress** — joined to a mock composer strip, "Waiting on you —
  Approve the design review" in amber.
- **Gate → inline Cancel/Send** — "Is this accurate?" buttons; clicking
  morphs to a textarea + Cancel/Send on the same footprint.
- **HITL run gate** — "Architect Review needs approval" amber card with a
  Comments box and Approve/Reject, matching `AgentExecution.tsx`'s `HitlCard`.
- **Plan → Edit plan** — a 5-step "Artifact Identification process" plan card.
- **Honest after-state** — a Jira push card retired as "Pushed" vs. a second
  instance retired as "Skipped for now" — both shown so the contrast reads.
- **Preview/Code pill** — a document canvas header with the segment pill;
  clicking the inactive side collapses its label.
- **Inline comments** — a paragraph of HLD text with a highlighted span and
  a numbered marker (`1`) tied to a comment row beside it.
- **Changes tray** — 2 stacked pending edits above a mock composer, "Apply".
- **Match card** — the real HLD Architecture Builder card: 97% fit, meter,
  step chips, 97 runs · 4 teams.
- **Suggestion chips** — "Summarize this," "Find related tickets," "Draft a
  reply" staggering in on Replay.
- **Toast** — "Working copy saved" sliding up on Replay.
- **Press feedback** — a button the visitor can actually click to feel the
  `scale(0.97)`, labelled to invite the click.
- **Ambient field** — a contained square showing the slow drift, since the
  real one is full-viewport — scoped down so it doesn't visually take over
  the page.

---

## 7. Build plan — steps, in order

1. **Scaffold the two-pane shell** — static layout, tokens, fonts, the 19-row
   rail (grouped, searchable), empty preview pane. Verify rail selection
   state and independent scroll before adding any live content.
2. **Build the 5 shared preview primitives** used across multiple entries so
   they're consistent: the framed preview box + dot-grid background + Replay
   button; a status pill (ok/warn/danger/done); a mock composer strip; a mock
   message avatar row; a mono "Implementation" footer block.
3. **Port previews group by group**, in catalogue order (Agent presence →
   Run status → Decisions & gates → Canvas & documents → Feedback &
   ambient) — cross-checking each against its real source file's actual
   timings/easings (word-delay formula, `.7s` spin, `40ms` chip stagger,
   `scale(0.97)`, etc.) so nothing is invented motion.
4. **Wire Replay** on every one-shot preview (streamed text, thinking-dots
   entrance, run-dock morph, toast, chip stagger) — a single re-mount-by-key
   pattern is enough; no separate logic per component.
5. **Search/filter pass** — the rail's search narrows rows by label across
   all groups; empty groups collapse.
6. **Reduced-motion pass** — every animated preview respects
   `prefers-reduced-motion`, exactly as `tokens.css` mandates app-wide, so the
   showcase doesn't contradict the principle it's demonstrating (P6).
7. **Accessibility pass** — keyboard nav through the rail (arrow keys +
   Enter), visible focus rings (`--focus-ring`), `aria-live="polite"` on the
   toast preview exactly as the real one, alt/label text throughout.
8. **One look, one edit pass, ship** — render once locally, fix anything
   visibly broken, then commit + deploy (Vercel auto-deploys `main`).

---

## 8. Explicit scope cuts for v1 (not forgotten, just not blocking)

- No light-mode variant (matches the product's own dark-only stance today).
- No "copy code" button per preview.
- No live props/theme editor.
- No auto-sync mechanism that re-generates entries when a source file
  changes — this is a hand-authored snapshot, refreshed manually when the
  pattern catalogue changes (same discipline as `Design-Style-Guide.md`
  already documents in its own Governance section).
- Mobile gets a functional collapse (§5), not a bespoke mobile redesign.

---

## 9. Decisions (resolved)

1. **Where it lives — resolved: (b), a page in the repo.** Served at
   **`aava-hoffman.vercel.app/interaction`** on the live deploy. Mechanism:
   this is a completely separate surface from the AAVA product (which stays
   "one screen, no routes" per its own law) — not a route *inside* AAVA's
   reducer/arrangement system. It's built as a **second Vite entry point**:
   - `app/interaction.html` — a standalone HTML shell (its own `<title>`,
     mounts `#interaction-root`), alongside the existing `app/index.html`.
   - `app/src/interaction-main.tsx` — its own `createRoot(...)` call, fully
     independent of `App.tsx`/`useJourney`/the reducer. Imports the same
     `index.css` (tokens, fonts, Tailwind) so it inherits AAVA's real design
     tokens without duplicating them.
   - `vite.config.ts` gets a second `build.rollupOptions.input` entry so the
     production build emits `dist/interaction.html` alongside `dist/index.html`.
   - `app/vercel.json` gets one rewrite **before** the existing catch-all:
     `{ "source": "/interaction", "destination": "/interaction.html" }` —
     visiting `/interaction` serves the standalone bundle; every other path
     still falls through to the SPA exactly as today. No router library
     needed for either surface.
   - Local dev: Vite's dev server serves any HTML entry directly —
     `http://localhost:5174/interaction.html` while iterating (the
     `/interaction` no-extension form only exists via the Vercel rewrite, so
     it resolves on the deployed site, not the dev server).
2. **Re-implement vs. literally mount the real components — resolved:
   re-implement**, as originally recommended (§4 non-goals): several real
   components (`RunStrip`, `AgentExecution`) are wired into app state/
   reducers and can't mount standalone without scaffolding that would outweigh
   the benefit. Every preview is built from the same tokens, the same
   `motion`/`lucide-react` libraries, and is checked against the real
   component's actual timings so it stays faithful in behavior, not just look.
3. **Final list — resolved: keep all 19**, exactly as scoped in §3.

---

## 10. Definition of done

- Live at `/interaction` on the deployed app; `/interaction.html` in local dev.
- All 19 entries render, each with a working preview and a correct
  source-file citation.
- Rail search, keyboard nav, and Replay all work.
- Every animation timing matches its real source file (spot-checked against
  `docs/microinteractions.md` §2 foundations table).
- Reduced-motion and focus-visible both verified.
- The rest of the app (`/`) is unaffected — same SPA behavior as before.
