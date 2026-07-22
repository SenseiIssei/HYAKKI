import LZString from 'lz-string'
import { spawnFor } from '../sim/enemies'
import { emptyEquip } from '../sim/relics'
import { createInitialState } from '../sim/state'
import type { GameState } from '../sim/types'
import { desktopLoad, desktopWrite, isDesktop } from './desktop'
import { deserialize, serialize, toDecimal, type SaveBlob } from './serialize'

const KEY = 'myriad.save'
const BAK = (i: number) => `myriad.save.bak${i}`
const BAK_SLOTS = 3
const BAK_INTERVAL_MS = 60 * 60 * 1000

function hydrate(b: SaveBlob): GameState {
  const n = (k: string, dflt = 0) => (typeof b[k] === 'number' ? (b[k] as number) : dflt)
  const seed = typeof b.soldierSeed === 'number' ? b.soldierSeed : undefined
  const classId = typeof b.classId === 'string' ? b.classId : undefined
  const base = createInitialState(classId, seed)

  const g: GameState = {
    ...base,
    classId: classId ?? base.classId,
    soldierNumber: n('soldierNumber', 1),
    soldierSeed: seed ?? base.soldierSeed,
    reveilles: n('reveilles'),

    rank: n('rank', 1),
    bestRank: n('bestRank', 1),
    bestRankEver: n('bestRankEver', n('bestRank', 1)),
    enemyIndex: n('enemyIndex'),
    enemiesThisRank: n('enemiesThisRank', base.enemiesThisRank),
    soldier: {
      hp: toDecimal(b.soldierHp),
      cooldown: n('soldierCooldown', 1),
      resolve: n('resolve'),
      shield: toDecimal(b.shield),
    },
    dead: !!b.dead,
    deathCause: typeof b.deathCause === 'string' ? b.deathCause : '',
    runTicks: n('runTicks'),
    killsThisRun: n('killsThisRun'),

    standTimer: n('standTimer'),
    standTimerMax: n('standTimerMax'),
    standFails: n('standFails'),
    standsThisRun: n('standsThisRun'),

    revivesUsed: n('revivesUsed'),
    immuneTicks: 0,
    sigKind: typeof b.sigKind === 'string' ? b.sigKind : '',
    sigTicks: n('sigTicks'),
    sigCharges: n('sigCharges'),
    sigStored: toDecimal(b.sigStored),
    nonCritStreak: 0,
    hitCounter: 0,
    killSpdStacks: 0,
    killSpdTicks: 0,
    freshEnemy: true,

    bone: toDecimal(b.bone),
    boneLevels: (b.boneLevels as Record<string, number>) ?? {},
    ash: toDecimal(b.ash),
    treeLevels: (b.treeLevels as Record<string, number>) ?? {},
    ashSpentTotal: toDecimal(b.ashSpentTotal),
    bestAsh: toDecimal(b.bestAsh),
    lastAsh: toDecimal(b.lastAsh),
    orders: {
      enabled: !!(b.orders as GameState['orders'])?.enabled,
      ashMultiple: (b.orders as GameState['orders'])?.ashMultiple ?? 1.5,
      stallMinutes: (b.orders as GameState['orders'])?.stallMinutes ?? 5,
      autoBuy: !!(b.orders as GameState['orders'])?.autoBuy,
      priority: (b.orders as GameState['orders'])?.priority ?? [],
    },

    names: n('names'),
    namesSpent: n('namesSpent'),
    interments: n('interments'),
    ashSpentThisAscension: toDecimal(b.ashSpentThisAscension),
    wardenNames: n('wardenNames'),
    purchases: (b.purchases as Record<string, number>) ?? {},
    vows: Array.isArray(b.vows) ? (b.vows as string[]) : [],
    silencedTicks: 0,
    // transient combat state — drawn fresh, never serialised
    abilityCd: {},

    keys: typeof b.keys === 'number' ? b.keys : 1,
    layerNames: n('layerNames'),
    descents: Array.isArray(b.descents) ? (b.descents as GameState['descents']) : [],
    descentsCleared: n('descentsCleared'),

    ichor: n('ichor'),
    ichorSpent: n('ichorSpent'),
    apotheoses: n('apotheoses'),
    namesSpentTotal: n('namesSpentTotal', n('namesSpent')),
    rules: (b.rules as Record<string, number>) ?? {},
    myriadFelled: !!b.myriadFelled,
    fragments: Array.isArray(b.fragments) ? (b.fragments as number[]) : [],
    snuffed: Array.isArray(b.snuffed) ? (b.snuffed as number[]) : [],
    hundredth: !!b.hundredth,
    observations: Array.isArray(b.observations) ? (b.observations as string[]) : [],
    authored: (b.authored as GameState['authored']) ?? null,

    equipped: Array.isArray(b.equipped) ? (b.equipped as GameState['equipped']) : emptyEquip(),
    inventory: Array.isArray(b.inventory) ? (b.inventory as GameState['inventory']) : [],
    slotBonus: n('slotBonus'),
    ghosts: Array.isArray(b.ghosts) ? (b.ghosts as GameState['ghosts']) : [],
    echoes: n('echoes'),
    kegare: n('kegare'),
    ofuda: Array.isArray(b.ofuda) ? (b.ofuda as string[]) : [],
    ofudaCharges: (b.ofudaCharges as Record<string, number>) ?? {},
    ofudaOwned: Array.isArray(b.ofudaOwned) ? (b.ofudaOwned as string[]) : [],

    totalTicks: n('totalTicks'),
    totalKills: n('totalKills'),
    totalDeaths: n('totalDeaths'),
    firstPlayedAt: n('firstPlayedAt', Date.now()),
    lastSeenAt: n('lastSeenAt', Date.now()),
    rngState: n('rngState', base.rngState),
    events: [],
    seen: (b.seen as Record<string, boolean>) ?? {},
    speciesSeen: (b.speciesSeen as Record<string, number>) ?? {},
  }
  // Enemies are regenerated, never stored.
  g.enemy = spawnFor(g, g.rank, g.enemyIndex)
  return g
}

