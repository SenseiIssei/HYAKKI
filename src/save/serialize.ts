import Decimal from 'break_infinity.js'
import { SAVE_VERSION } from '../sim/state'
import { SLOT_ORDER } from '../content/relics'
import { slotForRelic } from '../sim/relics'
import type { GameState, Relic, RolledAffix } from '../sim/types'

/**
 * Explicit serialisation. A generic Decimal-sniffing walker is tempting and
 * wrong — it silently breaks the moment a new Decimal field is added and the
 * failure surfaces as a corrupt 200-hour save.
 */

const s = (d: Decimal) => d.toString()
const d = (v: unknown) => new Decimal(String(v ?? 0))

export function serialize(g: GameState): string {
  return JSON.stringify({
    v: SAVE_VERSION,
    t: Date.now(),
    classId: g.classId,
    soldierNumber: g.soldierNumber,
    soldierSeed: g.soldierSeed,
    reveilles: g.reveilles,

    rank: g.rank,
    bestRank: g.bestRank,
    bestRankEver: g.bestRankEver,
    enemyIndex: g.enemyIndex,
    enemiesThisRank: g.enemiesThisRank,
    soldierHp: s(g.soldier.hp),
    soldierCooldown: g.soldier.cooldown,
    resolve: g.soldier.resolve,
    shield: s(g.soldier.shield),
    dead: g.dead,
    deathCause: g.deathCause,
    runTicks: g.runTicks,
    killsThisRun: g.killsThisRun,

    standTimer: g.standTimer,
    standTimerMax: g.standTimerMax,
    standFails: g.standFails,
    standsThisRun: g.standsThisRun,

    revivesUsed: g.revivesUsed,
    sigKind: g.sigKind,
    sigTicks: g.sigTicks,
    sigCharges: g.sigCharges,
    sigStored: s(g.sigStored),

    bone: s(g.bone),
    boneLevels: g.boneLevels,
    ash: s(g.ash),
    treeLevels: g.treeLevels,
    ashSpentTotal: s(g.ashSpentTotal),
    bestAsh: s(g.bestAsh),
    lastAsh: s(g.lastAsh),
    orders: g.orders,

    names: g.names,
    namesSpent: g.namesSpent,
    interments: g.interments,
    ashSpentThisAscension: s(g.ashSpentThisAscension),
    wardenNames: g.wardenNames,
    purchases: g.purchases,
    vows: g.vows,

    keys: g.keys,
    layerNames: g.layerNames,
    descents: g.descents,
    descentsCleared: g.descentsCleared,

    ichor: g.ichor,
    ichorSpent: g.ichorSpent,
    apotheoses: g.apotheoses,
    namesSpentTotal: g.namesSpentTotal,
    rules: g.rules,
    myriadFelled: g.myriadFelled,
    fragments: g.fragments,
    snuffed: g.snuffed,
    hundredth: g.hundredth,
    observations: g.observations,
    authored: g.authored,

    equipped: g.equipped,
    inventory: g.inventory,
    slotBonus: g.slotBonus,
    ghosts: g.ghosts,
    echoes: g.echoes,
    kegare: g.kegare,
    ofuda: g.ofuda,
    ofudaCharges: g.ofudaCharges,
    ofudaOwned: g.ofudaOwned,

    totalTicks: g.totalTicks,
    totalKills: g.totalKills,
    totalDeaths: g.totalDeaths,
    firstPlayedAt: g.firstPlayedAt,
    lastSeenAt: Date.now(),
    rngState: g.rngState,
    seen: g.seen,
    speciesSeen: g.speciesSeen,
  })
}

export type SaveBlob = Record<string, unknown> & { v?: number }

/**
 * The enemy is NOT serialised — it is respawned deterministically from
 * (rank, enemyIndex, runSeed). One less thing to migrate.
 */
export function deserialize(json: string, apply: (blob: SaveBlob) => GameState): GameState {
  return apply(migrate(JSON.parse(json)))
}

type Migration = (b: SaveBlob) => SaveBlob

