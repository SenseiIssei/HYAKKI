import type { StatBlock } from '../sim/types'
import type { SigilPreset } from '../render/presets'

/**
 * A class is defined by how it PRODUCES damage, not by which stat is highest.
 * docs/04-CLASSES.md
 */
export type ClassDef = {
  id: string
  name: string
  epithet: string
  line: string
  /** shown beside the name; the world assumes you know what it says */
  kanji?: string
  /**
   * How this class is earned. Names do not exist until Phase 4, so the three
   * mid classes unlock through play instead — and each condition is the thing
   * the class is *about*, which is better design than a price tag.
   */
  unlock?: { kind: 'deaths' | 'reveilles' | 'kills'; n: number; text: string }
  /** Multiplicative passives, applied after everything else. */
  passive?: Partial<Record<keyof StatBlock, number>>
  /** Stats forced to zero. A curse you cannot buy your way out of. */
  zero?: (keyof StatBlock)[]
  /** Multiplier injected into the damage formula. */
  pipeline: (s: StatBlock, ctx: PipelineCtx) => number
  /** Permanent downside, as an additive percentage. */
  curse: Partial<Record<keyof StatBlock, number>>
  /** Flat starting stats that make the class's identity true at Rank 1. */
  grant?: Partial<Record<keyof StatBlock, number>>
  /** On-hit rider. Phase 0 implements burn; more land in Phase 2. */
  applies?: 'burn'
  /** Auto-fires when Resolve fills. Never player-triggered. */
  signature: { id: SignatureId; label: string; text: string }
  curseText: string
  wants: string
  sigil: SigilPreset
}

export type SignatureId =
  | 'brace'
  | 'flashpoint'
  | 'foresight'
  | 'secondbody'
  | 'thechoir'
  | 'exhume'
  | 'devour'

export type PipelineCtx = {
  rank: number
  deathsThisAscension: number
  reveilles: number
  echoes: number
}

