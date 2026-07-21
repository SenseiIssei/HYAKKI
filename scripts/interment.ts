/**
 * Interment harness. Calibrates NAMES_DIV: how long until the first Interment,
 * and how many Names an Ascension is worth.
 *
 *   npx tsx scripts/interment.ts [classId] [maxRuns]
 */
import Decimal from 'break_infinity.js'
import { BALANCE as B } from '../src/content/balance'
import { BONE_UPGRADES } from '../src/content/upgrades'
import { TREE } from '../src/content/tree'
import { step } from '../src/sim/combat'
import { costOfNext } from '../src/sim/formulas'
import { canInter, interment, projectedNames, reveille } from '../src/sim/prestige'
import { createInitialState } from '../src/sim/state'
import { computeStats } from '../src/sim/stats'
import type { GameState } from '../src/sim/types'

const classId = process.argv[2] ?? 'hoplite'
const maxRuns = Number(process.argv[3] ?? 120)

function buyBone(s: GameState) {
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

function buyTree(s: GameState) {
  for (;;) {
    let best: { id: string; cost: Decimal } | null = null
    for (const n of TREE) {
      const c = costOfNext(n.base, B.TREE_NODE_SCALE, s.treeLevels[n.id] ?? 0, 1)
      if (s.ash.lt(c)) continue
      if (!best || c.lt(best.cost)) best = { id: n.id, cost: c }
    }
    if (!best) return
    s.ash = s.ash.sub(best.cost)
    s.ashSpentTotal = s.ashSpentTotal.add(best.cost)
    s.ashSpentThisAscension = s.ashSpentThisAscension.add(best.cost)
    s.treeLevels[best.id] = (s.treeLevels[best.id] ?? 0) + 1
  }
}

const s = createInitialState(classId, 4242)
s.soldier.hp = computeStats(s).hp

let seconds = 0
let firstInterment = 0
console.log(`class=${classId}\n`)
console.log('run   rank   ash spent (ascension)   names   played')

for (let run = 1; run <= maxRuns; run++) {
  // Batched: step(s, 1) in a loop re-derives the stat block every tick and is
  // ~20x slower. Buying every 20 ticks is close enough for calibration.
  for (let t = 0; t < 60 * 60 * 25 && !s.dead; t += 20) {
    step(s, 20)
    buyBone(s)
  }
  seconds += s.runTicks / B.TICKS_PER_SEC
  const rank = s.bestRank
  reveille(s)
  buyTree(s)
  s.soldier.hp = computeStats(s).hp

  const names = projectedNames(s)
  if (run % 10 === 0 || (canInter(s) && !firstInterment)) {
    console.log(
      `${String(run).padStart(3)}  ${String(rank).padStart(5)}   ` +
        `${s.ashSpentThisAscension.toString().slice(0, 18).padStart(20)}   ` +
        `${String(names).padStart(5)}   ${(seconds / 3600).toFixed(2)}h`,
    )
  }
  if (canInter(s) && !firstInterment) {
    firstInterment = run
    console.log(
      `\n>> first Interment possible at run ${run}, ${(seconds / 3600).toFixed(2)}h played, ` +
        `worth ${names} names (${s.wardenNames} from Wardens)\n`,
    )
  }
}

const finalNames = projectedNames(s)
console.log(`\nafter ${maxRuns} runs (${(seconds / 3600).toFixed(1)}h): ${finalNames} names`)
const gained = interment(s)
console.log(`interred for ${gained}; deepest ever ${s.bestRankEver}`)
