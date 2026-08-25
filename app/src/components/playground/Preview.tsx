import { FeedbackApp, readTemplate } from './FeedbackApp'

/* The running app, straight away. No build log and no progress bar: the work
   was done before the user sat down, so the first thing they see is the thing
   itself. */
export function Preview({ template, onToast }: {
  template: string
  onToast: (t: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-[var(--r-sm)]" style={{ border: '1px solid var(--glass-line-soft)' }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'var(--wash-2)' }}>
        <span className="flex gap-1.5" aria-hidden="true">
          {['#FF6B6B', '#FBBF24', '#4ADE80'].map((c) => (
            <i key={c} className="h-2 w-2 rounded-full" style={{ background: c, display: 'block' }} />
          ))}
        </span>
        <span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>localhost:4200</span>
      </div>
      <div style={{ background: 'var(--preview-bg)' }}>
        <FeedbackApp template={readTemplate(template)} onToast={onToast} />
      </div>
    </div>
  )
}
