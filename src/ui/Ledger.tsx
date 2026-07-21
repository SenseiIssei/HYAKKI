import { BALANCE as B } from '../content/balance'
import { OBSERVATIONS } from '../content/achievements'
import { FRAGMENTS } from '../content/fragments'
import { fmt, fmtInt, fmtTime } from '../format'
import { game, stats, useUI } from '../store/gameStore'

/**
 * Everything the game has been counting. It has been counting all of it.
 * docs/10-UI-UX.md § Settings
 */
export function Ledger() {
  useUI((s) => s.frame)
  const g = game()
  const st = stats()
  const close = useUI((s) => s.setLedger)

  const groups: [string, [string, string][]][] = [
    [
      'THE MARCH',
      [
        ['soldier number', `#${fmtInt(g.soldierNumber)}`],
        ['deepest rank ever', fmtInt(g.bestRankEver)],
        ['deepest this run', fmtInt(g.bestRank)],
        ['time marched', fmtTime((g.totalTicks / B.TICKS_PER_SEC) * 1000)],
        ['first sent', new Date(g.firstPlayedAt).toLocaleDateString()],
      ],
    ],
    [
      'THE COUNT',
      [
        ['enemies felled', fmtInt(g.totalKills)],
        // Apotheosis resets this — the Revenant's count is per-Ascension — so
        // do not call it a lifetime number.
        ['died, this ascension', fmtInt(g.totalDeaths)],
        ['times you woke', fmtInt(g.reveilles)],
        ['times interred', fmtInt(g.interments)],
        ['times ascended', fmtInt(g.apotheoses)],
        ['descents cleared', fmtInt(g.descentsCleared)],
        ['of you on file', fmtInt(g.ghosts.length)],
        ...(g.authored
          ? ([['what you left behind', `#${fmtInt(g.authored.soldierNumber)}`]] as [string, string][])
          : []),
      ],
    ],
    [
      'WHAT YOU CARRY',
      [
        ['ash', fmt(g.ash)],
        ['ash spent, this ascension', fmt(g.ashSpentThisAscension)],
        ['names', fmtInt(g.names)],
        ['ichor', fmtInt(g.ichor)],
        ['relics held', `${fmtInt(g.inventory.length)} / 40`],
        ['relics worn', fmtInt(g.equipped.filter(Boolean).length)],
      ],
    ],
    [
      'WHAT YOU ARE',
      [
        ['attack', fmt(st.atk)],
        ['max health', fmt(st.hp)],
        ['armor', fmt(st.arm)],
        ['regeneration', `${fmt(st.reg)}/s`],
        ['attack speed', `${st.spd.toFixed(2)}/s`],
        ['crit', `${(st.cc * 100).toFixed(1)}% at ×${st.cm.toFixed(2)}`],
        ['lifesteal', `${(st.ls * 100).toFixed(1)}%`],
      ],
    ],
  ]

  const seen = OBSERVATIONS.filter((o) => g.observations.includes(o.id))

  return (
    <div className="drawer-scrim" onClick={() => close(false)}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2>The Ledger</h2>
            <span className="drawer-sub">
              it has been counting · {seen.length}/{OBSERVATIONS.length} noticed ·{' '}
              {g.fragments.length}/{FRAGMENTS.length} read
            </span>
          </div>
          <button className="small-btn" onClick={() => close(false)}>
            Close
          </button>
        </header>

        <div className="ledger">
          <div className="ledger-stats">
            {groups.map(([title, rows]) => (
              <section key={title} className="trunk">
                <div className="trunk-head">
                  <span className="trunk-name">{title}</span>
                </div>
                {rows.map(([k, v]) => (
                  <div key={k} className="report-row">
                    <span>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </section>
            ))}
          </div>

          <section className="observations">
            <div className="trunk-head">
              <span className="trunk-name">WHAT IT HAS NOTICED</span>
              <span className="trunk-blurb">
                {seen.length} of {OBSERVATIONS.length}
              </span>
            </div>
            {seen.length === 0 && (
              <p className="hint">Nothing yet. It is watching, but it is not in a hurry.</p>
            )}
            {seen.map((o) => (
              <p key={o.id} className="observation">
                {o.text}
              </p>
            ))}
            {seen.length < OBSERVATIONS.length && (
              <p className="hint hidden-count">
                {OBSERVATIONS.length - seen.length} it has not said yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
