/* The documents the PRD-to-backlog flow produces, as markdown.
 *
 * One artefact per phase — intake summary, epics, features, stories, sprint plan
 * — each shown in the document canvas (Preview/Code) as the run advances. The
 * content follows the WireFrame Studio script; the box-drawing tables of the
 * source are rendered as headings, bold labels and lists so the small markdown
 * renderer can display them.
 */

export type BacklogDoc =
  | 'intake' | 'epics' | 'epics-fields' | 'features' | 'stories' | 'stories-flags' | 'sprint'

export const BACKLOG_FILE: Record<BacklogDoc, string> = {
  intake: 'intake-summary.md',
  epics: 'epics.md',
  'epics-fields': 'epics.md',
  features: 'features.md',
  stories: 'stories.md',
  'stories-flags': 'stories.md',
  sprint: 'sprint-plan.md',
}

const INTAKE = `# Intake summary — WireFrame Studio v1.0

Parsed the PRD and built the picture below. Flag anything I've misread — I won't move on until you confirm.

## Objectives (5)

- Reduce wireframe creation time by 50–60%
- Enable non-expert users to create professional wireframes
- Provide AI-assisted design suggestions and layout recommendations
- Facilitate real-time collaboration among design teams
- Build a template and component library ecosystem

## User roles (6)

**Primary**
- UX/UI Designers — rapid ideation, design consistency
- Product Managers — communicate direction, limited design expertise
- Design Leads — oversee projects, mentor juniors, enforce patterns

**Secondary**
- Junior Designers · Startups & Solopreneurs · Non-designer stakeholders

## Functional requirement categories (6 · 28 requirements)

- **FR1 Canvas & Editing** — 6 requirements
- **FR2 Component Management** — 6 requirements
- **FR3 AI Assistant** — 5 requirements
- **FR4 Collaboration** — 6 requirements
- **FR5 Design System Integration** — 5 requirements
- **FR6 Prototyping & Export** — 5 requirements

## Non-functional (5)

- Performance · Scalability · Security & Privacy · Reliability · Accessibility

## Release plan — 4 phases over 12 months

- **Phase 1 · MVP** (Months 1–3) — 500 users, closed beta
- **Phase 2 · Alpha** (Months 4–6) — 5,000 users, open beta
- **Phase 3 · Beta** (Months 7–9) — public launch
- **Phase 4 · Post-launch** (Months 10–12) — mobile + enterprise
`

