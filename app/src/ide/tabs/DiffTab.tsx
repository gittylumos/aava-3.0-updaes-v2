/* The native diff editor, original ↔ proposed (web: the Diff tab). The editor
   toolbar carries Accept all / Reject all the way VS Code's does; the real
   approval stays at the gate in the AAVA panel. */
import type { ReactNode } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import type { useJourney } from '../../state/useJourney'
import type { Scenario } from '../../state/types'
import { fileText } from '../../state/workspace'
import { languageOf } from './lang'
import { originalOf } from './diffData'
import '../../monaco'

export function DiffTab({ j, scenario, file }: {
  j: ReturnType<typeof useJourney>
  scenario: Scenario
  file: string
}) {
  if (!scenario.files[file]) {
    return <p className="px-4 py-6 text-[12px]" style={{ color: 'var(--muted)' }}>{file} has no changes.</p>
  }
  const modified = fileText(scenario, j.state.playground, file)
  const original = originalOf(scenario, file, modified)
  const path = [scenario.fileRoot, file].filter(Boolean).join('/')
  const gateNote = 'The changes stay staged — approve or reject them at the gate in the AAVA panel.'

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: 'var(--slab)' }}>
      <div className="flex h-[30px] shrink-0 items-center gap-2 px-3"
        style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
        <span className="mono min-w-0 truncate text-[11px]" style={{ color: 'var(--muted)' }}>
          {original ? path : `${path} (new file)`}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <ToolbarBtn onClick={() => j.toast(`Accept all · ${gateNote}`)}>Accept all</ToolbarBtn>
          <ToolbarBtn onClick={() => j.toast(`Reject all · ${gateNote}`)}>Reject all</ToolbarBtn>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <DiffEditor
          /* Stable model paths; keeping the models avoids monaco's
             "TextModel got disposed" error when the tab unmounts. */
          keepCurrentOriginalModel
          keepCurrentModifiedModel
          height="100%"
          original={original}
          modified={modified}
          originalModelPath={`aava-original/${file}`}
          modifiedModelPath={`aava-proposed/${file}`}
          language={languageOf(file)}
          theme="vs"
          loading={<span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>Loading diff…</span>}
          options={{
            renderSideBySide: true,
            readOnly: true,
            originalEditable: false,
            fontSize: 12,
            lineHeight: 19,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            renderOverviewRuler: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}

function ToolbarBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="h-[22px] rounded-[3px] px-2 text-[11.5px] transition-colors hover:bg-[var(--wash-3)]"
      style={{ color: 'var(--text-dim)', border: '1px solid var(--glass-line)' }}>
      {children}
    </button>
  )
}
