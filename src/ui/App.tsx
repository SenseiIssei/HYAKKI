import { useEffect } from 'react'
import { useGameLoop } from '../loop/useGameLoop'
import { CLASS_BY_ID } from '../content/classes'
import {
  chooseClass,
  game,
  ordersUnlocked,
  reveal,
  saveNow,
  soundReveille,
  useUI,
} from '../store/gameStore'
import { Orders } from './Orders'
import { Report } from './Report'
import { fmtInt } from '../format'
import { Autopsy, ReveilleButton } from './Autopsy'
import { Column, LogStrip } from './Column'
import { Lower } from './Lower'
import { Opening } from './Opening'
import { Settings } from './Settings'
import { Tree } from './Tree'
import { Relics } from './Relics'

/** The loop only mounts once a class is chosen, so the sim never runs behind
 *  the opening screen. */
function Loop() {
  useGameLoop()
  return null
}

export function App() {
  // Every 10Hz frame bumps this; the whole tree re-renders and that is fine —
  // it is a few dozen nodes. docs/11-ARCHITECTURE.md § Performance budget
  useUI((s) => s.frame)
  const g = game()
  const settingsOpen = useUI((s) => s.settingsOpen)
  const setSettings = useUI((s) => s.setSettings)
  const treeOpen = useUI((s) => s.treeOpen)
  const setTree = useUI((s) => s.setTree)
  const relicsOpen = useUI((s) => s.relicsOpen)
  const setRelics = useUI((s) => s.setRelics)
  const pickerOpen = useUI((s) => s.pickerOpen)
  const setPicker = useUI((s) => s.setPicker)
  const ordersOpen = useUI((s) => s.ordersOpen)
  const setOrdersOpen = useUI((s) => s.setOrders)
  const report = useUI((s) => s.report)
  const fontScale = useUI((s) => s.fontScale)

  // The Ash layer reveals itself the first time you die, not before.
  useEffect(() => {
    if (g.dead || g.reveilles > 0) reveal('ash')
  })

  // Every drawer reachable from the keyboard; Esc always closes.
  useEffect(() => {
    const ui = useUI.getState()
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'Escape') {
        ui.setTree(false)
        ui.setRelics(false)
        ui.setOrders(false)
        ui.setPicker(false)
        ui.setSettings(false)
        return
      }
      const map: Record<string, () => void> = {
        '1': () => ui.setTree(true),
        '2': () => ui.setRelics(true),
        '3': () => ui.setOrders(true),
        '4': () => ui.setSettings(true),
      }
      map[e.key]?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Font scale is applied at the document root so every rem-based size follows.
  useEffect(() => {
    document.documentElement.style.fontSize = `${(fontScale / 100) * 15}px`
  }, [fontScale])

  const chosen = !!g.seen.classChosen
  const cls = CLASS_BY_ID[g.classId]

  const progress = {
    totalDeaths: g.totalDeaths,
    reveilles: g.reveilles,
    totalKills: g.totalKills,
  }

  if (!chosen) {
    return (
      <>
        <div className="drift" />
        <Opening
          seed={g.soldierSeed}
          progress={progress}
          onChoose={(id) => {
            chooseClass(id)
            reveal('classChosen')
            saveNow()
          }}
        />
        <div className="grain" />
        <div className="vignette" />
      </>
    )
  }

  return (
    <>
      <div className="drift" />
      <div className="app">
        <header className="topbar">
          <span className="wordmark">Myriad</span>
          <span className="topbar-right">
            <span>
              #{fmtInt(g.soldierNumber)} · {cls.name}
            </span>
            <button
              className="icon-btn"
              aria-label="Settings"
              onClick={() => setSettings(true)}
            >
              ☰
            </button>
          </span>
        </header>

        <Column />
        <Lower />
        {g.seen.ash && (
          <div className="actionbar">
            <button className="small-btn" onClick={() => setTree(true)}>
              The Tree
              {g.ash.gte(8) && <span className="dot" />}
            </button>
            <button className="small-btn" onClick={() => setOrdersOpen(true)}>
              Orders
              {ordersUnlocked() && !g.orders.enabled && <span className="dot" />}
            </button>
            {(g.inventory.length > 0 || g.equipped.some(Boolean)) && (
              <button className="small-btn" onClick={() => setRelics(true)}>
                Carried {g.inventory.length > 0 && <span className="dot" />}
              </button>
            )}
            <ReveilleButton />
          </div>
        )}
        <LogStrip />
      </div>

      <Loop />
      {/* The report comes before anything else — it is the first thing you
          came back for. */}
      {report && <Report report={report} />}
      {!report && g.dead && <Autopsy />}
      {treeOpen && <Tree />}
      {relicsOpen && <Relics />}
      {ordersOpen && <Orders />}
      {pickerOpen && (
        <Opening
          seed={g.soldierSeed}
          progress={progress}
          title="You wake at the Mouth."
          prompt="Choose what you are this time"
          onCancel={() => setPicker(false)}
          onChoose={(id) => {
            setPicker(false)
            soundReveille(id)
          }}
        />
      )}
      {settingsOpen && <Settings />}

      <div className="grain" />
      <div className="vignette" />
    </>
  )
}
