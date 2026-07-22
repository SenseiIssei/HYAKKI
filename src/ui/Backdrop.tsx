import { useMemo } from 'react'
import { COLORS } from '../render/presets'
import { Rng } from '../sim/rng'
import { worldHue, worldSat } from '../content/worldStage'

/**
 * The road through Yomi, moving.
 *
 * Four parallax bands, each scrolling at its own rate, all generated. The BAND
 * changes with depth — bamboo, then the village, then the river, then the
 * hells, then nothing — and each band cross-fades into the next so the world
 * changes under you rather than cutting.
 *
 * Adding a new region is one entry in REGIONS. Nothing else has to know.
 */

export type Region = {
  id: string
  /** lowest Ri at which this region begins */
  from: number
  name: string
  sky: [string, string]
  far: string
  mid: string
  near: string
  /** what stands along the road */
  motif: 'bamboo' | 'torii' | 'lanterns' | 'stones' | 'pillars' | 'none'
  /** ambient particles: petals, ash, embers, snow, none */
  motes: 'petals' | 'ash' | 'embers' | 'snow' | 'none'
}

export const REGIONS: Region[] = [
  {
    id: 'bamboo', from: 0, name: 'The Bamboo Road',
    sky: ['#0d1310', '#0a0908'], far: '#141c18', mid: '#1b2620', near: '#0c100e',
    motif: 'bamboo', motes: 'petals',
  },
  {
    id: 'paddies', from: 30, name: 'The Drowned Paddies',
    sky: ['#0c130f', '#0a0908'], far: '#122019', mid: '#152a20', near: '#0a120d',
    motif: 'stones', motes: 'none',
  },
  {
    id: 'village', from: 60, name: 'The Emptied Village',
    sky: ['#141013', '#0a0908'], far: '#1d181c', mid: '#251d20', near: '#100c0e',
    motif: 'lanterns', motes: 'ash',
  },
  {
    id: 'market', from: 110, name: 'The Night Market',
    sky: ['#1a0f10', '#0a0908'], far: '#2a1412', mid: '#361a15', near: '#150b0b',
    motif: 'lanterns', motes: 'ash',
  },
  {
    id: 'shrine', from: 160, name: 'The Thousand Gates',
    sky: ['#170f0e', '#0a0908'], far: '#26150f', mid: '#331a12', near: '#140b09',
    motif: 'torii', motes: 'ash',
  },
  {
    id: 'snow', from: 230, name: 'The Snow Country',
    sky: ['#161a1e', '#0b0d10'], far: '#232c34', mid: '#2e3a44', near: '#141a1f',
    motif: 'none', motes: 'snow',
  },
  {
    id: 'sanzu', from: 320, name: 'The River',
    sky: ['#0c1416', '#0a0908'], far: '#122024', mid: '#16292e', near: '#0a1113',
    motif: 'stones', motes: 'none',
  },
  {
    id: 'aokigahara', from: 460, name: 'The Sea of Trees',
    sky: ['#0b110c', '#070a07'], far: '#111c12', mid: '#152615', near: '#0a110a',
    motif: 'pillars', motes: 'none',
  },
  {
    id: 'jigoku', from: 700, name: 'The Burning Ground',
    sky: ['#1a0c08', '#0a0908'], far: '#2c1109', mid: '#3d160a', near: '#160806',
    motif: 'pillars', motes: 'embers',
  },
  {
    id: 'bridges', from: 900, name: 'The Hundred-Bridge Marsh',
    sky: ['#0b1013', '#080a0b'], far: '#101a1f', mid: '#152329', near: '#0a1013',
    motif: 'stones', motes: 'none',
  },
  {
    id: 'iron', from: 1400, name: 'The Iron Wastes',
    sky: ['#14100c', '#0a0806'], far: '#231a12', mid: '#2f2116', near: '#130d09',
    motif: 'pillars', motes: 'embers',
  },
  {
    id: 'muken', from: 2000, name: 'Without Interval',
    sky: ['#0a0a0c', '#050505'], far: '#0e0e11', mid: '#121216', near: '#070708',
    motif: 'none', motes: 'none',
  },
]

export function regionFor(ri: number): Region {
  let out = REGIONS[0]
  for (const r of REGIONS) if (ri >= r.from) out = r
  return out
}

/** 0..1 through the current region, for cross-fading into the next. */
function blendTo(ri: number): { next: Region | null; t: number } {
  const i = REGIONS.findIndex((r) => r === regionFor(ri))
  const next = REGIONS[i + 1] ?? null
  if (!next) return { next: null, t: 0 }
  const span = next.from - REGIONS[i].from
  const into = ri - REGIONS[i].from
  // only the last 25% of a region bleeds into the next
  const t = Math.max(0, (into / span - 0.75) / 0.25)
  return { next, t: Math.min(1, t) }
}

// ── silhouettes, generated ─────────────────────────────────────────────

