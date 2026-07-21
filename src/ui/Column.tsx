import { useEffect, useRef } from 'react'
import Decimal from 'break_infinity.js'
import { BALANCE as B } from '../content/balance'
import { CLASS_BY_ID } from '../content/classes'
import { WARDEN_BY_ID } from '../content/wardens'
import { currentTarget } from '../sim/enemies'
import { FAMILY_PRESETS, COLORS, rankTint } from '../render/presets'
import { game, getFloaters, getLog, stats, useUI } from '../store/gameStore'
import { fmt, fmtInt } from '../format'
import { Sigil } from './Sigil'

function pct(cur: Decimal, max: Decimal): number {
  if (max.lte(0)) return 0
  return Math.max(0, Math.min(100, cur.div(max).toNumber() * 100))
}

function StandBanner() {
  const g = game()
  if (g.standTimer <= 0) return null
  const def = g.enemy.wardenId ? WARDEN_BY_ID[g.enemy.wardenId] : undefined
  const left = g.standTimer / B.TICKS_PER_SEC
  const frac = g.standTimerMax > 0 ? g.standTimer / g.standTimerMax : 0
  const urgent = frac < 0.25

  return (
    <div className={`stand ${urgent ? 'urgent' : ''}`}>
      <div className="stand-row">
        <span className="stand-label">A Stand</span>
        <span className="stand-timer">{left.toFixed(1)}s</span>
      </div>
      <div className="bar stand-bar">
        <div className="bar-fill stand-fill" style={{ width: `${frac * 100}%` }} />
      </div>
      {g.enemy.tellTicks > 0 && def && <div className="stand-tell">{def.tell}</div>}
      {g.standFails > 0 && (
        <div className="stand-fails">
          {g.standFails} of {B.STAND_FAILS_TO_END} closed
        </div>
      )}
    </div>
  )
}

/**
 * For low-end devices and for anyone who finds the sigils hard to parse. All
 * the same information, none of the drawing. docs/10-UI-UX.md § Accessibility
 */
function NumbersOnly() {
  const g = game()
  const st = stats()
  const cls = CLASS_BY_ID[g.classId]
  const target = currentTarget(g.enemy)
  const log = getLog()
  return (
    <main className="column numbers-only">
      <div className="rank-block">
        <div className="rank-label">Rank</div>
        <div className="rank-number">{fmtInt(g.rank)}</div>
      </div>
      <table className="no-table">
        <tbody>
          <tr>
            <th>{cls.name}</th>
            <td>
              {fmt(g.soldier.hp)} / {fmt(st.hp)}
            </td>
            <td>resolve {Math.floor(g.soldier.resolve)}</td>
          </tr>
          <tr>
            <th>{target.name || 'the Nothing'}</th>
            <td>
              {fmt(Decimal.max(target.hp, 0))} / {fmt(target.maxHp)}
            </td>
            <td>
              {g.enemy.isWarden
                ? `WARDEN · ${(g.standTimer / B.TICKS_PER_SEC).toFixed(1)}s`
                : `${g.enemyIndex + 1} / ${g.enemiesThisRank}`}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="no-log">
        {log.slice(0, 10).map((l) => (
          <div key={l.id}>{l.text}</div>
        ))}
      </div>
    </main>
  )
}

