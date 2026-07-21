import { useMemo, useState } from 'react'
import Decimal from 'break_infinity.js'
import {
  LAYERS,
  LAYER_BY_ID,
  ROOM_GLYPH,
  ROOM_LABEL,
  type RoomType,
} from '../content/layers'
import {
  autoRoute,
  descentDurationMs,
  descentRank,
  descentReady,
  estimateClear,
  generateMap,
  validRoute,
} from '../sim/descent'
import type { DescentMap } from '../sim/types'
import { fmt, fmtInt, fmtTime } from '../format'
import {
  collectDescent,
  commitDescent,
  descentSlots,
  game,
  keyFraction,
  keysCap,
  keysHeld,
  openLayer,
  running,
  useUI,
} from '../store/gameStore'
import { relicLabel } from '../sim/relics'

/** docs/08-DESCENTS.md */
export function Descend() {
  useUI((s) => s.frame)
  const g = game()
  const close = useUI((s) => s.setDescend)

  const [layerId, setLayerId] = useState('ossuary')
  const [depth, setDepth] = useState(1)
  const [nonce, setNonce] = useState(0)
  const layer = LAYER_BY_ID[layerId]

  const map = useMemo<DescentMap>(
    () => generateMap(layerId, depth, (depth * 7919 + nonce * 104729 + g.soldierSeed) >>> 0),
    [layerId, depth, nonce, g.soldierSeed],
  )
  const [route, setRoute] = useState<number[]>(() => autoRoute(map))
  const [mapKey, setMapKey] = useState('')
  const currentKey = `${layerId}-${depth}-${nonce}`
  if (mapKey !== currentKey) {
    setMapKey(currentKey)
    setRoute(autoRoute(map))
  }

  const ok = validRoute(map, route)
  const odds = useMemo(
    () => (ok ? estimateClear(g, map, route, 16) : 0),
    [map, route, ok, g.rank, g.treeLevels, g.equipped],
  )

  const keys = keysHeld()
  const slots = descentSlots()
  const live = running()
  const canGo = keys >= 1 && live.length < slots && ok

  const byFloor = useMemo(() => {
    const out: (typeof map.rooms)[] = []
    for (const r of map.rooms) (out[r.floor] ??= []).push(r)
    return out
  }, [map])

  const reachable = (id: number) => {
    if (route.includes(id)) return true
    const last = route[route.length - 1]
    return last !== undefined && map.rooms[last].next.includes(id)
  }

  const clickRoom = (id: number) => {
    const i = route.indexOf(id)
    if (i >= 0) {
      setRoute(route.slice(0, i + 1))
      return
    }
    if (reachable(id)) setRoute([...route, id])
  }

  return (
    <div className="drawer-scrim" onClick={() => close(false)}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2>Descend</h2>
            <span className="drawer-sub">the Column goes forward · there is also down</span>
          </div>
          <div className="drawer-head-right">
            <span className="keys">
              ⌸ {keys}/{keysCap()}
              <span className="key-bar">
                <span className="key-fill" style={{ width: `${keyFraction() * 100}%` }} />
              </span>
            </span>
            <button className="small-btn" onClick={() => close(false)}>
              Close
            </button>
          </div>
        </header>

        {live.length > 0 && (
          <section className="running">
            {live.map((d) => {
              const done = descentReady(d, Date.now())
              const left = d.startedAt + d.durationMs - Date.now()
              return (
                <div key={d.id} className={`run-chip ${done ? 'done' : ''}`}>
                  <span className="run-name">{LAYER_BY_ID[d.layerId]?.name}</span>
                  <span className="run-depth">depth {d.depth}</span>
                  {done ? (
                    <button className="small-btn" onClick={() => collectDescent(d.id)}>
                      {d.result.cleared ? 'It came back' : 'Collect the remains'}
                    </button>
                  ) : (
                    <span className="run-left">{fmtTime(Math.max(0, left))}</span>
                  )}
                </div>
              )
            })}
          </section>
        )}

        <div className="descend-grid">
          {/* layers */}
          <section className="trunk">
            <div className="trunk-head">
              <span className="trunk-name">LAYERS</span>
            </div>
            {LAYERS.map((l) => {
              const open = l.id === 'nowhere' ? g.apotheoses > 0 : g.layerNames >= l.cost
              const need = Math.max(0, l.cost - g.layerNames)
              return (
                <button
                  key={l.id}
                  className={`node layer ${layerId === l.id ? 'sel' : ''} ${open ? '' : 'locked'}`}
                  onClick={() => open && setLayerId(l.id)}
                  disabled={!open}
                >
                  <div className="node-head">
                    <span className="node-name" style={{ color: `var(${l.accent})` }}>
                      {l.name}
                    </span>
                  </div>
                  {l.flavour ? (
                    <div className="layer-flavour">{l.flavour}</div>
                  ) : (
                    <div className="layer-flavour empty-desc">&nbsp;</div>
                  )}
                  {open ? (
                    <div className="layer-twist">{l.twistText}</div>
                  ) : (
                    <div className="layer-locked">
                      {l.id === 'nowhere' ? 'Not yet.' : `✦ ${need} more`}
                      {l.id !== 'nowhere' && g.names >= need && need > 0 && (
                        <button
                          className="small-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            openLayer(l.id)
                          }}
                        >
                          Open it
                        </button>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </section>

          {/* the map */}
          <section className="trunk">
            <div className="trunk-head">
              <span className="trunk-name">THE WAY DOWN</span>
              <span className="trunk-blurb">
                {map.floors} floors · built at Rank {fmtInt(descentRank(g, layer, depth))}
              </span>
            </div>

            <div className="depth-row">
              <span className="orders-when">depth</span>
              <span className="orders-value">{depth}</span>
              <input
                type="range"
                min={1}
                max={40}
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                aria-label="Descent depth"
              />
              <span className="hint">
                {fmtTime(descentDurationMs(depth))} · rewards ×{Math.pow(1.1, depth).toFixed(1)}
              </span>
            </div>

            <div className="map">
              {byFloor.map((floor, fi) => (
                <div key={fi} className="map-floor">
                  {floor.map((r) => {
                    const on = route.includes(r.id)
                    const can = !on && reachable(r.id)
                    return (
                      <button
                        key={r.id}
                        className={`room ${on ? 'on' : ''} ${can ? 'can' : ''} t-${r.type}`}
                        onClick={() => clickRoom(r.id)}
                        title={`${ROOM_LABEL[r.type as RoomType]}`}
                        aria-label={`Floor ${fi + 1}, ${ROOM_LABEL[r.type as RoomType]}`}
                      >
                        {ROOM_GLYPH[r.type as RoomType]}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            <div className="panel-row">
              <button className="small-btn" onClick={() => setRoute(autoRoute(map))}>
                Safest route
              </button>
              <button className="small-btn" onClick={() => setRoute(route.slice(0, 1))}>
                Clear
              </button>
              <button className="small-btn" onClick={() => setNonce(nonce + 1)}>
                Another map
              </button>
            </div>
          </section>

          {/* commit */}
          <section className="trunk">
            <div className="trunk-head">
              <span className="trunk-name">COMMIT</span>
            </div>
            <div className="cmp">
              <div className="cmp-head">estimated clear</div>
              <div className={`odds ${odds > 0.66 ? 'good' : odds > 0.33 ? 'fair' : 'bad'}`}>
                {ok ? `${Math.round(odds * 100)}%` : '—'}
              </div>
              <div className="cmp-note">
                {ok
                  ? 'Sixteen runs of the real simulation over the route you plotted.'
                  : 'Plot a route that reaches the Warden.'}
              </div>
              <div className="route-list">
                {route.map((id, i) => (
                  <span key={i} className="route-step">
                    {ROOM_GLYPH[map.rooms[id].type as RoomType]}{' '}
                    {ROOM_LABEL[map.rooms[id].type as RoomType]}
                  </span>
                ))}
              </div>
              <button
                className="node-buy"
                disabled={!canGo}
                onClick={() => {
                  if (commitDescent(map, route)) setNonce(nonce + 1)
                }}
              >
                <span>
                  {keys < 1
                    ? 'NO KEY'
                    : live.length >= slots
                      ? 'ALREADY DOWN THERE'
                      : 'GO DOWN'}
                </span>
                {canGo && <span className="afford">⌸ 1</span>}
              </button>
              <div className="hint">
                {live.length}/{slots} running · a Key every 20 minutes
              </div>
            </div>
          </section>
        </div>

        <footer className="drawer-foot">
          <span className="hint">
            The route is the whole decision, and you make all of it before anything starts.
          </span>
        </footer>
      </div>
    </div>
  )
}

/** Shown once a Descent finishes: what happened, room by room. */
export function DescentReport({ id }: { id: string }) {
  const g = game()
  const d = g.descents.find((x) => x.id === id)
  if (!d) return null
  const layer = LAYER_BY_ID[d.layerId]
  const r = d.result
  return (
    <div className="overlay dark">
      <div className="report">
        <div className="rank-label">{layer?.name}</div>
        <div className="report-time">{r.cleared ? 'You came back up' : 'You did not'}</div>
        <div className="rank-rule" />
        <div className="room-log">
          {r.rooms.map((o, i) => (
            <div key={i} className={`room-line ${o.died ? 'died' : ''}`}>
              <span>{ROOM_GLYPH[o.type as RoomType]}</span>
              <span>{o.text}</span>
            </div>
          ))}
        </div>
        {r.relics.length > 0 && (
          <div className="report-stats">
            {r.relics.map((relic, i) => (
              <div key={i} className="report-row">
                <span>carried back</span>
                <span>{relicLabel(relic)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="ash-award">
          <div className="ash-number">◈ {fmt(new Decimal(r.ash))}</div>
        </div>
        <button className="big-btn" onClick={() => collectDescent(d.id)}>
          Take it
        </button>
      </div>
    </div>
  )
}
