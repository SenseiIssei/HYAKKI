import { BALANCE as B } from '../content/balance'
import { TREE, TREE_BY_ID } from '../content/tree'
import { fmt, fmtInt, fmtTime } from '../format'
import { offlineEfficiency, offlineWindowMs } from '../sim/offline'
import {
  ashProjection,
  game,
  ordersUnlocked,
  setOrders,
  setPriority,
  stats,
  useUI,
} from '../store/gameStore'

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

  const move = (i: number, dir: -1 | 1) => {
    const next = [...g.orders.priority]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    setPriority(next)
  }

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

        {unlocked && g.orders.autoBuy && (
          <>
            <h2>What to spend it on</h2>
            <p className="hint">
              Ash is spent from the top down, and always restarts at the top. Nothing not on
              this list is ever bought — Standing Orders never guess a build.
            </p>
            <div className="priority">
              {g.orders.priority.map((id, i) => {
                const node = TREE_BY_ID[id]
                if (!node) return null
                return (
                  <div key={id} className="pri-row">
                    <span className="pri-n">{i + 1}</span>
                    <span className="pri-name">{node.label}</span>
                    <span className="pri-lvl">L{fmtInt(g.treeLevels[id] ?? 0)}</span>
                    <button
                      className="small-btn"
                      disabled={i === 0}
                      aria-label={`Move ${node.label} up`}
                      onClick={() => move(i, -1)}
                    >
                      ↑
                    </button>
                    <button
                      className="small-btn"
                      disabled={i === g.orders.priority.length - 1}
                      aria-label={`Move ${node.label} down`}
                      onClick={() => move(i, 1)}
                    >
                      ↓
                    </button>
                    <button
                      className="small-btn"
                      aria-label={`Remove ${node.label}`}
                      onClick={() => setPriority(g.orders.priority.filter((x) => x !== id))}
                    >
                      ×
                    </button>
                  </div>
                )
              })}
              {g.orders.priority.length === 0 && (
                <div className="hint">Nothing listed. Nothing will be bought.</div>
              )}
            </div>
            <div className="panel-row">
              {TREE.filter((n) => !n.requires && !g.orders.priority.includes(n.id)).map((n) => (
                <button
                  key={n.id}
                  className="small-btn"
                  onClick={() => setPriority([...g.orders.priority, n.id])}
                >
                  + {n.label}
                </button>
              ))}
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
