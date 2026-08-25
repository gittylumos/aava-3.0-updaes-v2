import Editor from '@monaco-editor/react'
import type { PlaygroundState, Scenario } from '../../state/types'
import { IconFolder } from '../chrome/icons'
import '../../monaco'

const LANG: Record<string, string> = { html: 'html', ts: 'typescript', scss: 'scss', json: 'json' }

/** The editor is real: what you type here is what the preview renders. */
export function Code({ scenario, pg, theme, onFile, onEdit }: {
  scenario: Scenario
  pg: PlaygroundState
  theme: 'dark' | 'light'
  onFile: (f: string) => void
  onEdit: (file: string, text: string) => void
}) {
  /* A file link can name something the scenario does not ship — a spec file the
     Validator reports on, say. Fall back rather than index into undefined. */
  const active = pg.activeFile && scenario.files[pg.activeFile]
    ? pg.activeFile
    : scenario.fileOrder[0]
  const version = pg.fileVersions[active] ?? 0
  /* `@@` marks the changed lines in the scripted version for the diff view;
     the editor shows the file itself, not the annotation. */
  const scripted = scenario.files[active].versions[version].replaceAll('@@', '')
  const value = pg.edits[active] ?? scripted
  const dirty = pg.edits[active] !== undefined && pg.edits[active] !== scripted
  const folders = scenario.fileRoot?.split('/').filter(Boolean) ?? []

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-[var(--r-sm)]"
      style={{ border: '1px solid var(--glass-line-soft)' }}>
      {/* Explorer. The files sit where the repo actually keeps them — the prep
          step already told the user that path, so the tree has to agree. */}
      <aside className="w-[180px] shrink-0 overflow-y-auto py-2"
        style={{ borderRight: '1px solid var(--glass-line-soft)', background: 'var(--wash-2)' }}>
        <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[.12em]"
          style={{ color: 'var(--muted-deep)' }}>Explorer</p>

        {folders.map((name, depth) => (
          <div key={name} className="flex items-center gap-1.5 py-1 pr-2 text-[12px]"
            style={{ paddingLeft: 10 + depth * 12, color: 'var(--muted)' }}>
            <IconFolder size={13} />
            <span className="truncate">{name}</span>
          </div>
        ))}

        {scenario.fileOrder.map((f) => {
          const on = f === active
          const touched = (pg.fileVersions[f] ?? 0) > 0 || pg.edits[f] !== undefined
          return (
            <button key={f} onClick={() => onFile(f)}
              className="mono flex w-full items-center gap-1.5 py-1 pr-2 text-left text-[11.5px] transition-colors hover:bg-[var(--wash-3)]"
              style={{
                paddingLeft: 10 + folders.length * 12,
                background: on ? 'var(--wash-4)' : 'transparent',
                color: on ? 'var(--text)' : 'var(--muted-deep)',
              }}>
              <span className="truncate">{f}</span>
              {touched && <span className="shrink-0" style={{ color: 'var(--aurora-2)' }}>●</span>}
            </button>
          )
        })}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 px-3 py-1.5"
          style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
          <span className="mono truncate text-[11.5px]" style={{ color: 'var(--text-dim)' }}>{active}</span>
          {dirty && (
            <button
              onClick={() => onEdit(active, scripted)}
              className="mono ml-auto rounded-[var(--r-sm)] px-2 py-1 text-[10.5px] transition-colors hover:bg-[var(--wash-3)]"
              style={{ color: 'var(--muted)' }}
            >
              Revert
            </button>
          )}
        </div>

        {/* min-h-0 + flex-1: Monaco measures its container, and an auto-height
            parent measures Monaco. One of the two has to commit to a size. */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <Editor
            height="100%"
            path={active}
            language={LANG[active.split('.').pop() ?? ''] ?? 'plaintext'}
            value={value}
            theme={theme === 'dark' ? 'vs-dark' : 'vs'}
            onChange={(text) => onEdit(active, text ?? '')}
            loading={<span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>Loading editor…</span>}
            options={{
              fontSize: 12,
              lineHeight: 20,
              fontFamily: 'var(--font-mono, ui-monospace)',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              renderLineHighlight: 'none',
              padding: { top: 10, bottom: 10 },
              tabSize: 2,
              automaticLayout: true,
            }}
          />
        </div>
      </div>
    </div>
  )
}
