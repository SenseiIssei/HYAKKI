import { useState } from 'react'
import { ICHOR_RULES, ichorCost } from '../content/ichor'
import { FRAGMENTS } from '../content/fragments'
import { myriadHp } from '../sim/myriad'
import type { MyriadResult } from '../sim/myriad'
import { fmt, fmtInt } from '../format'
import {
  ascendReady,
  buyRule,
  canFightMyriad,
  challengeMyriad,
  doApotheosis,
  game,
  ichorProjection,
  useUI,
} from '../store/gameStore'

/**
 * Prestige tier 3. Ichor buys RULES — it edits the curves the rest of the game
 * is made of. docs/03-COMBAT-MATH.md § 8, docs/14-NARRATIVE.md
 */
export function Ascend() {
  useUI((s) => s.frame)
  const g = game()
  const close = useUI((s) => s.setAscend)
  const [tab, setTab] = useState<'ascend' | 'archive'>('ascend')
  const [fight, setFight] = useState<MyriadResult | null>(null)

  const ichor = ichorProjection()
  const ready = ascendReady()
  const read = FRAGMENTS.filter((f) => g.fragments.includes(f.n))

  return (
    <div className="drawer-scrim" onClick={() => close(false)}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2>{tab === 'ascend' ? 'Apotheosis' : 'The Archive'}</h2>
            <span className="drawer-sub">
              {g.apotheoses === 0
                ? 'the god’s death is still happening'
                : `ascended ${fmtInt(g.apotheoses)} times`}
            </span>
          </div>
          <div className="drawer-head-right">
            <span className="buymode">
              <button data-on={tab === 'ascend'} onClick={() => setTab('ascend')}>
                RULES
              </button>
              <button data-on={tab === 'archive'} onClick={() => setTab('archive')}>
                ARCHIVE {read.length}/{FRAGMENTS.length}
              </button>
            </span>
            <span className="ichor-total">✧ {fmtInt(g.ichor)}</span>
            <button className="small-btn" onClick={() => close(false)}>
              Close
            </button>
          </div>
        </header>

        {tab === 'archive' ? (
          <div className="archive">
            {read.length === 0 && (
              <p className="hint">
                Nothing yet. They turn up on their own, the further in you get.
              </p>
            )}
            {([1, 2, 3] as const).map((act) => {
              const inAct = read.filter((f) => f.act === act)
              if (!inAct.length) return null
              return (
                <section key={act} className="archive-act">
                  <div className="trunk-head">
                    <span className="trunk-name">
                      {act === 1 ? 'THE MARCH' : act === 2 ? 'THE COUNT' : 'THE TURN'}
                    </span>
                    <span className="trunk-blurb">
                      {inAct.length} of {FRAGMENTS.filter((f) => f.act === act).length}
                    </span>
                  </div>
                  {inAct.map((f) => (
                    <article key={f.n} className="fragment">
                      <div className="frag-head">
                        <span className="frag-n">#{f.n}</span>
                        <span className="frag-title">{f.title}</span>
                      </div>
                      <p className="frag-text">{f.text}</p>
                    </article>
                  ))}
                </section>
              )
            })}
          </div>
        ) : (
          <div className="bargain-grid">
            {/* ── ascend ── */}
            <section className="trunk">
              <div className="trunk-head">
                <span className="trunk-name">ASCEND</span>
              </div>
              <div className="node">
                <p className="hint">
                  Everything Names bought is unmade — the classes, the slots, the Layers,
                  the whole tree beneath them. What survives is Ichor, the rules it buys,
                  what you have read, and the dead.
                </p>
                <div className="inter-award">
                  <span className="ichor-number">{fmtInt(ichor)}</span>
                  <span className="ash-word">Ichor</span>
                </div>
                <div className="hint">{fmtInt(g.namesSpentTotal)} Names spent this Ascension</div>
                <button
                  className="node-buy"
                  disabled={!ready}
                  onClick={() => {
                    if (confirm(`Ascend for ${ichor} Ichor? Everything below burns.`))
                      doApotheosis()
                  }}
                >
                  <span>{ready ? 'ASCEND' : 'NOT YET'}</span>
                </button>
              </div>

              {g.authored && (
                <div className="node">
                  <div className="node-head">
                    <span className="node-name">WHAT YOU LEFT BEHIND</span>
                  </div>
                  <div className="node-blurb">
                    Soldier #{fmtInt(g.authored.soldierNumber)} · {g.authored.classId} · got as
                    far as Rank {fmtInt(g.authored.deepestRank)}
                  </div>
                  <div className="node-key-text">
                    It is down there now, waiting for whoever you are next.
                  </div>
                </div>
              )}
            </section>

            {/* ── the rules ── */}
            <section className="trunk">
              <div className="trunk-head">
                <span className="trunk-name">WHAT ICHOR BUYS</span>
                <span className="trunk-blurb">rules, not numbers</span>
              </div>
              {ICHOR_RULES.map((r) => {
                const owned = g.rules[r.id] ?? 0
                const maxed = owned >= r.max
                const cost = ichorCost(r, owned)
                const afford = g.ichor >= cost && !maxed
                return (
                  <div key={r.id} className="node">
                    <div className="node-head">
                      <span className="node-name">{r.label}</span>
                      <span className="node-level">
                        {r.max > 1 ? `${owned}/${r.max}` : owned ? 'held' : ''}
                      </span>
                    </div>
                    <div className="node-blurb">{r.rule}</div>
                    <div className="node-key-text">{r.why}</div>
                    <button className="node-buy" disabled={!afford} onClick={() => buyRule(r.id)}>
                      <span>{maxed ? 'YOURS' : 'TAKE'}</span>
                      {!maxed && <span className={afford ? 'afford' : 'poor'}>✧ {cost}</span>}
                    </button>
                  </div>
                )
              })}
            </section>

            {/* ── the myriad ── */}
            <section className="trunk">
              <div className="trunk-head">
                <span className="trunk-name">THE MYRIAD</span>
              </div>
              <div className="node myriad-node">
                {g.myriadFelled ? (
                  <>
                    <p className="frag-text">
                      It came apart into ten thousand and every one of them was wearing your
                      coat. The number on your coat does not change any more.
                    </p>
                    <div className="inter-award">
                      <span className="ichor-number">#10,000</span>
                    </div>
                  </>
                ) : canFightMyriad() ? (
                  <>
                    <p className="frag-text">
                      Ten thousand small sigils arranged in the shape of one enormous soldier.
                      Its health is the sum of every run you have recorded.
                    </p>
                    <div className="myriad-stat">
                      <span>made from</span>
                      <span>{fmtInt(g.ghosts.length)} of you</span>
                    </div>
                    <div className="myriad-stat">
                      <span>health</span>
                      <span>{fmt(myriadHp(g))}</span>
                    </div>
                    {fight && (
                      <>
                        <p className="frag-text">{fight.line}</p>
                        <div className="myriad-stat">
                          <span>you are short by</span>
                          <span>
                            {fight.shortBy <= 0
                              ? 'nothing'
                              : `${fight.shortBy.toFixed(1)} orders of magnitude`}
                          </span>
                        </div>
                      </>
                    )}
                    <button className="node-buy" onClick={() => setFight(challengeMyriad())}>
                      <span>{fight ? 'AGAIN' : 'MEET IT'}</span>
                    </button>
                  </>
                ) : (
                  <p className="hint">
                    Not yet. It is made of you, and there is not enough of you yet.
                    {g.apotheoses === 0 && ' Ascend once first.'}
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        <footer className="drawer-foot">
          <span className="hint">
            A myriad is ten thousand soldiers. That is the whole of the definition.
          </span>
        </footer>
      </div>
    </div>
  )
}
