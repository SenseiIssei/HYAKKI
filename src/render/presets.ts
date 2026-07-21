import type { Family } from '../content/balance'

export type CoreFill = 'solid' | 'hollow' | 'negative' | 'none'

export type SigilPreset = {
  /** rotational symmetry order, 1-12 */
  symmetry: number
  /** concentric structural rings, 1-4 */
  rings: number
  strokeWeight: number
  /** 0-1, marks per sector */
  density: number
  coreFill: CoreFill
  /** 0-1, positional irregularity */
  jitter: number
  /** 0-1, likelihood a stroke fails to close */
  openness: number
  /** draw the outer ring itself */
  ring?: boolean
}

/** docs/09-ART-DIRECTION.md § Family presets */
export const FAMILY_PRESETS: Record<Family, SigilPreset> = {
  chaff: { symmetry: 4, rings: 2, strokeWeight: 0.9, density: 0.3, coreFill: 'none', jitter: 0.5, openness: 0.6 },
  organs: { symmetry: 7, rings: 3, strokeWeight: 2.5, density: 0.8, coreFill: 'solid', jitter: 0.2, openness: 0.1 },
  returned: { symmetry: 2, rings: 2, strokeWeight: 1.4, density: 0.5, coreFill: 'hollow', jitter: 0.3, openness: 0.4 },
  warden: { symmetry: 12, rings: 4, strokeWeight: 3.2, density: 0.9, coreFill: 'solid', jitter: 0.05, openness: 0, ring: true },
  nothing: { symmetry: 5, rings: 3, strokeWeight: 0, density: 0.7, coreFill: 'negative', jitter: 0.4, openness: 0.8 },
}

// ── palette ──
export const COLORS = {
  void: '#0B0B0F',
  voidLift: '#14141A',
  voidEdge: '#1F1F28',
  bone: '#E8E2D4',
  boneDim: '#9A9488',
  ash: '#5C5A55',
  blood: '#B4232A',
  gold: '#C9A227',
  ichor: '#3FA7A0',
} as const

function hexToRgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
}

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const k = Math.max(0, Math.min(1, t))
  const to = (x: number, y: number) => Math.round(x + (y - x) * k).toString(16).padStart(2, '0')
  return `#${to(r1, r2)}${to(g1, g2)}${to(b1, b2)}`
}

/**
 * The world drains of colour as you descend: bone -> blood by Rank 500,
 * blood -> gold by Rank 5000. No assets involved.
 */
export function rankTint(rank: number): string {
  if (rank <= 1) return COLORS.bone
  if (rank < 500) return mix(COLORS.bone, COLORS.blood, (rank - 1) / 499)
  if (rank < 5000) return mix(COLORS.blood, COLORS.gold, (rank - 500) / 4500)
  return COLORS.gold
}
