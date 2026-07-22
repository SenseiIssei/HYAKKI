/**
 * Audio. Drone, bell, breath. Almost no melody.
 *
 * Every sound is SYNTHESISED at runtime — there are no audio files, for the
 * same reason there are no image files. docs/00-VISION.md § pillar 4.
 *
 * The mix is deliberately sparse and quiet. An idle game runs for hours; the
 * fastest way to make someone mute it forever is to put a sound on every hit at
 * full volume. Hits are rate-limited and sit under the drone.
 */

import { bonsho, initMusic, setIntensity, setMusicEnabled, setMusicRegion } from './music'

type Ctx = AudioContext & { _unlocked?: boolean }

let ctx: Ctx | null = null
let master: GainNode | null = null
let droneGain: GainNode | null = null
let enabled = false
let volume = 0.35

const now = () => (ctx ? ctx.currentTime : 0)

/** Browsers refuse to start audio without a gesture, so this is called on one. */
export function startAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume()
    return
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  ctx = new AC() as Ctx

  master = ctx.createGain()
  master.gain.value = enabled ? volume : 0
  master.connect(ctx.destination)

  // A parallel tap on the master bus. It drives the level meter in Settings,
  // and it is the only way to actually verify sound is being produced rather
  // than merely that nothing threw.
  analyser = ctx.createAnalyser()
  analyser.fftSize = 512
  master.connect(analyser)
  meter = new Float32Array(new ArrayBuffer(analyser.fftSize * 4))

  buildDrone()
  initMusic(ctx, master)
  setMusicEnabled(enabled && musicOn)
}

let musicOn = true
export function setMusicWanted(on: boolean) {
  musicOn = on
  setMusicEnabled(enabled && on)
}
/** 0..1 — how deep and how defiled; the drum walks closer. */
export const setMusicIntensity = setIntensity

let analyser: AnalyserNode | null = null
let meter: Float32Array<ArrayBuffer> | null = null

/** Root-mean-square of the master bus, 0..1. */
export function audioLevel(): number {
  if (!analyser || !meter) return 0
  analyser.getFloatTimeDomainData(meter)
  let sum = 0
  for (let i = 0; i < meter.length; i++) sum += meter[i] * meter[i]
  return Math.sqrt(sum / meter.length)
}

export function setAudioEnabled(on: boolean) {
  enabled = on
  if (master && ctx) master.gain.setTargetAtTime(on ? volume : 0, now(), 0.2)
  if (on) startAudio()
  setMusicEnabled(on && musicOn)
}

export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v))
  if (master && ctx && enabled) master.gain.setTargetAtTime(volume, now(), 0.1)
}

export const audioReady = () => ctx !== null

// ── the bed ────────────────────────────────────────────────────────────

/** A low, slightly detuned drone. It is meant to be noticed only when it stops. */
function buildDrone() {
  if (!ctx || !master) return
  droneGain = ctx.createGain()
  droneGain.gain.value = 0.055
  droneGain.connect(master)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 320
  filter.Q.value = 0.6
  filter.connect(droneGain)

  for (const [freq, detune] of [
    [55, 0],
    [55, 7],
    [82.5, -5],
  ]) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.detune.value = detune
    const g = ctx.createGain()
    g.gain.value = 0.5
    osc.connect(g).connect(filter)
    osc.start()
  }

  // a very slow breath, so it never sits perfectly still
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.045
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 90
  lfo.connect(lfoGain).connect(filter.frequency)
  lfo.start()
}

/** Deeper and quieter while a Stand is running. */
export function setTension(on: boolean) {
  if (!droneGain || !ctx) return
  droneGain.gain.setTargetAtTime(on ? 0.09 : 0.055, now(), 1.5)
}

// ── ambience: the sound of where you are ────────────────────────────────
//
// A single looping band of filtered noise whose colour is the region. It is
// built lazily the first time a region is entered, and cross-faded between
// regions rather than restarted, so travelling never clicks or drops to silence.

type AmbienceVoice = {
  gain: GainNode
  filter: BiquadFilterNode
  src: AudioBufferSourceNode
  lfo: OscillatorNode
}
let ambience: AmbienceVoice | null = null
let ambienceRegion = ''

