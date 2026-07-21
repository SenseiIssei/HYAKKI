import { BALANCE as B, FAMILY_MODS, type Family } from '../content/balance'
import { enemyName, enemySeed } from '../content/names'
import { wardenFor, wardenName } from '../content/wardens'
import { AFFIX_BY_ID } from '../content/relics'
import { enemyArm, enemyAtk, enemyHp, isStandRank, wardenHp } from './formulas'
import { pickGhostFrom } from './ghosts'
import { Rng } from './rng'
import type { GameState, Ghost } from './types'
import { attackCooldown } from './stats'
import type { Enemy } from './types'

/**
 * Family mix by Rank band. Phase 1 ships CHAFF plus the Wardens; the table is
 * here so the other families slot in without touching spawn logic.
 */
function familyFor(rank: number, index: number, seed: number, ghosts: number): Family {
  if (rank < 15) return 'chaff'
  const r = new Rng(seed ^ 0x5bf0).next()
  void index

  // THE RETURNED need someone to have died first. From Rank 40 the Hollow
  // starts reissuing your own corpses. docs/07-ENEMIES.md
  const returnedChance = rank >= 40 && ghosts > 0 ? Math.min(0.3, 0.06 + (rank - 40) / 1200) : 0
  if (r < returnedChance) return 'returned'

  // Organs are the slow, armoured, high-value ones. They thicken with depth.
  const organChance = Math.min(0.4, 0.08 + (rank - 15) / 900)
  return r < returnedChance + organChance ? 'organs' : 'chaff'
}

function blank(family: Family, seed: number, spd: number): Omit<Enemy, 'hp' | 'maxHp' | 'atk' | 'arm' | 'name'> {
  return {
    family,
    seed,
    spd,
    cooldown: attackCooldown(spd),
    isWarden: false,
    burn: 0,
    guards: [],
    sigTicks: -1,
    sigCount: 0,
    tellTicks: 0,
    untargetable: 0,
    atkMult: 1,
    armStripTicks: 0,
  }
}

export function spawnEnemy(
  rank: number,
  index: number,
  runSeed: number,
  carryBurn = 0,
  ghosts: Ghost[] = [],
): Enemy {
  const seed = enemySeed(rank, index, runSeed)
  const family = familyFor(rank, index, seed, ghosts.length)
  const maxHp = enemyHp(rank, family)
  const spd = B.ENEMY_SPD_BASE * FAMILY_MODS[family].spd

  const e: Enemy = {
    ...blank(family, seed, spd),
    name: enemyName(family, seed),
    hp: maxHp,
    maxHp,
    atk: enemyAtk(rank, family),
    arm: enemyArm(rank, family),
    burn: carryBurn,
  }

  if (family === 'returned' && ghosts.length) {
    // It is not a copy of an old statline — an early ghost would be harmless by
    // Rank 900. It is scaled to HERE, wearing that run's number and sigil, and
    // carrying one affix it had. The identity is the point, not the numbers.
    const ghost = pickGhostFrom(ghosts, rank, new Rng(seed ^ 0x1f5).next())
    if (ghost) {
      e.ghost = ghost
      e.seed = ghost.seed
      e.name = `Soldier #${ghost.soldierNumber.toLocaleString('en-US')}`
      const a = ghost.affix ? AFFIX_BY_ID[ghost.affix.id] : undefined
      if (a && ghost.affix) {
        const v = ghost.affix.value
        if (a.stat === 'atk') e.atk = e.atk.mul(1 + v)
        else if (a.stat === 'hp') {
          e.maxHp = e.maxHp.mul(1 + v)
          e.hp = e.maxHp
        } else if (a.stat === 'arm') e.arm = e.arm.add(v)
        else if (a.stat === 'spd') e.spd *= 1 + v
      }
      e.cooldown = attackCooldown(e.spd)
    }
  }
  return e
}

/** The Warden holding the Stand at this Rank. */
export function spawnWarden(
  rank: number,
  standsCleared: number,
  carryBurn = 0,
  interments = 0,
): Enemy {
  const def = wardenFor(rank)
  // T2: same Warden, escalated. Interment does not make the Hollow easier.
  const evo = interments > 0 ? 1 + 0.5 * Math.min(interments, 4) : 1
  const maxHp = wardenHp(rank, standsCleared).mul(evo)
  const spd = B.ENEMY_SPD_BASE * FAMILY_MODS.warden.spd
  return {
    ...blank('warden', def.sigilSeed, spd),
    name: wardenName(def, interments),
    isWarden: true,
    wardenId: def.id,
    hp: maxHp,
    maxHp,
    atk: enemyAtk(rank, 'warden'),
    arm: enemyArm(rank, 'warden'),
    burn: carryBurn,
    // First Signature lands 8s in, then on its own cadence.
    sigTicks: 80,
  }
}

/** THE QUARTERMASTER's ISSUE: paperwork, interposed. Guards do not attack. */
export function spawnGuard(rank: number, n: number, runSeed: number): Enemy {
  const e = spawnEnemy(rank, 900 + n, runSeed, 0, [])
  e.hp = e.maxHp = e.maxHp.mul(1.5)
  return e
}

/**
 * The one call site everything should use — it cannot forget to pass the
 * ghosts, which is how the Returned stop appearing.
 */
export function spawnFor(
  s: Pick<GameState, 'soldierSeed' | 'reveilles' | 'standsThisRun' | 'ghosts' | 'interments'>,
  rank: number,
  index: number,
  carryBurn = 0,
): Enemy {
  return spawnForRank(
    rank,
    index,
    (s.soldierSeed + s.reveilles * 7919) >>> 0,
    s.standsThisRun,
    carryBurn,
    s.ghosts,
    s.interments,
  )
}

export function currentTarget(enemy: Enemy): Enemy {
  return enemy.guards.length > 0 ? enemy.guards[0] : enemy
}

export function spawnForRank(
  rank: number,
  index: number,
  runSeed: number,
  standsCleared: number,
  carryBurn = 0,
  ghosts: Ghost[] = [],
  interments = 0,
): Enemy {
  return isStandRank(rank)
    ? spawnWarden(rank, standsCleared, carryBurn, interments)
    : spawnEnemy(rank, index, runSeed, carryBurn, ghosts)
}
