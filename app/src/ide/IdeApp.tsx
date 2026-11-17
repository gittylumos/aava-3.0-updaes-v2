/* The IDE-surface demo: VS Code with the AAVA extension, AAVA panel on the
   right (secondary sidebar). Same journey engine as the web app; only the
   placement changes. Integration file — owned by the controller. */
import { useState } from 'react'
import { useJourney } from '../state/useJourney'
import { Composer, MODELS, type Connector, type Effort } from '../components/chrome/Composer'
import { TooltipProvider } from '../components/chrome/Tooltip'
import { FeedbackApp, previewTemplate, readTemplate } from '../components/playground/FeedbackApp'
import { VsCodeShell } from './VsCodeShell'
import { Explorer } from './Explorer'
import { EditorGroup } from './EditorGroup'
import { TerminalPanel } from './TerminalPanel'
import { useWorkbench } from './useWorkbench'
import { AavaPanel } from './AavaPanel'
import { NoticeStack, useGateNotices } from './IdeNotifications'
import { AavaStatusItem, StatusLeft } from './StatusBarItems'

export default function IdeApp() {
  const j = useJourney()
  const wb = useWorkbench(j)
  const [auxOpen, setAuxOpen] = useState(true)

  /* Composer state — same reasoning as App.tsx: it survives remounts. */
  const [draft, setDraft] = useState('')
  const [model, setModel] = useState<string>(MODELS[0])
  const [effort, setEffort] = useState<Effort>('High')
  const [files, setFiles] = useState<string[]>([])
  const [connectors, setConnectors] = useState<Connector[]>([
    { id: 'jira', name: 'Jira', hue: '#2684FF', on: true },
    { id: 'github', name: 'GitHub', hue: '#8B949E', on: true },
    { id: 'figma', name: 'Figma', hue: '#F24E1E', on: false },
  ])
  const composer = (
    <Composer
      onSend={(text) => { j.send(text); setFiles([]) }}
      value={draft} onChange={setDraft} joined={false}
      model={model} onModel={setModel}
      effort={effort} onEffort={setEffort}
      connectors={connectors}
      onToggleConnector={(id) => setConnectors((cs) => cs.map((c) => (c.id === id ? { ...c, on: !c.on } : c)))}
      files={files}
      onAddFiles={(names) => setFiles((f) => [...new Set([...f, ...names])])}
      onRemoveFile={(name) => setFiles((f) => f.filter((x) => x !== name))}
      busy={j.busy} onStop={j.stop}
    />
  )

  const taskProgress = j.scenario
    ? { steps: j.scenario.prep, at: j.state.playground.prepAt, waiting: !!j.scenario.prep[j.state.playground.prepAt]?.gate }
    : null
  const preview = j.scenario
    ? <FeedbackApp template={readTemplate(previewTemplate(j.scenario, j.state.playground))} onToast={() => {}} />
    : null
  const asked = new Set(j.state.messages.filter((m) => m.from === 'user').map((m) => m.lines.join(' ')))
  const stageChips = j.scenario && j.state.chipStage ? j.scenario.chips[j.state.chipStage] ?? [] : []
  const chips = j.state.pendingTopic
    ? [{ label: 'Start a new thread', sends: 'alright' }]
    : stageChips.filter((c) => !asked.has(c.sends))

  const gate = useGateNotices(j, () => setAuxOpen(true))

  return (
    <TooltipProvider delayDuration={320} skipDelayDuration={140}>
      <VsCodeShell
        title={j.scenario ? 'product-web — Visual Studio Code' : 'product-web — Visual Studio Code'}
        activityBadge={j.unreadCount}
        auxOpen={auxOpen}
        onAavaActivity={() => setAuxOpen((o) => !o)}
        explorer={<Explorer scenario={j.scenario} onOpenFile={wb.openFile} />}
        editor={<EditorGroup wb={wb} />}
        panel={wb.panelOpen ? <TerminalPanel wb={wb} /> : null}
        aux={
          <AavaPanel
            j={j}
            composer={composer}
            chips={chips}
            taskProgress={taskProgress}
            preview={preview}
            onOpenFile={wb.openFile}
            onOpenTab={wb.openCanvasTab}
          />
        }
        statusLeft={<StatusLeft j={j} />}
        statusRight={<AavaStatusItem j={j} taskProgress={taskProgress} onClick={() => setAuxOpen(true)} />}
      />
      <NoticeStack notices={gate.notices} onDismiss={gate.dismiss} />
    </TooltipProvider>
  )
}
