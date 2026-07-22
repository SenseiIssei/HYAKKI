import Decimal from 'break_infinity.js'
import { create } from 'zustand'
import { BALANCE as B } from '../content/balance'
import { BONE_UPGRADE_BY_ID } from '../content/upgrades'
import { TREE_BY_ID } from '../content/tree'
import { INVENTORY_CAP, SLOT_ORDER, slotsFor, type Rarity } from '../content/relics'
import { compareRelic } from '../sim/evaluate'
import { meltValue, rarityRank, relicLabel } from '../sim/relics'
import { affordableLevels, costOfNext } from '../sim/formulas'
import { NAME_SHOP_BY_ID, nameCost } from '../content/nameshop'
import { LAYER_BY_ID } from '../content/layers'
import { purificationCost } from '../content/kegare'
import { OFUDA_BY_ID, OFUDA_SLOTS } from '../content/ofuda'
import {
  ABILITIES,
  abilityCooldownSec,
  abilityLevel,
  abilityTier,
} from '../content/abilities'
import { weaponClass } from '../content/items'
import { SPECIES_BY_ID, isBoss } from '../pixel/species'
import { getLocale, persistLocale, translate, type Locale } from '../i18n'
import {
  concurrentCap,
  descentReady,
  keyCap,
  newDescent,
  validRoute,
  wholeKeys,
} from '../sim/descent'
import type { DescentMap } from '../sim/types'
import { ICHOR_BY_ID, ichorCost } from '../content/ichor'
import { canSnuffHundredth, newFragments, roomDarkness } from '../content/fragments'
import { newObservations } from '../content/achievements'
import { fightMyriad, myriadReady } from '../sim/myriad'
import {
  apotheosis,
  canAscend,
  canInter,
  canReveille,
  interment,
  projectedIchor,
  projectedAsh,
  projectedNames,
  recant,
  reveille,
  vowSlots,
} from '../sim/prestige'
import { createInitialState, resetRun } from '../sim/state'
import { computeStats } from '../sim/stats'
import type { OfflineReport } from '../sim/offline'
import type { GameState, Relic, SimEvent, StatBlock } from '../sim/types'
import { fmt } from '../format'
import {
  setAudioEnabled,
  setMusicWanted,
  setTension,
  sfxAbility,
  setVolume,
  sfxBell,
  sfxDeath,
  sfxHit,
  sfxRank,
  sfxRelic,
  sfxSignature,
  sfxStand,
  sfxTaken,
} from '../audio/engine'
import { load, save } from '../save/storage'

/**
 * The sim state lives OUTSIDE React as a single mutable object. React
 * subscribes to a throttled frame counter and reads through `game()`.
 * Putting a 10Hz-mutating object in React state would be a rerender storm.
 */
let G: GameState = load() ?? createInitialState()
let ST: StatBlock = computeStats(G)

export const game = () => G
export const stats = () => ST
export const refreshStats = () => {
  ST = computeStats(G)
}

export function replaceGame(next: GameState) {
  G = next
  refreshStats()
  useUI.getState().bump()
}

// ── floating damage numbers ──
/**
 * A damage number that FLIES: it is thrown from the point of impact with a
 * randomised arc (dx across, up to a peak, then falling past) and fades. The
 * trajectory is baked into CSS custom properties at birth so the arc runs on
 * the GPU at full framerate, not at the sim's 10Hz.
 */
export type Floater = {
  id: number
  text: string
  kind: 'hit' | 'crit' | 'ability' | 'taken'
  target: 'enemy' | 'soldier'
  born: number
  /** horizontal drift, px */
  dx: number
  /** peak height of the arc, px (positive = up) */
  peak: number
  /** how far below the origin it ends, px */
  fall: number
  /** size multiplier */
  scale: number
  color?: string
  /** an ability's name, shown above its number */
  label?: string
}
let floaterId = 0
let floaters: Floater[] = []
export const getFloaters = () => floaters
export const FLOAT_MS = 1100

/**
 * An ability going off: a full VFX overlay plays for it. Like deaths, this is a
 * transient queue the arena reads and renders on its own timeline.
 */
export type Cast = {
  id: number
  vfx: string
  tier: number
  color: string
  kanji: string
  name: string
  born: number
}
let castId = 0
let casts: Cast[] = []
export const getCasts = () => casts
export const CAST_MS = 950

/**
 * Sparks — the particles that fly off where two things hit each other. Spawned
 * in bursts on every landed blow, coloured by who threw it, and left to arc out
 * and die on their own CSS timeline.
 */
export type Spark = {
  id: number
  side: 'enemy' | 'soldier'
  color: string
  /** launch vector, px */
  vx: number
  vy: number
  size: number
  born: number
}
let sparkId = 0
let sparks: Spark[] = []
export const getSparks = () => sparks
export const SPARK_MS = 480