export const CLASSES: ClassDef[] = [
  {
    id: 'hoplite',
    name: 'NIŌ',
    kanji: '仁王',
    epithet: 'the gate that is a person',
    line: 'There are two of them at every gate. There has only ever been one of you.',
    // Your armor IS your weapon.
    pipeline: (s) => 1 + s.arm.toNumber() / 200,
    curse: { spd: -0.25 },
    grant: { arm: 20 },
    signature: {
      id: 'brace',
      label: 'KONGŌ 金剛',
      text: 'Take nothing for three seconds, then return all of it at once.',
    },
    curseText: '−25% speed. A gate does not hurry.',
    wants: 'Armor, health, standing still',
    sigil: { symmetry: 6, rings: 2, strokeWeight: 2.4, density: 0.5, coreFill: 'solid', jitter: 0.12, openness: 0.05 },
  },
  {
    id: 'lampbearer',
    name: 'KITSUNEBI',
    kanji: '狐火',
    epithet: 'it was not lit and it does not go out',
    line: 'Follow it and you will arrive somewhere. It will not be where you were going.',
    pipeline: () => 0.55,
    curse: {},
    grant: { spd: 0.35 },
    applies: 'burn',
    signature: {
      id: 'flashpoint',
      label: 'HITODAMA 人魂',
      text: 'Every fire you set, spent at once.',
    },
    curseText: 'Weak hits. The fire cannot crit. It needs time to take.',
    wants: 'Speed, above everything',
    sigil: { symmetry: 3, rings: 2, strokeWeight: 1.4, density: 0.55, coreFill: 'hollow', jitter: 0.35, openness: 0.5 },
  },
  {
    id: 'augur',
    name: 'ONMYŌJI',
    kanji: '陰陽師',
    epithet: 'has read the almanac and is not reassured',
    line: 'It knows which days are unlucky. Every day here is one of them.',
    pipeline: () => 1.0,
    curse: { hp: -0.5 },
    grant: { cc: 0.2, cm: 0.4 },
    signature: {
      id: 'foresight',
      label: 'SHIKIGAMI 式神',
      text: 'Six strikes that were always going to land.',
    },
    curseText: '−50% health. A diviner is not a soldier.',
    wants: 'Crit, and luck it does not believe in',
    sigil: { symmetry: 5, rings: 3, strokeWeight: 1.0, density: 0.45, coreFill: 'hollow', jitter: 0.3, openness: 0.35 },
  },

  // ── earned ──
  {
    id: 'revenant',
    name: 'ONRYŌ',
    kanji: '怨霊',
    epithet: 'is not angry with you',
    line: 'It is angry, and you are here.',
    unlock: { kind: 'deaths', n: 25, text: 'Be stopped twenty-five times.' },
    // Your lifetime death count is a stat. The class gets stronger every run
    // you will ever play.
    pipeline: (_s, c) => 1 + c.deathsThisAscension / 400,
    curse: {},
    zero: ['reg', 'ls'],
    signature: {
      id: 'secondbody',
      label: 'URAMI 恨み',
      text: 'Keep going six seconds past the blow that ended it.',
    },
    curseText: 'You cannot heal. The dead do not mend.',
    wants: 'Nothing but time',
    sigil: { symmetry: 2, rings: 2, strokeWeight: 1.6, density: 0.5, coreFill: 'hollow', jitter: 0.3, openness: 0.45 },
  },
  {
    id: 'chorus',
    name: 'KUCHIYOSE',
    kanji: '口寄せ',
    epithet: 'calls the dead up to speak',
    line: 'Ask how many it is. The answer changes while it speaks.',
    unlock: { kind: 'reveilles', n: 10, text: 'Stack the stones ten times.' },
    // Weak alone; each Echo is one of your own past runs, still standing.
    pipeline: (_s, c) => 0.7 + 0.25 * c.echoes,
    curse: { spd: -0.3 },
    signature: {
      id: 'thechoir',
      label: 'YOBIDASHI 呼び出し',
      text: 'Every one of you, at once.',
    },
    curseText: '−30% speed. A kage that falls does not come back this walk.',
    wants: 'Stackings, and anything that keeps them standing',
    sigil: { symmetry: 8, rings: 3, strokeWeight: 1.2, density: 0.6, coreFill: 'none', jitter: 0.25, openness: 0.3 },
  },
  {
    id: 'gravedigger',
    name: 'ONBŌ',
    kanji: '隠亡',
    epithet: 'is not here to fight',
    line: 'It follows the Parade at a distance. It is the only one here with a job that ends.',
    unlock: { kind: 'kills', n: 5000, text: 'Put down five thousand.' },
    pipeline: () => 0.45,
    curse: {},
    passive: { bf: 2.5, af: 1.8, offline: 1.5 },
    signature: {
      id: 'exhume',
      label: 'HORIOKOSU 掘り起こす',
      text: 'Take thirty seconds of tama out of the ground at once.',
    },
    curseText: 'Genuinely bad at fighting. You will stop early.',
    wants: 'Tama, ishi, and a long night',
    sigil: { symmetry: 1, rings: 2, strokeWeight: 3, density: 0.45, coreFill: 'solid', jitter: 0.5, openness: 0.2 },
  },
  {
    id: 'gaki',
    name: 'GAKI',
    kanji: '餓鬼',
    epithet: 'the hunger that outlived the body',
    line: 'It ate everything it had in life. Then it kept eating. It is still eating.',
    unlock: { kind: 'kills', n: 4000, text: 'Devour four thousand.' },
    // Damage rises with how much you drain back — it hits harder the more it eats.
    pipeline: (s) => 1 + s.ls * 4,
    curse: { arm: -0.5 },
    grant: { ls: 0.15 },
    signature: {
      id: 'devour',
      label: 'GAKIDŌ 餓鬼道',
      text: 'One vast bite that lands whole — and feeds you back a share of it.',
    },
    curseText: '−50% armour. It defends nothing; it only takes.',
    wants: 'Lifesteal, attack, and a steady supply',
    sigil: { symmetry: 2, rings: 3, strokeWeight: 2, density: 0.7, coreFill: 'hollow', jitter: 0.4, openness: 0.15 },
  },
]

/** Bought with a Name. Only meaningful below. */
export const CARTOGRAPHER: ClassDef = {
  id: 'cartographer',
  name: 'YAMABUSHI',
  kanji: '山伏',
  epithet: 'knows the paths down',
  line: 'It has been below and come back, which is the part nobody asks about.',
  pipeline: () => 0.6,
  curse: {},
  passive: { omen: 2 },
  signature: {
    id: 'exhume',
    label: 'SURVEY',
    text: 'Take the measure of the room.',
  },
  curseText: 'Poor in the Column. It was never meant to be up here.',
  wants: 'Descents, and nothing else',
  sigil: { symmetry: 4, rings: 3, strokeWeight: 1.1, density: 0.7, coreFill: 'hollow', jitter: 0.2, openness: 0.25 },
}

export function classUnlocked(
  c: ClassDef,
  s: { totalDeaths: number; reveilles: number; totalKills: number },
): boolean {
  if (!c.unlock) return true
  switch (c.unlock.kind) {
    case 'deaths': return s.totalDeaths >= c.unlock.n
    case 'reveilles': return s.reveilles >= c.unlock.n
    case 'kills': return s.totalKills >= c.unlock.n
  }
}

export function unlockProgress(
  c: ClassDef,
  s: { totalDeaths: number; reveilles: number; totalKills: number },
): number {
  if (!c.unlock) return 1
  const have =
    c.unlock.kind === 'deaths' ? s.totalDeaths
    : c.unlock.kind === 'reveilles' ? s.reveilles
    : s.totalKills
  return Math.min(1, have / c.unlock.n)
}

export const CLASS_BY_ID: Record<string, ClassDef> = Object.fromEntries(
  [...CLASSES, CARTOGRAPHER].map((c) => [c.id, c]),
)

export const DEFAULT_CLASS = 'hoplite'
