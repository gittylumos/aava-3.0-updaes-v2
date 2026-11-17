import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

/* One build, three surfaces, chosen by the first path segment:
     /ide  → AAVA as a VS Code extension   (src/ide)
     /cli  → AAVA as a CLI                  (src/cli)
     anything else (/, …) → the web app     (src/App.tsx)
   Each surface is code-split, so a visitor only downloads the one they open.
   Hosting rewrites every path to index.html (app/vercel.json). */
const Web = lazy(() => import('./App'))
const Ide = lazy(() => import('./ide/IdeApp'))
const Cli = lazy(() => import('./cli/CliApp'))

export function surfaceFor(pathname: string) {
  const seg = pathname.replace(/^\/+/, '').split('/')[0].toLowerCase()
  if (seg === 'ide') return Ide
  if (seg === 'cli') return Cli
  return Web
}

const Surface = surfaceFor(window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}><Surface /></Suspense>
  </StrictMode>,
)
