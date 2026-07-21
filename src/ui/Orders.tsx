import { BALANCE as B } from '../content/balance'
import { fmt, fmtTime } from '../format'
import { offlineEfficiency, offlineWindowMs } from '../sim/offline'
import { ashProjection, game, ordersUnlocked, setOrders, stats, useUI } from '../store/gameStore'

/**
 * Standing Orders — the single most important quality-of-life feature in the
 * game. Without it, being away caps out at one run; with it you come back to
 * dozens of compounding ones. docs/02-CORE-LOOP.md § Standing Orders
 */
export function Orders() {
  useUI((s) => s.frame)
  const g = game()
  const close = useUI((s) => s.setOrders)
  const unlocked = ordersUnlocked()
  const o = g.orders
  const windowMs = offlineWindowMs(g, stats())
  const eff = offlineEfficiency(g)

  return (
    <div className="overlay dark" onClick={() => close(false)}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <h2>Standing Orders</h2>

        {!unlocked ? (
          <>
            <p className="hint">
              A rule the Column follows when you are not watching. It is not issued to
              soldiers who have not yet learned the march.
            </p>
            <div className="lock-bar">
              <span className="lock-fill" style={{ width: `${Math.min(100, (g.reveilles / 25) * 100)}%` }} />
            </div>
            <p className="hint">
              Sound Reveille {Math.max(0, 25 - g.reveilles)} more times.
            </p>
          </>
        ) : (
          <>
            <label className="orders-toggle">
              <input
                type="checkbox"
                checked={o.enabled}
                onChange={(e) => setOrders({ enabled: e.target.checked })}
              />
              <span>Sound Reveille without being told</span>
            </label>

            <div className={o.enabled ? '' : 'orders-dim'}>
              <div className="orders-rule">
                <span className="orders-when">when the waking would be worth</span>
                <span className="orders-value">×{o.ashMultiple.toFixed(1)}</span>
                <input
                  type="range"
                  min={1.1}
                  max={5}
                  step={0.1}
                  value={o.ashMultiple}
                  disabled={!o.enabled}
                  onChange={(e) => setOrders({ ashMultiple: Number(e.target.value) })}
                  aria-label="Ash multiple before waking"
                />
                <span className="hint">
                  last waking paid ◈ {fmt(g.lastAsh)} · this one would pay ◈{' '}
                  {fmt(ashProjection())}
                </span>
              </div>

              <div className="orders-rule">
                <span className="orders-when">or after no Rank gained for</span>
                <span className="orders-value">{o.stallMinutes} min</span>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={o.stallMinutes}
                  disabled={!o.enabled}
                  onChange={(e) => setOrders({ stallMinutes: Number(e.target.value) })}
                  aria-label="Minutes stalled before waking"
                />
              </div>
            </div>
          </>
        )}

        <h2>Time Away</h2>
        <div className="hint">
          The Column marches for up to <strong>{fmtTime(windowMs)}</strong> without you, at{' '}
          {Math.round(eff * 100)}% of its pace.
          {eff < 1 && ' VIGIL 25 makes that full pace.'}
          {' '}Base is {B.OFFLINE_WINDOW_H_BASE}h; every level of VIGIL adds an hour.
        </div>

        <div className="panel-row" style={{ justifyContent: 'flex-end' }}>
          <button className="small-btn" onClick={() => close(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
