import Decimal from 'break_infinity.js'
import { BALANCE as B } from '../content/balance'
import { keystoneFlags } from '../content/tree'
import { vowAshMult, vowExtraNames, vowNameMult } from '../content/vows'
import { ashOnReveille } from './formulas'
import { recordGhost } from './ghosts'
import { equippedFlags } from './relics'
import { resetRun } from './state'
import { computeStats } from './stats'
import type { GameState } from './types'

/**
 * What this run is worth. Shown live on the button — the player should never
 * have to guess whether it is time to die.
 */
/** Relic slots bought with Names, on top of the depth-gated ones. */
export const boughtSlots = (s: GameState) => s.purchases.slot ?? 0
export const vowSlots = (s: GameState) => 1 + (s.purchases.vowslot ?? 0)

/**
 * NAMES. Square-root scaling on the Ash spent this Ascension: Names are slow,
 * and that is correct. A player should feel each one.
 */
export function projectedNames(s: GameState): number {
  const base = Math.floor(Math.sqrt(s.ashSpentThisAscension.div(B.NAMES_DIV).toNumber()))
  const withVows = Math.floor(base * vowNameMult(s.vows)) + vowExtraNames(s.vows)
  return Math.max(0, withVows) + s.wardenNames
}

export function canInter(s: GameState): boolean {
  return projectedNames(s) >= 1
}

/**
 * INTERMENT — prestige tier 2. Burns the whole Ash tree and everything bought
 * with it, and pays in Names. Vows are released; you choose again.
 * docs/05-PROGRESSION.md
 */
export function interment(s: GameState): number {
  const gained = projectedNames(s)
  s.names += gained
  s.interments += 1
  s.wardenNames = 0

  s.ash = new Decimal(0)
  s.ashSpentTotal = new Decimal(0)
  s.ashSpentThisAscension = new Decimal(0)
  s.bestAsh = new Decimal(0)
  s.lastAsh = new Decimal(0)
  s.treeLevels = {}
  s.vows = []
  s.bestRank = 1
  s.totalDeaths = 0 // the Revenant's count is per-Ascension

  resetRun(s)
  s.bone = new Decimal(0)
  s.events.push({
    t: 'log',
    text: `You are interred. Something else gets up. It has ${gained === 1 ? 'a name' : `${gained} names`}.`,
  })
  return gained
}

export function projectedAsh(s: GameState): Decimal {
  const st = computeStats(s)
  const f = keystoneFlags(s.treeLevels)

  let af = st.af
  if (f.has('pyre75')) af *= 1 + 0.1 * s.standsThisRun
  if (f.has('pyre100')) af *= 1 + 0.01 * Math.floor(s.killsThisRun / 100)
  // Vows are the endgame optimisation puzzle: four slots of the right ones is
  // roughly a x30 swing, and it is difficulty the player authored themselves.
  af *= vowAshMult(s.vows)

  let ash = ashOnReveille(s.bestRank, af)
  if (f.has('pyre25')) ash = ash.add(ash.mul(0.15 * s.standsThisRun))
  // PYRE 50 — a bad run is never a wasted run.
  if (f.has('pyre50')) ash = Decimal.max(ash, s.bestAsh.mul(0.6))
  return ash.floor()
}

export function canReveille(s: GameState): boolean {
  // THE COUNT will not let you wake early.
  if (equippedFlags(s.equipped).has('count') && s.bestRank < 200) return false
  return projectedAsh(s).gte(1)
}

/**
 * REVEILLE — prestige tier 1. Wipes the run, keeps the tree, pays out Ash.
 * docs/05-PROGRESSION.md
 */
export function reveille(s: GameState, classId = s.classId): Decimal {
  const gained = projectedAsh(s)
  const f = keystoneFlags(s.treeLevels)

  s.ash = s.ash.add(gained)
  if (gained.gt(s.bestAsh)) s.bestAsh = gained

  // TITHE 75 — a little of what you were carrying survives waking up.
  const carriedBone = f.has('tithe75') ? s.bone.mul(0.05) : new Decimal(0)

  // Recorded before the wipe: this run is now a ghost.
  recordGhost(s)

  s.reveilles += 1
  // THE TEN THOUSANDTH COAT stops the count.
  if (!equippedFlags(s.equipped).has('tenthousandth')) s.soldierNumber += 1
  else s.soldierNumber = 10000
  s.classId = classId
  resetRun(s)
  s.bone = carriedBone

  s.events.push({
    t: 'log',
    text: `You wake at the Mouth. Your coat says ${s.soldierNumber}.`,
  })
  return gained
}

/** Free and unlimited. Punishing experimentation in a build game is indefensible. */
export function recant(s: GameState): void {
  s.ash = s.ash.add(s.ashSpentTotal)
  s.ashSpentTotal = new Decimal(0)
  s.treeLevels = {}
  resetRun(s)
  s.bone = new Decimal(0)
}

export const STAND_EVERY = B.STAND_EVERY
