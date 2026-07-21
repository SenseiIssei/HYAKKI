/**
 * Vows — player-authored difficulty. Each is [a real downside] → [a
 * multiplicative reward]. They apply for the whole Ascension, not per run, so
 * taking one is a commitment. docs/05-PROGRESSION.md § Vows
 *
 * Every downside here is actually enforced in the sim. A Vow that only pretends
 * to cost you something is just a free multiplier.
 */
export type VowDef = {
  id: string
  name: string
  downside: string
  /** multiplicative Ash gain */
  ashMult: number
  /** multiplicative Names gain at Interment */
  nameMult?: number
  /** flat extra Names per Interment */
  extraNames?: number
}

export const VOWS: VowDef[] = [
  {
    id: 'salt',
    name: 'Vow of Salt',
    downside: 'You gain no Bone. Every Bone upgrade is closed to you.',
    ashMult: 2.2,
  },
  {
    id: 'silence',
    name: 'Vow of Silence',
    downside: 'Your Signature never fires.',
    ashMult: 1.8,
  },
  {
    id: 'opencoat',
    name: 'Vow of the Open Coat',
    downside: 'Your Armor is zero and stays zero.',
    ashMult: 2.0,
  },
  {
    id: 'haste',
    name: 'Vow of Haste',
    downside: 'Every Rank is timed, not only the Stands.',
    ashMult: 2.5,
  },
  {
    id: 'singlebody',
    name: 'Vow of the Single Body',
    downside: 'You do not get up again. Revives and Second Body do nothing.',
    ashMult: 1.6,
  },
  {
    id: 'poverty',
    name: 'Vow of Poverty',
    downside: 'You carry nothing. Relics have no effect.',
    ashMult: 2.4,
  },
  {
    id: 'longcount',
    name: 'Vow of the Long Count',
    downside: 'The Hollow learns faster. Enemy growth rises from 1.145 to 1.16.',
    ashMult: 3.0,
  },
  {
    id: 'blankcoat',
    name: 'Vow of the Blank Coat',
    downside: 'You cannot change what you are until the next Interment.',
    ashMult: 1.5,
    extraNames: 1,
  },
  {
    id: 'waking',
    name: 'Vow of the Waking',
    downside: 'The Column does not march without you. No offline progress at all.',
    ashMult: 2.0,
    nameMult: 1.4,
  },
  {
    id: 'tenthousand',
    name: 'Vow of Ten Thousand',
    downside: 'At Rank ten thousand you stop. The Ascension ends there.',
    ashMult: 4.0,
    nameMult: 2,
  },
]

export const VOW_BY_ID: Record<string, VowDef> = Object.fromEntries(VOWS.map((v) => [v.id, v]))

export function vowAshMult(active: string[]): number {
  return active.reduce((m, id) => m * (VOW_BY_ID[id]?.ashMult ?? 1), 1)
}

export function vowNameMult(active: string[]): number {
  return active.reduce((m, id) => m * (VOW_BY_ID[id]?.nameMult ?? 1), 1)
}

export function vowExtraNames(active: string[]): number {
  return active.reduce((n, id) => n + (VOW_BY_ID[id]?.extraNames ?? 0), 0)
}

export const has = (active: string[], id: string) => active.includes(id)
