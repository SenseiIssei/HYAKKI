import { useEffect, useState } from 'react'
import { setAudioEnabled, setVolume, startAudio } from '../audio/engine'
import { createInitialState } from '../sim/state'
import { hardReset } from '../save/storage'
import { Backdrop } from './Backdrop'
import { MainMenu } from './MainMenu'
import { WindowBar } from './WindowBar'
import { ActionButton } from './ActionButton'
import { Bestiary } from './Bestiary'
import { EquipPrompt } from './EquipPrompt'
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
  replaceGame,
  reveal,
  saveNow,
  soundReveille,
  useUI,
} from '../store/gameStore'
import { isDesktop, winDrag, winMaximize, winMinimize, winQuit } from '../save/desktop'
import { Bargain } from './Bargain'
import { Ascend } from './Ascend'
import { Ledger } from './Ledger'
import { Wards } from './Wards'
import { Hyakumonogatari } from './Hyakumonogatari'
import { Descend, DescentReport } from './Descend'
import { Orders } from './Orders'
import { Report } from './Report'
import { fmtInt } from '../format'
import { Riverbed, StackButton } from './Riverbed'
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
  const wardsOpen = useUI((s) => s.wardsOpen)
  const storiesOpen = useUI((s) => s.storiesOpen)
  const bestiaryOpen = useUI((s) => s.bestiaryOpen)
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
        ui.setBestiary(false)
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
  const [screen, setScreen] = useState<'menu' | 'game'>('menu')

  const progress = {
    totalDeaths: g.totalDeaths,
    reveilles: g.reveilles,
    totalKills: g.totalKills,
  }

  // ── the front of the game ──
  if (screen === 'menu') {
    return (
      <>
        <WindowBar />
        <MainMenu
          onContinue={() => setScreen('game')}
          onNew={() => {
            hardReset()
            replaceGame(createInitialState())
            // `chosen` is now false, so the class picker is what renders next
            setScreen('game')
          }}
        />
        {settingsOpen && <Settings />}
        {ledgerOpen && <Ledger />}
        {wardsOpen && <Wards />}
        {storiesOpen && <Hyakumonogatari />}
        {bestiaryOpen && <Bestiary />}
        <div className="grain" />
        <div className="vignette" />
      </>
    )
  }

  if (!chosen) {
    return (
      <>
        <div className="drift" />
        <Backdrop ri={1} />
        <Opening
          progress={progress}
          onChoose={(id) => {
            chooseClass(id)
            reveal('classChosen')
            saveNow()
            setScreen('game')
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
        <header className="topbar" onMouseDown={(e) => e.target === e.currentTarget && winDrag()}>
          <span className="wordmark">
            <span className="wordmark-kanji">百鬼</span>
            <span className="wordmark-romaji">Hyakki</span>
          </span>
          <span className="topbar-right">
            <span>
              #{fmtInt(g.soldierNumber)} · {cls.name}
            </span>
            <button
              className="icon-btn"
              aria-label="Back to the menu"
              title="The road keeps going without you"
              onClick={() => setScreen('menu')}
            >
              ⌂
            </button>
            <button
              className="icon-btn"
              aria-label="Options"
              onClick={() => setSettings(true)}
            >
              ☰
            </button>
            {isDesktop() && (
              <span className="win-controls">
                <button className="win-btn" aria-label="Minimise" onClick={winMinimize}>
                  ─
                </button>
                <button className="win-btn" aria-label="Maximise" onClick={winMaximize}>
                  □
                </button>
                {/* X quits the app outright now. To keep it running in the
                    tray, use "Stop watching" on the menu (winHide). */}
                <button
                  className="win-btn close"
                  aria-label="Close"
                  title="Quit"
                  onClick={winQuit}
                >
                  ✕
                </button>
              </span>
            )}
          </span>
        </header>

        <Column />
        <Lower />
        {g.seen.ash && (
          <div className="actionbar">
            <ActionButton
              kind="grow"
              title="The Cairn"
              sub="Spend ash to grow stronger"
              dot={g.ash.gte(8)}
              onClick={() => setTree(true)}
            />
            <ActionButton
              kind="vow"
              title="The Vow"
              sub="Set a standing order"
              dot={ordersUnlocked() && !g.orders.enabled}
              onClick={() => setOrdersOpen(true)}
            />
            {(g.reveilles >= 10 || g.interments > 0 || g.names > 0) && (
              <ActionButton
                kind="prestige"
                title="Enshrinement"
                sub="Retire this soldier for power"
                dot={intermentReady() || g.names > 0}
                onClick={() => setBargain(true)}
              />
            )}
            {(g.interments > 0 || g.apotheoses > 0) && (
              <ActionButton
                kind="delve"
                title="Enter Dungeon"
                sub="Delve with your gear for loot"
                dot={keysHeld() >= 1 || readyDescents().length > 0}
                onClick={() => setDescend(true)}
              />
            )}
            {(g.interments >= 1 || g.apotheoses > 0 || g.fragments.length > 0) && (
              <ActionButton
                kind="become"
                title="Becoming"
                sub="Spend souls on lasting power"
                dot={ascendReady() || g.ichor > 0}
                onClick={() => setAscend(true)}
              />
            )}
            {(g.inventory.length > 0 || g.equipped.some(Boolean)) && (
              <ActionButton
                kind="gear"
                title="Carried"
                sub="Your gear & inventory"
                dot={g.inventory.length > 0}
                onClick={() => setRelics(true)}
              />
            )}
            <ActionButton
              kind="lore"
              title="Bestiary"
              sub="Every yōkai you have met"
              onClick={() => useUI.getState().setBestiary(true)}
            />
            <StackButton />
          </div>
        )}
        <LogStrip />
      </div>

      <Loop />
      {/* The report comes before anything else — it is the first thing you
          came back for. */}
      {report && <Report report={report} />}
      {!report && g.dead && <Riverbed />}
      {treeOpen && <Tree />}
      {relicsOpen && <Relics />}
      {ordersOpen && <Orders />}
      {bargainOpen && <Bargain />}
      {descendOpen && <Descend />}
      {ascendOpen && <Ascend />}
      {ledgerOpen && <Ledger />}
      {wardsOpen && <Wards />}
      {storiesOpen && <Hyakumonogatari />}
      {bestiaryOpen && <Bestiary />}
      <EquipPrompt />
      {/* A finished Descent announces itself rather than waiting to be noticed. */}
      {!report && !descendOpen && readyDescents()[0] && (
        <DescentReport id={readyDescents()[0].id} />
      )}
      {pickerOpen && (
        <Opening
          progress={progress}
          title="You are back at the pass. The stone is still moved aside."
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
