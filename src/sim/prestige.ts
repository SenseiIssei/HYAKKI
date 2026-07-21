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
 * NAMES — LOGARITHMIC in the Ash spent this Ascension.
 *
 * The design doc specified `sqrt(ashSpent / 5e6)`. That is unshippable for the
 * same reason the original Ash formula was: Ash is itself exponential in depth,
 * so a square root of it is still astronomical. Measured over 100 Reveilles it
 * produced **9e128 Names** — a currency you were supposed to feel one at a time.
 *
 * log10 of an exponential is linear, so this makes Names grow steadily with
 * DEPTH, which is what "a player should feel each one" actually requires.
 */
export function namesFromAsh(s: GameState): number {
  const spent = s.ashSpentThisAscension
  if (spent.lte(100)) return 0
  return Math.max(0, Math.floor((spent.log10() - 2) * B.NAMES_PER_DECADE))
}

export function projectedNames(s: GameState): number {
  const base = namesFromAsh(s)
  const withVows = Math.floor(base * vowNameMult(s.vows)) + vowExtraNames(s.vows)
  return Math.max(0, withVows) + s.wardenNames
}

/**
 * Wardens alone do not open Interment — otherwise the very first Stand offers
 * to burn a five-level tree, which reads as a bug rather than a bargain.
 */
export function canInter(s: GameState): boolean {
  return namesFromAsh(s) >= 1
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

/**
 * ICHOR. Names are already bounded and slow, so a power law on them is safe
 * here — unlike Ash and Names, this is not derived from an exponential.
 */
export function projectedIchor(s: GameState): number {
  if (s.namesSpentTotal <= 0) return 0
  return Math.floor(Math.pow(s.namesSpentTotal, 1.4) / 3)
}

export function canAscend(s: GameState): boolean {
  return projectedIchor(s) >= 1
}

/**
 * APOTHEOSIS — prestige tier 3. Burns everything: the tree, the Names, the
 * classes and slots they bought, the Layers. Keeps Ichor, the rules it buys,
 * the fragments you have read, and the ghosts.
 *
 * Also authors a Warden from the Ascension that just ended. The Hollow reissues
 * its dead; you are the Hollow now. docs/14-NARRATIVE.md
 */
export function apotheosis(s: GameState): number {
  const gained = projectedIchor(s)
  s.ichor += gained
  s.apotheoses += 1

  // the Ascension that just ended becomes something later ones must get past
  s.authored = {
    soldierNumber: s.soldierNumber,
    classId: s.classId,
    deepestRank: s.bestRankEver,
    seed: s.soldierSeed,
    vows: [...s.vows],
    ascension: s.apotheoses,
  }

  s.names = 0
  s.namesSpent = 0
  s.namesSpentTotal = 0
  s.wardenNames = 0
  s.purchases = {}
  s.layerNames = 0
  s.interments = 0
  s.slotBonus = 0
  s.equipped = [null, null]
  s.vows = []
  s.treeLevels = {}
  s.ash = new Decimal(0)
  s.ashSpentTotal = new Decimal(0)
  s.ashSpentThisAscension = new Decimal(0)
  s.bestAsh = new Decimal(0)
  s.lastAsh = new Decimal(0)
  s.bestRank = 1
  s.bestRankEver = 1
  s.totalDeaths = 0
  s.orders = { ...s.orders, autoBuy: false }

  resetRun(s)
  s.bone = new Decimal(0)
  s.events.push({
    t: 'log',
    text: 'You ascend. The Column does not notice. It has done this before.',
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