function burst(now: number, side: 'enemy' | 'soldier', color: string, count: number, power = 1) {
  for (let i = 0; i < count; i++) {
    sparkId++
    const a = (sparkId * 2.399963) % (Math.PI * 2) // golden-angle spread
    const speed = (18 + (sparkId % 5) * 8) * power
    sparks.push({
      id: sparkId,
      side,
      color,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 8, // biased upward, like a real spray
      size: 2 + (sparkId % 3),
      born: now,
    })
  }
  if (sparks.length > 120) sparks = sparks.slice(-120)
}

/** The colour a family's blood/dust flies in. */
const FAMILY_SPARK: Record<string, string> = {
  chaff: '#8fae6a',
  organs: '#c1372b',
  returned: '#9fc6c9',
  nothing: '#8a6ba0',
  warden: '#c39a34',
}

/**
 * What the ability bar needs to draw: every learned art, its level, tier, and
 * how far through its cooldown it is (0 = ready, 1 = just fired).
 */
export type AbilityStatus = {
  id: string
  name: string
  kanji: string
  color: string
  level: number
  tier: number
  /** 0..1 progress of the cooldown ring; 0 = ready */
  cd: number
}
export function abilityStatuses(): AbilityStatus[] {
  const best = G.bestRankEver
  const out: AbilityStatus[] = []
  for (const a of ABILITIES) {
    const lvl = abilityLevel(a, best)
    if (lvl <= 0) continue
    const maxCd = Math.max(1, Math.round(abilityCooldownSec(a, lvl) * B.TICKS_PER_SEC))
    const left = G.abilityCd[a.id] ?? 0
    out.push({
      id: a.id,
      name: a.name,
      kanji: a.kanji,
      color: a.color,
      level: lvl,
      tier: abilityTier(a, lvl),
      cd: Math.min(1, Math.max(0, left / maxCd)),
    })
  }
  return out
}

// a cheap deterministic-ish jitter so numbers don't stack on one line
let floatSpin = 0
function pushFloater(
  now: number,
  text: string,
  kind: Floater['kind'],
  target: 'enemy' | 'soldier',
  color?: string,
  label?: string,
) {
  floatSpin = (floatSpin + 7) % 360
  const rad = (floatSpin / 360) * Math.PI * 2
  const spread = Math.sin(rad) // -1..1
  const big = kind === 'ability' ? 1 : kind === 'crit' ? 0.7 : 0.35
  floaters.push({
    id: floaterId++,
    text,
    kind,
    target,
    born: now,
    dx: Math.round(spread * (28 + big * 60)),
    peak: Math.round(34 + big * 66 + Math.abs(spread) * 10),
    fall: Math.round(30 + big * 40),
    scale: kind === 'ability' ? 1.9 : kind === 'crit' ? 1.35 : 1,
    color,
    label,
  })
  if (floaters.length > 40) floaters = floaters.slice(-40)
}

// Damage numbers are opt-out, and throttled: a fast walk lands several hits a
// second and an uncapped stream of numbers fights the log strip for the eye.
let lastFloaterAt = 0
export function damageNumbersOn(): boolean {
  return localStorage.getItem('hyakki.dmgnum') !== '0'
}

/**
 * A corpse, mid-dissolve. The sim spawns the next enemy the instant one dies,
 * so a death animation cannot live on the enemy — it is a separate overlay,
 * captured at the moment of the kill and left to fade on its own.
 */
export type DeathAnim = {
  id: number
  family: string
  seed: number
  speciesId?: string
  warden: boolean
  born: number
}
let deathId = 0
let deaths: DeathAnim[] = []
export const getDeaths = () => deaths
export const DEATH_MS = 620

/** The card shown the first time a species is ever put down. */
export type Discovery = { id: number; speciesId: string; name: string; kanji: string; lore: string; boss: boolean; born: number }
let discoveryId = 0
let discovery: Discovery | null = null
export const getDiscovery = () => discovery
export const DISCOVERY_MS = 4200

/**
 * Impact. Bumped on every kill and every crit so the view can shake and
 * hit-stop. A monotonic counter rather than a boolean, so the reader can tell
 * a fresh impact from a stale one without a reset handshake.
 */
let impact = { kill: 0, crit: 0, warden: 0, swing: 0, struck: 0, cast: 0, castTier: 0 }
export const getImpact = () => impact

// ── the log strip ──
let log: { id: number; text: string }[] = []
let logId = 0
export const getLog = () => log
function pushLog(text: string) {
  log = [{ id: logId++, text }, ...log].slice(0, 40)
}

/** The class of blade currently worn, so hits sound like the weapon looks. */
export function playerWeaponWeight(): 'light' | 'balanced' | 'heavy' {
  const w = G.equipped[SLOT_ORDER.indexOf('weapon')]
  return w?.base ? weaponClass(w.base) : 'balanced'
}

