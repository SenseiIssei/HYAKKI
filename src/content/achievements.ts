import type { GameState } from '../sim/types'

/**
 * Never "Kill 1,000 enemies." Always a statement, in voice, unlocked silently.
 * The game is noticing you, not setting you homework.
 * docs/14-NARRATIVE.md § Achievements as observations
 */
export type Observation = {
  id: string
  text: string
  when: (s: GameState) => boolean
}

export const OBSERVATIONS: Observation[] = [
  {
    id: 'firstdeath',
    text: 'You died once. The Hollow wrote it down and did not look up.',
    when: (s) => s.totalDeaths >= 1,
  },
  {
    id: 'thousanddeaths',
    text: 'You have died one thousand times. The Hollow has kept count. You had not asked it to.',
    when: (s) => s.totalDeaths >= 1000,
  },
  {
    id: 'hundredhours',
    text: 'You have marched for one hundred hours. Somewhere in there, you stopped choosing to.',
    when: (s) => s.totalTicks >= 100 * 3600 * 10,
  },
  {
    id: 'tenthousandrank',
    text: 'Rank ten thousand. The number on the wall and the number on your coat agree for the first time.',
    when: (s) => s.bestRankEver >= 10000,
  },
  {
    id: 'novow',
    text: 'You reached Rank one thousand without swearing anything. Nobody made you do it the hard way.',
    when: (s) => s.bestRankEver >= 1000 && s.vows.length === 0,
  },
  {
    id: 'fourvows',
    text: 'Four Vows at once. You wrote the difficulty yourself and then kept your word.',
    when: (s) => s.vows.length >= 4,
  },
  {
    id: 'meltedtruename',
    text: 'You melted a True Name. It is gone. It will not roll again.',
    when: (s) => !!s.seen.meltedTrueName,
  },
  {
    id: 'nostandlost',
    text: 'Twenty Stands held and not one of them closed on you.',
    when: (s) => s.standsThisRun >= 20 && s.standFails === 0,
  },
  {
    id: 'closedatone',
    text: 'You closed the game at Rank one. Twice.',
    when: (s) => (s.seen.quitAtRankOne as unknown as number) >= 2,
  },
  {
    id: 'allclasses',
    text: 'You have been all six of them. None of them were you.',
    when: (s) => ['hoplite', 'lampbearer', 'augur', 'revenant', 'chorus', 'gravedigger']
      .every((c) => s.seen[`played.${c}`]),
  },
  {
    id: 'metyourself',
    text: 'You fought something wearing your own number. You won. You are not sure that is the good outcome.',
    when: (s) => !!s.seen.metSelf,
  },
  {
    id: 'fivehundredghosts',
    text: 'Five hundred of you are on file. The file does not grow any more; it rolls.',
    when: (s) => s.ghosts.length >= 500,
  },
  {
    id: 'firstinterment',
    text: 'You were buried and something got up. It had your gait.',
    when: (s) => s.interments >= 1,
  },
  {
    id: 'firstascent',
    text: 'You ascended. The Column did not notice. It has done this before.',
    when: (s) => s.apotheoses >= 1,
  },
  {
    id: 'tenkeys',
    text: 'Ten Keys on the ring and nowhere you have not been.',
    when: (s) => s.keys >= 10,
  },
  {
    id: 'deepdescent',
    text: 'You went down at depth thirty and came back up. The map was accurate. It updated.',
    when: (s) => !!s.seen.deepDescent,
  },
  {
    id: 'allfragments',
    text: 'You have read all of it. There was never anything after the last one.',
    when: (s) => s.fragments.length >= 30,
  },
  {
    id: 'myriad',
    text: 'You met the Myriad and there was more of you than there was of it.',
    when: (s) => s.myriadFelled,
  },
  {
    id: 'nullclass',
    text: 'You wore nothing and it was enough.',
    when: (s) => !!s.seen['played.null'],
  },
  {
    id: 'onerelic',
    text: 'Six slots and you filled every one. Somebody carried all of that in here.',
    when: (s) => s.equipped.length >= 6 && s.equipped.every(Boolean),
  },
]

export const OBSERVATION_BY_ID: Record<string, Observation> = Object.fromEntries(
  OBSERVATIONS.map((o) => [o.id, o]),
)

export function newObservations(s: GameState): Observation[] {
  return OBSERVATIONS.filter((o) => !s.observations.includes(o.id) && o.when(s))
}
