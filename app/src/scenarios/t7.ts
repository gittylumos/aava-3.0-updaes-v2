import type { Scenario } from '../state/types'
import { T } from '../state/timing'

/* T7 — the run that stopped.
 *
 * T1 is finished work: everything ran, approve the PRs. This is the other half
 * of the argument — an agent chain that did three steps, produced evidence a
 * human can check, and STOPPED, because applying a schema migration to three
 * payment services is not a decision an agent gets to make on its own.
 *
 * Two gates, at step 4 and step 7, and the list says so before you read a word.
 */

const mapperTs = `/** v1 → v2 refund field mapping. Generated from the PAY-3044 RFC. */
export const REFUND_V2_MAP = {
  amount_cents:   'amount.minor',
  currency:       'amount.currency',
  reason_code:    'reason.code',
  // v1 sent a free-text note; v2 splits it into a code + an optional memo.
  reason_text:    'reason.memo',
  refunded_at:    'settledAt',
  gateway_ref:    'processor.reference',
} as const;

export function toV2(v1: RefundV1): RefundV2 {
  return {
    id: v1.id,
    amount:    { minor: v1.amount_cents, currency: v1.currency },
    reason:    { code: v1.reason_code, memo: v1.reason_text ?? null },
    settledAt: v1.refunded_at,
    processor: { reference: v1.gateway_ref },
    // v2 requires an initiator. v1 has no such field — defaulted, and flagged
    // to the reviewer rather than guessed silently.
    initiatedBy: v1.actor_id ?? 'system',
  };
}`

const serviceTs = `@Injectable()
export class RefundsService {
  /** Reads v1 or v2 and normalises to v2 for every consumer downstream. */
  async settle(refund: RefundV1 | RefundV2): Promise<RefundV2> {
    const v2 = isV2(refund) ? refund : toV2(refund);
    await this.ledger.post(v2);
    await this.events.emit('refund.settled', v2, { schema: 'v2' });
    return v2;
  }
}`

const schemaJson = `{
  "$id": "https://schemas.acme.dev/payments/refund/v2.json",
  "type": "object",
  "required": ["id", "amount", "reason", "settledAt", "initiatedBy"],
  "properties": {
    "id":          { "type": "string", "format": "uuid" },
    "amount":      { "$ref": "money/v1.json" },
    "reason":      { "type": "object",
                     "required": ["code"],
                     "properties": { "code": { "enum": ["duplicate", "fraud", "requested", "chargeback"] },
                                     "memo": { "type": ["string", "null"], "maxLength": 280 } } },
    "settledAt":   { "type": "string", "format": "date-time" },
    "initiatedBy": { "type": "string" },
    "processor":   { "type": "object", "properties": { "reference": { "type": "string" } } }
  }
}`