const RARITY_RANK: Record<string, number> = {
  issued: 0,
  kept: 1,
  named: 2,
  blessed: 3,
  cursed: 4,
  myth: 5,
  truename: 6,
}

/**
 * A drop just landed. If it is a genuine upgrade for an unlocked slot, either
 * equip it (auto), raise a yes/no (ask), or leave it (off). The cheap rarity
 * gate runs first so we only pay for the real sim comparison on plausible
 * upgrades, not on every scrap of Issued gear.
 */
function considerDrop(relic: Relic) {
  const mode = useUI.getState().autoEquip
  if (mode === 'off') return
  const slotIdx = SLOT_ORDER.indexOf(relic.slot)
  if (slotIdx < 0 || slotIdx >= slotCount()) return // slot locked
  const worn = G.equipped[slotIdx]
  // cheap gate: an empty slot, or at least as rare as what's worn
  const plausible = !worn || RARITY_RANK[relic.rarity] >= RARITY_RANK[worn.rarity]
  if (!plausible) return
  // confirm it actually helps, by the real measure
  const cmp = compareRelic(G, relic)
  const score = cmp.dpsDelta + cmp.survivalDelta * 0.5
  if (score <= 0.01) return // not actually better
  if (mode === 'auto') {
    equipRelic(relic.uid)
    pushLog(`Better. ${relicLabel(relic)} — on.`)
  } else {
    // only hold one prompt at a time; a later, better drop replaces it
    useUI.getState().setPendingEquip(relic.uid)
  }
}

/** Turn sim events into presentation. Called once per rendered frame. */
export function drainEvents(now: number) {
  const evts: SimEvent[] = G.events
  if (evts.length) {
    for (const e of evts) {
      switch (e.t) {
        case 'hit':
          // opt-out, and throttled to ~8/sec — a crit always shows, since it
          // is the hit worth seeing
          if (damageNumbersOn() && (e.crit || now - lastFloaterAt >= 120)) {
            lastFloaterAt = now
            pushFloater(now, fmt(e.amount), e.crit ? 'crit' : 'hit', e.target)
          }
          if (e.target === 'enemy') {
            sfxHit(e.crit, playerWeaponWeight())
            // sparks fly off the thing you hit, in its own colour
            burst(now, 'enemy', e.crit ? '#ffd98a' : FAMILY_SPARK[G.enemy.family] ?? '#c1372b', e.crit ? 12 : 6, e.crit ? 1.5 : 1)
            // a swing throws the walker forward; a crit shakes the frame
            impact = {
              ...impact,
              swing: impact.swing + 1,
              crit: e.crit ? impact.crit + 1 : impact.crit,
            }
          } else {
            sfxTaken()
            // it hit you back — your own blood, and the enemy lunges in
            burst(now, 'soldier', '#c1372b', 7, 1)
            impact = { ...impact, struck: impact.struck + 1 }
          }
          break
        case 'ability': {
          casts.push({
            id: castId++,
            vfx: e.vfx,
            tier: e.tier,
            color: e.color,
            kanji: e.kanji,
            name: e.name,
            born: now,
          })
          if (casts.length > 4) casts = casts.slice(-4)
          // the big number, thrown hard and coloured to the art
          if (damageNumbersOn()) {
            pushFloater(now, fmt(e.damage), 'ability', 'enemy', e.color, e.name)
          }
          sfxAbility(e.tier)
          // a shower of sparks in the art's colour, bigger with tier
          burst(now, 'enemy', e.color, 10 + e.tier * 6, 1.4 + e.tier * 0.4)
          // abilities shake with their tier; the ultimate rocks the screen
          impact = { ...impact, cast: impact.cast + 1, castTier: e.tier }
          break
        }
        case 'kill':
          deaths.push({
            id: deathId++,
            family: e.family,
            seed: e.seed,
            speciesId: e.speciesId,
            warden: e.warden,
            born: now,
          })
          // keep the overlay list short; old corpses have finished fading
          if (deaths.length > 6) deaths = deaths.slice(-6)
          impact = e.warden
            ? { ...impact, warden: impact.warden + 1, kill: impact.kill + 1 }
            : { ...impact, kill: impact.kill + 1 }
          // the first time a species is ever felled, name it
          if (e.firstFell && e.speciesId) {
            const sp = SPECIES_BY_ID[e.speciesId]
            if (sp)
              discovery = {
                id: discoveryId++,
                speciesId: sp.id,
                name: sp.name,
                kanji: sp.kanji,
                lore: sp.lore,
                boss: isBoss(sp.id),
                born: now,
              }
          }
          break
        case 'rank':
          pushLog(`Ri ${e.rank}.`)
          sfxRank()
          break
        case 'stand':
          pushLog(`A hearing. ${e.warden} will see you.`)
          sfxStand()
          setTension(true)
          break
        case 'standWon':
          pushLog(e.line)
          setTension(false)
          break
        case 'standLost':
          pushLog(`The hearing closed at Ri ${e.rank}. You are further back than you were.`)
          break
        case 'signature':
          pushLog(`${e.label}.`)
          sfxSignature()
          break
        case 'revive':
          pushLog('You get up. Nobody asked you to.')
          break
        case 'relic':
          pushLog(`Something old. ${relicLabel(e.relic)}. It has been waiting.`)
          sfxRelic()
          considerDrop(e.relic)
          break
        case 'echoLost':
          pushLog('One of you stops.')
          break
        case 'ward':
          pushLog(
            e.failed
              ? `The ${e.name} tears in your hand. It does nothing.`
              : `${e.name} holds. The paper takes it instead of you.`,
          )
          break
        case 'purify':
          pushLog('You wash in the river. It comes off. Most of it.')
          break
        case 'unlock':
          pushLog(`${e.name}. You could be that now.`)
          break
        case 'death':
          pushLog(e.cause)
          sfxDeath()
          break
        case 'log':
          pushLog(e.text)
          break
      }
    }
    G.events = []
  }
  const before = floaters.length
  floaters = floaters.filter((f) => now - f.born < FLOAT_MS)
  const deathsBefore = deaths.length
  deaths = deaths.filter((d) => now - d.born < DEATH_MS)
  const castsBefore = casts.length
  casts = casts.filter((c) => now - c.born < CAST_MS)
  const sparksBefore = sparks.length
  sparks = sparks.filter((sp) => now - sp.born < SPARK_MS)
  if (discovery && now - discovery.born >= DISCOVERY_MS) discovery = null
  return (
    floaters.length !== before ||
    deaths.length !== deathsBefore ||
    casts.length !== castsBefore ||
    sparks.length !== sparksBefore ||
    evts.length > 0
  )
}

