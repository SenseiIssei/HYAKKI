import {
  AFFIXES,
  AFFIX_BY_ID,
  RARITIES,
  RARITY_ORDER,
  UNIQUES,
  UNIQUE_BY_ID,
  type Rarity,
  type UniqueDef,
} from '../content/relics'
import { Rng, hashSeed } from './rng'
import type { Relic, RolledAffix } from './types'

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
  for (let i = 0; i < def.affixes && pool.length; i++) {
    const idx = rng.int(0, pool.length)
    const a = pool.splice(idx, 1)[0]
    // Issued rolls in the low half; Myth and above roll in the high half.
    let t = rng.next()
    if (rarity === 'issued') t *= 0.5
    else if (rarity === 'myth' || rarity === 'truename') t = 0.5 + t * 0.5
    else if (rarity === 'named' && i === 0) t = 0.6 + t * 0.4
    const roll = t * quality + (rarity === 'truename' ? (1 - quality) : 0)
    affixes.push({ id: a.id, value: a.min + (a.max - a.min) * Math.min(1, roll) })
  }

  return {
    uid: `${seed.toString(36)}-${dropRank}`,
    seed,
    rarity,
    affixes,
    unique,
    name,
    dropRank,
  }
}

export function relicSeed(rank: number, kills: number, runSeed: number): number {
  return hashSeed('relic', rank, kills, runSeed)
}

export function relicLabel(r: Relic): string {
  if (r.unique) return r.name
  const parts = r.affixes.map((a) => AFFIX_BY_ID[a.id]?.label ?? a.id)
  return parts.length ? parts.join(', ') : RARITIES[r.rarity].label
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