const specTs = `import { toV2 } from './refund-mapper';
import { validateAgainst } from '@acme/schema-registry';
import { contractFor } from '@acme/pact';
import { recordedV1, v1 } from './__fixtures__/refunds';

/** Contract conformance for the v1 to v2 refund mapping (PAY-3120).
 *  Run by the Validator agent — not by the agent that wrote the mapper. */
describe('toV2', () => {
  it('maps amount_cents to amount.minor', () => {
    expect(toV2(v1({ amount_cents: 1250 })).amount.minor).toBe(1250);
  });

  it('carries currency onto the amount object', () => {
    expect(toV2(v1({ currency: 'EUR' })).amount.currency).toBe('EUR');
  });

  it('maps reason_code to reason.code', () => {
    expect(toV2(v1({ reason_code: 'duplicate' })).reason.code).toBe('duplicate');
  });

  it('moves reason_text into reason.memo', () => {
    expect(toV2(v1({ reason_text: 'customer asked' })).reason.memo).toBe('customer asked');
  });

  // FAILS — v1 accepts any length, v2 caps the memo at 280 characters. 3 of the
  // recorded refunds overflow it and nothing says what to do with the rest.
  it('truncates a memo over 280 characters', () => {
    expect(toV2(v1({ reason_text: 'x'.repeat(400) })).reason.memo).toHaveLength(280);
  });

  it('accepts a null memo', () => {
    expect(toV2(v1({ reason_text: null })).reason.memo).toBeNull();
  });

  it('rejects a reason code outside the v2 enum', () => {
    expect(() => toV2(v1({ reason_code: 'goodwill' }))).toThrow('reason.code');
  });

  it('maps refunded_at to settledAt', () => {
    expect(toV2(v1({ refunded_at: '2026-07-02T09:15:00Z' })).settledAt)
      .toBe('2026-07-02T09:15:00Z');
  });

  it('keeps settledAt in ISO 8601', () => {
    expect(Date.parse(toV2(v1()).settledAt)).not.toBeNaN();
  });

  it('maps gateway_ref to processor.reference', () => {
    expect(toV2(v1({ gateway_ref: 'ch_3P9' })).processor.reference).toBe('ch_3P9');
  });

  // FAILS — 214 recorded refunds carry no actor and v2 requires an initiator.
  // 'system' is the mapper's guess, not a decision anyone has taken.
  it('defaults initiatedBy to system when the actor is absent', () => {
    expect(toV2(v1({ actor_id: null })).initiatedBy).toBe('system');
  });

  it('preserves initiatedBy when the actor is present', () => {
    expect(toV2(v1({ actor_id: 'usr_88' })).initiatedBy).toBe('usr_88');
  });

  it('passes a v2 payload through untouched', () => {
    const already = toV2(v1());
    expect(toV2(already)).toEqual(already);
  });

  it('round-trips 1,200 recorded refunds', () => {
    for (const rec of recordedV1) expect(() => toV2(rec)).not.toThrow();
  });

  it('validates every result against the v2 JSON Schema', () => {
    for (const rec of recordedV1) {
      expect(validateAgainst('refund/v2.json', toV2(rec)).ok).toBe(true);
    }
  });

  it('satisfies the ledger-service contract', () => {
    expect(contractFor('ledger-service').verify(toV2(v1()))).toBe(true);
  });

  it('satisfies the refund-worker contract', () => {
    expect(contractFor('refund-worker').verify(toV2(v1()))).toBe(true);
  });

  it('satisfies the finance export contract', () => {
    expect(contractFor('finance-export').verify(toV2(v1()))).toBe(true);
  });

  it('satisfies the merchant dashboard contract', () => {
    expect(contractFor('merchant-dashboard').verify(toV2(v1()))).toBe(true);
  });

  it("leaves a partial refund's processor reference intact", () => {
    const partial = v1({ amount_cents: 500, gateway_ref: 'ch_3P9/partial' });
    expect(toV2(partial).processor.reference).toBe('ch_3P9/partial');
  });
});`

