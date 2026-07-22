import { isDesktop, winDrag, winMaximize, winMinimize, winQuit } from '../save/desktop'

/**
 * A slim window bar for screens that have no topbar of their own — the menu,
 * chiefly. Without it there is nowhere on the front screen to minimise, drag,
 * or close the window. Desktop only; in the browser the real chrome does it.
 */
export function WindowBar() {
  if (!isDesktop()) return null
  return (
    <div className="winbar" onMouseDown={(e) => e.target === e.currentTarget && winDrag()}>
      <span className="winbar-drag" onMouseDown={winDrag} aria-hidden="true" />
      <span className="win-controls">
        <button className="win-btn" aria-label="Minimise" title="Minimise" onClick={winMinimize}>
          ─
        </button>
        <button className="win-btn" aria-label="Maximise" title="Maximise" onClick={winMaximize}>
          □
        </button>
        <button className="win-btn close" aria-label="Close" title="Quit" onClick={winQuit}>
          ✕
        </button>
      </span>
    </div>
  )
}
