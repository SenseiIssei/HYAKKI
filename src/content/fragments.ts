import type { GameState } from '../sim/types'

/**
 * The narrative payload. Fragments unlock by DEPTH OF PLAY, never by a quest,
 * and never block anything. They appear as one line in the log and are read in
 * the Archive whenever the player wants.
 *
 * A player who reads none of these still experiences the turn, because the turn
 * is mechanical: the Returned wear real past coat numbers, CHORUS summons the
 * same ghosts as allies, and THE MYRIAD is statted from every run you have
 * recorded. docs/14-NARRATIVE.md
 */
export type Fragment = {
  n: number
  title: string
  text: string
  /** the act it belongs to, for the Archive */
  act: 1 | 2 | 3
  when: (s: GameState) => boolean
}

const rev = (n: number) => (s: GameState) => s.reveilles >= n
const rank = (n: number) => (s: GameState) => s.bestRankEver >= n
const deaths = (n: number) => (s: GameState) => s.totalDeaths >= n

export const FRAGMENTS: Fragment[] = [
  // ── ACT I — THE MARCH ─────────────────────────────────────────────
  {
    n: 1, act: 1, title: 'Muster Roll',
    when: rev(1),
    text: 'Ten thousand names, and the clerk has written them all in the same hand. Nobody has ever been able to explain this. It is noted, in the margin, that it was noted before.',
  },
  {
    n: 2, act: 1, title: 'March Order',
    when: rev(2),
    text: 'You will proceed to the wound. You will proceed into the wound. There is no third instruction and the space for one has been left blank.',
  },
  {
    n: 3, act: 1, title: 'Quartermaster’s Inventory',
    when: rank(20),
    text: 'Coats: ten thousand. Boots: ten thousand pairs. Bells: one. Lamps: one. Nails: eight. There is a ninth nail in the ledger, crossed out, and then crossed back in.',
  },
  {
    n: 4, act: 1, title: 'Casualty Return, Amended',
    when: deaths(3),
    text: 'Ten thousand sent. Ten thousand returned. Ten thousand sent. The clerk has written the same line eleven times. In the margin, in a different hand: "stop."',
  },
  {
    n: 5, act: 1, title: 'On the Nature of the Wound',
    when: rank(50),
    text: 'It is warm. It should not be warm. The surgeons agree that it should not be warm and have agreed this on four separate occasions, in writing, at increasing length.',
  },
  {
    n: 6, act: 1, title: 'Bell',
    when: rev(8),
    text: 'Reveille sounds on the downstroke. It has always sounded on the downstroke. Nobody has ever heard the upstroke and nobody has ever thought to ask where it went.',
  },
  {
    n: 7, act: 1, title: 'A Note on Ash',
    when: rev(12),
    text: 'What burns in there does not go up. It settles. You can carry it. It is the only thing anyone has managed to carry out, and it is not clear that carrying it out is what happens.',
  },
  {
    n: 8, act: 1, title: 'Standing Instruction',
    when: rank(100),
    text: 'If you meet something wearing a coat, check the number. If the number is lower than yours, continue. If the number is higher than yours, continue. Do not stop to check the number.',
  },
  {
    n: 9, act: 1, title: 'The Clerk’s Own Line',
    when: rev(20),
    text: 'I have been asked to record how long. I have recorded how long. I have been asked again, by the same officer, with the same face, and I have recorded it again, and the two numbers do not agree, and both of them are mine.',
  },
  {
    n: 10, act: 1, title: 'Ration Tin',
    when: deaths(15),
    text: 'Licked clean. Not recently. The tin is stamped with a number and the number is yours and you have never seen this tin before.',
  },

  // ── ACT II — THE COUNT ────────────────────────────────────────────
  {
    n: 11, act: 2, title: 'Letter, Undelivered',
    when: rev(30),
    text: 'I have been trying to work out how long. The bells are no help. I asked the man beside me his number and he gave me mine. I did not correct him. He seemed certain.',
  },
  {
    n: 12, act: 2, title: 'On the Returned',
    when: (s) => s.ghosts.length >= 10,
    text: 'They come back up the line wearing coats. The coats are ours. We have checked. We have checked more than once and the checking is the part that stopped being bearable.',
  },
  {
    n: 13, act: 2, title: 'Field Note',
    when: rank(200),
    text: 'It fought the way I fight. Not similarly. The way I fight. It made the mistake I make with my left hand and it made it at the same point in the exchange.',
  },
  {
    n: 14, act: 2, title: 'The Census Speaks',
    when: (s) => s.wardenNames >= 4,
    text: 'It asked me how many I was. I said one. It wrote down a number and turned the page so I could not see it, which was a courtesy, and I have thought about that courtesy every day since.',
  },
  {
    n: 15, act: 2, title: 'Interment',
    when: (s) => s.interments >= 1,
    text: 'They bury what is left and something gets up out of it. This is described in the order of march as "relief". The word has been chosen carefully by somebody who is no longer available for questions.',
  },
  {
    n: 16, act: 2, title: 'On Names',
    when: (s) => s.names >= 3,
    text: 'A soldier with a number can be replaced by another number. A soldier with a name has to be replaced by that name. This is why we are not given them. This is why they can be taken.',
  },
  {
    n: 17, act: 2, title: 'Vow',
    when: (s) => s.vows.length >= 1,
    text: 'Nobody asks you to swear anything. You do it because the arithmetic is better and because a thing you chose hurts differently than a thing you were handed.',
  },
  {
    n: 18, act: 2, title: 'The Museum',
    when: (s) => s.descentsCleared >= 1,
    text: 'Every wound the god took, mounted and labelled. Some of the labels are in my handwriting. I do not remember writing them. I remember the wounds.',
  },
  {
    n: 19, act: 2, title: 'Depth',
    when: rank(500),
    text: 'The colour goes out of it around here. Not darkness. The other thing. Things are still lit; there is simply less to be lit about them.',
  },
  {
    n: 20, act: 2, title: 'Overheard at the Mouth',
    when: rev(60),
    text: '"How many times?" "I have stopped." "Stopped counting?" "Stopped being the one who counts."',
  },
  {
    n: 21, act: 2, title: 'Amended Again',
    when: deaths(80),
    text: 'The casualty return has been amended so many times that the amendments have their own ledger, and that ledger has been amended, and the hand is still mine.',
  },
  {
    n: 22, act: 2, title: 'Soldier #—',
    when: rev(100),
    text: 'You are addressed by number now. It has been happening for some time. Nobody announced the change and you did not notice the first one.',
  },

  // ── ACT III — THE TURN ────────────────────────────────────────────
  {
    n: 23, act: 3, title: 'What a Myriad Is',
    when: rank(1000),
    text: 'A myriad is ten thousand soldiers. That is the whole of the definition. It was not intended to be a definition of anything else.',
  },
  {
    n: 24, act: 3, title: 'What a God Is',
    when: rank(2000),
    text: 'A sufficient number of the same thing, counting. That is all. The surgeons found no organ that was not simply more of the others, arranged so as to agree.',
  },
  {
    n: 25, act: 3, title: 'The Replacement',
    when: (s) => s.interments >= 3,
    text: 'The Myriad did not kill it by defeating it. There was nothing there to defeat. They killed it by being enough of the same thing, in the same place, counting — and a replacement takes time to finish becoming.',
  },
  {
    n: 26, act: 3, title: 'Why It Will Not Stop',
    when: rank(4000),
    text: 'It is not an immune system. Nothing is defending anything. It is assembly. Every corpse it hands back has been checked against a specification, and the specification is getting closer.',
  },
  {
    n: 27, act: 3, title: 'The Last Order',
    when: (s) => s.apotheoses >= 1 || s.ichor > 0,
    text: 'There was never a ten thousandth. There were nine thousand nine hundred and ninety-nine, and a space at the end of the line, and an instruction to fill it. You have been filling it. You are almost finished.',
  },
  {
    n: 28, act: 3, title: 'On the Nothing',
    when: (s) => s.bestRankEver >= 500 && s.apotheoses >= 1,
    text: 'They have no names. Every other thing down here was given one, however badly. These were not omitted. There was nothing to omit.',
  },
  {
    n: 29, act: 3, title: 'The Margin',
    when: (s) => s.apotheoses >= 2,
    text: 'Somebody wrote "stop" in the margin of the casualty return, once, in a different hand, and never again. It has been checked against every hand in the Myriad. It matches one of them.',
  },
  {
    n: 30, act: 3, title: 'Ten Thousand',
    when: (s) => s.myriadFelled,
    text: 'The number on your coat does not change any more. There is nowhere for it to go. You are the space at the end of the line and the line is behind you and it is still coming.',
  },
]

export const FRAGMENT_BY_N: Record<number, Fragment> = Object.fromEntries(
  FRAGMENTS.map((f) => [f.n, f]),
)

/** Any fragment newly earned since last checked. */
export function newFragments(s: GameState): Fragment[] {
  return FRAGMENTS.filter((f) => !s.fragments.includes(f.n) && f.when(s))
}
