/**
 * Every tunable constant in MYRIAD. No logic lives here.
 * See docs/03-COMBAT-MATH.md and docs/13-CONTENT-TABLES.md.
 */
export const BALANCE = {
  TICK_MS: 100,
  TICKS_PER_SEC: 10,

  // ── soldier base statline ──
  BASE_HP: 140,
  BASE_REG: 3.0,
  BASE_ATK: 17,
  BASE_SPD: 1.35,
  BASE_ARM: 0,
  BASE_EVA: 0,
  BASE_CC: 0.05,
  BASE_CM: 1.5,
  BASE_PEN: 0,
  BASE_LS: 0,
  BASE_RES: 1.0,
  BASE_BF: 1.0,
  BASE_AF: 1.0,

  // ── enemy scaling ──
  ENEMY_HP_BASE: 10,
  ENEMY_ATK_BASE: 1.5,
  ENEMY_ARM_BASE: 0.6,
  ENEMY_SPD_BASE: 0.8,
  GROWTH: 1.145,
  /** growth at Rank 1, ramping to GROWTH by WARMUP_RANKS */
  GROWTH_WARM: 1.075,
  WARMUP_RANKS: 40,
  /** Attack lags HP deliberately: fights get longer, not deadlier. */
  ATK_EXP: 0.75,
  ARM_EXP: 0.55,
  HARDEN_100: 1.03,
  HARDEN_1000: 1.05,
  HARDEN_10000: 1.09,

  /**
   * Pace. Fewer things per Ri and a faster base swing — the Ri counter should
   * move often enough that you feel you are travelling, not grinding. Measured
   * before/after in scripts/balance.ts.
   */
  ENEMIES_PER_RANK_BASE: 3,
  ENEMIES_PER_RANK_DIV: 40,
  ENEMIES_PER_RANK_CAP: 8,

  // ── stands ──
  STAND_EVERY: 10,
  STAND_HP_MULT: 8,
  STAND_ATK_MULT: 1.6,
  /** seconds — a hearing should be tense, not a waiting room */
  STAND_TIMER_BASE: 22,
  STAND_TIMER_PER_100: 4,
  /** Learning shouldn't cost a run. Kept modest: the bonus only ever applies
   *  once per Warden, so a large one makes the NEXT run feel like a regression. */
  STAND_FIRST_SEEN_BONUS: 1.25,
  STAND_PUSHBACK: 3,
  STAND_FAILS_TO_END: 3,

  // ── mitigation ──
  ARMOR_K_BASE: 30,
  ARMOR_K_GROWTH: 1.08,
  DAMAGE_FLOOR: 0.05,

  // ── economy ──
  /**
   * Raised alongside the enemy-count cut. Fewer things per Ri means fewer
   * drops, so per-kill Tama has to rise or upgrades fall behind and the whole
   * midgame slows down — measured, TTK hit 9.8s at Ri 40 before this.
   */
  BONE_BASE: 3.4,
  BONE_GROWTH: 1.11,
  BONE_STAND_MULT: 25,
  /**
   * Ash is EXPONENTIAL in depth, not polynomial.
   *
   * The original design had `(rank / 12) ^ 2.1`. That cannot compound: reaching
   * Rank R needs power growing like 1.145^R, but pays a reward growing like
   * R^2.1. Polynomial reward against exponential requirement converges to a
   * fixed point — measured, the game stalled dead at Rank 50 forever no matter
   * how much was spent. Each Rank must MULTIPLY the payout, not add to it.
   */
  ASH_BASE: 1.5,
  ASH_GROWTH: 1.09,

  // ── resolve ──
  RESOLVE_BASE_GAIN: 0.6,
  RESOLVE_DAMAGE_SCALE: 4,
  RESOLVE_CAP: 100,

  // ── burn (Lampbearer) ──
  /** damage per stack per tick, as a fraction of ATK */
  BURN_PER_STACK: 0.02,
  /** per-tick decay; ~8s to fall to a third of peak */
  BURN_DECAY: 0.9875,
  /** fraction of stacks that survive onto the next enemy */
  BURN_CARRY: 0.5,

  // ── upgrades ──
  BONE_UPGRADE_SCALE: 1.16,
  TREE_NODE_SCALE: 1.06,
  KEYSTONE_EVERY: 25,

  // ── offline ──
  OFFLINE_WINDOW_H_BASE: 12,
  OFFLINE_EFFICIENCY: 0.7,

  // ── descents ──
  KEY_REGEN_MIN: 20,
  KEY_CAP_BASE: 3,

  // ── relics ──
  RELIC_DROP_BASE: 0.012,
  /** Wardens are the intended source — a Stand should usually be worth something. */
  RELIC_DROP_STAND: 0.6,

  // ── names (prestige tier 2) ──
  /**
   * Names per order of magnitude of Ash spent. Ash is exponential in depth, so
   * log10 makes Names linear in depth. Calibrated in scripts/interment.ts.
   */
  NAMES_PER_DECADE: 0.25,

  // ── vows ──
  /** Vow of the Long Count: enemy growth 1.145 -> 1.16 */
  VOW_LONGCOUNT_GROWTH: 1.16,
  /** Vow of Haste: every Rank is timed, in seconds */
  VOW_HASTE_TIMER: 20,
  /** Vow of Ten Thousand: the Ascension ends here */
  VOW_TEN_THOUSAND: 10000,

  // ── misc ──
  GHOST_CAP: 500,
  SAVE_INTERVAL_MS: 10_000,
} as const

/** Family stat modifiers — docs/07-ENEMIES.md */
export const FAMILY_MODS = {
  chaff: { hp: 0.7, atk: 1.0, arm: 0.8, spd: 1.3, bone: 1.0 },
  organs: { hp: 2.4, atk: 0.8, arm: 1.5, spd: 0.6, bone: 2.2 },
  returned: { hp: 1.3, atk: 1.4, arm: 1.0, spd: 1.0, bone: 1.8 },
  warden: { hp: 8.0, atk: 1.6, arm: 2.0, spd: 0.8, bone: 25 },
  nothing: { hp: 1.8, atk: 2.2, arm: 0.0, spd: 0.9, bone: 4.0 },
} as const

export type Family = keyof typeof FAMILY_MODS
