import { useEffect, useMemo, useRef } from 'react'

import { draw, type Palette, type Sprite } from '../pixel/engine'
import { WALKER_H, WALKER_PAL, WALKER_W, WALK_FRAMES, walkerFrame } from '../pixel/walker'
import { YOKAI_H, YOKAI_PAL, YOKAI_W, yokaiFrame, type YokaiKind } from '../pixel/yokai'
import { SPECIES_BY_ID } from '../pixel/species'
import { lookFrom, type Look } from '../render/figure'
import type { Enemy, StatBlock } from '../sim/types'

/**
 * Renders pixel sprites to a canvas at an integer scale, nearest-neighbour.
 *
 * Frames are PRE-RENDERED once per look and then swapped on a timer — so the
 * per-frame cost is one `drawImage`, not a few thousand `fillRect`s, and the
 * animation keeps running on a `setInterval` rather than rAF (which is
 * suspended in a hidden window).
 */
/**
 * A frame set costs ~1.6MB of canvas backing store to rasterise. These used to
 * be memoised on the IDENTITY of the look/build closure — but `lookFrom()`
 * returns a fresh object every tick, so the memo never hit and the walker was
 * re-rasterising ten times a second. Measured: 22 canvases/sec, ~4.5MB/s of
 * allocation, while standing still on a menu.
 *
 * So frames are keyed on a VALUE signature instead, and kept in a bounded LRU —
 * bounded because this is a game people leave running for hours, and an
 * unbounded sprite cache is just a slow leak with good manners.
 */
const CACHE_MAX = 24
const frameCache = new Map<string, HTMLCanvasElement[]>()

function useFrames(
  key: string,
  build: (i: number) => Sprite,
  count: number,
  pal: Palette,
  scale: number,
) {
  return useMemo(() => {
    const hit = frameCache.get(key)
    if (hit) {
      // re-insert so the most recently used entry is evicted last
      frameCache.delete(key)
      frameCache.set(key, hit)
      return hit
    }
    const out: HTMLCanvasElement[] = []
    for (let i = 0; i < count; i++) {
      const s = build(i)
      const c = document.createElement('canvas')
      c.width = s.w * scale
      c.height = s.h * scale
      const ctx = c.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      draw(ctx, s, pal, scale)
      out.push(c)
    }
    frameCache.set(key, out)
    if (frameCache.size > CACHE_MAX) {
      const oldest = frameCache.keys().next().value
      if (oldest !== undefined) frameCache.delete(oldest)
    }
    return out
    // build is deliberately excluded: `key` is the real identity of the output.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, count, scale])
}

function Canvas({
  frames,
  w,
  h,
  scale,
  fps,
  paused,
  className,
  flash,
  filter,
}: {
  frames: HTMLCanvasElement[]
  w: number
  h: number
  scale: number
  fps: number
  paused?: boolean
  className?: string
  flash?: boolean
  filter?: string
}) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv || !frames.length) return
    const ctx = cv.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    let i = 0
    const paint = () => {
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.drawImage(frames[i % frames.length], 0, 0)
    }
    paint()
    if (paused) return
    const id = window.setInterval(() => {
      i++
      paint()
    }, Math.max(40, 1000 / fps))
    return () => window.clearInterval(id)
  }, [frames, fps, paused])

  return (
    <canvas
      ref={ref}
      width={w * scale}
      height={h * scale}
      style={filter ? { filter } : undefined}
      className={`pixel ${flash ? 'pixel-flash' : ''} ${className ?? ''}`}
      aria-hidden="true"
    />
  )
}

/**
 * Defilement on the man himself. Same treatment as the backdrop — sallow and
 * bloodshot rather than dark — applied as a filter so it costs nothing per
 * frame and doesn't multiply the sprite cache by another axis.
 */
function rotFilter(kegare: number): string | undefined {
  const k = Math.min(1, Math.max(0, kegare))
  if (k < 0.02) return undefined
  return `saturate(${1 + k * 1.4}) hue-rotate(${-k * 20}deg) brightness(${1 - k * 0.12})`
}

