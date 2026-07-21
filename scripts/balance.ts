/**
 * Headless balance harness. Runs the real sim with a scripted "average player"
 * purchase policy and reports the TTK band from docs/03-COMBAT-MATH.md § 9.
 *
 *   npx tsx scripts/balance.ts [classId] [minutes]
 *
 * Any discontinuity in the output is a bug. Any flat stretch longer than
 * 20 Ranks is a boring stretch.
 */
import { BALANCE as B } from '../src/content/balance'
import { BONE_UPGRADES } from '../src/content/upgrades'
import { step } from '../src/sim/combat'
import { costOfNext } from '../src/sim/formulas'
import { createInitialState } from '../src/sim/state'
import { computeStats } from '../src/sim/stats'
import type { GameState } from '../src/sim/types'

const classId = process.argv[2] ?? 'hoplite'
const minutes = Number(process.argv[3] ?? 20)

/** Naive but plausible: always buy the cheapest thing you can afford. */
function buyCheapest(s: GameState): boolean {
  let best: { id: string; cost: ReturnType<typeof costOfNext> } | null = null
  for (const u of BONE_UPGRADES) {
    const level = s.boneLevels[u.id] ?? 0
    const cost = costOfNext(u.base, B.BONE_UPGRADE_SCALE, level, 1)
    if (s.bone.lt(cost)) continue
    if (!best || cost.lt(best.cost)) best = { id: u.id, cost }
  }
  if (!best) return false
  s.bone = s.bone.sub(best.cost)
  s.boneLevels[best.id] = (s.boneLevels[best.id] ?? 0) + 1
  return true
}

const s = createInitialState(classId, 1337)
s.soldier.hp = computeStats(s).hp

const totalTicks = minutes * 60 * B.TICKS_PER_SEC
const rows: string[] = ['rank,seconds,ttk,dps,hpPct,bone']
let lastRank = 1
let rankStartTick = 0

console.log(`class=${classId}  minutes=${minutes}`)

for (let t = 0; t < totalTicks && !s.dead; t++) {
  step(s, 1)
  while (buyCheapest(s)) {
    /* spend down */
  }
  if (s.rank !== lastRank) {
    const st = computeStats(s)
    const ticksForRank = s.runTicks - rankStartTick
    const ttk = ticksForRank / B.TICKS_PER_SEC / s.enemiesThisRank
    const dps = st.atk.mul(st.spd).toNumber()
    rows.push(
      [
        lastRank,
        (s.runTicks / B.TICKS_PER_SEC).toFixed(1),
        ttk.toFixed(2),
        dps.toFixed(1),
        ((s.soldier.hp.toNumber() / st.hp.toNumber()) * 100).toFixed(0),
        s.bone.toString(),
      ].join(','),
    )
    if (lastRank % 10 === 0 || lastRank < 6) {
      const flag = ttk > 6 ? '  <-- WALL' : ttk < 0.3 ? '  <-- trivial' : ''
      console.log(
        `rank ${String(lastRank).padStart(4)}  ttk ${ttk.toFixed(2).padStart(5)}s  ` +
          `t+${(s.runTicks / B.TICKS_PER_SEC).toFixed(0).padStart(4)}s  ` +
          `hp ${((s.soldier.hp.toNumber() / computeStats(s).hp.toNumber()) * 100).toFixed(0).padStart(3)}%${flag}`,
      )
    }
    lastRank = s.rank
    rankStartTick = s.runTicks
  }
}

console.log(
  `\ndied=${s.dead}  rank=${s.rank}  after ${(s.runTicks / B.TICKS_PER_SEC / 60).toFixed(1)} min` +
    `  kills=${s.totalKills}`,
)
if (s.dead) console.log(`cause: ${s.deathCause}`)

if (process.argv.includes('--csv')) console.log('\n' + rows.join('\n'))
