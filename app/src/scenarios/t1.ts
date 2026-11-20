import type { Effect, Scenario } from '../state/types'
import { T } from '../state/timing'
import { FLAGS } from '../config/flags'

const formHtml = `<form [formGroup]="form" (ngSubmit)="submit()">
  <h3>How was your experience?</h3>

  <play-rating-scale formControlName="rating"></play-rating-scale>

  <play-form-field label="Comment">
    <textarea formControlName="comment" maxlength="500"></textarea>
    <play-character-counter [max]="500"></play-character-counter>
  </play-form-field>

  <play-button type="submit">Submit</play-button>
</form>`

const componentTs = `@Component({
  selector: 'app-feedback-form',
  templateUrl: './feedback-form.component.html'
})
export class FeedbackFormComponent {
  form = this.fb.group({
    rating:  [null, Validators.required],
    comment: ['', [Validators.required, Validators.maxLength(500)]]
  });

  submit() {
    if (this.form.invalid) return;
    this.api.send(this.form.value).subscribe(() => this.form.reset());
  }
}`

const serviceTs = `@Injectable({ providedIn: 'root' })
export class FeedbackService {
  send(payload: Feedback) {
    return this.http.post<FeedbackResponse>('/api/v1/feedback', payload);
  }
}`

/* Step 10's gate — raised after the changes have been reviewed, and again if
   the user asks for the PRs outright. */
const SHIP_GATE: Effect = { type: 'say', stream: false, lines: [],
  block: { kind: 'confirm', step: 10, title: 'Raise both pull requests',
    acceptLabel: 'Raise both PRs', cancelLabel: 'Not yet', acceptBeat: 'shipped', rows: [
    { repo: 'PLAY', branch: 'feat/play-formfield-charactercounter → main', what: 'FormField, CharacterCounter' },
    { repo: 'Product', branch: 'feat/MOB-2841-feedback-form → develop', what: 'Feedback page, API integration, 11 specs passing' },
  ] } }

/* The review gate the run parks on before step 10 — the user reads what was
   built (or says what to change) before any PR is offered. */
const READY_GATE: Effect = { type: 'say', stream: false, lines: [], block: {
  kind: 'decision', title: 'Want to review the changes?',
  question: 'The form is built and validation passed. Check what changed before I raise the PR.',
  placeholder: 'What should change?',
  options: [
    { label: 'Refine changes', beat: 'feedback', collect: true },
    { label: 'Review changes', beat: 'files', primary: true },
  ],
} }

