import Decimal from 'break_infinity.js'
import { SAVE_VERSION } from '../sim/state'
import type { GameState } from '../sim/types'

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

    equipped: g.equipped,
    inventory: g.inventory,
    slotBonus: g.slotBonus,
    ghosts: g.ghosts,
    echoes: g.echoes,

    totalTicks: g.totalTicks,
    totalKills: g.totalKills,
    totalDeaths: g.totalDeaths,
    firstPlayedAt: g.firstPlayedAt,
    lastSeenAt: Date.now(),
    rngState: g.rngState,
    seen: g.seen,
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
