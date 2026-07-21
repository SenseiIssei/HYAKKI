import { describe, expect, it } from 'vitest'
import Decimal from 'break_infinity.js'
import { BALANCE } from '../content/balance'
import { BONE_UPGRADES } from '../content/upgrades'
import { TREE, keystoneFlags } from '../content/tree'
import { AFFIX_BY_ID, UNIQUES, UNIQUE_BY_ID, slotsFor } from '../content/relics'
import { CLASSES, classUnlocked } from '../content/classes'
import { CLASS_LOOKS } from '../ui/Opening'
import { KEGARE_BANDS, bandFor, kegareFromKill, purificationCost } from '../content/kegare'
import { OFUDA, OFUDA_BY_ID, wardFailChance } from '../content/ofuda'
import { SPECIES } from '../pixel/species'
import { yokaiFrame } from '../pixel/yokai'
import {
  ABILITY_BY_ID,
  abilityCooldownSec,
  abilityLevel,
  abilityMult,
  abilityTier,
  abilityUnlocked,
} from '../content/abilities'
import { compareRelic } from './evaluate'
import { maxEchoes } from './ghosts'
import { rollRelic } from './relics'
import { VOWS, vowAshMult } from '../content/vows'
import { LAYER_BY_ID } from '../content/layers'
import { OBSERVATIONS, newObservations } from '../content/achievements'
import { spawnEnemy, spawnForRank } from './enemies'
import {
  addKeyTime,
  autoRoute,
  descentDurationMs,
  descentRank,
  descentReady,
  estimateClear,
  generateMap,
  keyCap,
  newDescent,
  resolveDescent,
  validRoute,
  wholeKeys,
} from './descent'
import { hashSeed } from './rng'
import { catchUp, offlineEfficiency, offlineWindowMs, shouldReveille } from './offline'
import {
  CANDLE_COUNT,
  FRAGMENTS,
  canSnuffHundredth,
  newFragments,
  roomDarkness,
} from '../content/fragments'
import { fightMyriad, myriadHp, myriadReady } from './myriad'
import {
  apotheosis,
  canInter,
  canReveille,
  interment,
  projectedAsh,
  projectedIchor,
  projectedNames,
  recant,
  reveille,
} from './prestige'
import { createInitialState, resetRun } from './state'
import { step } from './combat'
import {
  armorK,
  ashOnReveille,
  boneFromKill,
  costOfNext,
  enemiesPerRank,
  growth,
  isStandRank,
  mitigation,
} from './formulas'
import { computeStats } from './stats'
import { buildSigil } from '../render/sigil'
import { FAMILY_PRESETS } from '../render/presets'

describe('formulas', () => {
  it('growth is monotonic and gears up at 100', () => {
    expect(growth(10).lt(growth(11))).toBe(true)
    const preGear = growth(99).div(growth(98)).toNumber()
    const postGear = growth(101).div(growth(100)).toNumber()
    expect(postGear).toBeGreaterThan(preGear)
  })

  it('armor never fully blocks: 5% floor holds at absurd armor', () => {
    expect(mitigation(new Decimal('1e40'), 1)).toBeCloseTo(0.05, 5)
    expect(mitigation(new Decimal(0), 1)).toBe(1)
  })

  it('at armor === K you take exactly half', () => {
    const k = armorK(50)
    expect(mitigation(k, 50)).toBeCloseTo(0.5, 6)
  })

  it('enemies per ri grows with depth and then caps', () => {
    expect(enemiesPerRank(1)).toBe(BALANCE.ENEMIES_PER_RANK_BASE)
    expect(enemiesPerRank(10000)).toBe(BALANCE.ENEMIES_PER_RANK_CAP)
    expect(enemiesPerRank(200)).toBeGreaterThan(enemiesPerRank(1))
  })

  it('ash is exponential in depth — every rank multiplies the payout', () => {
    // This is the property that makes the game compound at all. A polynomial
    // reward against exponential enemy growth converges to a fixed point.
    const ratioLow = ashOnReveille(51, 1).toNumber() / ashOnReveille(50, 1).toNumber()
    const ratioHigh = ashOnReveille(301, 1).toNumber() / ashOnReveille(300, 1).toNumber()
    expect(ratioLow).toBeCloseTo(BALANCE.ASH_GROWTH, 2)
    // crucially, the per-rank ratio does NOT decay with depth
    expect(ratioHigh).toBeCloseTo(ratioLow, 2)
  })

  it('the primary tree nodes compound rather than adding', () => {
    const a = createInitialState('hoplite', 1)
    const b = createInitialState('hoplite', 1)
    a.treeLevels.edge = 10
    b.treeLevels.edge = 20
    const ten = computeStats(a).atk.div(computeStats(createInitialState('hoplite', 1)).atk)
    const twenty = computeStats(b).atk.div(computeStats(createInitialState('hoplite', 1)).atk)
    // doubling the levels must more than double the effect
    expect(twenty.div(ten).toNumber()).toBeGreaterThan(ten.toNumber() * 0.99)
  })
})

describe('combat', () => {
  it('is deterministic for a given seed', () => {
    const a = createInitialState('hoplite', 12345)
    const b = createInitialState('hoplite', 12345)
    step(a, 3000)
    step(b, 3000)
    expect(a.rank).toBe(b.rank)
    expect(a.bone.toString()).toBe(b.bone.toString())
    expect(a.totalKills).toBe(b.totalKills)
  })

  it('a fresh soldier makes progress and eventually hits a wall', () => {
    const s = createInitialState('hoplite', 999)
    step(s, 6000) // 10 minutes
    expect(s.rank).toBeGreaterThan(1)
    expect(s.bone.gt(0)).toBe(true)
  })

  it('never leaves health above maximum', () => {
    const s = createInitialState('hoplite', 7)
    step(s, 2000)
    expect(s.soldier.hp.lte(computeStats(s).hp)).toBe(true)
  })

  it('class curses apply', () => {
    const hop = computeStats(createInitialState('hoplite', 1))
    const aug = computeStats(createInitialState('augur', 1))
    // the curse is relative to base, not to a hard-coded 1.0 — that encoded
    // the old BASE_SPD and broke the moment pacing was tuned
    expect(hop.spd).toBeLessThan(BALANCE.BASE_SPD)
    expect(aug.hp.lt(hop.hp)).toBe(true)
  })
})

/**
 * A DESIGN test, not a unit test. It fails when balance drifts out of the band
 * in docs/03-COMBAT-MATH.md § 9, which is exactly when we want to be told.
 */
describe('balance band (first run, naive player)', () => {
  function firstRun(classId: string) {
    const s = createInitialState(classId, 1337)
    s.soldier.hp = computeStats(s).hp
    let worstTtk = 0
    let worstStandTtk = 0
    let rankStart = 0
    let lastRank = 1

    for (let t = 0; t < 60 * 60 * 10 && !s.dead; t++) {
      step(s, 1)
      // buy the cheapest affordable upgrade, repeatedly
      for (;;) {
        let best: { id: string; cost: Decimal } | null = null
        for (const u of BONE_UPGRADES) {
          const cost = costOfNext(u.base, BALANCE.BONE_UPGRADE_SCALE, s.boneLevels[u.id] ?? 0, 1)
          if (s.bone.lt(cost)) continue
          if (!best || cost.lt(best.cost)) best = { id: u.id, cost }
        }
        if (!best) break
        s.bone = s.bone.sub(best.cost)
        s.boneLevels[best.id] = (s.boneLevels[best.id] ?? 0) + 1
      }
      if (s.rank !== lastRank) {
        const elapsed = (s.runTicks - rankStart) / BALANCE.TICKS_PER_SEC
        // A Stand is one Warden, not a rank of chaff — it has its own band.
        if (isStandRank(lastRank)) {
          worstStandTtk = Math.max(worstStandTtk, elapsed)
        } else if (lastRank > 2) {
          worstTtk = Math.max(worstTtk, elapsed / enemiesPerRank(lastRank))
        }
        rankStart = s.runTicks
        lastRank = s.rank
      }
    }
    return {
      rank: s.rank,
      seconds: s.runTicks / BALANCE.TICKS_PER_SEC,
      worstTtk,
      worstStandTtk,
      stands: s.standsThisRun,
      dead: s.dead,
    }
  }

  for (const classId of ['hoplite', 'lampbearer', 'augur']) {
    it(`${classId}: run one ends at a sensible depth, in a sensible time`, () => {
      const r = firstRun(classId)
      expect(r.dead).toBe(true)
      // deep enough to feel like progress, shallow enough to want another go
      expect(r.rank).toBeGreaterThanOrEqual(18)
      expect(r.rank).toBeLessThanOrEqual(55)
      expect(r.seconds).toBeGreaterThan(60)
      expect(r.seconds).toBeLessThan(900)
      // A fight longer than this means the player is at a wall they can't read.
      // Widened from 6 to 7 when kegare landed, deliberately and with the A/B
      // in hand: defilement pushes a first run DEEPER (augur went Ri 40 -> 50,
      // 311s -> 470s), and "worst TTK across the run" naturally rises when you
      // reach harder content. The augur's worst went 4.8 -> 6.2 while getting
      // 25% further, which is the trade working, not a wall appearing.
      expect(r.worstTtk).toBeLessThan(7)
      // they should meet at least the Quartermaster on run one
      expect(r.stands).toBeGreaterThanOrEqual(1)
      // a Stand is meant to be an event: long enough to be tense, not a slog
      expect(r.worstStandTtk).toBeGreaterThan(3)
      expect(r.worstStandTtk).toBeLessThan(30)
    })
  }
})

