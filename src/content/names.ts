import { Rng, hashSeed } from '../sim/rng'
import type { Family } from './balance'

/** Enemy name grammar — docs/13-CONTENT-TABLES.md */

export const ADJ = [
  'Thin', 'Small', 'Pale', 'Quiet', 'Late', 'Bent', 'Dry', 'Cold', 'Half', 'Spare',
  'Willing', 'Patient', 'Folded', 'Blank', 'Even', 'Narrow', 'Wet', 'Slow', 'Grey', 'Standing',
  'Unwashed', 'Counted', 'Issued', 'Amended', 'Faint', 'Wound', 'Struck', 'Sealed', 'Hollow', 'Kept',
  'Marched', 'Numbered', 'Silent', 'Bare', 'Sworn', 'Idle', 'Certain', 'Missing', 'Second', 'Last',
] as const

export const NOUN = [
  'Refusal', 'Objection', 'Answer', 'Errand', 'Order', 'Report', 'Return', 'Count',
  'Bell', 'Coat', 'Column', 'Ration', 'Nail', 'Lamp', 'Ledger', 'Margin', 'Rank', 'Wound',
  'Stitch', 'Bunk', 'Tin', 'Letter', 'Clerk', 'Muster', 'Rota', 'Hour', 'Watch', 'Line',
  'Sum', 'Draft', 'Tally', 'Debt', 'Whistle', 'Boot', 'Bandage', 'Chit', 'Signal', 'Grave',
  'Post', 'Name',
] as const

export const ORGAN_VERB = [
  'Counts', 'Waited', 'Remembers', 'Refuses', 'Insists', 'Continues', 'Objects',
  'Repeats', 'Answers', 'Holds', 'Listens', 'Bleeds Correctly', 'Was Not Asked', 'Keeps Time',
] as const

export function enemyName(family: Family, seed: number): string {
  const r = new Rng(seed)
  switch (family) {
    case 'organs':
      return `The ${r.pick(NOUN)} that ${r.pick(ORGAN_VERB)}`
    case 'nothing':
      // Deliberately empty. Every other enemy in the game has a name.
      return ''
    default:
      return `${r.pick(ADJ)} ${r.pick(NOUN)}`
  }
}

export function enemySeed(rank: number, index: number, runSeed: number): number {
  return hashSeed(rank, index, runSeed)
}

/**
 * Cause-of-death lines, keyed to the actual failure mode from the sim.
 * Never "you failed". docs/10-UI-UX.md § The Autopsy
 */
export const DEATH_LINES: Record<string, string[]> = {
  outscaled: [
    'You died {sec} seconds after you stopped winning.',
    'It was never close. You were the last to know.',
    'The arithmetic finished before you did.',
  ],
  burst: [
    'One hit. You had been fine.',
    'It did not take long enough to notice.',
    'Something arrived all at once.',
  ],
  attrition: [
    'You bled at a rate you could not answer.',
    'Your regeneration was outpaced by {rate} per second.',
    'Nothing killed you. Everything did, slowly.',
  ],
}
