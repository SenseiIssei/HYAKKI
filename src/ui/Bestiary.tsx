import { useEffect, useRef } from 'react'
import { draw } from '../pixel/engine'
import { YOKAI_PAL } from '../pixel/yokai'
import { SPECIES, type Species } from '../pixel/species'
import { game, useUI } from '../store/gameStore'
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

function Mon({ sp, count }: { sp: Species; count: number }) {
  const met = count > 0
  return (
    <div className={`mon ${met ? '' : 'mon-locked'}`} data-family={sp.family}>
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

export function Bestiary() {
  useUI((s) => s.frame)
  const close = useUI((s) => s.setBestiary)
  const g = game()
  const seen = g.speciesSeen ?? {}
  const metCount = SPECIES.filter((s) => (seen[s.id] ?? 0) > 0).length

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
          A hundred demons, which is to say too many to count. Every one you put down is
          written here, in its own colour. The rest wait in the dark.
        </div>

        {FAMILY_ORDER.map((fam) => {
          const list = SPECIES.filter((s) => s.family === fam)
          return (
            <div key={fam} className="bestiary-fam">
              <div className="bestiary-fam-head">
                {FAMILY_LABEL[fam]}
                <span className="bestiary-fam-count">
                  {list.filter((s) => (seen[s.id] ?? 0) > 0).length} / {list.length}
                </span>
              </div>
              <div className="mon-grid">
                {list.map((sp) => (
                  <Mon key={sp.id} sp={sp} count={seen[sp.id] ?? 0} />
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
