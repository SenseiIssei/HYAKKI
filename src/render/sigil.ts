import { Rng } from '../sim/rng'
import type { CoreFill, SigilPreset } from './presets'

/**
 * The sigil generator. Every entity in MYRIAD is drawn by this function from a
 * seed — there are no image assets in the game.
 *
 * The trick that makes generated shapes read as *designed* rather than random
 * is step 4: marks are authored in a single sector and then rotate-copied
 * `symmetry` times. Symmetry is what the eye reads as intent.
 *
 * docs/09-ART-DIRECTION.md § The sigil generator
 */

const C = 50 // centre of the 100x100 viewBox

export type SigilPath = { d: string; w: number; o: number }
export type Sigil = {
  paths: SigilPath[]
  core: CoreFill
  coreR: number
  viewBox: string
}

type Mark =
  | { k: 'radial'; a: number; r0: number; r1: number }
  | { k: 'arc'; a0: number; a1: number; r: number }
  | { k: 'chord'; a0: number; a1: number; r0: number; r1: number }
  | { k: 'dot'; a: number; r: number; rad: number }
  | { k: 'fork'; a: number; r0: number; r1: number; spread: number }
  | { k: 'hook'; a: number; r0: number; r1: number; hook: number }

const n2 = (n: number) => (Math.round(n * 100) / 100).toString()
const pt = (a: number, r: number): [number, number] => [C + Math.cos(a) * r, C + Math.sin(a) * r]
const P = (a: number, r: number) => {
  const [x, y] = pt(a, r)
  return `${n2(x)} ${n2(y)}`
}

function renderMark(m: Mark, rot: number, mirror: boolean): string {
  const f = (a: number) => (mirror ? -a : a) + rot
  switch (m.k) {
    case 'radial':
      return `M ${P(f(m.a), m.r0)} L ${P(f(m.a), m.r1)}`
    case 'arc': {
      const sweep = m.a1 > m.a0 ? 1 : 0
      return `M ${P(f(m.a0), m.r)} A ${n2(m.r)} ${n2(m.r)} 0 0 ${mirror ? 1 - sweep : sweep} ${P(f(m.a1), m.r)}`
    }
    case 'chord':
      return `M ${P(f(m.a0), m.r0)} L ${P(f(m.a1), m.r1)}`
    case 'dot': {
      const [x, y] = pt(f(m.a), m.r)
      const r = m.rad
      return `M ${n2(x - r)} ${n2(y)} a ${n2(r)} ${n2(r)} 0 1 0 ${n2(r * 2)} 0 a ${n2(r)} ${n2(r)} 0 1 0 ${n2(-r * 2)} 0`
    }
    case 'fork':
      return (
        `M ${P(f(m.a), m.r0)} L ${P(f(m.a), m.r1)}` +
        ` M ${P(f(m.a), m.r1)} L ${P(f(m.a + m.spread), m.r1 + 4)}` +
        ` M ${P(f(m.a), m.r1)} L ${P(f(m.a - m.spread), m.r1 + 4)}`
      )
    case 'hook':
      return (
        `M ${P(f(m.a), m.r0)} L ${P(f(m.a), m.r1)}` +
        ` M ${P(f(m.a), m.r1)} L ${P(f(m.a + m.hook), m.r1)}`
      )
  }
}

export function buildSigil(preset: SigilPreset, seed: number): Sigil {
  const rng = new Rng(seed >>> 0)
  const sym = Math.max(1, Math.round(preset.symmetry))
  const sector = (Math.PI * 2) / sym
  // symmetry 2 reads as bilateral (humanoid) rather than rotational
  const mirrored = sym === 2
  const paths: SigilPath[] = []

  const kinds: Mark['k'][] = ['radial', 'arc', 'chord', 'dot', 'fork', 'hook']

  for (let ring = 0; ring < preset.rings; ring++) {
    const R = 15 + 30 * ((ring + 1) / preset.rings)
    const count = Math.max(1, Math.ceil(preset.density * 5))

    for (let i = 0; i < count; i++) {
      const jitter = () => (rng.next() - 0.5) * preset.jitter * 0.5
      const a = rng.range(0, sector * 0.92) + jitter()
      // an unclosed stroke is the visual signature of the Hollow's decay
      const open = rng.chance(preset.openness) ? rng.range(0.6, 0.9) : 1
      const kind = rng.pick(kinds)

      let m: Mark
      switch (kind) {
        case 'radial':
          m = { k: 'radial', a, r0: R * 0.55, r1: R * open }
          break
        case 'arc':
          m = { k: 'arc', a0: a, a1: a + sector * 0.62 * open, r: R }
          break
        case 'chord':
          m = { k: 'chord', a0: a, a1: a + sector * 0.5, r0: R, r1: R * (0.7 + jitter()) }
          break
        case 'dot':
          m = { k: 'dot', a, r: R, rad: 0.8 + rng.next() * 1.6 }
          break
        case 'fork':
          m = { k: 'fork', a, r0: R * 0.5, r1: R * 0.86 * open, spread: sector * 0.22 }
          break
        default:
          m = { k: 'hook', a, r0: R * 0.5, r1: R * open, hook: sector * 0.3 }
      }

      const w = preset.strokeWeight * (0.75 + rng.next() * 0.5)
      const o = 0.55 + rng.next() * 0.45
      const copies = mirrored ? 2 : sym
      for (let k = 0; k < copies; k++) {
        const rot = mirrored ? 0 : k * sector
        paths.push({ d: renderMark(m, rot, mirrored && k === 1), w, o })
      }
    }
  }

  if (preset.ring) {
    paths.push({
      d: `M ${P(0, 44)} A 44 44 0 1 1 ${P(Math.PI, 44)} A 44 44 0 1 1 ${P(0, 44)}`,
      w: preset.strokeWeight * 0.6,
      o: 0.9,
    })
  }

  return {
    paths,
    core: preset.coreFill,
    coreR: 6 + Math.round(rng.next() * 4),
    viewBox: '0 0 100 100',
  }
}

// Sigils are deterministic, so cache them by identity. One sigil is ~30-90 path
// commands; regenerating on every frame would be wasteful, not slow.
const cache = new Map<string, Sigil>()

export function getSigil(preset: SigilPreset, seed: number, key: string): Sigil {
  const hit = cache.get(key)
  if (hit) return hit
  const made = buildSigil(preset, seed)
  if (cache.size > 400) cache.clear()
  cache.set(key, made)
  return made
}