const epicsMd = (patched: boolean, fields: boolean) => `# Epics — WireFrame Studio

Seven epics, each on the same template: Background, Details, Benefits, Assumptions, Priority.

## Epic 01 — Intelligent Canvas Editor · P0

**Background** — The canvas is the core workspace. Designers need a fluid drag-and-drop interface with smart guides, responsive previews, and full editing history.
**Details** — Drag-and-drop component placement, zoom/pan controls, alignment guides + grids, smart spacing, responsive device preview (mobile/tablet/desktop), undo/redo with 50-action history panel.
**Benefits** — Enables 5x faster wireframe assembly vs. traditional tools; reduces layout decision friction.
**Assumptions** — Canvas API rendering can handle 200+ components without lag.
**Priority** — P0 — MVP (Phase 1)

## Epic 02 — Component & Template Library · P0

**Background** — Reusable components and industry templates eliminate repetitive work and enforce consistency.
**Details** — 100+ pre-built components, custom component creation, component variants (size/state/theme), search & filter, drag-to-canvas, properties panel. 50+ industry-specific templates.
**Benefits** — Reduces per-wireframe effort by 40%; ensures design pattern consistency.
**Assumptions** — Component library v1 ships with 50 components (MVP); full 100+ by Phase 2.
**Priority** — P0 — MVP (Phase 1)

## Epic 03 — AI-Powered Design Assistant · P1

**Background** — Junior designers and PMs lack layout expertise. AI bridges the gap by suggesting layouts, components, and best practices contextually.
**Details** — ${patched ? '**Text-to-wireframe generation (headline feature)** — generate layouts from natural language. ' : ''}Contextual layout suggestions, component recommendations from library, auto-spacing/alignment per design-system rules, accessibility and mobile-responsiveness alerts.${patched ? '' : ' Text-to-wireframe generation.'}
**Benefits** — 40%+ AI suggestion acceptance-rate target; levels up non-expert users.
**Assumptions** — GPT-4 API available; custom model training needs a 3-month ramp. AI v1 ships in Phase 2 (Alpha).
**Priority** — P1 — Phase 2 (Alpha)

## Epic 04 — Real-Time Collaboration · P0

**Background** — Teams waste cycles in async feedback loops. Real-time editing and threaded comments cut iteration time by 70%.
**Details** — Multi-user live editing with cursor indicators, comment threads tied to canvas elements, @mention notifications, version history with branch/merge, permission management, developer handoff export.
**Benefits** — 70% reduction in collaboration cycle time; eliminates version confusion.
**Assumptions** — Yjs CRDT handles conflict resolution; WebSocket latency < 500ms.
**Priority** — P0 — MVP (Phase 1, basic) → Phase 3 (advanced)

## Epic 05 — Design System Integration · P1

**Background** — Teams need wireframes that respect their existing design-system tokens and components to avoid rework downstream.
**Details** — Import design tokens from Figma/Sketch/JSON, component mapping, automatic compliance checking and flagging, push updates back to source, colour/type/spacing rule enforcement.
**Benefits** — Eliminates design-to-dev handoff inconsistencies; reduces rework by 30%.
**Assumptions** — Figma API and Sketch plugin available; abstraction layer isolates tool-specific logic.
**Priority** — P1 — Phase 2 (Alpha)

## Epic 06 — Prototyping & Export · P1

**Background** — Wireframes need to be testable and shareable. Export and prototyping close the loop between ideation and validation.
**Details** — Convert wireframes to interactive prototypes, export to Figma/HTML/PDF, generate developer handoff specs, shareable public links.
**Benefits** — Reduces time from wireframe to user test by 60%; eliminates tool-switching.
**Assumptions** — Basic interactions ship in Phase 3 (Beta); advanced prototyping post-launch.
${fields ? '**Start date** — Month 7  ·  **End date** — Month 9\n' : ''}**Priority** — P1 — Phase 3 (Beta)

## Epic 07 — User Onboarding & Education · P2

**Background** — Steep learning curves hurt adoption. Guided onboarding and AI mentoring reduce time-to-first-wireframe to under 15 minutes.
**Details** — 5-minute interactive tutorial, template-selection wizard, AI assistant intro flow, team invitation flow, design-system import setup, contextual tooltips.
**Benefits** — First wireframe in under 15 minutes; drives 70%+ month-over-month retention.
**Assumptions** — Onboarding can be iterated post-MVP without blocking the core editor.
**Priority** — ${fields ? 'P2 — runs continuously from Month 4' : 'P2 — Phase 2–3 (phase month to confirm)'}
`

