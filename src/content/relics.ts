import type { StatKey } from './upgrades'

/** docs/06-RELICS.md */

export type Rarity =
  | 'issued'
  | 'kept'
  | 'named'
  | 'blessed'
  | 'cursed'
  | 'myth'
  | 'truename'

/**
 * The six places a thing can be worn. Typed slots, RPG-style: an item goes in
 * its slot and nowhere else. The ORDER is the unlock order — the first
 * `slotsFor()` of these open with depth (see below), so the array position of a
 * slot is also its rank on the progression ladder.
 */
export type EquipSlot = 'weapon' | 'body' | 'head' | 'hands' | 'legs' | 'charm'

export const SLOT_ORDER: EquipSlot[] = ['weapon', 'body', 'head', 'hands', 'legs', 'charm']

export const SLOT_META: Record<EquipSlot, { label: string; kanji: string; blurb: string }> = {
  weapon: { label: 'Weapon', kanji: '刃', blurb: 'the blade' },
  body: { label: 'Body', kanji: '胴', blurb: 'the coat, the plate' },
  head: { label: 'Head', kanji: '兜', blurb: 'helm, mask, or bare' },
  hands: { label: 'Hands', kanji: '手', blurb: 'bracers, and what they do' },
  legs: { label: 'Legs', kanji: '脛', blurb: 'the walk' },
  charm: { label: 'Charm', kanji: '札', blurb: 'a carried thing' },
}

/** Which slot an affix's stat belongs to — how a rolled relic finds its place. */
export const STAT_SLOT: Record<string, EquipSlot> = {
  atk: 'weapon',
  pen: 'weapon',
  hp: 'body',
  arm: 'body',
  reg: 'head',
  res: 'head',
  cc: 'hands',
  cm: 'hands',
  spd: 'legs',
  eva: 'legs',
  ls: 'charm',
  bf: 'charm',
  af: 'charm',
  omen: 'charm',
}

export const RARITIES: Record<
  Rarity,
  {
    label: string
    kanji: string
    affixes: number
    weight: number
    color: string
    meltValue: number
    /** Cursed: rolls strong, but also carries one negative affix. */
    curse?: boolean
  }
> = {
  issued: { label: 'Issued', kanji: '支給', affixes: 1, weight: 1000, color: '#8a8271', meltValue: 1 },
  kept: { label: 'Kept', kanji: '所持', affixes: 2, weight: 420, color: '#6f9358', meltValue: 3 },
  named: { label: 'Named', kanji: '銘', affixes: 3, weight: 160, color: '#46707a', meltValue: 10 },
  blessed: { label: 'Blessed', kanji: '加護', affixes: 4, weight: 55, color: '#c39a34', meltValue: 45 },
  cursed: { label: 'Cursed', kanji: '呪', affixes: 4, weight: 22, color: '#8a6ba0', meltValue: 60, curse: true },
  myth: { label: 'Myth', kanji: '神話', affixes: 3, weight: 6, color: '#cf4436', meltValue: 120 },
  truename: { label: 'True Name', kanji: '真名', affixes: 4, weight: 1, color: '#e4dccb', meltValue: 400 },
}

export const RARITY_ORDER: Rarity[] = [
  'issued',
  'kept',
  'named',
  'blessed',
  'cursed',
  'myth',
  'truename',
]

export type AffixTag = 'offense' | 'defense' | 'crit' | 'sustain' | 'economy' | 'utility' | 'curse'

export type AffixDef = {
  id: string
  label: string
  tag: AffixTag
  stat: StatKey
  /** 'add' is a percentage of base; 'flat' is an absolute amount */
  kind: 'add' | 'flat'
  min: number
  max: number
}