export function PixelWalker({
  stats,
  look: lookOverride,
  pose = 'walk',
  flash,
  scale = 5,
  kegare = 0,
  glow,
}: {
  stats?: StatBlock
  /** how defiled the walker is, 0..1 — tints him without touching the sprites */
  kegare?: number
  /**
   * Show a specific figure instead of deriving one from stats. The class cards
   * need this: classes differ by how they PRODUCE damage, not by their opening
   * statline, so deriving a look from stats drew six near-identical men.
   */
  look?: Look
  /** a colour the best-worn rarity casts around him */
  glow?: string
  pose?: 'walk' | 'strike' | 'brace' | 'hit'
  flash?: boolean
  scale?: number
}) {
  const look = lookOverride ?? lookFrom(stats!)
  // Only what the PIXELS depend on. `gait` is deliberately absent — it drives
  // the frame rate, not the artwork, and including it rebuilt every sprite on
  // every speed change. Continuous values are quantised so a stat ticking up
  // by a hair doesn't invalidate a whole frame set.
  const key =
    `w:${look.weapon}:${look.armour}:${look.head}` +
    `:${Math.round(look.aura * 10)}:${Math.round(look.kegare * 10)}:${pose}:${scale}`
  const lookRef = useRef(look)
  lookRef.current = look
  const frames = useFrames(
    key,
    (i: number) => walkerFrame(lookRef.current, i / WALK_FRAMES, pose),
    WALK_FRAMES,
    WALKER_PAL,
    scale,
  )
  // faster gait -> faster cycle, which is the whole point of the stat
  const fps = Math.round(WALK_FRAMES / Math.max(0.3, look.gait))
  // the rarity glow is a coloured drop-shadow, stacked onto the kegare tint
  const rot = rotFilter(kegare)
  const glowFx = glow ? `drop-shadow(0 0 ${scale}px ${glow}) drop-shadow(0 0 2px ${glow})` : ''
  const filter = [rot, glowFx].filter(Boolean).join(' ') || undefined
  return (
    <Canvas
      frames={frames}
      w={WALKER_W}
      h={WALKER_H}
      scale={scale}
      fps={fps}
      paused={pose === 'brace'}
      className={`walker-px pose-${pose}`}
      flash={flash}
      filter={filter}
    />
  )
}

/**
 * A single frozen frame of a yōkai, for the death overlay. Each family goes out
 * its own way (the CSS in styles.css does the actual dissolve): chaff scatters,
 * organs collapse, the returned fade upward, the Mu simply close.
 */
export function PixelCorpse({
  family,
  seed,
  speciesId,
  scale = 5,
}: {
  family: string
  seed: number
  speciesId?: string
  scale?: number
}) {
  const kind = family as YokaiKind
  const species = speciesId ? SPECIES_BY_ID[speciesId] : null
  const folded = ((seed % 8) * 2654435761) >>> 0
  const key = `corpse:${speciesId ?? kind}:${folded}:${scale}`
  // one frame is enough; the animation is the fade, not the sprite
  const frames = useFrames(
    key,
    () => (species ? species.build(folded, 0.5) : yokaiFrame(kind, folded, 0.5, speciesId ? 9999 : 1)),
    1,
    YOKAI_PAL,
    scale,
  )
  return (
    <Canvas
      frames={frames}
      w={YOKAI_W}
      h={YOKAI_H}
      scale={scale}
      fps={1}
      paused
      className={`corpse-px die-${kind}`}
    />
  )
}

export function PixelYokai({
  enemy,
  flash,
  scale = 5,
}: {
  enemy: Enemy
  flash?: boolean
  scale?: number
}) {
  const kind = enemy.family as YokaiKind
  const rank = enemy.speciesId ? 9999 : 1
  const species = enemy.speciesId ? SPECIES_BY_ID[enemy.speciesId] : null
  // Every kill spawns a new seed, and a raw seed means a guaranteed cache miss
  // and a fresh 1.6MB rasterise per corpse. Folded to 8 well-spread variants
  // per species: still visibly a crowd rather than a clone army, but the
  // working set now fits in the cache instead of thrashing it.
  const seed = (((enemy.seed >>> 0) % 8) * 2654435761) >>> 0
  const key = `y:${enemy.speciesId ?? kind}:${seed}:${scale}`
  const frames = useFrames(
    key,
    (i: number) => (species ? species.build(seed, i / 8) : yokaiFrame(kind, seed, i / 8, rank)),
    8,
    YOKAI_PAL,
    scale,
  )
  // the Kings do not move, and a hole does not move
  const still = kind === 'warden' || kind === 'nothing'
  const fps = species?.fps ?? (kind === 'chaff' ? 12 : kind === 'organs' ? 6 : 4)

  // ── colour variants ──
  // The same species turns up in many hues, so the road never looks like a
  // clone army. The shift is deterministic from the raw seed (so a given enemy
  // is always the same colour), and it deepens with Ri — the further in, the
  // more saturated and cursed everything reads. The Mu are exempt: a hole has
  // no colour to rotate. The Kings are exempt: their courts are authored.
  const raw = enemy.seed >>> 0
  const tinted = kind !== 'nothing' && kind !== 'warden'
  // unsigned shift: a signed >> goes negative for large seeds and threw the hue
  // out to values like -477deg. Kept to a clean -180..179.
  const hue = tinted ? ((raw >>> 3) % 360) - 180 : 0
  // HP magnitude stands in for depth: the further in, the more saturated and
  // cursed everything looks, without threading rank through the render tree.
  const mag = enemy.maxHp.gt(1) ? enemy.maxHp.log10() : 0
  const sat = 1.1 + Math.min(0.9, mag / 45)
  // an "elite" turns up rarely and does not sit still on one colour — it cycles
  const elite = tinted && raw % 97 < 9
  const filter = !tinted || elite ? undefined : `hue-rotate(${hue}deg) saturate(${sat.toFixed(2)})`

  return (
    <Canvas
      frames={frames}
      w={YOKAI_W}
      h={YOKAI_H}
      scale={scale}
      fps={fps}
      paused={still}
      className={`yokai-px fam-${kind} ${elite ? 'yokai-elite' : ''}`}
      flash={flash}
      filter={filter}
    />
  )
}
