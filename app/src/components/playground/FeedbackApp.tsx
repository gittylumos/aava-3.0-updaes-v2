import { useState } from 'react'
import type { PlaygroundState, Scenario } from '../../state/types'

/* The template the preview is currently running: the user's edit if there is
   one, the scripted version otherwise. Both the workspace tab and the card in
   the conversation read it, so they can never drift apart. */
export function previewTemplate(scenario: Scenario, pg: PlaygroundState): string {
  const file = scenario.fileOrder.find((f) => f.endsWith('.html')) ?? scenario.fileOrder[0]
  const scripted = scenario.files[file].versions[pg.fileVersions[file] ?? 0]
  return (pg.edits[file] ?? scripted).replaceAll('@@', '')
}

/* What the preview takes from the template. The editor is live, so the running
   app has to answer to the file rather than to a hardcoded variant — edit the
   heading or move the submit button and the preview follows.

   ponytail: regex, not a parser. It reads the four things this template can
   actually change; anything else in the file is ignored rather than
   mis-rendered. Swap in a real HTML parse if the preview ever has to render
   arbitrary markup. */
export function readTemplate(html: string) {
  const submitAt = html.search(/<play-button/)
  const fieldAt = html.search(/<play-form-field|<play-rating-scale/)
  const label = (tag: string) => html.match(new RegExp(`<${tag}[^>]*label="([^"]*)"`))?.[1]

  return {
    heading: html.match(/<h[1-3][^>]*>([^<]*)<\/h[1-3]>/)?.[1]?.trim() || 'How was your experience?',
    subtitle: html.match(/<p[^>]*>([^<]*)<\/p>/)?.[1]?.trim()
      || 'Your feedback goes straight to the product team.',
    hasRating: /<play-rating-scale/.test(html),
    ratingLabel: label('play-rating-scale') || 'Rating',
    hasComment: /<textarea/.test(html),
    commentLabel: label('play-form-field') || 'Comment',
    hasCounter: /<play-character-counter/.test(html),
    hasSubmit: submitAt !== -1,
    submitLabel: html.match(/<play-button[^>]*>([^<]*)<\/play-button>/)?.[1]?.trim() || 'Submit',
    submitBelow: submitAt === -1 || fieldAt === -1 ? true : submitAt > fieldAt,
    maxLength: Number(html.match(/maxlength="(\d+)"/)?.[1] ?? 500),
  }
}

/** The mock app inside the preview. Genuinely interactive — this is the point of the beat. */
export function FeedbackApp({ template, onToast }: {
  template: ReturnType<typeof readTemplate>
  onToast: (t: string) => void
}) {
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div className="grid h-full place-items-center p-8 text-center text-[13px]" style={{ color: 'var(--ok)' }}>
        Thanks — your feedback was submitted.<br />
       {/* <span style={{ color: 'var(--muted-deep)' }}>(Stubbed response, not the live endpoint.)</span>*/}
      </div>
    )
  }

  const submit = (
    <button
      onClick={() => {
        // Only require what the template still has on the page.
        if ((template.hasRating && rating === null) || (template.hasComment && !comment.trim())) {
          onToast('Rating and comment are both required — that is one of the assumptions.')
          return
        }
        setSent(true)
      }}
      /* Quiet, not loud. A solid near-white fill made the mock's submit the
         brightest thing in the panel, and this is a preview of someone else's
         app — it should not out-shout the workspace around it. Same tonal
         treatment as the rating pips. */
      className="rounded-[var(--r-sm)] px-4 py-2 text-[13px]"
      style={{ background: 'var(--wash-3)', color: 'var(--text-dim)', border: '1px solid var(--glass-line)' }}
    >
      {template.submitLabel}
    </button>
  )

  return (
    <div className="grid gap-3 p-5">
      <h3 className="text-[15px] font-semibold">{template.heading}</h3>
      <p className="text-[12px]" style={{ color: 'var(--muted-deep)' }}>{template.subtitle}</p>

      {template.hasSubmit && !template.submitBelow && <div>{submit}</div>}

      {template.hasRating && (
        <div>
          <label className="mb-1.5 block text-[11px]" style={{ color: 'var(--muted)' }}>
            {template.ratingLabel}
          </label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}
                className="press hit rounded-[var(--r-sm)] text-[12px]"
                style={{
                  background: rating === n ? 'var(--aurora-2)' : 'var(--wash-3)',
                  color: rating === n ? '#14121F' : 'var(--text-dim)',
                  border: '1px solid var(--glass-line)',
                }}>{n}</button>
            ))}
          </div>
        </div>
      )}

      {template.hasComment && (
        <div>
          <label className="mb-1.5 block text-[11px]" style={{ color: 'var(--muted)' }}>
            {template.commentLabel}
          </label>
          <textarea rows={3} maxLength={template.maxLength} value={comment} onChange={(e) => setComment(e.target.value)}
            className="w-full resize-none rounded-[var(--r-sm)] p-2 text-[13px]"
            style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line)' }} />
          {template.hasCounter && (
            <div className="mono mt-1 text-right text-[11px]" style={{ color: 'var(--muted-deep)' }}>
              {comment.length} / {template.maxLength}
            </div>
          )}
        </div>
      )}

      {template.hasSubmit && template.submitBelow && <div>{submit}</div>}
    </div>
  )
}