export function save(g: GameState): void {
  try {
    const packed = LZString.compressToBase64(serialize(g))
    // On the desktop this is a real file, with its own rotation on the Rust
    // side. localStorage is still written as a belt-and-braces second copy.
    if (isDesktop()) desktopWrite(packed)
    localStorage.setItem(KEY, packed)
    rotateBackup(packed)
  } catch (err) {
    // A full quota must never take the game down mid-walk.
    console.error('[hyakki] save failed', err)
  }
}

/**
 * Called once at startup on the desktop, before the store reads anything. The
 * file wins over localStorage — it is the one that survives a browser cache
 * being cleared, and it is the one the player can see and back up.
 */
export async function primeDesktopSave(): Promise<void> {
  if (!isDesktop()) return
  const blob = await desktopLoad()
  if (blob) localStorage.setItem(KEY, blob)
}

let lastBackupAt = 0
function rotateBackup(packed: string) {
  const now = Date.now()
  if (now - lastBackupAt < BAK_INTERVAL_MS) return
  lastBackupAt = now
  for (let i = BAK_SLOTS - 1; i > 0; i--) {
    const prev = localStorage.getItem(BAK(i - 1))
    if (prev) localStorage.setItem(BAK(i), prev)
  }
  localStorage.setItem(BAK(0), packed)
}

export function load(): GameState | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    const json = LZString.decompressFromBase64(raw)
    if (!json) throw new Error('empty after decompress')
    return deserialize(json, hydrate)
  } catch (err) {
    console.error('[myriad] load failed, trying backups', err)
    for (let i = 0; i < BAK_SLOTS; i++) {
      const bak = localStorage.getItem(BAK(i))
      if (!bak) continue
      try {
        const json = LZString.decompressFromBase64(bak)
        if (json) return deserialize(json, hydrate)
      } catch {
        /* next slot */
      }
    }
    return null
  }
}

/** A player must always be able to get their save out. */
export function exportSave(g: GameState): string {
  return LZString.compressToBase64(serialize(g))
}

export function importSave(blob: string): GameState {
  const json = LZString.decompressFromBase64(blob.trim())
  if (!json) throw new Error('That is not a MYRIAD save.')
  return deserialize(json, hydrate)
}

export function hardReset(): void {
  localStorage.removeItem(KEY)
  for (let i = 0; i < BAK_SLOTS; i++) localStorage.removeItem(BAK(i))
}
