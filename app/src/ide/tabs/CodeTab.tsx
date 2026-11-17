/* A source file in a normal editor tab (web: the Code tab). The text resolves
   exactly like the web editor: the user's edit if there is one, the scripted
   version otherwise — so the Integrated Browser follows what is typed here. */
import Editor from '@monaco-editor/react'
import type { useJourney } from '../../state/useJourney'
import type { Scenario } from '../../state/types'
import { fileText } from '../../state/workspace'
import { crumbsOf, languageOf } from './lang'
import '../../monaco'

export function CodeTab({ j, scenario, file }: {
  j: ReturnType<typeof useJourney>
  scenario: Scenario
  file: string
}) {
  const shipped = !!scenario.files[file]
  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: 'var(--slab)' }}>
      <Breadcrumbs parts={crumbsOf(scenario.fileRoot, file)} />
      {shipped ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <Editor
            height="100%"
            path={file}
            language={languageOf(file)}
            value={fileText(scenario, j.state.playground, file)}
            theme="vs"
            onChange={(text) => j.editFile(file, text ?? '')}
            loading={<span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>Loading editor…</span>}
            options={{
              readOnly: false,
              fontSize: 12,
              lineHeight: 19,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              renderLineHighlight: 'none',
              padding: { top: 6, bottom: 6 },
              tabSize: 2,
              automaticLayout: true,
            }}
          />
        </div>
      ) : (
        <p className="px-4 py-6 text-[12px]" style={{ color: 'var(--muted)' }}>
          {file} is not in this change set.
        </p>
      )}
    </div>
  )
}

export function Breadcrumbs({ parts }: { parts: string[] }) {
  return (
    <div className="mono flex h-[22px] shrink-0 items-center gap-1 overflow-hidden whitespace-nowrap px-3 text-[11px]"
      style={{ color: 'var(--muted)', borderBottom: '1px solid var(--glass-line-soft)' }}>
      {parts.map((p, i) => (
        <span key={`${p}-${i}`} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden style={{ color: 'var(--muted-deep)' }}>›</span>}
          <span style={{ color: i === parts.length - 1 ? 'var(--text-dim)' : undefined }}>{p}</span>
        </span>
      ))}
    </div>
  )
}
