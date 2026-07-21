import Decimal from 'break_infinity.js'
import { create } from 'zustand'
import { BALANCE as B } from '../content/balance'
import { BONE_UPGRADE_BY_ID } from '../content/upgrades'
import { TREE_BY_ID } from '../content/tree'
import { INVENTORY_CAP, slotsFor, type Rarity } from '../content/relics'
import { compareRelic } from '../sim/evaluate'
import { meltValue, rarityRank, relicLabel } from '../sim/relics'
import { affordableLevels, costOfNext } from '../sim/formulas'
import { NAME_SHOP_BY_ID, nameCost } from '../content/nameshop'
import { LAYER_BY_ID } from '../content/layers'
import {
  concurrentCap,
  descentReady,
  keyCap,
  newDescent,
  validRoute,
  wholeKeys,
} from '../sim/descent'
import type { DescentMap } from '../sim/types'
import {
  canInter,
  canReveille,
  interment,
  projectedAsh,
  projectedNames,
  recant,
  reveille,
  vowSlots,
} from '../sim/prestige'
import { createInitialState, resetRun } from '../sim/state'
import { computeStats } from '../sim/stats'
import type { OfflineReport } from '../sim/offline'
import type { GameState, SimEvent, StatBlock } from '../sim/types'
import { fmt } from '../format'
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
export type Floater = {
  id: number
  text: string
  crit: boolean
  target: 'enemy' | 'soldier'
  x: number
  born: number
}
let floaterId = 0
let floaters: Floater[] = []
export const getFloaters = () => floaters

// ── the log strip ──
let log: { id: number; text: string }[] = []
let logId = 0
export const getLog = () => log
function pushLog(text: string) {
  log = [{ id: logId++, text }, ...log].slice(0, 40)
}

/** Turn sim events into presentation. Called once per rendered frame. */
export function drainEvents(now: number) {
  const evts: SimEvent[] = G.events
  if (evts.length) {
    for (const e of evts) {
      switch (e.t) {
        case 'hit':
          floaters.push({
            id: floaterId++,
            text: fmt(e.amount),
            crit: e.crit,
            target: e.target,
            x: (floaterId * 37) % 60 - 30,
            born: now,
          })
          break
        case 'rank':
          pushLog(`Rank ${e.rank}.`)
          break
        case 'stand':
          pushLog(`A Stand. ${e.warden}.`)
          break
        case 'standWon':
          pushLog(e.line)
          break
        case 'standLost':
          pushLog(`The Stand closed at Rank ${e.rank}. You are further back than you were.`)
          break
        case 'signature':
          pushLog(`${e.label}.`)
          break
        case 'revive':
          pushLog('You get up. Nobody asked you to.')
          break
        case 'relic':
          pushLog(`Something was carried in here. ${relicLabel(e.relic)}.`)
          break
        case 'echoLost':
          pushLog('One of you stops.')
          break
        case 'unlock':
          pushLog(`${e.name}. You could be that now.`)
          break
        case 'death':
          pushLog(e.cause)
          break
        case 'log':
          pushLog(e.text)
          break
      }
    }
    G.events = []
  }
  const before = floaters.length
  floaters = floaters.filter((f) => now - f.born < 750)
  return floaters.length !== before || evts.length > 0
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
  report: OfflineReport | null
  setReport: (r: OfflineReport | null) => void
  /** low-end / high-legibility mode: combat as a text log, no sigils */
  numbersOnly: boolean
  setNumbersOnly: (v: boolean) => void
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
  report: null,
  setReport: (r) => set({ report: r }),
  numbersOnly: localStorage.getItem('myriad.numbersOnly') === '1',
  setNumbersOnly: (v) => {
    localStorage.setItem('myriad.numbersOnly', v ? '1' : '0')
    set({ numbersOnly: v })
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
  if (r.cleared) G.descentsCleared += 1

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
  pushLog('You recant. Everything burned is returned to you, cold.')
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
  pushLog(`Reveille. +${fmt(gained)} Ash.`)
  useUI.getState().setAutopsy(false)
  useUI.getState().bump()
  saveNow()
}

export function chooseClass(classId: string) {
  G.classId = classId
  refreshStats()
  G.soldier.hp = ST.hp
  useUI.getState().bump()
}

// ── relics ──

export function slotCount(): number {
  return slotsFor(G.bestRankEver, G.slotBonus)
}

/** Keeps `equipped` the right length as slot milestones unlock. */
function syncSlots() {
  const want = slotCount()
  while (G.equipped.length < want) G.equipped.push(null)
  while (G.equipped.length > want) {
    const dropped = G.equipped.pop()
    if (dropped) G.inventory.push(dropped)
  }
}

export function equipRelic(uid: string, slot?: number) {
  syncSlots()
  const idx = G.inventory.findIndex((r) => r.uid === uid)
  if (idx < 0) return
  const relic = G.inventory[idx]
  const target = slot ?? compareRelic(G, relic).slot
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
