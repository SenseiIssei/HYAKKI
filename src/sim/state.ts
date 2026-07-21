import Decimal from 'break_infinity.js'
import { DEFAULT_CLASS } from '../content/classes'
import { spawnFor } from './enemies'
import { enemiesPerRank } from './formulas'
import { hashSeed } from './rng'
import { maxEchoes } from './ghosts'
import { computeStats } from './stats'
import type { GameState } from './types'

export const SAVE_VERSION = 6

/** Everything that a Reveille wipes. Kept in one place so nothing is missed. */
export function resetRun(s: GameState): void {
  s.rank = 1
  s.bestRank = 1
  s.enemyIndex = 0
  s.enemiesThisRank = enemiesPerRank(1)
  s.dead = false
  s.deathCause = ''
  s.runTicks = 0
  s.killsThisRun = 0

  s.standTimer = 0
  s.standTimerMax = 0
  s.standFails = 0
  s.standsThisRun = 0

  s.revivesUsed = 0
  s.immuneTicks = 0
  s.sigKind = ''
  s.sigTicks = 0
  s.sigCharges = 0
  s.sigStored = new Decimal(0)
  s.nonCritStreak = 0
  s.hitCounter = 0
  s.killSpdStacks = 0
  s.killSpdTicks = 0
  s.freshEnemy = true
  s.silencedTicks = 0
  s.echoes = maxEchoes(s)

  s.bone = new Decimal(0)
  s.boneLevels = {}

  s.soldier.resolve = 0
  s.soldier.cooldown = 1
  s.soldier.shield = new Decimal(0)
  s.enemy = spawnFor(s, 1, 0)
  s.soldier.hp = computeStats(s).hp
}

export function createInitialState(classId = DEFAULT_CLASS, seed?: number): GameState {
  const soldierSeed = seed ?? hashSeed('myriad', Date.now(), Math.floor(Math.random() * 1e9))
  const s: GameState = {
    v: SAVE_VERSION,
    classId,
    soldierNumber: 1,
    soldierSeed,
    reveilles: 0,

    rank: 1,
    bestRank: 1,
    bestRankEver: 1,
    enemyIndex: 0,
    enemiesThisRank: enemiesPerRank(1),
    enemy: spawnFor(
      { soldierSeed, reveilles: 0, standsThisRun: 0, ghosts: [], interments: 0 },
      1,
      0,
    ),
    soldier: { hp: new Decimal(0), cooldown: 1, resolve: 0, shield: new Decimal(0) },
    dead: false,
    deathCause: '',
    runTicks: 0,
    killsThisRun: 0,

    standTimer: 0,
    standTimerMax: 0,
    standFails: 0,
    standsThisRun: 0,

    revivesUsed: 0,
    immuneTicks: 0,
    sigKind: '',
    sigTicks: 0,
    sigCharges: 0,
    sigStored: new Decimal(0),
    nonCritStreak: 0,
    hitCounter: 0,
    killSpdStacks: 0,
    killSpdTicks: 0,
    freshEnemy: true,
    silencedTicks: 0,
    echoes: 0,

    equipped: [null, null],
    inventory: [],
    slotBonus: 0,
    ghosts: [],

    bone: new Decimal(0),
    boneLevels: {},
    ash: new Decimal(0),
    treeLevels: {},
    ashSpentTotal: new Decimal(0),
    bestAsh: new Decimal(0),
    lastAsh: new Decimal(0),
    orders: { enabled: false, ashMultiple: 1.5, stallMinutes: 5, autoBuy: false, priority: [] },

    names: 0,
    namesSpent: 0,
    interments: 0,
    ashSpentThisAscension: new Decimal(0),
    wardenNames: 0,
    purchases: {},
    vows: [],

    keys: 1,
    layerNames: 0,
    descents: [],
    descentsCleared: 0,

    totalTicks: 0,
    totalKills: 0,
    totalDeaths: 0,
    firstPlayedAt: Date.now(),
    lastSeenAt: Date.now(),

    rngState: soldierSeed,
    events: [],
    seen: {},
  }
  s.soldier.hp = computeStats(s).hp
  return s
}
