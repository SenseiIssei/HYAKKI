import Decimal from 'break_infinity.js'
import { BALANCE as B } from '../content/balance'
import { keystoneFlags } from '../content/tree'
import { tick } from './combat'
import { spawnEnemy } from './enemies'
import { equippedFlags } from './relics'
import { Rng } from './rng'
import { computeStats } from './stats'
import type { GameState } from './types'

/**
 * THE MYRIAD.
 *
 * Ten thousand small sigils arranged in the shape of one enormous soldier. Its
 * statline is the literal sum of every run you have ever recorded — you fight
 * everything you have ever been, at once.
 *
 * This is the only encounter in the game that is not procedural. It cannot be
 * ground down: its health is your own history, so the only way to make it
 * smaller is to have been smaller, and the only way to beat it is to be more
 * than the sum of the runs that made it. docs/14-NARRATIVE.md
 */

export type MyriadResult = {
  felled: boolean
  /** seconds the fight lasted */
  seconds: number
  /** fraction of its health removed */
  progress: number
  hp: string
  maxHp: string
  line: string
  /**
   * Orders of magnitude between what it is and what you can do to it.
   *
   * There is no near-miss here and there cannot be: tree nodes multiply, so
   * 400 levels of EDGE is thirteen orders of magnitude short and 800 is six
   * orders past. Measured, `progress` is 0% or 100% and essentially nothing
   * else — so this is the number the player is actually shown. It is the
   * honest one, and counting orders of magnitude suits this game anyway.
   */
  shortBy: number
}

/** Its health is the sum of every ghost, scaled to where they each got. */
export function myriadHp(s: GameState): Decimal {
  let total = new Decimal(0)
  for (const gh of s.ghosts) {
    total = total.add(spawnEnemy(Math.max(1, gh.deepestRank), 0, gh.seed, 0, []).maxHp)
  }
  // A floor, so a player who wiped their ghosts still meets something — kept
  // low on purpose. At x50 it swamped the ghost sum entirely and the fight
  // stopped being made of your history, which is the only thing it is for.
  return Decimal.max(total, spawnEnemy(Math.max(10, s.bestRankEver), 0, 1, 0, []).maxHp.mul(8))
}

/**
 * Deliberately below the curve. At `0.95x your wall x2.2` it removed a player's
 * entire health bar in a single swing — the encounter resolved in two seconds
 * and the outcome was "did you already out-damage it", with no fight in between.
 * The check that matters is its HEALTH, which is your whole history; its attack
 * only needs to make the race feel dangerous.
 */
export function myriadAtk(s: GameState): Decimal {
  const at = Math.max(10, Math.round(s.bestRankEver * 0.8))
  return spawnEnemy(at, 0, 7, 0, []).atk.mul(1.1)
}

export function myriadReady(s: GameState): boolean {
  return s.apotheoses >= 1 && !s.myriadFelled && s.ghosts.length >= 20
}

const TIMEOUT_TICKS = 180 * B.TICKS_PER_SEC

/**
 * Resolved with the real combat sim on a fork, exactly like a Descent, so
 * everything the player built behaves the way it does everywhere else.
 */
export function fightMyriad(s: GameState, seed = 1): MyriadResult {
  const g: GameState = {
    ...s,
    events: [],
    inventory: [],
    descents: [],
    boneLevels: { ...s.boneLevels },
    treeLevels: { ...s.treeLevels },
    seen: { ...s.seen },
    soldier: {
      hp: new Decimal(s.soldier.hp),
      cooldown: 1,
      resolve: 0,
      shield: new Decimal(0),
    },
    bone: new Decimal(0),
    ash: new Decimal(0),
    ashSpentTotal: new Decimal(s.ashSpentTotal),
    ashSpentThisAscension: new Decimal(s.ashSpentThisAscension),
    bestAsh: new Decimal(0),
    lastAsh: new Decimal(0),
    sigStored: new Decimal(0),
    dead: false,
    standTimer: 0,
    standTimerMax: 0,
    silencedTicks: 0,
    enemiesThisRank: 999999,
    rank: Math.max(10, s.bestRankEver),
  }
  g.soldier.hp = computeStats(g).hp

  const maxHp = myriadHp(s)
  const e = spawnEnemy(g.rank, 0, 11, 0, [])
  e.name = 'THE MYRIAD'
  e.isWarden = true
  e.wardenId = undefined
  e.maxHp = maxHp
  e.hp = maxHp
  e.atk = myriadAtk(s)
  e.arm = e.arm.mul(3)
  e.spd = 1
  e.cooldown = B.TICKS_PER_SEC
  g.enemy = e

  const st = computeStats(g)
  const f = keystoneFlags(g.treeLevels)
  const rf = equippedFlags(g.equipped)
  const rng = new Rng(seed >>> 0)

  // Watch the KILL COUNT, not the enemy's health. The moment it dies the combat
  // sim spawns a replacement, and reading that replacement's health reports a
  // win as "96% of the way through" — which is exactly what it did.
  const killsBefore = g.totalKills
  let lastHp = maxHp
  let ticks = 0
  while (!g.dead && g.totalKills === killsBefore && ticks < TIMEOUT_TICKS) {
    tick(g, st, f, rf, rng)
    ticks++
    if (g.totalKills === killsBefore) lastHp = g.enemy.hp
  }

  const felled = g.totalKills > killsBefore && !g.dead
  const hp = felled ? new Decimal(0) : Decimal.max(lastHp, 0)
  const progress = felled ? 1 : Math.min(1, 1 - hp.div(maxHp).toNumber())

  const reach = st.atk.mul(st.spd).mul(TIMEOUT_TICKS / B.TICKS_PER_SEC)
  const shortBy = maxHp.log10() - Decimal.max(reach, 1).log10()

  return {
    felled,
    seconds: ticks / B.TICKS_PER_SEC,
    progress,
    hp: hp.toString(),
    maxHp: maxHp.toString(),
    shortBy,
    line: felled
      ? 'It comes apart into ten thousand and every one of them is wearing your coat.'
      : shortBy > 6
        ? 'It does not fight you. It counts you, and the count is not finished.'
        : 'You are nearly the size of what you have been. Nearly is not the same size.',
  }
}
