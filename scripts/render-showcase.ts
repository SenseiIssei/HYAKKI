/**
 * Renders showcase art for the README straight from the game's own sprite
 * engine — the exact pixels the game draws, no mock-ups. Sprites are plain
 * character grids ({ w, h, px }) mapped through a palette, so this needs no
 * canvas: it walks the grid into an RGBA buffer and encodes a PNG with Node's
 * built-in zlib.
 *
 *   npx tsx scripts/render-showcase.ts
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { SPECIES_BY_ID } from '../src/pixel/species'
import { YOKAI_PAL, yokaiFrame } from '../src/pixel/yokai'
import { walkerFrame, WALKER_PAL } from '../src/pixel/walker'
import type { Sprite } from '../src/pixel/engine'
import type { Look } from '../src/render/figure'

const INK = [10, 9, 8, 255] as const // #0a0908

type RGBA = [number, number, number, number]
function hexToRgba(hex: string): RGBA {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255]
}

/** A simple RGBA canvas we blit scaled sprites onto. */
class Buf {
  w: number
  h: number
  data: Uint8Array
  constructor(w: number, h: number, bg: readonly number[]) {
    this.w = w
    this.h = h
    this.data = new Uint8Array(w * h * 4)
    for (let i = 0; i < w * h; i++) this.data.set(bg, i * 4)
  }
  set(x: number, y: number, c: RGBA) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    this.data.set(c, (y * this.w + x) * 4)
  }
  blitSprite(s: Sprite, pal: Record<string, string>, ox: number, oy: number, scale: number) {
    const cache: Record<string, RGBA> = {}
    for (let y = 0; y < s.h; y++) {
      for (let x = 0; x < s.w; x++) {
        const key = s.px[y * s.w + x]
        if (!key) continue
        const hex = pal[key]
        if (!hex) continue
        const c = (cache[key] ??= hexToRgba(hex))
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++) this.set(ox + x * scale + dx, oy + y * scale + dy, c)
      }
    }
  }
}

// ── minimal PNG encoder (truecolour + alpha) ──
const CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type: string, data: Uint8Array): Uint8Array {
  const len = data.length
  const out = new Uint8Array(12 + len)
  const dv = new DataView(out.buffer)
  dv.setUint32(0, len)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  const crcInput = out.subarray(4, 8 + len)
  dv.setUint32(8 + len, crc32(crcInput))
  return out
}
function encodePng(buf: Buf): Uint8Array {
  const { w, h, data } = buf
  // raw scanlines, each prefixed with a 0 (no) filter byte
  const raw = new Uint8Array(h * (w * 4 + 1))
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    raw.set(data.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1)
  }
  const idat = deflateSync(raw, { level: 9 })
  const ihdr = new Uint8Array(13)
  const dv = new DataView(ihdr.buffer)
  dv.setUint32(0, w)
  dv.setUint32(4, h)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  const parts = [sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', new Uint8Array(0))]
  const total = parts.reduce((a, p) => a + p.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

mkdirSync('.github/assets', { recursive: true })

// ── 1. the bestiary strip ──
{
  const SC = 6
  const cast = ['kozo', 'karakasa', 'oni', 'gashadokuro', 'onryo', 'yukionna', 'ushioni', 'mu'].map(
    (id) => SPECIES_BY_ID[id],
  )
  const CELL = 44 * SC + 18
  const buf = new Buf(cast.length * CELL + 18, 48 * SC + 18, INK)
  cast.forEach((sp, i) => buf.blitSprite(sp.build(4242, 0.25), YOKAI_PAL, 18 + i * CELL, 9, SC))
  // one King on the end feels right but keeps the strip tidy at 8; leave as is
  writeFileSync('.github/assets/bestiary.png', encodePng(buf))
  console.log('bestiary.png', buf.w, 'x', buf.h)
}

// ── 2. the walker, four gear tiers ──
{
  const SC = 7
  const looks: Look[] = [
    { weapon: 1, armour: 1, head: 1, gait: 0.9, aura: 0.1, kegare: 0 },
    { weapon: 3, armour: 2, head: 3, gait: 0.7, aura: 0.4, kegare: 0.2 },
    { weapon: 4, armour: 4, head: 4, gait: 0.6, aura: 0.7, kegare: 0.5 },
    { weapon: 5, armour: 5, head: 5, gait: 0.5, aura: 0.95, kegare: 0.85 },
  ]
  const CELL = 40 * SC + 30
  const buf = new Buf(looks.length * CELL + 24, 52 * SC + 24, INK)
  looks.forEach((lk, i) => {
    const s = walkerFrame(lk, 0.25, 'strike')
    buf.blitSprite(s, WALKER_PAL, 24 + i * CELL, 12, SC)
  })
  writeFileSync('.github/assets/walker-progression.png', encodePng(buf))
  console.log('walker-progression.png', buf.w, 'x', buf.h)
}

// ── 3. a King, large, for the roadmap section ──
{
  const SC = 8
  const s = yokaiFrame('warden', 7, 0, 1)
  const buf = new Buf(s.w * SC + 32, s.h * SC + 32, INK)
  buf.blitSprite(s, YOKAI_PAL, 16, 16, SC)
  writeFileSync('.github/assets/king.png', encodePng(buf))
  console.log('king.png', buf.w, 'x', buf.h)
}
