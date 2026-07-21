import { useMemo } from 'react'
import {
  FIGURE,
  bladePath,
  coatPath,
  guardPath,
  headgearPath,
  lookFrom,
  minoPath,
  pauldronPath,
  torsoPath,
  type Look,
} from '../render/figure'
import { COLORS } from '../render/presets'
import type { StatBlock } from '../sim/types'

/**
 * THE WALKER — the small man you are.
 *
 * A skeleton of named groups; every joint is animated in CSS so it keeps
 * moving in a hidden window (rAF does not). The gait is bound to a custom
 * property, so getting faster genuinely makes him walk faster.
 */

const INK = '#100C0A'
const SKIN = '#C9A882'

export function Walker({
  stats,
  state = 'walk',
  kegare = 0,
  flash = false,
  className = '',
}: {
  stats: StatBlock
  /** walk | strike | brace | hit | still */
  state?: 'walk' | 'strike' | 'brace' | 'hit' | 'still'
  kegare?: number
  flash?: boolean
  className?: string
}) {
  const look: Look = useMemo(() => lookFrom(stats, { kegare }), [stats, kegare])

  const cloth = mix(COLORS.bone, '#5A4632', 0.55 + look.kegare * 0.25)
  const plate = mix('#3B3A38', COLORS.gold, Math.min(0.7, look.armour * 0.16))
  const steel = mix('#B9BEC2', COLORS.gold, look.weapon >= 4 ? 0.45 : 0.05)

  return (
    <svg
      className={`walker st-${state} ${flash ? 'walker-flash' : ''} ${className}`}
      viewBox={FIGURE.viewBox}
      style={{
        // everything downstream reads these
        ['--gait' as string]: `${look.gait}s`,
        ['--aura' as string]: look.aura,
      }}
      aria-hidden="true"
    >
      {look.aura > 0.02 && (
        <ellipse className="walker-aura" cx="60" cy="150" rx="34" ry="7" fill={COLORS.gold} />
      )}

      <g className="fig-root" transform="translate(60 0)">
        {/* back leg, back arm — drawn first so they sit behind the body */}
        <g className="fig-leg back" transform="translate(-7 92)">
          <path d={FIGURE.leg} fill={mix(cloth, INK, 0.45)} />
          <path d={FIGURE.foot} fill={INK} />
        </g>

        <g className="fig-arm back" transform="translate(-13 52)">
          <path d={FIGURE.arm} fill={mix(cloth, INK, 0.4)} />
          {look.armour >= 2 && <path d={pauldronPath(look.armour)} fill={mix(plate, INK, 0.3)} />}
        </g>

        <g className="fig-body">
          {/* the straw cloak of a traveller, only while poor */}
          {minoPath(look.armour) && (
            <path
              className="fig-mino"
              transform="translate(0 44)"
              d={minoPath(look.armour)}
              fill={mix('#9B8654', INK, 0.25)}
            />
          )}

          <path transform="translate(0 44)" d={coatPath(look.armour)} fill={cloth} />
          <path transform="translate(0 44)" d={torsoPath(look.armour)} fill={mix(cloth, INK, 0.18)} />

          {/* the sash — a single vermilion note, the only colour on him for a long time */}
          <rect x={-14 - look.armour} y={74} width={28 + look.armour * 2} height={5} fill={COLORS.blood} opacity={0.85} />

          {look.armour >= 3 && (
            <path transform="translate(0 52)" d={pauldronPath(look.armour)} fill={plate} />
          )}

          <g className="fig-head" transform="translate(0 30)">
            <path d={FIGURE.head} fill={SKIN} />
            <path d={FIGURE.hair} fill={INK} />
            {headgearPath(look.head) && (
              <path d={headgearPath(look.head)} fill={look.head >= 5 ? COLORS.blood : plate} />
            )}
          </g>

          {/* front arm carries the blade */}
          <g className="fig-arm front" transform="translate(13 52)">
            <path d={FIGURE.arm} fill={cloth} />
            <g className="fig-weapon" transform="translate(2 42)">
              <path d={guardPath(look.weapon)} fill={mix(plate, INK, 0.2)} />
              <path d={bladePath(look.weapon)} fill={steel} />
              {look.weapon >= 5 && (
                <path className="fig-blade-fire" d={bladePath(look.weapon)} fill={COLORS.blood} />
              )}
            </g>
          </g>
        </g>

        <g className="fig-leg front" transform="translate(7 92)">
          <path d={FIGURE.leg} fill={cloth} />
          <path d={FIGURE.foot} fill={INK} />
        </g>
      </g>
    </svg>
  )
}

function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [r1, g1, b1] = p(a)
  const [r2, g2, b2] = p(b)
  const k = Math.max(0, Math.min(1, t))
  const c = (x: number, y: number) =>
    Math.round(x + (y - x) * k)
      .toString(16)
      .padStart(2, '0')
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`
}
