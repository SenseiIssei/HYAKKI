import Decimal from 'break_infinity.js'
import { BALANCE as B } from '../content/balance'
import { BONE_UPGRADE_BY_ID } from '../content/upgrades'
import { CLASS_BY_ID } from '../content/classes'
import { TREE, keystoneFlags } from '../content/tree'
import { AFFIX_BY_ID } from '../content/relics'
import { bandFor } from '../content/kegare'
import { equippedFlags, uniqueOf } from './relics'
import type { GameState, StatBlock } from './types'

const DECIMAL_STATS = ['hp', 'reg', 'atk', 'arm'] as const
type DecimalStat = (typeof DECIMAL_STATS)[number]

function baseStats() {
  return {
    hp: B.BASE_HP, reg: B.BASE_REG, atk: B.BASE_ATK, arm: B.BASE_ARM,
    spd: B.BASE_SPD, eva: B.BASE_EVA, cc: B.BASE_CC, cm: B.BASE_CM,
    pen: B.BASE_PEN, ls: B.BASE_LS, res: B.BASE_RES, bf: B.BASE_BF, af: B.BASE_AF,
    revive: 0, offline: 0, omen: 0,
  }
}
type BaseKey = keyof ReturnType<typeof baseStats>

/**
 * Strict composition order — never deviate:
 *   final = ((base + flatAdd) * (1 + sum(addPct))) * prod(mults)
 * docs/03-COMBAT-MATH.md § 2
 */
