import Decimal from 'break_infinity.js'
import { BALANCE as B } from '../content/balance'
import { LAYER_BY_ID, ROOM_WEIGHTS, type LayerDef, type RoomType } from '../content/layers'
import { keystoneFlags } from '../content/tree'
import { WARDEN_BY_ID } from '../content/wardens'
import { step } from './combat'
import { spawnEnemy } from './enemies'
import { enemyAtk, enemyHp } from './formulas'
import { equippedFlags, meltValue, relicSeed, rollRelic } from './relics'
import { Rng, hashSeed } from './rng'
import { computeStats } from './stats'
import type {
  ActiveDescent,
  DescentMap,
  DescentResult,
  DescentRoom,
  GameState,
  Relic,
  RoomOutcome,
} from './types'

/** docs/08-DESCENTS.md */

// ── keys ───────────────────────────────────────────────────────────────

export function keyCap(s: GameState): number {
  return B.KEY_CAP_BASE + (s.purchases.keys ?? 0) * 3
}

export function addKeyTime(s: GameState, ms: number) {
  const perKey = B.KEY_REGEN_MIN * 60_000
  s.keys = Math.min(keyCap(s), s.keys + ms / perKey)
}

export function wholeKeys(s: GameState): number {
  return Math.floor(s.keys)
}

export function concurrentCap(s: GameState): number {
  return 1 + (s.purchases.descents ?? 0)
}

// ── the map ────────────────────────────────────────────────────────────

export function descentDurationMs(depth: number): number {
  return Math.min(25 * 60_000, 5 * 60_000 + 40_000 * depth)
}

/**
 * The effective Rank a Descent's rooms are built at.
 *
 * The tuning window here is far narrower than it looks. Enemy power is
 * exponential in Rank, so the whole span from "trivial" to "impossible" is
 * about 20% of Rank. Measured against a real player whose Column wall was
 * Rank 6,679:
 *
 *   Rank 6,478 -> 100% clear      Rank 7,973 -> 0% clear
 *
 * So the entire depth slider, and every Layer's difficulty, has to fit between
 * roughly 1.0x and 1.2x of the player's deepest Rank. Anything outside that is
 * not "harder", it is a wall or a walkover.
 *
 * (Note the base is ~1x rather than well below it: the Column wall is set by
 * Stand TIMERS, so a player's raw 1v1 killing power reaches deeper than their
 * best Rank suggests.)
 */
export function descentRank(s: GameState, layer: LayerDef, depth: number): number {
  const base = Math.max(10, s.bestRankEver * 0.97)
  return Math.max(10, Math.round(base * layer.powerBase * Math.pow(1.0012, depth)))
}

function pickRoom(rng: Rng, floor: number, floors: number): RoomType {
  if (floor === floors - 1) return 'warden'
  // the first floor is always safe to enter
  if (floor === 0) return rng.chance(0.5) ? 'fight' : 'shrine'
  const entries = Object.entries(ROOM_WEIGHTS) as [RoomType, number][]
  const total = entries.reduce((a, [, w]) => a + w, 0)
  let roll = rng.next() * total
  for (const [type, w] of entries) {
    roll -= w
    if (roll <= 0) return type
  }
  return 'fight'
}

export function generateMap(layerId: string, depth: number, seed: number): DescentMap {
  const rng = new Rng(seed >>> 0)
  const floors = Math.min(12, 6 + Math.floor(depth / 3))
  const rooms: DescentRoom[] = []
  const byFloor: number[][] = []

  for (let f = 0; f < floors; f++) {
    const lanes = f === 0 ? 2 + rng.int(0, 2) : f === floors - 1 ? 1 : 2 + rng.int(0, 3)
    const ids: number[] = []
    for (let l = 0; l < lanes; l++) {
      const id = rooms.length
      rooms.push({ id, type: pickRoom(rng, f, floors), floor: f, lane: l, next: [] })
      ids.push(id)
    }
    byFloor.push(ids)
  }

  // Connect each floor forward. Every room gets at least one exit, and every
  // room on the next floor gets at least one way in — no dead ends, no orphans.
  for (let f = 0; f < floors - 1; f++) {
    const here = byFloor[f]
    const next = byFloor[f + 1]
    here.forEach((id, i) => {
      const target = next[Math.min(next.length - 1, Math.round((i / Math.max(1, here.length - 1)) * (next.length - 1)))]
      rooms[id].next.push(target)
      if (next.length > 1 && rng.chance(0.55)) {
        const alt = next[rng.int(0, next.length)]
        if (!rooms[id].next.includes(alt)) rooms[id].next.push(alt)
      }
    })
    for (const id of next) {
      if (!here.some((h) => rooms[h].next.includes(id))) {
        rooms[here[rng.int(0, here.length)]].next.push(id)
      }
    }
  }

  return { layerId, depth, seed, rooms, entrances: byFloor[0], floors }
}

