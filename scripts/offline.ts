/**
 * Offline catch-up harness. Answers the two questions that matter:
 *   1. Is it fast enough to run on the screen the player sees first?
 *   2. Does it agree with really simulating the same span of time?
 *
 *   npx tsx scripts/offline.ts
 */
import { BALANCE as B } from '../src/content/balance'
import { step } from '../src/sim/combat'
import { catchUp } from '../src/sim/offline'
import { createInitialState } from '../src/sim/state'
import { computeStats } from '../src/sim/stats'
import type { GameState } from '../src/sim/types'

function fresh(hours: number): GameState {
  const s = createInitialState('hoplite', 4242)
  s.treeLevels = { edge: 30, meat: 30, clot: 15, scar: 10, tithe: 10 }
  s.reveilles = 40
  s.orders = { enabled: true, ashMultiple: 1.5, stallMinutes: 5, autoBuy: false, priority: [] }
  s.soldier.hp = computeStats(s).hp
  void hours
  return s
}

console.log('── speed ──')
for (const hours of [1, 12, 48, 96]) {
  const s = fresh(hours)
  const t0 = process.hrtime.bigint()
  const r = catchUp(s, hours * 3600_000)
  const ms = Number(process.hrtime.bigint() - t0) / 1e6
  console.log(
    `${String(hours).padStart(3)}h  ${ms.toFixed(0).padStart(5)}ms  ` +
      `ranks=${String(r.ranksCleared).padStart(5)}  reveilles=${String(r.reveilles).padStart(4)}  ` +
      `deaths=${String(r.deaths).padStart(4)}  ash=${r.ashGained.toString().slice(0, 10)}`,
  )
}

console.log('\n── worst case: VIGIL maxed, so the window is really open ──')
{
  const s = fresh(96)
  s.treeLevels = { ...s.treeLevels, vigil: 80 } // +80h base, x1.5, x1.5
  s.soldier.hp = computeStats(s).hp
  const t0 = process.hrtime.bigint()
  const r = catchUp(s, 400 * 3600_000)
  const ms = Number(process.hrtime.bigint() - t0) / 1e6
  console.log(
    `window=${(r.creditedMs / 3600_000).toFixed(0)}h  ${ms.toFixed(0)}ms  ` +
      `ranks=${r.ranksCleared}  reveilles=${r.reveilles}`,
  )
}

console.log('\n── accuracy vs really simulating it ──')
for (const hours of [0.25, 1, 3]) {
  const ticks = Math.floor((hours * 3600_000 * B.OFFLINE_EFFICIENCY) / B.TICK_MS)

  const fast = fresh(hours)
  const t0 = process.hrtime.bigint()
  catchUp(fast, hours * 3600_000)
  const fastMs = Number(process.hrtime.bigint() - t0) / 1e6

  const real = fresh(hours)
  const t1 = process.hrtime.bigint()
  let done = 0
  while (done < ticks) {
    const n = Math.min(2000, ticks - done)
    step(real, n)
    done += n
    if (real.dead) {
      // mirror what Standing Orders would do
      const { reveille, canReveille } = await import('../src/sim/prestige')
      if (!canReveille(real)) break
      reveille(real)
      real.soldier.hp = computeStats(real).hp
    }
  }
  const realMs = Number(process.hrtime.bigint() - t1) / 1e6

  const err = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / b) * 100)
  console.log(
    `${String(hours).padStart(5)}h  fast ${fastMs.toFixed(0).padStart(4)}ms vs real ${realMs
      .toFixed(0)
      .padStart(5)}ms  (${(realMs / Math.max(fastMs, 0.01)).toFixed(1)}x)  ` +
      `bestRank ${fast.bestRankEver} vs ${real.bestRankEver} ` +
      `(${err(fast.bestRankEver, real.bestRankEver).toFixed(1)}%)  ` +
      `reveilles ${fast.reveilles} vs ${real.reveilles}`,
  )
}
