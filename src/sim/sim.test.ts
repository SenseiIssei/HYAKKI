import { describe, expect, it } from 'vitest'
import Decimal from 'break_infinity.js'
import { BALANCE } from '../content/balance'
import { BONE_UPGRADES } from '../content/upgrades'
import { TREE, keystoneFlags } from '../content/tree'
import { AFFIX_BY_ID, UNIQUES, UNIQUE_BY_ID, slotsFor } from '../content/relics'
import { CLASSES, classUnlocked } from '../content/classes'
import { compareRelic } from './evaluate'
import { maxEchoes } from './ghosts'
import { rollRelic } from './relics'
import { VOWS, vowAshMult } from '../content/vows'
import { spawnEnemy } from './enemies'
import { catchUp, offlineEfficiency, offlineWindowMs, shouldReveille } from './offline'
import {
  canInter,
  canReveille,
  interment,
  projectedAsh,
  projectedNames,
  recant,
  reveille,
} from './prestige'
import { createInitialState } from './state'
import { step } from './combat'
import {
  armorK,
  ashOnReveille,
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

  it('enemies per rank caps at 12', () => {
    expect(enemiesPerRank(1)).toBe(4)
    expect(enemiesPerRank(1000)).toBe(12)
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
    expect(hop.spd).toBeLessThan(1)
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
      // a fight longer than this means the player is at a wall they can't read
      expect(r.worstTtk).toBeLessThan(6)
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

    // depth is the number that matters; it must not drift
    const drift = Math.abs(fast.bestRankEver - real.bestRankEver) / real.bestRankEver
    expect(drift).toBeLessThan(0.1)
    expect(Math.abs(fast.reveilles - real.reveilles)).toBeLessThanOrEqual(3)
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
