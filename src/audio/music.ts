/**
 * Music. Generative, synthesised, no files.
 *
 * Built on the **in scale** (陰音階) — the dark Japanese pentatonic: root, flat
 * second, fourth, fifth, flat sixth. That flat second is the whole sound; it is
 * why a koto reads as Japanese rather than merely Asian.
 *
 * Three voices, all sparse:
 *   koto        plucked string, the melody, deliberately hesitant
 *   taiko       a drum pulse that gets closer as you go deeper
 *   shakuhachi  breath through a filter, almost no pitch
 *
 * Nothing is on a grid tighter than a half-second. An idle game runs for hours;
 * a busy loop would be unbearable by minute ten.
 */

type Ctx = AudioContext

let ctx: Ctx | null = null
let bus: GainNode | null = null
let timer: number | null = null
let step = 0
let intensity = 0
let enabled = false

/** in scale on D, two octaves */
const IN_SCALE = [0, 1, 5, 7, 8, 12, 13, 17, 19, 20, 24]
const ROOT = 146.83 // D3
const note = (deg: number) => ROOT * Math.pow(2, IN_SCALE[deg % IN_SCALE.length] / 12)

export function initMusic(context: Ctx, master: GainNode) {
  ctx = context
  bus = context.createGain()
  bus.gain.value = 0.0
  bus.connect(master)
}

export function setMusicEnabled(on: boolean) {
  enabled = on
  if (!ctx || !bus) return
  bus.gain.setTargetAtTime(on ? 0.55 : 0, ctx.currentTime, 0.6)
  if (on && timer === null) run()
  if (!on && timer !== null) {
    window.clearInterval(timer)
    timer = null
  }
}

/** 0..1 — how deep, how defiled, how close the drum is. */
export function setIntensity(v: number) {
  intensity = Math.max(0, Math.min(1, v))
}

// ── voices ─────────────────────────────────────────────────────────────

/**
 * A plucked string. Karplus-Strong would be more authentic but needs a
 * ScriptProcessor; this is two detuned triangles through a fast-closing filter,
 * which gets most of the way there and costs nothing.
 */
function koto(freq: number, when: number, gain = 0.18) {
  if (!ctx || !bus) return
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, when)
  g.gain.linearRampToValueAtTime(gain, when + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, when + 2.4)

  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.setValueAtTime(3400, when)
  f.frequency.exponentialRampToValueAtTime(520, when + 1.1)
  f.Q.value = 1.4

  for (const [mult, det, lvl] of [
    [1, 0, 1],
    [1, 7, 0.5],
    [2.01, -4, 0.22],
    [3.02, 3, 0.09],
  ]) {
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = freq * mult
    o.detune.value = det
    const og = ctx.createGain()
    og.gain.value = lvl
    o.connect(og).connect(f)
    o.start(when)
    o.stop(when + 2.6)
  }
  // the nail on the string
  const n = ctx.createOscillator()
  n.type = 'square'
  n.frequency.value = freq * 4
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(0.05, when)
  ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.05)
  n.connect(ng).connect(f)
  n.start(when)
  n.stop(when + 0.08)

  f.connect(g).connect(bus)
}

/** A drum with a skin on it. */
function taiko(when: number, gain = 0.3) {
  if (!ctx || !bus) return
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(150, when)
  o.frequency.exponentialRampToValueAtTime(46, when + 0.22)
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, when)
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.5)
  o.connect(g).connect(bus)
  o.start(when)
  o.stop(when + 0.6)

  // the stick
  const buf = ctx.createBuffer(1, 2048, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const s = ctx.createBufferSource()
  s.buffer = buf
  const sg = ctx.createGain()
  sg.gain.value = gain * 0.35
  const sf = ctx.createBiquadFilter()
  sf.type = 'bandpass'
  sf.frequency.value = 1100
  s.connect(sf).connect(sg).connect(bus)
  s.start(when)
}

/** Breath, with barely any note in it. */
function shakuhachi(freq: number, when: number) {
  if (!ctx || !bus) return
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const s = ctx.createBufferSource()
  s.buffer = buf

  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.setValueAtTime(freq, when)
  f.frequency.linearRampToValueAtTime(freq * 1.02, when + 1.6)
  f.Q.value = 14

  const g = ctx.createGain()
  g.gain.setValueAtTime(0, when)
  g.gain.linearRampToValueAtTime(0.14, when + 0.42)
  g.gain.linearRampToValueAtTime(0.1, when + 1.1)
  g.gain.exponentialRampToValueAtTime(0.0001, when + 1.9)

  s.connect(f).connect(g).connect(bus)
  s.start(when)
  s.stop(when + 2)
}

// ── the sequencer ──────────────────────────────────────────────────────

/**
 * Deliberately not a loop. Phrases are chosen by weighted chance each bar, so
 * it never settles into something you can hum — which is what makes ambient
 * music survive a three-hour session.
 */
function run() {
  if (!ctx) return
  const BEAT = 0.52

  timer = window.setInterval(() => {
    if (!ctx || !enabled) return
    const now = ctx.currentTime + 0.05
    step++

    // the drum walks closer the deeper you are
    const drumEvery = intensity > 0.66 ? 2 : intensity > 0.33 ? 4 : 8
    if (step % drumEvery === 0) taiko(now, 0.16 + intensity * 0.26)
    if (intensity > 0.8 && step % drumEvery === 1) taiko(now + BEAT * 0.5, 0.1)

    // koto phrases, sparse and hesitant
    if (step % 4 === 0) {
      const r = Math.random()
      if (r < 0.55) {
        const start = Math.floor(Math.random() * 5)
        koto(note(start), now, 0.2)
        if (Math.random() < 0.6) koto(note(start + 2), now + BEAT * 1.5, 0.14)
        if (Math.random() < 0.35) koto(note(start + 4), now + BEAT * 2.5, 0.1)
      } else if (r < 0.72) {
        // the flat second, alone. It is the whole scale in one note.
        koto(note(1), now, 0.16)
      }
    }

    // breath, rarely, and never on the beat
    if (step % 16 === 7 && Math.random() < 0.7) {
      shakuhachi(note(Math.floor(Math.random() * 4)) * 2, now + BEAT * 0.3)
    }
  }, 520)
}

/** A struck bell that belongs to a temple rather than a clock. */
export function bonsho(master: GainNode, context: Ctx, gain = 0.25) {
  const t = context.currentTime
  // a real bonshō is inharmonic and beats against itself
  for (const [mult, lvl, det] of [
    [1, 1, 0],
    [1.004, 0.9, 0], // the beat
    [2.74, 0.42, 4],
    [5.38, 0.2, -6],
    [8.9, 0.09, 9],
  ]) {
    const o = context.createOscillator()
    o.type = 'sine'
    o.frequency.value = 82 * mult
    o.detune.value = det
    const g = context.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain * lvl, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 7 / mult)
    o.connect(g).connect(master)
    o.start(t)
    o.stop(t + 8)
  }
}
