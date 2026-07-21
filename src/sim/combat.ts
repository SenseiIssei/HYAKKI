import Decimal from 'break_infinity.js'
import { BALANCE as B } from '../content/balance'
import { CLASS_BY_ID } from '../content/classes'
import { DEATH_LINES } from '../content/names'
import { keystoneFlags } from '../content/tree'
import { WARDEN_BY_ID } from '../content/wardens'
import { INVENTORY_CAP } from '../content/relics'
import { currentTarget, spawnForRank, spawnGuard } from './enemies'
import { equippedFlags, meltValue, relicSeed, rollRelic } from './relics'
import { maxEchoes } from './ghosts'
import {
  boneFromKill,
  enemiesPerRank,
  isStandRank,
  mitigation,
  standTimerTicks,
} from './formulas'
import { Rng } from './rng'
import { attackCooldown, computeStats } from './stats'
import type { Enemy, GameState, StatBlock } from './types'

const ZERO = new Decimal(0)
type Flags = Set<string>

export function runSeed(s: GameState): number {
  return (s.soldierSeed + s.reveilles * 7919) >>> 0
}

const inStand = (s: GameState) => s.standTimer > 0

// ── damage ─────────────────────────────────────────────────────────────

function soldierHit(
  s: GameState,
  st: StatBlock,
  f: Flags,
  rf: Flags,
  rng: Rng,
): { dmg: Decimal; crit: boolean } {
  const target = currentTarget(s.enemy)
  const cls = CLASS_BY_ID[s.classId]
  // THE BLANK COAT takes your class away and pays for it in relic power.
  let pipeline =
    cls && !rf.has('blank')
      ? cls.pipeline(st, {
          rank: s.rank,
          deathsThisAscension: s.totalDeaths,
          reveilles: s.reveilles,
          echoes: s.echoes,
        })
      : 1

  if (rf.has('ninth')) pipeline *= 1.4 * (s.hitCounter % 9 === 8 ? 9 : 1)
  if (rf.has('deeptooth') && s.rank > 400) pipeline *= 1.6
  if (rf.has('count')) pipeline *= 1 + 0.004 * Math.max(0, s.rank - 1)
  if (rf.has('nothingheld') && target.family !== 'nothing') pipeline *= 0.4

  if (f.has('clot100') && s.soldier.hp.gte(st.hp.mul(0.9))) pipeline *= 1.25
  if (f.has('edge100') && target.hp.gte(target.maxHp.mul(0.8))) pipeline *= 1.3
  if (f.has('edge50') && s.freshEnemy) pipeline *= 3

  // FORESIGHT: certain, at double the multiplier.
  const forced = s.sigKind === 'foresight' && s.sigCharges > 0
  const streakCrit = f.has('spite100') && s.nonCritStreak >= 8
  const crit = forced || streakCrit || rng.chance(st.cc)

  let cm = st.cm
  if (forced) cm *= 2
  if (f.has('cruelty25') && s.enemy.isWarden) cm += 0.5
  if (f.has('cruelty50')) {
    const missing = 1 - target.hp.div(target.maxHp).toNumber()
    cm *= 1 + Math.max(0, Math.min(0.5, missing * 0.5))
  }
  const critMult = crit ? cm : 1

  if (crit) s.nonCritStreak = 0
  else s.nonCritStreak++
  if (forced) s.sigCharges--
  if (crit && f.has('spite75')) s.soldier.resolve = Math.min(B.RESOLVE_CAP, s.soldier.resolve + 5)
  if (crit && f.has('cruelty75')) target.armStripTicks = 20

  let pen = st.pen
  if (crit && f.has('spite50')) pen = Math.min(1, pen + 0.2)
  if (inStand(s) && f.has('awl75')) pen = Math.min(1, pen + 0.2)

  let effArm = target.arm.mul(Math.max(0, 1 - pen))
  if (target.armStripTicks > 0) effArm = effArm.mul(0.8)

  // AWL 50 — true damage. The floor is the enemy's protection, not ours.
  const through = f.has('awl50') ? 1 : mitigation(effArm, s.rank)

  const dmg = st.atk.mul(pipeline).mul(critMult).mul(through)
  return { dmg: Decimal.max(dmg, ZERO), crit }
}

