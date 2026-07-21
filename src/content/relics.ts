import type { StatKey } from './upgrades'

/** docs/06-RELICS.md */

export type Rarity = 'issued' | 'kept' | 'named' | 'myth' | 'truename'

export const RARITIES: Record<
  Rarity,
  { label: string; affixes: number; weight: number; colorVar: string; meltValue: number }
> = {
  issued: { label: 'Issued', affixes: 1, weight: 60, colorVar: '--ash', meltValue: 1 },
  kept: { label: 'Kept', affixes: 2, weight: 27, colorVar: '--bone', meltValue: 3 },
  named: { label: 'Named', affixes: 3, weight: 10, colorVar: '--blood', meltValue: 10 },
  myth: { label: 'Myth', affixes: 3, weight: 2.7, colorVar: '--gold', meltValue: 40 },
  truename: { label: 'True Name', affixes: 4, weight: 0.3, colorVar: '--ichor', meltValue: 150 },
}

export const RARITY_ORDER: Rarity[] = ['issued', 'kept', 'named', 'myth', 'truename']

export type AffixTag = 'offense' | 'defense' | 'crit' | 'sustain' | 'economy' | 'utility'

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

export const AFFIX_BY_ID: Record<string, AffixDef> = Object.fromEntries(
  AFFIXES.map((a) => [a.id, a]),
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
    id: 'ninthnail', name: 'The Ninth Nail', rarity: 'myth',
    line: 'There were eight. There is a ninth. Nobody built it.',
    mods: { atk: 1.4 }, flags: ['ninth'],
  },
  {
    id: 'lantern', name: 'Lantern of the Unreturned', rarity: 'myth',
    line: 'It lights nothing. It only makes the dark specific.',
    mods: { atk: 1.25 }, flags: ['lantern'],
  },
  {
    id: 'wardenseye', name: "The Warden's Left Eye", rarity: 'myth',
    line: 'It blinks when you are not looking. You know this because you have looked.',
    mods: { cm: 1.3 },
  },
  {
    id: 'letter', name: 'A Letter Never Sent', rarity: 'myth',
    line: 'The address is a rank and a number. Both of them are yours.',
    mods: { af: 1.2 }, flags: ['letter'],
  },
  {
    id: 'rationtin', name: 'Ration Tin, Empty', rarity: 'myth',
    line: 'Licked clean. Not recently.',
    mods: { bf: 1.5, hp: 0.8 },
  },
  {
    id: 'longcoat', name: 'The Long Coat', rarity: 'myth',
    line: 'Issued to ten thousand. Fits exactly one.',
    mods: { hp: 1.35 }, flags: ['longcoat'],
  },
  {
    id: 'crackedbell', name: 'Bell, Cracked', rarity: 'myth',
    line: 'It rings on the downstroke only. Reveille has always sounded wrong.',
    mods: { res: 1.3 }, flags: ['halfsig'],
  },
  {
    id: 'consent', name: "The Surgeon's Consent", rarity: 'myth',
    line: 'Signed. Not by the patient.',
    mods: { ls: 1.4, reg: 0.5 },
  },
  {
    id: 'map', name: 'A Map of the Hollow', rarity: 'myth',
    line: 'It is accurate. It updates. You have never seen it update.',
    mods: { atk: 1.15, hp: 1.15, arm: 1.15, reg: 1.15 },
  },
  {
    id: 'secondcoat', name: 'The Second Coat', rarity: 'myth',
    line: 'Same number, stitched twice. The second stitching is fresher.',
    mods: { atk: 1.2, hp: 1.2 },
  },
  {
    id: 'tooth', name: 'Tooth of the Thing at 400', rarity: 'myth',
    line: 'Pulled, not shed.',
    flags: ['deeptooth'],
  },
  {
    id: 'firstash', name: 'Ash of the First Reveille', rarity: 'myth',
    line: 'Cold. Still cold. Colder than the room.',
    flags: ['firstash'],
  },

  // ── True Names — always with a cost ──
  {
    id: 'ownskull', name: 'Your Own Skull', rarity: 'truename',
    line: 'You recognise it. You do not recognise how you recognise it.',
    cost: 'Max Health is set to 1.',
    mods: { atk: 2.5, cc: 2.5, cm: 2.5 }, flags: ['skull'],
  },
  {
    id: 'blankcoat', name: 'The Blank Coat', rarity: 'truename',
    line: 'No number. The stitching holes are there. The thread is not.',
    cost: 'You lose your class Pipeline and Signature.',
    flags: ['blank'],
  },
  {
    id: 'thecount', name: 'The Count', rarity: 'truename',
    line: 'Someone has been keeping it. Someone is still keeping it.',
    cost: 'You cannot Reveille until Rank 200.',
    flags: ['count'],
  },
  {
    id: 'woundsblade', name: "The Wound's Own Blade", rarity: 'truename',
    line: 'It was in the god. It is not from the god.',
    cost: 'You take 12% of your Max Health every second, always.',
    mods: { atk: 4 }, flags: ['woundblade'],
  },
  {
    id: 'tenthousandth', name: 'The Ten Thousandth Coat', rarity: 'truename',
    line: 'The last one. It has been the last one for some time.',
    cost: 'Your number is fixed at ten thousand and stops increasing.',
    flags: ['tenthousandth'],
  },
  {
    id: 'nothingheld', name: 'Nothing, Held', rarity: 'truename',
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
