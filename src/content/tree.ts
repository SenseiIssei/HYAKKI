import type { Effect, StatKey } from './upgrades'

/**
 * The Ash tree. 14 nodes live now; OMEN is gated behind relics (Phase 2) so the
 * tree never shows a node that does nothing.
 *
 * Every node has infinite levels at `base * 1.13^level`, with a KEYSTONE every
 * 25 levels. Keystones are what stop this being a flat number treadmill — each
 * one is a qualitative rule change, and every keystone listed here is actually
 * implemented. docs/05-PROGRESSION.md
 */

export type Trunk = 'flesh' | 'iron' | 'rite'

export type Keystone = {
  /** flag id consulted by sim code */
  id: string
  level: number
  text: string
}

export type TreeNode = {
  id: string
  trunk: Trunk
  label: string
  blurb: string
  base: number
  effect: Effect
  keystones: Keystone[]
  /** system this node needs; hidden until it exists */
  requires?: 'relics'
}

const k = (id: string, level: number, text: string): Keystone => ({ id, level, text })

export const TREE: TreeNode[] = [
  // ── FLESH ───────────────────────────────────────────────────────────
  {
    id: 'meat', trunk: 'flesh', label: 'MEAT', blurb: '×1.08 Max Health', base: 8,
    effect: { kind: 'mult', stat: 'hp', amount: 1.08 },
    keystones: [
      k('meat25', 25, 'Gain 0.5% of Max Health as Regeneration'),
      k('meat50', 50, 'A single hit taken from above 50% Health cannot kill you'),
      k('meat75', 75, 'Healing past full becomes a shield, up to 20% of Max Health'),
      k('meat100', 100, 'Max Health adds 2% of itself to Attack'),
    ],
  },
  {
    id: 'scar', trunk: 'flesh', label: 'SCAR', blurb: '+4 Armor', base: 12,
    effect: { kind: 'flat', stat: 'arm', amount: 4 },
    keystones: [
      k('scar25', 25, 'Take 10% less damage during a Stand'),
      k('scar50', 50, 'Gain 1 Armor for every Rank cleared this run'),
      k('scar75', 75, "Armor's softcap grows 5% more slowly"),
      k('scar100', 100, '20% of Armor is added to Attack'),
    ],
  },
  {
    id: 'clot', trunk: 'flesh', label: 'CLOT', blurb: '×1.08 Regeneration', base: 20,
    effect: { kind: 'mult', stat: 'reg', amount: 1.08 },
    keystones: [
      k('clot25', 25, 'Regeneration ticks at 3× during a Stand'),
      k('clot50', 50, 'Killing an enemy heals 2% of Max Health'),
      k('clot75', 75, 'Regeneration gains +2% per Rank cleared this run'),
      k('clot100', 100, 'While above 90% Health, +25% Attack'),
    ],
  },
  {
    id: 'marrow', trunk: 'flesh', label: 'MARROW', blurb: '+0.5% Lifesteal', base: 45,
    effect: { kind: 'flat', stat: 'ls', amount: 0.005 },
    keystones: [
      k('marrow25', 25, 'Lifesteal also applies to Burn damage'),
      k('marrow50', 50, 'Overkill damage is lifestolen too'),
      k('marrow75', 75, 'Lifesteal is doubled during a Stand'),
      k('marrow100', 100, '+50% Lifesteal effectiveness'),
    ],
  },
  {
    id: 'return', trunk: 'flesh', label: 'RETURN', blurb: '+2% chance to revive on death', base: 200,
    effect: { kind: 'flat', stat: 'revive', amount: 0.02 },
    keystones: [
      k('return25', 25, 'Revive at 40% Health instead of 15%'),
      k('return50', 50, 'Revive twice per run'),
      k('return75', 75, 'Reviving grants 5 seconds of immunity'),
      k('return100', 100, 'Reviving fully restores Resolve'),
    ],
  },

  // ── IRON ────────────────────────────────────────────────────────────
  {
    id: 'edge', trunk: 'iron', label: 'EDGE', blurb: '×1.08 Attack', base: 8,
    effect: { kind: 'mult', stat: 'atk', amount: 1.08 },
    keystones: [
      k('edge25', 25, '+1% Attack per 10 Ranks cleared this run'),
      k('edge50', 50, 'The first hit on a new enemy deals 300%'),
      k('edge75', 75, 'Attack adds 5% of itself to Burn damage'),
      k('edge100', 100, '+30% Attack while the enemy is above 80% Health'),
    ],
  },
  {
    id: 'haste', trunk: 'iron', label: 'HASTE', blurb: '+5% Attack Speed', base: 15,
    effect: { kind: 'add', stat: 'spd', amount: 0.05 },
    keystones: [
      k('haste25', 25, 'Attack Speed also adds to Resolve Rate'),
      k('haste50', 50, 'Every 10th hit ignores its cooldown'),
      k('haste75', 75, 'Kills grant +30% Attack Speed for 2s, stacking to 5'),
      k('haste100', 100, '+50% Attack Speed during a Stand'),
    ],
  },
  {
    id: 'spite', trunk: 'iron', label: 'SPITE', blurb: '+2% Crit Chance', base: 18,
    effect: { kind: 'flat', stat: 'cc', amount: 0.02 },
    keystones: [
      k('spite25', 25, 'Crit Chance above 100% becomes Crit Multiplier'),
      k('spite50', 50, 'Crits pierce 20% Armor'),
      k('spite75', 75, 'Crits refund 5 Resolve'),
      k('spite100', 100, 'After 8 attacks without a crit, the next one always crits'),
    ],
  },
  {
    id: 'cruelty', trunk: 'iron', label: 'CRUELTY', blurb: '+0.06× Crit Multiplier', base: 30,
    effect: { kind: 'flat', stat: 'cm', amount: 0.06 },
    keystones: [
      k('cruelty25', 25, '+0.5× Crit Multiplier against Wardens'),
      k('cruelty50', 50, "Crit Multiplier scales with the enemy's missing Health, up to +50%"),
      k('cruelty75', 75, 'Crits strip 20% of the enemy Armor for 2 seconds'),
      k('cruelty100', 100, 'Crit Multiplier also applies to Burn'),
    ],
  },
  {
    id: 'awl', trunk: 'iron', label: 'AWL', blurb: '+1.5% Penetration', base: 60,
    effect: { kind: 'flat', stat: 'pen', amount: 0.015 },
    keystones: [
      k('awl25', 25, 'Penetration beyond 100% becomes Attack'),
      k('awl50', 50, 'Ignore the 5% damage floor — deal true damage'),
      k('awl75', 75, '+20% Penetration during a Stand'),
      k('awl100', 100, 'Penetration also reduces the enemy Attack'),
    ],
  },

  // ── RITE ────────────────────────────────────────────────────────────
  {
    // Economy nodes stay ADDITIVE on purpose. Multiplicative Ash Find feeds its
    // own income and the whole curve goes superexponential — measured, it hit
    // Rank 899 by run 7 and stopped being a game.
    id: 'tithe', trunk: 'rite', label: 'TITHE', blurb: '+8% Bone Find', base: 10,
    effect: { kind: 'add', stat: 'bf', amount: 0.08 },
    keystones: [
      k('tithe25', 25, 'Bone upgrades cost 10% less'),
      k('tithe50', 50, 'Unspent Bone grants +1% Attack per 1,000 held'),
      k('tithe75', 75, '5% of your Bone survives Reveille'),
      k('tithe100', 100, 'Wardens drop 3× Bone'),
    ],
  },
  {
    id: 'pyre', trunk: 'rite', label: 'PYRE', blurb: '+6% Ash Find', base: 40,
    effect: { kind: 'add', stat: 'af', amount: 0.06 },
    keystones: [
      k('pyre25', 25, 'Wardens grant bonus Ash'),
      k('pyre50', 50, 'Ash gained is never less than 60% of your best run'),
      k('pyre75', 75, '+10% Ash per Stand held this run'),
      k('pyre100', 100, '+1% Ash per 100 enemies felled this run'),
    ],
  },
  {
    id: 'vigil', trunk: 'rite', label: 'VIGIL', blurb: '+1h offline window', base: 90,
    effect: { kind: 'flat', stat: 'offline', amount: 1 },
    keystones: [
      k('vigil25', 25, 'Offline progress runs at full efficiency'),
      k('vigil50', 50, 'Offline window ×1.5'),
      k('vigil75', 75, 'Offline window ×1.5 again'),
      k('vigil100', 100, 'Offline progress also earns Bone at full rate'),
    ],
  },
  {
    id: 'resolve', trunk: 'rite', label: 'RESOLVE', blurb: '+6% Resolve Rate', base: 55,
    effect: { kind: 'add', stat: 'res', amount: 0.06 },
    keystones: [
      k('resolve25', 25, 'Your Signature fires at 90 Resolve instead of 100'),
      k('resolve50', 50, 'Your Signature has a 15% chance not to consume Resolve'),
      k('resolve75', 75, '+50% Resolve Rate during a Stand'),
      k('resolve100', 100, 'Signatures are 30% stronger'),
    ],
  },
  {
    id: 'omen', trunk: 'rite', label: 'OMEN', blurb: '+3% relic drop rate', base: 70,
    effect: { kind: 'add', stat: 'omen', amount: 0.03 },
    keystones: [
      k('omen25', 25, 'A guaranteed relic every 5 Stands'),
      k('omen50', 50, 'Drops roll one extra affix'),
      k('omen75', 75, 'Increased chance of a higher rarity tier'),
      k('omen100', 100, 'Duplicate relics merge into an extra affix roll'),
    ],
  },
]

export const TREE_BY_ID: Record<string, TreeNode> = Object.fromEntries(
  TREE.map((n) => [n.id, n]),
)

export const TRUNKS: { id: Trunk; label: string; blurb: string }[] = [
  { id: 'flesh', label: 'FLESH', blurb: 'survival & sustain' },
  { id: 'iron', label: 'IRON', blurb: 'offence' },
  { id: 'rite', label: 'RITE', blurb: 'economy & time' },
]

/** Every keystone earned, as a flag set the sim can ask cheap questions of. */
export function keystoneFlags(levels: Record<string, number>): Set<string> {
  const flags = new Set<string>()
  for (const node of TREE) {
    const lvl = levels[node.id] ?? 0
    for (const ks of node.keystones) if (lvl >= ks.level) flags.add(ks.id)
  }
  return flags
}

/** Stat keys the tree can touch beyond the combat block. */
export type ExtendedStatKey = StatKey | 'revive' | 'offline' | 'omen'
