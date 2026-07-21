import { useEffect } from 'react'
import { setAudioEnabled, setVolume, startAudio } from '../audio/engine'
import { useGameLoop } from '../loop/useGameLoop'
import { CLASS_BY_ID } from '../content/classes'
import {
  chooseClass,
  ascendReady,
  game,
  intermentReady,
  keysHeld,
  ordersUnlocked,
  readyDescents,
  reveal,
  saveNow,
  soundReveille,
  useUI,
} from '../store/gameStore'
import { Bargain } from './Bargain'
import { Ascend } from './Ascend'
import { Ledger } from './Ledger'
import { Descend, DescentReport } from './Descend'
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
  const bargainOpen = useUI((s) => s.bargainOpen)
  const setBargain = useUI((s) => s.setBargain)
  const descendOpen = useUI((s) => s.descendOpen)
  const setDescend = useUI((s) => s.setDescend)
  const ascendOpen = useUI((s) => s.ascendOpen)
  const setAscend = useUI((s) => s.setAscend)
  const ledgerOpen = useUI((s) => s.ledgerOpen)
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
        ui.setBargain(false)
        ui.setDescend(false)
        ui.setAscend(false)
        ui.setLedger(false)
        return
      }
      const map: Record<string, () => void> = {
        '1': () => ui.setTree(true),
        '2': () => ui.setRelics(true),
        '3': () => ui.setOrders(true),
        '4': () => ui.setBargain(true),
        '5': () => ui.setDescend(true),
        '6': () => ui.setAscend(true),
        '7': () => ui.setSettings(true),
      }
      map[e.key]?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Browsers will not start audio without a gesture, so the first one anywhere
  // in the page unlocks it — if the player has asked for sound at all.
  useEffect(() => {
    const unlock = () => {
      if (useUI.getState().audioOn) {
        startAudio()
        setAudioEnabled(true)
        setVolume(useUI.getState().audioVolume / 100)
      }
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
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
            {(g.reveilles >= 10 || g.interments > 0 || g.names > 0) && (
              <button className="small-btn" onClick={() => setBargain(true)}>
                The Bargain
                {(intermentReady() || g.names > 0) && <span className="dot" />}
              </button>
            )}
            {g.interments > 0 && (
              <button className="small-btn" onClick={() => setDescend(true)}>
                Descend
                {(keysHeld() >= 1 || readyDescents().length > 0) && <span className="dot" />}
              </button>
            )}
            {(g.interments >= 1 || g.apotheoses > 0 || g.fragments.length > 0) && (
              <button className="small-btn" onClick={() => setAscend(true)}>
                Apotheosis
                {(ascendReady() || g.ichor > 0) && <span className="dot" />}
              </button>
            )}
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
      {bargainOpen && <Bargain />}
      {descendOpen && <Descend />}
      {ascendOpen && <Ascend />}
      {ledgerOpen && <Ledger />}
      {/* A finished Descent announces itself rather than waiting to be noticed. */}
      {!report && !descendOpen && readyDescents()[0] && (
        <DescentReport id={readyDescents()[0].id} />
      )}
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
