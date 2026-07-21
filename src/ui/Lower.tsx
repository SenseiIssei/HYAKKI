import { useEffect } from 'react'
import { BONE_UPGRADES } from '../content/upgrades'
import { fmt, fmtInt } from '../format'
import { bandFor } from '../content/kegare'
import {
  boneBuyCount,
  boneCost,
  buyBone,
  game,
  purify,
  purifyCost,
  reveal,
  useUI,
} from '../store/gameStore'

/**
 * KEGARE 穢れ, and the option to wash it off.
 *
 * Deliberately shown as a bar you are *filling*, not a debuff icon — it is
 * paying you the whole time it is on you, and the decision to wash is a
 * decision to become poorer and harder to kill. Hidden entirely while clean,
 * so a new player is never shown a mechanic they have not met yet.
 */
function Defilement() {
  const g = game()
  const band = bandFor(g.kegare)
  const cost = purifyCost()
  const afford = g.bone.gte(cost)
  return (
    <div className="defile">
      <div className="currency-row">
        <span className="currency-name">
          <span className="kanji">{band.kanji}</span> {band.name}
        </span>
        <span className="currency-value">{Math.round(g.kegare * 100)}%</span>
      </div>
      <div className="defile-bar">
        <span style={{ width: `${Math.min(100, g.kegare * 100)}%` }} />
      </div>
      <button
        className="small-btn defile-wash"
        disabled={!afford}
        onClick={() => purify()}
        title={band.line}
      >
        Wash · {fmt(cost)}
      </button>
    </div>
  )
}

/**
 * Progressive revelation: an upgrade row does not exist until the player has
 * enough Bone to care about it. No tutorial, no arrows.
 * docs/10-UI-UX.md § Onboarding
 */
export function Lower() {
  const g = game()
  const buyMode = useUI((s) => s.buyMode)
  const setBuyMode = useUI((s) => s.setBuyMode)

  // Visibility is a pure read; the `seen` flag is written in an effect so a
  // row stays revealed once the player has spent past it. Writing to the store
  // during render is a React violation and it warns loudly.
  const visible = BONE_UPGRADES.filter((u) => g.seen[`up.${u.id}`] || g.bone.gte(u.revealAt))

  useEffect(() => {
    for (const u of visible) reveal(`up.${u.id}`)
  })

  return (
    <div className="lower">
      <div className="currency">
        <div className="currency-row">
          <span className="currency-name">
            <span className="kanji">魂</span> Tama
          </span>
          <span className="currency-value">{fmt(g.bone)}</span>
        </div>
        {g.kegare > 0.02 && <Defilement />}
        {g.seen['up.reinforce'] && (
          <>
            <div className="currency-row">
              <span className="currency-name">Put down</span>
              <span className="currency-value">{fmtInt(g.killsThisRun)}</span>
            </div>
            <div className="currency-row">
              <span className="currency-name">Furthest</span>
              <span className="currency-value">{fmtInt(g.bestRank)}</span>
            </div>
            <div className="currency-row" style={{ marginTop: 2 }}>
              <span className="currency-name">Buy</span>
              <span className="buymode">
                {([1, 10, 'max'] as const).map((m) => (
                  <button
                    key={String(m)}
                    data-on={buyMode === m}
                    onClick={() => setBuyMode(m)}
                  >
                    {m === 'max' ? 'MAX' : `×${m}`}
                  </button>
                ))}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="upgrades">
        {visible.map((u) => {
          const level = g.boneLevels[u.id] ?? 0
          const count = Math.max(1, boneBuyCount(u.id, buyMode))
          const cost = boneCost(u.id, count)
          const afford = g.bone.gte(cost) && boneBuyCount(u.id, buyMode) > 0
          return (
            <button
              key={u.id}
              className="up"
              disabled={!afford}
              aria-label={`${u.label}, level ${level}, ${u.blurb}, costs ${fmt(cost)} bone`}
              onClick={() => buyBone(u.id, buyMode)}
            >
              <span>
                <span className="up-name">{u.label}</span>
                <span className="up-blurb" style={{ display: 'block' }}>
                  {u.blurb}
                  {buyMode !== 1 && count > 1 ? ` ×${count}` : ''}
                </span>
              </span>
              <span className="up-right">
                <span className="up-level" style={{ display: 'block' }}>
                  L{level}
                </span>
                <span className={`up-cost ${afford ? 'afford' : 'poor'}`}>{fmt(cost)}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
