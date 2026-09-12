/* The Interaction Library's own entry point — a second, independent React
   root (see interaction.html), completely decoupled from App.tsx/useJourney/
   the reducer. It reuses AAVA's real index.css (tokens, fonts, Tailwind) so
   every preview here inherits the product's actual design tokens, but it is
   never wired into the product's own single-screen state machine. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { InteractionLibrary } from './interactions/InteractionLibrary'

createRoot(document.getElementById('interaction-root')!).render(
  <StrictMode><InteractionLibrary /></StrictMode>,
)
