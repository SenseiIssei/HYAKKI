import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import './styles.css'

// Dev-only inspection handle. The sim lives outside React, so without this
// there is no way to see its state from a console.
if (import.meta.env.DEV) {
  void import('./store/gameStore').then((m) => {
    ;(window as unknown as Record<string, unknown>).__myriad = m
  })
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
