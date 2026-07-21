import Decimal from 'break_infinity.js'
import type { Family } from '../content/balance'

/**
 * Magnitudes are Decimal (they will exceed 1e308).
 * Rates, chances and multipliers stay `number` — they are bounded by design.
 * See docs/11-ARCHITECTURE.md § Decimal discipline.
 */
export type StatBlock = {
  hp: Decimal
  reg: Decimal
  atk: Decimal
  arm: Decimal
  spd: number
  eva: number
  cc: number
  cm: number
  pen: number
  ls: number
  res: number
  bf: number
  af: number
  // meta
  revive: number
  offline: number
  omen: number
}

export type Enemy = {
  family: Family
  name: string
  seed: number
  hp: Decimal
  maxHp: Decimal
  atk: Decimal
  arm: Decimal
  spd: number
  cooldown: number
  isWarden: boolean
  wardenId?: string
  /** which yōkai this actually is, within its family */
  speciesId?: string
  /** THE RETURNED: the past self this one was made from */
  ghost?: Ghost
  /** WHAT YOU LEFT BEHIND: the Ascension this one was made from */
  authored?: AuthoredWarden
  /** Lampbearer stacks. Decays continuously; carries between enemies. */
  burn: number
  /** Interposed enemies (THE QUARTERMASTER's ISSUE). Front of array is target. */
  guards: Enemy[]
  /** ticks until the Warden's Signature fires; -1 = no more */
  sigTicks: number
  sigCount: number
  /** ticks of the telegraph currently showing */
  tellTicks: number
  /** MOTH: cannot be hit while > 0 */
  untargetable: number
  /** THE COLUMN'S HEAD ramp */
  atkMult: number
  /** CRUELTY 75 armor strip */
  armStripTicks: number
}

export type RolledAffix = { id: string; value: number }

export type Relic = {
  uid: string
  seed: number
  rarity: import('../content/relics').Rarity
  /** which of the six slots this is worn in */
  slot: import('../content/relics').EquipSlot
  affixes: RolledAffix[]
  /** authored Myth / True Name id */
  unique?: string
  name: string
  dropRank: number
}

export type Soldier = {
  hp: Decimal
  cooldown: number
  resolve: number
  /** shield from MEAT 75 */
  shield: Decimal
}

/**
 * A snapshot of one finished run. Kept rolling (cap 500). CHORUS summons these
 * as Echoes; the Returned enemy family will wear them in Phase 4.
 */
export type Ghost = {
  soldierNumber: number
  classId: string
  deepestRank: number
  seed: number
  diedTo: string
  /** one affix it was carrying — the Returned wear it back at you */
  affix?: RolledAffix
}

export type AuthoredWarden = {
  soldierNumber: number
  classId: string
  deepestRank: number
  seed: number
  vows: string[]
  /** the Ascension it came from */
  ascension: number
}

export type DescentRoom = {
  id: number
  type: import('../content/layers').RoomType
  floor: number
  /** lane within the floor, for drawing */
  lane: number
  /** room ids reachable from here */
  next: number[]
}

export type DescentMap = {
  layerId: string
  depth: number
  seed: number
  rooms: DescentRoom[]
  /** room ids on the first floor */
  entrances: number[]
  floors: number
}

export type RoomOutcome = {
  roomId: number
  type: import('../content/layers').RoomType
  /** what happened, in one line, in voice */
  text: string
  hpAfter: string
  died: boolean
}

export type DescentResult = {
  cleared: boolean
  diedAt: number | null
  rooms: RoomOutcome[]
  ash: string
  relics: Relic[]
  names: number
  fragment?: string
}

export type ActiveDescent = {
  id: string
  layerId: string
  depth: number
  seed: number
  route: number[]
  startedAt: number
  durationMs: number
  /**
   * Resolved deterministically at commit time and revealed when the clock runs
   * out. The estimate the player was shown is therefore exactly what happens,
   * and nothing can be gamed by upgrading mid-Descent.
   */
  result: DescentResult
  collected: boolean
}

export type SimEvent =
  | { t: 'hit'; target: 'enemy' | 'soldier'; amount: Decimal; crit: boolean }
  | { t: 'miss'; target: 'enemy' | 'soldier' }
  | {
      t: 'kill'
      bone: Decimal
      name: string
      /** enough of the fallen to draw its corpse dissolving */
      family: string
      seed: number
      speciesId?: string
      warden: boolean
    }
  | { t: 'rank'; rank: number }
  | { t: 'stand'; warden: string }
  | { t: 'standWon'; line: string }
  | { t: 'standLost'; rank: number }
  | { t: 'signature'; label: string }
  | { t: 'revive' }
  | { t: 'relic'; relic: Relic }
  | { t: 'echoLost' }
  | { t: 'purify' }
  | { t: 'ward'; name: string; kanji: string; failed: boolean }
  | {
      t: 'ability'
      id: string
      vfx: string
      /** 1..3 — how epic the animation should be */
      tier: number
      color: string
      name: string
      kanji: string
      damage: Decimal
      /** the number of separate strikes the burst was split into */
      hits: number
      /** did it finish the enemy */
      killed: boolean
    }
  | { t: 'unlock'; classId: string; name: string }
  | { t: 'death'; rank: number; cause: string }
  | { t: 'log'; text: string }

