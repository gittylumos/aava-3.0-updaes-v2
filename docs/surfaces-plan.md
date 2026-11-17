# AAVA 3.0 low-fi: IDE plugin and CLI surfaces, plan

**Scope.** Only the three home sessions of the General user:
1. **T1 Add product feedback form**: plan record, run strip, *Feedback form is ready* gate, files, PR gate. Canvas: Overview, Validation results, Preview (localhost:4200), Code, Diff.
2. **T7 Migrate the refunds API to the v2 schema**: validator gates (3 confirms), validation block. Canvas: Validation results, Diff.
3. **T2 Modify the progress bar behavior**: clarify questions on the trigger rule. Canvas: Overview (criteria met / not met) only.

**Style.** Black and white wireframe, the same as `feat/low-fidelity`. Each surface is a web demo that *looks like* the real host (a VS Code window, a terminal window) and runs the same scenario engine (`useJourney`, the `t1` / `t7` beats). No real extension or CLI is built.

**Branches.** `feat/lowfi-ide` and `feat/lowfi-cli`, both cut from `feat/low-fidelity`. Git can't hold `feat/low-fidelity/ide` next to an existing `feat/low-fidelity` branch. Deploy later as two more Vercel projects, `aava-lowfi-ide` and `aava-lowfi-cli`.

**The rule** (TEE channel slide): each channel declares what it can do, and the Experience Engine resolves against that declaration.

| Channel | Canvas | Runtime | Watch |
|---|---|---|---|
| Web (today) | Owned | None | Yes |
| **IDE in situ** | **Borrowed** (the host editor) | **Host runtime** | **No Watch** |
| **CLI** | **Dissolved** | **Code runtime** | **Watch inline** |

---

## 1. IDE plugin (VS Code)

### 1.1 Where AAVA lives

