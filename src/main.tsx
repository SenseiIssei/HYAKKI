import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './styles-figures.css'

// Dev-only inspection handle. The sim lives outside React, so without this
// there is no way to see its state from a console.
if (import.meta.env.DEV) {
  void import('./store/gameStore').then((m) => {
    ;(window as unknown as Record<string, unknown>).__myriad = m
  })
}

/**
 * On the desktop the save file is primed into place BEFORE the store module is
 * imported — the store reads storage at module scope, so this has to happen
 * first or the file is ignored on the very run that matters.
 */
async function start() {
  const { isDesktop, primeDesktopSave } = await import('./save/desktop').then(async (d) => ({
    isDesktop: d.isDesktop,
    primeDesktopSave: (await import('./save/storage')).primeDesktopSave,
  }))
  if (isDesktop()) {
    document.documentElement.classList.add('desktop')
    await primeDesktopSave()
  }
  const { App } = await import('./ui/App')
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

void start()