// ── UI store: a frame counter and drawer state. Never persisted with the sim. ──
type UIState = {
  frame: number
  bump: () => void
  autopsyOpen: boolean
  setAutopsy: (v: boolean) => void
  settingsOpen: boolean
  setSettings: (v: boolean) => void
  treeOpen: boolean
  setTree: (v: boolean) => void
  relicsOpen: boolean
  setRelics: (v: boolean) => void
  pickerOpen: boolean
  setPicker: (v: boolean) => void
  ordersOpen: boolean
  setOrders: (v: boolean) => void
  bargainOpen: boolean
  setBargain: (v: boolean) => void
  descendOpen: boolean
  setDescend: (v: boolean) => void
  ascendOpen: boolean
  setAscend: (v: boolean) => void
  ledgerOpen: boolean
  setLedger: (v: boolean) => void
  wardsOpen: boolean
  setWards: (v: boolean) => void
  storiesOpen: boolean
  setStories: (v: boolean) => void
  bestiaryOpen: boolean
  setBestiary: (v: boolean) => void
  audioOn: boolean
  setAudioOn: (v: boolean) => void
  audioVolume: number
  setAudioVolume: (v: number) => void
  musicOn: boolean
  setMusicOn: (v: boolean) => void
  report: OfflineReport | null
  setReport: (r: OfflineReport | null) => void
  /** low-end / high-legibility mode: combat as a text log, no sigils */
  numbersOnly: boolean
  setNumbersOnly: (v: boolean) => void
  locale: Locale
  setLocale: (l: Locale) => void
  /** what to do when a better item drops: ask (popup), auto (equip it), off */
  autoEquip: 'ask' | 'auto' | 'off'
  setAutoEquip: (m: 'ask' | 'auto' | 'off') => void
  /** uid of a dropped upgrade awaiting the player's yes/no */
  pendingEquip: string | null
  setPendingEquip: (uid: string | null) => void
  /** hit-stop and screen shake on impact. Off for anyone who wants it still. */
  screenShake: boolean
  setScreenShake: (v: boolean) => void
  /** floating damage numbers over the fighters */
  damageNumbers: boolean
  setDamageNumbers: (v: boolean) => void
  fontScale: number
  setFontScale: (n: number) => void
  buyMode: 1 | 10 | 'max'
  setBuyMode: (m: 1 | 10 | 'max') => void
}

