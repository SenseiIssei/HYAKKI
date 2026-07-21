/**
 * Generates the application icons. Nothing in HYAKKI ships as an art asset, and
 * the icon is not going to be the exception — this rasterises a King's sigil
 * (symmetry 12, layered rings) straight to PNG with zlib, no dependencies.
 *
 *   node scripts/make-icons.mjs
 */
import fs from 'node:fs'
import zlib from 'node:zlib'

const SUMI = [0x0a, 0x09, 0x08]
const WASHI = [0xe4, 0xdc, 0xcb]
const KIN = [0xb8, 0x91, 0x2f]

function draw(size, { symmetry = 12, rings = 3, gold = true } = {}) {
  const px = Buffer.alloc(size * size * 4)
  const c = size / 2
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    const inv = 1 - a / 255
    px[i] = px[i] * inv + r * (a / 255)
    px[i + 1] = px[i + 1] * inv + g * (a / 255)
    px[i + 2] = px[i + 2] * inv + b * (a / 255)
    px[i + 3] = 255
  }

  // ink field
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) set(x, y, SUMI)
  }

  const stroke = Math.max(1, size / 42)
  const line = (x0, y0, x1, y1, col, w) => {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const x = x0 + (x1 - x0) * t
      const y = y0 + (y1 - y0) * t
      const rad = w / 2
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          const d = Math.hypot(dx, dy)
          if (d <= rad) set(Math.round(x + dx), Math.round(y + dy), col, 255 * (1 - d / rad) ** 0.6)
        }
      }
    }
  }
  const ring = (radius, col, w) => {
    const steps = Math.ceil(radius * 12)
    for (let s = 0; s < steps; s++) {
      const a = (s / steps) * Math.PI * 2
      line(
        c + Math.cos(a) * radius,
        c + Math.sin(a) * radius,
        c + Math.cos(a + 0.02) * radius,
        c + Math.sin(a + 0.02) * radius,
        col,
        w,
      )
    }
  }

  ring(size * 0.44, gold ? KIN : WASHI, stroke * 0.8)

  // radial marks, rotate-copied — symmetry is what the eye reads as intent
  for (let r = 1; r <= rings; r++) {
    const rad = size * (0.14 + 0.1 * r)
    for (let k = 0; k < symmetry; k++) {
      const a = (k / symmetry) * Math.PI * 2 + r * 0.09
      line(
        c + Math.cos(a) * rad * 0.55,
        c + Math.sin(a) * rad * 0.55,
        c + Math.cos(a) * rad,
        c + Math.sin(a) * rad,
        WASHI,
        stroke,
      )
    }
    if (r < rings) ring(rad, WASHI, stroke * 0.5)
  }

  // the core
  const coreR = size * 0.075
  for (let y = -coreR; y <= coreR; y++) {
    for (let x = -coreR; x <= coreR; x++) {
      if (Math.hypot(x, y) <= coreR) set(Math.round(c + x), Math.round(c + y), gold ? KIN : WASHI)
    }
  }
  return px
}

function png(size, px) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body) >>> 0)
    return Buffer.concat([len, body, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

let table = null
function crc32(buf) {
  if (!table) {
    table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c
    }
  }
  let crc = -1
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
  return crc ^ -1
}

fs.mkdirSync('src-tauri/icons', { recursive: true })

for (const size of [32, 128, 256, 512, 1024]) {
  fs.writeFileSync(`src-tauri/icons/${size}x${size}.png`, png(size, draw(size)))
}
fs.copyFileSync('src-tauri/icons/128x128.png', 'src-tauri/icons/128x128@2x.png')
fs.copyFileSync('src-tauri/icons/512x512.png', 'src-tauri/icons/icon.png')

// tray: the same mark, simpler, so it survives 16px
fs.writeFileSync(
  'src-tauri/icons/tray.png',
  png(64, draw(64, { symmetry: 3, rings: 1, gold: false })),
)

// .ico — a bare single-image ICO wrapping the 256px PNG
{
  const p = fs.readFileSync('src-tauri/icons/256x256.png')
  const head = Buffer.alloc(22)
  head.writeUInt16LE(0, 0)
  head.writeUInt16LE(1, 2)
  head.writeUInt16LE(1, 4)
  head[6] = 0 // 0 means 256
  head[7] = 0
  head[8] = 0
  head[9] = 0
  head.writeUInt16LE(1, 10)
  head.writeUInt16LE(32, 12)
  head.writeUInt32LE(p.length, 14)
  head.writeUInt32LE(22, 18)
  fs.writeFileSync('src-tauri/icons/icon.ico', Buffer.concat([head, p]))
}

console.log('icons written to src-tauri/icons/')