function applyDamageToSoldier(s: GameState, st: StatBlock, f: Flags, raw: Decimal): Decimal {
  let taken = raw
  if (inStand(s) && f.has('scar25')) taken = taken.mul(0.9)

  // MEAT 50 — a single hit from above half health cannot finish you.
  const fromAbove = s.soldier.hp.gte(st.hp.mul(0.5))
  if (f.has('meat50') && fromAbove && taken.gte(s.soldier.hp)) {
    taken = s.soldier.hp.sub(1)
  }

  if (s.soldier.shield.gt(0)) {
    const absorbed = Decimal.min(s.soldier.shield, taken)
    s.soldier.shield = s.soldier.shield.sub(absorbed)
    taken = taken.sub(absorbed)
  }
  s.soldier.hp = s.soldier.hp.sub(taken)
  return taken
}

function heal(s: GameState, st: StatBlock, f: Flags, amount: Decimal) {
  const room = st.hp.sub(s.soldier.hp)
  const applied = Decimal.min(room, amount)
  s.soldier.hp = s.soldier.hp.add(applied)
  const over = amount.sub(applied)
  if (f.has('meat75') && over.gt(0)) {
    const cap = st.hp.mul(0.2)
    s.soldier.shield = Decimal.min(cap, s.soldier.shield.add(over))
  }
}

function lifesteal(s: GameState, st: StatBlock, f: Flags, dmg: Decimal) {
  if (st.ls <= 0) return
  let rate = st.ls
  if (inStand(s) && f.has('marrow75')) rate *= 2
  heal(s, st, f, dmg.mul(rate))
}

// ── signatures ─────────────────────────────────────────────────────────

function resolveThreshold(f: Flags, rf: Flags) {
  const base = f.has('resolve25') ? 90 : B.RESOLVE_CAP
  // BELL, CRACKED rings on the downstroke too.
  return rf.has('halfsig') ? base * 0.5 : base
}

function fireSignature(s: GameState, st: StatBlock, f: Flags, rf: Flags, rng: Rng) {
  const cls = CLASS_BY_ID[s.classId]
  // Vow of Silence, or THE BLANK COAT, or a Warden that silenced you.
  if (!cls || rf.has('blank') || s.vows.includes('silence') || s.silencedTicks > 0) return
  const strength = (f.has('resolve100') ? 1.3 : 1) * (rf.has('halfsig') ? 0.5 : 1)
  const keep = f.has('resolve50') && rng.chance(0.15)
  s.soldier.resolve = keep ? s.soldier.resolve : 0

  switch (cls.signature.id) {
    case 'brace':
      s.sigKind = 'brace'
      s.sigTicks = 30
      s.sigStored = ZERO
      break
    case 'flashpoint': {
      // Every remaining stack, spent at once: ~4.5s of burn in one hit.
      const target = currentTarget(s.enemy)
      const dmg = st.atk.mul(s.enemy.burn * B.BURN_PER_STACK * 45 * strength)
      target.hp = target.hp.sub(dmg)
      s.enemy.burn = 0
      s.events.push({ t: 'hit', target: 'enemy', amount: dmg, crit: true })
      break
    }
    case 'foresight':
      s.sigKind = 'foresight'
      s.sigCharges = Math.round(6 * strength)
      break
    case 'secondbody':
      // Not a heal — a stay of execution. See killSoldier.
      s.sigKind = 'secondbody'
      s.sigTicks = Math.round(60 * strength)
      break
    case 'thechoir': {
      const target = currentTarget(s.enemy)
      const dmg = st.atk.mul(4 * strength * Math.max(1, s.echoes))
      target.hp = target.hp.sub(dmg)
      s.events.push({ t: 'hit', target: 'enemy', amount: dmg, crit: true })
      break
    }
    case 'exhume':
      s.bone = s.bone.add(boneFromKill(s.rank, 'chaff', st.bf).mul(30 * strength))
      break
  }
  s.events.push({ t: 'signature', label: cls.signature.label })
}

function tickSignature(s: GameState, st: StatBlock, f: Flags) {
  if (s.sigKind === 'secondbody') {
    if (--s.sigTicks <= 0) s.sigKind = ''
    return
  }
  if (s.sigKind !== 'brace') return
  s.sigTicks--
  if (s.sigTicks > 0) return
  // BRACE ends: return everything it prevented, as one hit.
  const strength = f.has('resolve100') ? 1.3 : 1
  const dmg = s.sigStored.mul(strength)
  s.sigKind = ''
  s.sigStored = ZERO
  if (dmg.gt(0)) {
    const target = currentTarget(s.enemy)
    target.hp = target.hp.sub(dmg)
    s.events.push({ t: 'hit', target: 'enemy', amount: dmg, crit: true })
    lifesteal(s, st, f, dmg)
  }
}