/** The route the player plotted must actually be walkable. */
export function validRoute(map: DescentMap, route: number[]): boolean {
  if (!route.length) return false
  if (!map.entrances.includes(route[0])) return false
  for (let i = 1; i < route.length; i++) {
    if (!map.rooms[route[i - 1]].next.includes(route[i])) return false
  }
  return map.rooms[route[route.length - 1]].type === 'warden'
}

/** A reasonable default so the player is never staring at a blank map. */
export function autoRoute(map: DescentMap): number[] {
  const route = [map.entrances[0]]
  for (;;) {
    const last = map.rooms[route[route.length - 1]]
    if (last.type === 'warden' || !last.next.length) break
    // prefer the safest-looking next room
    const rank: Record<RoomType, number> = {
      empty: 0, cache: 1, shrine: 2, toll: 3, riddle: 4,
      fight: 5, elite: 6, door: 7, warden: 8,
    }
    const best = [...last.next].sort((a, b) => rank[map.rooms[a].type] - rank[map.rooms[b].type])[0]
    route.push(best)
  }
  return route
}

// ── resolution ─────────────────────────────────────────────────────────

/**
 * A fork of the real game, standing at the Descent's effective Rank. Reusing
 * the combat sim means crits, Burn, Signatures, armour and the class pipeline
 * all behave exactly as they do in the Column.
 */
function forkForDescent(s: GameState, rank: number): GameState {
  const g: GameState = {
    ...s,
    rank,
    bestRank: rank,
    enemyIndex: 0,
    enemiesThisRank: 999999, // never advance Rank inside a Descent
    events: [],
    inventory: [],
    descents: [],
    boneLevels: { ...s.boneLevels },
    treeLevels: { ...s.treeLevels },
    seen: { ...s.seen },
    soldier: {
      hp: new Decimal(s.soldier.hp),
      cooldown: 1,
      resolve: 0,
      shield: new Decimal(0),
    },
    bone: new Decimal(0),
    ash: new Decimal(0),
    ashSpentTotal: new Decimal(s.ashSpentTotal),
    ashSpentThisAscension: new Decimal(s.ashSpentThisAscension),
    bestAsh: new Decimal(0),
    lastAsh: new Decimal(0),
    sigStored: new Decimal(0),
    dead: false,
    standTimer: 0,
    standTimerMax: 0,
    silencedTicks: 0,
  }
  g.soldier.hp = computeStats(g).hp
  return g
}

type Ctx = {
  layer: LayerDef
  rank: number
  rng: Rng
  /** THE OSSUARY */
  bonePiles: number
  /** THE CHOIR */
  allies: number
}

/**
 * One room of fighting. The fork has `enemiesThisRank` set absurdly high so a
 * Descent never advances Rank — which means a killed enemy is immediately
 * replaced by the combat sim. So the loop counts KILLS rather than watching the
 * current enemy's health, and sets up each enemy itself.
 */
