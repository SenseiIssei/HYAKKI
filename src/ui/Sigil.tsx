import { useMemo } from 'react'
import { getSigil } from '../render/sigil'
import type { SigilPreset } from '../render/presets'

type Props = {
  preset: SigilPreset
  seed: number
  /** cache key — must change only when the drawing should change */
  cacheKey: string
  color: string
  className?: string
  /** seconds per full rotation; direction derives from the seed */
  spin?: number
  breathe?: boolean
  flash?: boolean
}

export function Sigil({ preset, seed, cacheKey, color, className, spin = 260, breathe, flash }: Props) {
  const sig = useMemo(() => getSigil(preset, seed, cacheKey), [preset, seed, cacheKey])
  const reverse = (seed & 1) === 1
  const maskId = `nm-${cacheKey.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg
      className={`sigil ${breathe ? 'sigil-breathe' : ''} ${flash ? 'sigil-flash' : ''} ${className ?? ''}`}
      viewBox={sig.viewBox}
      aria-hidden="true"
    >
      {sig.core === 'negative' && (
        <mask id={maskId}>
          <rect width="100" height="100" fill="white" />
          <circle cx="50" cy="50" r={sig.coreR} fill="black" />
        </mask>
      )}
      <g
        className={`sigil-spin ${reverse ? 'rev' : ''}`}
        style={{ ['--spin' as string]: `${spin}s` }}
        mask={sig.core === 'negative' ? `url(#${maskId})` : undefined}
      >
        {sig.paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke={color}
            strokeWidth={p.w}
            strokeOpacity={p.o}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {sig.core === 'solid' && <circle cx="50" cy="50" r={sig.coreR} fill={color} />}
        {sig.core === 'hollow' && (
          <circle cx="50" cy="50" r={sig.coreR} fill="none" stroke={color} strokeWidth={1.4} />
        )}
      </g>
    </svg>
  )
}