/** Per-region character: filter shape, movement, and how loud it sits. */
const AMBIENCE: Record<string, { type: BiquadFilterType; freq: number; q: number; lfo: number; depth: number; gain: number }> = {
  // wind through bamboo: airy, high, always moving
  bamboo: { type: 'bandpass', freq: 1400, q: 0.7, lfo: 0.13, depth: 600, gain: 0.05 },
  // an emptied village at night: low wind under wide eaves
  village: { type: 'lowpass', freq: 500, q: 0.5, lfo: 0.07, depth: 220, gain: 0.045 },
  // a shut shrine: still air, a faint high ring
  shrine: { type: 'bandpass', freq: 2200, q: 1.4, lfo: 0.05, depth: 300, gain: 0.03 },
  // the river of three crossings: broadband water
  sanzu: { type: 'bandpass', freq: 900, q: 0.4, lfo: 0.6, depth: 500, gain: 0.06 },
  // the hot hells: a low furnace rumble
  jigoku: { type: 'lowpass', freq: 240, q: 0.8, lfo: 0.2, depth: 120, gain: 0.07 },
  // muken, the deepest: almost nothing, a pressure
  muken: { type: 'lowpass', freq: 120, q: 0.9, lfo: 0.03, depth: 60, gain: 0.04 },
  // drowned paddies: low water and a wet, croaking swell
  paddies: { type: 'lowpass', freq: 620, q: 0.6, lfo: 0.9, depth: 260, gain: 0.055 },
  // the night market: too many voices for how empty it is — a crowded midrange
  market: { type: 'bandpass', freq: 1000, q: 0.5, lfo: 0.35, depth: 420, gain: 0.055 },
  // the snow country: a white-out hiss, thin and high, barely moving
  snow: { type: 'highpass', freq: 3200, q: 0.5, lfo: 0.04, depth: 200, gain: 0.04 },
  // the sea of trees: no wind, no birds — a dead, close band
  aokigahara: { type: 'bandpass', freq: 300, q: 1.6, lfo: 0.02, depth: 60, gain: 0.05 },
  // the hundred-bridge marsh: fog over water, a broad low wash
  bridges: { type: 'bandpass', freq: 700, q: 0.4, lfo: 0.5, depth: 360, gain: 0.06 },
  // the iron wastes: cooling metal, a dull scraping rumble
  iron: { type: 'lowpass', freq: 340, q: 1.1, lfo: 0.15, depth: 140, gain: 0.06 },
}

function ambienceLoop(): AudioBufferSourceNode | null {
  if (!ctx) return null
  // two seconds of noise, looped — long enough not to hear the seam
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  return src
}

/**
 * Move the ambience to a region. Cross-fades the filter and level rather than
 * tearing down the noise source, so the bed is continuous as you travel.
 */
export function setAmbience(regionId: string) {
  if (!ctx || !master || regionId === ambienceRegion) return
  ambienceRegion = regionId
  // the music changes mode with the place, in the same breath as the ambience
  setMusicRegion(regionId)
  const cfg = AMBIENCE[regionId] ?? AMBIENCE.bamboo
  const t = now()

  if (!ambience) {
    const src = ambienceLoop()
    if (!src) return
    const filter = ctx.createBiquadFilter()
    filter.type = cfg.type
    filter.frequency.value = cfg.freq
    filter.Q.value = cfg.q
    const gain = ctx.createGain()
    gain.gain.value = 0
    src.connect(filter).connect(gain).connect(master)
    // a slow wander on the cutoff, so the wind never sits still
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = cfg.lfo
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = cfg.depth
    lfo.connect(lfoGain).connect(filter.frequency)
    src.start()
    lfo.start()
    ambience = { gain, filter, src, lfo }
  }

  const a = ambience
  a.filter.type = cfg.type
  a.filter.frequency.setTargetAtTime(cfg.freq, t, 2)
  a.filter.Q.setTargetAtTime(cfg.q, t, 2)
  a.lfo.frequency.setTargetAtTime(cfg.lfo, t, 2)
  a.gain.gain.setTargetAtTime(enabled ? cfg.gain : 0, t, 2.5)
}

// ── one-shots ──────────────────────────────────────────────────────────

let noiseBuffer: AudioBuffer | null = null
function noise(): AudioBufferSourceNode | null {
  if (!ctx) return null
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate)
    const d = noiseBuffer.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  return src
}

function env(node: AudioNode, peak: number, attack: number, decay: number) {
  if (!ctx || !master) return null
  const g = ctx.createGain()
  const t = now()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  node.connect(g).connect(master)
  return g
}

let lastHit = 0
/** Rate-limited: at high attack speed this fires many times a second. */
/** `weight` shifts the hit by weapon class: 'light' rings high, 'heavy' thuds. */
export function sfxHit(crit = false, weight: 'light' | 'balanced' | 'heavy' = 'balanced') {
  if (!ctx || !enabled) return
  const t = now()
  if (t - lastHit < 0.07) return
  lastHit = t

  const pitch = weight === 'light' ? 1.4 : weight === 'heavy' ? 0.62 : 1
  const src = noise()
  if (!src) return
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = (crit ? 1800 : 900) * pitch
  filter.Q.value = crit ? 2.4 : 1.1
  src.connect(filter)
  env(filter, crit ? 0.16 : 0.075, 0.001, crit ? 0.14 : 0.06)
  src.start()
  src.stop(t + 0.3)

  // a heavy weapon also drops a low body thump under the strike
  if (weight === 'heavy') {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, t)
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.14)
    env(osc, crit ? 0.12 : 0.07, 0.001, 0.16)
    osc.start(t)
    osc.stop(t + 0.4)
  }
}

