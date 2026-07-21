import Decimal from 'break_infinity.js'
import { BALANCE as B } from '../content/balance'
import { keystoneFlags } from '../content/tree'
import { spawnEnemy } from './enemies'
import { equippedFlags } from './relics'
import { computeStats } from './stats'
import { tick } from './combat'
import { Rng } from './rng'
import type { GameState, Relic } from './types'

/**
 * The feature that separates a good idle game from a spreadsheet: never make
 * the player do the arithmetic. We fork the real simulation, swap the relic in,
 * and measure what actually happens — which captures crits, Burn, Signatures,
 * armour softcaps and class pipelines for free. A closed-form estimate would
 * get all of those wrong. docs/06-RELICS.md § The equip decision
 */

const SAMPLE_TICKS = 600 // 60 seconds of fight

export type Evaluation = {
  /** damage dealt per second against the current Rank's enemy */
  dps: Decimal
  /** seconds the soldier survives; Infinity if regen outpaces the enemy */
  survival: number
}

/**
 * A deep copy that is cheap enough to run on demand and does not disturb the
 * live game. Only the fields the combat sim reads are carried over.
 */
function fork(s: GameState, equipped: (Relic | null)[]): GameState {
  const clone: GameState = {
    ...s,
    equipped: [...equipped],
    inventory: [],
    ghosts: s.ghosts,
    events: [],
    boneLevels: { ...s.boneLevels },
    treeLevels: { ...s.treeLevels },
    seen: { ...s.seen },
    soldier: {
      hp: new Decimal(s.soldier.hp),
      cooldown: s.soldier.cooldown,
      resolve: s.soldier.resolve,
      shield: new Decimal(s.soldier.shield),
    },
    bone: new Decimal(s.bone),
    ash: new Decimal(s.ash),
    ashSpentTotal: new Decimal(s.ashSpentTotal),
    bestAsh: new Decimal(s.bestAsh),
    sigStored: new Decimal(s.sigStored),
    dead: false,
    // Measure against a normal enemy, never a Warden mid-Stand — otherwise the
    // number swings wildly depending on when you happen to open the panel.
    standTimer: 0,
    standTimerMax: 0,
    enemy: spawnEnemy(s.rank, 0, 12345),
  }
  clone.soldier.hp = computeStats(clone).hp
  return clone
}

export function evaluate(s: GameState, equipped: (Relic | null)[]): Evaluation {
  const g = fork(s, equipped)
  const st = computeStats(g)
  const f = keystoneFlags(g.treeLevels)
  const rf = equippedFlags(g.equipped)
  const rng = new Rng(9001)

  const startHp = g.soldier.hp
  let damage = new Decimal(0)
  let hpTracked = startHp
  let survivalTicks = -1

  for (let i = 0; i < SAMPLE_TICKS; i++) {
    const before = g.enemy.hp
    const beforeMax = g.enemy.maxHp
    tick(g, st, f, rf, rng)
    // Enemy replaced (killed) — count the remainder of its health as dealt.
    if (g.enemy.maxHp.neq(beforeMax) || g.enemy.hp.gt(before)) damage = damage.add(before)
    else damage = damage.add(before.sub(g.enemy.hp))

    hpTracked = g.soldier.hp
    if (survivalTicks < 0 && (g.dead || hpTracked.lte(0))) survivalTicks = i
    if (g.dead) break
  }

  const seconds = SAMPLE_TICKS / B.TICKS_PER_SEC
  const dps = damage.div(seconds)

  let survival: number
  if (survivalTicks >= 0) {
    survival = survivalTicks / B.TICKS_PER_SEC
  } else {
    const lost = startHp.sub(hpTracked)
    survival = lost.lte(0) ? Infinity : startHp.div(lost.div(seconds)).toNumber()
  }
  return { dps, survival }
}

export type Comparison = {
  dpsDelta: number
  survivalDelta: number
  /** seconds, or Infinity when regeneration outpaces the enemy entirely */
  survivalNow: number
  survivalNext: number
  /** true when nothing is currently in that slot */
  intoEmptySlot: boolean
  slot: number
}

const ratio = (next: Decimal, cur: Decimal) =>
  cur.lte(0) ? (next.gt(0) ? 1 : 0) : next.div(cur).toNumber() - 1

/** Compare equipping `relic` into its best slot against the current loadout. */
export function compareRelic(s: GameState, relic: Relic): Comparison {
  const current = evaluate(s, s.equipped)

  let best: Comparison | null = null
  for (let slot = 0; slot < s.equipped.length; slot++) {
    const next = [...s.equipped]
    next[slot] = relic
    const e = evaluate(s, next)
    const cmp: Comparison = {
      dpsDelta: ratio(e.dps, current.dps),
      survivalDelta:
        !Number.isFinite(e.survival) && !Number.isFinite(current.survival)
          ? 0
          : !Number.isFinite(e.survival)
            ? 1
            : !Number.isFinite(current.survival)
              ? -1
              : (e.survival - current.survival) / Math.max(0.001, current.survival),
      survivalNow: current.survival,
      survivalNext: e.survival,
      intoEmptySlot: s.equipped[slot] === null,
      slot,
    }
    // Prefer the slot that helps most, counting survival at half weight.
    const score = (c: Comparison) => c.dpsDelta + c.survivalDelta * 0.5
    if (!best || score(cmp) > score(best)) best = cmp
  }
  return best!
}