/* The original opening: the matched process, tool groups and prose. */
const NARRATION_OPENING: Effect[] = [
      { type: 'say', stream: false, lines: [], block: {
        kind: 'plan', collapsed: true, count: 5, title: 'UI Screen Generation Process',
        matched: 'UI Screen Generation Process',
        intro: 'This process can take this task from design through implementation and verification.',
        steps: [
          { title: 'Understand the ticket & design', detail: 'Pull MOB-2841 and match it to the Feedback Form v3 frame in Figma' },
          { title: 'Match PLAY components', detail: 'Break the design into components; reuse what exists, build what does not' },
          { title: 'Verify the API contract', detail: 'Check POST /api/v1/feedback matches what the form needs' },
          { title: 'Build & wire the screen', detail: 'Generate the Angular page, wire the endpoint, register the route' },
          { title: 'Test & hand off', detail: 'Run unit tests and coverage, then park for your review' },
        ],
      } },
      // This work was finished on the Jira webhook before Deepak sat down, so the
      // opening does not sit through a loading sequence: the run lands straight on
      // the review gate (step 9) and the accordions below are already complete —
      // records of what ran, not steps ticking through in front of you.
      { type: 'tools', title: 'Reading the ticket & the design', steps: [
        { label: 'Reading the Jira ticket & acceptance criteria', source: 'Jira', result: 'MOB-2841', ms: 0 },
        { label: 'Matching the ticket to the Figma frame', source: 'Figma', result: 'Feedback Form v3', ms: 0 },
        { label: 'Checking components against the PLAY library', source: 'PLAY', result: '6 needed', ms: 0 },
        { label: 'Deciding build vs reuse', source: 'PLAY', result: '4 reused · 2 built', ms: 0 },
      ] },
      { type: 'say', stream: false, lines: [
        'MOB-2841 matched the Feedback Form v3 frame cleanly. Six PLAY components in the design — four already in the library, two I built and staged for their own PR.',
      ], citations: [
        { kind: 'jira', label: 'MOB-2841', title: 'Add a feedback form to the mobile app',
          meta: 'Jira · Mobile Platform', description: 'A 1–5 rating and an optional comment, posted to the feedback endpoint — the acceptance criteria this build was matched against.',
          date: 'Opened Sep 8, 2026' },
        { kind: 'figma', label: 'Feedback Form v3', title: 'Feedback Form v3',
          meta: 'Figma · Mobile Components', description: 'The approved frame in the Mobile Components file — six components matched against it, four reused from PLAY.',
          date: 'Updated Sep 9, 2026' },
      ] },
      { type: 'tools', title: 'Building & wiring the screen', steps: [
        { label: 'Verifying the API contract', source: 'OpenAPI', result: 'POST /api/v1/feedback', ms: 0 },
        { label: 'Locating the feature module & route', source: 'Repo', result: 'src/app/feedback/', ms: 0 },
        { label: 'Generating the page & wiring the endpoint', source: 'Repo', result: '7 files changed', ms: 0, diff: [
          { tone: 'add', text: '+ <play-rating-scale formControlName="rating"></play-rating-scale>' },
          { tone: 'add', text: '+ <play-form-field label="Comment">' },
          { tone: 'add', text: '+   <play-character-counter [max]="500"></play-character-counter>' },
          { tone: 'ctx', text: '  … 7 files, 11 specs' },
        ] },
      ] },
      { type: 'say', stream: false, lines: [
        'The endpoint was already live, so no contract change. I generated the Angular page, wired it to POST /api/v1/feedback and registered the route — seven files in all.',
      ], citations: [
        { kind: 'github', label: '7 files', title: 'Working diff · feat/MOB-2841-feedback-form',
          meta: 'GitHub · aava/mobile', description: 'The generated screen and its wiring — 7 files, +214 −0. Two PLAY components staged for a separate PR into the library.',
          date: 'Uncommitted' },
      ] },
      { type: 'tools', title: 'Tests & checks', steps: [
        { label: 'Running unit tests', source: 'Runner', result: '11 passed · 87%', ms: 0 },
        { label: 'Build · lint · contract checks', source: 'CI', result: 'all clean', ms: 0 },
      ] },
      // The completion line + the running app, front and centre.
      { type: 'say', stream: false,
        lines: ['All the requirements were clear — I read the ticket, matched the design against the PLAY library, and implemented the feedback screen end-to-end. It is running in the preview on the right, ready for your review.'],
        block: { kind: 'links', links: [{ label: 'Validation results', tab: 'tests' }] } },
      { type: 'say', stream: false, lines: [],
        block: { kind: 'app', name: 'feedback-form', status: 'localhost:4200 · Running' } },
]

/* The timeline opening: one block that draws the whole run as numbered stages. */
const TIMELINE_OPENING: Effect[] = [
  { type: 'say', stream: false, lines: [], block: { kind: 'timeline' } },
]