| Decision | Why |
|---|---|
| An AAVA icon in the Activity Bar opens the AAVA view container. Its single view is the chat, a *webview view*. | Activity Bar items are view containers that render views in a sidebar ([UX overview](https://code.visualstudio.com/api/ux-guidelines/overview)). Chat needs rich layout, so it's the one place a webview is justified ([webviews](https://code.visualstudio.com/api/ux-guidelines/webviews): "only if you absolutely need them"). |
| The demo shows the panel on the **right** (secondary sidebar), next to the editor, as in Claude Code. | Claude Code's panel can sit in the secondary sidebar, primary sidebar or an editor tab, and remembers where it was put ([Claude Code VS Code docs](https://code.claude.com/docs/en/vs-code), "Choose where Claude lives"). |
| A status bar item **"AAVA"** opens the panel even with no file open. | Claude Code does the same with "✻ Claude Code" ([docs](https://code.claude.com/docs/en/vs-code), Get started). |

### 1.2 Zone mapping (web → IDE)

| Web zone (TEE colour) | Web today | In VS Code | Host surface used |
|---|---|---|---|
| **Sidebar** (purple) | Rail, New session, My tasks, Search, Pinned, Recents, profile | Panel header icons: **New session (+)**, **Session history (clock)**. History opens a list with a search box and two groups, **Pinned** and **Recents**. Hovering a row shows Pin / Rename / Archive. My tasks becomes the home screen. Search sits in history. Profile is dropped (VS Code's own Accounts menu covers it). | View title bar actions + an in-panel list, styled like a [Quick Pick](https://code.visualstudio.com/api/ux-guidelines/quick-picks) (separators for groups, description, detail). Claude Code: a Session history button, keyword search, hover Rename/Archive ([docs](https://code.claude.com/docs/en/vs-code), Resume past conversations). |
| **Conversation** (green) | Home (greeting, 3 cards, composer) and the thread | **Home:** greeting, then the 3 session cards **stacked vertically** (the panel is ~360px wide), then the composer at the bottom. **Thread:** the same blocks reflowed to one column. The gate stays pinned above the composer. | Webview view |
| **Canvas** (blue) | Right panel: tabs Overview / Validation / Preview / Code / Diff / graph | **Borrowed.** Each artifact opens in the host's own editor (table 1.3). AAVA draws no canvas of its own. | Editor area, Panel (terminal), Testing |
| **Toolbar** (amber) | Task title, Jira chip, view toggles | **Panel title** = session title. The Jira key is a link in the run strip. Editor-toolbar actions: *Open in AAVA*, *Accept / Reject change* on a diff. | View title, Editor toolbar ([overview](https://code.visualstudio.com/api/ux-guidelines/overview)) |
| **Watch** (grey) | Run strip "Waiting on you · 9/10 steps", notifications bell | **No Watch** (TEE). The run strip stays at the top of the thread, static. Outside the panel: one **status bar item**, "AAVA · Waiting on you · 9/10". **Notifications** are sent only when a gate opens (e.g. "Feedback form is ready", with a [Review] action). The unread count is a badge on the AAVA Activity Bar icon. | Status bar ([guide](https://code.visualstudio.com/api/ux-guidelines/status-bar): short text, left = workspace-scoped). Notifications ([guide](https://code.visualstudio.com/api/ux-guidelines/notifications): limit them, one at a time, only after a user-triggered moment). |

### 1.3 Artifact routing: what replaces each canvas tab

| Canvas tab (web) | In VS Code | Source |
|---|---|---|
| **Code** (`feedback-form.component.ts` …) | A normal **editor tab** opens the real file. The file links in the chat open there. | Host editor |
| **Diff** | The native **diff editor**: original vs proposed, with per-change Accept / Reject. The PR gate stays in chat. | `vscode.diff` ([commands](https://code.visualstudio.com/api/references/commands)). Claude Code shows a side-by-side diff with accept / reject and per-change buttons ([docs](https://code.claude.com/docs/en/vs-code), Get started step 4). |
| **Preview** (the running app) | `ng serve` runs in an **integrated terminal** named *AAVA · feedback-form*. Its `http://localhost:4200` link opens the **Integrated Browser** as an editor tab. The chat's app card has an "Open preview" link that does the same. | The Integrated Browser opens localhost links from the terminal or chat by default ([integrated browser](https://code.visualstudio.com/docs/debugtest/integrated-browser)). |
| **Validation results** | A read-only **Markdown preview tab**, *Validation results.md* (checks, coverage, 11 specs passing). The specs also appear in the **Testing** view. | Host editor + Testing view |
| **Overview** (task context: criteria, sources, run, tokens) | **Not a file**, so it stays in the panel as a collapsible **Task context** card above the thread. T2 lives almost entirely here (criteria met / not met). | — |
| **Execution graph** | **Dropped.** The step list inside the expandable run strip replaces it. | Drawing it would need a second webview panel, and the guidelines discourage webviews that repeat existing functionality ([webviews](https://code.visualstudio.com/api/ux-guidelines/webviews)). |
| **Evidence** (per step) | Expands inline under each step of the run strip. | — |
| **Figma frame** | An image preview tab, plus "Open in Figma". | Host editor |

### 1.4 What the demo shows (VS Code window mock, grey)

```
┌ title bar: aava-product — Visual Studio Code ───────────────────────────────┐
│A│ EXPLORER        │ feedback-form.component.ts │ Diff ▸ │ localhost:4200 ×   │ AAVA          + 🕘 │
│c│  src/app/…      │                                                         │ ▸ Task context      │
│t│                 │            (host editor: code / diff / browser)        │ ── run strip 9/10 ──│
│ │                 │                                                         │ thread …            │
│b│                 ├─ TERMINAL: AAVA · feedback-form ─────────────────────── │ [gate pinned]       │
│a│                 │ ✔ Compiled · Local: http://localhost:4200               │ [composer]          │
└ status: ⎇ feat/MOB-2841   AAVA · Waiting on you · 9/10 ─────────────────────────────────────────┘
```

---

## 2. CLI

### 2.1 Zone mapping (web → CLI)

| Web zone | In the CLI |
|---|---|
| **Sidebar** | `aava` with no arguments opens the home: greeting plus the **3 sessions as a numbered list**, chosen with arrow keys or a number. `aava --resume` (or `/resume`) lists sessions: ★ pinned first, then recents. `/new` starts a fresh session, `/pin` pins the current one. |
| **Conversation** | The streaming thread. Tool calls are single rows (`⏺ Read MOB-2841`, `⏺ Built 7 files`). **Gates are numbered choices** (`❯ 1. Review changes  2. Refine changes`). *Refine* opens a text prompt. |
| **Canvas** | **Dissolved.** Artifacts become text or paths: file paths (clickable as links in modern terminals), a **unified diff** printed inline (`+` / `−`), the validation results as a plain-text table, and a preview line `Local: http://localhost:4200 (press o to open)` that opens the system browser. |
| **Toolbar** | A header line: `MOB-2841 · Add product feedback form`. |
| **Watch** | **Inline**: one status line under the prompt, `● Waiting on you · 9/10 steps`, static. `/steps` prints the step list (it replaces the graph). `ng serve` runs as a background task, and `/tasks` shows its last output lines. |

### 2.2 What the demo shows

A full-window terminal (dark title bar, monospace, grey). It types out the T1 / T7 / T2 beats with the same timing (`T` constants). Keyboard: ↑ ↓ / Enter / numbers. The composer is the shell prompt.

---

## 3. Constraint log (decisions forced by the host)

| # | Surface | Web behaviour | Why it can't carry over as-is | Design decision |
|---|---|---|---|---|
| C1 | IDE | AAVA owns the right-hand canvas | IDE in situ = *borrowed canvas* (TEE). The editor area belongs to the host. | Every artifact opens as a native editor, diff, browser or terminal tab (1.3). |
| C2 | IDE | Custom panel UI anywhere | Webviews only when necessary, and must not repeat existing functionality ([webviews](https://code.visualstudio.com/api/ux-guidelines/webviews)). | Exactly one webview: the chat view. No custom canvas, no graph webview. |
| C3 | IDE | Panel is on the right | Extensions can't contribute views to the secondary sidebar by default; users drag them there ([sidebars](https://code.visualstudio.com/api/ux-guidelines/sidebars)). | First run: primary sidebar. **The demo shows it on the right (decided)**, the state after the user moves it, as Claude Code allows ([docs](https://code.claude.com/docs/en/vs-code)). |
| C4 | IDE | Three cards side by side | The panel is narrow (~300–400px). | Cards stack vertically; the composer is pinned to the bottom. |
| C5 | IDE | Bell + notification overlay | Notifications must be few, one at a time, after user-triggered moments ([notifications](https://code.visualstudio.com/api/ux-guidelines/notifications)). | Toasts only at HITL gates. Everything else goes to the Activity Bar badge + the session list. |
| C6 | IDE | Run strip with colour states | Status bar: no custom colours, one item ([status bar](https://code.visualstudio.com/api/ux-guidelines/status-bar)). | One plain-text status item. The full strip stays in the panel. |
| C7 | IDE | Gate cards with buttons | Modal dialogs only for immediate input on actions the user started ([notifications](https://code.visualstudio.com/api/ux-guidelines/notifications)). | Gates stay in-panel, pinned above the composer, never modal. |
| C8 | IDE | Theme toggle, own colour tokens | Webviews should be themeable with VS Code theme tokens ([webviews](https://code.visualstudio.com/api/ux-guidelines/webviews)). | The real plugin follows the VS Code theme. The low-fi demo stays grey. |
| C9 | IDE / CLI | Preview pane renders the app | IDE has a *host runtime*: the app runs in the user's terminal. The CLI has no canvas. | IDE: terminal + Integrated Browser tab. CLI: print the URL and open the system browser. |
| C10 | CLI | Execution graph, Overview tab | Canvas dissolved. | `/steps` and a `context` command print them as text. |
| C11 | CLI | Pinned / Recents sidebar | No persistent chrome. | `--resume` list with ★ pinned first. |
| C12 | All | Profile switcher, user-type switch | No profile chrome on the host surfaces. | Profile switching dropped. The **General / First time user switch is kept** (decided): IDE as a control in the AAVA panel header, CLI as `aava --first-run`/`/user` toggle. First time = empty home, empty history. |

---

## 4. Build plan (after this plan is approved)

**IDE branch `feat/lowfi-ide`** (reuses the engine and the blocks):
1. VS Code window shell: title bar, Activity Bar, Explorer, editor group with tabs, panel/terminal, status bar.
2. AAVA chat view: home with stacked cards, history list (Pinned / Recents), new session, narrow-width thread + pinned gate.
3. Artifact router: the `showTab` and link effects open editor / diff / browser / markdown / terminal tabs instead of canvas tabs.
4. Status bar item, gate notification toast, Activity Bar badge.

**CLI branch `feat/lowfi-cli`:**
1. Terminal window shell and a text renderer for each block kind used by T1 / T7 / T2.
2. Home list, `--resume` list, numbered gates with keyboard input.
3. Inline diff, validation table, `ng serve` background task, `/steps`.

Each branch: type-check + tests, click through all 3 sessions in the browser, then preview for approval before any deploy.
