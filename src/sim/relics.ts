import {
  AFFIXES,
  AFFIX_BY_ID,
  CURSES,
  RARITIES,
  RARITY_ORDER,
  SLOT_ORDER,
  STAT_SLOT,
  UNIQUES,
  UNIQUE_BY_ID,
  type EquipSlot,
  type Rarity,
  type UniqueDef,
} from '../content/relics'
import { baseFor, ITEM_BASE_BY_ID } from '../content/items'
import { Rng, hashSeed } from './rng'
import type { Relic, RolledAffix } from './types'

/**
 * Where a relic is worn. A unique wears where it was authored to; a rolled
 * relic wears where its primary (first-rolled) affix belongs, so a Whetted
 * blade is a Weapon and a Heavy coat is Body. Deterministic, so the same relic
 * always finds the same slot — including old saves being migrated.
 */
export function slotForRelic(r: {
  unique?: string
  affixes: RolledAffix[]
  seed: number
}): EquipSlot {
  if (r.unique) {
    const u = UNIQUE_BY_ID[r.unique]
    if (u) return u.slot
  }
  const primary = r.affixes[0]
  if (primary) {
    const def = AFFIX_BY_ID[primary.id]
    if (def && STAT_SLOT[def.stat]) return STAT_SLOT[def.stat]
  }
  // last resort: spread by seed so nothing lands nowhere
  return SLOT_ORDER[(r.seed >>> 0) % SLOT_ORDER.length]
}

/** Systems that exist yet. Nothing gated on a future phase can drop. */
const AVAILABLE = new Set<string>()

function pickRarity(rng: Rng, bonus: number): Rarity {
  const weights = RARITY_ORDER.map((r, i) => {
    const w = RARITIES[r].weight
    // `bonus` (from OMEN / drop-rate sources) tilts toward the top of the table
    return i >= 2 ? w * (1 + bonus) : w
  })
  const total = weights.reduce((a, b) => a + b, 0)
  let roll = rng.next() * total
  for (let i = 0; i < RARITY_ORDER.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return RARITY_ORDER[i]
  }
  return 'issued'
}

function uniquesFor(rarity: 'myth' | 'truename'): UniqueDef[] {
  return UNIQUES.filter((u) => u.rarity === rarity && (!u.requires || AVAILABLE.has(u.requires)))
}

/**
 * Deterministic from (seed, dropRank). Roll quality climbs with depth, so a
 * Rank 900 drop is meaningfully better than the same roll at Rank 20.
 * docs/06-RELICS.md
 */
export function rollRelic(seed: number, dropRank: number, rarityBonus = 0): Relic {
  const rng = new Rng(seed >>> 0)
  const rarity = pickRarity(rng, rarityBonus)
  const def = RARITIES[rarity]
  const quality = 0.4 + 0.6 * Math.min(1, dropRank / 500)

  let unique: string | undefined
  let name: string
  if (rarity === 'myth' || rarity === 'truename') {
    const pool = uniquesFor(rarity)
    const u = pool.length ? rng.pick(pool) : undefined
    unique = u?.id
    name = u?.name ?? def.label
  } else {
    name = def.label
  }

  // Affixes are distinct — a relic never rolls the same line twice.
  const pool = [...AFFIXES]
  const affixes: RolledAffix[] = []
  const highBand = rarity === 'blessed' || rarity === 'cursed' || rarity === 'myth' || rarity === 'truename'
  for (let i = 0; i < def.affixes && pool.length; i++) {
    const idx = rng.int(0, pool.length)
    const a = pool.splice(idx, 1)[0]
    // Issued rolls in the low half; Blessed and above roll in the high half.
    let t = rng.next()
    if (rarity === 'issued') t *= 0.5
    else if (highBand) t = 0.5 + t * 0.5
    else if (rarity === 'named' && i === 0) t = 0.6 + t * 0.4
    const roll = t * quality + (rarity === 'truename' ? 1 - quality : 0)
    affixes.push({ id: a.id, value: a.min + (a.max - a.min) * Math.min(1, roll) })
  }

  // A Cursed relic carries one curse in addition — bigger numbers, a real price.
  if (def.curse) {
    const c = rng.pick(CURSES)
    affixes.push({ id: c.id, value: c.min + (c.max - c.min) * rng.next() })
  }

  const relic: Relic = {
    uid: `${seed.toString(36)}-${dropRank}`,
    seed,
    rarity,
    slot: 'weapon', // replaced below once affixes/unique are known
    affixes,
    unique,
    name,
    dropRank,
  }
  relic.slot = slotForRelic(relic)

  // Common tiers get a named identity from the catalogue: the base gives the
  // name and lore, the affixes above give the numbers. Uniques keep their own
  // authored name and never take a base.
  if (!unique && rarity !== 'myth' && rarity !== 'truename') {
    const base = baseFor(relic.slot, rarity, seed)
    if (base) {
      relic.base = base.id
      relic.name = base.name
    }
  }
  return relic
}

/** A fresh, empty loadout — one null per typed slot, in SLOT_ORDER. */
export function emptyEquip(): (Relic | null)[] {
  return SLOT_ORDER.map(() => null)
}

export function relicSeed(rank: number, kills: number, runSeed: number): number {
  return hashSeed('relic', rank, kills, runSeed)
}

export function relicLabel(r: Relic): string {
  // uniques and catalogue bases carry their own name; only legacy drops with
  // neither fall back to a list of their affixes.
  if (r.unique || r.base) return r.name
  const parts = r.affixes.map((a) => AFFIX_BY_ID[a.id]?.label ?? a.id)
  return parts.length ? parts.join(', ') : RARITIES[r.rarity].label
}

/** The catalogue base a drop is, if any — for its name and lore in the UI. */
export function baseOf(r: Relic) {
  return r.base ? ITEM_BASE_BY_ID[r.base] : undefined
}

export function meltValue(r: Relic): number {
  return Math.max(1, Math.round(RARITIES[r.rarity].meltValue * (1 + r.dropRank / 40)))
}

export function uniqueOf(r: Relic): UniqueDef | undefined {
  return r.unique ? UNIQUE_BY_ID[r.unique] : undefined
}

/** Flags contributed by everything currently equipped. */
export function equippedFlags(equipped: (Relic | null)[]): Set<string> {
  const out = new Set<string>()
  for (const r of equipped) {
    if (!r) continue
    const u = uniqueOf(r)
    if (u?.flags) for (const f of u.flags) out.add(f)
  }
  return out
}

export function rarityRank(r: Rarity): number {
  return RARITY_ORDER.indexOf(r)
}
