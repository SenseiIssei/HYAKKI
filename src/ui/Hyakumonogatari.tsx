import { useState } from 'react'
import { FRAGMENT_BY_N, FRAGMENTS } from '../content/fragments'
import { sfxBonsho } from '../audio/engine'
import { game, roomDark, snuffCandle, useUI } from '../store/gameStore'

/**
 * HYAKUMONOGATARI KAIDANKAI 百物語怪談会 — a gathering of a hundred weird tales.
 *
 * A hundred candles are lit. You tell a story and put one out, and the room
 * grows darker, and the old agreement is that when the last candle is snuffed
 * something arrives. This screen IS that game: every earned fragment is a lit
 * candle, reading it snuffs it, the room darkens as you go, and the hundredth
 * is refused until the other ninety-nine are dark.
 *
 * The horror of the real thing is that the counting is the summoning — so this
 * does not rush you and does not reward you for finishing. It only gets darker.
 */
export function Hyakumonogatari() {
  useUI((s) => s.frame)
  const g = game()
  const close = useUI((s) => s.setStories)
  const [open, setOpen] = useState<number | null>(null)

  const dark = roomDark()
  const litCount = g.fragments.filter((n) => !g.snuffed.includes(n)).length
  const snuffedCount = g.snuffed.filter((n) => n >= 1 && n <= 99).length
  const ninetyNineDark = snuffedCount >= 99
  const hundredEarned = g.fragments.includes(100)

  const openStory = (n: number) => {
    if (!g.fragments.includes(n)) return
    const wasHundredth = !g.hundredth
    setOpen(n)
    if (snuffCandle(n) && n === 100 && wasHundredth) sfxBonsho(0.34)
  }

  const frag = open != null ? FRAGMENT_BY_N[open] : null

  return (
    <div className="drawer-scrim" onClick={() => close(false)}>
      <div
        className="drawer hyaku"
        onClick={(e) => e.stopPropagation()}
        style={{ ['--dark' as string]: dark.toFixed(3) }}
      >
        <header className="drawer-head">
          <div>
            <h2>
              <span className="kanji">百物語</span> A Hundred Candles
            </h2>
            <span className="drawer-sub">
              {litCount} still lit · {snuffedCount} put out
              {ninetyNineDark && !g.hundredth && ' · one candle left'}
            </span>
          </div>
          <button className="small-btn" onClick={() => close(false)}>
            Close
          </button>
        </header>

        {/* the room darkens with every story read */}
        <div className="hyaku-room" style={{ opacity: 1 - dark * 0.7 }}>
          <div className="candle-grid">
            {Array.from({ length: 100 }, (_, i) => {
              const n = i + 1
              const earned = g.fragments.includes(n)
              const out = g.snuffed.includes(n)
              const isHundred = n === 100
              const hundredReady = isHundred && ninetyNineDark && hundredEarned
              const lit = earned && !out
              return (
                <button
                  key={n}
                  className={`candle ${lit ? 'lit' : ''} ${out ? 'out' : ''} ${
                    isHundred ? 'hundred' : ''
                  } ${hundredReady ? 'ready' : ''}`}
                  disabled={!earned || (isHundred && !hundredReady && !out)}
                  onClick={() => openStory(n)}
                  title={earned ? FRAGMENT_BY_N[n]?.title ?? '' : 'unlit'}
                  aria-label={`candle ${n}`}
                >
                  <span className="flame" />
                  <span className="candle-n">{n}</span>
                </button>
              )
            })}
          </div>
        </div>

        <p className="hyaku-foot">
          {g.hundredth
            ? 'The counting is finished. It was finished the moment you began it.'
            : ninetyNineDark
              ? 'Ninety-nine are dark. The wisdom is to leave the last one burning. The wisdom is always written by the ones who did.'
              : `Read a story to put its candle out. It only gets darker. ${
                  FRAGMENTS.length - g.fragments.length
                } are not lit yet.`}
        </p>

        {frag && (
          <div className="story-scrim" onClick={() => setOpen(null)}>
            <article
              className={`story ${open === 100 ? 'story-hundred' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="frag-head">
                <span className="frag-n">#{frag.n}</span>
                <span className="frag-title">{frag.title}</span>
              </div>
              <p className="frag-text">{frag.text}</p>
              <button className="small-btn" onClick={() => setOpen(null)}>
                {open === 100 ? 'Let it go dark' : 'Snuff it'}
              </button>
            </article>
          </div>
        )}
      </div>

      {/* what arrives when the hundredth is put out */}
      {g.hundredth && <Aoandon />}
    </div>
  )
}

/**
 * AOANDON 青行灯 — the blue lantern.
 *
 * When the hundredth story is told and the hundredth candle snuffed, a woman in
 * white with a blue-lit face is said to appear in the dark that follows. She
 * does nothing. She is only there, at the end of the counting, which the old
 * accounts agree is enough. Shown once, then dismissed — she does not persist,
 * because the point of her is the moment, not the fight.
 */
function Aoandon() {
  const [gone, setGone] = useState(false)
  if (gone) return null
  return (
    <div className="aoandon" onClick={() => setGone(true)}>
      <div className="aoandon-dark" />
      <div className="aoandon-face">
        <div className="ao-glow" />
        <div className="ao-eyes">
          <span />
          <span />
        </div>
        <div className="ao-mouth" />
      </div>
      <p className="aoandon-line">
        You put out the last light, and in the dark that comes after there is a face, lit blue from
        below, with two small horns and teeth stained black, and it is looking at you, and it does
        nothing at all.
      </p>
      <p className="aoandon-sub">That was always going to be enough.</p>
    </div>
  )
}
