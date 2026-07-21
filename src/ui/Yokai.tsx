import { useMemo } from 'react'
import { COLORS } from '../render/presets'
import { Rng } from '../sim/rng'
import type { Enemy } from '../sim/types'

/**
 * The things that come the other way.
 *
 * Each family is a hand-authored silhouette with seeded variation, so a Kozō at
 * Ri 8,000 is recognisably the same species as one at Ri 8 and still not the
 * same creature. Every one gets one WRONGNESS that lands before any damage
 * does — docs/hyakki/04-HORROR.md § rule 2:
 *
 *   Kozō   too many limbs for its size, and it hunches
 *   Oni    does not look at you. It is working.
 *   Yūrei  no feet. The legs simply stop being drawn.
 *   King   does not move at all, while everything else drifts
 *   Mu     drawn by not drawing — a hole with the background showing through
 */

const INK = '#0D0B0A'

export function Yokai({
  enemy,
  flash = false,
  dying = false,
}: {
  enemy: Enemy
  flash?: boolean
  dying?: boolean
}) {
  const rng = useMemo(() => new Rng(enemy.seed >>> 0), [enemy.seed])
  const v = useMemo(
    () => ({
      a: rng.range(0.85, 1.15),
      b: rng.range(0.9, 1.1),
      c: rng.range(-6, 6),
      d: rng.next(),
    }),
    [rng],
  )

  const cls = `yokai fam-${enemy.family} ${flash ? 'yokai-flash' : ''} ${dying ? 'yokai-dying' : ''}`

  return (
    <svg className={cls} viewBox="0 0 140 160" aria-hidden="true">
      {enemy.family === 'chaff' && <Kozo v={v} />}
      {enemy.family === 'organs' && <Oni v={v} />}
      {enemy.family === 'returned' && <Yurei v={v} />}
      {enemy.family === 'warden' && <King v={v} />}
      {enemy.family === 'nothing' && <Mu v={v} seed={enemy.seed} />}
    </svg>
  )
}

type V = { a: number; b: number; c: number; d: number }

/** Small, hunched, too many limbs, one lamp of an eye. */
function Kozo({ v }: { v: V }) {
  return (
    <g className="yk-root" transform={`translate(70 0) scale(${v.a})`}>
      <g className="yk-legs">
        <path className="yk-limb l1" d="M -8 108 L -12 148 L -4 148 L -3 108 Z" fill={INK} />
        <path className="yk-limb l2" d="M 8 108 L 4 148 L 12 148 L 13 108 Z" fill={INK} />
      </g>
      <g className="yk-body">
        {/* hunched — the spine curls forward */}
        <path
          d="M -22 62 C -26 90 -18 110 0 112 C 18 110 26 90 22 62 C 14 50 -14 50 -22 62 Z"
          fill="#3A3330"
        />
        <path className="yk-arm a1" d="M -21 68 L -34 96 L -28 99 L -15 74 Z" fill={INK} />
        <path className="yk-arm a2" d="M 21 68 L 34 96 L 28 99 L 15 74 Z" fill={INK} />
        {/* a third arm, which nobody mentions */}
        <path className="yk-arm a3" d="M 18 78 L 30 66 L 26 61 L 14 72 Z" fill={INK} opacity={0.9} />
        <g transform={`translate(${v.c * 0.3} 46)`}>
          <ellipse cx="0" cy="0" rx="16" ry="14" fill="#4A423E" />
          <circle className="yk-eye" cx={v.c * 0.5} cy="-1" r="5.5" fill={COLORS.gold} />
        </g>
      </g>
    </g>
  )
}

/** Big, horned, iron club. Employed. It never turns to face you. */
function Oni({ v }: { v: V }) {
  return (
    <g className="yk-root" transform={`translate(70 0) scale(${1.08 * v.a})`}>
      <g className="yk-legs">
        <path d="M -16 104 L -22 150 L -6 150 L -6 104 Z" fill="#5A2F2A" />
        <path d="M 16 104 L 22 150 L 6 150 L 6 104 Z" fill="#5A2F2A" />
      </g>
      <g className="yk-body oni-body">
        <path
          d="M -32 50 C -40 76 -34 100 0 106 C 34 100 40 76 32 50 C 20 34 -20 34 -32 50 Z"
          fill="#7A3A31"
        />
        {/* tiger-skin loincloth */}
        <path d="M -24 92 L 24 92 L 22 108 L -22 108 Z" fill={COLORS.gold} opacity={0.8} />
        <path d="M -14 94 L -10 106 M 0 93 L 2 107 M 12 94 L 16 106" stroke={INK} strokeWidth="2.5" />

        <path className="yk-arm oni-arm" d="M 30 54 L 48 84 L 40 90 L 22 62 Z" fill="#7A3A31" />
        {/* the iron club, kanabō */}
        <g className="oni-club" transform="translate(46 86)">
          <rect x="-4" y="-2" width="8" height="46" rx="2" fill="#332E2B" />
          {[6, 16, 26, 36].map((y) => (
            <circle key={y} cx="0" cy={y} r="5.5" fill="#443D39" />
          ))}
        </g>
        <path d="M -30 54 L -46 82 L -38 88 L -22 62 Z" fill="#7A3A31" />

        {/* the head is turned away — it is not looking at you */}
        <g transform="translate(-6 34)">
          <ellipse cx="0" cy="0" rx="19" ry="17" fill="#8A443A" />
          <path d="M -16 -12 L -22 -28 L -10 -19 Z" fill="#E8DCC8" />
          <path d="M 14 -13 L 20 -29 L 8 -20 Z" fill="#E8DCC8" />
          <path d="M -14 2 C -8 6 -2 6 4 2" stroke={INK} strokeWidth="2" fill="none" />
        </g>
      </g>
    </g>
  )
}