const FEATURES = `# Features — WireFrame Studio

23 features across the 7 epics. Template per feature: Requirement, Acceptance criteria, Priority. Grouped under the parent epic.

## Under Epic 01 — Intelligent Canvas Editor

**Feature 1.1 — Drag-and-Drop Canvas Engine · P0**
Fluid drag-and-drop for adding, positioning and resizing components on an infinite canvas. *Acceptance:* a library component drops onto the canvas within 200ms; supports 200+ components without lag.

**Feature 1.2 — Smart Guides & Alignment · P0**
Automatic alignment guides, grid overlay, smart spacing. *Acceptance:* guides appear within 50ms of dragging near another element; spacing matches design-system rules.

**Feature 1.3 — Responsive Device Preview · P1**
Real-time preview across mobile, tablet and desktop. *Acceptance:* toggle 3 device previews; layout adapts in real time; renders within 1s.

**Feature 1.4 — Edit History & Undo/Redo · P0**
Full undo/redo with a visible 50-action history panel. *Acceptance:* responds within 100ms; panel shows description + timestamp; jump to any point.

## Under Epic 02 — Component & Template Library

**Feature 2.1 — Pre-Built Component Library · P0**
100+ pre-built components with search and filter. *Acceptance:* search by name/category renders within 300ms; MVP ships 50 components.

**Feature 2.2 — Custom Component Creation · P1**
Create, save and reuse custom components with variants. *Acceptance:* save a selection as a reusable component; appears in the library within 2s.

**Feature 2.3 — Industry Template Gallery · P1**
50+ industry templates as starting points. *Acceptance:* categorised by industry; preview before selecting; loads in under 3s.

**Feature 2.4 — Component Properties Panel · P0**
Quick-edit panel for the selected component. *Acceptance:* opens within 200ms; changes apply in real time.

## Under Epic 03 — AI-Powered Design Assistant

**Feature 3.1 — Text-to-Wireframe Generation · P1**
Generate layouts from natural-language descriptions. *Acceptance:* AI generates within 5s; accept, modify or regenerate.

**Feature 3.2 — Contextual Layout Suggestions · P1**
Suggest next components/patterns from canvas state. *Acceptance:* non-intrusive overlay; one-click accept or dismiss; acceptance rate > 40%.

**Feature 3.3 — Best Practice Alerts · P2**
Proactive accessibility, responsiveness and spacing alerts. *Acceptance:* flags WCAG issues and missing mobile layouts; auto-fix or dismiss.

## Under Epic 04 — Real-Time Collaboration

**Feature 4.1 — Multi-User Live Editing · P0**
Simultaneous editing with cursor indicators. *Acceptance:* changes sync within 500ms; coloured cursors; no data loss (CRDT); supports 10,000+ concurrent users at < 500ms sync latency.

**Feature 4.2 — Comment Threads & Mentions · P0**
Comments tied to elements with @mentions. *Acceptance:* right-click any element to comment; @mentions notify; threads reply/resolve.

**Feature 4.3 — Version History & Branching · P1**
History with branch, compare and merge. *Acceptance:* view timeline; branch in one click; visual diff between versions.

**Feature 4.4 — Permissions & Access Control · P1**
Role-based permissions with team/project granularity. *Acceptance:* admin sets permissions per user; view-only cannot modify; invite links respect role.

## Under Epic 05 — Design System Integration

**Feature 5.1 — Design Token Import · P1**
Import tokens from Figma, Sketch or JSON. *Acceptance:* paste a Figma URL or upload JSON; parsed within 10s; token panel shows values.

**Feature 5.2 — Compliance Checking & Flagging · P1**
Scan against imported design-system rules. *Acceptance:* runs on save; flags non-compliant elements with fixes; auto-fix.

**Feature 5.3 — Bi-Directional Sync · P2**
Push updates to source and pull upstream changes. *Acceptance:* Figma changes reflect within 60s; user notified of upstream changes.

## Under Epic 06 — Prototyping & Export

**Feature 6.1 — Interactive Prototype Mode · P1**
Convert wireframes to clickable prototypes. *Acceptance:* define click targets and link frames; runs in browser; forward/back navigation.

**Feature 6.2 — Multi-Format Export · P0**
Export to Figma, Sketch, HTML and PDF. *Acceptance:* completes within 30s for a 20-screen wireframe; Figma export preserves layers; PDF keeps fidelity.

**Feature 6.3 — Developer Handoff Specs · P1**
Annotated specs with measurements, spacing, colours and names. *Acceptance:* specs on hover; copy CSS values; export as PDF/HTML.

## Under Epic 07 — User Onboarding & Education

**Feature 7.1 — Interactive Tutorial & Wizard · P1**
5-minute guided tutorial with template wizard. *Acceptance:* completes in under 5 minutes; first wireframe made during it; skippable.

**Feature 7.2 — Contextual AI Tooltips · P2**
In-context AI tooltips explaining features. *Acceptance:* appear on hover for unfamiliar UI; globally dismissible; frequency reduces over time.
`

