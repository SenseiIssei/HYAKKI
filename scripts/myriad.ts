/**
 * THE MYRIAD harness. What does it actually take to be more than the sum of
 * every run that made you?
 *
 *   npx tsx scripts/myriad.ts
 */
import { fightMyriad, myriadAtk, myriadHp } from '../src/sim/myriad'
import { createInitialState } from '../src/sim/state'
import { computeStats } from '../src/sim/stats'
import type { GameState } from '../src/sim/types'

function veteran(ghosts: number, atRank: number, edge: number): GameState {
  const s = createInitialState('hoplite', 88)
  s.apotheoses = 1
  s.bestRankEver = atRank
  s.treeLevels = { edge, meat: Math.round(edge * 0.6), clot: Math.round(edge * 0.3) }
  for (let i = 0; i < ghosts; i++) {
    s.ghosts.push({
      soldierNumber: i + 1,
      classId: 'hoplite',
      deepestRank: Math.round(atRank * 0.8) + (i % 60),
      seed: 500 + i,
      diedTo: 'something',
    })
  }
  s.soldier.hp = computeStats(s).hp
  return s
}

/** `.toString().slice()` on a Decimal truncates the EXPONENT and turns 1e300
 *  into "1.348018596". Every number here needs the exponent kept. */
const sci = (d: { toString(): string }) => {
  const s = d.toString()
  const m = s.match(/^(-?\d(?:\.\d{1,2})?)\d*e?([+-]\d+)?$/)
  return m ? `${m[1]}e${m[2] ? m[2].replace('+', '') : '0'}` : s.slice(0, 9)
}

console.log('ghosts  rank  edge   its hp     your dps    through   felled  secs')
for (const ghosts of [40, 200]) {
  for (const edge of [100, 200, 400, 800, 1200]) {
    const s = veteran(ghosts, 300, edge)
    const st = computeStats(s)
    const r = fightMyriad(s, 4)
    console.log(
      `${String(ghosts).padStart(6)}  ${String(300).padStart(4)}  ${String(edge).padStart(4)}  ` +
        `${sci(myriadHp(s)).padStart(9)}  ${sci(st.atk.mul(st.spd)).padStart(10)}  ` +
        `${(r.progress * 100).toFixed(1).padStart(6)}%  ${(r.felled ? 'YES' : 'no').padStart(6)}  ` +
        `${r.seconds.toFixed(1)}`,
    )
  }
}

console.log('\nits attack vs your health, at edge 400 / 40 ghosts:')
{
  const s = veteran(40, 300, 400)
  const st = computeStats(s)
  console.log(`  myriad atk/s ${sci(myriadAtk(s))}  ·  your hp ${sci(st.hp)}`)
  const r = fightMyriad(s, 4)
  console.log(`  lasted ${r.seconds.toFixed(1)}s of the 180s limit · ${r.line}`)
}
