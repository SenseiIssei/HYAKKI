import Decimal from 'break_infinity.js'
import { BALANCE as B } from '../content/balance'
import { TREE_BY_ID, keystoneFlags } from '../content/tree'
import { step } from './combat'
import { addKeyTime } from './descent'
import { spawnEnemy, spawnFor } from './enemies'
import { boneFromKill, costOfNext, enemiesPerRank, isStandRank } from './formulas'
import { canReveille, projectedAsh, reveille } from './prestige'
import { computeStats } from './stats'
import type { GameState, StatBlock } from './types'

/**
 * Offline progress. docs/12-ROADMAP.md Phase 3
 *
 * A naive `step(state, 3_456_000)` for a full 96-hour window costs ~1.9s on a
 * warm machine, which is a visible freeze on the screen the player sees first.
 * So: measure one Rank by really simulating it, then extrapolate the next few
 * from the known enemy-growth curve, then measure again. Everything dangerous
 * — Stands, low health, anything that could kill you — always falls back to the
 * real simulation, because getting a death wrong would be unforgivable.
 */

/** Below this fraction of Max Health, stop guessing and simulate for real. */
const RISK_FLOOR = 0.35
/** How many Ranks one measured Rank is allowed to speak for. */
const MAX_JUMP = 24

export type OfflineReport = {
  awayMs: number
  creditedMs: number
  ranksCleared: number
  deepestRank: number
  kills: number
  deaths: number
  reveilles: number
  ashGained: Decimal
  boneGained: Decimal
  relics: number
  standsHeld: number
  line: string
}

export function offlineWindowMs(s: GameState, st: StatBlock): number {
  const f = keystoneFlags(s.treeLevels)
  let hours = B.OFFLINE_WINDOW_H_BASE + st.offline
  if (f.has('vigil50')) hours *= 1.5
  if (f.has('vigil75')) hours *= 1.5
  return hours * 3600_000
}

export function offlineEfficiency(s: GameState): number {
  // Vow of the Waking: the Column does not march without you at all.
  if (s.vows.includes('waking')) return 0
  return keystoneFlags(s.treeLevels).has('vigil25') ? 1 : B.OFFLINE_EFFICIENCY
}

/**
 * Standing Orders tier 2: spend Ash down the player's priority list.
 * Only ever buys what they explicitly ranked — it never guesses a build.
 */
export function autoBuy(s: GameState): number {
  if (!s.orders.enabled || !s.orders.autoBuy) return 0
  let bought = 0
  for (let guard = 0; guard < 500; guard++) {
    let did = false
    for (const id of s.orders.priority) {
      const node = TREE_BY_ID[id]
      if (!node) continue
      const cost = costOfNext(node.base, B.TREE_NODE_SCALE, s.treeLevels[id] ?? 0, 1)
      if (s.ash.lt(cost)) continue
      s.ash = s.ash.sub(cost)
      s.ashSpentTotal = s.ashSpentTotal.add(cost)
      s.ashSpentThisAscension = s.ashSpentThisAscension.add(cost)
      s.treeLevels[id] = (s.treeLevels[id] ?? 0) + 1
      bought++
      did = true
      break // always restart at the top of the list
    }
    if (!did) break
  }
  return bought
}

/** Auto-Reveille, shared by the offline catch-up and the live loop. */
export function shouldReveille(s: GameState, idleTicks: number): boolean {
  const o = s.orders
  if (!o.enabled) return false
  if (!canReveille(s)) return false
  if (s.dead) return true
  if (s.lastAsh.gt(0) && projectedAsh(s).gte(s.lastAsh.mul(o.ashMultiple))) return true
  if (idleTicks >= o.stallMinutes * 60 * B.TICKS_PER_SEC) return true
  return false
}

/** Total enemy health in a Rank — the thing that sets how long it takes. */
function rankWeight(rank: number): Decimal {
  const count = enemiesPerRank(rank)
  let total = new Decimal(0)
  // Sample a few rather than all: families are seeded, so this is stable.
  const probes = Math.min(count, 3)
  for (let i = 0; i < probes; i++) {
    total = total.add(spawnEnemy(rank, i, 1).maxHp)
  }
  return total.div(probes).mul(count)
}

function rankThreat(rank: number): Decimal {
  return spawnEnemy(rank, 0, 1).atk
}

function placeAtRank(s: GameState, rank: number) {
  s.rank = rank
  if (rank > s.bestRank) s.bestRank = rank
  if (rank > s.bestRankEver) s.bestRankEver = rank
  s.enemyIndex = 0
  s.enemiesThisRank = enemiesPerRank(rank)
  s.standTimer = 0
  s.enemy = spawnFor(s, rank, 0)
  s.freshEnemy = true
}

const FLAVOUR = [
  'Something kept the count for you.',
  'You do not remember any of it. The Ash does.',
  'The Column did not stop. It never has.',
  'Nobody woke you. That was the arrangement.',
  'It went on without you and it went on as you.',
]

