import { NAME_SHOP, nameCost } from '../content/nameshop'
import { VOWS, vowAshMult } from '../content/vows'
import { fmt, fmtInt } from '../format'
import {
  buyName,
  doInterment,
  game,
  intermentReady,
  namesProjection,
  toggleVow,
  useUI,
  vowSlotCount,
} from '../store/gameStore'

/**
 * Interment, Names and Vows — prestige tier 2. Names are slow and buy things
 * that are not numbers; Vows are difficulty the player writes themselves.
 * docs/05-PROGRESSION.md
 */
export function Bargain() {
  useUI((s) => s.frame)
  const g = game()
  const close = useUI((s) => s.setBargain)
  const names = namesProjection()
  const ready = intermentReady()
  const slots = vowSlotCount()
  const mult = vowAshMult(g.vows)

  return (
    <div className="drawer-scrim" onClick={() => close(false)}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2>The Bargain</h2>
            <span className="drawer-sub">
              {g.interments === 0
                ? 'nothing here is a number'
                : `interred ${fmtInt(g.interments)} times`}
            </span>
          </div>
          <div className="drawer-head-right">
            <span className="ash-total">✦ {fmtInt(g.names)}</span>
            <button className="small-btn" onClick={() => close(false)}>
              Close
            </button>
          </div>
        </header>

        <div className="bargain-grid">
          {/* ── interment ── */}
          <section className="trunk">
            <div className="trunk-head">
              <span className="trunk-name">INTERMENT</span>
              <span className="trunk-blurb">be buried; something else gets up</span>
            </div>
            <div className="node">
              <p className="hint">
                Everything the Ash bought is unmade — the whole tree, every level, every
                keystone. What survives is Names.
              </p>
              <div className="inter-award">
                <span className="inter-number">{fmtInt(names)}</span>
                <span className="ash-word">Names</span>
              </div>
              <div className="hint">
                {fmt(g.ashSpentThisAscension)} Ash spent this Ascension
                {g.wardenNames > 0 && ` · ${g.wardenNames} taken from Wardens`}
              </div>
              <button
                className="node-buy"
                disabled={!ready}
                onClick={() => {
                  if (confirm(`Be interred for ${names} Names? The tree burns.`)) doInterment()
                }}
              >
                <span>{ready ? 'BE INTERRED' : 'NOT YET WORTH A NAME'}</span>
              </button>
            </div>
          </section>

          {/* ── the name shop ── */}
          <section className="trunk">
            <div className="trunk-head">
              <span className="trunk-name">WHAT NAMES BUY</span>
              <span className="trunk-blurb">✦ {fmtInt(g.names)} held</span>
            </div>
            {NAME_SHOP.map((p) => {
              const owned = g.purchases[p.id] ?? 0
              const maxed = owned >= p.max
              const cost = nameCost(p, owned)
              const afford = g.names >= cost && !maxed
              return (
                <div key={p.id} className="node">
                  <div className="node-head">
                    <span className="node-name">{p.label}</span>
                    <span className="node-level">
                      {p.max > 1 ? `${owned}/${p.max}` : owned ? 'held' : ''}
                    </span>
                  </div>
                  <div className="node-blurb">{p.blurb}</div>
                  <button
                    className="node-buy"
                    disabled={!afford}
                    onClick={() => buyName(p.id)}
                  >
                    <span>{maxed ? 'YOURS' : 'TAKE'}</span>
                    {!maxed && (
                      <span className={afford ? 'afford' : 'poor'}>✦ {cost}</span>
                    )}
                  </button>
                </div>
              )
            })}
          </section>

          {/* ── vows ── */}
          <section className="trunk">
            <div className="trunk-head">
              <span className="trunk-name">VOWS</span>
              <span className="trunk-blurb">
                {g.vows.length}/{slots} sworn · Ash ×{mult.toFixed(1)}
              </span>
            </div>
            <p className="hint">
              Sworn for the whole Ascension. Swearing or breaking one starts the run again.
            </p>
            {VOWS.map((v) => {
              const on = g.vows.includes(v.id)
              const full = g.vows.length >= slots && !on
              return (
                <button
                  key={v.id}
                  className={`node vow ${on ? 'sworn' : ''}`}
                  disabled={full}
                  onClick={() => {
                    if (confirm(on ? `Break the ${v.name}?` : `Swear the ${v.name}?`))
                      toggleVow(v.id)
                  }}
                >
                  <div className="node-head">
                    <span className="node-name">{v.name}</span>
                    <span className="vow-mult">×{v.ashMult.toFixed(1)}</span>
                  </div>
                  <div className="vow-down">{v.downside}</div>
                  {(v.nameMult || v.extraNames) && (
                    <div className="vow-bonus">
                      {v.nameMult ? `Names ×${v.nameMult}` : ''}
                      {v.nameMult && v.extraNames ? ' · ' : ''}
                      {v.extraNames ? `+${v.extraNames} Name per Interment` : ''}
                    </div>
                  )}
                </button>
              )
            })}
          </section>
        </div>

        <footer className="drawer-foot">
          <span className="hint">
            Four slots of the right Vows is roughly a ×30 swing. It is difficulty you wrote.
          </span>
        </footer>
      </div>
    </div>
  )
}