// ── warden signatures ──────────────────────────────────────────────────

function tickWardenSignature(s: GameState) {
  const e = s.enemy
  if (!e.isWarden || e.sigTicks < 0) return
  e.sigTicks--
  e.tellTicks = e.sigTicks <= 15 && e.sigTicks > 0 ? e.sigTicks : 0
  if (e.sigTicks > 0) return

  const def = e.wardenId ? WARDEN_BY_ID[e.wardenId] : undefined
  e.sigCount++
  switch (e.wardenId) {
    case 'quartermaster':
      // ISSUE — three requisitions, interposed. They do not fight; they cost time.
      for (let i = 0; i < 3; i++) e.guards.push(spawnGuard(s.rank, e.sigCount * 3 + i, runSeed(s)))
      e.sigTicks = 220
      break
    case 'surgeon':
      // CONSENT — once, and only once.
      if (e.sigCount === 1) e.hp = Decimal.max(e.hp, e.maxHp.mul(0.6))
      e.sigTicks = e.sigCount >= 1 ? -1 : 200
      break
    case 'bell':
      s.soldier.resolve = 0
      e.sigTicks = 150
      break
    case 'columnshead':
      e.atkMult *= 1.08
      e.sigTicks = 30
      break
    case 'moth':
      e.untargetable = 40
      e.sigTicks = 260
      break
    case 'census':
      // COUNT — its health becomes everything you have killed this run.
      if (e.sigCount === 1) {
        e.maxHp = Decimal.max(e.maxHp, e.maxHp.mul(1 + s.killsThisRun / 200))
        e.hp = e.maxHp
      }
      e.sigTicks = e.sigCount >= 1 ? -1 : 200
      break
    case 'drownedsergeant':
      // ORDER — you are told to be quiet, and you are.
      s.silencedTicks = 120
      s.soldier.resolve = 0
      e.sigTicks = 220
      break
    case 'predecessor':
      // RECALL — it fights the way you fight, at ninety percent.
      e.atk = Decimal.max(e.atk, computeStats(s).atk.mul(0.9))
      e.atkMult *= 1.05
      e.sigTicks = 180
      break
    default:
      e.sigTicks = -1
  }
  if (def) s.events.push({ t: 'log', text: `${def.name} — ${def.signature}.` })
}

// ── progression ────────────────────────────────────────────────────────

function classifyDeath(s: GameState, st: StatBlock, lastHit: Decimal): string {
  const seconds = Math.round(s.runTicks / B.TICKS_PER_SEC)
  let key: keyof typeof DEATH_LINES = 'outscaled'
  if (lastHit.gte(st.hp.mul(0.45))) key = 'burst'
  else if (st.reg.gt(0) && s.enemy.atk.gt(st.reg.mul(2))) key = 'attrition'

  const rng = new Rng(s.rank * 31 + s.totalDeaths)
  const rate = s.enemy.atk.mul(s.enemy.spd).sub(st.reg)
  const n = rate.toNumber()
  return rng
    .pick(DEATH_LINES[key])
    .replace('{sec}', String(Math.max(1, Math.min(seconds, 99))))
    .replace('{rate}', Number.isFinite(n) ? n.toFixed(1) : rate.toString())
}

function killSoldier(s: GameState, st: StatBlock, f: Flags, lastHit: Decimal, rng: Rng) {
  // Vow of the Single Body: you do not get up again.
  const singleBody = s.vows.includes('singlebody')

  // SECOND BODY — the REVENANT keeps going for a moment after the killing blow.
  if (!singleBody && s.sigKind === 'secondbody' && s.sigTicks > 0) {
    s.soldier.hp = new Decimal(1)
    return
  }
  // RETURN — the revive line.
  const maxRevives = f.has('return50') ? 2 : 1
  if (!singleBody && s.revivesUsed < maxRevives && rng.chance(st.revive)) {
    s.revivesUsed++
    s.soldier.hp = st.hp.mul(f.has('return25') ? 0.4 : 0.15)
    if (f.has('return75')) s.immuneTicks = 50
    if (f.has('return100')) s.soldier.resolve = B.RESOLVE_CAP
    s.events.push({ t: 'revive' })
    return
  }
  s.soldier.hp = ZERO
  s.dead = true
  s.totalDeaths += 1
  s.deathCause = classifyDeath(s, st, lastHit)
  s.events.push({ t: 'death', rank: s.rank, cause: s.deathCause })
}

