import { useEffect, useState } from 'react'
import { BALANCE as B } from '../content/balance'
import { fmt, fmtInt, fmtTime } from '../format'
import { ashProjection, game, reveilleReady, soundReveille, useUI } from '../store/gameStore'
import { worldStage } from '../content/worldStage'

/**
 * SAI NO KAWARA 賽の河原 — the riverbed.
 *
 * Souls stack stones into towers, and oni come and knock them down, and it
 * begins again. This is the reset screen, and it is the game's best image:
 * the tower never survives, and the stones always do.
 *
 * It never says failed, lost, or over. docs/hyakki/04-HORROR.md
 */
export function Riverbed() {
  const g = game()
  const ishi = ashProjection()
  const ready = reveilleReady()
  const best = g.rank >= g.bestRankEver

  // one stone per Ri tier reached, to a readable maximum
  const stones = Math.max(1, Math.min(14, Math.floor(g.bestRank / 10) + 1))

  const [shown, setShown] = useState(0)
  useEffect(() => {
    const target = ishi.toNumber()
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
        <div className="rank-label">World {worldStage(g.bestRank).world}</div>
        <div className="rank-number">{worldStage(g.bestRank).label}</div>

        <p className="autopsy-line">
          Your tower was {stones === 1 ? 'one stone' : `${fmtInt(stones)} stones`}.
        </p>

        <div className="cairn">
          {Array.from({ length: stones }).map((_, i) => (
            <span
              key={i}
              className="cairn-stone"
              style={{ animationDelay: `${i * 45}ms` }}
            />
          ))}
        </div>
        <div className="cairn-rule" />

        <p className="autopsy-line">{g.deathCause}</p>

        <div className="autopsy-stats">
          <div className="autopsy-stat">
            <span>furthest</span>
            <span>
              {fmtInt(g.bestRank)} ri{' '}
              <span style={{ opacity: 0.45 }}>(ever {fmtInt(g.bestRankEver)})</span>
            </span>
          </div>
          <div className="autopsy-stat">
            <span>walked for</span>
            <span>{fmtTime((g.runTicks / B.TICKS_PER_SEC) * 1000)}</span>
          </div>
          <div className="autopsy-stat">
            <span>put down</span>
            <span>{fmtInt(g.killsThisRun)}</span>
          </div>
          <div className="autopsy-stat">
            <span>hearings held</span>
            <span>{fmtInt(g.standsThisRun)}</span>
          </div>
          <div className="autopsy-stat">
            <span>stopped by</span>
            <span>{g.enemy.name || '—'}</span>
          </div>
        </div>

        <div className="ash-award">
          <div className="ash-number">{fmtInt(Math.floor(shown))}</div>
          <div className="ash-word">
            <span className="kanji">石</span> ishi
          </div>
        </div>

        {best && <p className="autopsy-note">Further than before.</p>}

        <button className="big-btn" disabled={!ready} onClick={() => soundReveille()}>
          Stack the stones
        </button>
        {ready && (
          <button
            className="small-btn autopsy-alt"
            onClick={() => useUI.getState().setPicker(true)}
          >
            Walk as something else
          </button>
        )}
        {!ready && (
          <p className="autopsy-note dim">
            You did not get far enough for it to be worth anything. Go further before you
            stop.
          </p>
        )}
      </div>
    </div>
  )
}

/** Always visible. Shows what stopping is currently worth. */
export function StackButton() {
  const g = game()
  const ishi = ashProjection()
  const ready = reveilleReady()
  return (
    <button
      className="reveille"
      disabled={!ready}
      aria-label={`Stack the stones for ${fmt(ishi)} ishi`}
      onClick={() => {
        if (g.dead || confirm(`Stop here and stack? ${fmt(ishi)} 石.`)) soundReveille()
      }}
    >
      <span className="reveille-label">Stack the stones</span>
      <span className="reveille-ash">
        <span className="kanji">石</span> {fmt(ishi)}
      </span>
    </button>
  )
}
