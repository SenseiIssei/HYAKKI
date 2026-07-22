import { useEffect, useRef, useState } from 'react'
import Decimal from 'break_infinity.js'
import { BALANCE as B } from '../content/balance'
import { CLASS_BY_ID } from '../content/classes'
import { WARDEN_BY_ID } from '../content/wardens'
import { currentTarget } from '../sim/enemies'
import { SPECIES_BY_ID } from '../pixel/species'
import { Backdrop, regionFor } from './Backdrop'
import { setAmbience } from '../audio/engine'
import { PixelCorpse, PixelWalker, PixelYokai } from './PixelActor'
import {
  game,
  getCasts,
  getDeaths,
  getFloaters,
  getSparks,
  getImpact,
  getLog,
  stats,
  useUI,
  type Floater,
  type Spark,
} from '../store/gameStore'
import { AbilityVfx } from './AbilityVfx'
import { AbilityBar } from './AbilityBar'
import { worldStage, wsLabel } from '../content/worldStage'
import { lookFromEquipment, equipGlow } from '../render/figure'
import { fmt, fmtInt } from '../format'

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

  // the sound of where you are follows the region under your feet
  const region = regionFor(g.rank)
  useEffect(() => {
    setAmbience(region.id)
  }, [region.id])

  const species = target.speciesId ? SPECIES_BY_ID[target.speciesId] : null
  const floaters = getFloaters()
  const deaths = getDeaths()
  const casts = getCasts()
  const resolveThreshold = 100
  const bracing = g.sigKind === 'brace'

  // ── impact: a shake on a kill, a bigger one on a Warden, hit-stop on a crit ──
  const shake = useUI((s) => s.screenShake)
  const impact = getImpact()
  const prevImpact = useRef(impact)
  const [jolt, setJolt] = useState<'' | 'shake' | 'shake-hard' | 'stop'>('')
  useEffect(() => {
    if (!shake) {
      prevImpact.current = impact
      return
    }
    let next: '' | 'shake' | 'shake-hard' | 'stop' = ''
    // an ability shakes by its tier; the ultimate rocks the whole frame
    if (impact.cast !== prevImpact.current.cast)
      next = impact.castTier >= 3 ? 'shake-hard' : impact.castTier >= 2 ? 'shake' : 'stop'
    else if (impact.warden !== prevImpact.current.warden) next = 'shake-hard'
    else if (impact.kill !== prevImpact.current.kill) next = 'shake'
    else if (impact.crit !== prevImpact.current.crit) next = 'stop'
    prevImpact.current = impact
    if (!next) return
    setJolt(next)
    const id = window.setTimeout(() => setJolt(''), next === 'shake-hard' ? 300 : 150)
    return () => window.clearTimeout(id)
  }, [impact.kill, impact.crit, impact.warden, impact.cast, impact.castTier, shake])

  // ── the actual fighting: the walker lunges on a swing, the struck side recoils ──
  const [lunge, setLunge] = useState(false)
  const prevSwing = useRef(impact.swing)
  useEffect(() => {
    if (impact.swing === prevSwing.current) return
    prevSwing.current = impact.swing
    setLunge(true)
    const id = window.setTimeout(() => setLunge(false), 160)
    return () => window.clearTimeout(id)
  }, [impact.swing])

  const [recoil, setRecoil] = useState<'' | 'enemy' | 'soldier'>('')
  const prevSwingR = useRef(impact.swing)
  const prevStruck = useRef(impact.struck)
  useEffect(() => {
    let who: '' | 'enemy' | 'soldier' = ''
    if (impact.swing !== prevSwingR.current) who = 'enemy' // your hit knocks it back
    else if (impact.struck !== prevStruck.current) who = 'soldier' // its hit knocks you
    prevSwingR.current = impact.swing
    prevStruck.current = impact.struck
    if (!who) return
    setRecoil(who)
    const id = window.setTimeout(() => setRecoil(''), 130)
    return () => window.clearTimeout(id)
  }, [impact.swing, impact.struck])

  // the enemy lunges IN when it attacks — it is fighting back, not just standing
  const [enemyAttack, setEnemyAttack] = useState(false)
  const prevStruck2 = useRef(impact.struck)
  useEffect(() => {
    if (impact.struck === prevStruck2.current) return
    prevStruck2.current = impact.struck
    setEnemyAttack(true)
    const id = window.setTimeout(() => setEnemyAttack(false), 200)
    return () => window.clearTimeout(id)
  }, [impact.struck])

  const sparks = getSparks()

  if (numbersOnly) return <NumbersOnly />

  return (
    <main className="column">
      <Backdrop ri={g.rank} still={g.dead} kegare={g.kegare} />
      <div className="rank-block">
        <span className="kanji-watermark" aria-hidden="true">
          里
        </span>
        <div className="rank-label">World {worldStage(g.rank).world}</div>
        <div className="rank-number">{worldStage(g.rank).label}</div>
        <div className="rank-rule" />
        <div className={`enemy-name ${target.ghost ? 'returned' : ''}`}>
          {species && <span className="kanji enemy-kanji">{species.kanji}</span>}
          {target.name || <span className="unnamed">（ ）</span>}
        </div>
        {/* the Register's one line on it — the first time you meet each */}
        {species && (
          <div className="enemy-lore">{species.lore}</div>
        )}
        {/* The whole thesis of the game, stated quietly. */}
        {target.ghost && (
          <div className="returned-note">
            {target.ghost.soldierNumber === g.soldierNumber
              ? 'Its coat says the same as yours.'
              : `It got as far as ${wsLabel(target.ghost.deepestRank)}. You were it.`}
          </div>
        )}
      </div>

      <StandBanner />

      <div className={`arena ${jolt}`}>
        {/* the art overlays, drawn over the whole arena */}
        {casts.map((c) => (
          <AbilityVfx key={c.id} cast={c} />
        ))}
        <div className={`combatant ${recoil === 'soldier' ? 'recoil-left' : ''}`}>
          <SparkBurst sparks={sparks} side="soldier" />
          <div className="floaters">
            <FloatColumn floaters={floaters} side="soldier" />
          </div>
          <span className={`fighter ${lunge ? 'lunge-right' : ''}`}>
            <PixelWalker
              look={lookFromEquipment(st, g.equipped, { kegare: g.kegare })}
              pose={bracing ? 'brace' : soldierHurt ? 'hit' : lunge ? 'strike' : 'walk'}
              flash={soldierHurt}
              kegare={g.kegare}
              glow={equipGlow(g.equipped)}
            />
          </span>
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

        <div
          className={`combatant ${recoil === 'enemy' ? 'recoil-right' : ''} ${
            enemyAttack ? `enemy-attack fam-${target.family}` : ''
          }`}
        >
          <SparkBurst sparks={sparks} side="enemy" />
          <div className="floaters">
            <FloatColumn floaters={floaters} side="enemy" />
          </div>
          <span
            className={`${g.enemy.untargetable > 0 ? 'faded' : ''} ${
              g.enemy.tellTicks > 0 ? 'telegraph' : ''
            }`}
          >
            <PixelYokai enemy={target} flash={enemyHurt} />
            {/* the fallen, dissolving where they stood */}
            {deaths.map((d) => (
              <span key={d.id} className={`corpse die-${d.family}`}>
                <PixelCorpse
                  family={d.family}
                  seed={d.seed}
                  speciesId={d.speciesId}
                  scale={d.warden ? 6 : 5}
                />
              </span>
            ))}
          </span>
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

      <AbilityBar />
    </main>
  )
}

