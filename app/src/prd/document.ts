/* The PRD as a real markdown document.
 *
 * This is the artefact the flow produces — what the Preview renders and the Code
 * view shows as source. The copy is written to read like a PRD a product manager
 * would actually accept as a first draft: a problem, goals, scoped requirements,
 * metrics, risks and open questions — with the subject woven through, not just a
 * title swap. Constructs are limited to headings, paragraphs, bullet lists and
 * bold so the markdown renderer stays small and reliable.
 */

function titleCase(s: string): string {
  return s.replace(/^(a|an|the)\s+/i, '').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function prdFileName(subject: string): string {
  const slug = subject.replace(/^(a|an|the)\s+/i, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${slug || 'product'}-prd`
}

/** Readable card title, e.g. "Agent builder PRD". */
export function prdDocTitle(subject: string): string {
  const s = subject.replace(/^(a|an|the)\s+/i, '')
  return `${s.charAt(0).toUpperCase()}${s.slice(1)} PRD`
}

export function prdMarkdown(subject: string): string {
  const s = subject.replace(/^(a|an|the)\s+/i, '')
  const S = titleCase(subject)
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return `# Product Requirements Document — ${S}

**Author:** AAVA · PRD Composer
**Status:** Draft for review
**Last updated:** ${today}

## 1. Overview

This document defines the problem, scope and success criteria for ${s}. It is a first draft, plotted from the intent and cross-referenced against the existing workspace architecture, and is ready for review before any design or engineering work begins.

## 2. Problem

Today the workflow around ${s} is manual, inconsistent and hard to measure. Teams stitch it together with ad-hoc tools, so there is no single place to do the work, no shared definition of "done", and no reliable signal on whether it is succeeding.

- The entry point is unclear, so adoption depends on tribal knowledge.
- State is not persisted, so progress is lost between sessions.
- There is no measurement, so improvements cannot be proven.

## 3. Goals

- Ship ${s} to a first cohort within one quarter, behind a flag.
- Give every user one obvious place to start and resume the work.
- Reach a measurable lift in the primary activation metric over the baseline.

## 4. Non-goals

- Migrating existing data from legacy tools in this release.
- Supporting every edge-case configuration on day one.
- Building an admin surface beyond the minimum needed to run the pilot.

## 5. Target users

The primary user is the person who owns ${s} end to end and needs to move it forward without waiting on engineering. The secondary user is the reviewer who approves the output and needs enough context to sign off with confidence.

## 6. Requirements

### 6.1 Must have — P0

- A single primary entry point for ${s}, reachable from the home surface.
- State is persisted per user and survives a session or a reload.
- Every action emits an analytics event with a stable, documented name.

### 6.2 Should have — P1

- An admin can change the rules from a settings surface without a release.
- A clear, localised empty state for users who have nothing yet.
- Inline validation that explains what is wrong and how to fix it.

### 6.3 Could have — P2

- Keyboard shortcuts for the most frequent actions.
- Export of the result to a shareable format.

## 7. Success metrics

- **Activation:** share of the cohort that completes the core flow at least once in week one.
- **Retention:** share that returns and completes it again within two weeks.
- **Quality:** review pass-rate on first submission, trending up over the pilot.

## 8. Risks and mitigations

- **Scope creep beyond the first cohort.** Freeze the schema and flag-gate the release before build.
- **Low activation if the entry point is buried.** Reserve a primary slot on the home surface.
- **Analytics naming drift across surfaces.** Declare event names in the schema, not per screen.

## 9. Open questions

- What is the single primary metric ${s} should move?
- Which cohort gets the first rollout, and how large is it?
- Is there an existing surface to reuse, or is a new one required?
`
}