function beginRank(s: GameState, carryBurn: number) {
  s.enemyIndex = 0
  // Vow of Ten Thousand: the Ascension ends here, permanently.
  if (s.vows.includes('tenthousand') && s.rank > B.VOW_TEN_THOUSAND) {
    s.rank = B.VOW_TEN_THOUSAND
    s.dead = true
    s.deathCause = 'Ten thousand. You said you would stop and you have stopped.'
    s.events.push({ t: 'death', rank: s.rank, cause: s.deathCause })
    return
  }
  if (isStandRank(s.rank)) {
    s.enemiesThisRank = 1
    const first = !s.seen[`warden.${s.rank}`]
    s.standTimerMax = standTimerTicks(s.rank, first)
    s.standTimer = s.standTimerMax
    s.enemy = spawnFor(s, s.rank, 0, carryBurn)
    s.events.push({ t: 'stand', warden: s.enemy.name })
  } else {
    s.enemiesThisRank = enemiesPerRank(s.rank)
    // Vow of Haste, and the WARDEN class, put every Rank on the clock.
    const timedAlways = s.vows.includes('haste') || s.classId === 'warden'
    if (timedAlways) {
      s.standTimerMax = B.VOW_HASTE_TIMER * B.TICKS_PER_SEC
      s.standTimer = s.standTimerMax
    } else {
      s.standTimer = 0
    }
    s.enemy = spawnFor(s, s.rank, 0, carryBurn)
  }
  s.freshEnemy = true
}

function advanceRank(s: GameState, carryBurn: number, st: StatBlock, rng: Rng) {
  s.rank += 1
  if (s.rank > s.bestRank) s.bestRank = s.rank
  if (s.rank > s.bestRankEver) s.bestRankEver = s.rank
  s.events.push({ t: 'rank', rank: s.rank })

  // First clear of a milestone Rank, ever.
  if (MILESTONES.includes(s.rank) && !s.seen[`ms.${s.rank}`]) {
    s.seen[`ms.${s.rank}`] = true
    rollDrop(s, st, false, rng, true)
  }
  beginRank(s, carryBurn)
}

/** Ranks that always pay out, so progress is punctuated rather than uniform. */
const MILESTONES = [25, 100, 250, 500, 1000, 2500, 5000, 10000]

/** Drops are deterministic from (rank, kill count, run seed). */
function rollDrop(s: GameState, st: StatBlock, isWarden: boolean, rng: Rng, forced = false) {
  let bonus = st.omen
  if (!forced) {
    const chance = (isWarden ? B.RELIC_DROP_STAND : B.RELIC_DROP_BASE) * (1 + st.omen)
    if (!rng.chance(chance)) return
  } else {
    // A guaranteed drop should never be a shrug — but it must not be a jackpot
    // either, or Myths stop meaning anything.
    bonus += 1
  }
  // The very first relic is the tutorial for the whole system; make it read.
  if (!s.seen.firstRelic) bonus += 1
  const relic = rollRelic(relicSeed(s.rank, s.totalKills, runSeed(s)), s.rank, bonus)
  s.seen.firstRelic = true
  if (s.inventory.length >= INVENTORY_CAP) {
    // Inventory full: melt it rather than silently dropping it on the floor.
    s.ash = s.ash.add(meltValue(relic))
    s.events.push({ t: 'log', text: 'Something was left behind. It burned.' })
    return
  }
  s.inventory.push(relic)
  s.events.push({ t: 'relic', relic })
}

function onEnemyKilled(s: GameState, st: StatBlock, f: Flags, overkill: Decimal, rng: Rng) {
  const e = s.enemy
  const wasWarden = e.isWarden
  // Your first Warden always leaves something behind — otherwise a player can
  // reach Reveille 3 without ever meeting the relic system.
  rollDrop(s, st, wasWarden, rng, wasWarden && !s.seen.firstRelic)

  let bone = boneFromKill(s.rank, wasWarden ? 'warden' : e.family, st.bf)
  if (wasWarden && f.has('tithe100')) bone = bone.mul(3)
  // Vow of Salt: you gain no Bone at all.
  if (s.vows.includes('salt')) bone = ZERO
  s.bone = s.bone.add(bone)
  s.killsThisRun += 1
  s.totalKills += 1
  s.events.push({ t: 'kill', bone, name: e.name })

  if (f.has('clot50')) heal(s, st, f, st.hp.mul(0.02))
  if (f.has('marrow50') && st.ls > 0 && overkill.gt(0)) heal(s, st, f, overkill.mul(st.ls))
  if (f.has('haste75')) {
    s.killSpdStacks = Math.min(5, s.killSpdStacks + 1)
    s.killSpdTicks = 20
  }

  if (wasWarden) {
    s.standsThisRun += 1
    s.standTimer = 0
    s.seen[`warden.${s.rank}`] = true
    const def = e.wardenId ? WARDEN_BY_ID[e.wardenId] : undefined
    if (def) s.events.push({ t: 'standWon', line: def.defeatLine })
  }

  const carry = e.burn * B.BURN_CARRY
  s.enemyIndex += 1
  if (s.enemyIndex >= s.enemiesThisRank) {
    advanceRank(s, carry, st, rng)
  } else {
    s.enemy = spawnFor(s, s.rank, s.enemyIndex, carry)
    s.freshEnemy = true
  }
}

