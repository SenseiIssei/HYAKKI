import Decimal from 'break_infinity.js'

const SUFFIXES = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
  'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg',
]

/**
 * Numbers are the subject of this game, not a side effect. Below a million we
 * show every digit; above it, three significant figures and a suffix.
 * docs/03-COMBAT-MATH.md § 11
 */
export function fmt(d: Decimal | number, places = 2): string {
  const v = d instanceof Decimal ? d : new Decimal(d)
  if (!Number.isFinite(v.mantissa) || !Number.isFinite(v.exponent)) return '∞'
  if (v.lt(0)) return '-' + fmt(v.neg(), places)
  if (v.lt(1000)) {
    const n = v.toNumber()
    return Number.isInteger(n) ? n.toString() : n.toFixed(n < 10 ? 1 : 0)
  }
  if (v.lt(1e6)) return Math.floor(v.toNumber()).toLocaleString('en-US')

  const exp = Math.floor(v.log10())
  const tier = Math.floor(exp / 3)
  if (tier >= SUFFIXES.length) {
    return `${v.mantissa.toFixed(places)}e${v.exponent}`
  }
  const mantissa = v.div(Decimal.pow(10, tier * 3)).toNumber()
  return `${mantissa.toFixed(places)}${SUFFIXES[tier]}`
}

/** Whole numbers with separators — ranks, counts, soldier numbers. */
export function fmtInt(n: number): string {
  return Math.floor(n).toLocaleString('en-US')
}

export function fmtPct(n: number, places = 0): string {
  return `${(n * 100).toFixed(places)}%`
}

export function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}
