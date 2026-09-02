/* "Files in this session" for a scenario run — the code files the work touched.
 *
 * The same right-panel slot and shape as the backlog flow's FilesPanel, but the
 * entries are the scenario's changed source files (under their repo root).
 * Selecting one opens it in the workspace editor. The Watch zone docks beneath,
 * so it reads as part of the canvas, not a modal over it.
 */
import { WatchBar } from '../../zones/WatchBar'
import type { WatchEntry } from '../../state/types'

export function ScenarioFiles({ files, root, watch, activeFile, onOpen, onCollapse }: {
  files: string[]
  root?: string
  watch: WatchEntry[]
  activeFile?: string | null
  onOpen: (name: string) => void
  onCollapse: () => void
}) {
  const ext = (n: string) => n.split('.').pop()?.toUpperCase() ?? 'FILE'
  return (
    <section aria-label="Canvas — session files" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="m-[12px] mb-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[var(--r-md)]"
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)', borderBottom: 'none' }}>
        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          <span className="grid h-6 w-6 place-items-center rounded-[7px]" style={{ background: 'var(--brand)', color: '#fff' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" /><path d="M14 3v4h4" /><circle cx="16.5" cy="15.5" r="2.6" /><path d="m20 19-1.6-1.6" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>Files in this session</div>
            <div className="text-[11px]" style={{ color: 'var(--muted-deep)' }}>{files.length} file{files.length === 1 ? '' : 's'} changed</div>
          </div>
          <button onClick={onCollapse} aria-label="Close" title="Close"
            className="press grid h-8 w-8 place-items-center rounded-[8px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-2.5 py-2">
          {files.length === 0 ? (
            <p className="px-3 py-12 text-center text-[13px]" style={{ color: 'var(--muted)' }}>No files changed in this session.</p>
          ) : (
            <>
              {root && (
                <div className="mono px-3 pb-1 pt-1.5 text-[11px]" style={{ color: 'var(--muted-deep)' }}>{root}/</div>
              )}
              {files.map((name) => {
                const active = name === activeFile
                return (
                  <button key={name} onClick={() => onOpen(name)} aria-current={active}
                    className="press flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-[var(--wash-3)]"
                    style={active ? { background: 'var(--wash-3)' } : undefined}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px]"
                      style={{ background: active ? 'var(--brand)' : 'var(--wash-2)', color: active ? '#fff' : 'var(--muted)', border: active ? 'none' : '1px solid var(--glass-line-soft)' }}>
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 13h6M9 16.5h4" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mono block truncate text-[13px] font-medium" style={{ color: 'var(--text)' }}>{name}</span>
                      <span className="block text-[11px]" style={{ color: 'var(--muted)' }}>{ext(name)} · edited today</span>
                    </span>
                    {active
                      ? <span className="shrink-0 text-[11px] font-medium" style={{ color: 'var(--brand)' }}>Open</span>
                      : <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ color: 'var(--muted-deep)' }}><path d="M9 6l6 6-6 6" /></svg>}
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>

      <div className="mx-[12px] mb-[12px] overflow-hidden rounded-b-[var(--r-md)]" style={{ border: '1px solid var(--glass-line-soft)', borderTop: 'none' }}>
        <WatchBar entries={watch} />
      </div>
    </section>
  )
}
