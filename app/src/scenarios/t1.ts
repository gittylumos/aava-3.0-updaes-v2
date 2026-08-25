import type { Scenario } from '../state/types'
import { T } from '../state/timing'

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

export const t1: Scenario = {
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
    ] },
    { repo: 'Product', branch: 'feat/MOB-2841-feedback-form',
      files: ['+ src/app/feedback/feedback-form.component.html', '+ 6 more files'],
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
      { type: 'say', stream: false,
        lines: ['I have developed the screen as per the requirement! Here is the generated preview on the right.'],
        block: { kind: 'app', name: 'feedback-form', status: 'localhost:4200 · Running' } },
      // The running app is not something to ask for — it is the first thing you
      // should see. No build to sit through: the work was done on the Jira
      // webhook before Deepak sat down, so the preview is already up.
      { type: 'showTab', tab: 'preview' },
      { type: 'runState', kind: 'live', label: 'Running' },
      /* The preview is right there — describing it is what the panel already
         does. What it cannot show is the work behind it, so the offer is the
         two ways in: the files that changed, or the steps that changed them. */
      { type: 'say', stream: false, lines: [
        'Would you like to review the code changes?',
      ] },
      { type: 'chips', stage: 'developed' },
    ],

    /* The files are the answer, not a summary of them — each one opens in the
       workspace, so "review the code changes" ends in the code. */
    files: [
      { type: 'say', lines: ['Here is what changed. Open any of them in the workspace.'],
        block: { kind: 'links', links: [
          { label: 'feedback-form.component.html', file: 'feedback-form.component.html' },
          { label: 'feedback-form.component.ts', file: 'feedback-form.component.ts' },
          { label: 'feedback.service.ts', file: 'feedback.service.ts' },
        ] } },
      { type: 'wait', ms: 300 },
      { type: 'say', lines: ['What would you like to do next?'] },
      { type: 'chips', stage: 'filed' },
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
        { label: 'Scanning the working diff',      source: 'Repo',   result: '7 files',      ms: T.diffScan },
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

    ship: [
      { type: 'say', stream: false, lines: [],
        block: { kind: 'confirm', step: 10, title: 'Raise both pull requests',
          acceptLabel: 'Raise both PRs', cancelLabel: 'Not yet', acceptBeat: 'shipped', rows: [
          { repo: 'PLAY', branch: 'feat/play-formfield-charactercounter → main', what: 'FormField, CharacterCounter' },
          { repo: 'Product', branch: 'feat/MOB-2841-feedback-form → develop', what: 'Feedback page, API integration, 11 specs passing' },
        ] } },
    ],

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
  },


  fallback: ['I can show you the running app, what is covered, the working diff, or raise the PRs. Say which.'],
}
