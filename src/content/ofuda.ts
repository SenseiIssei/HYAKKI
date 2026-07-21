import type { Family } from './balance'

/**
 * OFUDA 御札 — paper wards.
 *
 * A strip of paper with a name written on it, pasted to a door or carried, and
 * the thing it names cannot cross it. That is the whole of the folklore and it
 * is already a game mechanic: a ward is specific. It does not make you stronger,
 * it makes one particular kind of thing unable to touch you.
 *
 * So each ward here answers exactly one family. Loading three is a bet on what
 * the road ahead is made of — which is the only pre-walk decision in a game
 * that is otherwise entirely automatic, and it is why they are chosen BEFORE a
 * walk and cannot be swapped during one.
 *
 * Wards burn. Charges do not refill mid-walk. A ward is paper and fire is what
 * happens to paper.
 */

export type Ofuda = {
  id: string
  name: string
  kanji: string
  /** the family this paper names, and therefore holds back */
  against: Family
  /** what the strip actually says, in the fiction */
  text: string
  lore: string
  /** how many times it can fire in one walk */
  charges: number
  /** damage taken from the named family is multiplied by this when it fires */
  ward: number
}

export const OFUDA: Ofuda[] = [
  {
    id: 'kadofuda',
    name: 'GATE PAPER',
    kanji: '門札',
    against: 'chaff',
    text: 'THE SMALL AND THE MANY MAY NOT PASS',
    lore:
      'Pasted above a door in a village where the doors no longer matter. It still works. It does not know the village is empty.',
    charges: 6,
    ward: 0.35,
  },
  {
    id: 'onibarai',
    name: 'DEMON-SWEEPING PAPER',
    kanji: '鬼祓',
    against: 'organs',
    text: 'OUT, DEMON. IN, FORTUNE.',
    lore:
      'The words shouted while throwing beans, written down by someone who could no longer shout. The oni still leave. They leave slowly, and they look at you.',
    charges: 4,
    ward: 0.3,
  },
  {
    id: 'chinkon',
    name: 'SOUL-QUIETING PAPER',
    kanji: '鎮魂',
    against: 'returned',
    text: 'REST. YOU ARE RELIEVED.',
    lore:
      'The only ward that reads as an order rather than a refusal, and the only one that has ever been thanked. A yūrei stays because something is unfinished. This tells it that the thing is finished. It is a lie, and it works.',
    charges: 3,
    ward: 0.25,
  },
  {
    id: 'kuji',
    name: 'NINE-CHARACTER PAPER',
    kanji: '九字',
    against: 'nothing',
    text: 'RIN PYŌ TŌ SHA KAI JIN RETSU ZAI ZEN',
    lore:
      'Nine cuts through the air, against a thing that is not there to be cut. Every other ward names what it holds back. This one names nothing, because there is nothing to name, and that is exactly why it is the only one that works on it.',
    charges: 2,
    ward: 0.2,
  },
]

export const OFUDA_BY_ID: Record<string, Ofuda> = Object.fromEntries(
  OFUDA.map((o) => [o.id, o]),
)

/** How many you may carry onto the road. */
export const OFUDA_SLOTS = 3

/**
 * A ward fires only against the family it names, only while it has charges,
 * and — because kegare is pollution and paper is a ritual object — it fails
 * some of the time once you are filthy enough to be handling it wrong.
 *
 * Returns null when nothing fires, so the caller can tell "no ward" from
 * "ward failed" and say so in the log.
 */
export const OFUDA_FAIL_WHEN_UNCLEAN = 0.3

export function wardFailChance(kegare: number): number {
  // clean hands never fumble a ward; it ramps only across the upper half
  const k = Math.min(1, Math.max(0, kegare))
  return Math.max(0, (k - 0.5) / 0.5) * OFUDA_FAIL_WHEN_UNCLEAN
}