export const AFFIXES: AffixDef[] = [
  { id: 'whetted', label: 'Whetted', tag: 'offense', stat: 'atk', kind: 'add', min: 0.06, max: 0.3 },
  { id: 'heavy', label: 'Heavy', tag: 'defense', stat: 'hp', kind: 'add', min: 0.08, max: 0.4 },
  { id: 'quick', label: 'Quick', tag: 'offense', stat: 'spd', kind: 'add', min: 0.03, max: 0.18 },
  { id: 'plated', label: 'Plated', tag: 'defense', stat: 'arm', kind: 'flat', min: 5, max: 60 },
  { id: 'keen', label: 'Keen', tag: 'crit', stat: 'cc', kind: 'flat', min: 0.02, max: 0.12 },
  { id: 'cruel', label: 'Cruel', tag: 'crit', stat: 'cm', kind: 'flat', min: 0.05, max: 0.5 },
  { id: 'thirsting', label: 'Thirsting', tag: 'sustain', stat: 'ls', kind: 'flat', min: 0.005, max: 0.05 },
  { id: 'knitted', label: 'Knitted', tag: 'sustain', stat: 'reg', kind: 'flat', min: 0.4, max: 6 },
  { id: 'sharpened', label: 'Sharpened', tag: 'offense', stat: 'pen', kind: 'flat', min: 0.02, max: 0.15 },
  { id: 'slippery', label: 'Slippery', tag: 'defense', stat: 'eva', kind: 'flat', min: 0.01, max: 0.09 },
  { id: 'tithed', label: 'Tithed', tag: 'economy', stat: 'bf', kind: 'add', min: 0.1, max: 0.6 },
  { id: 'pyred', label: 'Pyred', tag: 'economy', stat: 'af', kind: 'add', min: 0.05, max: 0.3 },
  { id: 'resolute', label: 'Resolute', tag: 'utility', stat: 'res', kind: 'add', min: 0.08, max: 0.45 },
  { id: 'ominous', label: 'Ominous', tag: 'economy', stat: 'omen', kind: 'add', min: 0.05, max: 0.25 },
]

/**
 * Curses. Only ever roll on a Cursed relic, always in addition to four strong
 * affixes — the folklore bargain: real power for a real price. Their values are
 * negative, so the sim's ordinary affix pipeline applies them as a penalty with
 * no special-casing.
 */
export const CURSES: AffixDef[] = [
  { id: 'brittle', label: 'Brittle', tag: 'curse', stat: 'hp', kind: 'add', min: -0.35, max: -0.12 },
  { id: 'blunt', label: 'Blunt', tag: 'curse', stat: 'atk', kind: 'add', min: -0.28, max: -0.1 },
  { id: 'lame', label: 'Lame', tag: 'curse', stat: 'spd', kind: 'add', min: -0.2, max: -0.06 },
  { id: 'exposed', label: 'Exposed', tag: 'curse', stat: 'arm', kind: 'flat', min: -55, max: -12 },
  { id: 'wasting', label: 'Wasting', tag: 'curse', stat: 'reg', kind: 'flat', min: -5, max: -1 },
  { id: 'hunted', label: 'Hunted', tag: 'curse', stat: 'eva', kind: 'flat', min: -0.08, max: -0.02 },
]

/** Every affix the sim might have to resolve — normal lines and curses alike. */
export const AFFIX_BY_ID: Record<string, AffixDef> = Object.fromEntries(
  [...AFFIXES, ...CURSES].map((a) => [a.id, a]),
)

/**
 * Authored relics. A Myth multiplies; a True Name multiplies harder and always
 * costs you something. `flags` are consulted by the sim exactly like keystones.
 */
export type UniqueDef = {
  id: string
  name: string
  line: string
  rarity: 'myth' | 'truename'
  /** where it is worn */
  slot: EquipSlot
  /** multiplicative, applied after everything else */
  mods?: Partial<Record<StatKey, number>>
  flags?: string[]
  /** the cost, in words, for True Names */
  cost?: string
  /** system this relic needs; excluded from the drop pool until it exists */
  requires?: 'nothing'
}

