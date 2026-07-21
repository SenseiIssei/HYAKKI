import type { Family } from './balance'

/**
 * KEGARE 穢れ — defilement.
 *
 * Not sin. Kegare is pollution rather than guilt: it is what contact with death
 * leaves on a living thing, it is not deserved, and it is removed by washing
 * rather than by being forgiven. That distinction is the whole reason the
 * riverbed exists in this game, and it is why nothing here is ever framed as
 * punishment.
 *
 * Mechanically it is DOUBLE-EDGED, by explicit design decision: defilement buys
 * damage and Ash, and costs healing and armour. A filthy walk is a real
 * strategy — you go deeper and hit harder while becoming steadily less able to
 * survive being hit back.
 *
 * ── The economy rule this file exists to respect ──
 * ATK is MULTIPLICATIVE; ash find is ADDITIVE. This is not a stylistic choice.
 * A multiplicative modifier on income feeds its own income and goes
 * superexponential — that mistake once produced Rank 899 by run seven. Any
 * future band must keep `ash` additive. See docs/03-COMBAT-MATH.md.
 */

export type KegareBand = {
  id: string
  name: string
  kanji: string
  /** lowest kegare value at which this band applies, 0..1 */
  from: number
  /** what the Register says about you at this level */
  line: string
  /** multiplicative on attack */
  atk: number
  /** ADDITIVE on ash find — never multiplicative, see above */
  ash: number
  /** multiplicative on regeneration */
  reg: number
  /** multiplicative on armour */
  arm: number
  /** how far the world discolours here, 0..1 */
  rot: number
}

export const KEGARE_BANDS: KegareBand[] = [
  {
    id: 'clean', name: 'CLEAN', kanji: '清', from: 0,
    line: 'You have been walking a while and it does not show yet.',
    atk: 1, ash: 0, reg: 1, arm: 1, rot: 0,
  },
  {
    id: 'marked', name: 'MARKED', kanji: '触', from: 0.2,
    line: 'Something has touched you. It is on the coat and it will not brush off.',
    atk: 1.12, ash: 0.1, reg: 0.92, arm: 0.96, rot: 0.2,
  },
  {
    id: 'soaked', name: 'SOAKED', kanji: '汚', from: 0.45,
    line: 'It has gone through the cloth. The things on the road have started letting you pass.',
    atk: 1.3, ash: 0.25, reg: 0.78, arm: 0.88, rot: 0.45,
  },
  {
    id: 'rotten', name: 'ROTTEN', kanji: '穢', from: 0.7,
    line: 'You are not carrying it any more. You are made of some of it.',
    atk: 1.55, ash: 0.45, reg: 0.6, arm: 0.76, rot: 0.72,
  },
  {
    id: 'unclean', name: 'UNCLEAN', kanji: '不浄', from: 0.9,
    line: 'The shrines are shut ahead of you. Nothing down here will look directly at you now.',
    atk: 1.9, ash: 0.7, reg: 0.4, arm: 0.6, rot: 1,
  },
]

export const KEGARE_BY_ID: Record<string, KegareBand> = Object.fromEntries(
  KEGARE_BANDS.map((b) => [b.id, b]),
)

/** Which band a given defilement sits in. Always returns one. */
export function bandFor(kegare: number): KegareBand {
  const k = Math.min(1, Math.max(0, kegare))
  let out = KEGARE_BANDS[0]
  for (const b of KEGARE_BANDS) if (k >= b.from) out = b
  return out
}

/**
 * How much a kill defiles you.
 *
 * Weighted by what the thing *was*. The yūrei and the Mu are the dead and the
 * absence of anything, and both stain badly. Tsukumogami are woken objects
 * rather than corpses, so they barely register — a sandal is not unclean.
 */
/**
 * Calibrated, not guessed. At the first values a full eight-minute run left the
 * player at 0.067 — still CLEAN, with the first band starting at 0.2 — so the
 * entire mechanic was invisible for the whole early game. These are set so a
 * normal run ends MARKED or SOAKED and only a long deep one goes ROTTEN.
 */
export const KEGARE_PER_KILL: Record<Family, number> = {
  chaff: 0.0015,
  organs: 0.0045,
  returned: 0.01,
  warden: 0.03,
  nothing: 0.022,
}

/**
 * Defilement per kill.
 *
 * Two dampers, both load-bearing:
 *
 * 1. It slows as you fill — the first contact marks you far more than the
 *    thousandth. Without this the cap is hit inside one Ri band and the scale
 *    collapses to on/off.
 *
 * 2. It is normalised by DEPTH. A deep run kills thousands of things, so
 *    counting kills absolutely pinned every mid-game player at UNCLEAN from
 *    about the eighteenth run onward and never moved again — which quietly
 *    deleted the decision, because washing was undone within a fraction of a
 *    run. Dividing by depth makes kegare measure how far past yourself you have
 *    gone, not how long you have been playing.
 */
export function kegareFromKill(family: Family, current: number, rank: number): number {
  const base = KEGARE_PER_KILL[family] ?? 0
  const soften = 1 - Math.min(1, Math.max(0, current))
  const depth = 1 + Math.max(0, rank) / 60
  return (base * soften) / depth
}

/** Cost in ishi to wash, rising with how deep you are and how filthy. */
export function purificationCost(kegare: number, rank: number): number {
  const k = Math.min(1, Math.max(0, kegare))
  return Math.ceil(40 * (1 + rank * 0.9) * (0.25 + k))
}
