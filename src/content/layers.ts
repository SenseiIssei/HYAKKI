import type { Family } from './balance'

/**
 * The Descents. Where the Column is infinite and passive, a Descent is finite,
 * chosen and risky — the one place the player makes a real tactical decision,
 * and it is made entirely before any combat happens.
 * docs/08-DESCENTS.md
 */

export type RoomType =
  | 'fight'
  | 'elite'
  | 'cache'
  | 'shrine'
  | 'riddle'
  | 'empty'
  | 'toll'
  | 'door'
  | 'warden'

export const ROOM_WEIGHTS: Record<Exclude<RoomType, 'warden'>, number> = {
  fight: 34,
  elite: 12,
  cache: 14,
  shrine: 12,
  riddle: 9,
  empty: 8,
  toll: 7,
  door: 4,
}

export const ROOM_LABEL: Record<RoomType, string> = {
  fight: 'Fight',
  elite: 'Elite',
  cache: 'Cache',
  shrine: 'Shrine',
  riddle: 'Riddle',
  empty: 'Empty',
  toll: 'Toll',
  door: 'The Door',
  warden: 'Warden',
}

/** One glyph per room type. The map has to be readable at a glance. */
export const ROOM_GLYPH: Record<RoomType, string> = {
  fight: '×',
  elite: '✕',
  cache: '◈',
  shrine: '⌂',
  riddle: '?',
  empty: '·',
  toll: '⊘',
  door: '⇥',
  warden: '⬢',
}

export type LayerTwist = 'bonepiles' | 'pressure' | 'exhibits' | 'harmony' | 'erasure'

export type LayerDef = {
  id: string
  name: string
  flavour: string
  family: Family
  twist: LayerTwist
  twistText: string
  /** Names to open it */
  cost: number
  wardenId: string
  /** css colour var for the layer's accent */
  accent: string
  /**
   * Multiplies the effective Rank. Kept in a narrow band on purpose: enemy
   * power is exponential in Rank, so a 1.8x here is not "a bit harder", it is
   * unclearable. The Layers are differentiated by their TWIST, not by raw Rank.
   */
  powerBase: number
}

export const LAYERS: LayerDef[] = [
  {
    id: 'ossuary',
    name: 'THE OSSUARY',
    flavour:
      'The place where the Myriad’s dead were stacked, before someone realised there would be no end to them.',
    family: 'chaff',
    twist: 'bonepiles',
    twistText: 'Every kill leaves a pile. Standing over them is worth +2% Attack, and it stacks.',
    cost: 0,
    wardenId: 'quartermaster',
    accent: '--bone',
    powerBase: 1.0,
  },
  {
    id: 'barracks',
    name: 'THE DROWNED BARRACKS',
    flavour: 'Someone flooded it deliberately. The bunks are still made.',
    family: 'organs',
    twist: 'pressure',
    twistText: 'Pressure. You lose 1.5% of your Health for every room you enter, and it does not come back.',
    cost: 3,
    wardenId: 'drownedsergeant',
    accent: '--ichor',
    powerBase: 1.005,
  },
  {
    id: 'museum',
    name: 'THE MUSEUM OF WOUNDS',
    flavour:
      'Every injury the god ever took, mounted and labelled. Some of the labels are in your handwriting.',
    family: 'returned',
    twist: 'exhibits',
    twistText: 'Exhibits. Every room is a run of yours, and what it wore, it wears.',
    cost: 7,
    wardenId: 'predecessor',
    accent: '--gold',
    powerBase: 1.01,
  },
  {
    id: 'choir',
    name: 'THE CHOIR',
    flavour:
      'Ten thousand voices. Nine thousand of them are counting. The rest are the number.',
    family: 'chaff',
    twist: 'harmony',
    twistText: 'Harmony. They strengthen each other, +15% for every one still standing.',
    cost: 14,
    wardenId: 'census',
    accent: '--blood',
    powerBase: 1.015,
  },
  {
    id: 'nowhere',
    name: 'NOWHERE',
    flavour: '',
    family: 'nothing',
    twist: 'erasure',
    twistText: 'Erasure. Rooms delete themselves as you approach. Your route will not survive.',
    cost: 999, // opens at Apotheosis — Phase 6
    wardenId: 'hollow',
    accent: '--ash',
    powerBase: 1.1,
  },
]

export const LAYER_BY_ID: Record<string, LayerDef> = Object.fromEntries(
  LAYERS.map((l) => [l.id, l]),
)

export function layerUnlocked(l: LayerDef, namesSpentOnLayers: number, apotheoses: number): boolean {
  if (l.id === 'nowhere') return apotheoses > 0
  return namesSpentOnLayers >= l.cost
}

export const NOWHERE_ERASE_CHANCE = 0.45
