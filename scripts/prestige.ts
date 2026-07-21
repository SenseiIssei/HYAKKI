/**
 * Multi-Reveille harness. Does the game actually compound?
 *   npx tsx scripts/prestige.ts [classId] [runs] [minutesPerRun]
 */
import Decimal from 'break_infinity.js'
import { BALANCE as B } from '../src/content/balance'
import { BONE_UPGRADES } from '../src/content/upgrades'
import { TREE } from '../src/content/tree'
import { step } from '../src/sim/combat'
import { costOfNext } from '../src/sim/formulas'
import { slotsFor } from '../src/content/relics'
import { compareRelic } from '../src/sim/evaluate'
import { meltValue } from '../src/sim/relics'
import { reveille } from '../src/sim/prestige'
import { createInitialState } from '../src/sim/state'
import { computeStats } from '../src/sim/stats'
import type { GameState } from '../src/sim/types'

const classId = process.argv[2] ?? 'hoplite'
const runs = Number(process.argv[3] ?? 12)
const minutes = Number(process.argv[4] ?? 10)

function buyBoneCheapest(s: GameState) {
  for (;;) {
    let best: { id: string; cost: Decimal } | null = null
    for (const u of BONE_UPGRADES) {
      const c = costOfNext(u.base, B.BONE_UPGRADE_SCALE, s.boneLevels[u.id] ?? 0, 1)
      if (s.bone.lt(c)) continue
      if (!best || c.lt(best.cost)) best = { id: u.id, cost: c }
    }
    if (!best) return
    s.bone = s.bone.sub(best.cost)
    s.boneLevels[best.id] = (s.boneLevels[best.id] ?? 0) + 1
  }
}

/** `--focus` spends only on nodes that touch combat, the way a player would. */
const FOCUS = ['edge', 'haste', 'spite', 'cruelty', 'meat', 'scar', 'clot']
const focused = process.argv.includes('--focus')

function buyTreeCheapest(s: GameState) {
  for (;;) {
    let best: { id: string; cost: Decimal } | null = null
    for (const n of TREE) {
      if (n.requires) continue
      if (focused && !FOCUS.includes(n.id)) continue
      const c = costOfNext(n.base, B.TREE_NODE_SCALE, s.treeLevels[n.id] ?? 0, 1)
      if (s.ash.lt(c)) continue
      if (!best || c.lt(best.cost)) best = { id: n.id, cost: c }
    }
    if (!best) return
    s.ash = s.ash.sub(best.cost)
    s.ashSpentTotal = s.ashSpentTotal.add(best.cost)
    s.treeLevels[best.id] = (s.treeLevels[best.id] ?? 0) + 1
  }
}

/**
 * Equip the way a player would: ask the comparison card. Capped at the newest
 * few per run because each call forks and runs the sim.
 */
function equipBest(s: GameState) {
  const want = slotsFor(s.bestRankEver, s.slotBonus)
  while (s.equipped.length < want) s.equipped.push(null)

  const candidates = s.inventory.slice(-8)
  for (const relic of candidates) {
    const cmp = compareRelic(s, relic)
    if (cmp.dpsDelta + cmp.survivalDelta * 0.5 <= 0.01) continue
    const displaced = s.equipped[cmp.slot]
    s.equipped[cmp.slot] = relic
    s.inventory = s.inventory.filter((r) => r.uid !== relic.uid)
    if (displaced) s.inventory.push(displaced)
  }
  // melt the rest so the cap never silently eats drops
  for (const r of s.inventory) s.ash = s.ash.add(meltValue(r))
  s.inventory = []
}

const s = createInitialState(classId, 4242)
s.soldier.hp = computeStats(s).hp

console.log(`class=${classId}  runs=${runs}  minutes/run=${minutes}\n`)
console.log('run   rank  stands  relics  worn  ash gained   tree lvls   time')

for (let run = 1; run <= runs; run++) {
  const ticks = minutes * 60 * B.TICKS_PER_SEC
  for (let t = 0; t < ticks && !s.dead; t++) {
    step(s, 1)
    buyBoneCheapest(s)
  }
  const rank = s.bestRank
  const stands = s.standsThisRun
  const secs = s.runTicks / B.TICKS_PER_SEC
  const relics = s.inventory.length
  const gained = reveille(s)
  equipBest(s)
  buyTreeCheapest(s)
  const lvls = Object.values(s.treeLevels).reduce((a, b) => a + b, 0)
  const worn = s.equipped.filter(Boolean).length
  console.log(
    `${String(run).padStart(3)}  ${String(rank).padStart(5)}  ${String(stands).padStart(6)}  ` +
      `${String(relics).padStart(6)}  ${String(worn).padStart(4)}  ` +
      `${gained.toString().padStart(10)}  ${String(lvls).padStart(9)}  ${secs.toFixed(0).padStart(5)}s`,
  )
  s.soldier.hp = computeStats(s).hp
}
