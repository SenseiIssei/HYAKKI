import { Rng, hashSeed } from '../sim/rng'
import type { Family } from './balance'

/** Enemy name grammar — docs/13-CONTENT-TABLES.md */

/**
 * Names are generated so that Ri 8,412 still produces something with texture.
 * The register is domestic and slightly wrong — roadside things, household
 * things, temple things — never fantasy-monster naming.
 */
export const ADJ = [
  'Thin', 'Small', 'Pale', 'Quiet', 'Late', 'Bent', 'Dry', 'Cold', 'Half', 'Spare',
  'Willing', 'Patient', 'Folded', 'Blank', 'Even', 'Narrow', 'Wet', 'Slow', 'Grey', 'Standing',
  'Unwashed', 'Counted', 'Sealed', 'Amended', 'Faint', 'Struck', 'Kept', 'Wrapped', 'Damp', 'Barefoot',
  'Numbered', 'Silent', 'Bare', 'Sworn', 'Idle', 'Certain', 'Missing', 'Second', 'Last', 'Borrowed',
] as const

export const NOUN = [
  'Errand', 'Answer', 'Refusal', 'Return', 'Count', 'Bell', 'Lantern', 'Sandal',
  'Umbrella', 'Comb', 'Thread', 'Bowl', 'Coin', 'Rope', 'Gate', 'Step',
  'Well', 'Bridge', 'Hearth', 'Screen', 'Fan', 'Mirror', 'Kettle', 'Basket',
  'Charm', 'Seal', 'Stone', 'Debt', 'Hour', 'Watch', 'Road', 'Post',
  'Name', 'Register', 'Errand-Boy', 'Hem', 'Sleeve', 'Cord', 'Ash', 'Smoke',
] as const

/** Oni are employed. Their names describe the job, not a temperament. */
export const ORGAN_VERB = [
  'Counts', 'Waited', 'Remembers', 'Refuses', 'Insists', 'Continues', 'Objects',
  'Repeats', 'Answers', 'Holds', 'Listens', 'Was Not Asked', 'Keeps Time', 'Knocks It Down',
  'Files', 'Was Assigned', 'Does Not Look Up', 'Works Nights',
] as const

export function enemyName(family: Family, seed: number): string {
  const r = new Rng(seed)
  switch (family) {
    case 'organs':
      // An oni is staff. The name is the post, not the creature.
      return `The One that ${r.pick(ORGAN_VERB)}`
    case 'nothing':
      // Deliberately empty. Everything else here was given a name.
      // This was not omitted — there was nothing to omit.
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
    'You stopped {sec} seconds after you stopped winning.',
    'It was never close. You were the last to be told.',
    'The account was settled before you finished reading it.',
  ],
  burst: [
    'One blow. You had been managing.',
    'It did not take long enough for you to notice it starting.',
    'Something arrived all at once, the way they do.',
  ],
  attrition: [
    'You were losing at a rate you could not answer.',
    'It took {rate} a second and you did not have it.',
    'Nothing stopped you. Everything did, slowly.',
  ],
}
