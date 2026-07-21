/**
 * What Names buy. Names are slow on purpose — a player should feel each one —
 * so nothing here is a stat. Names buy things that are not numbers.
 * docs/03-COMBAT-MATH.md § 7
 */
export type NamePurchase = {
  id: string
  label: string
  blurb: string
  cost: number
  /** how many times it can be bought */
  max: number
  /** cost grows by this much per purchase */
  step?: number
}

export const NAME_SHOP: NamePurchase[] = [
  {
    id: 'slot',
    label: 'A DEEPER POCKET',
    blurb: '+1 relic slot',
    cost: 1,
    max: 2,
    step: 2,
  },
  {
    id: 'vowslot',
    label: 'A THING TO SWEAR ON',
    blurb: '+1 Vow slot',
    cost: 2,
    max: 3,
    step: 2,
  },
  {
    id: 'orders2',
    label: 'WRITTEN ORDERS',
    blurb: 'Standing Orders may also spend Ash for you',
    cost: 5,
    max: 1,
  },
  {
    id: 'keepbone',
    label: 'A HABIT OF POCKETS',
    blurb: 'Keep 25% of your Bone upgrades through Reveille',
    cost: 4,
    max: 1,
  },
  {
    id: 'keys',
    label: 'A HEAVIER RING',
    blurb: '+3 to your Key cap',
    cost: 3,
    max: 3,
    step: 2,
  },
  {
    id: 'descents',
    label: 'TWO WAYS DOWN',
    blurb: '+1 Descent running at once',
    cost: 4,
    max: 3,
    step: 3,
  },
  {
    id: 'class_cartographer',
    label: 'A MAP OF YOUR OWN',
    blurb: 'Unlocks CARTOGRAPHER — reveals Descent rooms, +100% relics, and cannot fight the Column',
    cost: 3,
    max: 1,
  },
  {
    id: 'class_null',
    label: 'THE BLANK COAT',
    blurb: 'Unlocks NULL — the tree does nothing; only what you carry counts',
    cost: 8,
    max: 1,
  },
  {
    id: 'class_warden',
    label: 'A WARDEN’S COAT',
    blurb: 'Unlocks WARDEN — you take the Stand statline, and its timer, at every Rank',
    cost: 12,
    max: 1,
  },
]

export const NAME_SHOP_BY_ID: Record<string, NamePurchase> = Object.fromEntries(
  NAME_SHOP.map((n) => [n.id, n]),
)

export function nameCost(p: NamePurchase, owned: number): number {
  return p.cost + (p.step ?? 0) * owned
}
