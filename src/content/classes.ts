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

export type PipelineCtx = {
  rank: number
  deathsThisAscension: number
  reveilles: number
  echoes: number
}

export const CLASSES: ClassDef[] = [
  {
    id: 'hoplite',
    name: 'HOPLITE',
    epithet: 'the wall that walks',
    line: 'The line does not advance. The line simply is, further forward than it was.',
    // Your armor IS your weapon.
    pipeline: (s) => 1 + s.arm.toNumber() / 200,
    curse: { spd: -0.25 },
    grant: { arm: 20 },
    signature: {
      id: 'brace',
      label: 'BRACE',
      text: 'Take nothing for 3 seconds, then return all of it at once.',
    },
    curseText: '−25% Attack Speed. You are slow.',
    wants: 'Armor, Health, mitigation',
    sigil: { symmetry: 6, rings: 2, strokeWeight: 2.4, density: 0.5, coreFill: 'solid', jitter: 0.12, openness: 0.05 },
  },
  {
    id: 'lampbearer',
    name: 'LAMPBEARER',
    epithet: 'carries the fire that is eating them',
    line: 'The lamp was lit before the march. Nobody remembers lighting it.',
    pipeline: () => 0.55,
    curse: {},
    grant: { spd: 0.35 },
    applies: 'burn',
    signature: {
      id: 'flashpoint',
      label: 'FLASHPOINT',
      text: 'Detonate every Burn stack for the whole of what it had left.',
    },
    curseText: 'Weak hits. Burn cannot crit. Needs a long fight.',
    wants: 'Attack Speed above all else',
    sigil: { symmetry: 3, rings: 2, strokeWeight: 1.4, density: 0.55, coreFill: 'hollow', jitter: 0.35, openness: 0.5 },
  },
  {
    id: 'augur',
    name: 'AUGUR',
    epithet: 'has read the ending and is bored by it',
    line: 'It calls the coin before the toss. It has never once been wrong. It has also never once been believed.',
    pipeline: () => 1.0,
    curse: { hp: -0.5 },
    grant: { cc: 0.2, cm: 0.4 },
    signature: {
      id: 'foresight',
      label: 'FORESIGHT',
      text: 'The next six attacks are certain, at double the multiplier.',
    },
    curseText: '−50% base Health. Enormously fragile.',
    wants: 'Crit Chance, Crit Multiplier',
    sigil: { symmetry: 5, rings: 3, strokeWeight: 1.0, density: 0.45, coreFill: 'hollow', jitter: 0.3, openness: 0.35 },
  },

  // ── earned ──
  {
    id: 'revenant',
    name: 'REVENANT',
    epithet: 'has died more times than it has been alive',
    line: 'It considers this an advantage, and it is right.',
    unlock: { kind: 'deaths', n: 25, text: 'Die twenty-five times.' },
    // Your lifetime death count is a stat. The class gets stronger every run
    // you will ever play.
    pipeline: (_s, c) => 1 + c.deathsThisAscension / 400,
    curse: {},
    zero: ['reg', 'ls'],
    signature: {
      id: 'secondbody',
      label: 'SECOND BODY',
      text: 'Keep fighting for six seconds after the killing blow.',
    },
    curseText: 'Regeneration and Lifesteal are zero. You cannot heal, ever.',
    wants: 'Nothing but time',
    sigil: { symmetry: 2, rings: 2, strokeWeight: 1.6, density: 0.5, coreFill: 'hollow', jitter: 0.3, openness: 0.45 },
  },
  {
    id: 'chorus',
    name: 'CHORUS',
    epithet: 'never marches alone',
    line: 'Ask it how many it is. It will answer honestly and the answer will change while it speaks.',
    unlock: { kind: 'reveilles', n: 10, text: 'Sound Reveille ten times.' },
    // Weak alone; each Echo is one of your own past runs, still standing.
    pipeline: (_s, c) => 0.7 + 0.25 * c.echoes,
    curse: { spd: -0.3 },
    signature: {
      id: 'thechoir',
      label: 'THE CHOIR',
      text: 'Every Echo strikes at once.',
    },
    curseText: '−30% Attack Speed. Echoes die permanently for the run.',
    wants: 'Reveille count, then anything that keeps Echoes alive',
    sigil: { symmetry: 8, rings: 3, strokeWeight: 1.2, density: 0.6, coreFill: 'none', jitter: 0.25, openness: 0.3 },
  },
  {
    id: 'gravedigger',
    name: 'GRAVEDIGGER',
    epithet: 'is not here to fight',
    line: 'It follows the Column at a distance. It is the only one of them with a job that has an end.',
    unlock: { kind: 'kills', n: 5000, text: 'Fell five thousand.' },
    pipeline: () => 0.45,
    curse: {},
    passive: { bf: 2.5, af: 1.8, offline: 1.5 },
    signature: {
      id: 'exhume',
      label: 'EXHUME',
      text: 'Take thirty seconds of Bone out of the ground at once.',
    },
    curseText: 'Genuinely bad at fighting. You will plateau.',
    wants: 'Bone, Ash, and a long night',
    sigil: { symmetry: 1, rings: 2, strokeWeight: 3, density: 0.45, coreFill: 'solid', jitter: 0.5, openness: 0.2 },
  },
]

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
  CLASSES.map((c) => [c.id, c]),
)

export const DEFAULT_CLASS = 'hoplite'