export const useUI = create<UIState>((set) => ({
  frame: 0,
  bump: () => set((s) => ({ frame: s.frame + 1 })),
  autopsyOpen: false,
  setAutopsy: (v) => set({ autopsyOpen: v }),
  settingsOpen: false,
  setSettings: (v) => set({ settingsOpen: v }),
  treeOpen: false,
  setTree: (v) => set({ treeOpen: v }),
  relicsOpen: false,
  setRelics: (v) => set({ relicsOpen: v }),
  pickerOpen: false,
  setPicker: (v) => set({ pickerOpen: v }),
  ordersOpen: false,
  setOrders: (v) => set({ ordersOpen: v }),
  bargainOpen: false,
  setBargain: (v) => set({ bargainOpen: v }),
  descendOpen: false,
  setDescend: (v) => set({ descendOpen: v }),
  ascendOpen: false,
  setAscend: (v) => set({ ascendOpen: v }),
  ledgerOpen: false,
  setLedger: (v) => set({ ledgerOpen: v }),
  wardsOpen: false,
  setWards: (v) => set({ wardsOpen: v }),
  storiesOpen: false,
  setStories: (v) => set({ storiesOpen: v }),
  bestiaryOpen: false,
  setBestiary: (v) => set({ bestiaryOpen: v }),
  // Sound is off until asked for. An idle game runs for hours.
  audioOn: localStorage.getItem('myriad.audio') === '1',
  setAudioOn: (v) => {
    localStorage.setItem('myriad.audio', v ? '1' : '0')
    setAudioEnabled(v)
    set({ audioOn: v })
  },
  musicOn: localStorage.getItem('hyakki.music') !== '0',
  setMusicOn: (v) => {
    localStorage.setItem('hyakki.music', v ? '1' : '0')
    setMusicWanted(v)
    set({ musicOn: v })
  },
  audioVolume: Number(localStorage.getItem('myriad.volume') ?? 35),
  setAudioVolume: (v) => {
    localStorage.setItem('myriad.volume', String(v))
    setVolume(v / 100)
    set({ audioVolume: v })
  },
  report: null,
  setReport: (r) => set({ report: r }),
  numbersOnly: localStorage.getItem('myriad.numbersOnly') === '1',
  setNumbersOnly: (v) => {
    localStorage.setItem('myriad.numbersOnly', v ? '1' : '0')
    set({ numbersOnly: v })
  },
  locale: getLocale(),
  setLocale: (l) => {
    persistLocale(l)
    set({ locale: l })
  },
  autoEquip:
    (localStorage.getItem('hyakki.autoequip') as 'ask' | 'auto' | 'off') || 'ask',
  setAutoEquip: (m) => {
    localStorage.setItem('hyakki.autoequip', m)
    set({ autoEquip: m })
  },
  pendingEquip: null,
  setPendingEquip: (uid) => set({ pendingEquip: uid }),
  screenShake: localStorage.getItem('hyakki.shake') !== '0',
  setScreenShake: (v) => {
    localStorage.setItem('hyakki.shake', v ? '1' : '0')
    set({ screenShake: v })
  },
  damageNumbers: localStorage.getItem('hyakki.dmgnum') !== '0',
  setDamageNumbers: (v) => {
    localStorage.setItem('hyakki.dmgnum', v ? '1' : '0')
    set({ damageNumbers: v })
  },
  fontScale: Number(localStorage.getItem('myriad.fontScale') ?? 100),
  setFontScale: (n) => {
    localStorage.setItem('myriad.fontScale', String(n))
    document.documentElement.style.fontSize = `${(n / 100) * 15}px`
    set({ fontScale: n })
  },
  buyMode: 1,
  setBuyMode: (m) => set({ buyMode: m }),
}))

/**
 * The translator, bound to the live locale. Subscribing to `locale` means every
 * component that calls `useT()` re-renders when the language changes, so the
 * whole interface re-reads at once.
 */
export function useT() {
  const locale = useUI((s) => s.locale)
  return (key: string) => translate(key, locale)
}

// ── actions ──

export function boneCost(id: string, count: number): Decimal {
  const up = BONE_UPGRADE_BY_ID[id]
  const level = G.boneLevels[id] ?? 0
  return costOfNext(up.base, B.BONE_UPGRADE_SCALE, level, count)
}

export function boneBuyCount(id: string, mode: 1 | 10 | 'max'): number {
  if (mode !== 'max') return mode
  const up = BONE_UPGRADE_BY_ID[id]
  const level = G.boneLevels[id] ?? 0
  return affordableLevels(up.base, B.BONE_UPGRADE_SCALE, level, G.bone)
}

export function buyBone(id: string, mode: 1 | 10 | 'max'): boolean {
  const count = boneBuyCount(id, mode)
  if (count <= 0) return false
  const cost = boneCost(id, count)
  if (G.bone.lt(cost)) return false
  const prevMaxHp = ST.hp
  G.bone = G.bone.sub(cost)
  G.boneLevels[id] = (G.boneLevels[id] ?? 0) + count
  refreshStats()
  // Buying more max health grants that health, rather than silently lowering
  // your health percentage.
  const gained = ST.hp.sub(prevMaxHp)
  if (gained.gt(0)) G.soldier.hp = Decimal.min(ST.hp, G.soldier.hp.add(gained))
  useUI.getState().bump()
  return true
}

