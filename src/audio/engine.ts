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
}

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
export function sfxHit(crit = false) {
  if (!ctx || !enabled) return
  const t = now()
  if (t - lastHit < 0.07) return
  lastHit = t

  const src = noise()
  if (!src) return
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = crit ? 1800 : 900
  filter.Q.value = crit ? 2.4 : 1.1
  src.connect(filter)
  env(filter, crit ? 0.16 : 0.075, 0.001, crit ? 0.14 : 0.06)
  src.start()
  src.stop(t + 0.3)
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

export function sfxStand() {
  sfxBell(330, 0.16, 3.2)
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
  if (!ctx || !enabled) return
  sfxBell(146, 0.18, 4)
  setTension(false)
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
