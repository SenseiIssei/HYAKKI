/**
 * ICHOR buys RULES, not stats. Prestige tier 3 has to change what the game is,
 * not multiply what it already was — otherwise it is just a bigger Ash tree.
 * docs/03-COMBAT-MATH.md § 8
 */
export type IchorRule = {
  id: string
  label: string
  /** what it actually does, in plain terms */
  rule: string
  /** why it matters — the wall it is designed to break */
  why: string
  cost: number
  max: number
  step?: number
}

export const ICHOR_RULES: IchorRule[] = [
  {
    id: 'softcap',
    label: 'THE COAT REMEMBERS',
    rule: "Armor's softcap stops growing with Rank.",
    why: 'Armor currently decays to nothing past Rank 1,000. This makes it a real stat again.',
    cost: 8,
    max: 1,
  },
  {
    id: 'floor',
    label: 'A THINNER FLOOR',
    rule: 'The 5% damage floor becomes 2%.',
    why: 'Mitigation stops bottoming out, which is what ends deep runs.',
    cost: 6,
    max: 1,
  },
  {
    id: 'twice',
    label: 'IT RINGS TWICE',
    rule: 'Your Signature fires twice each time.',
    why: 'Doubles the one part of your build that is not a number.',
    cost: 10,
    max: 1,
  },
  {
    id: 'bone',
    label: 'DEEPER POCKETS',
    rule: 'Bone growth rises from 1.11 to 1.13 per Rank.',
    why: 'Bone falls behind enemies by design. This narrows the gap.',
    cost: 5,
    max: 2,
    step: 4,
  },
  {
    id: 'hardening',
    label: 'IT LEARNS SLOWER',
    rule: "The Hollow's third gear softens: growth past Rank 1,000 eases by 1%.",
    why: 'This is the wall at ~Rank 6,800. It is the only thing that moves it.',
    cost: 14,
    max: 3,
    step: 8,
  },
  {
    id: 'returned',
    label: 'THEY LEFT SOMETHING',
    rule: 'The Returned drop Ash when they fall.',
    why: 'Turns your own dead into income.',
    cost: 4,
    max: 1,
  },
  {
    id: 'twoclasses',
    label: 'TWO COATS',
    rule: 'You may wear a second class. Its Pipeline applies at half.',
    why: 'The one everyone saves for.',
    cost: 40,
    max: 1,
  },
]

export const ICHOR_BY_ID: Record<string, IchorRule> = Object.fromEntries(
  ICHOR_RULES.map((r) => [r.id, r]),
)

export function ichorCost(r: IchorRule, owned: number): number {
  return r.cost + (r.step ?? 0) * owned
}