export const UNIQUES: UniqueDef[] = [
  // ── Myths ──
  {
    id: 'ninthnail', name: 'The Ninth Nail', rarity: 'myth', slot: 'weapon',
    line: 'There were eight. There is a ninth. Nobody built it.',
    mods: { atk: 1.4 }, flags: ['ninth'],
  },
  {
    id: 'lantern', name: 'Lantern of the Unreturned', rarity: 'myth', slot: 'charm',
    line: 'It lights nothing. It only makes the dark specific.',
    mods: { atk: 1.25 }, flags: ['lantern'],
  },
  {
    id: 'wardenseye', name: "The Warden's Left Eye", rarity: 'myth', slot: 'head',
    line: 'It blinks when you are not looking. You know this because you have looked.',
    mods: { cm: 1.3 },
  },
  {
    id: 'letter', name: 'A Letter Never Sent', rarity: 'myth', slot: 'charm',
    line: 'The address is a rank and a number. Both of them are yours.',
    mods: { af: 1.2 }, flags: ['letter'],
  },
  {
    id: 'rationtin', name: 'Ration Tin, Empty', rarity: 'myth', slot: 'charm',
    line: 'Licked clean. Not recently.',
    mods: { bf: 1.5, hp: 0.8 },
  },
  {
    id: 'longcoat', name: 'The Long Coat', rarity: 'myth', slot: 'body',
    line: 'Issued to ten thousand. Fits exactly one.',
    mods: { hp: 1.35 }, flags: ['longcoat'],
  },
  {
    id: 'crackedbell', name: 'Bell, Cracked', rarity: 'myth', slot: 'charm',
    line: 'It rings on the downstroke only. Reveille has always sounded wrong.',
    mods: { res: 1.3 }, flags: ['halfsig'],
  },
  {
    id: 'consent', name: "The Surgeon's Consent", rarity: 'myth', slot: 'hands',
    line: 'Signed. Not by the patient.',
    mods: { ls: 1.4, reg: 0.5 },
  },
  {
    id: 'map', name: 'A Map of the Hollow', rarity: 'myth', slot: 'legs',
    line: 'It is accurate. It updates. You have never seen it update.',
    mods: { atk: 1.15, hp: 1.15, arm: 1.15, reg: 1.15 },
  },
  {
    id: 'secondcoat', name: 'The Second Coat', rarity: 'myth', slot: 'body',
    line: 'Same number, stitched twice. The second stitching is fresher.',
    mods: { atk: 1.2, hp: 1.2 },
  },
  {
    id: 'tooth', name: 'Tooth of the Thing at 400', rarity: 'myth', slot: 'weapon',
    line: 'Pulled, not shed.',
    flags: ['deeptooth'],
  },
  {
    id: 'firstash', name: 'Ash of the First Reveille', rarity: 'myth', slot: 'charm',
    line: 'Cold. Still cold. Colder than the room.',
    flags: ['firstash'],
  },

  // ── True Names — always with a cost ──
  {
    id: 'ownskull', name: 'Your Own Skull', rarity: 'truename', slot: 'head',
    line: 'You recognise it. You do not recognise how you recognise it.',
    cost: 'Max Health is set to 1.',
    mods: { atk: 2.5, cc: 2.5, cm: 2.5 }, flags: ['skull'],
  },
  {
    id: 'blankcoat', name: 'The Blank Coat', rarity: 'truename', slot: 'body',
    line: 'No number. The stitching holes are there. The thread is not.',
    cost: 'You lose your class Pipeline and Signature.',
    flags: ['blank'],
  },
  {
    id: 'thecount', name: 'The Count', rarity: 'truename', slot: 'charm',
    line: 'Someone has been keeping it. Someone is still keeping it.',
    cost: 'You cannot Reveille until Rank 200.',
    flags: ['count'],
  },
  {
    id: 'woundsblade', name: "The Wound's Own Blade", rarity: 'truename', slot: 'weapon',
    line: 'It was in the god. It is not from the god.',
    cost: 'You take 12% of your Max Health every second, always.',
    mods: { atk: 4 }, flags: ['woundblade'],
  },
  {
    id: 'tenthousandth', name: 'The Ten Thousandth Coat', rarity: 'truename', slot: 'body',
    line: 'The last one. It has been the last one for some time.',
    cost: 'Your number is fixed at ten thousand and stops increasing.',
    flags: ['tenthousandth'],
  },
  {
    id: 'nothingheld', name: 'Nothing, Held', rarity: 'truename', slot: 'hands',
    line: 'Weightless. Your hand closes further than it should.',
    cost: '−60% damage to everything that is not Nothing.',
    requires: 'nothing', flags: ['nothingheld'],
  },
]

export const UNIQUE_BY_ID: Record<string, UniqueDef> = Object.fromEntries(
  UNIQUES.map((u) => [u.id, u]),
)

/** Relic slots. The sixth comes from Names in Phase 4. */
export const SLOT_MILESTONES = [0, 0, 60, 150, 400]
export function slotsFor(bestRankEver: number, bonus = 0): number {
  let n = 2
  for (const m of SLOT_MILESTONES) if (m > 0 && bestRankEver >= m) n++
  return Math.min(6, n + bonus)
}

export const INVENTORY_CAP = 40
