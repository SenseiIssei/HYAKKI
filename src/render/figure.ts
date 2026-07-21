import Decimal from 'break_infinity.js'
import type { StatBlock } from '../sim/types'

/**
 * The walker, drawn.
 *
 * Still zero art assets — this is geometry, generated. But it is FIGURATIVE
 * now: a small man in a straw cloak walking through Yomi, and he visibly gains
 * armour, a better blade and a faster gait as you build him.
 *
 * The skeleton is a fixed set of named groups; CSS animates them (see
 * `styles.css` § the walker). Keeping the animation in CSS rather than a JS
 * loop matters — requestAnimationFrame is suspended in hidden windows, and the
 * figure must not freeze while the sim keeps running.
 *
 * Proportions are woodblock rather than cartoon: ~5.5 heads, heavy feet, small
 * head, long coat. viewBox is 0 0 120 160 with the ground at y=150.
 */

export type GearTier = 0 | 1 | 2 | 3 | 4 | 5

export type Look = {
  /** blade: none, stick, wakizashi, katana, odachi, burning */
  weapon: GearTier
  /** none, straw cloak, do-maru, o-yoroi, plated */
  armour: GearTier
  /** bare, headband, kasa, kabuto, oni mask */
  head: GearTier
  /** seconds per stride — lower is faster */
  gait: number
  /** 0..1, how much light comes off him */
  aura: number
  /** 0..1, how defiled — tints everything */
  kegare: number
}

const tier = (v: number, steps: number[]): GearTier => {
  let t = 0
  for (let i = 0; i < steps.length; i++) if (v >= steps[i]) t = i + 1
  return Math.min(5, t) as GearTier
}

const log = (d: Decimal) => (d.lte(1) ? 0 : d.log10())

/**
 * What the numbers look like. Tiers are on a LOG scale because every stat in
 * this game is exponential — a linear threshold would put you in the last suit
 * of armour forever within an hour.
 */
export function lookFrom(st: StatBlock, opts: { kegare?: number } = {}): Look {
  return {
    weapon: tier(log(st.atk), [1.6, 2.6, 4, 6, 9]),
    armour: tier(log(st.arm.add(1)), [0.9, 1.8, 3, 4.5, 7]),
    head: tier(log(st.hp), [2.6, 3.4, 4.6, 6.5, 10]),
    // clamped so he never becomes a blur or a statue
    gait: Math.max(0.34, Math.min(1.5, 1.15 / Math.max(0.35, st.spd))),
    aura: Math.min(1, Math.max(0, (log(st.atk) - 4) / 8)),
    kegare: Math.min(1, Math.max(0, opts.kegare ?? 0)),
  }
}

// ── geometry ───────────────────────────────────────────────────────────

/** A tapered limb: wider at the joint, narrower at the end. */
function limb(x: number, y: number, len: number, w0: number, w1: number): string {
  const h = len
  return (
    `M ${x - w0} ${y} ` +
    `C ${x - w0} ${y + h * 0.4} ${x - w1} ${y + h * 0.7} ${x - w1} ${y + h} ` +
    `L ${x + w1} ${y + h} ` +
    `C ${x + w1} ${y + h * 0.7} ${x + w0} ${y + h * 0.4} ${x + w0} ${y} Z`
  )
}

export const FIGURE = {
  viewBox: '0 0 120 160',

  /** upper leg + boot, drawn from the hip down */
  leg: limb(0, 0, 54, 7.5, 5.2),
  foot: 'M -7 52 L 9 52 L 10 58 L -8 58 Z',

  /** arm from the shoulder down */
  arm: limb(0, 0, 44, 5.6, 3.8),

  head: 'M 0 -13 C 8 -13 12 -7 12 0 C 12 8 7 13 0 13 C -7 13 -12 8 -12 0 C -12 -7 -8 -13 0 -13 Z',
  /** hair, tied — a small topknot */
  hair:
    'M -12 -2 C -12 -12 -6 -16 0 -16 C 6 -16 12 -12 12 -2 ' +
    'C 8 -9 4 -11 0 -11 C -4 -11 -8 -9 -12 -2 Z M -2 -19 L 2 -19 L 3 -14 L -3 -14 Z',
}

