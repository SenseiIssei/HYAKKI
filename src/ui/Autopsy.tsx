import { useEffect, useState } from 'react'
import { BALANCE as B } from '../content/balance'
import { fmt, fmtInt, fmtTime } from '../format'
import { ashProjection, game, reveilleReady, soundReveille, useUI } from '../store/gameStore'

/**
 * Never says "failed", "lost", or "game over". Shows only what you gained.
 * docs/10-UI-UX.md § The Autopsy
 */
export function Autopsy() {
  const g = game()
  const ash = ashProjection()
  const ready = reveilleReady()
  const best = g.rank >= g.bestRankEver

  // The Ash number counts up. It is the reward; let it land.
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const target = ash.toNumber()
    const t0 = Date.now()
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / 900)
      setShown(target * (1 - Math.pow(1 - p, 3)))
      if (p >= 1) clearInterval(id)
    }, 40)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="overlay autopsy">
      <div className="autopsy-inner">
        <div className="rank-label">Rank</div>
        <div className="rank-number">{fmtInt(g.bestRank)}</div>
        <div className="rank-rule" />

        <p className="autopsy-line">{g.deathCause}</p>

        <div className="autopsy-stats">
          <div className="autopsy-stat">
            <span>deepest rank</span>
            <span>
              {fmtInt(g.bestRank)}{' '}
              <span style={{ opacity: 0.45 }}>(best {fmtInt(g.bestRankEver)})</span>
            </span>
          </div>
          <div className="autopsy-stat">
            <span>time</span>
            <span>{fmtTime((g.runTicks / B.TICKS_PER_SEC) * 1000)}</span>
          </div>
          <div className="autopsy-stat">
            <span>enemies felled</span>
            <span>{fmtInt(g.killsThisRun)}</span>
          </div>
          <div className="autopsy-stat">
            <span>stands held</span>
            <span>{fmtInt(g.standsThisRun)}</span>
          </div>
          <div className="autopsy-stat">
            <span>killed by</span>
            <span>{g.enemy.name || '—'}</span>
          </div>
        </div>

        <div className="ash-award">
          <div className="ash-number">{fmtInt(Math.floor(shown))}</div>
          <div className="ash-word">Ash</div>
        </div>

        {best && <p className="autopsy-note">Further than before.</p>}

        <button className="big-btn" disabled={!ready} onClick={() => soundReveille()}>
          Sound Reveille
        </button>
        {ready && (
          <button
            className="small-btn autopsy-alt"
            onClick={() => useUI.getState().setPicker(true)}
          >
            Wake as someone else
          </button>
        )}
        {!ready && (
          <p className="autopsy-note dim">
            Not deep enough to be worth anything. Go further before you wake.
          </p>
        )}
      </div>
    </div>
  )
}

/** Always visible, never buried in a menu. Shows what dying is currently worth. */
export function ReveilleButton() {
  const g = game()
  const ash = ashProjection()
  const ready = reveilleReady()
  return (
    <button
      className="reveille"
      disabled={!ready}
      aria-label={`Sound Reveille for ${fmt(ash)} ash`}
      onClick={() => {
        if (g.dead || confirm(`Sound Reveille now for ${fmt(ash)} Ash?`)) soundReveille()
      }}
    >
      <span className="reveille-label">Sound Reveille</span>
      <span className="reveille-ash">◈ {fmt(ash)}</span>
    </button>
  )
}
