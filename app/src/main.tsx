import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
/* Branch feat/lowfi-ide: the page is the IDE-surface demo (VS Code + AAVA
   extension). The web app (App.tsx) is untouched and still in the tree. */
import IdeApp from './ide/IdeApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode><IdeApp /></StrictMode>,
)
