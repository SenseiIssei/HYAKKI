import { OFUDA, OFUDA_SLOTS } from '../content/ofuda'
import { game, toggleOfuda, useUI } from '../store/gameStore'

/**
 * The loadout of paper wards.
 *
 * The one decision a fully-idle game leaves in your hands: not how to fight —
 * that is automatic — but what to arm against before you set off. A ward is
 * specific, so choosing three is choosing what you expect the road to be made
 * of. Locked once you are walking, because a bet you can change is not a bet.
 */
export function Wards() {
  const g = game()
  const close = useUI((s) => s.setWards)
  const walking = g.totalTicks > 0 && !g.dead && g.rank > 1
  const carried = g.ofuda.length

  return (
    <div className="drawer-scrim" onClick={() => close(false)}>
      <div className="drawer wards" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2>
              <span className="kanji">御札</span> The Wards
            </h2>
            <span className="drawer-sub">
              paper against what walks · {carried}/{OFUDA_SLOTS} carried
              {walking && ' · locked while you are on the road'}
            </span>
          </div>
          <button className="small-btn" onClick={() => close(false)}>
            Close
          </button>
        </header>

        <div className="ward-list">
          {OFUDA.map((o) => {
            const owned = g.ofudaOwned.includes(o.id)
            const on = g.ofuda.includes(o.id)
            const full = !on && carried >= OFUDA_SLOTS
            const disabled = !owned || walking || full
            return (
              <button
                key={o.id}
                className={`ward-card ${on ? 'on' : ''} ${owned ? '' : 'locked'}`}
                disabled={disabled}
                onClick={() => toggleOfuda(o.id)}
                title={walking ? 'You cannot re-paper on the road.' : o.text}
              >
                <div className="ward-top">
                  <span className="ward-name">
                    <span className="kanji ward-kanji">{o.kanji}</span>
                    {owned ? o.name : '— — —'}
                  </span>
                  <span className="ward-meta">
                    {owned ? (
                      <>
                        vs {o.against} · {o.charges} uses · ×{o.ward.toFixed(2)}
                      </>
                    ) : (
                      'not yet issued'
                    )}
                  </span>
                </div>
                {owned ? (
                  <>
                    <p className="ward-text">“{o.text}”</p>
                    <p className="ward-lore">{o.lore}</p>
                  </>
                ) : (
                  <p className="ward-lore">A Hearing, won when you are ready for it, leaves paper.</p>
                )}
              </button>
            )
          })}
        </div>
        <p className="ward-foot">
          A ward holds back only the thing it names, and only while its paper lasts. Handle them
          filthy and they sometimes fail.
        </p>
      </div>
    </div>
  )
}
