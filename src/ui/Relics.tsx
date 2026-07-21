import { useMemo, useState } from 'react'
import { AFFIX_BY_ID, RARITIES, RARITY_ORDER, type Rarity } from '../content/relics'
import { meltValue, relicLabel, uniqueOf } from '../sim/relics'
import type { Relic } from '../sim/types'
import { fmt, fmtInt, fmtPct } from '../format'
import {
  compare,
  equipRelic,
  game,
  meltBelow,
  meltRelic,
  slotCount,
  unequipRelic,
  useUI,
} from '../store/gameStore'
import { COLORS } from '../render/presets'
import { Sigil } from './Sigil'

const relicSigil = {
  symmetry: 4, rings: 2, strokeWeight: 1.3, density: 0.55,
  coreFill: 'hollow' as const, jitter: 0.4, openness: 0.3,
}

function rarityColor(r: Rarity) {
  switch (r) {
    case 'myth': return COLORS.gold
    case 'truename': return COLORS.ichor
    case 'named': return COLORS.blood
    case 'kept': return COLORS.bone
    default: return COLORS.ash
  }
}

function affixLine(a: { id: string; value: number }) {
  const def = AFFIX_BY_ID[a.id]
  if (!def) return null
  const v =
    def.kind === 'add'
      ? `+${fmtPct(a.value, 0)}`
      : def.stat === 'cc' || def.stat === 'eva' || def.stat === 'ls' || def.stat === 'pen'
        ? `+${fmtPct(a.value, 1)}`
        : `+${a.value.toFixed(1)}`
  return `${def.label} · ${v} ${def.stat.toUpperCase()}`
}

function RelicCard({
  relic,
  equippedSlot,
  onSelect,
  selected,
}: {
  relic: Relic
  equippedSlot?: number
  onSelect?: () => void
  selected?: boolean
}) {
  const u = uniqueOf(relic)
  const color = rarityColor(relic.rarity)
  return (
    <button
      className={`relic ${selected ? 'sel' : ''}`}
      style={{ borderColor: selected ? color : undefined }}
      onClick={onSelect}
      aria-label={`${relicLabel(relic)}, ${RARITIES[relic.rarity].label}`}
    >
      <Sigil
        preset={relicSigil}
        seed={relic.seed}
        cacheKey={`r-${relic.uid}`}
        color={color}
        spin={520}
        className="relic-sigil"
      />
      <span className="relic-body">
        <span className="relic-name" style={{ color }}>
          {relicLabel(relic)}
        </span>
        <span className="relic-rarity">
          {RARITIES[relic.rarity].label}
          {equippedSlot !== undefined ? ` · slot ${equippedSlot + 1}` : ''}
          {` · found at Rank ${fmtInt(relic.dropRank)}`}
        </span>
        {relic.affixes.map((a) => (
          <span key={a.id} className="relic-affix">
            {affixLine(a)}
          </span>
        ))}
        {u?.cost && <span className="relic-cost">{u.cost}</span>}
        {u && <span className="relic-line">{u.line}</span>}
      </span>
    </button>
  )
}

/**
 * The comparison card. Never make the player do arithmetic — we run the real
 * sim with and without the relic and report the difference.
 */
function Comparison({ relic }: { relic: Relic }) {
  const g = game()
  const cmp = useMemo(() => compare(relic), [relic, g.rank, g.equipped])
  const dps = cmp.dpsDelta
  const surv = cmp.survivalDelta
  const arrow = (v: number) => (v > 0.001 ? '▲' : v < -0.001 ? '▼' : '—')
  const cls = (v: number) => (v > 0.001 ? 'up' : v < -0.001 ? 'down' : 'flat')

  return (
    <div className="cmp">
      <div className="cmp-head">
        versus equipped{cmp.intoEmptySlot ? ' (empty slot)' : ` (slot ${cmp.slot + 1})`}
      </div>
      <div className={`cmp-row ${cls(dps)}`}>
        <span>{arrow(dps)} effective damage</span>
        <span>{(dps * 100).toFixed(1)}%</span>
      </div>
      <div className={`cmp-row ${cls(surv)}`}>
        <span>{arrow(surv)} survival time</span>
        <span>
          {/* A percentage against infinity is a lie. Say what actually happens. */}
          {!Number.isFinite(cmp.survivalNext) && !Number.isFinite(cmp.survivalNow)
            ? 'holds either way'
            : !Number.isFinite(cmp.survivalNext)
              ? 'holds indefinitely'
              : !Number.isFinite(cmp.survivalNow)
                ? `falls to ${cmp.survivalNext.toFixed(0)}s`
                : `${(surv * 100).toFixed(1)}%`}
        </span>
      </div>
      <div className="cmp-note">measured over 60 seconds of simulated combat at Rank {fmtInt(g.rank)}</div>
      <div className="cmp-actions">
        <button className="small-btn" onClick={() => equipRelic(relic.uid, cmp.slot)}>
          Equip
        </button>
        <button className="small-btn" onClick={() => meltRelic(relic.uid)}>
          Melt · ◈ {fmt(meltValue(relic))}
        </button>
      </div>
    </div>
  )
}