function bamboo(seed: number, n: number, h: number): string {
  const r = new Rng(seed)
  let d = ''
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 400 + r.range(-8, 8)
    const w = r.range(2.5, 5)
    const top = r.range(h * 0.15, h * 0.5)
    d += `M ${x} 200 L ${x} ${top} L ${x + w} ${top} L ${x + w} 200 Z `
    for (let y = top + 14; y < 200; y += r.range(18, 30)) {
      d += `M ${x - 1} ${y} L ${x + w + 1} ${y} L ${x + w + 1} ${y + 2} L ${x - 1} ${y + 2} Z `
    }
  }
  return d
}

function torii(seed: number, n: number): string {
  const r = new Rng(seed)
  let d = ''
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 400 + r.range(-10, 10)
    const s = r.range(0.7, 1.25)
    const w = 46 * s
    const hh = 78 * s
    const y = 200
    d +=
      `M ${x - w / 2 - 5} ${y - hh} L ${x + w / 2 + 5} ${y - hh} L ${x + w / 2 + 5} ${y - hh + 7} L ${x - w / 2 - 5} ${y - hh + 7} Z ` +
      `M ${x - w / 2} ${y - hh + 14} L ${x + w / 2} ${y - hh + 14} L ${x + w / 2} ${y - hh + 20} L ${x - w / 2} ${y - hh + 20} Z ` +
      `M ${x - w / 2} ${y - hh + 7} L ${x - w / 2 + 6} ${y - hh + 7} L ${x - w / 2 + 9} ${y} L ${x - w / 2 - 3} ${y} Z ` +
      `M ${x + w / 2} ${y - hh + 7} L ${x + w / 2 - 6} ${y - hh + 7} L ${x + w / 2 - 9} ${y} L ${x + w / 2 + 3} ${y} Z `
  }
  return d
}

function lanterns(seed: number, n: number): string {
  const r = new Rng(seed)
  let d = ''
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 400 + r.range(-14, 14)
    const top = r.range(40, 96)
    d += `M ${x - 1.5} 200 L ${x - 1.5} ${top} L ${x + 1.5} ${top} L ${x + 1.5} 200 Z `
    d += `M ${x - 9} ${top + 6} C ${x - 11} ${top + 20} ${x + 11} ${top + 20} ${x + 9} ${top + 6} C ${x + 6} ${top} ${x - 6} ${top} ${x - 9} ${top + 6} Z `
  }
  return d
}

function stones(seed: number, n: number): string {
  const r = new Rng(seed)
  let d = ''
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 400 + r.range(-12, 12)
    let y = 200
    const stack = r.int(2, 7)
    for (let s = 0; s < stack; s++) {
      const w = r.range(7, 15) * (1 - s * 0.08)
      const h = r.range(4, 8)
      d += `M ${x - w / 2} ${y} L ${x + w / 2} ${y} L ${x + w / 2 - 1} ${y - h} L ${x - w / 2 + 1} ${y - h} Z `
      y -= h + 1
    }
  }
  return d
}

function pillars(seed: number, n: number): string {
  const r = new Rng(seed)
  let d = ''
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 400 + r.range(-10, 10)
    const top = r.range(20, 110)
    const w = r.range(10, 22)
    d += `M ${x} 200 L ${x + r.range(-4, 4)} ${top} L ${x + w} ${top + r.range(-6, 6)} L ${x + w} 200 Z `
  }
  return d
}

function motif(kind: Region['motif'], seed: number, n: number, h: number): string {
  switch (kind) {
    case 'bamboo': return bamboo(seed, n, h)
    case 'torii': return torii(seed, n)
    case 'lanterns': return lanterns(seed, n)
    case 'stones': return stones(seed, n)
    case 'pillars': return pillars(seed, n)
    default: return ''
  }
}

/**
 * Bands are generated as paths but PAINTED as pixels.
 *
 * The shapes below are still vector — that is the right way to author a
 * skyline, and every region gets one for free. But drawing them as SVG put
 * smooth sub-pixel silhouettes behind hand-placed pixel sprites, and the seam
 * between the two was the most obviously wrong thing on screen. So the path is
 * rasterised once, at a deliberately coarse resolution, and scaled back up with
 * nearest-neighbour: same generated shapes, same chunky grid as the walker.
 */
/**
 * Chosen so the upscale is near-uniform on both axes — a band is drawn about
 * four times wider than it is tall, so a 2:1 canvas would give pixels twice as
 * wide as they are high, which reads as a stretched image rather than as
 * pixel art. Measured against the live layout: 1280x331 from 160x40 is 8.0x
 * across and 8.3x down.
 */
const BAND_W = 160
const BAND_H = 40

