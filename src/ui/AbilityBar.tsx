import { abilityStatuses, useUI } from '../store/gameStore'

/**
 * The arts you know, and how close each is to firing again.
 *
 * You never press these — the game is idle and they auto-cast — so this is a
 * READOUT, not a control: a row of seals, each with a cooldown ring winding
 * down, its level, and a glow when it is ready to go off. It only appears once
 * you have learned your first art.
 */
export function AbilityBar() {
  useUI((s) => s.frame)
  const arts = abilityStatuses()
  if (!arts.length) return null
  return (
    <div className="ability-bar">
      {arts.map((a) => {
        const ready = a.cd <= 0.001
        return (
          <div
            key={a.id}
            className={`ability-seal tier-${a.tier} ${ready ? 'ready' : ''}`}
            style={{ ['--ac' as string]: a.color }}
            title={`${a.name} · lv ${a.level}`}
          >
            {/* the cooldown wipes the seal dark, then it lights back up */}
            <div className="seal-cd" style={{ transform: `scaleY(${a.cd})` }} />
            <span className="seal-kanji">{a.kanji}</span>
            <span className="seal-lv">{a.level}</span>
            {ready && <span className="seal-glow" />}
          </div>
        )
      })}
    </div>
  )
}
