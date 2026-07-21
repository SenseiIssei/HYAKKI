import { BALANCE as B } from '../content/balance'
import type { GameState, Ghost } from './types'

/**
 * A snapshot of every finished run, kept rolling.
 *
 * CHORUS summons these as Echoes. In Phase 4 the Returned enemy family wears
 * them, and you meet your own past numbers coming the other way. One system,
 * two payoffs — which is why it is worth recording from now rather than later.
 * docs/07-ENEMIES.md § The Returned
 */
export function recordGhost(s: GameState): void {
  // Sample one affix it was carrying, so the Returned can wear it back at you.
  const worn = s.equipped.filter(Boolean)
  const donor = worn.length ? worn[(s.reveilles * 7) % worn.length] : null
  const affix = donor && donor.affixes.length ? donor.affixes[0] : undefined

  const g: Ghost = {
    soldierNumber: s.soldierNumber,
    classId: s.classId,
    deepestRank: s.bestRank,
    seed: (s.soldierSeed + s.reveilles * 7919) >>> 0,
    diedTo: s.enemy.name || 'nothing in particular',
    affix,
  }
  s.ghosts.push(g)
  if (s.ghosts.length > B.GHOST_CAP) s.ghosts.splice(0, s.ghosts.length - B.GHOST_CAP)
}

/**
 * How many past selves stand with you.
 *
 * Deviation from the design doc, deliberately: the doc had Echoes fight at 25%
 * of the stats they *had*, which would make a Reveille-3 ghost worthless by
 * Reveille 300. They take their identity from the ghost and their strength from
 * you, so the class stays playable at every depth.
 */
export function maxEchoes(s: GameState): number {
  if (s.classId !== 'chorus') return 0
  return Math.min(12, Math.floor(s.reveilles / 10))
}

export function pickGhost(s: GameState, rank: number, roll: number): Ghost | undefined {
  return pickGhostFrom(s.ghosts, rank, roll)
}

/** Weighted toward ghosts that died near where you are now. */
export function pickGhostFrom(ghosts: Ghost[], rank: number, roll: number): Ghost | undefined {
  if (!ghosts.length) return undefined
  const scored = ghosts.map((g) => ({
    g,
    w: 1 / (1 + Math.abs(g.deepestRank - rank) / 20),
  }))
  const total = scored.reduce((a, b) => a + b.w, 0)
  let r = roll * total
  for (const item of scored) {
    r -= item.w
    if (r <= 0) return item.g
  }
  return ghosts[ghosts.length - 1]
}