export function Column() {
  const numbersOnly = useUI((s) => s.numbersOnly)
  const g = game()
  const st = stats()
  const cls = CLASS_BY_ID[g.classId]
  const tint = rankTint(g.rank)
  const target = currentTarget(g.enemy)
  const guarded = g.enemy.guards.length > 0

  // Hit reaction: flag the sigil for one render after its health drops.
  const prevEnemyHp = useRef(target.hp)
  const prevSoldierHp = useRef(g.soldier.hp)
  const enemyHurt = target.hp.lt(prevEnemyHp.current)
  const soldierHurt = g.soldier.hp.lt(prevSoldierHp.current)
  useEffect(() => {
    prevEnemyHp.current = target.hp
    prevSoldierHp.current = g.soldier.hp
  })

  const floaters = getFloaters()
  const resolveThreshold = 100
  const bracing = g.sigKind === 'brace'

  if (numbersOnly) return <NumbersOnly />

  return (
    <main className="column">
      <div className="rank-block">
        <div className="rank-label">Rank</div>
        <div className="rank-number">{fmtInt(g.rank)}</div>
        <div className="rank-rule" />
        <div className="enemy-name">{target.name}</div>
      </div>

      <StandBanner />

      <div className="arena">
        <div className="combatant">
          <div className="floaters">
            {floaters
              .filter((f) => f.target === 'soldier')
              .map((f) => (
                <div key={f.id} className="floater soldier" style={{ marginLeft: f.x }}>
                  {f.text}
                </div>
              ))}
          </div>
          <Sigil
            preset={cls.sigil}
            seed={g.soldierSeed}
            cacheKey={`soldier-${g.classId}-${g.soldierSeed}`}
            color={bracing ? COLORS.gold : COLORS.bone}
            spin={320}
            breathe
            flash={soldierHurt}
            className={soldierHurt ? 'hit-jitter' : ''}
          />
          <div className="bar">
            <div className="bar-fill" style={{ width: `${pct(g.soldier.hp, st.hp)}%` }} />
            {g.soldier.shield.gt(0) && (
              <div
                className="bar-shield"
                style={{ width: `${Math.min(100, pct(g.soldier.shield, st.hp))}%` }}
              />
            )}
          </div>
          <div className="bar-row">
            <span>{cls.name}</span>
            <span>
              {fmt(g.soldier.hp)} / {fmt(st.hp)}
            </span>
          </div>
          <div className="bar" style={{ height: 3 }}>
            <div
              className="bar-fill resolve"
              style={{ width: `${(g.soldier.resolve / resolveThreshold) * 100}%` }}
            />
          </div>
          <div className="bar-row">
            <span className="sig-name">
              {bracing ? 'BRACING' : g.sigCharges > 0 ? `${cls.signature.label} ×${g.sigCharges}` : cls.signature.label}
            </span>
            <span>{Math.floor(g.soldier.resolve)}</span>
          </div>
        </div>

        <div className="combatant">
          <div className="floaters">
            {floaters
              .filter((f) => f.target === 'enemy')
              .map((f) => (
                <div
                  key={f.id}
                  className={`floater ${f.crit ? 'crit' : ''}`}
                  style={{ marginLeft: f.x }}
                >
                  {f.text}
                </div>
              ))}
          </div>
          <Sigil
            preset={FAMILY_PRESETS[target.family]}
            seed={target.seed}
            cacheKey={`e-${target.seed}-${target.family}`}
            color={g.enemy.isWarden && !guarded ? COLORS.gold : tint}
            spin={g.enemy.isWarden && !guarded ? 420 : 200}
            breathe
            flash={enemyHurt}
            className={`${enemyHurt ? 'hit-jitter' : ''} ${g.enemy.untargetable > 0 ? 'faded' : ''} ${
              g.enemy.tellTicks > 0 ? 'telegraph' : ''
            }`}
          />
          <div className="bar">
            <div
              className="bar-fill enemy"
              style={{ width: `${pct(target.hp, target.maxHp)}%` }}
            />
          </div>
          <div className="bar-row">
            <span>
              {guarded
                ? `issued ${g.enemy.guards.length}`
                : g.enemy.isWarden
                  ? 'WARDEN'
                  : `${g.enemyIndex + 1} / ${g.enemiesThisRank}`}
            </span>
            <span>{fmt(Decimal.max(target.hp, 0))}</span>
          </div>
          {guarded && (
            <div className="bar-row">
              <span style={{ color: 'var(--gold)' }}>{g.enemy.name}</span>
              <span>{fmt(Decimal.max(g.enemy.hp, 0))}</span>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export function LogStrip() {
  useUI((s) => s.frame)
  const log = getLog()
  return (
    <div className="logstrip">
      {log.slice(0, 4).map((l) => (
        <span key={l.id}>{l.text}</span>
      ))}
    </div>
  )
}
