import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

/* One build, three surfaces, chosen by the first path segment:
     /lowfi-ide  → AAVA as a VS Code extension   (src/ide)
     /lowfi-cli  → AAVA as a CLI                  (src/cli)
     anything else (/, /lowfi, …) → the web app   (src/App.tsx)
   Each surface is code-split, so a visitor only downloads the one they open.
   Hosting rewrites every path to index.html (app/vercel.json). */
const Web = lazy(() => import('./App'))
const Ide = lazy(() => import('./ide/IdeApp'))
const Cli = lazy(() => import('./cli/CliApp'))

export function surfaceFor(pathname: string) {
  const seg = pathname.replace(/^\/+/, '').split('/')[0].toLowerCase()
  if (seg === 'lowfi-ide') return Ide
  if (seg === 'lowfi-cli') return Cli
  return Web
}

const Surface = surfaceFor(window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}><Surface /></Suspense>
  </StrictMode>,
)
