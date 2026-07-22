import { blank, blit, outline, sprite, type Palette, type Sprite } from './engine'
import type { GearTier } from '../render/figure'

/**
 * THE WALKER, in pixels.
 *
 * Authored at 40×52 and drawn at 5–7× so every pixel is a deliberate decision.
 * Parts are separate sprites composed at per-frame offsets — six walk frames
 * across five gear tiers from one set of parts.
 *
 * Palette keys:
 *   K outline   S skin    s skin shade   H hair    h hair shine
 *   C cloth     c cloth shade   d cloth deep    R sash (vermilion)
 *   M metal     m metal shade   g gold     W blade   w blade shade
 *   E eye       B bone/straw    b straw shade
 */

export const WALKER_PAL: Palette = {
  K: '#0b0908',
  S: '#d2ab84',
  s: '#a8815d',
  H: '#181211',
  h: '#2e2422',
  C: '#5d5346',
  c: '#443c33',
  d: '#2c2721',
  R: '#c1372b',
  r: '#8e2820',
  M: '#6f7378',
  m: '#4a4d51',
  g: '#b8912f',
  W: '#cdd3d8',
  w: '#8f979d',
  E: '#e8e2d0',
  B: '#a8925f',
  b: '#7a693f',
  F: '#e8934a',
}

// ── parts ──────────────────────────────────────────────────────────────

const HEAD = sprite([
  '..HHHHHH..',
  '.HHhhhhHH.',
  'HHhhhhhhHH',
  'HSSSSSSSSH',
  'HSSSSSSSSH',
  'SSEsSSsESS',
  'SSSSSSSSSS',
  '.SSssssSS.',
  '..SSSSSS..',
  '...ssss...',
])

/** a topknot, because he is not a peasant even now */
const TOPKNOT = sprite(['..HH..', '.HHHH.', '..HH..'])

const TORSO = sprite([
  '.CCCCCCCC.',
  'CCCCCCCCCC',
  'CCcCCCCcCC',
  'CCcCCCCcCC',
  'CCCCCCCCCC',
  'RRRRRRRRRR',
  'rRRRRRRRRr',
  'CCcCCCCcCC',
  'CCCddCCCCC',
  '.CCddCCCC.',
])

const ARM = sprite(['CCC', 'CcC', 'CCC', 'CcC', 'SSS', 'SsS'])

const LEG = sprite(['CCC', 'CcC', 'CCC', 'ccC', 'ddd', 'KKK'])

// ── gear ───────────────────────────────────────────────────────────────

/** straw travelling cloak — the poor look */
const MINO = sprite([
  'BbBbBbBbBb',
  'BBbBbBbBBb',
  'bBbBbBbBbB',
  'BbBbBbBbBb',
  'bBbBbBbBbB',
  '.bBbBbBb..',
])

const DOMARU = sprite([
  'mMMMMMMMMm',
  'MMmMMMMmMM',
  'MmMMMMMMmM',
  'MMMMMMMMMM',
  'mMMgggMMMm',
  'MMMMMMMMMM',
  'MmMMMMMMmM',
  '.mMMMMMMm.',
])

const PAULDRON = sprite(['.mMMm.', 'mMMMMm', 'MMggMM', 'mMMMMm', '.mmmm.'])

const OYOROI_SKIRT = sprite([
  'MmMmMmMmMm',
  'mMmMmMmMmM',
  'MgMgMgMgMg',
  'mMmMmMmMmM',
  'MmMmMmMmMm',
  'mm.mm.mm.m',
])

const HEADBAND = sprite(['RRRRRRRRRR', 'rRRRRRRRRr'])

/** amigasa — the wide travelling hat */
const KASA = sprite([
  '.....BB.....',
  '...BBBBBB...',
  '.BBBBBBBBBB.',
  'BBbBBBBBBbBB',
  'bb........bb',
])

const KABUTO = sprite([
  '....gg....',
  '..MMggMM..',
  '.MMMMMMMM.',
  'MMmMMMMmMM',
  'MMMMMMMMMM',
  'mM.MMMM.Mm',
])

/** oni mask — horns, and a mouth that is not a mouth */
const ONI_MASK = sprite([
  'M........M',
  'MM......MM',
  '.RRRRRRRR.',
  'RRRRRRRRRR',
  'RRKRRRRKRR',
  'RRRRRRRRRR',
  '.RKKKKKKR.',
  '..RRRRRR..',
])

// ── weapons ────────────────────────────────────────────────────────────