function failStand(s: GameState, st: StatBlock, f: Flags) {
  s.standFails += 1
  s.events.push({ t: 'standLost', rank: s.rank })
  if (s.standFails >= B.STAND_FAILS_TO_END) {
    s.soldier.hp = ZERO
    s.dead = true
    s.totalDeaths += 1
    s.deathCause = 'The Stand closed. You were still outside it.'
    s.events.push({ t: 'death', rank: s.rank, cause: s.deathCause })
    return
  }
  // Pushed back, not killed. A Stand is a check, not a coin flip.
  s.rank = Math.max(1, s.rank - B.STAND_PUSHBACK)
  void st
  void f
  beginRank(s, 0)
}

// ── the tick ───────────────────────────────────────────────────────────

export function tick(s: GameState, st: StatBlock, f: Flags, rf: Flags, rng: Rng): void {
  if (s.dead) return

  s.runTicks += 1
  s.totalTicks += 1
  if (s.immuneTicks > 0) s.immuneTicks--
  if (s.silencedTicks > 0) s.silencedTicks--
  if (s.killSpdTicks > 0 && --s.killSpdTicks === 0) s.killSpdStacks = 0
  if (s.enemy.armStripTicks > 0) s.enemy.armStripTicks--

  // THE WOUND'S OWN BLADE is always in your hand and always in you.
  if (rf.has('woundblade')) {
    const bleed = st.hp.mul(0.12).div(B.TICKS_PER_SEC)
    s.soldier.hp = s.soldier.hp.sub(bleed)
    if (s.soldier.hp.lte(0)) {
      killSoldier(s, st, f, bleed, rng)
      return
    }
  }

  // ORGANS pulse: it does not aim at you. It aims at the ones behind you.
  if (s.enemy.family === 'organs' && s.echoes > 0) {
    if (s.runTicks % 40 === 0) {
      s.echoes -= 1
      s.events.push({ t: 'echoLost' })
    }
  }

  // ── stand timer ──
  if (inStand(s)) {
    s.standTimer--
    if (s.standTimer <= 0) {
      failStand(s, st, f)
      return
    }
  }

  // ── regeneration ──
  if (st.reg.gt(0)) {
    let reg = st.reg
    if (inStand(s) && f.has('clot25')) reg = reg.mul(3)
    heal(s, st, f, reg.div(B.TICKS_PER_SEC))
  }

  tickSignature(s, st, f)
  tickWardenSignature(s)

  // MOTH: the hit that lands when it stops going around.
  if (s.enemy.untargetable > 0 && --s.enemy.untargetable === 0) {
    const taken = applyDamageToSoldier(s, st, f, s.enemy.atk.mul(4))
    s.events.push({ t: 'hit', target: 'soldier', amount: taken, crit: true })
    if (s.soldier.hp.lte(0)) {
      killSoldier(s, st, f, taken, rng)
      return
    }
  }

  // ── burn ──
  const target = currentTarget(s.enemy)
  if (s.enemy.burn > 0.01 && s.enemy.untargetable === 0) {
    let per = B.BURN_PER_STACK
    if (f.has('edge75')) per *= 1.05
    if (f.has('cruelty100')) per *= st.cm
    const dmg = st.atk.mul(s.enemy.burn * per)
    target.hp = target.hp.sub(dmg)
    // LANTERN OF THE UNRETURNED: the fire does not go out during a Stand.
    if (!(rf.has('lantern') && inStand(s))) s.enemy.burn *= B.BURN_DECAY
    if (f.has('marrow25')) lifesteal(s, st, f, dmg)
    if (target.hp.lte(0)) {
      if (target === s.enemy) return onEnemyKilled(s, st, f, target.hp.neg(), rng)
      s.enemy.guards.shift()
      s.freshEnemy = true
      return
    }
  } else if (s.enemy.burn <= 0.01) {
    s.enemy.burn = 0
  }

  // ── soldier swings ──
  let spd = st.spd
  if (inStand(s) && f.has('haste100')) spd *= 1.5
  if (s.killSpdStacks > 0) spd *= 1 + 0.3 * s.killSpdStacks

  s.soldier.cooldown -= 1
  const freeHit = f.has('haste50') && s.hitCounter > 0 && s.hitCounter % 10 === 0
  if (s.soldier.cooldown <= 0 || freeHit) {
    if (s.enemy.untargetable > 0) {
      s.soldier.cooldown = 1 // nothing to hit; do not bank swings
    } else {
      s.soldier.cooldown = attackCooldown(spd)
      s.hitCounter++
      const tgt = currentTarget(s.enemy)
      const { dmg, crit } = soldierHit(s, st, f, rf, rng)
      tgt.hp = tgt.hp.sub(dmg)
      s.freshEnemy = false
      s.events.push({ t: 'hit', target: 'enemy', amount: dmg, crit })

      if (CLASS_BY_ID[s.classId]?.applies === 'burn') s.enemy.burn += 1
      lifesteal(s, st, f, dmg)

      if (tgt.hp.lte(0)) {
        const overkill = tgt.hp.neg()
        if (tgt === s.enemy) {
          onEnemyKilled(s, st, f, overkill, rng)
          return
        }
        s.enemy.guards.shift()
        s.freshEnemy = true
        return
      }
    }
  }

  // ── enemy swings ──
  s.enemy.cooldown -= 1
  if (s.enemy.cooldown <= 0) {
    s.enemy.cooldown = attackCooldown(s.enemy.spd)
    if (s.immuneTicks > 0) {
      s.events.push({ t: 'miss', target: 'soldier' })
    } else if (rng.chance(st.eva)) {
      s.events.push({ t: 'miss', target: 'soldier' })
    } else {
      let raw = s.enemy.atk.mul(s.enemy.atkMult)
      if (f.has('awl100')) raw = raw.mul(Math.max(0.2, 1 - st.pen))
      const kScale = f.has('scar75') ? 0.95 : 1
      raw = raw.mul(mitigation(st.arm, s.rank, kScale))

      if (s.sigKind === 'brace') {
        // Take nothing. Remember all of it.
        s.sigStored = s.sigStored.add(raw)
        s.events.push({ t: 'miss', target: 'soldier' })
      } else {
        const taken = applyDamageToSoldier(s, st, f, raw)
        s.events.push({ t: 'hit', target: 'soldier', amount: taken, crit: false })

        // Resolve fills from time AND danger, so Signatures fire when needed.
        let res = st.res
        if (inStand(s) && f.has('resolve75')) res *= 1.5
        const dangerFrac = taken.div(st.hp).toNumber()
        s.soldier.resolve = Math.min(
          B.RESOLVE_CAP,
          s.soldier.resolve + (B.RESOLVE_BASE_GAIN + dangerFrac * B.RESOLVE_DAMAGE_SCALE) * res,
        )

        if (s.soldier.hp.lte(0)) {
          killSoldier(s, st, f, taken, rng)
          return
        }
      }
    }
  }

  // ── signature fires ──
  if (s.sigKind === '' && s.soldier.resolve >= resolveThreshold(f, rf)) {
    fireSignature(s, st, f, rf, rng)
  }
}

/** Advance `ticks` ticks. Returns the stat block used, for the UI. */
export function step(s: GameState, ticks: number): StatBlock {
  let st = computeStats(s)
  const f = keystoneFlags(s.treeLevels)
  const rf = equippedFlags(s.equipped)
  const rng = new Rng(s.rngState)
  let rankAtRecompute = s.rank
  for (let i = 0; i < ticks && !s.dead; i++) {
    // Several keystones scale with Ranks cleared this run, so the stat block is
    // refreshed on Rank change rather than every tick.
    if (s.rank !== rankAtRecompute) {
      st = computeStats(s)
      rankAtRecompute = s.rank
      s.echoes = Math.min(s.echoes, maxEchoes(s))
    }
    tick(s, st, f, rf, rng)
  }
  s.rngState = rng.state
  return computeStats(s)
}

export type { Enemy }
