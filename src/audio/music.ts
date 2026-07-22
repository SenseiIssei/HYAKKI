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

let dreadGain: GainNode | null = null

export function initMusic(context: Ctx, master: GainNode) {
  ctx = context
  bus = context.createGain()
  bus.gain.value = 0.0
  bus.connect(master)
  buildDread()
}

/**
 * THE DREAD — a low bed that curdles the deeper you go.
 *
 * Two sine tones a minor second apart, an octave below the root. At that
 * interval and that pitch they beat against each other a few times a second — a
 * slow, physical flutter you feel more than hear. Silent near the surface; it
 * rises with intensity, so descending literally sounds like descending.
 */
function buildDread() {
  if (!ctx || !bus) return
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 190
  filter.Q.value = 0.7
  dreadGain = ctx.createGain()
  dreadGain.gain.value = 0
  filter.connect(dreadGain).connect(bus)

  const lowRoot = ROOT / 2 // D2
  const semitone = Math.pow(2, 1 / 12)
  for (const [mult, det, lvl] of [
    [1, 0, 0.55],
    [1, 6, 0.35], // a hair sharp — a second, slower beat
    [semitone, -3, 0.45], // the minor second: the whole unease in one interval
  ]) {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = lowRoot * mult
    o.detune.value = det
    const og = ctx.createGain()
    og.gain.value = lvl
    o.connect(og).connect(filter)
    o.start()
  }

  // a very slow tremor on the cutoff, so the bed is never quite still
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.06
  const lg = ctx.createGain()
  lg.gain.value = 45
  lfo.connect(lg).connect(filter.frequency)
  lfo.start()
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
  // the dread rises with depth — silent up top, a pressure by the bottom
  if (dreadGain && ctx) {
    dreadGain.gain.setTargetAtTime(Math.pow(intensity, 1.5) * 0.16, ctx.currentTime, 3)
  }
}

/**
 * A whisper — breath shaped by a moving formant so it almost, never quite,
 * becomes a word. Only turns up deep in, and never on the beat.
 */
function whisper(when: number) {
  if (!ctx || !bus) return
  const buf = ctx.createBuffer(1, ctx.sampleRate * 1.6, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const s = ctx.createBufferSource()
  s.buffer = buf

  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = 22
  // sweep through two vowel-ish formants — the shape of almost-speech
  f.frequency.setValueAtTime(520, when)
  f.frequency.linearRampToValueAtTime(1100, when + 0.5)
  f.frequency.linearRampToValueAtTime(700, when + 1.1)

  const g = ctx.createGain()
  g.gain.setValueAtTime(0, when)
  g.gain.linearRampToValueAtTime(0.05, when + 0.3)
  g.gain.exponentialRampToValueAtTime(0.0001, when + 1.5)

  s.connect(f).connect(g).connect(bus)
  s.start(when)
  s.stop(when + 1.6)
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

    // koto phrases, sparse and hesitant — and more unsettled the deeper you are
    if (step % 4 === 0) {
      const r = Math.random()
      // the flat second (the creepy interval) gets more common with intensity
      const dissonate = 0.72 - intensity * 0.22
      if (r < 0.55) {
        const start = Math.floor(Math.random() * 5)
        koto(note(start), now, 0.2)
        if (Math.random() < 0.6) koto(note(start + 2), now + BEAT * 1.5, 0.14)
        if (Math.random() < 0.35) koto(note(start + 4), now + BEAT * 2.5, 0.1)
        // deep in, a second string sounds a semitone off it — a wrong note held
        if (intensity > 0.6 && Math.random() < 0.4) {
          koto(note(start) * Math.pow(2, 1 / 12), now + BEAT * 0.5, 0.09)
        }
      } else if (r < dissonate) {
        // the flat second, alone. It is the whole scale in one note.
        koto(note(1), now, 0.16)
      }
    }

    // breath, rarely, and never on the beat
    if (step % 16 === 7 && Math.random() < 0.7) {
      shakuhachi(note(Math.floor(Math.random() * 4)) * 2, now + BEAT * 0.3)
    }

    // ── the deep gets its own sounds ──
    // a whisper, only well down, off the beat
    if (intensity > 0.45 && step % 24 === 13 && Math.random() < 0.5 + intensity * 0.3) {
      whisper(now + BEAT * (0.2 + Math.random()))
    }
    // and, near the bottom, the great bell tolls under everything
    if (intensity > 0.75 && step % 64 === 31 && Math.random() < 0.6 && ctx && bus) {
      bonsho(bus, ctx, 0.1 + intensity * 0.08)
    }
  }, 520)
}

/** A struck bell that belongs to a temple rather than a clock. */
export function bonsho(master: GainNode, context: Ctx, gain = 0.25) {
  const t = context.currentTime
  const root = 82

  /**
   * A real bonshō rings in two voices that a generic struck-bell sample
   * flattens into one:
   *
   *  - the STRIKE TONE (tsuki-oto): a bright metallic clang the instant the
   *    beam lands, made of high inharmonic partials that die within a second;
   *  - the HUM TONE (oshi-oto): a low, almost pure drone that swells slightly
   *    AFTER the strike and rings for many seconds, with a slow beat from two
   *    near-identical partials fighting each other.
   *
   * The partial ratios below are inharmonic on purpose — a bell is not a
   * string, and the wrongness against the tempered scale is the sound.
   */

  // ── the hum: root plus a near-unison that beats about twice a second ──
  for (const [mult, lvl, det, dur] of [
    [1, 1.0, 0, 11],
    [1.0028, 0.85, 0, 11], // ~0.23 Hz beat against the root
    [2.0, 0.3, -4, 8],
  ] as const) {
    const o = context.createOscillator()
    o.type = 'sine'
    o.frequency.value = root * mult
    o.detune.value = det
    const g = context.createGain()
    g.gain.setValueAtTime(0, t)
    // the hum swells in over ~120ms — it arrives just behind the strike
    g.gain.linearRampToValueAtTime(gain * lvl, t + 0.12)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(master)
    o.start(t)
    o.stop(t + dur + 0.2)
  }

  // ── the strike: bright inharmonic partials, gone within a second ──
  for (const [mult, lvl, det] of [
    [2.71, 0.34, 5],
    [5.42, 0.2, -7],
    [8.98, 0.12, 11],
    [13.4, 0.06, -13],
  ] as const) {
    const o = context.createOscillator()
    o.type = 'sine'
    o.frequency.value = root * mult
    o.detune.value = det
    const g = context.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain * lvl, t + 0.003)
    // the higher the partial, the faster it dies — that is the clang decaying
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4 / Math.sqrt(mult))
    o.connect(g).connect(master)
    o.start(t)
    o.stop(t + 1.6)
  }
}