/** No feet. The legs stop being drawn, and it does not touch the ground. */
function Yurei({ v }: { v: V }) {
  return (
    <g className="yk-root yurei-root" transform={`translate(70 0) scale(${v.a})`}>
      <g className="yk-body">
        {/* the shroud fades out before it reaches the floor */}
        <defs>
          <linearGradient id="yfade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.45" stopColor={COLORS.ichor} stopOpacity="0.95" />
            <stop offset="1" stopColor={COLORS.ichor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M -20 52 C -30 84 -26 118 -14 140 L 14 140 C 26 118 30 84 20 52 Z"
          fill="url(#yfade)"
        />
        <path d="M -20 54 C -8 46 8 46 20 54 L 16 62 L -16 62 Z" fill="#D9D2C4" opacity="0.9" />

        {/* hands forward, wrists limp */}
        <path className="yr-arm a1" d="M -19 62 L -34 78 L -30 84 L -14 70 Z" fill="#CFC7B8" />
        <path className="yr-arm a2" d="M 19 62 L 34 78 L 30 84 L 14 70 Z" fill="#CFC7B8" />

        <g transform="translate(0 40)">
          {/* long black hair, over the face */}
          <path d="M -15 -12 C -15 6 -10 22 -6 34 L 6 34 C 10 22 15 6 15 -12 Z" fill={INK} />
          <ellipse cx="0" cy="-2" rx="13" ry="12" fill="#E6DED0" />
          <path d="M -15 -14 C -15 -26 15 -26 15 -14 C 15 -2 8 4 0 4 C -8 4 -15 -2 -15 -14 Z" fill={INK} />
          <circle cx={-4.5} cy={-4} r="1.9" fill={COLORS.ichor} />
          <circle cx={4.5} cy={-4} r="1.9" fill={COLORS.ichor} />
        </g>
      </g>
    </g>
  )
}

/** Seated, robed, tall hat, a tablet. It does not move. */
function King({ v }: { v: V }) {
  return (
    <g className="yk-root king-root" transform={`translate(70 0) scale(${1.12})`}>
      <g className="yk-body">
        {/* the dais */}
        <path d="M -46 138 L 46 138 L 40 150 L -40 150 Z" fill="#241E1B" />
        {/* robe, wide and still */}
        <path
          d="M -20 56 C -34 84 -44 116 -46 138 L 46 138 C 44 116 34 84 20 56 Z"
          fill="#4A2622"
        />
        <path d="M 0 58 L -8 138 L 8 138 Z" fill={COLORS.gold} opacity="0.35" />
        {/* sleeves */}
        <path d="M -20 60 L -42 92 L -30 98 L -14 72 Z" fill="#5C312B" />
        <path d="M 20 60 L 42 92 L 30 98 L 14 72 Z" fill="#5C312B" />
        {/* the tablet it reads from */}
        <rect x="20" y="80" width="18" height="26" rx="2" fill="#E4DCCB" opacity="0.9" />

        <g transform="translate(0 40)">
          <ellipse cx="0" cy="0" rx="16" ry="15" fill="#C9A882" />
          {/* eboshi — the tall court hat */}
          <path d="M -15 -12 L -12 -40 L 12 -40 L 15 -12 Z" fill={INK} />
          <path d="M -12 -40 L 12 -40 L 10 -46 L -10 -46 Z" fill={INK} />
          <path d="M -9 -2 L -3 -2 M 3 -2 L 9 -2" stroke={INK} strokeWidth="2.4" />
          <path d="M -6 8 C -2 6 2 6 6 8" stroke={INK} strokeWidth="2" fill="none" />
        </g>
        <ellipse className="king-halo" cx="0" cy="40" rx="34" ry="34" fill="none" stroke={COLORS.gold} strokeWidth="1" opacity="0.35" />
      </g>
      <g style={{ display: 'none' }}>{v.d}</g>
    </g>
  )
}

/**
 * Drawn by not drawing. A mask punches a hole in a field, so what you see is
 * the background — and it does not animate, because holes do not move.
 */
function Mu({ v, seed }: { v: V; seed: number }) {
  const id = `mu-${seed >>> 0}`
  return (
    <g className="yk-root mu-root">
      <defs>
        <mask id={id}>
          <rect width="140" height="160" fill="white" />
          <path
            d={
              `M ${70 - 30 * v.a} 60 ` +
              `C ${70 - 34 * v.a} 100 ${70 - 20 * v.a} 138 70 138 ` +
              `C ${70 + 20 * v.a} 138 ${70 + 34 * v.a} 100 ${70 + 30 * v.a} 60 ` +
              `C ${70 + 16} 34 ${70 - 16} 34 ${70 - 30 * v.a} 60 Z`
            }
            fill="black"
          />
        </mask>
      </defs>
      <rect width="140" height="160" fill={COLORS.ichor} opacity="0.1" mask={`url(#${id})`} />
      <path
        d={
          `M ${70 - 30 * v.a} 60 ` +
          `C ${70 - 34 * v.a} 100 ${70 - 20 * v.a} 138 70 138 ` +
          `C ${70 + 20 * v.a} 138 ${70 + 34 * v.a} 100 ${70 + 30 * v.a} 60 ` +
          `C ${70 + 16} 34 ${70 - 16} 34 ${70 - 30 * v.a} 60 Z`
        }
        fill="none"
        stroke={COLORS.ichor}
        strokeWidth="0.8"
        opacity="0.5"
      />
    </g>
  )
}