/**
 * MISOGI 禊 — washing.
 *
 * Kegare is pollution, not guilt, so it is removed by water rather than by
 * being forgiven — and the cost is the point. Defilement is paying you in
 * damage and Ash the whole time you carry it, so washing is choosing to be
 * poorer and harder to kill. Priced off depth and filth so it never becomes
 * a formality you click through.
 */
export function purify(): boolean {
  if (G.kegare <= 0) return false
  const cost = new Decimal(purificationCost(G.kegare, G.rank))
  if (G.bone.lt(cost)) return false
  G.bone = G.bone.sub(cost)
  G.kegare = 0
  refreshStats()
  G.events.push({ t: 'purify' })
  useUI.getState().bump()
  return true
}

export function purifyCost(): Decimal {
  return new Decimal(purificationCost(G.kegare, G.rank))
}

/**
 * OFUDA loadout. Toggling a ward on or off is only allowed OUT of a walk —
 * enforced here rather than in the UI so a stale panel can't sneak a swap
 * mid-fight. Charges refill to full whenever the carried set changes, since
 * you are re-papering before setting off.
 */
export function toggleOfuda(id: string): boolean {
  if (!G.ofudaOwned.includes(id)) return false
  // dead-or-fresh only: a walk in progress has its loadout locked
  const walking = G.totalTicks > 0 && !G.dead && G.rank > 1
  if (walking) return false
  const at = G.ofuda.indexOf(id)
  if (at >= 0) {
    G.ofuda.splice(at, 1)
  } else {
    if (G.ofuda.length >= OFUDA_SLOTS) return false
    G.ofuda.push(id)
  }
  G.ofudaCharges = {}
  for (const w of G.ofuda) G.ofudaCharges[w] = OFUDA_BY_ID[w]?.charges ?? 0
  useUI.getState().bump()
  return true
}

// ── the tree ──

export function treeCost(id: string, count: number): Decimal {
  const node = TREE_BY_ID[id]
  const level = G.treeLevels[id] ?? 0
  return costOfNext(node.base, B.TREE_NODE_SCALE, level, count)
}

export function treeBuyCount(id: string, mode: 1 | 10 | 'max'): number {
  if (mode !== 'max') return mode
  const node = TREE_BY_ID[id]
  return affordableLevels(node.base, B.TREE_NODE_SCALE, G.treeLevels[id] ?? 0, G.ash)
}

export function buyTree(id: string, mode: 1 | 10 | 'max'): boolean {
  const count = treeBuyCount(id, mode)
  if (count <= 0) return false
  const cost = treeCost(id, count)
  if (G.ash.lt(cost)) return false
  const prevMaxHp = ST.hp
  G.ash = G.ash.sub(cost)
  G.ashSpentTotal = G.ashSpentTotal.add(cost)
  G.ashSpentThisAscension = G.ashSpentThisAscension.add(cost)
  G.treeLevels[id] = (G.treeLevels[id] ?? 0) + count
  refreshStats()
  const gained = ST.hp.sub(prevMaxHp)
  if (gained.gt(0)) G.soldier.hp = Decimal.min(ST.hp, G.soldier.hp.add(gained))
  useUI.getState().bump()
  saveNow()
  return true
}

// ── interment, names, vows ──

export const namesProjection = () => projectedNames(G)
export const intermentReady = () => canInter(G)

export function doInterment() {
  const gained = interment(G)
  refreshStats()
  floaters = []
  useUI.getState().setAutopsy(false)
  useUI.getState().bump()
  saveNow()
  return gained
}

export function buyName(id: string): boolean {
  const p = NAME_SHOP_BY_ID[id]
  if (!p) return false
  const owned = G.purchases[id] ?? 0
  if (owned >= p.max) return false
  const cost = nameCost(p, owned)
  if (G.names < cost) return false
  G.names -= cost
  G.namesSpent += cost
  G.namesSpentTotal += cost
  G.purchases[id] = owned + 1
  if (id === 'slot') G.slotBonus = G.purchases[id]
  if (id === 'orders2') G.orders.autoBuy = true
  refreshStats()
  useUI.getState().bump()
  saveNow()
  return true
}

export const vowSlotCount = () => vowSlots(G)

export function toggleVow(id: string): boolean {
  const i = G.vows.indexOf(id)
  if (i >= 0) {
    G.vows.splice(i, 1)
  } else {
    if (G.vows.length >= vowSlots(G)) return false
    G.vows.push(id)
  }
  // A Vow reshapes the run it is sworn on, so the run restarts around it.
  resetRun(G)
  refreshStats()
  G.soldier.hp = ST.hp
  floaters = []
  useUI.getState().bump()
  saveNow()
  return true
}