export type GameState = {
  /** save schema version */
  v: number

  // ── identity ──
  classId: string
  soldierNumber: number
  soldierSeed: number
  reveilles: number

  // ── the run ──
  rank: number
  bestRank: number
  /** deepest Rank ever reached, across every Reveille */
  bestRankEver: number
  enemyIndex: number
  enemiesThisRank: number
  enemy: Enemy
  soldier: Soldier
  dead: boolean
  deathCause: string
  runTicks: number
  killsThisRun: number

  // ── stands ──
  /** ticks remaining on the current Stand; 0 = not in one */
  standTimer: number
  standTimerMax: number
  standFails: number
  standsThisRun: number

  // ── run-scoped combat flags ──
  revivesUsed: number
  immuneTicks: number
  sigKind: string
  sigTicks: number
  sigCharges: number
  sigStored: Decimal
  nonCritStreak: number
  hitCounter: number
  killSpdStacks: number
  killSpdTicks: number
  freshEnemy: boolean
  /** THE DROWNED SERGEANT's ORDER */
  silencedTicks: number
  /** CHORUS: past selves still standing this run */
  echoes: number

  /**
   * ABILITIES 術 — cooldown remaining, in ticks, per ability id. Run-scoped:
   * you draw every art fresh at each waking. Which arts you know and how strong
   * they are is derived from depth (see src/content/abilities.ts), so nothing
   * here needs to persist except the cooldowns of the current fight.
   */
  abilityCd: Record<string, number>

  /**
   * KEGARE 穢れ — defilement. Not sin and not damage: it is the pollution that
   * contact with death leaves on a living thing, and the whole of Shinto
   * practice is about washing it off rather than being forgiven for it.
   *
   * Run-scoped, 0..1. It buys real power and takes real safety (see
   * src/content/kegare.ts), so a filthy walk is a strategy rather than a
   * punishment. Cleansed at the riverbed, for a price.
   */
  kegare: number

  /**
   * OFUDA 御札 — the paper wards carried onto this walk, by id, up to
   * OFUDA_SLOTS. Chosen BEFORE a walk and never swapped during one: a ward is
   * a bet on what the road is made of, and that bet has to be locked to mean
   * anything.
   */
  ofuda: string[]
  /** charges left on each carried ward. Paper burns; these never refill mid-walk. */
  ofudaCharges: Record<string, number>
  /** wards unlocked so far, by id — they drop from Hearings, not from chaff */
  ofudaOwned: string[]

  // ── relics ──
  /** length is the slot count; null is an empty slot */
  equipped: (Relic | null)[]
  inventory: Relic[]
  /** relic slots bought with Names (Phase 4) */
  slotBonus: number

  // ── ghosts: a snapshot of every run, kept for CHORUS and the Returned ──
  ghosts: Ghost[]

  // ── currency ──
  bone: Decimal
  boneLevels: Record<string, number>
  ash: Decimal
  treeLevels: Record<string, number>
  /** lifetime Ash spent — drives Names at Interment (Phase 4) */
  ashSpentTotal: Decimal
  /** best single Reveille payout, for the PYRE 50 floor */
  bestAsh: Decimal
  /** what the previous Reveille paid — the baseline Standing Orders compare to */
  lastAsh: Decimal

  // ── prestige tier 2: Interment ──
  names: number
  namesSpent: number
  interments: number
  /** Ash spent across the whole Ascension — what Names are drawn from */
  ashSpentThisAscension: Decimal
  /** Names earned from first Warden kills, kept across Interment */
  wardenNames: number
  /** what the Name shop has sold you */
  purchases: Record<string, number>
  /** Vows sworn for this Ascension */
  vows: string[]

  // ── descents ──
  /** fractional; whole Keys are spendable */
  keys: number
  /** Names spent opening Layers */
  layerNames: number
  /** running and finished-but-uncollected Descents */
  descents: ActiveDescent[]
  descentsCleared: number

  // ── prestige tier 3: Apotheosis ──
  ichor: number
  ichorSpent: number
  apotheoses: number
  /** Names spent across the whole Ascension chain — what Ichor is drawn from */
  namesSpentTotal: number
  /** rule modifiers bought with Ichor */
  rules: Record<string, number>
  /** THE MYRIAD has fallen. There is no number after this one. */
  myriadFelled: boolean
  /** fragment numbers EARNED — a candle has been lit for each */
  fragments: number[]
  /**
   * Fragment numbers actually READ in the Hyakumonogatari — the candle snuffed.
   * The room darkens with the count of these, and the hundredth story opens
   * only when ninety-nine have been put out.
   */
  snuffed: number[]
  /** the hundredth candle has been put out. There is no story after this one. */
  hundredth: boolean
  /** observation ids the game has made about you */
  observations: string[]
  /**
   * Your best Ascension, kept as a Warden for the Ascensions after it.
   * The Hollow reissues its dead; you are the Hollow now.
   */
  authored: AuthoredWarden | null

  /**
   * Standing Orders: the rule that makes MYRIAD genuinely idle. Automating a
   * system is the reward for having mastered it, so this unlocks at Reveille 25.
   * docs/02-CORE-LOOP.md § Standing Orders
   */
  orders: {
    enabled: boolean
    /** wake when the projected Ash is this many times the last run's */
    ashMultiple: number
    /** wake after this long without gaining a Rank */
    stallMinutes: number
    /** tier 2 (bought with a Name): also spend Ash down a priority list */
    autoBuy: boolean
    /** tree node ids, most important first */
    priority: string[]
  }

  // ── lifetime ──
  totalTicks: number
  totalKills: number
  totalDeaths: number
  firstPlayedAt: number
  lastSeenAt: number

  // ── plumbing ──
  rngState: number
  events: SimEvent[]
  /** UI reveal flags — see docs/10-UI-UX.md § Onboarding */
  seen: Record<string, boolean>
}