export const t1: Scenario = {
  capability: { name: 'UI Screen Generator', badge: 'USG-1.0' },
  prep: [
    { key: 'jira',   label: 'Read Jira',                   result: 'MOB-2841',              detail: 'Ticket, acceptance criteria and sprint pulled from the connected Jira project.' },
    { key: 'figma',  label: 'Identified image from Figma', result: 'Feedback Form v3',       detail: 'Matched the ticket to a frame in the product file. Open the evidence to see the design.' },
    { key: 'play',   label: 'Verified PLAY components',    result: '6 needed',               detail: 'Broke the design into six components and checked each one against the PLAY library.' },
    { key: 'build',  label: 'Identified build vs use',     result: '4 reused · 2 built',     detail: 'Four components already existed. Two did not, so I built them. They need their own PR into PLAY.' },
    { key: 'api',    label: 'Verified API contract',       result: 'POST /api/v1/feedback',  detail: 'Endpoint is live and the schema matches what the form needs. No contract change required.' },
    { key: 'repo',   label: 'Identified code from repo',   result: 'src/app/feedback/',      detail: 'Located the feature module and the routing entry the form belongs to.' },
    { key: 'inject', label: 'Injected the feedback form',  result: '7 files changed',        detail: 'Built the Angular page, wired it to the endpoint, registered the route.' },
    { key: 'tests',  label: 'Ran unit tests',              result: '11 passed · 87%',        detail: 'All specs pass. Coverage is above the 80% gate.' },
    { key: 'checks', label: 'Checks passed',               result: 'build · lint · contract', detail: 'Build clean, lint clean, response shape matches the contract. Three assumptions logged.' },
    { key: 'ready',  label: 'Human-in-the-loop Review',    result: 'awaiting your review',   detail: 'It is running in the preview. Check it over, then clear the gate and I will raise both PRs.', pending: true, gate: 'ship' },
  ],

  evidence: {
    jira: { name: 'Read Jira', source: 'Jira', body: { kind: 'kv', pairs: [
      ['Ticket', 'MOB-2841'],
      ['Title', 'Add feedback form to mobile app'],
      ['Sprint', 'Sprint 34'],
      ['Acceptance', 'Rating 1–5 · comment up to 500 characters · success and error states'],
      ['Status', 'In Progress'],
    ] } },
    figma: { name: 'Identified image from Figma', source: 'Figma', body: {
      kind: 'figma', caption: 'Feedback Form v3 · last modified 3 days ago · click to enlarge' } },
    play: { name: 'Verified PLAY components', source: 'PLAY library', body: {
      kind: 'columns',
      lead: 'Design broken into six components, each checked against the library index.',
      found: ['Input', 'Textarea', 'RatingScale', 'Button'],
      missing: ['FormField', 'CharacterCounter'] } },
    build: { name: 'Identified build vs use', source: 'Decision', body: { kind: 'kv', pairs: [
      ['Reused', 'Input · Textarea · RatingScale · Button'],
      ['Built', 'FormField · CharacterCounter'],
      ['Destination', 'Separate PR into the PLAY library'],
    ] } },
    api: { name: 'Verified API contract', source: 'OpenAPI', body: { kind: 'kv', pairs: [
      ['Endpoint', 'POST /api/v1/feedback'],
      ['Request', '{ rating: number, comment: string }'],
      ['Response', '201 { id: string, createdAt: string }'],
      ['Status', 'Live · no contract change needed'],
    ] } },
    repo: { name: 'Identified code from repo', source: 'Repo', body: { kind: 'kv', pairs: [
      ['Repo', 'aava-product'],
      ['Branch', 'feat/MOB-2841-feedback-form'],
      ['Module', 'src/app/feedback/'],
      ['Route', '/feedback registered in app.routes.ts'],
    ] } },
    inject: { name: 'Injected the feedback form', source: '7 files', body: { kind: 'kv', pairs: [
      ['Added', 'feedback-form.component.ts · .html · .scss · .spec.ts'],
      ['Added', 'feedback.service.ts'],
      ['Modified', 'feedback.module.ts · app.routes.ts'],
    ] } },
    tests: { name: 'Ran unit tests', source: 'Karma', body: { kind: 'text',
      text: '11 specs, all passing. Coverage 87%, above the 80% gate. The full run is on the Tests tab.' } },
    checks: { name: 'Checks passed', source: 'Self-check', body: { kind: 'kv', pairs: [
      ['Build', 'Clean'],
      ['Lint', 'Clean'],
      ['Contract', 'Response shape matches'],
      ['Assumed', 'Comment required · rating starts unselected · form resets after submit'],
    ] } },
    ready: { name: 'Human-in-the-loop Review', source: 'Status', body: { kind: 'text',
      text: 'Two PRs are staged and waiting on your approval.' } },
  },

  fileOrder: ['feedback-form.component.html', 'feedback-form.component.ts', 'feedback.service.ts'],
  /* The path the prep step reported finding — the tree shows the same place. */
  fileRoot: 'src/app/feedback',
  files: {
    'feedback-form.component.html': { versions: [formHtml] },
    'feedback-form.component.ts': { versions: [componentTs] },
    'feedback.service.ts': { versions: [serviceTs] },
  },

  tests: {
    coveragePct: 87,
    gatePct: 80,
    specs: [
      'creates the component', 'renders the rating scale', 'renders the comment field',
      'requires a rating', 'requires a comment', 'caps the comment at 500 characters',
      'counts characters as you type', 'posts to the feedback endpoint',
      'shows the success state', 'shows the error state', 'resets after a successful submit',
    ],
  },

  diff: [
    { repo: 'PLAY component library', branch: 'feat/play-formfield-charactercounter', files: [
      '+ src/lib/form-field/form-field.component.ts',
      '+ src/lib/character-counter/character-counter.component.ts',
    ], stats: {
      'src/lib/form-field/form-field.component.ts': [46, 0],
      'src/lib/character-counter/character-counter.component.ts': [31, 0],
    } },
    /* The seven files the "Injected the feedback form" step names. */
    { repo: 'Product', branch: 'feat/MOB-2841-feedback-form',
      files: [
        '+ src/app/feedback/feedback-form.component.html',
        '+ src/app/feedback/feedback-form.component.ts',
        '+ src/app/feedback/feedback-form.component.scss',
        '+ src/app/feedback/feedback-form.component.spec.ts',
        '+ src/app/feedback/feedback.service.ts',
        '~ src/app/feedback/feedback.module.ts',
        '~ src/app/app.routes.ts',
      ],
      stats: {
        'src/app/feedback/feedback-form.component.scss': [38, 0],
        'src/app/feedback/feedback-form.component.spec.ts': [112, 0],
        'src/app/feedback/feedback.module.ts': [6, 1],
        'src/app/app.routes.ts': [2, 0],
      },
      lines: [
        { tone: 'add', text: '+ <play-rating-scale formControlName="rating"></play-rating-scale>' },
        { tone: 'add', text: '+ <play-form-field label="Comment">' },
        { tone: 'add', text: '+   <play-character-counter [max]="500"></play-character-counter>' },
        { tone: 'ctx', text: '  … 7 files, 11 specs' },
      ] },
  ],

  beats: {
    prep: [
      // Deliberately fast: this work was already done on the Jira webhook before
      // Deepak sat down. Prepared work is instant, new work costs real time — that
      // contrast is the whole "Work Finds You" argument, made physical.
      //
      // The matched capability and its plan, as one quiet collapsed record: this
      // screen was taken end-to-end by the UI Screen Generation process —
      // already matched, already run. Context the user can open, not a card.
      /* The run as a step timeline (FLAGS.RUN_TIMELINE), or the original
         narration. Both land on the review gate at step 10. */
      { type: 'prepAt', index: 9 },
      ...(FLAGS.RUN_TIMELINE ? TIMELINE_OPENING : NARRATION_OPENING),
      // The running app is not something to ask for — it is the first thing you
      // should see. No build to sit through: the work was done on the Jira
      // webhook before Deepak sat down, so the preview is already up.
      // Validation second, the running page third — both open on arrival.
      { type: 'showTab', tab: 'tests' },
      /* Two opens in one tick land as one render, and the workspace only sees
         the second — a beat apart, each gets its own tab. */
      { type: 'wait', ms: T.contract },
      { type: 'showTab', tab: 'preview' },
      { type: 'runState', kind: 'live', label: 'Running' },
      READY_GATE,
    ],

    /* The files are the answer, not a summary of them — each one opens in the
       workspace, so "review the code changes" ends in the code. */
    files: [
      // Validation first: it is the evidence the changes are safe to read.
      { type: 'showTab', tab: 'tests' },
      { type: 'say', lines: ['Here is what changed. Open any file in the workspace, or check the validation results.'],
        block: { kind: 'links', links: [
          { label: 'feedback-form.component.html', file: 'feedback-form.component.html' },
          { label: 'feedback-form.component.ts', file: 'feedback-form.component.ts' },
          { label: 'feedback.service.ts', file: 'feedback.service.ts' },
          { label: 'View validation results', tab: 'tests' },
        ] } },
      { type: 'wait', ms: 300 },
      SHIP_GATE,
    ],

    feedback: [
      { type: 'say', lines: ['Noted — I will fold that into the feedback screen before the PR goes up. You can still review the current changes.'] },
      READY_GATE,
    ],

    // Kept for a later "show me the preview" — it never stopped running.
    run: [
      { type: 'showTab', tab: 'preview' },
      { type: 'say', lines: ['It is running on :4200 — preview is open.'] },
      { type: 'chips', stage: 'running' },
    ],

    coverage: [
      // It cannot know what is missing without re-reading the criteria and the
      // diff. Showing that is the difference between an agent and a chatbot.
      { type: 'tools', steps: [
        { label: 'Re-reading acceptance criteria', source: 'Jira',   result: 'MOB-2841',    ms: T.jira },
        { label: 'Comparing against the Figma frame', source: 'Figma', result: 'v3 · 2 gaps', ms: T.figma },
        { label: 'Scanning the working diff',      source: 'Repo',   result: '7 files',      ms: T.diffScan, diff: [
          { tone: 'add', text: '+ <play-rating-scale formControlName="rating"></play-rating-scale>' },
          { tone: 'add', text: '+ <play-form-field label="Comment">' },
          { tone: 'add', text: '+   <play-character-counter [max]="500"></play-character-counter>' },
          { tone: 'ctx', text: '  … 7 files, 11 specs' },
        ] },
        { label: 'Checking the API contract',      source: 'OpenAPI', result: 'no anon field', ms: T.contract },
      ] },
      { type: 'say', lines: ["Here is where it stands."], block: { kind: 'coverage', groups: [
        { title: 'Done', items: [
          'Form layout matching the Figma frame',
          'Rating scale, 1–5',
          'Comment field with a 500 character limit',
          'POST to the feedback endpoint',
          'Success and error states',
          '11 unit specs',
        ] },
        { title: 'Not done', items: [
          'File attachments — in the Figma frame, not in the acceptance criteria',
          'Anonymous submission — no field in the API contract. Blocked on the platform team.',
        ] },
        { title: 'I assumed', tone: 'assumed', items: [
          'The comment field is required',
          'Rating starts unselected rather than at 3',
          'The form resets after a successful submit',
        ] },
        { title: 'Open scenarios', items: [
          'Empty submit',
          'Network failure mid-submit',
          'Character limit hit exactly',
          'Duplicate submit from a double click',
        ] },
      ] } },
      { type: 'chips', stage: 'reviewed' },
    ],

    diff: [
      { type: 'showTab', tab: 'diff' },
      { type: 'say', lines: ['Two repos. The PLAY components are a separate PR from the product change.'] },
    ],

    ship: [SHIP_GATE],

    shipped: [
      { type: 'prepAt', index: 10 },
      { type: 'runState', kind: 'live', label: 'Raising PRs' },
      { type: 'tools', steps: [
        { label: 'Pushing feat/play-formfield-charactercounter', source: 'GitHub', result: 'PLAY',    ms: T.prCreate },
        { label: 'Opening pull request into main',               source: 'GitHub', result: '#218',    ms: T.prCreate },
        { label: 'Pushing feat/MOB-2841-feedback-form',         source: 'GitHub', result: 'Product', ms: T.prCreate },
        { label: 'Opening pull request into develop',            source: 'GitHub', result: '#1043',   ms: T.prCreate },
        { label: 'Linking both to MOB-2841',                    source: 'Jira',   result: 'In Review', ms: T.jira },
      ] },
      { type: 'runState', kind: 'shipped', label: 'In review' },
      { type: 'say', lines: ["Both PRs raised."], block: { kind: 'links', links: [
        { label: 'PLAY → PR #218' },
        { label: 'Product → PR #1043' },
      ] } },
    ],
  },

  router: [
    /* Comes first: "review the code changes" contains "review", and the
       coverage rule below would otherwise swallow it. */
    { match: /(review the code|code change|changed files|the files)/i, beat: 'files' },
    { match: /\b(pr|prs|raise|ship|merge|approve|push)\b/i, beat: 'ship' },
    { match: /\bdiff\b/i,                                   beat: 'diff' },
    { match: /(not covered|covered|coverage|done|scenario|missing|gap|assum|open item)/i, beat: 'coverage' },
    { match: /(run|show|output|preview|see it|live|npm)/i, beat: 'run' },
  ],

  chips: {
    developed: [
      { label: 'Review code changes', sends: 'Review the code changes' },
    ],
    // Each branch still offers the other, so neither is a dead end.
    filed: [
      { label: 'Are there any open items?', sends: 'Are there any open items?' },
    ],
    running: [
      { label: 'Are there any open items?', sends: 'Are there any open items?' },
    ],
    reviewed: [
      { label: 'Show me the diff', sends: 'Show me the diff' },
    ],
    /* Follow-ups offered after an Ask-mode answer. They are asked, not sent:
       the composer routes chips through Ask while Ask mode is on. */
    ask: [
      { followup: true, label: 'Why is the validation right?', sends: 'Why is the validation right?' },
      { followup: true, label: 'What is not covered?', sends: 'What is not covered?' },
      { followup: true, label: 'Which design did you match?', sends: 'Which design did you match?' },
    ],
  },


  fallback: ['I can show you the running app, what is covered, the working diff, or raise the PRs. Say which.'],

  /* The run as six stages (FLAGS.RUN_TIMELINE). Each folds to one line; opened
     it shows what ran and a short summary with its sources. */
  timeline: [
    {
      title: 'Read the ticket & design',
      keys: ['jira', 'figma'],
      tools: [
        { label: 'Reading the Jira ticket & acceptance criteria', source: 'Jira', result: 'MOB-2841', ms: 0 },
        { label: 'Matching the ticket to the Figma frame', source: 'Figma', result: 'Feedback Form v3', ms: 0 },
      ],
      summary: ['MOB-2841 matched the Feedback Form v3 frame cleanly: a 1–5 rating, a comment up to 500 characters, success and error states.'],
      citations: [
        { kind: 'jira', label: 'MOB-2841', title: 'Add a feedback form to the mobile app', meta: 'Jira · Mobile Platform',
          description: 'A 1–5 rating and an optional comment, posted to the feedback endpoint — the acceptance criteria this build was matched against.', date: 'Opened Sep 8, 2026' },
        { kind: 'figma', label: 'Feedback Form v3', title: 'Feedback Form v3', meta: 'Figma · Mobile Components',
          description: 'The approved frame in the Mobile Components file.', date: 'Updated Sep 9, 2026' },
      ],
    },
    {
      title: 'Match & build PLAY components',
      keys: ['play', 'build'],
      tools: [
        { label: 'Checking components against the PLAY library', source: 'PLAY', result: '6 needed', ms: 0 },
        { label: 'Deciding build vs reuse', source: 'PLAY', result: '4 reused · 2 built', ms: 0 },
      ],
      summary: ['Six PLAY components in the design. Four already in the library; FormField and CharacterCounter I built and staged for their own PR into PLAY.'],
    },
    {
      title: 'Verify the API contract',
      keys: ['api'],
      tools: [{ label: 'Verifying the API contract', source: 'OpenAPI', result: 'POST /api/v1/feedback', ms: 0 }],
      summary: ['The endpoint is already live and matches what the form sends, so no contract change.'],
    },
    {
      title: 'Build & wire the screen',
      keys: ['repo', 'inject'],
      tools: [
        { label: 'Locating the feature module & route', source: 'Repo', result: 'src/app/feedback/', ms: 0 },
        { label: 'Generating the page & wiring the endpoint', source: 'Repo', result: '7 files changed', ms: 0, diff: [
          { tone: 'add', text: '+ <play-rating-scale formControlName="rating"></play-rating-scale>' },
          { tone: 'add', text: '+ <play-form-field label="Comment">' },
          { tone: 'add', text: '+   <play-character-counter [max]="500"></play-character-counter>' },
          { tone: 'ctx', text: '  … 7 files, 11 specs' },
        ] },
      ],
      summary: ['Generated the Angular page, wired it to POST /api/v1/feedback and registered the route: seven files in all.'],
      citations: [
        { kind: 'github', label: '7 files', title: 'Working diff · feat/MOB-2841-feedback-form', meta: 'GitHub · aava/mobile',
          description: 'The generated screen and its wiring — 7 files, +214 −0.', date: 'Uncommitted' },
      ],
    },
    {
      title: 'Tests & checks',
      keys: ['tests', 'checks'],
      tools: [
        { label: 'Running unit tests', source: 'Runner', result: '11 passed · 87%', ms: 0 },
        { label: 'Build · lint · contract checks', source: 'CI', result: 'all clean', ms: 0 },
      ],
      summary: ['All 11 specs pass with 87% coverage, above the 80% gate. Build, lint and contract checks are clean.'],
      tab: { id: 'tests', label: 'Validation results' },
    },
    {
      title: 'Your review',
      keys: ['ready'],
      summary: [
        'All the requirements were clear. I read the ticket, matched the design against the PLAY library and built the feedback screen end to end.',
        'I stopped here so you can check the changes before I raise the PRs. It is running in the preview on the right.',
      ],
      app: true,
    },
  ],
  /* Ask mode at the review gate: read-only answers from this session's own
     evidence. Each one re-reads what it cites (it does not re-run anything),
     then the engine hands the user back to the open gate. */
  ask: [
    {
      match: /(validat|pass|correct|right|trust|why.*(test|spec|check)|test|spec|check|coverage)/i,
      effects: [
        { type: 'tools', title: 'Re-read the validation evidence', steps: [
          { label: 'Reading the acceptance criteria', source: 'Jira',  result: 'MOB-2841 · 4 criteria', ms: T.jira },
          { label: 'Matching specs to criteria',      source: 'Karma', result: '11 specs',              ms: T.repo },
          { label: 'Reading the coverage report',     source: 'Karma', result: '87% · gate 80%',        ms: T.diffScan },
          { label: 'Checking the response shape',     source: 'OpenAPI', result: 'matches contract',    ms: T.contract },
        ] },
        { type: 'say', lines: [
          'Short answer: every acceptance criterion on MOB-2841 has at least one passing spec, and the checks around the specs agree with them.',
        ], citations: [
          { kind: 'jira', label: 'MOB-2841', title: 'Add product feedback form', meta: 'Acceptance criteria' },
          { kind: 'github', label: 'spec', title: 'feedback-form.component.spec.ts', meta: '11 specs passing' },
        ], block: { kind: 'coverage', groups: [
          { title: 'Each criterion has a passing spec', items: [
            'Rating 1–5 → renders the rating scale · requires a rating',
            'Comment up to 500 characters with a live counter → caps the comment at 500 characters · counts characters as you type',
            'Posts to POST /api/v1/feedback → posts to the feedback endpoint',
            'Success and error states → shows the success state · shows the error state',
          ] },
          { title: 'Checks beyond the specs', items: [
            'Coverage 87%, above the 80% gate',
            'Build and lint are clean',
            'The response shape matches the OpenAPI contract',
          ] },
          { title: 'What it does not prove', tone: 'assumed', items: [
            'These are unit specs. No browser or end-to-end test has run.',
            'Network failure mid-submit and a double-click submit are not tested.',
            'Three choices are mine, not the ticket\'s: comment required, rating starts unselected, form resets after submit.',
          ] },
        ] } },
      ],
    },
    {
      match: /(not cover|uncover|missing|gap|untested|risk|assum|edge|open item|anonymous)/i,
      effects: [
        { type: 'say', lines: [
          'Two things are not built and four scenarios are not tested. None of them is in the acceptance criteria, which is why validation still passes.',
        ], block: { kind: 'coverage', groups: [
          { title: 'Not built', items: [
            'File attachments — in the Figma frame, not in the acceptance criteria',
            'Anonymous submission — the API contract has no field for it. Blocked on the platform team.',
          ] },
          { title: 'Not tested', items: [
            'Empty submit',
            'Network failure mid-submit',
            'Character limit hit exactly',
            'Duplicate submit from a double click',
          ] },
        ] } },
      ],
    },
    {
      match: /(figma|design|frame|component|play|reuse|built)/i,
      effects: [
        { type: 'say', lines: [
          'I matched MOB-2841 to the **Feedback Form v3** frame in Figma. The frame uses six PLAY components: four already existed, and two (FormField and CharacterCounter) I built and staged for their own PR into PLAY.',
        ], citations: [
          { kind: 'figma', label: 'Figma', title: 'Feedback Form v3', meta: 'Product file' },
        ] },
      ],
    },
  ],
  askFallback: [
    'In Ask mode I only answer from this session: ticket MOB-2841, the Feedback Form v3 frame, the 7 changed files and the validation run. Ask me about any of those.',
  ],
}