function blade(tier: GearTier, burning: boolean): Sprite {
  const len = [6, 11, 17, 23, 29, 33][tier]
  const s = blank(5, len + 5)
  // grip
  for (let y = len; y < len + 5; y++) {
    s.px[y * 5 + 1] = 'h'
    s.px[y * 5 + 2] = 'H'
    s.px[y * 5 + 3] = 'h'
  }
  // guard
  if (tier >= 1) for (let x = 0; x < 5; x++) s.px[(len - 1) * 5 + x] = 'g'
  // the blade — curved, with a bright edge and a shaded spine
  for (let y = 0; y < len - 1; y++) {
    const curve = tier >= 2 ? Math.round(((len - y) / len) * (tier - 1) * 0.6) : 0
    const x = 2 - curve
    if (x >= 0 && x < 5) {
      s.px[y * 5 + x] = 'W'
      if (x + 1 < 5) s.px[y * 5 + x + 1] = burning ? 'F' : 'w'
    }
  }
  return s
}

// ── composition ────────────────────────────────────────────────────────

export type WalkerLook = {
  weapon: GearTier
  armour: GearTier
  head: GearTier
  aura: number
}

export const WALKER_W = 40
export const WALKER_H = 52

/**
 * One frame. `phase` 0..1 drives the walk cycle; `pose` swaps in the attack and
 * brace stances.
 */
export function walkerFrame(
  look: WalkerLook,
  phase: number,
  pose: 'walk' | 'strike' | 'brace' | 'hit' = 'walk',
): Sprite {
  const s = blank(WALKER_W, WALKER_H)
  const cx = 14

  const t = phase * Math.PI * 2
  const swing = Math.sin(t)
  const bob = pose === 'brace' ? 1 : Math.round(Math.abs(Math.cos(t)) * -1.5)

  const legFront = Math.round(swing * 3)
  const legBack = Math.round(-swing * 3)
  const armSwing = Math.round(-swing * 2)

  const baseY = 24 + bob

  // ── back leg, then back arm: behind the body ──
  blit(s, LEG, cx + 1 + legBack, baseY + 16, {
    remap: { C: 'c', c: 'd' },
    shear: pose === 'brace' ? -2 : legBack * 0.5,
  })
  blit(s, ARM, cx - 3 + armSwing, baseY + 2, { remap: { C: 'c', c: 'd', S: 's' } })

  // ── the coat and body ──
  if (look.armour === 0 || look.armour === 1) blit(s, MINO, cx, baseY + 6)
  blit(s, TORSO, cx, baseY)
  if (look.armour >= 2) blit(s, DOMARU, cx, baseY + 1)
  if (look.armour >= 4) blit(s, OYOROI_SKIRT, cx, baseY + 9)
  if (look.armour >= 3) {
    blit(s, PAULDRON, cx - 4, baseY + 1)
    blit(s, PAULDRON, cx + 8, baseY + 1, { flip: true })
  }

  // ── head ──
  const hy = baseY - 10
  blit(s, TOPKNOT, cx + 2, hy - 2)
  blit(s, HEAD, cx, hy)
  if (look.head === 1) blit(s, HEADBAND, cx, hy + 2)
  if (look.head === 2 || look.head === 3) blit(s, KASA, cx - 1, hy - 3)
  if (look.head === 4) blit(s, KABUTO, cx, hy - 4)
  if (look.head >= 5) blit(s, ONI_MASK, cx, hy - 1)

  // ── front arm and the blade ──
  // The blade grip sits at the hand and the blade rises FROM it. A long blade
  // (tier 3–5) is nearly as tall as the whole figure, so it must always point
  // up-and-forward — pointing it down runs it straight through the legs and off
  // the bottom of the frame. The body's lunge (done in CSS over this frame) is
  // what sells the swing; the sprite just has to hold the weapon believably.
  const bl = blade(look.weapon, look.weapon >= 5)
  // where the grip meets the hand, so the blade always rises out of the fist
  const gripFromHand = (ay: number) => ay - bl.h + 7
  let ax = cx + 9 - armSwing
  let ay = baseY + 2
  let bx = ax + 1
  let by = ay - bl.h + 6

  if (pose === 'strike') {
    // raised for an overhead cut: grip at the hand, blade up and leaning hard
    // toward the enemy — a wind-up, never a spear through his own shins
    ax = cx + 10
    ay = baseY + 1
    bx = ax
    by = gripFromHand(ay)
    blit(s, bl, bx, by, { shear: 11 })
  } else if (pose === 'brace') {
    // held upright as a guard, close in, only a slight forward cant
    ax = cx + 9
    ay = baseY + 2
    bx = ax
    by = gripFromHand(ay)
    blit(s, bl, bx, by, { shear: 3 })
  } else {
    blit(s, bl, bx, by)
  }
  blit(s, ARM, ax, ay)

  // ── front leg ──
  blit(s, LEG, cx + 5 + legFront, baseY + 16, {
    shear: pose === 'brace' ? 2 : legFront * 0.5,
  })

  return outline(s, 'K')
}

export const WALK_FRAMES = 8