// ── apotheosis, ichor, the myriad ──

export const ichorProjection = () => projectedIchor(G)
export const ascendReady = () => canAscend(G)

export function doApotheosis() {
  const gained = apotheosis(G)
  refreshStats()
  floaters = []
  pushLog(`You ascend. +${gained} Ichor.`)
  useUI.getState().setAutopsy(false)
  useUI.getState().bump()
  saveNow()
  return gained
}

export function buyRule(id: string): boolean {
  const r = ICHOR_BY_ID[id]
  if (!r) return false
  const owned = G.rules[id] ?? 0
  if (owned >= r.max) return false
  const cost = ichorCost(r, owned)
  if (G.ichor < cost) return false
  G.ichor -= cost
  G.ichorSpent += cost
  G.rules[id] = owned + 1
  refreshStats()
  useUI.getState().bump()
  saveNow()
  return true
}

export const canFightMyriad = () => myriadReady(G)

export function challengeMyriad() {
  const result = fightMyriad(G, (G.soldierSeed + G.apotheoses) >>> 0)
  if (result.felled) {
    G.myriadFelled = true
    G.soldierNumber = 10000
    pushLog('It comes apart. Every one of them is wearing your coat.')
  } else {
    pushLog(result.line)
  }
  useUI.getState().bump()
  saveNow()
  return result
}

/**
 * Snuff a candle: read a story for real.
 *
 * Earning a fragment only LIGHTS its candle. Reading it here puts the candle
 * out, and the room darkens with the count — because the whole horror of
 * Hyakumonogatari is that the counting itself is the summoning, and you do the
 * counting one deliberate story at a time.
 *
 * The hundredth is refused until ninety-nine are out. Putting it out is a
 * one-way door: it sets `hundredth`, which the encounter watches for.
 */
export function snuffCandle(n: number): boolean {
  if (!G.fragments.includes(n)) return false
  if (G.snuffed.includes(n)) return false
  if (n === 100) {
    if (!canSnuffHundredth(G.snuffed)) return false
    G.hundredth = true
  }
  G.snuffed.push(n)
  useUI.getState().bump()
  return true
}

/** 0..1 — how dark the room has become. Only the read stories count. */
export function roomDark(): number {
  return roomDarkness(G.snuffed)
}

/** Fragments unlock silently; the log mentions one landed, nothing more. */
export function checkFragments() {
  let changed = false

  const found = newFragments(G)
  for (const f of found) {
    G.fragments.push(f.n)
    pushLog(`A fragment. #${f.n}.`)
    sfxBell(700, 0.07, 1.6)
    changed = true
  }

  // The game notices things about you. It does not congratulate you.
  for (const o of newObservations(G)) {
    G.observations.push(o.id)
    pushLog(o.text)
    changed = true
  }

  if (changed) useUI.getState().bump()
}

// ── descents ──

export const keysHeld = () => wholeKeys(G)
export const keysCap = () => keyCap(G)
export const keyFraction = () => G.keys - Math.floor(G.keys)
export const descentSlots = () => concurrentCap(G)
export const running = () => G.descents.filter((d) => !d.collected)
export const readyDescents = () =>
  G.descents.filter((d) => !d.collected && descentReady(d, Date.now()))

export function openLayer(layerId: string): boolean {
  const l = LAYER_BY_ID[layerId]
  if (!l || l.cost === 0) return false
  if (G.layerNames >= l.cost) return false
  const need = l.cost - G.layerNames
  if (G.names < need) return false
  G.names -= need
  G.namesSpent += need
  G.namesSpentTotal += need
  G.layerNames += need
  useUI.getState().bump()
  saveNow()
  return true
}

export function commitDescent(map: DescentMap, route: number[]): boolean {
  if (wholeKeys(G) < 1) return false
  if (running().length >= concurrentCap(G)) return false
  if (!validRoute(map, route)) return false
  G.keys -= 1
  G.descents.push(newDescent(G, map, route))
  useUI.getState().bump()
  saveNow()
  return true
}

export function collectDescent(id: string) {
  const d = G.descents.find((x) => x.id === id)
  if (!d || d.collected || !descentReady(d, Date.now())) return
  d.collected = true
  const r = d.result

  G.ash = G.ash.add(new Decimal(r.ash))
  for (const relic of r.relics) {
    if (G.inventory.length >= INVENTORY_CAP) G.ash = G.ash.add(meltValue(relic))
    else G.inventory.push(relic)
  }
  if (r.names > 0) {
    G.names += r.names
    G.seen[`layer.${d.layerId}`] = true
  }
  if (r.cleared) {
    G.descentsCleared += 1
    if (d.depth >= 30) G.seen.deepDescent = true
  }

  // finished Descents do not linger in the save
  G.descents = G.descents.filter((x) => !x.collected)
  pushLog(
    r.cleared
      ? `You came back up. ${r.relics.length} carried.`
      : 'You did not come back up. What you found came with you anyway.',
  )
  useUI.getState().bump()
  saveNow()
}

