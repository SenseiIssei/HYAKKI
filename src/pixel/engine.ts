/**
 * The pixel engine.
 *
 * Sprites are authored as CHARACTER GRIDS — one character per pixel, mapped
 * through a palette. That is how pixel art is actually made: you place every
 * pixel. The previous SVG-path approach produced diagrams of people rather than
 * people, because paths describe outlines and pixel art describes *surfaces*.
 *
 * Frames are composed from authored parts at per-frame offsets, so a six-frame
 * walk cycle across five gear tiers does not mean authoring thirty sprites.
 */

export type Grid = string[]

/** index 0 is always transparent */
export type Palette = Record<string, string>

export type Sprite = {
  w: number
  h: number
  /** row-major, '' = transparent */
  px: string[]
}

/** Turn an authored grid into a sprite. Leading/trailing blank lines are dropped. */
export function sprite(grid: Grid): Sprite {
  const rows = grid.filter((r) => r.length > 0)
  const w = Math.max(...rows.map((r) => r.length))
  const px: string[] = []
  for (const row of rows) {
    for (let x = 0; x < w; x++) {
      const c = row[x] ?? '.'
      px.push(c === '.' || c === ' ' ? '' : c)
    }
  }
  return { w, h: rows.length, px }
}

export function blank(w: number, h: number): Sprite {
  return { w, h, px: new Array(w * h).fill('') }
}

export type BlitOpts = {
  /** mirror horizontally */
  flip?: boolean
  /** shift rows progressively — cheap lean/shear, in px per row from the bottom */
  shear?: number
  /** remap palette keys, for shading a limb darker when it is behind */
  remap?: Record<string, string>
  /** replace every non-empty pixel with this key */
  tint?: string
}

export function blit(dst: Sprite, src: Sprite, ox: number, oy: number, o: BlitOpts = {}) {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      let c = src.px[y * src.w + (o.flip ? src.w - 1 - x : x)]
      if (!c) continue
      if (o.remap && o.remap[c]) c = o.remap[c]
      if (o.tint) c = o.tint
      const shift = o.shear ? Math.round(((src.h - y) / src.h) * o.shear) : 0
      const dx = ox + x + shift
      const dy = oy + y
      if (dx < 0 || dy < 0 || dx >= dst.w || dy >= dst.h) continue
      dst.px[dy * dst.w + dx] = c
    }
  }
}

/**
 * Wrap every silhouette edge in a dark outline. This single step is most of
 * what makes pixel art read at small sizes — it separates the figure from the
 * background no matter what is behind it.
 */
export function outline(s: Sprite, key = 'K'): Sprite {
  const out: Sprite = { w: s.w, h: s.h, px: [...s.px] }
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= s.w || y >= s.h ? '' : s.px[y * s.w + x]
  for (let y = 0; y < s.h; y++) {
    for (let x = 0; x < s.w; x++) {
      if (at(x, y)) continue
      if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) {
        out.px[y * s.w + x] = key
      }
    }
  }
  return out
}

/** Render to a canvas at an integer scale, nearest-neighbour. */
export function draw(
  ctx: CanvasRenderingContext2D,
  s: Sprite,
  pal: Palette,
  scale: number,
  ox = 0,
  oy = 0,
) {
  for (let y = 0; y < s.h; y++) {
    for (let x = 0; x < s.w; x++) {
      const c = s.px[y * s.w + x]
      if (!c) continue
      const col = pal[c]
      if (!col) continue
      ctx.fillStyle = col
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale)
    }
  }
}

/** A cheap deterministic hash, for per-instance variation. */
export function vary(seed: number, n: number): number {
  let h = (seed ^ 0x9e3779b9) >>> 0
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  return (h >>> 0) % n
}