function fightRoom(
  g: GameState,
  ctx: Ctx,
  count: number,
  hpMult: number,
  atkMult: number,
): boolean {
  for (let i = 0; i < count && !g.dead; i++) {
    const e = spawnEnemy(ctx.rank, i + ctx.rng.int(0, 50), ctx.rng.state, 0, g.ghosts)
    if (ctx.layer.twist === 'exhibits' && g.ghosts.length) {
      // every room is a run of yours
      e.family = 'returned'
    }
    e.maxHp = e.maxHp.mul(hpMult)
    e.atk = e.atk.mul(atkMult)

    // THE CHOIR: they hold each other up while any of them still stand
    if (ctx.layer.twist === 'harmony') {
      const living = count - i
      e.atk = e.atk.mul(1 + 0.15 * (living - 1))
      e.maxHp = e.maxHp.mul(1 + 0.15 * (living - 1))
    }

    // THE OSSUARY: the piles are worth something. Applied to the enemy rather
    // than the player because it is equivalent for time-to-kill and does not
    // require faking a stat source.
    if (ctx.layer.twist === 'bonepiles' && ctx.bonePiles > 0) {
      e.maxHp = e.maxHp.div(1 + 0.02 * ctx.bonePiles)
    }

    e.hp = e.maxHp
    g.enemy = e

    const killsBefore = g.totalKills
    let guard = 0
    while (!g.dead && g.totalKills === killsBefore && guard++ < 2000) step(g, 5)

    if (g.totalKills === killsBefore) {
      // 100 seconds and it is still standing. That is a loss, not a stalemate.
      g.dead = true
      return false
    }
    ctx.bonePiles++
  }
  return !g.dead
}

function resolveRoom(
  g: GameState,
  ctx: Ctx,
  room: DescentRoom,
  loot: Relic[],
): RoomOutcome {
  const st = computeStats(g)
  let text = ''

  // THE DROWNED BARRACKS: every room costs you, permanently
  if (ctx.layer.twist === 'pressure') {
    g.soldier.hp = g.soldier.hp.sub(st.hp.mul(0.015))
  }

  switch (room.type) {
    case 'fight':
      fightRoom(g, ctx, 3 + ctx.rng.int(0, 4), 1, 1)
      text = g.dead ? 'It did not go your way.' : 'Cleared.'
      break
    case 'elite':
      // Bulkier and a bit meaner — NOT eight times meaner. Scaling health and
      // attack by the same number makes a Warden five times deadlier than the
      // Warden of the same name in the Column.
      fightRoom(g, ctx, 1, 3, 1.3)
      if (!g.dead) {
        loot.push(rollRelic(relicSeed(ctx.rank, loot.length, ctx.rng.state), ctx.rank, 0.6))
        text = 'Something big. It was carrying something.'
      } else text = 'Something big.'
      break
    case 'cache':
      loot.push(rollRelic(relicSeed(ctx.rank, loot.length + 77, ctx.rng.state), ctx.rank, 0.3))
      text = 'Left here on purpose. Not for you.'
      break
    case 'shrine': {
      // one of three, taken automatically — the choice was the route
      const pick = ctx.rng.int(0, 3)
      if (pick === 0) {
        g.soldier.hp = Decimal.min(st.hp, g.soldier.hp.add(st.hp.mul(0.3)))
        text = 'You are told to rest and you obey.'
      } else if (pick === 1) {
        ctx.bonePiles += 8
        text = 'Something is offered. You take it.'
      } else {
        g.soldier.shield = st.hp.mul(0.15)
        text = 'A thin cover, over you.'
      }
      break
    }
    case 'riddle': {
      // a genuine stat check, not a coin flip
      const need = enemyAtk(ctx.rank, 'chaff').mul(12)
      const passed = st.arm.gt(need) || st.atk.gt(need.mul(3)) || st.hp.gt(need.mul(20))
      if (passed) {
        loot.push(rollRelic(relicSeed(ctx.rank, loot.length + 991, ctx.rng.state), ctx.rank, 1.2))
        text = 'Only the heavy pass. You were heavy enough.'
      } else {
        g.soldier.hp = g.soldier.hp.sub(st.hp.mul(0.3))
        text = 'Only the heavy pass.'
      }
      break
    }
    case 'empty':
      g.soldier.hp = Decimal.min(st.hp, g.soldier.hp.add(st.hp.mul(0.25)))
      text = ctx.rng.pick([
        'Nothing here. The nothing is well kept.',
        'A room that was used for something once.',
        'Bunks, made. Dust, not disturbed.',
        'You sit down. Nobody says anything.',
      ])
      break
    case 'toll':
      g.soldier.hp = g.soldier.hp.sub(st.hp.mul(0.12))
      ctx.bonePiles += 14
      text = 'It wants paying and you can pay.'
      break
    case 'door':
      // skips ahead, at twice the danger
      ctx.rank = Math.round(ctx.rank * 1.3)
      text = 'You go through. It is further than it looked.'
      break
    case 'warden': {
      // the same shape as a Stand: eight times the health, 1.6x the bite
      fightRoom(g, ctx, 1, B.STAND_HP_MULT, B.STAND_ATK_MULT)
      const def = WARDEN_BY_ID[ctx.layer.wardenId]
      text = g.dead
        ? `${def?.name ?? 'It'} is still standing.`
        : (def?.defeatLine ?? 'It stops.')
      break
    }
  }

  if (g.soldier.hp.lte(0)) g.dead = true
  return {
    roomId: room.id,
    type: room.type,
    text,
    hpAfter: Decimal.max(g.soldier.hp, 0).toString(),
    died: g.dead,
  }
}