export function setPriority(list: string[]) {
  G.orders.priority = list
  useUI.getState().bump()
  saveNow()
}

export function doRecant() {
  recant(G)
  refreshStats()
  floaters = []
  pushLog('You take the cairn apart. Every stone is returned to you, cold.')
  useUI.getState().bump()
  saveNow()
}

// ── reveille ──

export const ashProjection = () => projectedAsh(G)
export const reveilleReady = () => canReveille(G)

export function soundReveille(classId?: string) {
  G.lastAsh = projectedAsh(G)
  const gained = reveille(G, classId ?? G.classId)
  refreshStats()
  G.soldier.hp = ST.hp
  floaters = []
  pushLog(`You stack the stones. ${fmt(gained)} 石 remain when they fall.`)
  useUI.getState().setAutopsy(false)
  useUI.getState().bump()
  saveNow()
}

export function chooseClass(classId: string) {
  G.classId = classId
  G.seen[`played.${classId}`] = true
  refreshStats()
  G.soldier.hp = ST.hp
  useUI.getState().bump()
}

// ── relics ──

/** How many of the six typed slots are unlocked (2..6, by depth + Names). */
export function slotCount(): number {
  return slotsFor(G.bestRankEver, G.slotBonus)
}

/** Is the slot this item belongs to open yet? */
export function slotUnlockedFor(relic: Relic): boolean {
  return SLOT_ORDER.indexOf(relic.slot) < slotCount()
}

/**
 * Equip an item into ITS slot — RPG-typed: a helm only fits the head, and the
 * head slot has to be unlocked. Whatever was in that slot goes back to the bag.
 */
export function equipRelic(uid: string) {
  const idx = G.inventory.findIndex((r) => r.uid === uid)
  if (idx < 0) return
  const relic = G.inventory[idx]
  const target = SLOT_ORDER.indexOf(relic.slot)
  if (target < 0 || target >= slotCount()) return // slot locked or unknown
  const displaced = G.equipped[target] ?? null
  G.equipped[target] = relic
  G.inventory.splice(idx, 1)
  if (displaced) G.inventory.push(displaced)
  refreshStats()
  G.soldier.hp = Decimal.min(ST.hp, G.soldier.hp)
  useUI.getState().bump()
  saveNow()
}

export function unequipRelic(slot: number) {
  const relic = G.equipped[slot]
  if (!relic) return
  G.equipped[slot] = null
  G.inventory.push(relic)
  refreshStats()
  G.soldier.hp = Decimal.min(ST.hp, G.soldier.hp)
  useUI.getState().bump()
  saveNow()
}

export function meltRelic(uid: string) {
  const idx = G.inventory.findIndex((r) => r.uid === uid)
  if (idx < 0) return
  const [relic] = G.inventory.splice(idx, 1)
  if (relic.rarity === 'truename') G.seen.meltedTrueName = true
  G.ash = G.ash.add(meltValue(relic))
  useUI.getState().bump()
  saveNow()
}

/** Bulk melt everything at or below a rarity. Mandatory quality of life. */
export function meltBelow(rarity: Rarity): number {
  const limit = rarityRank(rarity)
  const keep: typeof G.inventory = []
  let gained = new Decimal(0)
  let n = 0
  for (const r of G.inventory) {
    if (rarityRank(r.rarity) <= limit) {
      gained = gained.add(meltValue(r))
      n++
    } else keep.push(r)
  }
  G.inventory = keep
  G.ash = G.ash.add(gained)
  if (n) pushLog(`${n} melted. The Ash is warm.`)
  useUI.getState().bump()
  saveNow()
  return n
}

export const compare = (relic: Parameters<typeof compareRelic>[1]) => compareRelic(G, relic)

export const setReport = (r: OfflineReport | null) => useUI.getState().setReport(r)

export function setOrders(patch: Partial<GameState['orders']>) {
  G.orders = { ...G.orders, ...patch }
  useUI.getState().bump()
  saveNow()
}

/** Automating a system is the reward for having mastered it. */
export const ordersUnlocked = () => G.reveilles >= 25

export function saveNow() {
  G.lastSeenAt = Date.now()
  save(G)
}

/** Progressive revelation — docs/10-UI-UX.md § Onboarding */
export function reveal(key: string) {
  if (!G.seen[key]) {
    G.seen[key] = true
    useUI.getState().bump()
  }
}
