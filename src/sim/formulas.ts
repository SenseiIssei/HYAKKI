import Decimal from 'break_infinity.js'
import { BALANCE as B, FAMILY_MODS, type Family } from '../content/balance'

const D = (n: number | string | Decimal) => new Decimal(n)

/**
 * Enemy power curve. `1.145^rank` alone flattens out against exponential player
 * growth, so `hardening` adds a gear at each order of magnitude — each one
 * demands a qualitatively better build, not just more of the same.
 * docs/03-COMBAT-MATH.md § 4
 */
export function hardening(rank: number): Decimal {
  let h = D(1)
  if (rank >= 100) h = h.mul(Decimal.pow(B.HARDEN_100, Math.min(rank, 1000) - 100))
  if (rank >= 1000) h = h.mul(Decimal.pow(B.HARDEN_1000, Math.min(rank, 10000) - 1000))
  if (rank >= 10000) h = h.mul(Decimal.pow(B.HARDEN_10000, rank - 10000))
  return h
}

/**
 * Per-rank growth multiplier. The Hollow's immune response has to learn you
 * first: growth ramps from GROWTH_WARM up to the full GROWTH across the first
 * WARMUP ranks. Without this, run one ends around Rank 18 and the opening
 * never gets a chance to breathe.
 */
function stepGrowth(rank: number): number {
  if (rank >= B.WARMUP_RANKS) return B.GROWTH
  return B.GROWTH_WARM + (B.GROWTH - B.GROWTH_WARM) * (rank / B.WARMUP_RANKS)
}

// Cumulative product over the warm-up, memoised — `growth` is the hottest
// function in the sim.
const warmup: Decimal[] = [new Decimal(1)]
for (let r = 1; r <= B.WARMUP_RANKS; r++) {
  warmup[r] = warmup[r - 1].mul(stepGrowth(r))
}

/**
 * Extra per-Rank growth from the Vow of the Long Count. Applied as a separate
 * compounding factor so the memoised warm-up table stays valid.
 */
let growthExtra = 1
export function setGrowthExtra(mult: number) {
  growthExtra = mult
}

export function growth(rank: number): Decimal {
  const base =
    rank <= B.WARMUP_RANKS
      ? warmup[Math.max(0, rank)]
      : warmup[B.WARMUP_RANKS].mul(Decimal.pow(B.GROWTH, rank - B.WARMUP_RANKS))
  const vow = growthExtra === 1 ? 1 : Math.pow(growthExtra, rank)
  return base.mul(hardening(rank)).mul(vow)
}

export function enemyHp(rank: number, family: Family): Decimal {
  return D(B.ENEMY_HP_BASE).mul(growth(rank)).mul(FAMILY_MODS[family].hp)
}

export function enemyAtk(rank: number, family: Family): Decimal {
  return D(B.ENEMY_ATK_BASE).mul(Decimal.pow(growth(rank), B.ATK_EXP)).mul(FAMILY_MODS[family].atk)
}

export function enemyArm(rank: number, family: Family): Decimal {
  return D(B.ENEMY_ARM_BASE).mul(Decimal.pow(growth(rank), B.ARM_EXP)).mul(FAMILY_MODS[family].arm)
}

export function enemiesPerRank(rank: number): number {
  return Math.min(
    B.ENEMIES_PER_RANK_CAP,
    B.ENEMIES_PER_RANK_BASE + Math.floor(rank / B.ENEMIES_PER_RANK_DIV),
  )
}

/**
 * Armor softcap. K grows with Rank so a flat armor number decays in relevance
 * as you descend — this is what stops an early armor stack trivialising the
 * midgame. At A === K you take exactly half damage. Never reaches 1.0, and the
 * 5% damage floor in `mitigate` guarantees you always take something.
 */
export function armorK(rank: number, kScale = 1): Decimal {
  return D(B.ARMOR_K_BASE).mul(Decimal.pow(B.ARMOR_K_GROWTH, rank * kScale))
}

/** Returns the fraction of damage that GETS THROUGH, in [FLOOR, 1]. */
export function mitigation(armor: Decimal, rank: number, kScale = 1): number {
  if (armor.lte(0)) return 1
  const k = armorK(rank, kScale)
  const reduced = armor.div(armor.add(k)).toNumber()
  return Math.max(B.DAMAGE_FLOOR, 1 - reduced)
}

export function isStandRank(rank: number): boolean {
  return rank % B.STAND_EVERY === 0
}

export function wardenHp(rank: number, standsCleared: number): Decimal {
  return enemyHp(rank, 'warden').mul(1 + standsCleared * 0.02)
}

/** Ticks. Generous the first time you meet a Warden — learning shouldn't cost a run. */
export function standTimerTicks(rank: number, firstSeen: boolean): number {
  const seconds = (B.STAND_TIMER_BASE + B.STAND_TIMER_PER_100 * (rank / 100)) *
    (firstSeen ? B.STAND_FIRST_SEEN_BONUS : 1)
  return Math.round(seconds * B.TICKS_PER_SEC)
}

export function boneFromKill(rank: number, family: Family, bf: number): Decimal {
  return D(B.BONE_BASE)
    .mul(Decimal.pow(B.BONE_GROWTH, rank))
    .mul(FAMILY_MODS[family].bone)
    .mul(bf)
}

/**
 * Exponential in depth — every Rank multiplies the payout. See the note on
 * ASH_BASE in balance.ts for why this is not the polynomial the design doc
 * originally specified. docs/03-COMBAT-MATH.md § 6
 */
export function ashOnReveille(bestRank: number, af: number): Decimal {
  if (bestRank < 1) return D(0)
  return D(B.ASH_BASE).mul(Decimal.pow(B.ASH_GROWTH, bestRank)).mul(af).floor()
}

/** Geometric cost ladder, summed for bulk buys. */
export function costAt(base: number, scale: number, level: number): Decimal {
  return new Decimal(base).mul(Decimal.pow(scale, level))
}

export function costOfNext(base: number, scale: number, level: number, count: number): Decimal {
  // base * scale^level * (scale^count - 1) / (scale - 1)
  const first = costAt(base, scale, level)
  const num = Decimal.pow(scale, count).sub(1)
  return first.mul(num).div(scale - 1)
}

/** How many levels can `funds` buy, starting from `level`? */
export function affordableLevels(
  base: number,
  scale: number,
  level: number,
  funds: Decimal,
  cap = 1e6,
): number {
  const first = costAt(base, scale, level)
  if (funds.lt(first)) return 0
  // solve: first * (scale^n - 1)/(scale-1) <= funds
  const inner = funds.mul(scale - 1).div(first).add(1)
  const n = Math.floor(Decimal.log10(inner) / Math.log10(scale))
  return Math.max(0, Math.min(cap, n))
}
