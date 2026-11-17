import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
/* Branch feat/lowfi-cli renders AAVA as a CLI (`aava` in a terminal window).
   The web app (App.tsx) is untouched and still builds; it is just not mounted. */
import CliApp from './cli/CliApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode><CliApp /></StrictMode>,
)
