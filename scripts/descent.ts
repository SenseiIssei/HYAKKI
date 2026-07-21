/**
 * Descent harness. The estimate shown to the player is a promise — this checks
 * it is kept, and that depth actually means danger.
 *
 *   npx tsx scripts/descent.ts
 */
import Decimal from 'break_infinity.js'
import { BALANCE as B } from '../src/content/balance'
import { BONE_UPGRADES } from '../src/content/upgrades'
import { TREE } from '../src/content/tree'
import { step } from '../src/sim/combat'
import { costOfNext } from '../src/sim/formulas'
import { reveille } from '../src/sim/prestige'
import { LAYERS, LAYER_BY_ID } from '../src/content/layers'
import {
  autoRoute,
  descentDurationMs,
  descentRank,
  estimateClear,
  generateMap,
  resolveDescent,
  validRoute,
} from '../src/sim/descent'
import { hashSeed } from '../src/sim/rng'
import { createInitialState } from '../src/sim/state'
import { computeStats } from '../src/sim/stats'
import type { GameState } from '../src/sim/types'

/**
 * A REAL player, produced by actually playing. Hand-authoring one (say Rank 300
 * with 45 tree levels) describes a state the game can never produce, and then
 * every Descent reads as impossible — which is exactly what it did on the first
 * run of this harness.
 */
function player(runs: number): GameState {
  const s = createInitialState('hoplite', 4242)
  s.soldier.hp = computeStats(s).hp

  for (let run = 0; run < runs; run++) {
    for (let t = 0; t < 60 * 60 * 20 && !s.dead; t += 20) {
      step(s, 20)
      for (;;) {
        let best: { id: string; cost: Decimal } | null = null
        for (const u of BONE_UPGRADES) {
          const c = costOfNext(u.base, B.BONE_UPGRADE_SCALE, s.boneLevels[u.id] ?? 0, 1)
          if (s.bone.lt(c)) continue
          if (!best || c.lt(best.cost)) best = { id: u.id, cost: c }
        }
        if (!best) break
        s.bone = s.bone.sub(best.cost)
        s.boneLevels[best.id] = (s.boneLevels[best.id] ?? 0) + 1
      }
    }
    reveille(s)
    for (;;) {
      let best: { id: string; cost: Decimal } | null = null
      for (const n of TREE) {
        const c = costOfNext(n.base, B.TREE_NODE_SCALE, s.treeLevels[n.id] ?? 0, 1)
        if (s.ash.lt(c)) continue
        if (!best || c.lt(best.cost)) best = { id: n.id, cost: c }
      }
      if (!best) break
      s.ash = s.ash.sub(best.cost)
      s.ashSpentTotal = s.ashSpentTotal.add(best.cost)
      s.ashSpentThisAscension = s.ashSpentThisAscension.add(best.cost)
      s.treeLevels[best.id] = (s.treeLevels[best.id] ?? 0) + 1
    }
    s.soldier.hp = computeStats(s).hp
  }

  s.interments = 1
  s.layerNames = 14
  return s
}

console.log('── where does it actually bite? (raw Rank sweep, Ossuary depth 8) ──')
{
  const s = player(25)
  console.log(`  player wall (bestRankEver): ${s.bestRankEver}`)
  for (const mult of [0.7, 1.0, 1.3, 1.6, 2.0, 2.5, 3.0]) {
    const probe = { ...s, bestRankEver: Math.round(s.bestRankEver * mult) } as GameState
    const map = generateMap('ossuary', 8, hashSeed('sweep', mult * 100))
    const route = autoRoute(map)
    const odds = estimateClear(probe, map, route, 30)
    console.log(
      `  base x${mult.toFixed(1)}  rank ${String(
        descentRank(probe, LAYER_BY_ID.ossuary, 8),
      ).padStart(6)}  clear ${(odds * 100).toFixed(0).padStart(3)}%`,
    )
  }
}

console.log('\n── does depth mean danger? (Ossuary, a real player, 25 Reveilles) ──')
{
  const s = player(25)
  for (const depth of [1, 5, 10, 20, 30, 40]) {
    const map = generateMap('ossuary', depth, hashSeed('m', depth))
    const route = autoRoute(map)
    const odds = estimateClear(s, map, route, 40)
    console.log(
      `depth ${String(depth).padStart(2)}  rank ${String(
        descentRank(s, LAYER_BY_ID.ossuary, depth),
      ).padStart(5)}  clear ${(odds * 100).toFixed(0).padStart(3)}%  ` +
        `${(descentDurationMs(depth) / 60000).toFixed(0)}min  rooms ${route.length}`,
    )
  }
}

console.log('\n── do the layers differ? (depth 8, a real player, 25 Reveilles) ──')
{
  const s = player(25)
  for (const l of LAYERS) {
    if (l.id === 'nowhere') continue
    const map = generateMap(l.id, 8, hashSeed('L', l.id))
    const route = autoRoute(map)
    const odds = estimateClear(s, map, route, 40)
    console.log(`${l.name.padEnd(26)} clear ${(odds * 100).toFixed(0).padStart(3)}%`)
  }
}

console.log('\n── is the estimate honest? (100 real runs vs the shown estimate) ──')
{
  const s = player(25)
  for (const depth of [3, 10, 25]) {
    const map = generateMap('ossuary', depth, hashSeed('h', depth))
    const route = autoRoute(map)
    const shown = estimateClear(s, map, route, 16)
    let wins = 0
    const N = 100
    for (let i = 0; i < N; i++) {
      if (resolveDescent(s, map, route, hashSeed('actual', depth, i)).cleared) wins++
    }
    const actual = wins / N
    console.log(
      `depth ${String(depth).padStart(2)}  shown ${(shown * 100).toFixed(0).padStart(3)}%  ` +
        `actual ${(actual * 100).toFixed(0).padStart(3)}%  ` +
        `error ${Math.abs(shown - actual) * 100 < 12 ? 'ok' : 'HIGH'} ` +
        `(${(Math.abs(shown - actual) * 100).toFixed(0)}pp)`,
    )
  }
}

console.log('\n── route validity ──')
{
  const map = generateMap('ossuary', 12, 99)
  const route = autoRoute(map)
  console.log('auto route valid:', validRoute(map, route), '· rooms:', route.length)
  console.log('truncated route valid:', validRoute(map, route.slice(0, 2)))
  console.log('disconnected route valid:', validRoute(map, [map.entrances[0], map.rooms.length - 1]))
}

