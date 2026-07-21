import { useEffect, useMemo, useRef } from 'react'
import { draw, type Palette, type Sprite } from '../pixel/engine'
import { WALKER_H, WALKER_PAL, WALKER_W, WALK_FRAMES, walkerFrame } from '../pixel/walker'
import { YOKAI_H, YOKAI_PAL, YOKAI_W, yokaiFrame, type YokaiKind } from '../pixel/yokai'
import { lookFrom } from '../render/figure'
import type { Enemy, StatBlock } from '../sim/types'

/**
 * Renders pixel sprites to a canvas at an integer scale, nearest-neighbour.
 *
 * Frames are PRE-RENDERED once per look and then swapped on a timer — so the
 * per-frame cost is one `drawImage`, not a few thousand `fillRect`s, and the
 * animation keeps running on a `setInterval` rather than rAF (which is
 * suspended in a hidden window).
 */
function useFrames(build: (i: number) => Sprite, count: number, pal: Palette, scale: number) {
  return useMemo(() => {
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
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build, count, scale])
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
}: {
  frames: HTMLCanvasElement[]
  w: number
  h: number
  scale: number
  fps: number
  paused?: boolean
  className?: string
  flash?: boolean
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
      className={`pixel ${flash ? 'pixel-flash' : ''} ${className ?? ''}`}
      aria-hidden="true"
    />
  )
}

export function PixelWalker({
  stats,
  pose = 'walk',
  flash,
  scale = 5,
}: {
  stats: StatBlock
  pose?: 'walk' | 'strike' | 'brace' | 'hit'
  flash?: boolean
  scale?: number
}) {
  const look = useMemo(() => lookFrom(stats), [stats])
  const build = useMemo(
    () => (i: number) => walkerFrame(look, i / WALK_FRAMES, pose),
    [look, pose],
  )
  const frames = useFrames(build, WALK_FRAMES, WALKER_PAL, scale)
  // faster gait -> faster cycle, which is the whole point of the stat
  const fps = Math.round(WALK_FRAMES / Math.max(0.3, look.gait))
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
  const seed = enemy.seed >>> 0
  const build = useMemo(
    () => (i: number) => yokaiFrame(kind, seed, i / 8),
    [kind, seed],
  )
  const frames = useFrames(build, 8, YOKAI_PAL, scale)
  // the Kings do not move, and a hole does not move
  const still = kind === 'warden' || kind === 'nothing'
  const fps = kind === 'chaff' ? 12 : kind === 'organs' ? 6 : 4
  return (
    <Canvas
      frames={frames}
      w={YOKAI_W}
      h={YOKAI_H}
      scale={scale}
      fps={fps}
      paused={still}
      className={`yokai-px fam-${kind}`}
      flash={flash}
    />
  )
}
