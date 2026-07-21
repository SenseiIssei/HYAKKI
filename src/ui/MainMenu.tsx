import { useEffect, useState } from 'react'
import { Backdrop } from './Backdrop'
import { PixelWalker } from './PixelActor'
import { fmtInt, fmtTime } from '../format'
import { BALANCE as B } from '../content/balance'
import { game, stats, useUI } from '../store/gameStore'
import { isDesktop, winHide } from '../save/desktop'

/**
 * The front of the game. A title, a road already moving behind it, and the
 * walker standing on it — so the first thing you see is the thing you are.
 */
export function MainMenu({
  onContinue,
  onNew,
}: {
  onContinue: () => void
  onNew: () => void
}) {
  const g = game()
  const st = stats()
  const setSettings = useUI((s) => s.setSettings)
  const setLedger = useUI((s) => s.setLedger)
  const [confirming, setConfirming] = useState(false)

  const played = g.totalTicks > 0
  const hasWalked = played || g.reveilles > 0

  // Enter continues; Esc backs out of the confirm
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !confirming) hasWalked ? onContinue() : onNew()
      if (e.key === 'Escape') setConfirming(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirming, hasWalked, onContinue, onNew])

  return (
    <div className="menu">
      <Backdrop ri={g.bestRankEver || 1} />

      <div className="menu-inner">
        <div className="menu-title">
          <div className="menu-kanji">百鬼</div>
          <div className="menu-romaji">Hyakki</div>
          <div className="menu-tag">
            A hundred demons. Which is to say: too many to count.
          </div>
        </div>

        <div className="menu-walker">
          <PixelWalker stats={st} pose="walk" scale={4} />
        </div>

        {confirming ? (
          <div className="menu-confirm">
            <p className="menu-warn">
              There is already someone on the road — {fmtInt(g.soldierNumber)}, who has walked{' '}
              {fmtTime((g.totalTicks / B.TICKS_PER_SEC) * 1000)} and got as far as Ri{' '}
              {fmtInt(g.bestRankEver)}.
            </p>
            <p className="menu-warn">Starting again unmakes all of it. There is no undo.</p>
            <div className="menu-row">
              <button className="menu-btn danger" onClick={onNew}>
                Unmake them
              </button>
              <button className="menu-btn" onClick={() => setConfirming(false)}>
                Leave them walking
              </button>
            </div>
          </div>
        ) : (
          <nav className="menu-nav">
            {hasWalked && (
              <button className="menu-btn primary" onClick={onContinue}>
                Keep walking
                <span className="menu-sub">
                  #{fmtInt(g.soldierNumber)} · Ri {fmtInt(g.rank)}
                </span>
              </button>
            )}
            <button
              className={`menu-btn ${hasWalked ? '' : 'primary'}`}
              onClick={() => (hasWalked ? setConfirming(true) : onNew())}
            >
              {hasWalked ? 'Begin again' : 'Walk in'}
              {!hasWalked && <span className="menu-sub">choose what you were</span>}
            </button>
            {hasWalked && (
              <button className="menu-btn" onClick={() => setLedger(true)}>
                The Register
                <span className="menu-sub">everything it has counted</span>
              </button>
            )}
            <button className="menu-btn" onClick={() => setSettings(true)}>
              Options
            </button>
            {isDesktop() && (
              <button className="menu-btn quiet" onClick={winHide}>
                Stop watching
                <span className="menu-sub">it keeps going</span>
              </button>
            )}
          </nav>
        )}
      </div>

      <div className="menu-foot">
        <span>百鬼 0.1.0</span>
        <span>Nothing here was drawn by hand.</span>
      </div>
    </div>
  )
}