/** Version chain. Never branch on version inside game logic — only here. */
const MIGRATIONS: Record<number, Migration> = {
  // v1 predates Ash, the tree and Stands. Everything new starts empty, and the
  // in-flight run is reset rather than half-reconstructed.
  1: (b) => ({
    ...b,
    v: 2,
    bestRankEver: (b.bestRank as number) ?? 1,
    ash: '0',
    treeLevels: {},
    ashSpentTotal: '0',
    bestAsh: '0',
    shield: '0',
    standTimer: 0,
    standTimerMax: 0,
    standFails: 0,
    standsThisRun: 0,
    revivesUsed: 0,
    sigKind: '',
    sigTicks: 0,
    sigCharges: 0,
    sigStored: '0',
  }),
  // v2 predates relics, ghosts and the three earned classes.
  2: (b) => ({
    ...b,
    v: 3,
    equipped: [null, null],
    inventory: [],
    slotBonus: 0,
    ghosts: [],
    echoes: 0,
  }),
  // v3 predates Standing Orders.
  3: (b) => ({
    ...b,
    v: 4,
    lastAsh: '0',
    orders: { enabled: false, ashMultiple: 1.5, stallMinutes: 5 },
  }),
  // v4 predates Interment, Names and Vows. Ash already spent this Ascension is
  // credited, so an existing save arrives at Interment rather than starting over.
  4: (b) => ({
    ...b,
    v: 5,
    names: 0,
    namesSpent: 0,
    interments: 0,
    ashSpentThisAscension: b.ashSpentTotal ?? '0',
    wardenNames: 0,
    purchases: {},
    vows: [],
    orders: {
      ...(b.orders as Record<string, unknown>),
      autoBuy: false,
      priority: [],
    },
  }),
  // v5 predates Descents.
  5: (b) => ({
    ...b,
    v: 6,
    keys: 1,
    layerNames: 0,
    descents: [],
    descentsCleared: 0,
  }),
  // v6 predates Apotheosis. Names already spent are credited so an existing
  // save arrives at the third layer rather than starting it from nothing.
  6: (b) => ({
    ...b,
    v: 7,
    ichor: 0,
    ichorSpent: 0,
    apotheoses: 0,
    namesSpentTotal: (b.namesSpent as number) ?? 0,
    rules: {},
    myriadFelled: false,
    fragments: [],
    authored: null,
  }),
  // v7 predates the observations the game makes about you.
  7: (b) => ({ ...b, v: 8, observations: [] }),
  // v8 predates kegare and the ofuda loadout. Every soldier already on the
  // road starts clean and carrying no paper.
  8: (b) => ({
    ...b,
    v: 9,
    kegare: 0,
    ofuda: [],
    ofudaCharges: {},
    ofudaOwned: [],
    snuffed: [],
    hundredth: false,
  }),
  // v9 predates typed equipment slots. Give every relic a slot, then re-hang
  // the worn ones into the six fixed slots — a collision (two old relics that
  // now map to the same slot) keeps the first and drops the rest into the bag,
  // so nothing is ever lost.
  9: (b) => {
    const withSlot = (r: unknown): unknown => {
      if (!r || typeof r !== 'object') return r
      const rr = r as { slot?: string; unique?: string; affixes?: RolledAffix[]; seed?: number }
      if (rr.slot) return rr
      return { ...rr, slot: slotForRelic({ unique: rr.unique, affixes: rr.affixes ?? [], seed: rr.seed ?? 0 }) }
    }
    const inv = (Array.isArray(b.inventory) ? b.inventory : []).map(withSlot) as Relic[]
    const worn = (Array.isArray(b.equipped) ? b.equipped : []).filter(Boolean).map(withSlot) as Relic[]
    const eq: (Relic | null)[] = SLOT_ORDER.map(() => null)
    const overflow: Relic[] = []
    for (const r of worn) {
      const i = SLOT_ORDER.indexOf(r.slot)
      if (i >= 0 && eq[i] === null) eq[i] = r
      else overflow.push(r)
    }
    return { ...b, v: 10, equipped: eq, inventory: [...inv, ...overflow] }
  },
}

export function migrate(blob: SaveBlob): SaveBlob {
  let b = blob
  let v = Number(b.v ?? 1)
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v]
    if (!m) {
      b = { ...b, v: SAVE_VERSION }
      break
    }
    b = m(b)
    v = Number(b.v)
  }
  return b
}

export { d as toDecimal }