export function resolveDescent(
  s: GameState,
  map: DescentMap,
  route: number[],
  seed: number,
): DescentResult {
  const layer = LAYER_BY_ID[map.layerId]
  const rank = descentRank(s, layer, map.depth)
  const g = forkForDescent(s, rank)
  const ctx: Ctx = { layer, rank, rng: new Rng(seed >>> 0), bonePiles: 0, allies: 0 }

  const loot: Relic[] = []
  const rooms: RoomOutcome[] = []
  let diedAt: number | null = null

  for (const id of route) {
    let room = map.rooms[id]

    /**
     * NOWHERE: rooms delete themselves as you approach, and the route you
     * plotted stops being the route you are walking. You are not in control.
     * That is the point — so the re-route is real, not cosmetic.
     */
    if (ctx.layer.twist === 'erasure' && room.type !== 'warden' && ctx.rng.chance(0.45)) {
      const sameFloor = map.rooms.filter((r) => r.floor === room.floor && r.id !== room.id)
      const replacement = sameFloor.length ? ctx.rng.pick(sameFloor) : null
      if (replacement) {
        room = replacement
      } else {
        rooms.push({
          roomId: id,
          type: room.type,
          text: 'The room is not there. It was, on the way in.',
          hpAfter: Decimal.max(g.soldier.hp, 0).toString(),
          died: false,
        })
        continue
      }
    }

    const outcome = resolveRoom(g, ctx, room, loot)
    rooms.push(outcome)
    if (outcome.died) {
      diedAt = id
      break
    }
  }

  const cleared = diedAt === null
  const rewardMult = Math.pow(1.1, map.depth)
  const ash = cleared
    ? new Decimal(loot.reduce((a, r) => a + meltValue(r), 0))
        .add(rank)
        .mul(rewardMult)
        .mul(2)
        .floor()
    : new Decimal(0)

  // The Layer's Warden gives up a Name the first time it falls, ever.
  const first = !s.seen[`layer.${layer.id}`]
  const names = cleared && first ? 1 : 0

  return {
    cleared,
    diedAt,
    rooms,
    ash: ash.toString(),
    // dying still leaves you what you found on the way down
    relics: loot,
    names,
  }
}

/**
 * Live win probability. Roguelite route planning is only fun when you
 * understand the odds you are taking, so we show them rather than hide them.
 */
export function estimateClear(
  s: GameState,
  map: DescentMap,
  route: number[],
  samples = 24,
): number {
  if (!route.length) return 0
  let wins = 0
  for (let i = 0; i < samples; i++) {
    if (resolveDescent(s, map, route, hashSeed('est', map.seed, i)).cleared) wins++
  }
  return wins / samples
}

export function newDescent(
  s: GameState,
  map: DescentMap,
  route: number[],
): ActiveDescent {
  const seed = hashSeed('run', map.seed, s.descentsCleared, Math.floor(s.keys * 1000))
  return {
    id: `${map.layerId}-${map.seed.toString(36)}`,
    layerId: map.layerId,
    depth: map.depth,
    seed: map.seed,
    route,
    startedAt: Date.now(),
    durationMs: descentDurationMs(map.depth),
    result: resolveDescent(s, map, route, seed),
    collected: false,
  }
}

export function descentReady(d: ActiveDescent, now: number): boolean {
  return now - d.startedAt >= d.durationMs
}

export function layerNamesSpent(s: GameState): number {
  return s.layerNames
}

export const flagsFor = (s: GameState) => ({
  keystones: keystoneFlags(s.treeLevels),
  relics: equippedFlags(s.equipped),
})

export { enemyHp }
