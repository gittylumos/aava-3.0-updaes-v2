/* ==========================================================================
   AAVA 3.0 — behaviour
   Store · State · Thread · Composer · TaskRail · TaskWindow · Threads
   Playground (Evidence · Preview · Code · Tests · Diff) · T1 scenario
   ========================================================================== */

(function ($) {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pause = function (ms) { return REDUCED ? 0 : ms; };

  /* ======================================================================
     STORE
     ====================================================================== */
  var Store = {
    tasks: [
      { id: 'T1', title: 'Add feedback form to AAVA',                    status: 'wip',     est: '2 hrs',   priority: 'P1', dep: 'None',              recommended: true },
      { id: 'T2', title: 'Create PRD for Rate Limiting for Engineers',   status: 'clarify', est: '1.5 hrs', priority: 'P2', dep: 'Platform team' },
      { id: 'T3', title: 'Migrate data from MySQL to MongoDB (NoSQL)',   status: 'pending', est: '3 hrs',   priority: 'P2', dep: 'Maintenance window' },
      { id: 'T4', title: 'Instrument AAVA Edge telemetry',               status: 'wip',     est: '4 hrs',   priority: 'P3', dep: 'None' },
      { id: 'T5', title: 'Deprecate the legacy artifact store',          status: 'done',    est: '—',       priority: 'P3', dep: 'None' },
      { id: 'T6', title: 'Write the Experience Studio migration runbook', status: 'done',   est: '—',       priority: 'P3', dep: 'None' }
    ],

    labels: { wip: 'Partially Done', clarify: 'Awaiting Clarifications', pending: 'Pending', done: 'Done' },

    columns: [
      { key: 'pending', name: 'Backlog' },
      { key: 'clarify', name: 'Needs clarification' },
      { key: 'wip',     name: 'In progress' },
      { key: 'done',    name: 'Done' }
    ],

    // Every chat and every task is a resumable session
    threads: [
      { kind: 'chat', title: 'Sprint scope questions', when: 'Yesterday' },
      { kind: 'task', title: 'T4 · Instrument AAVA Edge telemetry', when: '2 days ago' }
    ],

    get: function (id) {
      var found = null;
      $.each(this.tasks, function (_, t) { if (t.id === id) { found = t; return false; } });
      return found;
    },

    setStatus: function (id, status) {
      var t = this.get(id);
      if (t) t.status = status;
    }
  };

  /* ======================================================================
     T1 SCENARIO DATA
     ====================================================================== */
  var T1 = {

    /* The ten pre-work lines. Collapsed by default, each with a result. */
    prep: [
      { key: 'jira',   label: 'Read Jira',                    result: 'AAVA-2841',
        detail: 'Ticket, acceptance criteria and sprint pulled from the connected Jira project.' },
      { key: 'figma',  label: 'Identified image from Figma',  result: 'Feedback Form v3',
        detail: 'Matched the ticket to a frame in the product file. Open the evidence to see the design.' },
      { key: 'play',   label: 'Verified PLAY components',     result: '6 needed',
        detail: 'Broke the design into six components and checked each one against the PLAY library.' },
      { key: 'build',  label: 'Identified build vs use',      result: '4 reused · 2 built',
        detail: 'Four components already existed. Two did not, so I built them. They need their own PR into PLAY.' },
      { key: 'api',    label: 'Verified API contract',        result: 'POST /api/v1/feedback',
        detail: 'Endpoint is live and the schema matches what the form needs. No contract change required.' },
      { key: 'repo',   label: 'Identified code from repo',    result: 'src/app/feedback/',
        detail: 'Located the feature module and the routing entry the form belongs to.' },
      { key: 'inject', label: 'Injected the feedback form',   result: '7 files changed',
        detail: 'Built the Angular page, wired it to the endpoint, registered the route.' },
      { key: 'tests',  label: 'Ran unit tests',               result: '11 passed · 87%',
        detail: 'All specs pass. Coverage is above the 80% gate.' },
      { key: 'checks', label: 'Checks passed',                result: 'build · lint · contract',
        detail: 'Build clean, lint clean, response shape matches the contract. Three assumptions logged.' },
      { key: 'ready',  label: 'Prep is ready',                result: 'awaiting your review',
        detail: 'Nothing is pushed. Ask me to run it, or tell me what to change.' }
    ],

    /* Evidence panel — one block per line */
    evidence: function () {
      return [
        this.evJira(), this.evFigma(), this.evPlay(), this.evBuild(), this.evApi(),
        this.evRepo(), this.evInject(), this.evTests(), this.evChecks(), this.evReady()
      ].join('');
    },

    block: function (key, name, src, body) {
      return '<div class="ev" id="ev-' + key + '">' +
             '<div class="ev__head"><span class="ev__name">' + name + '</span>' +
             '<span class="ev__src">' + src + '</span></div>' +
             '<div class="ev__body">' + body + '</div></div>';
    },

    evJira: function () {
      return this.block('jira', 'Read Jira', 'Jira',
        '<dl class="kv">' +
        '<dt>Ticket</dt><dd>AAVA-2841</dd>' +
        '<dt>Title</dt><dd>Add feedback form to AAVA</dd>' +
        '<dt>Sprint</dt><dd>Sprint 34</dd>' +
        '<dt>Acceptance</dt><dd>Rating 1–5 · comment up to 500 characters · success and error states</dd>' +
        '<dt>Status</dt><dd>In Progress</dd>' +
        '</dl>');
    },

    /* The Figma frame, rendered as an image. Click to open full size. */
    figmaFrame: function () {
      return '<svg viewBox="0 0 520 300" class="frame" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Feedback Form v3 design frame">' +
        '<rect width="520" height="300" fill="#0B0D12"/>' +
        '<rect x="130" y="24" width="260" height="252" rx="10" fill="#15181F" stroke="rgba(255,255,255,.1)"/>' +
        '<rect x="150" y="46" width="112" height="12" rx="3" fill="rgba(255,255,255,.75)"/>' +
        '<rect x="150" y="66" width="168" height="7" rx="3" fill="rgba(255,255,255,.22)"/>' +
        '<rect x="150" y="94" width="54" height="7" rx="3" fill="rgba(255,255,255,.35)"/>' +
        '<rect x="150" y="108" width="26" height="26" rx="6" fill="none" stroke="rgba(255,255,255,.22)"/>' +
        '<rect x="182" y="108" width="26" height="26" rx="6" fill="none" stroke="rgba(255,255,255,.22)"/>' +
        '<rect x="214" y="108" width="26" height="26" rx="6" fill="#55FF99" opacity=".85"/>' +
        '<rect x="246" y="108" width="26" height="26" rx="6" fill="none" stroke="rgba(255,255,255,.22)"/>' +
        '<rect x="278" y="108" width="26" height="26" rx="6" fill="none" stroke="rgba(255,255,255,.22)"/>' +
        '<rect x="150" y="152" width="62" height="7" rx="3" fill="rgba(255,255,255,.35)"/>' +
        '<rect x="150" y="166" width="220" height="58" rx="7" fill="none" stroke="rgba(255,255,255,.22)"/>' +
        '<rect x="320" y="230" width="50" height="6" rx="3" fill="rgba(255,255,255,.18)"/>' +
        '<rect x="150" y="244" width="86" height="26" rx="7" fill="rgba(255,255,255,.85)"/>' +
        '<text x="24" y="34" fill="#6B7280" font-family="monospace" font-size="11">Feedback Form v3</text>' +
        '</svg>';
    },

    evFigma: function () {
      return this.block('figma', 'Identified image from Figma', 'Figma',
        this.figmaFrame() +
        '<p class="frame-caption">Feedback Form v3 · last modified 3 days ago · click to enlarge</p>');
    },

    evPlay: function () {
      return this.block('play', 'Verified PLAY components', 'PLAY library',
        'Design broken into six components, each checked against the library index.' +
        '<div class="cols" style="margin-top:12px">' +
        '<div><h5>Found</h5><ul class="use"><li>Input</li><li>Textarea</li><li>RatingScale</li><li>Button</li></ul></div>' +
        '<div><h5>Missing</h5><ul class="build"><li>FormField</li><li>CharacterCounter</li></ul></div>' +
        '</div>');
    },

    evBuild: function () {
      return this.block('build', 'Identified build vs use', 'Decision',
        'Reuse first. Only what the library could not cover was built.' +
        '<dl class="kv" style="margin-top:12px">' +
        '<dt>Reused</dt><dd>Input · Textarea · RatingScale · Button</dd>' +
        '<dt>Built</dt><dd>FormField · CharacterCounter</dd>' +
        '<dt>Destination</dt><dd>Separate PR into the PLAY library</dd>' +
        '</dl>');
    },

    evApi: function () {
      return this.block('api', 'Verified API contract', 'OpenAPI',
        '<dl class="kv">' +
        '<dt>Endpoint</dt><dd>POST /api/v1/feedback</dd>' +
        '<dt>Request</dt><dd>{ rating: number, comment: string }</dd>' +
        '<dt>Response</dt><dd>201 { id: string, createdAt: string }</dd>' +
        '<dt>Status</dt><dd>Live · no contract change needed</dd>' +
        '</dl>');
    },

    evRepo: function () {
      return this.block('repo', 'Identified code from repo', 'Repo',
        '<dl class="kv">' +
        '<dt>Repo</dt><dd>aava-product</dd>' +
        '<dt>Branch</dt><dd>feat/AAVA-2841-feedback-form</dd>' +
        '<dt>Module</dt><dd>src/app/feedback/</dd>' +
        '<dt>Route</dt><dd>/feedback registered in app.routes.ts</dd>' +
        '</dl>');
    },

    evInject: function () {
      return this.block('inject', 'Injected the feedback form', '7 files',
        '<dl class="kv">' +
        '<dt>Added</dt><dd>feedback-form.component.ts · .html · .scss · .spec.ts</dd>' +
        '<dt>Added</dt><dd>feedback.service.ts</dd>' +
        '<dt>Modified</dt><dd>feedback.module.ts · app.routes.ts</dd>' +
        '</dl>');
    },

    evTests: function () {
      return this.block('tests', 'Ran unit tests', 'Karma',
        '11 specs, all passing. Coverage 87%, above the 80% gate. Full run is on the Tests tab.');
    },

    evChecks: function () {
      return this.block('checks', 'Checks passed', 'Self-check',
        '<dl class="kv">' +
        '<dt>Build</dt><dd>Clean</dd>' +
        '<dt>Lint</dt><dd>Clean</dd>' +
        '<dt>Contract</dt><dd>Response shape matches</dd>' +
        '<dt>Assumed</dt><dd>Comment required · rating starts unselected · form resets after submit</dd>' +
        '</dl>');
    },

    evReady: function () {
      return this.block('ready', 'Prep is ready', 'Status',
        'Nothing has been pushed. Two PRs are staged and waiting on your approval.');
    },

    /* Code tab */
    files: [
      { name: 'feedback-form.component.html', changed: true, body:
        '<form [formGroup]="form" (ngSubmit)="submit()">\n' +
        '  <h3>How was your experience?</h3>\n\n' +
        '  <play-rating-scale formControlName="rating"></play-rating-scale>\n\n' +
        '  <play-form-field label="Comment">\n' +
        '    <textarea formControlName="comment" maxlength="500"></textarea>\n' +
        '    <play-character-counter [max]="500"></play-character-counter>\n' +
        '  </play-form-field>\n\n' +
        '  <play-button type="submit">Submit</play-button>\n' +
        '</form>' },
      { name: 'feedback-form.component.ts', body:
        '@Component({\n' +
        '  selector: \'app-feedback-form\',\n' +
        '  templateUrl: \'./feedback-form.component.html\'\n' +
        '})\n' +
        'export class FeedbackFormComponent {\n' +
        '  form = this.fb.group({\n' +
        '    rating:  [null, Validators.required],\n' +
        '    comment: [\'\', [Validators.required, Validators.maxLength(500)]]\n' +
        '  });\n\n' +
        '  submit() {\n' +
        '    if (this.form.invalid) return;\n' +
        '    this.api.send(this.form.value).subscribe(() => this.form.reset());\n' +
        '  }\n' +
        '}' },
      { name: 'feedback.service.ts', body:
        '@Injectable({ providedIn: \'root\' })\n' +
        'export class FeedbackService {\n' +
        '  send(payload: Feedback) {\n' +
        '    return this.http.post<FeedbackResponse>(\'/api/v1/feedback\', payload);\n' +
        '  }\n' +
        '}' }
    ],

    specs: [
      'creates the component', 'renders the rating scale', 'renders the comment field',
      'requires a rating', 'requires a comment', 'caps the comment at 500 characters',
      'counts characters as you type', 'posts to the feedback endpoint',
      'shows the success state', 'shows the error state', 'resets after a successful submit'
    ]
  };

  /* ======================================================================
     TOAST
     ====================================================================== */
  var Toast = {
    timer: null,
    show: function (msg) {
      var $t = $('#toast').text(msg).addClass('is-visible');
      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(function () { $t.removeClass('is-visible'); }, 3400);
    }
  };

  /* ======================================================================
     STATE — home | chat | execute
     ====================================================================== */
  var State = {
    current: 'home',
    running: null,

    go: function (next, task) {
      this.current = next;
      $('body').attr('data-state', next);

      if (next === 'home') { this.running = null; Thread.clear(); }
      if (next === 'chat') { this.running = null; TaskRail.render(); }
      if (next === 'execute') { this.running = task.id; Playground.open(task); }

      $('#tasksBtn').toggleClass('is-locked', next === 'execute');
      Composer.focus();
    },

    isRunning: function () { return this.current === 'execute'; }
  };

  /* ======================================================================
     THREAD — conversation
     ====================================================================== */
  var Thread = {
    init: function () { this.$el = $('#thread'); },
    clear: function () { this.$el.empty(); },

    user: function (text) {
      this.$el.append($('<div class="msg msg--user"></div>').text(text));
      this.scroll();
    },

    /* AAVA turn. `html` is optional markup appended under the text. */
    aava: function (lines, html, done) {
      var self = this;
      var $msg = $('<div class="msg msg--aava"><span class="msg__from">AAVA</span>' +
                   '<div class="typing"><span></span><span></span><span></span></div></div>');
      this.$el.append($msg);
      this.scroll();

      window.setTimeout(function () {
        $msg.find('.typing').remove();
        $.each([].concat(lines || []), function (_, line) {
          $msg.append($('<p class="msg__text"></p>').text(line));
        });
        if (html) $msg.append(html);
        self.scroll();
        if (done) done();
      }, pause(620));
    },

    scroll: function () {
      var el = document.getElementById('stage');
      window.setTimeout(function () {
        el.scrollTo({ top: el.scrollHeight, behavior: REDUCED ? 'auto' : 'smooth' });
      }, 30);
    }
  };

  /* ======================================================================
     PLAYGROUND
     ====================================================================== */
  var Playground = {
    init: function () {
      var self = this;

      $('#pgClose').on('click', function () { State.go('chat'); });

      $('.tabs').on('click', '.tab', function () {
        if (this.disabled) return;
        self.tab($(this).data('tab'));
      });

      // Figma frame opens full size
      $('#panelEvidence').on('click', '.frame', function () {
        $('<div class="lightbox"></div>').html(T1.figmaFrame()).appendTo('body')
          .on('click', function () { $(this).remove(); });
      });

      this.buildCode();
      this.buildTests();
      this.buildPreview();
    },

    open: function (task) {
      $('#pgTitle').text(task.title);
      $('#pgState').removeClass('is-live is-shipped');
      $('#pgStateText').text('Prep ready');

      $('#panelEvidence').html(T1.evidence());

      $('.tab[data-tab="preview"]').prop('disabled', true);
      $('.tab[data-tab="diff"]').prop('disabled', true).find('.tab__badge').remove();
      this.tab('evidence');
    },

    tab: function (name) {
      $('.tab').removeClass('is-active').attr('aria-selected', 'false');
      $('.tab[data-tab="' + name + '"]').addClass('is-active').attr('aria-selected', 'true');
      $('.panel').removeClass('is-active');
      $('.panel[data-panel="' + name + '"]').addClass('is-active');
    },

    /* Pull an evidence block into view and mark it */
    focusEvidence: function (key) {
      this.tab('evidence');
      var $block = $('#ev-' + key);
      if (!$block.length) return;
      $('.ev').removeClass('is-focus');
      $block.addClass('is-focus');
      $block[0].scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
    },

    /* ---- Code ---- */
    buildCode: function () {
      var $files = $('#codeFiles').empty();
      $.each(T1.files, function (i, f) {
        $files.append(
          $('<button class="file" type="button"></button>')
            .toggleClass('is-active', i === 0)
            .attr('data-index', i)
            .text(f.name)
        );
      });
      this.showFile(0);

      var self = this;
      $files.on('click', '.file', function () {
        $('.file').removeClass('is-active');
        $(this).addClass('is-active');
        self.showFile($(this).data('index'));
      });
    },

    showFile: function (index) {
      this.fileIndex = index;
      var file = T1.files[index];
      var body = file.body;

      // After Beat 4 the submit line moves to the bottom and is highlighted
      if (index === 0 && this.submitMoved) {
        body = body.replace('\n  <play-button type="submit">Submit</play-button>\n', '\n');
        body = body.replace('</play-form-field>\n', '</play-form-field>\n\n@@<play-button type="submit">Submit</play-button>@@\n');
      }

      var $pre = $('#codeBody').empty();
      $.each(body.split('\n'), function (_, line) {
        if (line.indexOf('@@') === 0) {
          $pre.append($('<span class="hl"></span>').text('  ' + line.replace(/@@/g, '')));
          $pre.append(document.createTextNode('\n'));
        } else {
          $pre.append(document.createTextNode(line + '\n'));
        }
      });
    },

    /* ---- Tests ---- */
    buildTests: function () {
      var $panel = $('#panelTests').empty();
      var $list = $('<div class="ev"><div class="ev__head"><span class="ev__name">feedback-form.component.spec.ts</span>' +
                    '<span class="ev__src">11 passed</span></div></div>');
      $.each(T1.specs, function (i, spec) {
        $list.append(
          $('<div class="spec"><span class="spec__tick">✓</span></div>')
            .append($('<span></span>').text(spec))
            .append($('<span class="spec__time"></span>').text((8 + i * 3) + 'ms'))
        );
      });
      $panel.append($list);
      $panel.append('<div class="coverage"><span class="coverage__num">87%</span>' +
                    '<div class="coverage__bar"><div class="coverage__fill"></div></div>' +
                    '<span class="spec__time">gate 80%</span></div>');
    },

    /* ---- Preview: a real, interactive mock app ---- */
    buildPreview: function () {
      $('#previewApp').html(
        '<div class="app-form" id="appForm">' +
          '<h3>How was your experience?</h3>' +
          '<p class="sub">Your feedback goes straight to the product team.</p>' +
          '<div class="actions"><button class="submit" type="button" id="appSubmit">Submit</button></div>' +
          '<div class="field"><label>Rating</label><div class="rate" id="appRate">' +
            '<button type="button">1</button><button type="button">2</button>' +
            '<button type="button">3</button><button type="button">4</button>' +
            '<button type="button">5</button>' +
          '</div></div>' +
          '<div class="field"><label>Comment</label>' +
            '<textarea rows="3" id="appComment" maxlength="500"></textarea>' +
            '<div class="counter" id="appCount">0 / 500</div>' +
          '</div>' +
        '</div>'
      );

      $('#appRate').on('click', 'button', function () {
        $('#appRate button').removeClass('is-on');
        $(this).addClass('is-on');
      });

      $('#previewApp').on('input', '#appComment', function () {
        $('#appCount').text($(this).val().length + ' / 500');
      });

      $('#previewApp').on('click', '#appSubmit', function () {
        if (!$('#appRate .is-on').length || !$.trim($('#appComment').val())) {
          Toast.show('Rating and comment are both required — that is one of the assumptions.');
          return;
        }
        $('#previewApp').html('<div class="app-ok">Thanks — your feedback was submitted. ' +
                              '(Stubbed response, not the live endpoint.)</div>');
      });
    },

    /* ---- Terminal ---- */
    term: function (lines, done) {
      var $t = $('#terminal');
      var i = 0;

      (function next() {
        if (i >= lines.length) { if (done) done(); return; }
        var line = lines[i++];
        $t.append($('<div></div>').addClass(line[0]).text(line[1]));
        $t.scrollTop($t[0].scrollHeight);
        window.setTimeout(next, pause(line[2] || 420));
      })();
    }
  };

  /* ======================================================================
     T1 BEATS — the scripted scenario
     ====================================================================== */
  var Beats = {

    /* Beat 1 — the pre-work list */
    prep: function () {
      var $list = $('<div class="prep"></div>');

      $.each(T1.prep, function (i, item) {
        $list.append(
          $('<div class="prep__row"></div>').attr('data-key', item.key).append(
            $('<button class="prep__head" type="button"></button>')
              .append('<span class="prep__tick" aria-hidden="true"></span>')
              .append($('<span class="prep__label"></span>').text((i + 1) + '. ' + item.label))
              .append($('<span class="prep__result"></span>').text(item.result))
              .append('<svg class="prep__chev" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">' +
                      '<path d="m9.5 5 6.5 7-6.5 7" fill="none" stroke="currentColor" stroke-width="1.8" ' +
                      'stroke-linecap="round" stroke-linejoin="round"/></svg>')
          ).append(
            $('<div class="prep__detail"></div>')
              .append($('<span></span>').text(item.detail))
              .append('<br><button class="prep__open" type="button">Open evidence</button>')
          )
        );
      });

      Thread.aava(['I have done some pre-work.'], $list, function () {
        Thread.aava(['Nothing is pushed. Ask me to run it when you want to see it.']);
      });
    },

    /* Beat 2 — show me the output */
    run: function () {
      $('.tab[data-tab="preview"]').prop('disabled', false);
      Playground.tab('preview');
      $('#pgState').addClass('is-live');
      $('#pgStateText').text('Running');

      $('#terminal').empty();
      Playground.term([
        ['cmd', '$ npm install', 500],
        ['dim', 'up to date, 1284 packages in 2.1s', 600],
        ['cmd', '$ npm run start', 500],
        ['dim', 'Building...', 900],
        ['ok',  '✓ Browser application bundle generation complete.', 500],
        ['ok',  '✓ Compiled successfully.', 400],
        ['dim', '→ Local: http://localhost:4200', 300]
      ]);

      Thread.aava([
        'Starting the dev server.',
        'Running on :4200. It is live — type in it and submit it. Submissions hit a stubbed response, not the real endpoint.'
      ]);
    },

    /* Beat 3 — what is done and what is not */
    coverage: function () {
      var html =
        '<div class="blocks">' +
          this.block('Done', ['Form layout matching the Figma frame', 'Rating scale, 1–5',
            'Comment field with a 500 character limit', 'POST to the feedback endpoint',
            'Success and error states', '11 unit specs']) +
          this.block('Not done', ['File attachments — in the Figma frame, not in the acceptance criteria',
            'Anonymous submission — no field in the API contract. Blocked on the platform team.']) +
          this.block('I assumed', ['The comment field is required',
            'Rating starts unselected rather than at 3',
            'The form resets after a successful submit'], 'assumed') +
          this.block('Open scenarios', ['Empty submit', 'Network failure mid-submit',
            'Character limit hit exactly', 'Duplicate submit from a double click']) +
        '</div>';

      Thread.aava([], $(html));
    },

    block: function (title, items, modifier) {
      var lis = $.map(items, function (i) { return '<li>' + i + '</li>'; }).join('');
      return '<div class="block' + (modifier ? ' block--' + modifier : '') + '">' +
             '<h4 class="block__title">' + title + '</h4><ul>' + lis + '</ul></div>';
    },

    /* Beat 4 — move the submit button */
    move: function () {
      Thread.aava(['Moving Submit below the comment field. One file — feedback-form.component.html.'], null, function () {

        Playground.submitMoved = true;
        $('.file').removeClass('is-active').eq(0).addClass('is-active');
        if (!$('.file').eq(0).find('.mark').length) $('.file').eq(0).append('<span class="mark">●</span>');
        Playground.showFile(0);
        Playground.tab('code');

        window.setTimeout(function () {
          $('#appForm').addClass('is-bottom');
          Playground.term([['ok', '✓ Compiled successfully. Reloading...', 300]]);
          Beats.buildDiff();
          $('.tab[data-tab="diff"]').prop('disabled', false);
          if (!$('.tab[data-tab="diff"] .tab__badge').length) {
            $('.tab[data-tab="diff"]').append('<span class="tab__badge">1</span>');
          }
          Playground.tab('preview');
          Thread.aava(['Done. Reloaded — check the preview. Tests still pass.']);
        }, pause(1100));
      });
    },

    buildDiff: function () {
      $('#panelDiff').html(
        '<div class="diffgroup">' +
          '<div class="diffgroup__head"><span class="diffgroup__repo">PLAY component library</span>' +
          '<span class="diffgroup__branch">feat/play-formfield-charactercounter</span></div>' +
          '<div class="difffile">+ src/lib/form-field/form-field.component.ts</div>' +
          '<div class="difffile">+ src/lib/character-counter/character-counter.component.ts</div>' +
        '</div>' +
        '<div class="diffgroup">' +
          '<div class="diffgroup__head"><span class="diffgroup__repo">Product</span>' +
          '<span class="diffgroup__branch">feat/AAVA-2841-feedback-form</span></div>' +
          '<div class="difffile">~ src/app/feedback/feedback-form.component.html</div>' +
          '<div class="diffline ctx">  &lt;/play-form-field&gt;</div>' +
          '<div class="diffline del">- &lt;play-button type="submit"&gt;Submit&lt;/play-button&gt;  (was above the fields)</div>' +
          '<div class="diffline add">+ &lt;play-button type="submit"&gt;Submit&lt;/play-button&gt;  (now below)</div>' +
          '<div class="difffile">+ 6 more files</div>' +
        '</div>'
      );
    },

    /* Beat 5 — raise the PRs */
    ship: function () {
      var $confirm = $(
        '<div class="confirm">' +
          '<div class="confirm__row"><span class="confirm__repo">PLAY</span>' +
            '<span class="confirm__branch">feat/play-formfield-charactercounter → main</span>' +
            '<span class="confirm__what">FormField, CharacterCounter</span></div>' +
          '<div class="confirm__row"><span class="confirm__repo">Product</span>' +
            '<span class="confirm__branch">feat/AAVA-2841-feedback-form → develop</span>' +
            '<span class="confirm__what">Feedback page, API integration, 11 specs passing</span></div>' +
          '<div class="confirm__actions">' +
            '<button class="btn btn--primary" type="button" id="doShip">Raise both PRs</button>' +
            '<button class="btn" type="button" id="cancelShip">Not yet</button>' +
          '</div>' +
        '</div>'
      );

      Thread.aava(['Two PRs, two repos. Both linked to AAVA-2841. Confirm and I will raise them.'], $confirm);
    },

    shipped: function () {
      $('#pgState').removeClass('is-live').addClass('is-shipped');
      $('#pgStateText').text('In review');
      Store.setStatus('T1', 'done');
      TaskRail.render();
      TaskWindow.render();

      Thread.aava(['Both raised.'], $(
        '<div class="links">' +
          '<a href="#">PLAY → PR #218</a>' +
          '<a href="#">Product → PR #1043</a>' +
        '</div>'
      ), function () {
        Thread.aava(['AAVA-2841 moved to In Review. This thread is saved — reopen it from the sidebar any time.']);
      });
    },

    /* Route what Dev types to a beat */
    route: function (text) {
      var q = text.toLowerCase();

      if (/\b(pr|raise|ship|merge|approve|push)\b/.test(q)) { this.ship(); return true; }
      if (/(move|bottom|below|reorder)/.test(q))            { this.move(); return true; }
      if (/(done|not done|cover|scenario|missing|gap|assum)/.test(q)) { this.coverage(); return true; }
      if (/(run|show|output|preview|see it|live|npm)/.test(q)) { this.run(); return true; }
      return false;
    }
  };

  /* ======================================================================
     COMPOSER
     ====================================================================== */
  var Composer = {
    init: function () {
      this.$form  = $('#composer');
      this.$input = $('#prompt');
      this.$send  = $('#send');

      this.$input
        .on('input',   $.proxy(this.onInput, this))
        .on('focus',   function () { Composer.$form.addClass('is-focused'); })
        .on('blur',    function () { Composer.$form.removeClass('is-focused'); })
        .on('keydown', $.proxy(this.onKeydown, this));

      $('#thinkHarder').on('click', function () {
        var on = $(this).attr('aria-pressed') === 'true';
        $(this).attr('aria-pressed', String(!on));
      });

      this.$form.on('submit', $.proxy(this.onSubmit, this));
    },

    onInput: function () {
      var el = this.$input[0];
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
      this.$send.prop('disabled', !this.value());
    },

    onKeydown: function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.$form.trigger('submit'); }
    },

    onSubmit: function (e) {
      e.preventDefault();
      var text = this.value();
      if (!text) return;

      // Flow 1 — typing from Start moves into conversation
      if (State.current === 'home') State.go('chat');

      Thread.user(text);
      this.reset();

      if (State.isRunning() && Beats.route(text)) return;
      Thread.aava(this.reply(text));
    },

    reply: function (text) {
      var q = text.toLowerCase();

      if (State.isRunning()) {
        return ['I can run it, show you what is covered, change something, or raise the PRs. Say which.'];
      }
      if (/(why|recommend|first)/.test(q)) {
        return ['T1 is first because every dependency is resolved. T2 is waiting on two answers from the platform team, and T3 needs a maintenance window.'];
      }
      return ['One task is partly done, one is waiting on clarifications, one has not started. Pick any of them and I will take it into the playground.'];
    },

    value: function () { return $.trim(this.$input.val()); },
    reset: function () { this.$input.val('').trigger('input'); },
    focus: function () { this.$input.trigger('focus'); },
    fill:  function (t) { this.$input.val(t).trigger('input').trigger('focus'); }
  };

  /* ======================================================================
     TASK CARDS + ROWS
     ====================================================================== */
  function priorityTag(task) {
    return '<span class="tag tag--' + task.priority.toLowerCase() + '">' + task.priority + '</span>';
  }

  function depTag(task) {
    var blocked = task.dep !== 'None';
    return '<span class="tag' + (blocked ? ' tag--blocked' : '') + '">' +
           (blocked ? 'Blocked · ' + task.dep : 'No dependency') + '</span>';
  }

  var Cards = {
    render: function () {
      var $wrap = $('#homeTasks').empty();

      $.each(Store.tasks.slice(0, 3), function (_, task) {
        $wrap.append(
          $('<article class="task" tabindex="0"></article>')
            .attr('data-task', task.id)
            .toggleClass('task--recommended', !!task.recommended)
            .append(
              $('<div class="task__body"></div>')
                .append($('<h2 class="task__title"></h2>').text(task.title))
                .append(
                  $('<div class="task__foot"></div>')
                    .append(
                      $('<p class="task__meta"></p>')
                        .append('<span class="dot dot--' + task.status + '"></span>')
                        .append($('<span></span>').text(Store.labels[task.status]))
                        .append('<span class="task__sep"></span>')
                        .append($('<span class="task__est"></span>').text(task.est))
                    )
                    .append('<div class="task__tags">' + priorityTag(task) + depTag(task) + '</div>')
                )
            )
        );
      });

      $('#heroSub').text('Based on your work, I\u2019ve identified three tasks that are ready for your attention.');
    }
  };

  function taskRow(task) {
    return $('<button class="trow" type="button"></button>')
      .attr('data-task', task.id)
      .toggleClass('is-done', task.status === 'done')
      .append($('<span class="trow__title"></span>').text(task.title))
      .append(
        $('<span class="trow__meta"></span>')
          .append('<span class="dot dot--' + task.status + '"></span>')
          .append($('<span></span>').text(Store.labels[task.status]))
          .append('<span class="task__sep"></span>')
          .append($('<span></span>').text(task.priority))
      );
  }

  /* ======================================================================
     TASK RAIL
     ====================================================================== */
  var TaskRail = {
    init: function () {
      var self = this;
      $('#tasklistToggle').on('click', function () { self.collapse(true); });
      $('#tasklistStub').on('click',   function () { self.collapse(false); });
      $('#tasklistBody').on('click', '.trow', function () { Tasks.open($(this).data('task')); });
      this.render();
    },

    collapse: function (yes) {
      $('#tasklist').toggleClass('is-collapsed', yes);
      $('#tasklistToggle').attr('aria-expanded', String(!yes));
    },

    render: function () {
      var $body = $('#tasklistBody').empty();
      $.each(Store.tasks, function (_, task) { $body.append(taskRow(task)); });
      $('#stubCount').text(Store.tasks.length);
    }
  };

  /* ======================================================================
     TASK WINDOW — lean kanban
     ====================================================================== */
  var TaskWindow = {
    init: function () {
      var self = this;
      $('#tasksBtn').on('click', function () { self.open(); });
      $('#twClose, #scrim').on('click', function () { self.close(); Threads.close(); });
      $('#kanban').on('click', '.kcard', function () { Tasks.open($(this).data('task')); });
      this.render();
    },

    open: function () {
      var locked = State.isRunning();

      if (locked) {
        var task = Store.get(State.running);
        $('#twRunning').text(task ? task.title : 'the current task');
        Toast.show('One task runs at a time.');
      }

      $('#twNotice').prop('hidden', !locked);
      $('#taskwindow').toggleClass('is-locked', locked).prop('hidden', false);
      $('#scrim').prop('hidden', false);
      $('#tasksBtn').attr('aria-expanded', 'true');
      this.render();
    },

    close: function () {
      $('#taskwindow').prop('hidden', true);
      if ($('#threads').prop('hidden')) $('#scrim').prop('hidden', true);
      $('#tasksBtn').attr('aria-expanded', 'false');
    },

    isOpen: function () { return !$('#taskwindow').prop('hidden'); },

    render: function () {
      var $k = $('#kanban').empty();
      $('#twCount').text(Store.tasks.length);

      $.each(Store.columns, function (_, col) {
        var rows = $.grep(Store.tasks, function (t) { return t.status === col.key; });

        var $col = $('<div class="col"></div>').append(
          $('<div class="col__head"></div>')
            .append($('<span></span>').text(col.name))
            .append($('<span class="col__count"></span>').text(rows.length))
        );

        var $body = $('<div class="col__body"></div>');

        if (!rows.length) {
          $body.append('<div class="col__empty">Empty</div>');
        } else {
          $.each(rows, function (_, task) {
            $body.append(
              $('<button class="kcard" type="button"></button>')
                .attr('data-task', task.id)
                .toggleClass('is-running', State.running === task.id)
                .append($('<span class="kcard__title"></span>').text(task.title))
                .append('<div class="kcard__tags">' + priorityTag(task) +
                        '<span class="kcard__est">' + task.est + '</span></div>')
            );
          });
        }

        $k.append($col.append($body));
      });
    }
  };

  /* ======================================================================
     THREADS — resumable sessions
     ====================================================================== */
  var Threads = {
    init: function () {
      var self = this;
      $('#threadsBtn').on('click', function () { self.open(); });
      $('#thClose').on('click', function () { self.close(); });
      $('#threadsList').on('click', '.throw', function () {
        self.close();
        Toast.show('Resuming — memory and evidence come back with the thread.');
      });
    },

    open: function () {
      this.render();
      $('#threads').prop('hidden', false);
      $('#scrim').prop('hidden', false);
    },

    close: function () {
      $('#threads').prop('hidden', true);
      if ($('#taskwindow').prop('hidden')) $('#scrim').prop('hidden', true);
    },

    isOpen: function () { return !$('#threads').prop('hidden'); },

    add: function (kind, title) {
      Store.threads.unshift({ kind: kind, title: title, when: 'Just now' });
    },

    render: function () {
      var $list = $('#threadsList').empty();
      $.each(Store.threads, function (_, t) {
        $list.append(
          $('<button class="throw" type="button"></button>')
            .append($('<span class="throw__kind"></span>').addClass(t.kind === 'task' ? 'is-task' : '').text(t.kind))
            .append($('<span class="throw__title"></span>').text(t.title))
            .append($('<span class="throw__when"></span>').text(t.when))
        );
      });
    }
  };

  /* ======================================================================
     TASKS — pick and execute
     ====================================================================== */
  var Tasks = {
    init: function () {
      $('#homeTasks').on('click', '.task', function () { Tasks.open($(this).data('task')); });
      $('#homeTasks').on('keydown', '.task', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $(this).trigger('click'); }
      });

      // A prep line expands, and pulls its evidence into the playground
      $('#thread').on('click', '.prep__head', function () {
        $(this).closest('.prep__row').toggleClass('is-open');
      });
      $('#thread').on('click', '.prep__open', function () {
        Playground.focusEvidence($(this).closest('.prep__row').data('key'));
      });

      $('#thread').on('click', '#doShip',     function () { $(this).closest('.confirm').remove(); Beats.shipped(); });
      $('#thread').on('click', '#cancelShip', function () { $(this).closest('.confirm').remove(); });
    },

    open: function (id) {
      if (State.isRunning()) {
        Toast.show('One task runs at a time. Close the playground to start another.');
        return;
      }

      var task = Store.get(id);
      if (!task) return;

      TaskWindow.close();
      Threads.add('task', task.id + ' · ' + task.title);

      if (task.status !== 'done') Store.setStatus(id, 'wip');
      TaskRail.render();

      Thread.user('Let\u2019s work on: ' + task.title);
      State.go('execute', task);

      // T1 is the modelled scenario. Others get the shell only.
      if (id === 'T1') {
        Beats.prep();
      } else {
        Thread.aava(['I have not done the pre-work for this one yet. T1 is the modelled scenario in this prototype.']);
      }
    }
  };

  /* ======================================================================
     AMBIENT
     ====================================================================== */
  var Ambient = {
    DEPTH: { navy: 22, violet: -16 },

    init: function () {
      if (REDUCED) return;
      this.$navy = $('.ambient__navy');
      this.$violet = $('.ambient__violet');
      this.frame = null;
      $(document).on('mousemove', $.proxy(this.onMove, this));
    },

    onMove: function (e) {
      if (this.frame) return;
      var x = (e.clientX / window.innerWidth) - 0.5;
      var y = (e.clientY / window.innerHeight) - 0.5;
      var self = this;

      this.frame = window.requestAnimationFrame(function () {
        self.$navy.css('margin',   (y * self.DEPTH.navy)   + 'px ' + (x * self.DEPTH.navy)   + 'px');
        self.$violet.css('margin', (y * self.DEPTH.violet) + 'px ' + (x * self.DEPTH.violet) + 'px');
        self.frame = null;
      });
    }
  };

  /* ======================================================================
     BOOT
     ====================================================================== */
  $(function () {
    Thread.init();
    Cards.render();
    Composer.init();
    Tasks.init();
    TaskRail.init();
    TaskWindow.init();
    Threads.init();
    Playground.init();
    Ambient.init();

    $('#home, #brandHome').on('click', function (e) {
      e.preventDefault();
      TaskWindow.close();
      Threads.close();
      State.go('home');
    });

    $(document).on('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if ($('.lightbox').length)  { $('.lightbox').remove(); return; }
      if (Threads.isOpen())       { Threads.close(); return; }
      if (TaskWindow.isOpen())    { TaskWindow.close(); return; }
      if (State.isRunning())      { State.go('chat'); }
    });
  });

})(jQuery);