export const t7: Scenario = {
  prep: [
    { key: 'jira',     label: 'Read Jira',                        result: 'PAY-3120',              detail: 'Ticket, the linked v2 RFC and the three target services pulled from the connected Jira project.' },
    { key: 'map',      label: 'Mapped v1 → v2 refund schema',     result: '14 fields · 3 renamed', detail: 'Every v1 field is mapped to a v2 field or explicitly dropped. Two fields have no clean source — that is what the gate below is for.' },
    { key: 'validate', label: 'Validator agent · contract conformance', result: '18 passed · 2 failed', detail: 'A separate agent, not the one that wrote the mapping. It replayed 1,200 recorded v1 refunds through the mapper and checked every result against the v2 JSON Schema and each consumer contract.' },
    /* Short result on purpose — the current row carries two pills, and the
       label is what has to survive the truncation. */
    { key: 'gate1',    label: 'Confirm the two unmapped fields',   result: 'approved by you',          detail: 'The two checks the Validator failed are both "v1 has data v2 has no home for". Rule on them and I will run steps 5 and 6, then stop again at step 7.', pending: true, gate: 'gate1' },
    { key: 'apply',    label: 'Apply migration across 3 services', result: '9 files · 3 repos',           detail: 'payments-api, ledger-service and refund-worker, behind the refunds_v2 flag so the rollback is a flag flip.', pending: true },
    { key: 'regress',  label: 'Regression + consumer contract tests', result: '340 passed · 4 of 4',        detail: 'The full payments regression suite plus the recorded contracts for all four downstream consumers.', pending: true },
    { key: 'gate2',    label: 'Sign-off before staging',          result: 'signed off by you',           detail: 'Second gate. Real money moves through staging, so a human confirms the regression results before the canary goes anywhere.', pending: true, gate: 'gate2' },
    { key: 'canary',   label: 'Canary release to staging',        result: '5% · 1 hour',           detail: 'Five percent of refund traffic on v2, the rest on v1, for one hour.', pending: true },
    { key: 'verify',   label: 'Verify live consumer traffic',     result: 'no drift',           detail: 'Compare v1 and v2 settlement totals on the canary. Any drift and the flag goes back off.', pending: true },
    { key: 'prs',      label: 'Raise the PRs',                    result: '3 raised',           detail: 'Three pull requests, one per service, all linked to PAY-3120. Opening a PR puts the work in front of other people, so the last call is yours too.', pending: true, gate: 'gate3' },
  ],

  evidence: {
    jira: { name: 'Read Jira', source: 'Jira', body: { kind: 'kv', pairs: [
      ['Ticket', 'PAY-3120'],
      ['Title', 'Migrate the refunds API to the v2 schema'],
      ['Sprint', 'Sprint 34'],
      ['Services', 'payments-api · ledger-service · refund-worker'],
      ['Gates', 'Mapping approval · staging sign-off'],
      ['Status', 'In Progress'],
    ] } },
    map: { name: 'Mapped v1 → v2 refund schema', source: 'Schema registry', body: {
      kind: 'columns',
      lead: '14 v1 fields against the v2 schema. Two have no clean source — they are the reason this needs a human.',
      found: ['amount_cents', 'currency', 'reason_code', 'reason_text', 'refunded_at', 'gateway_ref'],
      missing: ['initiated_by', 'settlement_batch'] } },
    validate: { name: 'Validator agent · contract conformance', source: 'Validator agent', body: { kind: 'kv', pairs: [
      ['Agent', 'Schema Validator · cross-model, not the mapping author'],
      ['Sample', '1,200 recorded v1 refunds replayed through the mapper'],
      ['Checks', '20 run · 18 passed · 2 failed · 3 warnings'],
      ['Consumers', '4 of 4 contracts satisfied'],
      ['Failed', 'initiated_by absent in v1 on 214 records — no rule for what to put there'],
      ['Failed', 'reason_text over the 280-char memo cap on 3 records — no rule for the overflow'],
      ['Verdict', 'Conformant apart from the two undecided fields. Both need a human.'],
    ] } },
    gate1: { name: 'Approve the schema mapping', source: 'Human gate', body: { kind: 'text',
      text: 'The run is parked here. Nothing has been written to payments-api, ledger-service or refund-worker, and nothing will be until you approve the mapping — specifically the two defaulted fields the Validator flagged.' } },
    apply: { name: 'Apply migration across 3 services', source: 'Ahead of the run', body: { kind: 'text',
      text: 'Runs once the step 4 gate is cleared. It lands behind the refunds_v2 flag, so rolling back is a flag flip rather than a revert.' } },
    regress: { name: 'Regression + consumer contract tests', source: 'Ahead of the run', body: { kind: 'text',
      text: '340 regression specs plus the recorded contracts for ledger-service, refund-worker, the finance export and the merchant dashboard. Runs against the applied migration, so it follows step 5.' } },
    gate2: { name: 'Sign-off before staging', source: 'Human gate', body: { kind: 'text',
      text: 'The second gate. Staging carries real settlement traffic, so the regression and contract results get read by a person before any canary starts.' } },
    canary: { name: 'Canary release to staging', source: 'Ahead of the run', body: { kind: 'text',
      text: 'Behind the step 7 sign-off. Five percent of refund traffic on v2 for one hour, the rest untouched on v1.' } },
    verify: { name: 'Verify live consumer traffic', source: 'Ahead of the run', body: { kind: 'text',
      text: 'Settlement totals are compared across both paths; any drift at all turns the flag back off without asking.' } },
    prs: { name: 'Raise the PRs', source: 'Ahead of the run', body: { kind: 'text',
      text: 'One PR per service, all three linked back to PAY-3120.' } },
  },

  /* The spec sits next to what it tests, and `tests.file` names it — the
     Validation Agent results tab and the tree are pointing at the same file. */
  fileOrder: ['refund-mapper.ts', 'refund-mapper.spec.ts', 'refunds.service.ts', 'refund-v2.schema.json'],
  fileRoot: 'src/payments/refunds',
  files: {
    'refund-mapper.ts': { versions: [mapperTs] },
    'refund-mapper.spec.ts': { versions: [specTs] },
    'refunds.service.ts': { versions: [serviceTs] },
    'refund-v2.schema.json': { versions: [schemaJson] },
  },

  tests: {
    file: 'refund-mapper.spec.ts',
    coveragePct: 91,
    gatePct: 80,
    /* The two the Validator flagged. Same names as the card's failing list —
       the tab and the conversation are reading the same run. Step 5 applies the
       agreed handling, so they go green the moment the run passes it. */
    failUntil: 4,
    failing: [
      'defaults initiatedBy to system when the actor is absent',
      'truncates a memo over 280 characters',
    ],
    specs: [
      'maps amount_cents to amount.minor', 'carries currency onto the amount object',
      'maps reason_code to reason.code', 'moves reason_text into reason.memo',
      'truncates a memo over 280 characters', 'accepts a null memo',
      'rejects a reason code outside the v2 enum', 'maps refunded_at to settledAt',
      'keeps settledAt in ISO 8601', 'maps gateway_ref to processor.reference',
      'defaults initiatedBy to system when the actor is absent',
      'preserves initiatedBy when the actor is present',
      'passes a v2 payload through untouched', 'round-trips 1,200 recorded refunds',
      'validates every result against the v2 JSON Schema',
      'satisfies the ledger-service contract', 'satisfies the refund-worker contract',
      'satisfies the finance export contract', 'satisfies the merchant dashboard contract',
      'leaves a partial refund\'s processor reference intact',
    ],
  },

  diff: [
    { repo: 'payments-api', branch: 'feat/PAY-3120-refund-v2', files: [
      '+ src/payments/refunds/refund-mapper.ts',
      '+ src/payments/refunds/refund-v2.schema.json',
      '~ src/payments/refunds/refunds.service.ts',
    ], lines: [
      { tone: 'del', text: '- await this.ledger.post(refund);' },
      { tone: 'add', text: '+ const v2 = isV2(refund) ? refund : toV2(refund);' },
      { tone: 'add', text: '+ await this.ledger.post(v2);' },
      { tone: 'add', text: "+ await this.events.emit('refund.settled', v2, { schema: 'v2' });" },
      { tone: 'ctx', text: '  … staged, not applied — waiting on the step 4 gate' },
    ] },
    { repo: 'ledger-service', branch: 'feat/PAY-3120-refund-v2', files: [
      '~ src/ingest/refund-consumer.ts',
      '~ contracts/refund.settled.pact.json',
    ] },
  ],

  beats: {
    /* The opening. What a stopped run owes the reader, in order: what the
       Validator found, where the run is, and the decision it is waiting on.
       All prepared work — the Validator ran before anyone sat down — so it is
       instant, same as T1. */
    prep: [
      { type: 'say', stream: false, lines: [
        'Before touching any service, the Validator agent replayed 1,200 recorded v1 refunds through the new mapper and checked every result against the v2 schema and the four consumer contracts.',
      ], block: { kind: 'validation', agent: 'Validator', file: 'refund-mapper.spec.ts',
        counts: { tests: 20, passed: 18, failed: 2, warnings: 3 },
        failing: [
          'defaults initiatedBy when the v1 actor is absent — 214 records',
          'rejects a memo over the 280-character cap — 3 records',
        ] } },
      { type: 'showTab', tab: 'tests' },
      { type: 'runState', kind: 'prep', label: 'Paused · step 4 of 10' },
      { type: 'say', stream: false, lines: [
        'Both failures are the same thing: v1 carries data v2 has no home for, and neither the ticket nor the RFC says what to do with it. That is a call I should not make on my own — nothing has been applied to any service.',
      ] },
      // The decision itself is not spelled out here. `prep[3].gate` names the
      // beat, and the engine appends it — the same way it comes back after
      // every answer.
    ],

    /* The step 4 decision, as its own beat so it can be re-asked. The engine
       replays it after every answer, so reading around the gate never costs
       you the gate. */
    gate1: [
      { type: 'say', stream: false, lines: [],
        block: { kind: 'confirm', step: 4, title: 'Approve how the two unmapped fields are handled',
          acceptLabel: 'Approve · default and truncate', cancelLabel: 'Not yet', acceptBeat: 'approved1', rows: [
          { repo: 'Missing initiator · 214 records', branch: 'initiatedBy → "system"',
            what: 'Default them rather than dropping the refunds. Reversible: the field is nullable in v2.' },
          { repo: 'Over-length memo · 3 records', branch: 'reason.memo → truncated at 280',
            what: 'Keep the refund, lose the tail of the note. The full text stays in the v1 record.' },
        ] } },
    ],

    gate2: [
      { type: 'say', stream: false, lines: [],
        block: { kind: 'confirm', step: 7, title: 'Sign off before staging takes real traffic',
          acceptLabel: 'Sign off · start the canary', cancelLabel: 'Hold here', acceptBeat: 'approved2', rows: [
          { repo: 'staging', branch: 'refunds_v2 · 5% of refund traffic', what: 'One hour, v1 untouched alongside. Any settlement drift turns the flag off.' },
        ] } },
    ],

    /* Gate 4 cleared. Steps 5 and 6 are real work, so they cost real time — and
       the list moves under the user rather than being described as moved. */
    approved1: [
      { type: 'runState', kind: 'live', label: 'Applying · steps 5–6' },
      { type: 'tools', steps: [
        { label: 'Applying the mapping to payments-api',   source: 'Repo',    result: '6 files',    ms: T.repo },
        { label: 'Applying the mapping to ledger-service', source: 'Repo',    result: '2 files',    ms: T.repo },
        { label: 'Applying the mapping to refund-worker',  source: 'Repo',    result: '1 file',     ms: T.repo },
        { label: 'Running the payments regression suite',  source: 'CI',      result: '340 passed', ms: T.karma },
        { label: 'Replaying consumer contracts',           source: 'Pact',    result: '4 of 4',     ms: T.contract },
      ] },
      { type: 'prepAt', index: 6 },
      { type: 'say', lines: [
        'Applied behind the refunds_v2 flag. Both failing checks pass now, 340 regression specs are green and all four consumer contracts hold.',
        'Steps 5 and 6 are done and the run has stopped again at step 7 — staging carries real settlement traffic, so it does not go there on my say-so.',
      ] },
      // Moving the run to step 7 is what presents gate 7. This beat never
      // names it, which is why clearing one gate can never strand the next.
    ],

    approved2: [
      { type: 'runState', kind: 'live', label: 'Canary · steps 8–9' },
      { type: 'tools', steps: [
        { label: 'Enabling refunds_v2 at 5%',   source: 'Flags',  result: 'staging',  ms: T.contract },
        { label: 'Holding for one hour',        source: 'Canary', result: '1h',       ms: T.ngBuild },
        { label: 'Comparing settlement totals', source: 'Ledger', result: 'no drift', ms: T.diffScan },
      ] },
      { type: 'prepAt', index: 9 },
      { type: 'say', lines: [
        'Canary ran an hour at 5% and the settlement totals match v1 to the penny.',
        'One step left, and it is the one that involves other people — so it is yours too.',
      ] },
    ],

    /* Step 10. The work is finished and verified; what is left is telling three
       other teams about it, which is not a thing to do on an agent's own say-so. */
    raised: [
      { type: 'runState', kind: 'live', label: 'Raising PRs' },
      { type: 'tools', steps: [
        { label: 'Opening PR into payments-api',   source: 'GitHub', result: '#2291',     ms: T.prCreate },
        { label: 'Opening PR into ledger-service', source: 'GitHub', result: '#874',      ms: T.prCreate },
        { label: 'Opening PR into refund-worker',  source: 'GitHub', result: '#312',      ms: T.prCreate },
        { label: 'Linking all three to PAY-3120',  source: 'Jira',   result: 'In Review', ms: T.jira },
      ] },
      { type: 'prepAt', index: 10 },
      { type: 'runState', kind: 'shipped', label: 'In review' },
      { type: 'say', lines: ['All ten steps are done and three PRs are up for review.'],
        block: { kind: 'links', links: [
          { label: 'payments-api → PR #2291' },
          { label: 'ledger-service → PR #874' },
          { label: 'refund-worker → PR #312' },
        ] } },
    ],

    gate3: [
      { type: 'say', stream: false, lines: [],
        block: { kind: 'confirm', step: 10, title: 'Raise the three pull requests',
          acceptLabel: 'Raise the three PRs', cancelLabel: 'Hold here', acceptBeat: 'raised', rows: [
            { repo: 'payments-api', branch: 'feat/PAY-3120-refund-v2 → main', what: 'Mapper, v2 schema, service normalisation' },
            { repo: 'ledger-service', branch: 'feat/PAY-3120-refund-v2 → main', what: 'Refund consumer + updated pact' },
            { repo: 'refund-worker', branch: 'feat/PAY-3120-refund-v2 → main', what: 'v2 event payload' },
          ] } },
    ],

    validation: [
      { type: 'showTab', tab: 'tests' },
      { type: 'say', lines: ['The Validator ran on the full recorded sample, not a subset.'],
        block: { kind: 'coverage', groups: [
          { title: 'Passed · 18 checks', items: [
            'Schema conformance on 1,200 replayed refunds',
            'All four consumer contracts satisfied',
            'Reason codes inside the v2 enum',
            'Money held to the minor-unit type',
          ] },
          { title: 'Warnings · 2', tone: 'assumed', items: [
            '214 records defaulted initiatedBy to "system"',
            '3 memos truncated at 280 characters',
          ] },
        ] } },
    ],

    files: [
      { type: 'say', lines: ['Staged, not applied. Open any of them in the workspace.'],
        block: { kind: 'links', links: [
          { label: 'refund-mapper.ts', file: 'refund-mapper.ts' },
          { label: 'refunds.service.ts', file: 'refunds.service.ts' },
          { label: 'refund-v2.schema.json', file: 'refund-v2.schema.json' },
        ] } },
    ],

    diff: [
      { type: 'showTab', tab: 'diff' },
      { type: 'say', lines: ['Two repos in the working diff. Nothing is committed — the branch exists, the change is staged behind the gate.'] },
    ],

    open: [
      { type: 'tools', steps: [
        { label: 'Re-reading acceptance criteria', source: 'Jira',            result: 'PAY-3120',   ms: T.jira },
        { label: 'Re-checking the v2 schema',      source: 'Schema registry', result: 'v2.1',       ms: T.contract },
        { label: 'Scanning the working diff',      source: 'Repo',            result: '9 files',    ms: T.diffScan },
      ] },
      { type: 'say', lines: ['Where it stands.'], block: { kind: 'coverage', groups: [
        { title: 'Done', items: [
          'All 14 v1 fields mapped or explicitly dropped',
          'v2 JSON Schema pinned at v2.1',
          'Validator agent passed on 1,200 recorded refunds',
          '18 mapper specs, 91% coverage',
        ] },
        { title: 'Not done', items: [
          'Nothing applied to any service — parked at the step 4 gate',
          'settlement_batch has no v1 source. Finance says it can be backfilled after cutover.',
        ] },
        { title: 'I assumed', tone: 'assumed', items: [
          'A missing initiated_by means "system" rather than a failed record',
          'A memo over 280 characters is truncated rather than rejected',
          'The flag defaults off in every environment until the canary clears',
        ] },
      ] } },
    ],
  },

  /* Order matters — first match wins. The specific phrases have to sit ahead of
     the greedy "show me" rule, same trap as t1. */
  router: [
    { match: /(validat|conformance|test result|warning|check)/i,                 beat: 'validation' },
    { match: /(review the code|code change|changed files|the files|mapping code)/i, beat: 'files' },
    { match: /\bdiff\b/i,                                                        beat: 'diff' },
    { match: /(not covered|covered|coverage|\bopen\b|missing|gap|assum|scenario)/i, beat: 'open' },
  ],

  /* No chips. The gate card is the only thing on screen that can move the run,
     and four suggestions sitting under it competed with it for the same glance.
     Every reading path is still one sentence away in the composer, and the
     router still answers all of them. */
  chips: {},

  fallback: ['I can show you the Validator results, the staged mapping code, the working diff, or what is still open. The progress panel below has the full sequence; the three gates in it are yours to clear.'],
}