describe('prestige', () => {
  it('reveille wipes the run, keeps the tree, and pays out', () => {
    const s = createInitialState('hoplite', 55)
    step(s, 60 * 60 * 4)
    const rank = s.bestRank
    s.treeLevels.edge = 5
    const gained = reveille(s)

    expect(gained.gt(0)).toBe(true)
    expect(s.ash.eq(gained)).toBe(true)
    expect(s.rank).toBe(1)
    expect(s.bone.eq(0)).toBe(true)
    expect(s.boneLevels).toEqual({})
    expect(s.treeLevels.edge).toBe(5) // survives
    expect(s.bestRankEver).toBeGreaterThanOrEqual(rank)
    expect(s.soldierNumber).toBe(2)
    expect(s.dead).toBe(false)
  })

  it('recant returns every Ash ever spent', () => {
    const s = createInitialState('hoplite', 7)
    s.ash = new Decimal(10_000)
    const before = s.ash.add(0)
    s.treeLevels.meat = 0
    // spend by hand the way the store does
    const cost = costOfNext(8, BALANCE.TREE_NODE_SCALE, 0, 12)
    s.ash = s.ash.sub(cost)
    s.ashSpentTotal = s.ashSpentTotal.add(cost)
    s.treeLevels.meat = 12

    recant(s)
    expect(s.ash.toNumber()).toBeCloseTo(before.toNumber(), 4)
    expect(s.treeLevels).toEqual({})
  })

  it('the first Reveille can actually afford something', () => {
    const s = createInitialState('hoplite', 4242)
    step(s, 60 * 60 * 8)
    reveille(s)
    const cheapest = Math.min(...TREE.filter((n) => !n.requires).map((n) => n.base))
    expect(s.ash.gte(cheapest)).toBe(true)
  })

  it('compounds: depth grows run over run', () => {
    const s = createInitialState('hoplite', 4242)
    const depths: number[] = []

    for (let run = 0; run < 6; run++) {
      // Run to death, not to a clock — a fixed time budget truncates later
      // runs (which legitimately last longer) and reads as a false stall.
      // Bone is spent as it comes in, because that is what a player does.
      for (let t = 0; t < 60 * 60 * 40 && !s.dead; t++) {
        step(s, 1)
        for (;;) {
          let best: { id: string; cost: Decimal } | null = null
          for (const u of BONE_UPGRADES) {
            const c = costOfNext(u.base, BALANCE.BONE_UPGRADE_SCALE, s.boneLevels[u.id] ?? 0, 1)
            if (s.bone.lt(c)) continue
            if (!best || c.lt(best.cost)) best = { id: u.id, cost: c }
          }
          if (!best) break
          s.bone = s.bone.sub(best.cost)
          s.boneLevels[best.id] = (s.boneLevels[best.id] ?? 0) + 1
        }
      }
      depths.push(s.bestRank)
      reveille(s)
      // greedy: always buy the cheapest tree level available
      for (;;) {
        let best: { id: string; cost: Decimal } | null = null
        for (const n of TREE) {
          if (n.requires) continue
          const c = costOfNext(n.base, BALANCE.TREE_NODE_SCALE, s.treeLevels[n.id] ?? 0, 1)
          if (s.ash.lt(c)) continue
          if (!best || c.lt(best.cost)) best = { id: n.id, cost: c }
        }
        if (!best) break
        s.ash = s.ash.sub(best.cost)
        s.ashSpentTotal = s.ashSpentTotal.add(best.cost)
        s.treeLevels[best.id] = (s.treeLevels[best.id] ?? 0) + 1
      }
      s.soldier.hp = computeStats(s).hp
    }

    expect(depths[5]).toBeGreaterThan(depths[0])
    // and it should not have stalled at a fixed point along the way
    expect(depths[5]).toBeGreaterThan(depths[2])
    // every run should reach at least as deep as the one before it
    for (let i = 1; i < depths.length; i++) {
      expect(depths[i]).toBeGreaterThanOrEqual(depths[i - 1])
    }
  })
})

describe('stands', () => {
  it('every 10th rank is a single Warden', () => {
    expect(isStandRank(10)).toBe(true)
    expect(isStandRank(11)).toBe(false)
    const s = createInitialState('hoplite', 9)
    s.rank = 9
    s.enemyIndex = 0
    step(s, 1)
    // walk forward until a stand begins
    for (let i = 0; i < 60 * 60 * 5 && !s.dead && !s.enemy.isWarden; i++) step(s, 1)
    if (!s.dead) {
      expect(s.enemy.isWarden).toBe(true)
      expect(s.enemiesThisRank).toBe(1)
      expect(s.standTimer).toBeGreaterThan(0)
    }
  })

  it('a failed stand pushes back rather than killing', () => {
    const s = createInitialState('hoplite', 3)
    s.rank = 20
    s.standsThisRun = 0
    s.seen['warden.20'] = true
    // force the stand, then let the clock run out
    s.enemy = { ...s.enemy }
    s.rank = 19
    s.enemyIndex = s.enemiesThisRank
    step(s, 1)
    const before = s.rank
    if (s.standTimer > 0) {
      s.standTimer = 1
      step(s, 2)
      expect(s.dead).toBe(false)
      expect(s.standFails).toBe(1)
      expect(s.rank).toBeLessThan(before)
    }
  })
})