const storiesMd = (flags: boolean) => `# User stories — WireFrame Studio

58 stories decomposed from the confirmed features. Each is checked against Definition of Ready.

## Ready

- **ST-001** As a designer, I can drag a component from the library onto the canvas — READY
- **ST-002** As a designer, I can reposition components with snap-to guides — READY
- **ST-003** As a designer, I can resize components by dragging handles — READY
- **ST-004** As a designer, I can see alignment guides when moving near another element — READY
- **ST-005** As a designer, I can toggle grid overlay on/off — READY
- **ST-006** As a designer, I can preview my wireframe in mobile, tablet and desktop — READY
- **ST-007** As a designer, I can undo/redo the last 50 actions — READY
- **ST-008** As a designer, I can view my edit history with timestamps — READY
- **ST-043** As a designer, I get contextual layout suggestions while editing — READY
- **ST-058** As a new user, I see contextual tooltips explaining features on hover — READY

*(…48 more stories across all 23 features)*

## Not yet ready

- **ST-042** As a PM, I can describe a screen in natural language and get a wireframe — DoR: 1 open
- **ST-044** As a designer, I receive accessibility alerts for my wireframe — DoR: 1 open
${flags ? `
## Definition-of-Ready flags

- **ST-042 — Text-to-wireframe generation** — BLOCKED · Figma mockup missing, AI service endpoint undefined
- **ST-044 — Accessibility alerts** — 1 open · Figma mockup for the alert overlay missing
- **ST-047 — Multi-user cursor display** — 1 open · WebSocket cursor-broadcast spec undefined
- **ST-051 — Design token import** — 1 open · Figma API token-parser spec undefined
- **ST-053 — Bi-directional sync** — BLOCKED · sync-conflict mockup missing, push-back endpoint undefined
- **ST-055 — Interactive prototype mode** — 1 open · prototype-runner mockup missing
- **ST-057 — Onboarding tutorial** — 1 open · tutorial-overlay mockup missing
` : ''}`

const SPRINT = `# Sprint plan — WireFrame Studio · MVP

4 sprints × 2 weeks, filtered to MVP scope: Epics 01, 02 and 04 (basic collaboration). 32 stories eligible.

## Sprint 1 (Weeks 1–2) — Canvas Foundation

- ST-001 Drag-and-drop · ST-002 Snap-to guides · ST-003 Resize handles
- ST-004 Alignment guides · ST-005 Grid overlay · ST-007 Undo/redo · ST-008 History panel

## Sprint 2 (Weeks 3–4) — Components & Library

- ST-009 Component library v1 · ST-010 Search & filter · ST-011 Component properties
- ST-012 Component variants · ST-015 Custom component save · ST-006 Responsive preview · ST-016 Template gallery v1

## Sprint 3 (Weeks 5–6) — Collaboration v1

- ST-030 Multi-user editing · ST-031 Cursor indicators · ST-032 Comment threads
- ST-033 @mention notifications · ST-034 Version history v1 · ST-035 Permission management
- **⚠ ST-047 — HOLD** (cursor-broadcast API spec pending)

## Sprint 4 (Weeks 7–8) — Polish + Beta Prep

- ST-038 Export to Figma · ST-039 Export to PDF · ST-040 Developer handoff v1 · ST-041 Public share links
- Performance & QA sweep · Onboarding tutorial draft
`

/** The markdown for a given phase document (some phases have a variant view). */
export function backlogMarkdown(doc: BacklogDoc): string {
  switch (doc) {
    case 'intake': return INTAKE
    case 'epics': return epicsMd(false, false)
    case 'epics-fields': return epicsMd(true, true)
    case 'features': return FEATURES
    case 'stories': return storiesMd(false)
    case 'stories-flags': return storiesMd(true)
    case 'sprint': return SPRINT
  }
}
