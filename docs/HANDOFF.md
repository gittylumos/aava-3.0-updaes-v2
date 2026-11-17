# AAVA 3.0 prototype — session handoff

Written 2026-11-18 for a fresh Claude Code or Codex session. Read it top to bottom, then start from "Open work".

## 1. What this project is

A React 19 / TypeScript / Vite / Tailwind v4 clickable prototype of **AAVA 3.0** (an AI agent workspace for product and engineering teams). Everything is scripted: no backend, no model calls. One reducer (`state/reducer.ts`) plus a journey hook (`state/useJourney.ts`) plays scenarios made of "beats" and "effects". The user demos it in a room.

The demo covers **three sessions only** (the General user's home cards):
- **T1** Add product feedback form (Jira MOB-2841). Review gate, then PR gate.
- **T7** Migrate the refunds API to the v2 schema (PAY-3120). Three confirms.
- **T2** Modify the progress bar behavior (MOB-2907). Clarify only, no scenario file (plays from the task's `opening` lines).

## 2. Repos and worktrees (all under `/Users/sreeramkammara/Desktop/aava-3.0/`)

There are two unrelated GitHub repos. The work below is in the **v2** repo (`gittylumos/aava-3.0-updaes-v2`). The Downloads `aava30_proto` checkout (`naraharinalluri/aava30_proto`) only holds docs, `CLAUDE.md` and `.claude/launch.json`.

| Folder | Branch | What it is | Pushed |
|---|---|---|---|
| `aava-3.0-updaes-v2` | `main` | The original colour app. Has **uncommitted** T1 work (copied into the low-fi baseline, see §3). Dev server on 5175. Do not deploy from it. | no |
| `aava-3.0-updaes-v2-lowfi` | `feat/low-fidelity` | Grey wireframe of the web app | yes |
| `aava-3.0-updaes-v2-lowfi-ide` | `feat/lowfi-ide` | VS Code surface demo | yes |
| `aava-3.0-updaes-v2-lowfi-cli` | `feat/lowfi-cli` | CLI surface demo | yes |
| `aava-3.0-updaes-v2-deploy` | **`deployment-v2`** | All three merged, route-switched. **This is the one to build on.** | yes |

Each worktree has its own `app/` (run everything from there; the repo root only holds `vercel.json`/docs). `node_modules` were copied in (`cp -cR`), so no install is needed.

## 3. What has been done

**T1 changes** (in `scenarios/t1.ts`, `components/chat/*`, `state/*`): "Need your input" tag; capability and plan merged into one collapsed record ("UI Screen Generation Process", with "Matched capability"); collapsible pinned "Waiting on you" gate; new "Feedback form is ready" gate (Refine changes / Review changes) before the PR gate; Validation results link above the app card; right panel opens Overview, Validation, then Preview.

**Low-fidelity web** (`feat/low-fidelity`): `design/wireframe.css` redefines every colour token as grey and adds a root `filter: grayscale(1)` for hardcoded colours. `useTheme` is locked (`THEME_LOCKED`) and the three theme toggles are hidden. Plus: "View all my tasks" removed; centred **General user / First time user** dropdown on the home (first time = no tasks, recents, pins or notifications); one profile **"Alex"** (no profile switching); task progress strip is static (no pulse/shimmer).

**IDE surface** (`src/ide/`): VS Code window mock, AAVA panel on the right. Canvas is "borrowed": code in editor tabs, diff editor, Integrated Browser on localhost:4200 with an `ng serve` terminal, Validation results as a Markdown tab. One status bar item; one toast per gate. Spec and 12-item constraint log: `docs/surfaces-plan.md`.

**CLI surface** (`src/cli/`): terminal window. Numbered session list and gates, slash commands (`/help`), artifacts printed as text (diff, validation table, steps, context, `ng serve`), preview overlay, `/user general|first`.

**Single entry** (`src/main.tsx` on `deployment-v2`): path decides the surface and each is lazy-loaded: `/ide` → IDE, `/cli` → CLI, anything else → web.

**Quality gates passed** on `deployment-v2`: `tsc -b`, `npm run build`, 106 tests, oxlint (two pre-existing warnings in `InlineSource.tsx`). Each surface had a review and a fix round.

## 4. Deployment (Vercel, team `team_E0vylwUzOA8uzCRA6YJ9jwHc`)

| Project | URL | Built from | Notes |
|---|---|---|---|
| **aava-lofi** | https://aava-lofi.vercel.app (`/`, `/ide`, `/cli`) | `deployment-v2` | the current deliverable |
| aava-hoffman | https://aava-hoffman.vercel.app | colour app | **never touch** |
| aava-lowfi, aava-lowfi-ide, aava-lowfi-cli | same-name `.vercel.app` | single-surface branches | now redundant; the user has not said whether to delete them |

How I deployed (from the `deployment-v2` worktree's `app/`, which is linked to `aava-lofi` via `app/.vercel/`, gitignored):
```bash
env -u VERCEL_TOKEN vercel deploy --prod --yes --scope team_E0vylwUzOA8uzCRA6YJ9jwHc
```
Deploys use local files and do **not** auto-run on push (no Git integration). Check the result with `curl` for each route, then open it in a browser.

## 5. Gotchas (these cost time)

- **The shell has an invalid `VERCEL_TOKEN`** that forces the wrong Vercel account. Always prefix `env -u VERCEL_TOKEN`. The stored login (after `vercel logout` / `vercel login` in a private window) is `sreerampostin-9414`. `vercel whoami` without the prefix reports a stale user.
- `vercel project rm` has no `--yes`; pipe `echo y |`.
- `vercel link` can hang with a pipe through `grep`; use `timeout 100` and run long deploys from a script in the background.
- zsh: a `( ... &)` subshell with `$b` in the same line threw "bad math expression". Put commands in a `.sh` file.
- The task-progress `RunStrip` and gate pulsing were removed on purpose (user request).
- Tailwind v4: keep any CSS resets inside `@layer base` (see the comment at the top of `index.css`).
- `src/ide` and `src/cli` both reuse `ConversationView` (IDE uses its new optional `compact` prop) and the engine. Do not fork the engine.
- The Monaco editor is bundled (no CDN): the demo runs without reliable network.

## 6. Standing rules from the user

- **Never deploy or push without being asked.** Make changes on a local branch, let the user preview, then push/deploy after "approved".
- **Never handle the Vercel token** (read, echo, or paste it). Have the user run `vercel login` themselves.
- **Run builds as many labelled subagents** (implement → review → fix → final review) so the Agent map shows them; tell the user the plan first.
- **Every research claim needs a traceable source link.**
- Plain, simple language in replies; confirm before anything destructive or outward-facing.
- The Design Exploration Exercise brief is confidential and individual work.

## 7. Open work (nothing here is started)

1. **PRD coverage table (the user's current ask).** Source: `/Users/sreeramkammara/Downloads/Folder AAVA-3.0/PRD for Autonomous Task Orchestration (Base Users) - Overview.pdf` (31 pages; text already extracted once, re-extract with `pypdf`). Produce a table: Capability (component-level, e.g. "task progress") | PRD ref (US1–21, FR1–26, relevant NFRs) | Requirement | Status (Covered / Partial / Missing) | Where in the prototype / gap. **Stay strictly inside the PRD.** Known facts: web is the only real surface (until IDE/CLI demos); no Queued/Processing labels, no queue/concurrency/reorder, no Pause, no reason prompts, no Teams, no time estimate on progress, Type 3 gate says "Not yet" not "Skip", no revise cost preview, Golden Artifact match with fit % exists only in Ajay's agent-designer flow, off-topic input offers a new thread only, write-back to ALM only for the backlog push.
2. **Label:** `TAG_META.input.label` reads "Need your input" but the PRD and brief say "Needs your input". The user has not decided; recommend reverting.
3. **Track 1 (Design Exploration Exercise)** prototype states in a new branch, using Priya's data. Work-pack doc: `AAVA3_Track1_Workpack.docx`.
4. **Multi-surface UX research page** was never published (user interrupted searches).
5. **Cleanup decisions for the user:** delete the three redundant low-fi Vercel projects? Add an in-app Web/IDE/CLI switcher? Show 404 for unknown paths instead of the web app?
6. **Known minor gaps:** the first-time user mode only changes home/sidebar (prompts still play the same scripts); the IDE/CLI branches duplicate a few helpers (`cli/render.ts` `liveGate`, `ide/AavaPanel.tsx` session rows) that could use `state/gates.ts` / `state/sessions.ts`; the dropdown on the web home can overlap the greeting in a very short window.

## 8. Commands

```bash
cd /Users/sreeramkammara/Desktop/aava-3.0/aava-3.0-updaes-v2-deploy/app
npm run dev        # vite; use --port 5179 --strictPort
npx tsc -b && npx vitest run && npm run build && npx oxlint src
```
Single test: `npx vitest run -t "name"`. Vitest picks up `src/**/*.test.ts` only.
Dev servers are defined in `/Users/sreeramkammara/Downloads/aava30_proto/.claude/launch.json` (`aava-lowfi-dev` 5176, `aava-lowfi-ide` 5177, `aava-lowfi-cli` 5178).

## 9. Key files

- Engine: `state/reducer.ts`, `state/useJourney.ts`, `state/types.ts`, `state/timing.ts` (use the `T` constants, no magic delays), `state/gates.ts`, `state/sessions.ts`
- Scenarios: `scenarios/t1.ts`, `t7.ts`, `index.ts`
- Web UI: `App.tsx`, `components/chat/*`, `components/playground/*`, `components/start/*`
- Low-fi: `design/wireframe.css`, `state/useTheme.ts`
- IDE: `ide/IdeApp.tsx`, `AavaPanel.tsx`, `useWorkbench.tsx`, `tabs/*`
- CLI: `cli/CliApp.tsx`, `useCli.ts`, `render.ts`, `printers.ts`
- Docs: `docs/surfaces-plan.md`; product brief `docs/superpowers/specs/2026-08-03-aava-3-prototype-design.md` (its numbered "Laws" in §2 are binding for UI changes)
- Claude memory (Claude only, not Codex): `/Users/sreeramkammara/.claude/projects/-Users-sreeramkammara-Downloads-aava30-proto/memory/`
- Full transcript of this session: `/Users/sreeramkammara/.claude/projects/-Users-sreeramkammara-Downloads-aava30-proto/84353f31-5ee4-47fe-9db8-9a9808d2c071.jsonl` (large; reference only)
