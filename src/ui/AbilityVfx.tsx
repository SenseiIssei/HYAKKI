import type { Cast } from '../store/gameStore'

/**
 * The animation an ability throws when it fires.
 *
 * Everything here is procedural SVG/CSS keyed to the ability's colour and TIER
 * (1..3) — no assets. Tier drives how much of it there is: a tier-1 IAI is one
 * clean line, a tier-3 IAI is a storm of them. The whole overlay lives for
 * CAST_MS and then removes itself.
 */
export function AbilityVfx({ cast }: { cast: Cast }) {
  const { vfx, tier, color } = cast
  const style = { ['--vc' as string]: color, ['--tier' as string]: String(tier) }
  return (
    <div className={`vfx vfx-${vfx} tier-${tier}`} style={style}>
      <Effect vfx={vfx} tier={tier} color={color} />
      <div className="vfx-kanji" style={{ color }}>
        {cast.kanji}
      </div>
    </div>
  )
}

function Effect({ vfx, tier, color }: { vfx: string; tier: number; color: string }) {
  const n = tier + 1 // how many strokes/bolts/etc.
  switch (vfx) {
    case 'iai':
      // clean diagonal slashes, more of them each tier
      return (
        <svg viewBox="0 0 200 200" className="vfx-svg" preserveAspectRatio="none">
          {Array.from({ length: n * 2 }, (_, i) => {
            const off = (i - n) * 18
            return (
              <line
                key={i}
                x1={20 + off}
                y1={190}
                x2={180 + off}
                y2={10}
                stroke={color}
                strokeWidth={tier >= 3 ? 4 : 3}
                className="vfx-slash"
                style={{ animationDelay: `${i * 45}ms` }}
              />
            )
          })}
        </svg>
      )
    case 'flame':
      // a bloom of embers rising
      return (
        <div className="vfx-flame-wrap">
          <div className="vfx-flame-core" />
          {Array.from({ length: n * 6 }, (_, i) => (
            <span
              key={i}
              className="ember"
              style={{
                ['--a' as string]: `${(i / (n * 6)) * 360}deg`,
                ['--d' as string]: `${(i % 3) * 60}ms`,
              }}
            />
          ))}
        </div>
      )
    case 'lightning':
      return (
        <svg viewBox="0 0 200 200" className="vfx-svg" preserveAspectRatio="none">
          {Array.from({ length: n }, (_, i) => {
            const x = 100 + (i - n / 2) * 30
            const jag = `M ${x} 0 L ${x - 14} 70 L ${x + 10} 80 L ${x - 8} 150 L ${x + 16} 160 L ${x - 4} 200`
            return (
              <path
                key={i}
                d={jag}
                stroke={color}
                strokeWidth={tier >= 3 ? 5 : 3}
                fill="none"
                className="vfx-bolt"
                style={{ animationDelay: `${i * 70}ms` }}
              />
            )
          })}
        </svg>
      )
    case 'wind':
      // curved crescent blades sweeping across
      return (
        <svg viewBox="0 0 200 200" className="vfx-svg" preserveAspectRatio="none">
          {Array.from({ length: n * 2 }, (_, i) => (
            <path
              key={i}
              d={`M 10 ${40 + i * 22} Q 100 ${10 + i * 22} 190 ${40 + i * 22}`}
              stroke={color}
              strokeWidth={2.5}
              fill="none"
              className="vfx-gust"
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}
        </svg>
      )
    case 'void':
      return (
        <div className="vfx-void-wrap">
          <div className="vfx-void-hole" />
          {Array.from({ length: n * 4 }, (_, i) => (
            <span
              key={i}
              className="void-shard"
              style={{ ['--a' as string]: `${(i / (n * 4)) * 360}deg` }}
            />
          ))}
        </div>
      )
    case 'meteor':
      return (
        <div className="vfx-meteor-wrap">
          {Array.from({ length: n * 3 }, (_, i) => (
            <span
              key={i}
              className="meteor"
              style={{
                ['--x' as string]: `${(i / (n * 3)) * 100}%`,
                ['--d' as string]: `${i * 60}ms`,
              }}
            />
          ))}
          <div className="vfx-meteor-flash" />
        </div>
      )
    case 'frost':
      // a flurry of ice slivers flung outward, and a cold ring
      return (
        <div className="vfx-frost-wrap">
          {Array.from({ length: n * 8 }, (_, i) => (
            <span
              key={i}
              className="frost-shard"
              style={{
                ['--a' as string]: `${(i / (n * 8)) * 360}deg`,
                ['--d' as string]: `${(i % 5) * 45}ms`,
              }}
            />
          ))}
          <div className="vfx-frost-ring" />
        </div>
      )
    default:
      return null
  }
}