/** The torso, which broadens with armour. */
export function torsoPath(armour: GearTier): string {
  const shoulder = 15 + armour * 2.2
  const waist = 11 + armour * 0.9
  return (
    `M ${-shoulder} 0 ` +
    `C ${-shoulder - 1} 16 ${-waist - 2} 30 ${-waist} 44 ` +
    `L ${waist} 44 ` +
    `C ${waist + 2} 30 ${shoulder + 1} 16 ${shoulder} 0 Z`
  )
}

/** The coat, which lengthens and splits as it gets better. */
export function coatPath(armour: GearTier): string {
  if (armour === 0) return ''
  const w = 17 + armour * 2.4
  const len = 26 + armour * 7
  return (
    `M ${-w} 6 ` +
    `C ${-w - 3} ${len * 0.6} ${-w - 5} ${len * 0.9} ${-w - 4} ${len} ` +
    `L -3 ${len - 4} L 0 ${len} L 3 ${len - 4} L ${w + 4} ${len} ` +
    `C ${w + 5} ${len * 0.9} ${w + 3} ${len * 0.6} ${w} 6 Z`
  )
}

/** Shoulder plates — the clearest read that you got stronger. */
export function pauldronPath(armour: GearTier): string {
  if (armour < 2) return ''
  const r = 6 + armour * 2
  return `M ${-r} 0 C ${-r} ${-r * 0.8} ${r} ${-r * 0.8} ${r} 0 C ${r * 0.7} ${r * 0.9} ${-r * 0.7} ${r * 0.9} ${-r} 0 Z`
}

/** Blade geometry, drawn from the grip. Length and curve grow with tier. */
export function bladePath(weapon: GearTier): string {
  if (weapon === 0) return 'M -1.4 0 L 1.4 0 L 1.4 -22 L -1.4 -22 Z' // a stick
  const len = 26 + weapon * 13
  const curve = weapon >= 2 ? 5 + weapon * 1.6 : 1
  const w = 1.7 + weapon * 0.32
  return (
    `M ${-w} 0 ` +
    `C ${-w - curve * 0.3} ${-len * 0.5} ${-curve} ${-len * 0.85} ${-curve - 1} ${-len} ` +
    `L ${-curve + w * 1.3} ${-len - 3} ` +
    `C ${-curve + w} ${-len * 0.85} ${w - curve * 0.3} ${-len * 0.5} ${w} 0 Z`
  )
}

export function guardPath(weapon: GearTier): string {
  if (weapon < 1) return ''
  const r = 3 + weapon * 0.7
  return `M ${-r} 0 L ${r} 0 L ${r} 2.4 L ${-r} 2.4 Z`
}

/** Headgear: 0 bare, 1 headband, 2 kasa, 3 kasa+cord, 4 kabuto, 5 oni mask. */
export function headgearPath(head: GearTier): string {
  switch (head) {
    case 0:
      return ''
    case 1:
      return 'M -13 -3 L 13 -3 L 13 1 L -13 1 Z'
    case 2:
    case 3:
      // amigasa — the wide travelling hat
      return 'M -26 -6 C -18 -20 18 -20 26 -6 C 14 -2 -14 -2 -26 -6 Z'
    case 4:
      // kabuto with a crest
      return (
        'M -16 -4 C -16 -16 16 -16 16 -4 L 22 2 L 14 2 L 12 -2 L -12 -2 L -14 2 L -22 2 Z' +
        ' M -2 -22 L 2 -22 L 5 -14 L -5 -14 Z'
      )
    default:
      // oni mask: horns
      return (
        'M -16 -4 C -16 -16 16 -16 16 -4 L 20 2 L 12 2 L -12 2 L -20 2 Z' +
        ' M -13 -14 C -19 -24 -16 -28 -11 -26 C -9 -22 -10 -18 -8 -15 Z' +
        ' M 13 -14 C 19 -24 16 -28 11 -26 C 9 -22 10 -18 8 -15 Z'
      )
  }
}

/** A straw cloak (mino) hangs off the back at low armour — the traveller look. */
export function minoPath(armour: GearTier): string {
  if (armour === 0 || armour > 2) return ''
  let d = ''
  for (let i = -5; i <= 5; i++) {
    const x = i * 3.6
    const len = 30 - Math.abs(i) * 1.7
    d += `M ${x} 4 L ${x - 1.4} ${len} L ${x + 1.4} ${len} Z `
  }
  return d
}