export function Relics() {
  useUI((s) => s.frame)
  const g = game()
  const close = useUI((s) => s.setRelics)
  const [sel, setSel] = useState<string | null>(null)
  const [sort, setSort] = useState<'newest' | 'rarity'>('newest')

  const slots = slotCount()
  const inv = useMemo(() => {
    const list = [...g.inventory]
    if (sort === 'rarity') {
      list.sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity))
    } else list.reverse()
    return list
  }, [g.inventory, sort, g.inventory.length])

  const selected = inv.find((r) => r.uid === sel) ?? null

  return (
    <div className="drawer-scrim" onClick={() => close(false)}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2>What You Carry</h2>
            <span className="drawer-sub">
              everything here was carried in by someone · {fmtInt(g.inventory.length)}/40 held
            </span>
          </div>
          <div className="drawer-head-right">
            <span className="buymode">
              {(['newest', 'rarity'] as const).map((m) => (
                <button key={m} data-on={sort === m} onClick={() => setSort(m)}>
                  {m.toUpperCase()}
                </button>
              ))}
            </span>
            <button className="small-btn" onClick={() => close(false)}>
              Close
            </button>
          </div>
        </header>

        <div className="relic-body-grid">
          <section className="slots">
            <div className="trunk-head">
              <span className="trunk-name">WORN</span>
              <span className="trunk-blurb">
                {slots} slots
                {slots < 6 ? ' · more open as you go deeper' : ''}
              </span>
            </div>
            {Array.from({ length: slots }).map((_, i) => {
              const r = g.equipped[i]
              return r ? (
                <div key={i} className="slot-filled">
                  <RelicCard relic={r} equippedSlot={i} />
                  <button className="small-btn" onClick={() => unequipRelic(i)}>
                    Take off
                  </button>
                </div>
              ) : (
                <div key={i} className="slot-empty">
                  empty
                </div>
              )
            })}
          </section>

          <section className="inv">
            <div className="trunk-head">
              <span className="trunk-name">HELD</span>
              <span className="trunk-blurb">select one to compare</span>
            </div>
            {inv.length === 0 && (
              <div className="hint">
                Nothing yet. Things turn up on the dead, and more often on Wardens.
              </div>
            )}
            <div className="inv-list">
              {inv.map((r) => (
                <RelicCard
                  key={r.uid}
                  relic={r}
                  selected={sel === r.uid}
                  onSelect={() => setSel(sel === r.uid ? null : r.uid)}
                />
              ))}
            </div>
          </section>

          <section className="cmp-panel">
            <div className="trunk-head">
              <span className="trunk-name">WEIGH</span>
            </div>
            {selected ? (
              <Comparison relic={selected} />
            ) : (
              <div className="hint">Select something you are carrying.</div>
            )}
          </section>
        </div>

        <footer className="drawer-foot">
          <span className="hint">Melting returns Ash. Nothing is ever wasted, only spent.</span>
          <span className="panel-row">
            {(['issued', 'kept', 'named'] as const).map((r) => (
              <button
                key={r}
                className="small-btn"
                onClick={() => {
                  if (confirm(`Melt everything ${RARITIES[r].label} and below?`)) meltBelow(r)
                }}
              >
                Melt ≤ {RARITIES[r].label}
              </button>
            ))}
          </span>
        </footer>
      </div>
    </div>
  )
}