export function sfxTaken() {
  if (!ctx || !enabled) return
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  const t = now()
  osc.frequency.setValueAtTime(180, t)
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.18)
  env(osc, 0.11, 0.002, 0.18)
  osc.start()
  osc.stop(t + 0.4)
}

/** A struck bell: a few inharmonic partials, fast attack, long tail. */
export function sfxBell(base = 440, gain = 0.13, decay = 2.6) {
  if (!ctx || !enabled) return
  const t = now()
  for (const [mult, level] of [
    [1, 1],
    [2.76, 0.5],
    [5.4, 0.25],
    [8.9, 0.12],
  ]) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = base * mult
    env(osc, gain * level, 0.002, decay * (1 / mult) * 1.6)
    osc.start()
    osc.stop(t + decay + 0.2)
  }
}

/**
 * A hearing begins. The drone CUTS first — nothing in the mix is more
 * frightening than its sudden absence — and the temple bell lands in the gap.
 * docs/hyakki/04-HORROR.md § rule 3
 */
export function sfxStand() {
  if (!ctx || !master || !enabled) return
  const t = now()
  if (droneGain) {
    droneGain.gain.cancelScheduledValues(t)
    droneGain.gain.setValueAtTime(droneGain.gain.value, t)
    droneGain.gain.linearRampToValueAtTime(0.0001, t + 0.12)
    droneGain.gain.setValueAtTime(0.0001, t + 0.8)
    droneGain.gain.linearRampToValueAtTime(0.09, t + 2.2)
  }
  window.setTimeout(() => {
    if (ctx && master && enabled) bonsho(master, ctx, 0.26)
  }, 780)
}

export function sfxSignature() {
  if (!ctx || !enabled) return
  const src = noise()
  if (!src) return
  const t = now()
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 3
  filter.frequency.setValueAtTime(300, t)
  filter.frequency.exponentialRampToValueAtTime(2600, t + 0.5)
  src.connect(filter)
  env(filter, 0.1, 0.18, 0.45)
  src.start()
  src.stop(t + 1)
}

export function sfxDeath() {
  if (!ctx || !master || !enabled) return
  bonsho(master, ctx, 0.3)
  setTension(false)
}

/**
 * An art going off. A bright rising sweep with a body thump under it, scaled by
 * tier so a tier-3 catastrophe lands heavier and lower than a tier-1 flourish.
 */
export function sfxAbility(tier = 1) {
  if (!ctx || !master || !enabled) return
  const t = now()
  const gain = 0.1 + tier * 0.05

  // the sweep — the blade / the fire / the bolt
  const src = noise()
  if (src) {
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 2.2
    bp.frequency.setValueAtTime(400, t)
    bp.frequency.exponentialRampToValueAtTime(700 + tier * 1600, t + 0.18)
    src.connect(bp)
    env(bp, gain, 0.012, 0.3 + tier * 0.12)
    src.start()
    src.stop(t + 1)
  }

  // the body thump — deeper and louder with tier
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180 - tier * 24, t)
  osc.frequency.exponentialRampToValueAtTime(46 - tier * 6, t + 0.22)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.16 + tier * 0.07, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5 + tier * 0.2)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + 1)

  // a tier-3 art tolls the bell under everything
  if (tier >= 3) bonsho(master, ctx, 0.16)
}

/** The great bell, on its own, for the moment the counting ends. */
export function sfxBonsho(gain = 0.32) {
  if (!ctx || !master || !enabled) return
  bonsho(master, ctx, gain)
}

/** Stone on stone, at the riverbed. */
export function sfxStone() {
  if (!ctx || !enabled) return
  const src = noise()
  if (!src) return
  const t = now()
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 2400 + Math.random() * 900
  f.Q.value = 6
  src.connect(f)
  env(f, 0.1, 0.001, 0.07)
  src.start()
  src.stop(t + 0.2)
}

/** The oni's club coming down. */
export function sfxHeavy() {
  if (!ctx || !enabled) return
  const t = now()
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(90, t)
  o.frequency.exponentialRampToValueAtTime(36, t + 0.3)
  env(o, 0.16, 0.002, 0.32)
  o.start()
  o.stop(t + 0.5)
}

export function sfxReveille() {
  sfxBell(523, 0.14, 2.2)
  window.setTimeout(() => sfxBell(659, 0.1, 2), 260)
}

export function sfxRank() {
  if (!ctx || !enabled) return
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = 1200
  env(osc, 0.022, 0.001, 0.04)
  osc.start()
  osc.stop(now() + 0.1)
}

export function sfxRelic() {
  sfxBell(880, 0.09, 1.8)
}
