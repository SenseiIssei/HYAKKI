/**
 * ABILITIES 術 — the arts you learn on the road.
 *
 * These are AUTO-CAST: the game is idle, so you never press them. Each has a
 * cooldown, and when it is ready and you are in a fight, it fires on its own,
 * lands a burst of damage, and throws an animation. The deeper you get the more
 * of them you know, and the ones you know grow — more damage, shorter cooldown,
 * and at thresholds the animation itself escalates from a flourish to a
 * catastrophe.
 *
 * Power is DERIVED FROM DEPTH, not bought. Tying it to `bestRankEver` keeps the
 * economy untouched (the one thing this project has broken twice) while still
 * making every ability visibly stronger the further you have gone.
 */

export type AbilityVfx =
  | 'iai' // a single drawn slash
  | 'flame' // a blooming fire nova
  | 'lightning' // a forked bolt from above
  | 'wind' // a fan of cutting blades
  | 'void' // a hole that pulls in and detonates
  | 'meteor' // the sky comes down

export type Ability = {
  id: string
  name: string
  kanji: string
  vfx: AbilityVfx
  /** the colour the whole effect is keyed to */
  color: string
  /** the one line the codex has on it */
  line: string
  /** deepest Ri ever, at which it is learned */
  unlockRank: number
  /** seconds between casts at level 1 */
  baseCd: number
  /** the cooldown floor, however deep you go */
  minCd: number
  /** every this-many Ri past the unlock adds a level */
  rankPerLevel: number
  /** damage as a multiple of your attack, at level 1 */
  baseMult: number
  /** added to the multiplier per level */
  multPerLevel: number
  /** seconds shaved off the cooldown per level */
  cdPerLevel: number
  /** levels at which the animation escalates to tier 2, then tier 3 */
  tier2: number
  tier3: number
  /** hits more than once — the number the burst is split into */
  hits: number
}

export const ABILITIES: Ability[] = [
  {
    id: 'iai',
    name: 'IAI',
    kanji: '居合',
    vfx: 'iai',
    color: '#dfe7ea',
    line: 'The cut is finished before the blade is seen to move. It is the first thing the road teaches and the last thing it takes.',
    unlockRank: 3,
    baseCd: 3,
    minCd: 1.1,
    rankPerLevel: 22,
    baseMult: 4,
    multPerLevel: 1.6,
    cdPerLevel: 0.18,
    tier2: 4,
    tier3: 8,
    hits: 1,
  },
  {
    id: 'kagura',
    name: 'HI-NO-KAGURA',
    kanji: '火神楽',
    vfx: 'flame',
    color: '#f0873a',
    line: 'A dance offered to the fire, which answers. What it touches keeps burning after the dance is done.',
    unlockRank: 25,
    baseCd: 6,
    minCd: 2.4,
    rankPerLevel: 30,
    baseMult: 9,
    multPerLevel: 3.4,
    cdPerLevel: 0.3,
    tier2: 4,
    tier3: 9,
    hits: 3,
  },
  {
    id: 'raijin',
    name: 'RAIJIN',
    kanji: '雷神',
    vfx: 'lightning',
    color: '#8fd0ff',
    line: 'The thunder god is deaf and does not aim. He only strikes down, and down is where you have put the enemy.',
    unlockRank: 70,
    baseCd: 9,
    minCd: 3.5,
    rankPerLevel: 45,
    baseMult: 20,
    multPerLevel: 7,
    cdPerLevel: 0.5,
    tier2: 4,
    tier3: 9,
    hits: 1,
  },
  {
    id: 'kamaitachi',
    name: 'KAMAITACHI',
    kanji: '鎌鼬',
    vfx: 'wind',
    color: '#a9e6c9',
    line: 'Three weasels ride the whirlwind: the first knocks you down, the second cuts you, the third salves the wound so no blood falls and no one believes you.',
    unlockRank: 130,
    baseCd: 7,
    minCd: 2.6,
    rankPerLevel: 55,
    baseMult: 16,
    multPerLevel: 6,
    cdPerLevel: 0.4,
    tier2: 4,
    tier3: 9,
    hits: 5,
  },
  {
    id: 'meido',
    name: 'MEIDO-GAESHI',
    kanji: '冥道返',
    vfx: 'void',
    color: '#b07bd8',
    line: 'You open the dark road under the thing and let it fall the way everything here has already fallen. It does not come back up the way it went down.',
    unlockRank: 260,
    baseCd: 14,
    minCd: 5,
    rankPerLevel: 70,
    baseMult: 55,
    multPerLevel: 22,
    cdPerLevel: 0.7,
    tier2: 4,
    tier3: 10,
    hits: 1,
  },
  {
    id: 'hyakkio',
    name: 'HYAKKI-Ō',
    kanji: '百鬼王',
    vfx: 'meteor',
    color: '#ffcf4a',
    line: 'You stop being one soldier and become the whole procession at once, and the sky agrees, and comes down. This is the art the road was teaching you the entire time.',
    unlockRank: 500,
    baseCd: 24,
    minCd: 10,
    rankPerLevel: 120,
    baseMult: 160,
    multPerLevel: 70,
    cdPerLevel: 1,
    tier2: 3,
    tier3: 7,
    hits: 1,
  },
]

export const ABILITY_BY_ID: Record<string, Ability> = Object.fromEntries(
  ABILITIES.map((a) => [a.id, a]),
)

/** Learned yet? Abilities open by the deepest you have ever gone. */
export function abilityUnlocked(a: Ability, bestRankEver: number): boolean {
  return bestRankEver >= a.unlockRank
}

/** How upgraded an ability is, derived from depth. 1 the moment it unlocks. */
export function abilityLevel(a: Ability, bestRankEver: number): number {
  if (bestRankEver < a.unlockRank) return 0
  return 1 + Math.floor((bestRankEver - a.unlockRank) / a.rankPerLevel)
}

/** 1, 2 or 3 — how epic the animation is right now. */
export function abilityTier(a: Ability, level: number): 1 | 2 | 3 {
  if (level >= a.tier3) return 3
  if (level >= a.tier2) return 2
  return 1
}

/** Damage multiple of attack this cast will deal, at this level. */
export function abilityMult(a: Ability, level: number): number {
  return a.baseMult + Math.max(0, level - 1) * a.multPerLevel
}

/** Cooldown in seconds at this level, floored. */
export function abilityCooldownSec(a: Ability, level: number): number {
  return Math.max(a.minCd, a.baseCd - Math.max(0, level - 1) * a.cdPerLevel)
}
