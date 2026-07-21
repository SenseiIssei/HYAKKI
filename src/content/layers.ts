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
    name: 'TŌKATSU 等活',
    flavour:
      'The Reviving Hell. Everything here tears everything else apart, and a voice says get up, and it does.',
    family: 'chaff',
    twist: 'bonepiles',
    twistText: 'The voice works for you too. Everything you put down gets up once, and each one that does is worth +2%.',
    cost: 0,
    wardenId: 'quartermaster',
    accent: '--bone',
    powerBase: 1.0,
  },
  {
    id: 'barracks',
    name: 'KOKUJŌ 黒縄',
    flavour: 'The Black Rope. They mark you with a cord first, so the cut is straight.',
    family: 'organs',
    twist: 'pressure',
    twistText: 'The line. You lose 1.5% of your health for every room you enter, and it does not come back.',
    cost: 3,
    wardenId: 'drownedsergeant',
    accent: '--ichor',
    powerBase: 1.005,
  },
  {
    id: 'museum',
    name: 'KYŌKAN 叫喚',
    flavour:
      'The Screaming Hell. You will recognise some of it, which is the part nobody warns you about.',
    family: 'returned',
    twist: 'exhibits',
    twistText: 'The noise. Every room is a walk of yours, and what it wore, it wears.',
    cost: 7,
    wardenId: 'predecessor',
    accent: '--gold',
    powerBase: 1.01,
  },
  {
    id: 'choir',
    name: 'SHUGŌ 衆合',
    flavour: 'The Crushing Hell. Two mountains, and a road between them that narrows.',
    family: 'chaff',
    twist: 'harmony',
    twistText: 'The press. They hold each other up, +15% for every one still standing.',
    cost: 14,
    wardenId: 'census',
    accent: '--blood',
    powerBase: 1.015,
  },
  {
    id: 'nowhere',
    name: 'MUKEN 無間',
    flavour: '',
    family: 'nothing',
    twist: 'erasure',
    twistText: 'Without interval. There is no pause in it, and no room stays where the map says.',
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