function useBandImage(d: string, fill: string) {
  return useMemo(() => {
    if (!d) return null
    const c = document.createElement('canvas')
    c.width = BAND_W
    c.height = BAND_H
    const ctx = c.getContext('2d')
    if (!ctx) return null
    // the paths are authored in a 400x200 space
    ctx.scale(BAND_W / 400, BAND_H / 200)
    ctx.fillStyle = fill
    ctx.fill(new Path2D(d))
    return c.toDataURL()
  }, [d, fill])
}

/** One scrolling band. Two copies side by side make the loop seamless. */
function Band({
  d, fill, speed, y, opacity = 1,
}: {
  d: string; fill: string; speed: number; y: number; opacity?: number
}) {
  const src = useBandImage(d, fill)
  if (!src) return null
  return (
    <div className="bd-band" style={{ ['--sp' as string]: `${speed}s`, bottom: `${y}%`, opacity }}>
      <img src={src} alt="" />
      <img src={src} alt="" />
    </div>
  )
}

/**
 * How defilement discolours the world.
 *
 * Kegare is pollution, so the world does not get *darker* — it goes sallow and
 * bloodshot, the way meat does. Applied as a filter on the whole backdrop
 * rather than by rewriting every region's palette, so a new region inherits the
 * behaviour for free and the authored colours stay authored.
 */
function rotFilter(kegare: number, ri: number): string | undefined {
  const k = Math.min(1, Math.max(0, kegare))
  // Procedural World variation: every World tilts the palette its own way, so
  // the authored Regions give the broad strokes and the World seed makes each
  // one its own place. Deterministic, so a World always looks the same.
  const world = Math.floor(Math.max(0, ri) / 10)
  const wHue = worldHue(world)
  const wSat = worldSat(world)
  if (k < 0.02 && world === 0) return undefined
  const hue = -k * 18 + wHue
  const sat = (1 + k * 1.5) * wSat
  return `saturate(${sat.toFixed(2)}) hue-rotate(${hue.toFixed(0)}deg) contrast(${(1 + k * 0.22).toFixed(2)}) brightness(${(1 - k * 0.16).toFixed(2)})`
}

export function Backdrop({
  ri,
  still = false,
  kegare = 0,
}: {
  ri: number
  still?: boolean
  kegare?: number
}) {
  const region = regionFor(ri)
  const { next, t } = blendTo(ri)

  const layers = useMemo(() => {
    const s = (n: number) => (region.id.charCodeAt(0) * 7919 + n) >>> 0
    return {
      far: motif(region.motif, s(1), 7, 150),
      mid: motif(region.motif, s(2), 11, 120),
      near: motif(region.motif, s(3), 5, 90),
    }
  }, [region])

  const nextLayers = useMemo(() => {
    if (!next) return null
    const s = (n: number) => (next.id.charCodeAt(0) * 7919 + n) >>> 0
    return {
      far: motif(next.motif, s(1), 7, 150),
      mid: motif(next.motif, s(2), 11, 120),
      near: motif(next.motif, s(3), 5, 90),
    }
  }, [next])

  return (
    <div
      className={`backdrop ${still ? 'still' : ''}`}
      aria-hidden="true"
      style={{ filter: rotFilter(kegare, ri) }}
    >
      <div
        className="bd-sky"
        style={{ background: `linear-gradient(to bottom, ${region.sky[0]}, ${region.sky[1]})` }}
      />
      {next && (
        <div
          className="bd-sky"
          style={{
            background: `linear-gradient(to bottom, ${next.sky[0]}, ${next.sky[1]})`,
            opacity: t,
          }}
        />
      )}

      {/* the moon, always there, never quite the same size */}
      <div className="bd-moon" style={{ opacity: region.id === 'muken' ? 0 : 0.5 }} />

      <Band d={layers.far} fill={region.far} speed={190} y={22} />
      <Band d={layers.mid} fill={region.mid} speed={96} y={12} />
      <Band d={layers.near} fill={region.near} speed={44} y={0} />

      {nextLayers && t > 0 && (
        <>
          <Band d={nextLayers.far} fill={next!.far} speed={190} y={22} opacity={t} />
          <Band d={nextLayers.mid} fill={next!.mid} speed={96} y={12} opacity={t} />
          <Band d={nextLayers.near} fill={next!.near} speed={44} y={0} opacity={t} />
        </>
      )}

      {/* the ground he actually walks on */}
      <div className="bd-ground" style={{ background: region.near }} />

      {region.motes !== 'none' && (
        <div className={`bd-motes motes-${region.motes}`}>
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              style={{
                left: `${(i * 7.3) % 100}%`,
                ['--dur' as string]: `${9 + ((i * 3) % 11)}s`,
                ['--del' as string]: `${-(i * 1.7)}s`,
                background:
                  region.motes === 'embers'
                    ? COLORS.blood
                    : region.motes === 'petals'
                      ? '#C98A9B'
                      : region.motes === 'snow'
                        ? '#dfe9ef'
                        : COLORS.ash,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