export function computeStats(s: GameState): StatBlock {
  const base = baseStats()
  const flat = Object.fromEntries(Object.keys(base).map((k) => [k, 0])) as Record<BaseKey, number>
  const add: Partial<Record<BaseKey, number>> = {}
  const mult: Partial<Record<BaseKey, number>> = {}

  const bump = (e: { kind: 'flat' | 'add' | 'mult'; stat: string; amount: number }, n: number) => {
    const key = e.stat as BaseKey
    if (!(key in base)) return
    if (e.kind === 'flat') flat[key] += e.amount * n
    else if (e.kind === 'add') add[key] = (add[key] ?? 0) + e.amount * n
    else mult[key] = (mult[key] ?? 1) * Math.pow(e.amount, n)
  }

  // Bone upgrades (run-scoped). Vow of Salt closes them entirely.
  if (!s.vows.includes('salt')) {
    for (const [id, level] of Object.entries(s.boneLevels)) {
      if (!level) continue
      const up = BONE_UPGRADE_BY_ID[id]
      if (up) bump(up.effect, level)
    }
  }

  // Ash tree (permanent). NULL ignores it completely — that is the whole class.
  if (s.classId !== 'null') {
    for (const node of TREE) {
      const level = s.treeLevels[node.id] ?? 0
      if (level) bump(node.effect, level)
    }
  }

  // Relic affixes. Issued through Named are additive/flat; the multiplicative
  // punch is reserved for the authored uniques below.
  // Vow of Poverty: you carry nothing, so none of this counts.
  const poverty = s.vows.includes('poverty')
  for (const r of poverty ? [] : s.equipped) {
    if (!r) continue
    for (const a of r.affixes) {
      const def = AFFIX_BY_ID[a.id]
      if (def) bump({ kind: def.kind, stat: def.stat, amount: a.value }, 1)
    }
    const u = uniqueOf(r)
    if (u?.mods) {
      for (const [k, v] of Object.entries(u.mods)) {
        mult[k as BaseKey] = (mult[k as BaseKey] ?? 1) * (v as number)
      }
    }
  }

  const cls = CLASS_BY_ID[s.classId]
  if (cls) {
    // Grants are flat, so a class's identity is already true at Rank 1.
    for (const [k, v] of Object.entries(cls.grant ?? {})) flat[k as BaseKey] += v as number
    for (const [k, v] of Object.entries(cls.curse)) {
      add[k as BaseKey] = (add[k as BaseKey] ?? 0) + (v as number)
    }
    for (const [k, v] of Object.entries(cls.passive ?? {})) {
      mult[k as BaseKey] = (mult[k as BaseKey] ?? 1) * (v as number)
    }
  }

  // ── KEGARE: what the road has left on you ──
  // Defilement buys damage and Ash and sells back healing and armour. The split
  // of kinds here is load-bearing: atk/reg/arm are MULTIPLICATIVE, but `af`
  // (ash find) is ADDITIVE, because a multiplicative modifier on income feeds
  // its own income and goes superexponential. See src/content/kegare.ts.
  const kb = bandFor(s.kegare)
  mult.atk = (mult.atk ?? 1) * kb.atk
  mult.reg = (mult.reg ?? 1) * kb.reg
  mult.arm = (mult.arm ?? 1) * kb.arm
  add.af = (add.af ?? 0) + kb.ash

  const val = (k: BaseKey) => (base[k] + flat[k]) * (1 + (add[k] ?? 0)) * (mult[k] ?? 1)

  const out = {} as StatBlock
  for (const k of Object.keys(base) as BaseKey[]) {
    const n = val(k)
    if ((DECIMAL_STATS as readonly string[]).includes(k)) {
      ;(out as unknown as Record<DecimalStat, Decimal>)[k as DecimalStat] = new Decimal(
        Math.max(0, n),
      )
    } else {
      ;(out as unknown as Record<string, number>)[k] = n
    }
  }

  // Vow of the Open Coat: your Armor is zero and stays zero.
  if (s.vows.includes('opencoat')) out.arm = new Decimal(0)

  // A curse you cannot buy your way out of.
  for (const k of cls?.zero ?? []) {
    if (k === 'hp' || k === 'reg' || k === 'atk' || k === 'arm') out[k] = new Decimal(0)
    else (out as unknown as Record<string, number>)[k] = 0
  }

  // ── keystones that reshape the stat block itself ──
  const f = keystoneFlags(s.treeLevels)
  const rf = equippedFlags(s.equipped)

  // True Names cost you something real.
  if (rf.has('skull')) out.hp = new Decimal(1)
  if (rf.has('longcoat')) out.arm = out.arm.mul(1.2)
  if (rf.has('firstash')) {
    const layers = (s.reveilles > 0 ? 1 : 0)
    out.atk = out.atk.mul(Math.pow(1.1, layers))
    out.hp = out.hp.mul(Math.pow(1.1, layers))
  }
  if (rf.has('letter')) out.af *= 1 + 0.01 * Math.floor(s.reveilles / 10)
  const ranksThisRun = Math.max(0, s.rank - 1)

  if (f.has('meat25')) out.reg = out.reg.add(out.hp.mul(0.005))
  if (f.has('meat100')) out.atk = out.atk.add(out.hp.mul(0.02))
  if (f.has('scar50')) out.arm = out.arm.add(ranksThisRun)
  if (f.has('scar100')) out.atk = out.atk.add(out.arm.mul(0.2))
  if (f.has('clot75')) out.reg = out.reg.mul(1 + 0.02 * ranksThisRun)
  if (f.has('marrow100')) out.ls *= 1.5
  if (f.has('edge25')) out.atk = out.atk.mul(1 + 0.01 * Math.floor(ranksThisRun / 10))
  if (f.has('haste25')) out.res += out.spd
  if (f.has('tithe50')) out.atk = out.atk.mul(1 + s.bone.div(1000).toNumber() * 0.01)
  if (f.has('return25')) out.revive = Math.min(1, out.revive)

  // Crit overflow: SPITE 25, or the Augur's own pipeline.
  if ((f.has('spite25') || s.classId === 'augur') && out.cc > 1) {
    out.cm += (out.cc - 1) * 2
    out.cc = 1
  }
  out.cc = Math.max(0, Math.min(1, out.cc))

  // AWL 25: penetration past 100% is never wasted.
  if (out.pen > 1) {
    if (f.has('awl25')) out.atk = out.atk.mul(1 + (out.pen - 1))
    out.pen = 1
  }
  out.pen = Math.max(0, out.pen)

  // Attack speed floor — a soldier that never swings is a softlock, not a build.
  out.spd = Math.max(0.05, out.spd)
  out.eva = Math.min(0.75, Math.max(0, out.eva))
  return out
}

/** Ticks between swings, minimum 1. */
export function attackCooldown(spd: number): number {
  return Math.max(1, Math.round(B.TICKS_PER_SEC / spd))
}