/**
 * Flying damage numbers for one side. Each carries its own arc in CSS custom
 * properties, so the motion runs on the compositor at full framerate rather
 * than at the sim's 10Hz frame bump.
 */
/** The particle spray at a combatant, from every landed blow. */
function SparkBurst({ sparks, side }: { sparks: Spark[]; side: 'enemy' | 'soldier' }) {
  return (
    <div className="sparks" aria-hidden="true">
      {sparks
        .filter((s) => s.side === side)
        .map((s) => (
          <span
            key={s.id}
            className="spark"
            style={{
              ['--vx' as string]: `${s.vx}px`,
              ['--vy' as string]: `${s.vy}px`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              background: s.color,
              boxShadow: `0 0 4px ${s.color}`,
            }}
          />
        ))}
    </div>
  )
}

function FloatColumn({ floaters, side }: { floaters: Floater[]; side: 'enemy' | 'soldier' }) {
  return (
    <>
      {floaters
        .filter((f) => f.target === side)
        .map((f) => (
          <div
            key={f.id}
            className={`floater fl-${f.kind}`}
            style={{
              ['--dx' as string]: `${f.dx}px`,
              ['--peak' as string]: `${-f.peak}px`,
              ['--fall' as string]: `${f.fall}px`,
              ['--fs' as string]: String(f.scale),
              color: f.color,
            }}
          >
            {f.label && <span className="fl-label">{f.label}</span>}
            {f.text}
          </div>
        ))}
    </>
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
