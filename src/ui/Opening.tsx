import { CLASSES, classUnlocked, unlockProgress } from '../content/classes'
import { fmtPct } from '../format'
import { PixelWalker } from './PixelActor'
import type { Look } from '../render/figure'

/**
 * What each class looks like on its card.
 *
 * These are AUTHORED, not derived. The first attempt built them from each
 * class's grants and passives, which was tidier but wrong: classes are defined
 * by how they produce damage, not by their opening statline, so six classes
 * came out with the same blade, the same armour and the same head. A card has
 * one job — to say what you would become — and six identical men do not say it.
 */
export const CLASS_LOOKS: Record<string, Look> = {
  // NIŌ, the gate that is a person: everything is armour, the blade incidental
  hoplite: { weapon: 2, armour: 5, head: 4, gait: 1.05, aura: 0.1, kegare: 0 },
  // KITSUNEBI, foxfire: burning blade, almost no armour, lit from inside
  lampbearer: { weapon: 5, armour: 1, head: 3, gait: 0.55, aura: 0.95, kegare: 0.1 },
  // ONMYŌJI, the diviner: robes and a wide hat, carries paper rather than plate
  augur: { weapon: 3, armour: 1, head: 3, gait: 0.8, aura: 0.55, kegare: 0 },
  // ONRYŌ, the vengeful dead: no armour at all, a mask, and far too fast
  revenant: { weapon: 4, armour: 0, head: 5, gait: 0.42, aura: 0.35, kegare: 0.95 },
  // KUCHIYOSE, the summoner: plain, deliberately — the power stands behind them
  chorus: { weapon: 2, armour: 2, head: 2, gait: 0.75, aura: 0.45, kegare: 0.35 },
  // ONBŌ, who burns the dead: a long blade and a working man's cloak
  gravedigger: { weapon: 5, armour: 3, head: 1, gait: 0.95, aura: 0.2, kegare: 0.55 },
}

const FALLBACK_LOOK: Look = {
  weapon: 3, armour: 3, head: 2, gait: 0.8, aura: 0.3, kegare: 0.2,
}

type Progress = { totalDeaths: number; reveilles: number; totalKills: number }

/**
 * The whole tutorial. Two lines, three sigils, then combat starts immediately.
 * Locked classes are shown, not hidden — knowing what you are marching toward
 * is most of the reason to keep marching. docs/02-CORE-LOOP.md § Minute one
 */
export function Opening({
  progress,
  onChoose,
  title = 'A hundred demons. Which is to say: too many to count.',
  prompt = 'Choose what you were',
  onCancel,
}: {
  progress: Progress
  onChoose: (id: string) => void
  title?: string
  prompt?: string
  onCancel?: () => void
}) {
  return (
    <div className="overlay dark" onClick={onCancel}>
      <div className="opening" onClick={(e) => e.stopPropagation()}>
        <p className="opening-line">{title}</p>
        <p className="opening-prompt">{prompt}</p>

        <div className="class-grid">
          {CLASSES.map((c) => {
            const open = classUnlocked(c, progress)
            const p = unlockProgress(c, progress)
            return (
              <button
                key={c.id}
                className={`class-card ${open ? '' : 'locked'}`}
                disabled={!open}
                onClick={() => open && onChoose(c.id)}
                aria-label={open ? c.name : `${c.name}, locked. ${c.unlock?.text ?? ''}`}
              >
                <span className={`class-figure ${open ? '' : 'shrouded'}`}>
                  <PixelWalker
                    look={CLASS_LOOKS[c.id] ?? FALLBACK_LOOK}
                    pose={open ? 'walk' : 'brace'}
                    scale={3}
                  />
                </span>
                <span className="class-name">
                  {c.kanji && <span className="kanji class-kanji">{c.kanji}</span>}
                  {c.name}
                </span>
                <span className="class-epithet">{c.epithet}</span>
                {open ? (
                  <span className="class-meta">
                    {c.wants}
                    <br />
                    <span className="class-curse">{c.curseText}</span>
                  </span>
                ) : (
                  <span className="class-meta">
                    <span className="class-locked">{c.unlock?.text}</span>
                    <span className="lock-bar">
                      <span className="lock-fill" style={{ width: `${p * 100}%` }} />
                    </span>
                    <span className="class-locked">{fmtPct(p, 0)}</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {onCancel && (
          <button className="small-btn" style={{ marginTop: 22 }} onClick={onCancel}>
            Keep walking as you are
          </button>
        )}
      </div>
    </div>
  )
}
