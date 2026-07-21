/** Bone upgrades — run-scoped, wiped on Reveille. docs/13-CONTENT-TABLES.md */

export type StatKey =
  | 'hp' | 'reg' | 'atk' | 'arm' | 'spd' | 'eva'
  | 'cc' | 'cm' | 'pen' | 'ls' | 'res' | 'bf' | 'af'
  // meta stats — not part of the combat block, read directly off the tree
  | 'revive' | 'offline' | 'omen'

export type Effect =
  | { kind: 'flat'; stat: StatKey; amount: number }
  | { kind: 'add'; stat: StatKey; amount: number }
  /**
   * Compounding per level: `stat *= amount ^ level`. The tree's primary nodes
   * must be multiplicative — additive levels grow linearly in level count and
   * so can never keep pace with enemies that grow exponentially in Rank.
   */
  | { kind: 'mult'; stat: StatKey; amount: number }

export type BoneUpgrade = {
  id: string
  label: string
  blurb: string
  base: number
  effect: Effect
  /** Bone total at which this upgrade first appears. */
  revealAt: number
}

export const BONE_UPGRADES: BoneUpgrade[] = [
  {
    id: 'reinforce',
    label: 'REINFORCE',
    blurb: '+8% Attack',
    base: 5,
    effect: { kind: 'add', stat: 'atk', amount: 0.08 },
    revealAt: 5,
  },
  {
    id: 'standfast',
    label: 'STAND FAST',
    blurb: '+8% Max Health',
    base: 5,
    effect: { kind: 'add', stat: 'hp', amount: 0.08 },
    revealAt: 20,
  },
  {
    id: 'whet',
    label: 'WHET',
    blurb: '+4% Attack Speed',
    base: 12,
    effect: { kind: 'add', stat: 'spd', amount: 0.04 },
    revealAt: 20,
  },
  {
    id: 'plate',
    label: 'PLATE',
    blurb: '+6 Armor',
    base: 15,
    effect: { kind: 'flat', stat: 'arm', amount: 6 },
    revealAt: 60,
  },
  {
    id: 'bleedthem',
    label: 'BLEED THEM',
    blurb: '+1% Lifesteal',
    base: 40,
    effect: { kind: 'flat', stat: 'ls', amount: 0.01 },
    revealAt: 200,
  },
  {
    id: 'quicken',
    label: 'QUICKEN',
    blurb: '+5% Resolve Rate',
    base: 60,
    effect: { kind: 'add', stat: 'res', amount: 0.05 },
    revealAt: 400,
  },
]

export const BONE_UPGRADE_BY_ID: Record<string, BoneUpgrade> = Object.fromEntries(
  BONE_UPGRADES.map((u) => [u.id, u]),
)