export function catchUp(s: GameState, elapsedMs: number): OfflineReport {
  const st0 = computeStats(s)
  const windowMs = offlineWindowMs(s, st0)
  const credited = Math.max(0, Math.min(elapsedMs, windowMs))
  let ticksLeft = Math.floor((credited * offlineEfficiency(s)) / B.TICK_MS)

  // Keys accrue over the whole absence, not just the credited window — being
  // away should never cost you Keys.
  addKeyTime(s, elapsedMs)

  const before = {
    kills: s.totalKills,
    deaths: s.totalDeaths,
    ash: s.ash.add(0),
    bone: s.bone.add(0),
    relics: s.inventory.length,
    rank: s.rank,
    best: s.bestRankEver,
    reveilles: s.reveilles,
  }
  let standsHeld = 0
  let ranksCleared = 0
  let idleTicks = 0

  // A hard bound on iterations: this must never be able to hang the tab.
  let guard = 200_000

  while (ticksLeft > 0 && guard-- > 0) {
    if (s.dead) {
      if (!s.orders.enabled || !canReveille(s)) break
      s.lastAsh = projectedAsh(s)
      reveille(s)
      autoBuy(s)
      continue
    }

    if (shouldReveille(s, idleTicks)) {
      s.lastAsh = projectedAsh(s)
      reveille(s)
      autoBuy(s)
      idleTicks = 0
      continue
    }

    const st = computeStats(s)

    // ── the real simulation, for anything that matters ──
    // Stands are timed and can end the run; low health can kill. Never guess.
    // The threshold is a direct speed//safety trade: at 0.6 a Hoplite spends
    // most of a run below it and the fast path never engages (measured: 1.8s
    // for a 207h window). At 0.35 there is still a wide margin before anything
    // can die inside an extrapolated span.
    const risky = isStandRank(s.rank) || s.soldier.hp.lt(st.hp.mul(RISK_FLOOR))
    const rankBefore = s.rank
    const standsBefore = s.standsThisRun

    if (risky) {
      const n = Math.min(ticksLeft, 400)
      step(s, n)
      ticksLeft -= n
      idleTicks = s.rank === rankBefore ? idleTicks + n : 0
      if (s.rank > rankBefore) ranksCleared += s.rank - rankBefore
      standsHeld += s.standsThisRun - standsBefore
      continue
    }

    // ── measure one Rank for real ──
    const hpBefore = s.soldier.hp
    let used = 0
    const budget = Math.min(ticksLeft, 20_000)
    while (used < budget && s.rank === rankBefore && !s.dead) {
      const n = Math.min(200, budget - used)
      step(s, n)
      used += n
    }
    ticksLeft -= used
    if (s.dead) {
      idleTicks = 0
      continue
    }
    if (s.rank === rankBefore) {
      // Walled: this Rank is not going to fall. Let the stall rule fire.
      idleTicks += used
      continue
    }
    ranksCleared += s.rank - rankBefore
    standsHeld += s.standsThisRun - standsBefore
    idleTicks = 0

    // ── extrapolate the Ranks after it ──
    const measuredTicks = Math.max(1, used)
    const measuredWeight = rankWeight(rankBefore)
    const measuredThreat = rankThreat(rankBefore)
    const hpLoss = hpBefore.sub(s.soldier.hp) // may be negative (net healing)
    const lossRate = hpLoss.div(measuredTicks)

    let rank = s.rank
    let hp = s.soldier.hp
    let bone = new Decimal(0)
    let kills = 0
    let spent = 0
    let jumped = 0

    // Stop before the next Stand; that one gets simulated properly.
    while (jumped < MAX_JUMP && ticksLeft - spent > 0 && !isStandRank(rank)) {
      const w = rankWeight(rank)
      const ticks = Math.ceil(
        (measuredTicks * w.div(measuredWeight).toNumber()) || measuredTicks,
      )
      if (!Number.isFinite(ticks) || ticks <= 0) break
      if (spent + ticks > ticksLeft) break

      const threatRatio = rankThreat(rank).div(measuredThreat).toNumber()
      const loss = lossRate.mul(ticks).mul(Number.isFinite(threatRatio) ? threatRatio : 1)
      const next = hp.sub(loss)
      // Anything that looks survivable-but-close goes back to the real sim.
      if (next.lte(st.hp.mul(RISK_FLOOR))) break

      const count = enemiesPerRank(rank)
      bone = bone.add(boneFromKill(rank, 'chaff', st.bf).mul(count))
      kills += count
      hp = Decimal.min(st.hp, next)
      spent += ticks
      rank++
      jumped++
    }

    if (jumped > 0) {
      s.bone = s.bone.add(bone)
      s.totalKills += kills
      s.killsThisRun += kills
      s.soldier.hp = hp
      s.runTicks += spent
      s.totalTicks += spent
      ticksLeft -= spent
      ranksCleared += jumped
      placeAtRank(s, rank)
    }
  }

  const rng = (s.rngState >>> 3) % FLAVOUR.length
  return {
    awayMs: elapsedMs,
    creditedMs: credited,
    ranksCleared,
    deepestRank: s.bestRankEver,
    kills: s.totalKills - before.kills,
    deaths: s.totalDeaths - before.deaths,
    reveilles: s.reveilles - before.reveilles,
    ashGained: s.ash.sub(before.ash),
    boneGained: Decimal.max(s.bone.sub(before.bone), 0),
    relics: Math.max(0, s.inventory.length - before.relics),
    standsHeld,
    line: FLAVOUR[rng],
  }
}
