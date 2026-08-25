import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'

/* Monaco bundled, not fetched. The default loader pulls the editor off a CDN at
   runtime, and this prototype gets demoed in rooms with no network worth
   trusting — a code window that fails to load is not a demo.
   monaco-editor ≥0.53 wires its own language workers through import.meta.url,
   so the bundler finds them without a MonacoEnvironment shim. */
loader.config({ monaco })
