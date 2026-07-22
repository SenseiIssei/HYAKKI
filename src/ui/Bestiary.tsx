import { useEffect, useRef, useState } from 'react'
import { draw } from '../pixel/engine'
import { YOKAI_PAL } from '../pixel/yokai'
import { SPECIES, isBoss, type Species } from '../pixel/species'
import { bestiaryCompletedFamilies, BESTIARY_ATK_PER_FAMILY } from '../sim/stats'
import { game, getDiscovery, useUI } from '../store/gameStore'
import { fmtInt } from '../format'

/**
 * The Bestiary — every yōkai the road holds, and how many of each you have put
 * down. The ones you have met stand and breathe in their own colour; the ones
 * you have not are a shadow with a number you cannot read yet. Pure art and a
 * kill count: it never touches the economy.
 */

const FAMILY_LABEL: Record<Species['family'], string> = {
  chaff: 'The Small and Many',
  organs: 'The Horned and Heavy',
  returned: 'The Returned',
  nothing: 'The Nothing',
}
const FAMILY_ORDER: Species['family'][] = ['chaff', 'organs', 'returned', 'nothing']

// every palette key resolves to the same dim ink — a silhouette for the unmet
const SHADOW_PAL = new Proxy(
  {},
  { get: () => '#1b1712' },
) as Record<string, string>

function MonSprite({ sp, met }: { sp: Species; met: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    const scale = 3
    // pre-rasterise the frames once
    const frames: HTMLCanvasElement[] = []
    for (let i = 0; i < 8; i++) {
      const s = sp.build(1234, i / 8)
      const c = document.createElement('canvas')
      c.width = s.w * scale
      c.height = s.h * scale
      const cctx = c.getContext('2d')!
      cctx.imageSmoothingEnabled = false
      draw(cctx, s, met ? YOKAI_PAL : SHADOW_PAL, scale)
      frames.push(c)
    }
    let i = 0
    const paint = () => {
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.drawImage(frames[i % frames.length], 0, 0)
    }
    paint()
    if (!met) return // the unmet do not move
    const fps = sp.fps
    const id = window.setInterval(() => {
      i++
      paint()
    }, Math.max(60, 1000 / fps))
    return () => window.clearInterval(id)
  }, [sp, met])
  return <canvas ref={ref} width={44 * 3} height={48 * 3} className="mon-canvas" aria-hidden="true" />
}

function Mon({ sp, count, justMet }: { sp: Species; count: number; justMet?: boolean }) {
  const met = count > 0
  const king = isBoss(sp.id)
  return (
    <div
      className={`mon ${met ? '' : 'mon-locked'} ${justMet ? 'mon-new' : ''} ${
        king && met ? 'mon-king' : ''
      }`}
      data-family={sp.family}
    >
      {justMet && <span className="mon-new-tag">just met</span>}
      {king && met && !justMet && <span className="mon-king-tag">a king</span>}
      <div className="mon-art">
        <MonSprite sp={sp} met={met} />
      </div>
      <div className="mon-info">
        <div className="mon-name">
          <span className="kanji">{met ? sp.kanji : '？'}</span>{' '}
          {met ? sp.name : '— — —'}
        </div>
        {met ? (
          <>
            <div className="mon-lore">{sp.lore}</div>
            <div className="mon-count">put down · {fmtInt(count)}</div>
          </>
        ) : (
          <div className="mon-lore mon-unmet">Not yet met.</div>
        )}
      </div>
    </div>
  )
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'met', label: 'Recorded' },
  { id: 'unmet', label: 'Unmet' },
] as const
type Filter = (typeof FILTERS)[number]['id']

export function Bestiary() {
  useUI((s) => s.frame)
  const close = useUI((s) => s.setBestiary)
  const [filter, setFilter] = useState<Filter>('all')
  const g = game()
  const seen = g.speciesSeen ?? {}
  const metCount = SPECIES.filter((s) => (seen[s.id] ?? 0) > 0).length
  const done = bestiaryCompletedFamilies(seen)
  const boonPct = Math.round(done * BESTIARY_ATK_PER_FAMILY * 100)
  // the species named by the most recent "first felled" gets a highlight
  const justMetId = getDiscovery()?.speciesId

  const show = (id: string) => {
    const isMet = (seen[id] ?? 0) > 0
    return filter === 'all' || (filter === 'met' && isMet) || (filter === 'unmet' && !isMet)
  }

  return (
    <div className="overlay dark" onClick={() => close(false)}>
      <div className="panel bestiary" onClick={(e) => e.stopPropagation()}>
        <div className="panel-row bestiary-head">
          <h2 style={{ margin: 0 }}>百鬼 · The Bestiary</h2>
          <span className="hint" style={{ alignSelf: 'center' }}>
            {fmtInt(metCount)} / {fmtInt(SPECIES.length)} recorded
          </span>
        </div>
        <div className="hint">
          A hundred demons, which is to say too many to count. Record every yōkai of a
          family, end to end, and it lends a small permanent edge to your attack.
        </div>

        <div className="bestiary-controls">
          <div className="bestiary-boon">
            <span className="boon-label">The Bestiary’s edge</span>
            <span className="boon-value" data-full={done >= 4}>
              {done} / 4 families · <b>+{boonPct}% might</b>
            </span>
          </div>
          <div className="bestiary-filters">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                className="small-btn"
                data-on={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {FAMILY_ORDER.map((fam) => {
          const list = SPECIES.filter((s) => s.family === fam)
          const shown = list.filter((s) => show(s.id))
          if (!shown.length) return null
          const metInFam = list.filter((s) => (seen[s.id] ?? 0) > 0).length
          const complete = metInFam === list.length
          return (
            <div key={fam} className="bestiary-fam">
              <div className="bestiary-fam-head">
                <span>
                  {FAMILY_LABEL[fam]}
                  {complete && <span className="fam-done" title="Fully recorded"> ✓</span>}
                </span>
                <span className="bestiary-fam-count">
                  {metInFam} / {list.length}
                </span>
              </div>
              <div className="mon-grid">
                {shown.map((sp) => (
                  <Mon
                    key={sp.id}
                    sp={sp}
                    count={seen[sp.id] ?? 0}
                    justMet={sp.id === justMetId}
                  />
                ))}
              </div>
            </div>
          )
        })}

        <div className="panel-row" style={{ justifyContent: 'flex-end' }}>
          <button className="small-btn" onClick={() => close(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