describe('keystones', () => {
  it('flags turn on at their level and not before', () => {
    expect(keystoneFlags({ meat: 24 }).has('meat25')).toBe(false)
    expect(keystoneFlags({ meat: 25 }).has('meat25')).toBe(true)
    expect(keystoneFlags({ meat: 100 }).size).toBe(4)
  })

  it('MEAT 25 turns Max Health into Regeneration', () => {
    const a = createInitialState('hoplite', 1)
    const b = createInitialState('hoplite', 1)
    b.treeLevels.meat = 25
    expect(computeStats(b).reg.gt(computeStats(a).reg)).toBe(true)
  })

  it('every keystone in the tree has a unique id', () => {
    const ids = TREE.flatMap((n) => n.keystones.map((k) => k.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every node has exactly four keystones at 25/50/75/100', () => {
    for (const n of TREE) {
      expect(n.keystones.map((k) => k.level)).toEqual([25, 50, 75, 100])
    }
  })
})

describe('relics', () => {
  it('roll deterministically from a seed', () => {
    const a = rollRelic(1234, 100)
    const b = rollRelic(1234, 100)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('never roll the same affix twice on one relic', () => {
    for (let seed = 0; seed < 300; seed++) {
      const r = rollRelic(seed, 250)
      expect(new Set(r.affixes.map((a) => a.id)).size).toBe(r.affixes.length)
    }
  })

  it('roll affix values inside their declared range', () => {
    for (let seed = 0; seed < 400; seed++) {
      const r = rollRelic(seed, 900)
      for (const a of r.affixes) {
        const def = AFFIX_BY_ID[a.id]
        expect(a.value).toBeGreaterThanOrEqual(def.min - 1e-9)
        expect(a.value).toBeLessThanOrEqual(def.max + 1e-9)
      }
    }
  })

  it('never drop a relic gated on a system that does not exist yet', () => {
    for (let seed = 0; seed < 3000; seed++) {
      const r = rollRelic(seed, 500, 4)
      if (r.unique) expect(UNIQUE_BY_ID[r.unique].requires).toBeUndefined()
    }
  })

  it('deeper drops roll better', () => {
    const roll = (rank: number) => {
      let total = 0
      for (let s = 0; s < 400; s++) {
        for (const a of rollRelic(s, rank).affixes) {
          const def = AFFIX_BY_ID[a.id]
          total += (a.value - def.min) / (def.max - def.min)
        }
      }
      return total / 400
    }
    expect(roll(800)).toBeGreaterThan(roll(20))
  })

  it('equipping a relic actually changes the stat block', () => {
    const s = createInitialState('hoplite', 5)
    const before = computeStats(s).atk
    s.equipped = [{ ...rollRelic(1, 100), affixes: [{ id: 'whetted', value: 0.3 }] }, null]
    expect(computeStats(s).atk.gt(before)).toBe(true)
  })

  it('slots open with depth and cap at six', () => {
    expect(slotsFor(1)).toBe(2)
    expect(slotsFor(60)).toBe(3)
    expect(slotsFor(400)).toBe(5)
    expect(slotsFor(999999, 5)).toBe(6)
  })

  it('True Names always cost something', () => {
    for (const u of UNIQUES.filter((x) => x.rarity === 'truename')) {
      expect(u.cost).toBeTruthy()
    }
  })
})

describe('the comparison card', () => {
  it('rates a strong relic above a weak one, and never mutates the game', () => {
    const s = createInitialState('hoplite', 21)
    step(s, 600)
    const snapshot = JSON.stringify({ rank: s.rank, hp: s.soldier.hp.toString(), bone: s.bone.toString() })

    const weak = { ...rollRelic(2, 50), affixes: [{ id: 'whetted', value: 0.06 }] }
    const strong = { ...rollRelic(3, 50), affixes: [{ id: 'whetted', value: 0.3 }] }
    const a = compareRelic(s, weak)
    const b = compareRelic(s, strong)

    expect(b.dpsDelta).toBeGreaterThan(a.dpsDelta)
    // the fork must not disturb the live run
    expect(JSON.stringify({ rank: s.rank, hp: s.soldier.hp.toString(), bone: s.bone.toString() }))
      .toBe(snapshot)
  })

  it('sees the value of pure defence as survival, not damage', () => {
    const s = createInitialState('hoplite', 31)
    step(s, 900)
    const heavy = { ...rollRelic(4, 50), affixes: [{ id: 'heavy', value: 0.4 }] }
    const cmp = compareRelic(s, heavy)
    expect(cmp.survivalDelta).toBeGreaterThan(0)
  })
})

describe('classes', () => {
  it('the earned classes stay locked until they are earned', () => {
    const none = { totalDeaths: 0, reveilles: 0, totalKills: 0 }
    const some = { totalDeaths: 25, reveilles: 10, totalKills: 5000 }
    for (const c of CLASSES) {
      if (!c.unlock) continue
      expect(classUnlocked(c, none)).toBe(false)
      expect(classUnlocked(c, some)).toBe(true)
    }
  })

  it('every class has a distinct signature', () => {
    const ids = CLASSES.map((c) => c.signature.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('REVENANT cannot heal, no matter what it buys', () => {
    const s = createInitialState('revenant', 1)
    s.treeLevels = { clot: 60, marrow: 60 }
    const st = computeStats(s)
    expect(st.reg.eq(0)).toBe(true)
    expect(st.ls).toBe(0)
  })

  it('CHORUS gets stronger with reveille count', () => {
    const few = createInitialState('chorus', 1)
    const many = createInitialState('chorus', 1)
    many.reveilles = 120
    expect(maxEchoes(many)).toBeGreaterThan(maxEchoes(few))
    expect(maxEchoes(many)).toBeLessThanOrEqual(12)
  })

  it('all six classes survive a run without throwing', () => {
    for (const c of CLASSES) {
      const s = createInitialState(c.id, 77)
      s.reveilles = 60
      s.echoes = maxEchoes(s)
      expect(() => step(s, 60 * 60 * 3)).not.toThrow()
      expect(s.rank).toBeGreaterThan(0)
    }
  })
})

describe('ghosts', () => {
  it('every reveille leaves one behind, capped', () => {
    const s = createInitialState('hoplite', 8)
    for (let i = 0; i < 5; i++) {
      step(s, 60 * 60 * 3)
      reveille(s)
    }
    expect(s.ghosts.length).toBe(5)
    expect(s.ghosts[0].soldierNumber).toBeLessThan(s.ghosts[4].soldierNumber)
  })
})

describe('offline catch-up', () => {
  const ready = (over = {}) => {
    const s = createInitialState('hoplite', 4242)
    s.treeLevels = { edge: 30, meat: 30, clot: 15, scar: 10, tithe: 10 }
    s.reveilles = 40
    s.orders = { enabled: true, ashMultiple: 1.5, stallMinutes: 5, autoBuy: false, priority: [] }
    Object.assign(s, over)
    s.soldier.hp = computeStats(s).hp
    return s
  }

  it('credits nothing for no time away', () => {
    const s = ready()
    const r = catchUp(s, 0)
    expect(r.creditedMs).toBe(0)
    expect(r.ranksCleared).toBe(0)
  })

  it('caps at the offline window, and VIGIL widens it', () => {
    const base = ready()
    const wide = ready({ treeLevels: { edge: 30, meat: 30, vigil: 12 } })
    expect(offlineWindowMs(wide, computeStats(wide))).toBeGreaterThan(
      offlineWindowMs(base, computeStats(base)),
    )
    const r = catchUp(base, 1000 * 3600_000)
    expect(r.creditedMs).toBeLessThanOrEqual(offlineWindowMs(base, computeStats(base)))
  })

  it('agrees with really simulating the same span, within a few percent', () => {
    const hours = 1
    const fast = ready()
    catchUp(fast, hours * 3600_000)

    const real = ready()
    const ticks = Math.floor((hours * 3600_000 * BALANCE.OFFLINE_EFFICIENCY) / BALANCE.TICK_MS)
    let done = 0
    while (done < ticks) {
      const n = Math.min(2000, ticks - done)
      step(real, n)
      done += n
      if (real.dead) {
        if (!canReveille(real)) break
        reveille(real)
        real.soldier.hp = computeStats(real).hp
      }
    }

    // Depth is the number that matters, and it must not drift.
    const drift = Math.abs(fast.bestRankEver - real.bestRankEver) / real.bestRankEver
    expect(drift).toBeLessThan(0.1)

    // Reveille COUNT is a weaker proxy and the two paths legitimately diverge on
    // it: once auto-cast abilities land, a real run dies-and-cycles fast at a
    // lethal wall, while the offline extrapolator stalls more conservatively.
    // The invariant that actually protects the player is one-sided — offline
    // must never OVER-credit reveilles (that would be free progress) — and it
    // must be in the same ballpark, not silently zero.
    expect(fast.reveilles).toBeLessThanOrEqual(real.reveilles + 3)
    expect(fast.reveilles).toBeGreaterThan(0)
  })

  it('is fast enough for the screen the player sees first', () => {
    const s = ready()
    const t0 = Date.now()
    catchUp(s, 96 * 3600_000)
    expect(Date.now() - t0).toBeLessThan(600)
  })

  it('never runs without Standing Orders enabled', () => {
    const s = ready({
      orders: { enabled: false, ashMultiple: 1.5, stallMinutes: 5, autoBuy: false, priority: [] },
    })
    const r = catchUp(s, 12 * 3600_000)
    // it still marches, but it cannot wake itself, so it stops at the first death
    expect(r.reveilles).toBe(0)
  })

  it('produces a report that adds up', () => {
    const s = ready()
    const before = s.totalKills
    const r = catchUp(s, 6 * 3600_000)
    expect(r.kills).toBe(s.totalKills - before)
    expect(r.ranksCleared).toBeGreaterThan(0)
    expect(r.ashGained.gte(0)).toBe(true)
    expect(r.line.length).toBeGreaterThan(0)
  })
})

describe('standing orders', () => {
  const s0 = () => {
    const s = createInitialState('hoplite', 11)
    s.reveilles = 40
    s.bestRank = 60
    s.lastAsh = new Decimal(100)
    s.orders = { enabled: true, ashMultiple: 1.5, stallMinutes: 5, autoBuy: false, priority: [] }
    return s
  }

  it('does nothing while disabled', () => {
    const s = s0()
    s.orders.enabled = false
    s.dead = true
    expect(shouldReveille(s, 0)).toBe(false)
  })

  it('wakes on death', () => {
    const s = s0()
    s.dead = true
    expect(shouldReveille(s, 0)).toBe(true)
  })

  it('wakes once the run is worth the multiple', () => {
    const s = s0()
    s.lastAsh = projectedAsh(s).div(1.6)
    expect(shouldReveille(s, 0)).toBe(true)
    s.lastAsh = projectedAsh(s).mul(10)
    expect(shouldReveille(s, 0)).toBe(false)
  })

  it('wakes after stalling', () => {
    const s = s0()
    s.lastAsh = projectedAsh(s).mul(100)
    expect(shouldReveille(s, 0)).toBe(false)
    expect(shouldReveille(s, 5 * 60 * BALANCE.TICKS_PER_SEC)).toBe(true)
  })
})

describe('interment and names', () => {
  const deep = () => {
    const s = createInitialState('hoplite', 17)
    s.ashSpentThisAscension = new Decimal('1e20')
    s.treeLevels = { edge: 40, meat: 40 }
    s.ash = new Decimal(500)
    s.reveilles = 40
    return s
  }

  it('names stay a currency you can count', () => {
    // The original sqrt(ash) formula produced 9e128 Names over 100 Reveilles.
    const s = deep()
    s.ashSpentThisAscension = new Decimal('1e250')
    expect(projectedNames(s)).toBeLessThan(1000)
    expect(projectedNames(s)).toBeGreaterThan(10)
  })

  it('names grow linearly with depth, not explosively', () => {
    const a = deep()
    const b = deep()
    a.ashSpentThisAscension = new Decimal('1e20')
    b.ashSpentThisAscension = new Decimal('1e40')
    // doubling the exponent should roughly double the Names
    const ratio = projectedNames(b) / projectedNames(a)
    expect(ratio).toBeGreaterThan(1.5)
    expect(ratio).toBeLessThan(2.5)
  })

  it('Wardens alone do not open Interment', () => {
    const s = createInitialState('hoplite', 1)
    s.wardenNames = 6
    expect(projectedNames(s)).toBe(6)
    expect(canInter(s)).toBe(false)
  })

  it('interment burns the tree and keeps the Names', () => {
    const s = deep()
    s.wardenNames = 3
    const expected = projectedNames(s)
    const gained = interment(s)

    expect(gained).toBe(expected)
    expect(s.names).toBe(expected)
    expect(s.treeLevels).toEqual({})
    expect(s.ash.eq(0)).toBe(true)
    expect(s.ashSpentThisAscension.eq(0)).toBe(true)
    expect(s.wardenNames).toBe(0)
    expect(s.interments).toBe(1)
    expect(s.rank).toBe(1)
    // ghosts and relics survive being buried
    expect(s.ghosts).toBeDefined()
  })
})

describe('vows', () => {
  const sworn = (...ids: string[]) => {
    const s = createInitialState('hoplite', 23)
    s.vows = ids
    return s
  }

  it('every vow multiplies Ash', () => {
    for (const v of VOWS) expect(v.ashMult).toBeGreaterThan(1)
  })

  it('vows stack multiplicatively', () => {
    expect(vowAshMult(['salt', 'silence'])).toBeCloseTo(2.2 * 1.8, 5)
  })

  it('Vow of Salt actually closes the Bone upgrades', () => {
    const free = createInitialState('hoplite', 23)
    free.boneLevels = { reinforce: 20 }
    const vowed = sworn('salt')
    vowed.boneLevels = { reinforce: 20 }
    expect(computeStats(vowed).atk.lt(computeStats(free).atk)).toBe(true)
  })

  it('Vow of the Open Coat actually zeroes Armor', () => {
    const s = sworn('opencoat')
    s.treeLevels = { scar: 50 }
    expect(computeStats(s).arm.eq(0)).toBe(true)
  })

  it('Vow of Poverty actually ignores relics', () => {
    const s = sworn('poverty')
    s.equipped = [{ ...rollRelic(1, 100), affixes: [{ id: 'whetted', value: 0.3 }] }, null]
    const bare = createInitialState('hoplite', 23)
    expect(computeStats(s).atk.eq(computeStats(bare).atk)).toBe(true)
  })

  it('Vow of the Waking actually stops offline progress', () => {
    const s = sworn('waking')
    expect(offlineEfficiency(s)).toBe(0)
    const r = catchUp(s, 12 * 3600_000)
    expect(r.ranksCleared).toBe(0)
  })

  it('Vow of the Long Count actually makes enemies grow faster', () => {
    const plain = createInitialState('hoplite', 23)
    step(plain, 10)
    const plainHp = plain.enemy.maxHp
    const s = sworn('longcount')
    step(s, 10)
    // same rank, harder enemy
    expect(s.rank).toBe(plain.rank)
    expect(s.enemy.maxHp.gt(plainHp)).toBe(true)
  })

  it('Vow of Silence actually stops the Signature', () => {
    const s = sworn('silence')
    s.soldier.resolve = 100
    step(s, 40)
    expect(s.sigKind).toBe('')
  })

  it('vows raise the Ash payout', () => {
    const plain = createInitialState('hoplite', 23)
    plain.bestRank = 60
    const vowed = sworn('longcount', 'salt')
    vowed.bestRank = 60
    expect(projectedAsh(vowed).gt(projectedAsh(plain))).toBe(true)
  })
})

describe('the returned', () => {
  const withGhosts = (n: number) => {
    const s = createInitialState('hoplite', 31)
    for (let i = 0; i < n; i++) {
      s.ghosts.push({
        soldierNumber: i + 1,
        classId: 'hoplite',
        deepestRank: 40 + i * 3,
        seed: 1000 + i,
        diedTo: 'something',
        affix: { id: 'whetted', value: 0.2 },
      })
    }
    return s
  }

  it('does not appear before there is anyone to reissue', () => {
    const none = createInitialState('hoplite', 31)
    for (let i = 0; i < 300; i++) {
      expect(spawnEnemy(200, i, 7, 0, none.ghosts).family).not.toBe('returned')
    }
  })

  it('does not appear in the shallows', () => {
    const s = withGhosts(20)
    for (let i = 0; i < 200; i++) {
      expect(spawnEnemy(20, i, 7, 0, s.ghosts).family).not.toBe('returned')
    }
  })

  it('wears a real past number, scaled to here', () => {
    const s = withGhosts(30)
    let found = null
    for (let i = 0; i < 400 && !found; i++) {
      const e = spawnEnemy(300, i, 7, 0, s.ghosts)
      if (e.family === 'returned') found = e
    }
    expect(found).not.toBeNull()
    expect(found!.ghost).toBeDefined()
    expect(found!.name).toMatch(/^Soldier #/)
    // its identity is old; its numbers are from HERE
    const chaffHere = spawnEnemy(300, 1, 7, 0, [])
    expect(found!.maxHp.gt(chaffHere.maxHp.div(10))).toBe(true)
    // and it carries an affix it had
    expect(found!.atk.gt(0)).toBe(true)
  })

  it('a run leaves exactly one ghost behind, with what it carried', () => {
    const s = createInitialState('hoplite', 31)
    s.equipped = [{ ...rollRelic(9, 80), affixes: [{ id: 'heavy', value: 0.25 }] }, null]
    step(s, 60 * 60 * 3)
    const before = s.ghosts.length
    reveille(s)
    expect(s.ghosts.length).toBe(before + 1)
    expect(s.ghosts[s.ghosts.length - 1].affix?.id).toBe('heavy')
  })
})

describe('descents', () => {
  const diver = () => {
    const s = createInitialState('hoplite', 4242)
    s.bestRankEver = 400
    s.treeLevels = { edge: 60, meat: 60, clot: 30 }
    s.interments = 1
    s.layerNames = 14
    s.keys = 3
    s.soldier.hp = computeStats(s).hp
    return s
  }

  it('maps are deterministic and fully connected', () => {
    for (let seed = 0; seed < 40; seed++) {
      const a = generateMap('ossuary', 8, seed)
      const b = generateMap('ossuary', 8, seed)
      expect(JSON.stringify(a)).toBe(JSON.stringify(b))

      // every non-final room leads somewhere, every non-entry room is reachable
      const reachable = new Set(a.entrances)
      for (const r of a.rooms) {
        if (r.floor < a.floors - 1) expect(r.next.length).toBeGreaterThan(0)
        for (const n of r.next) reachable.add(n)
      }
      for (const r of a.rooms) expect(reachable.has(r.id)).toBe(true)
    }
  })

  it('the last room is always the Warden, and only the last', () => {
    const map = generateMap('choir', 20, 5)
    const wardens = map.rooms.filter((r) => r.type === 'warden')
    expect(wardens.length).toBe(1)
    expect(wardens[0].floor).toBe(map.floors - 1)
  })

  it('rejects routes that are not walkable', () => {
    const map = generateMap('ossuary', 10, 3)
    const good = autoRoute(map)
    expect(validRoute(map, good)).toBe(true)
    expect(validRoute(map, [])).toBe(false)
    // stopping short of the Warden is not a route
    expect(validRoute(map, good.slice(0, good.length - 1))).toBe(false)
    // teleporting is not a route
    const jump = [map.entrances[0], map.rooms[map.rooms.length - 1].id]
    expect(validRoute(map, jump)).toBe(false)
  })

  it('resolves deterministically, so the estimate is a promise', () => {
    const s = diver()
    const map = generateMap('ossuary', 6, 11)
    const route = autoRoute(map)
    const a = resolveDescent(s, map, route, 999)
    const b = resolveDescent(s, map, route, 999)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('never disturbs the live game', () => {
    const s = diver()
    const before = JSON.stringify({
      rank: s.rank,
      hp: s.soldier.hp.toString(),
      kills: s.totalKills,
      inv: s.inventory.length,
    })
    const map = generateMap('ossuary', 6, 12)
    estimateClear(s, map, autoRoute(map), 4)
    expect(
      JSON.stringify({
        rank: s.rank,
        hp: s.soldier.hp.toString(),
        kills: s.totalKills,
        inv: s.inventory.length,
      }),
    ).toBe(before)
  })

  it('the estimate matches what actually happens', () => {
    const s = diver()
    const map = generateMap('ossuary', 6, 13)
    const route = autoRoute(map)
    const shown = estimateClear(s, map, route, 12)
    let wins = 0
    for (let i = 0; i < 40; i++) {
      if (resolveDescent(s, map, route, hashSeed('t', i)).cleared) wins++
    }
    expect(Math.abs(shown - wins / 40)).toBeLessThan(0.2)
  })

  it('depth raises the Rank and the reward together', () => {
    const s = diver()
    const layer = LAYER_BY_ID.ossuary
    expect(descentRank(s, layer, 40)).toBeGreaterThan(descentRank(s, layer, 1))
    expect(descentDurationMs(20)).toBeGreaterThan(descentDurationMs(1))
    expect(descentDurationMs(999)).toBeLessThanOrEqual(25 * 60_000)
  })

  it('a Key is spent and given back over time', () => {
    const s = diver()
    s.keys = 1
    const map = generateMap('ossuary', 3, 14)
    const d = newDescent(s, map, autoRoute(map))
    expect(d.result).toBeDefined()
    s.keys -= 1
    expect(wholeKeys(s)).toBe(0)
    addKeyTime(s, 20 * 60_000)
    expect(wholeKeys(s)).toBe(1)
    addKeyTime(s, 100 * 60_000)
    expect(wholeKeys(s)).toBeLessThanOrEqual(keyCap(s))
  })

  it('is not ready until its clock runs out', () => {
    const s = diver()
    const map = generateMap('ossuary', 3, 15)
    const d = newDescent(s, map, autoRoute(map))
    expect(descentReady(d, d.startedAt)).toBe(false)
    expect(descentReady(d, d.startedAt + d.durationMs)).toBe(true)
  })

  it('dying still brings back what was found on the way down', () => {
    const s = diver()
    s.bestRankEver = 40 // hopelessly out of depth
    const map = generateMap('choir', 40, 16)
    const r = resolveDescent(s, map, autoRoute(map), 21)
    if (!r.cleared) {
      expect(r.diedAt).not.toBeNull()
      expect(r.names).toBe(0)
      expect(new Decimal(r.ash).eq(0)).toBe(true)
    }
  })
})

describe('apotheosis', () => {
  const ascendable = () => {
    const s = createInitialState('hoplite', 71)
    s.namesSpentTotal = 30
    s.names = 5
    s.interments = 4
    s.treeLevels = { edge: 50 }
    s.ash = new Decimal(9999)
    s.layerNames = 14
    s.purchases = { slot: 2 }
    s.slotBonus = 2
    s.bestRankEver = 3000
    s.vows = ['salt']
    return s
  }

  it('ichor stays a small, countable number', () => {
    const s = ascendable()
    expect(projectedIchor(s)).toBeGreaterThan(0)
    expect(projectedIchor(s)).toBeLessThan(500)
  })

  it('burns everything Names bought and keeps what Ichor is', () => {
    const s = ascendable()
    s.ghosts.push({
      soldierNumber: 5, classId: 'hoplite', deepestRank: 100, seed: 1, diedTo: 'x',
    })
    s.fragments.push(1, 2)
    const expected = projectedIchor(s)
    const gained = apotheosis(s)

    expect(gained).toBe(expected)
    expect(s.ichor).toBe(expected)
    expect(s.apotheoses).toBe(1)
    // gone
    expect(s.names).toBe(0)
    expect(s.namesSpentTotal).toBe(0)
    expect(s.purchases).toEqual({})
    expect(s.layerNames).toBe(0)
    expect(s.interments).toBe(0)
    expect(s.treeLevels).toEqual({})
    expect(s.vows).toEqual([])
    expect(s.bestRankEver).toBe(1)
    // kept
    expect(s.ghosts.length).toBe(1)
    expect(s.fragments).toEqual([1, 2])
  })

  it('authors a Warden from the Ascension that just ended', () => {
    const s = ascendable()
    s.soldierNumber = 4102
    apotheosis(s)
    expect(s.authored).not.toBeNull()
    expect(s.authored!.soldierNumber).toBe(4102)
    expect(s.authored!.deepestRank).toBe(3000)
    expect(s.authored!.ascension).toBe(1)
  })
})

describe('ichor rules actually edit the curves', () => {
  const withRule = (id: string, n = 1) => {
    const s = createInitialState('hoplite', 3)
    s.rules[id] = n
    return s
  }

  it('THE COAT REMEMBERS stops the armor softcap chasing you', () => {
    const plain = createInitialState('hoplite', 3)
    step(plain, 1)
    const plainK = armorK(2000)
    step(withRule('softcap'), 1)
    expect(armorK(2000).lt(plainK)).toBe(true)
  })

  it('A THINNER FLOOR lowers the damage floor', () => {
    step(createInitialState('hoplite', 3), 1)
    const before = mitigation(new Decimal('1e40'), 1)
    step(withRule('floor'), 1)
    const after = mitigation(new Decimal('1e40'), 1)
    expect(before).toBeCloseTo(0.05, 4)
    expect(after).toBeCloseTo(0.02, 4)
  })

  it('IT LEARNS SLOWER moves the deep wall', () => {
    step(createInitialState('hoplite', 3), 1)
    const before = growth(5000)
    step(withRule('hardening', 3), 1)
    expect(growth(5000).lt(before)).toBe(true)
  })

  it('DEEPER POCKETS raises Bone growth', () => {
    step(createInitialState('hoplite', 3), 1)
    const before = boneFromKill(100, 'chaff', 1)
    step(withRule('bone', 2), 1)
    expect(boneFromKill(100, 'chaff', 1).gt(before)).toBe(true)
  })
})

describe('the nothing', () => {
  it('does not exist until you have ascended', () => {
    for (let i = 0; i < 300; i++) {
      expect(spawnEnemy(3000, i, 5, 0, [], false).family).not.toBe('nothing')
    }
  })

  it('does not exist above Rank 500', () => {
    for (let i = 0; i < 300; i++) {
      expect(spawnEnemy(400, i, 5, 0, [], true).family).not.toBe('nothing')
    }
  })

  it('turns up in the deep once you know what this place is', () => {
    let found = 0
    for (let i = 0; i < 400; i++) {
      if (spawnEnemy(3000, i, 5, 0, [], true).family === 'nothing') found++
    }
    expect(found).toBeGreaterThan(0)
  })

  it('has no name at all — every other thing here was given one', () => {
    for (let i = 0; i < 400; i++) {
      const e = spawnEnemy(3000, i, 5, 0, [], true)
      if (e.family === 'nothing') {
        expect(e.name).toBe('')
        return
      }
    }
  })

  it('erases: Armor does not apply to it', () => {
    const armoured = createInitialState('hoplite', 9)
    armoured.treeLevels = { scar: 80 }
    armoured.apotheoses = 1
    armoured.rank = 600
    armoured.soldier.hp = computeStats(armoured).hp

    const hpBefore = armoured.soldier.hp
    // force a Nothing in front of them
    let e = null
    for (let i = 0; i < 400 && !e; i++) {
      const c = spawnEnemy(600, i, 5, 0, [], true)
      if (c.family === 'nothing') e = c
    }
    expect(e).not.toBeNull()
    armoured.enemy = e!
    armoured.enemiesThisRank = 999999
    step(armoured, 300)
    expect(armoured.soldier.hp.lt(hpBefore)).toBe(true)
  })
})

describe('the myriad', () => {
  const veteran = (ghosts: number) => {
    const s = createInitialState('hoplite', 88)
    s.apotheoses = 1
    s.bestRankEver = 300
    s.treeLevels = { edge: 60, meat: 60 }
    // ghosts near where the player actually got — that is what a real history
    // looks like, and it is what the fight is made of
    for (let i = 0; i < ghosts; i++) {
      s.ghosts.push({
        soldierNumber: i + 1, classId: 'hoplite', deepestRank: 240 + (i % 60),
        seed: 500 + i, diedTo: 'something',
      })
    }
    s.soldier.hp = computeStats(s).hp
    return s
  }

  it('waits until there is enough of you', () => {
    expect(myriadReady(veteran(5))).toBe(false)
    expect(myriadReady(veteran(40))).toBe(true)
    const unascended = veteran(40)
    unascended.apotheoses = 0
    expect(myriadReady(unascended)).toBe(false)
  })

  it('is literally made of every run you have recorded', () => {
    const few = veteran(20)
    const many = veteran(60)
    expect(myriadHp(many).gt(myriadHp(few))).toBe(true)
  })

  it('resolves deterministically and never disturbs the live game', () => {
    const s = veteran(40)
    const before = JSON.stringify({ rank: s.rank, hp: s.soldier.hp.toString(), kills: s.totalKills })
    const a = fightMyriad(s, 5)
    const b = fightMyriad(s, 5)
    expect(a.felled).toBe(b.felled)
    expect(a.hp).toBe(b.hp)
    expect(JSON.stringify({ rank: s.rank, hp: s.soldier.hp.toString(), kills: s.totalKills }))
      .toBe(before)
  })

  it('reports how far through yourself you got', () => {
    const r = fightMyriad(veteran(40), 3)
    expect(r.progress).toBeGreaterThanOrEqual(0)
    expect(r.progress).toBeLessThanOrEqual(1)
    expect(r.line.length).toBeGreaterThan(0)
  })

  it('a kill is reported as a kill, not as 96% of one', () => {
    // The sim spawns a replacement the instant anything dies, so reading the
    // enemy's health after the fact reports a win as a near-miss.
    const strong = veteran(40)
    strong.treeLevels = { edge: 800, meat: 400, clot: 200 }
    strong.soldier.hp = computeStats(strong).hp
    const r = fightMyriad(strong, 4)
    expect(r.felled).toBe(true)
    expect(r.progress).toBe(1)
    expect(new Decimal(r.hp).eq(0)).toBe(true)
  })

  it('once it has fallen, the number never changes again', () => {
    const s = veteran(40)
    s.myriadFelled = true
    s.soldierNumber = 10000
    s.bestRank = 60
    for (let i = 0; i < 5; i++) reveille(s)
    expect(s.soldierNumber).toBe(10000)
  })

  it('reports the gap in orders of magnitude, because there is no near-miss', () => {
    // Tree nodes multiply, so 400 EDGE is ~13 orders short and 800 is ~6 past.
    // A percentage would read 0% or 100% forever and tell the player nothing.
    const weak = veteran(40)
    weak.treeLevels = { edge: 400 }
    weak.soldier.hp = computeStats(weak).hp
    const strong = veteran(40)
    strong.treeLevels = { edge: 800 }
    strong.soldier.hp = computeStats(strong).hp

    expect(fightMyriad(weak, 4).shortBy).toBeGreaterThan(0)
    expect(fightMyriad(strong, 4).shortBy).toBeLessThan(0)
  })

  it('cannot be won by a soldier who has only just ascended', () => {
    const fresh = veteran(40)
    fresh.treeLevels = {}
    fresh.soldier.hp = computeStats(fresh).hp
    expect(fightMyriad(fresh, 4).felled).toBe(false)
  })
})

describe('fragments', () => {
  it('unlock by depth of play and never repeat', () => {
    const s = createInitialState('hoplite', 12)
    // nothing is given away before the first waking
    expect(newFragments(s).length).toBe(0)
    s.reveilles = 1
    expect(newFragments(s).length).toBeGreaterThan(0)
    for (const f of newFragments(s)) s.fragments.push(f.n)
    expect(newFragments(s).length).toBe(0)

    s.reveilles = 40
    const later = newFragments(s)
    expect(later.length).toBeGreaterThan(0)
  })

  it('every fragment has a unique number and real text', () => {
    const ns = FRAGMENTS.map((f) => f.n)
    expect(new Set(ns).size).toBe(ns.length)
    for (const f of FRAGMENTS) {
      expect(f.text.length).toBeGreaterThan(40)
      expect(f.text).not.toContain('!')
    }
  })

  it('the act three fragments need act three progress', () => {
    const fresh = createInitialState('hoplite', 12)
    const act3 = FRAGMENTS.filter((f) => f.act === 3)
    for (const f of act3) expect(f.when(fresh)).toBe(false)
  })
})

describe('what you left behind', () => {
  const authored = {
    soldierNumber: 4102, classId: 'hoplite', deepestRank: 400,
    seed: 777, vows: [], ascension: 1,
  }

  it('waits in the Column, wearing the number you had', () => {
    const e = spawnForRank(200, 0, 5, 0, 0, [], 0, false, authored)
    expect(e.authored).toBeDefined()
    expect(e.name).toBe('SOLDIER #4,102')
    expect(e.isWarden).toBe(true)
  })

  it('is not there before you got that deep', () => {
    const shallow = spawnForRank(50, 0, 5, 0, 0, [], 0, false, authored)
    expect(shallow.authored).toBeUndefined()
  })

  it('does not replace every Stand', () => {
    const ordinary = spawnForRank(210, 0, 5, 0, 0, [], 0, false, authored)
    expect(ordinary.authored).toBeUndefined()
    expect(ordinary.isWarden).toBe(true)
  })
})

describe('nowhere', () => {
  it('deletes the route you plotted', () => {
    const s = createInitialState('hoplite', 55)
    s.bestRankEver = 400
    s.apotheoses = 1
    s.treeLevels = { edge: 60, meat: 60 }
    s.soldier.hp = computeStats(s).hp

    const map = generateMap('nowhere', 5, 31)
    const route = autoRoute(map)

    // Compare room IDs, not types — a replacement can coincidentally be the
    // same type, which makes a type comparison silently pass or fail.
    let everDiverged = false
    for (let seed = 0; seed < 12 && !everDiverged; seed++) {
      const r = resolveDescent(s, map, route, seed)
      everDiverged = r.rooms.some((o, i) => route[i] !== undefined && o.roomId !== route[i])
    }
    expect(everDiverged).toBe(true)
  })

  it('does not erase anywhere else', () => {
    const s = createInitialState('hoplite', 55)
    s.bestRankEver = 400
    s.treeLevels = { edge: 60, meat: 60 }
    s.soldier.hp = computeStats(s).hp

    const map = generateMap('ossuary', 5, 31)
    const route = autoRoute(map)
    for (let seed = 0; seed < 8; seed++) {
      const r = resolveDescent(s, map, route, seed)
      r.rooms.forEach((o, i) => expect(o.roomId).toBe(route[i]))
    }
  })

  it('leaves the Warden where it is — the way out is still the way out', () => {
    const map = generateMap('nowhere', 5, 31)
    const route = autoRoute(map)
    expect(map.rooms[route[route.length - 1]].type).toBe('warden')
  })
})

describe('observations', () => {
  it('are statements, never instructions', () => {
    for (const o of OBSERVATIONS) {
      expect(o.text).not.toMatch(/^(Kill|Reach|Defeat|Collect|Complete|Earn)\b/)
      expect(o.text).not.toContain('!')
      expect(o.text.length).toBeGreaterThan(25)
    }
  })

  it('have unique ids and fire only once', () => {
    const ids = OBSERVATIONS.map((o) => o.id)
    expect(new Set(ids).size).toBe(ids.length)

    const s = createInitialState('hoplite', 3)
    s.totalDeaths = 1
    const found = newObservations(s)
    expect(found.length).toBeGreaterThan(0)
    for (const o of found) s.observations.push(o.id)
    expect(newObservations(s).length).toBe(0)
  })

  it('say nothing about a soldier who has done nothing', () => {
    expect(newObservations(createInitialState('hoplite', 3)).length).toBe(0)
  })
})

describe('sigils', () => {
  it('are deterministic and non-empty', () => {
    const a = buildSigil(FAMILY_PRESETS.chaff, 42)
    const b = buildSigil(FAMILY_PRESETS.chaff, 42)
    expect(a.paths.length).toBeGreaterThan(0)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('symmetry order produces that many copies of each mark', () => {
    const warden = buildSigil({ ...FAMILY_PRESETS.warden, density: 0.2, rings: 1 }, 5)
    // 1 mark per ring * 12 copies, plus the outer ring path
    expect(warden.paths.length).toBe(1 * 12 + 1)
  })

  it('produces no NaN coordinates', () => {
    for (const key of Object.keys(FAMILY_PRESETS) as (keyof typeof FAMILY_PRESETS)[]) {
      for (let seed = 0; seed < 25; seed++) {
        const s = buildSigil(FAMILY_PRESETS[key], seed)
        for (const p of s.paths) expect(p.d).not.toContain('NaN')
      }
    }
  })
})

describe('fragments: archive integrity', () => {
  it('numbers run contiguously from 1, so the Archive has no holes', () => {
    const ns = FRAGMENTS.map((f) => f.n).sort((a, b) => a - b)
    expect(ns[0]).toBe(1)
    expect(ns[ns.length - 1]).toBe(ns.length)
  })

  it('every fragment has a title and a valid act', () => {
    for (const f of FRAGMENTS) {
      expect(f.title.trim().length).toBeGreaterThan(0)
      expect([1, 2, 3]).toContain(f.act)
    }
  })

  it('no fragment carries CP1252 mojibake', () => {
    // this project has been bitten by the PowerShell read/write encoding trap
    // twice; the lore is the file most full of curly quotes and macrons.
    for (const f of FRAGMENTS) {
      expect(f.title + f.text).not.toMatch(/Ã|â€|Â/)
    }
  })

  it('there are a hundred candles', () => {
    expect(FRAGMENTS.length).toBe(CANDLE_COUNT)
    expect(CANDLE_COUNT).toBe(100)
  })

  it('the hundredth story opens only when the other ninety-nine are read', () => {
    const none: number[] = []
    expect(canSnuffHundredth(none)).toBe(false)
    const some = Array.from({ length: 50 }, (_, i) => i + 1)
    expect(canSnuffHundredth(some)).toBe(false)
    const ninetyNine = Array.from({ length: 99 }, (_, i) => i + 1)
    expect(canSnuffHundredth(ninetyNine)).toBe(true)
    // reading the hundredth itself must not count toward its own gate
    expect(canSnuffHundredth([100])).toBe(false)
  })

  it('reading a story darkens the room in proportion, and caps at one', () => {
    expect(roomDarkness([])).toBe(0)
    expect(roomDarkness(Array.from({ length: 33 }, (_, i) => i + 1))).toBeCloseTo(33 / 99, 5)
    expect(roomDarkness(Array.from({ length: 99 }, (_, i) => i + 1))).toBe(1)
    // the hundredth candle does not deepen an already-total dark
    expect(roomDarkness([...Array.from({ length: 99 }, (_, i) => i + 1), 100])).toBe(1)
  })
})

describe('class cards', () => {
  it('every class has its own authored figure', () => {
    // The ids are the ORIGINAL English ones (hoplite, lampbearer, augur...)
    // while the names on screen are Japanese, which is exactly the trap: a
    // table keyed on the display name silently falls back for every entry.
    for (const c of CLASSES) {
      expect(CLASS_LOOKS[c.id], `${c.name} (${c.id}) has no look`).toBeDefined()
    }
  })

  it('no two classes look the same', () => {
    const sigs = CLASSES.map((c) => {
      const l = CLASS_LOOKS[c.id]
      return `${l.weapon}/${l.armour}/${l.head}`
    })
    expect(new Set(sigs).size).toBe(CLASSES.length)
  })
})

describe('kegare', () => {
  it('accrues from kills, weighted by what the thing was, and slows as it fills', () => {
    // a woken sandal is not unclean; a Warden very much is
    expect(kegareFromKill('warden', 0, 1)).toBeGreaterThan(kegareFromKill('chaff', 0, 1))
    expect(kegareFromKill('returned', 0, 1)).toBeGreaterThan(kegareFromKill('organs', 0, 1))
    // the first contact marks you more than the thousandth
    expect(kegareFromKill('organs', 0.9, 1)).toBeLessThan(kegareFromKill('organs', 0, 1))
    expect(kegareFromKill('organs', 1, 1)).toBeCloseTo(0, 6)
  })

  /**
   * Without depth-normalisation, counting kills absolutely pinned every
   * mid-game player at UNCLEAN from ~run 18 and never moved again, which
   * deleted the wash-or-ride decision entirely.
   */
  it('is normalised by depth, so it measures overreach and not playtime', () => {
    expect(kegareFromKill('organs', 0, 400)).toBeLessThan(kegareFromKill('organs', 0, 10))
  })

  it('bands are ordered and cover the whole range', () => {
    expect(bandFor(0).id).toBe('clean')
    expect(bandFor(1).id).toBe('unclean')
    expect(bandFor(-5).id).toBe('clean')
    expect(bandFor(99).id).toBe('unclean')
    for (let i = 1; i < KEGARE_BANDS.length; i++) {
      expect(KEGARE_BANDS[i].from).toBeGreaterThan(KEGARE_BANDS[i - 1].from)
      // strictly double-edged: every step up buys damage and sells safety
      expect(KEGARE_BANDS[i].atk).toBeGreaterThan(KEGARE_BANDS[i - 1].atk)
      expect(KEGARE_BANDS[i].reg).toBeLessThan(KEGARE_BANDS[i - 1].reg)
      expect(KEGARE_BANDS[i].arm).toBeLessThan(KEGARE_BANDS[i - 1].arm)
    }
  })

  it('cuts both ways in the actual stat block', () => {
    const clean = createInitialState('hoplite', 5)
    const filthy = createInitialState('hoplite', 5)
    filthy.kegare = 0.95
    const a = computeStats(clean)
    const b = computeStats(filthy)
    expect(b.atk.gt(a.atk)).toBe(true)
    expect(b.af).toBeGreaterThan(a.af)
    expect(b.reg.lt(a.reg)).toBe(true)
    expect(b.arm.lte(a.arm)).toBe(true)
  })

  /**
   * The rule that a multiplicative income modifier feeds its own income and
   * goes superexponential. Ash Find must stay ADDITIVE no matter what else
   * changes here.
   */
  it('ash find scales additively, not multiplicatively, with defilement', () => {
    const at = (k: number) => {
      const s = createInitialState('hoplite', 5)
      s.kegare = k
      return computeStats(s).af
    }
    const base = at(0)
    const mid = at(0.5)
    const top = at(0.95)
    // additive means the DIFFERENCES track the band table, not a compounding ratio
    expect(mid - base).toBeCloseTo(bandFor(0.5).ash * base, 5)
    expect(top - base).toBeCloseTo(bandFor(0.95).ash * base, 5)
  })

  it('a waking washes you clean', () => {
    const s = createInitialState('hoplite', 5)
    s.kegare = 0.8
    resetRun(s)
    expect(s.kegare).toBe(0)
  })

  it('purification costs more the deeper and filthier you are', () => {
    expect(purificationCost(0.5, 200)).toBeGreaterThan(purificationCost(0.5, 10))
    expect(purificationCost(0.9, 100)).toBeGreaterThan(purificationCost(0.1, 100))
  })
})

describe('ofuda', () => {
  it('each ward names exactly one family, and the four cover the four killable families', () => {
    const fams = OFUDA.map((o) => o.against)
    expect(new Set(fams).size).toBe(fams.length)
    expect(new Set(fams)).toEqual(new Set(['chaff', 'organs', 'returned', 'nothing']))
  })

  it('never fails in clean hands, and ramps only across the filthy half', () => {
    expect(wardFailChance(0)).toBe(0)
    expect(wardFailChance(0.5)).toBe(0)
    expect(wardFailChance(1)).toBeGreaterThan(0)
    expect(wardFailChance(1)).toBeGreaterThan(wardFailChance(0.75))
  })

  it('a carried ward cuts damage from the family it names, and burns a charge', () => {
    const s = createInitialState('hoplite', 3)
    s.ofudaOwned = ['onibarai']
    // load it out the way the store would
    s.ofuda = ['onibarai']
    s.ofudaCharges = { onibarai: OFUDA_BY_ID.onibarai.charges }
    const before = s.ofudaCharges.onibarai
    // force whatever is on the road to be an oni so the ward is the one that
    // matches, and step until it lands a hit and spends a charge
    let fired = false
    for (let t = 0; t < 4000 && !fired; t++) {
      ;(s.enemy as { family: string }).family = 'organs'
      step(s, 1)
      if ((s.ofudaCharges.onibarai ?? 0) < before) fired = true
      if (s.dead) break
    }
    expect(fired).toBe(true)
  })

  it('a waking re-papers the loadout to full but keeps the loadout', () => {
    const s = createInitialState('hoplite', 3)
    s.ofudaOwned = ['kadofuda']
    s.ofuda = ['kadofuda']
    s.ofudaCharges = { kadofuda: 1 }
    resetRun(s)
    expect(s.ofuda).toEqual(['kadofuda'])
    expect(s.ofudaCharges.kadofuda).toBe(OFUDA_BY_ID.kadofuda.charges)
  })
})

describe('bestiary breadth', () => {
  it('every killable family now has authored species art', () => {
    const fams = new Set(SPECIES.map((s) => s.family))
    // the four families you actually put down; wardens are the Kings, drawn apart
    expect(fams).toEqual(new Set(['chaff', 'organs', 'returned', 'nothing']))
    for (const fam of ['chaff', 'organs', 'returned', 'nothing'] as const) {
      expect(SPECIES.filter((s) => s.family === fam).length).toBeGreaterThanOrEqual(2)
    }
  })

  it('every species has a name, kanji, lore and its own sprite', () => {
    const sigs = new Set<string>()
    for (const sp of SPECIES) {
      expect(sp.name.length).toBeGreaterThan(0)
      expect(sp.kanji.length).toBeGreaterThan(0)
      expect(sp.lore.length).toBeGreaterThan(20)
      const f = sp.build(1234, 0.25)
      const lit = f.px.filter(Boolean).length
      expect(lit).toBeGreaterThan(20)
      sigs.add(f.px.join(','))
    }
    // no two species draw the same picture
    expect(sigs.size).toBe(SPECIES.length)
  })

  it('the ten kings are ten distinct sprites, not one shared warden', () => {
    const sigs = new Set<string>()
    for (let i = 0; i < 300; i++) {
      const f = yokaiFrame('warden', (i * 2654435761) >>> 0, 0, 1)
      sigs.add(f.px.join(','))
    }
    expect(sigs.size).toBe(10)
  })

  it('no species carries CP1252 mojibake in its lore', () => {
    for (const sp of SPECIES) expect(sp.name + sp.kanji + sp.lore).not.toMatch(/Ã|â€|Â/)
  })
})

describe('abilities', () => {
  it('unlock by depth and level up as you descend', () => {
    const iai = ABILITY_BY_ID.iai
    expect(abilityUnlocked(iai, 1)).toBe(false)
    expect(abilityUnlocked(iai, 3)).toBe(true)
    expect(abilityLevel(iai, 3)).toBe(1)
    expect(abilityLevel(iai, 3 + iai.rankPerLevel)).toBe(2)
    // deeper is always at least as strong
    expect(abilityMult(iai, 5)).toBeGreaterThan(abilityMult(iai, 1))
    // and never slower
    expect(abilityCooldownSec(iai, 5)).toBeLessThanOrEqual(abilityCooldownSec(iai, 1))
  })

  it('the animation escalates in tiers with level', () => {
    const ult = ABILITY_BY_ID.hyakkio
    expect(abilityTier(ult, 1)).toBe(1)
    expect(abilityTier(ult, ult.tier2)).toBe(2)
    expect(abilityTier(ult, ult.tier3)).toBe(3)
  })

  it('actually fire in a real fight and deal burst damage', () => {
    const s = createInitialState('hoplite', 42)
    s.bestRankEver = 600 // knows every art
    s.treeLevels = { edge: 40, reinforce: 40, meat: 40 }
    s.soldier.hp = computeStats(s).hp
    const fired: Record<string, number> = {}
    let totalAbilityDmg = new Decimal(0)
    for (let i = 0; i < 400 && !s.dead; i++) {
      step(s, 1)
      for (const e of s.events) {
        if (e.t === 'ability') {
          fired[e.id] = (fired[e.id] ?? 0) + 1
          totalAbilityDmg = totalAbilityDmg.add(e.damage)
        }
      }
      s.events = []
    }
    // the cheap art fires often, the ultimate rarely
    expect(fired.iai).toBeGreaterThan(fired.hyakkio ?? 0)
    expect(Object.keys(fired).length).toBeGreaterThanOrEqual(4)
    expect(totalAbilityDmg.gt(0)).toBe(true)
  })

  it('cooldowns are drawn fresh on a waking', () => {
    const s = createInitialState('hoplite', 1)
    s.abilityCd = { iai: 15, raijin: 40 }
    resetRun(s)
    expect(s.abilityCd).toEqual({})
  })
})
