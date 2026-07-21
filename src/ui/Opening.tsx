import { CLASSES, classUnlocked, unlockProgress } from '../content/classes'
import { COLORS } from '../render/presets'
import { fmtPct } from '../format'
import { Sigil } from './Sigil'

type Progress = { totalDeaths: number; reveilles: number; totalKills: number }

/**
 * The whole tutorial. Two lines, three sigils, then combat starts immediately.
 * Locked classes are shown, not hidden — knowing what you are marching toward
 * is most of the reason to keep marching. docs/02-CORE-LOOP.md § Minute one
 */
export function Opening({
  seed,
  progress,
  onChoose,
  title = 'Ten thousand were sent.',
  prompt = 'Choose what you were',
  onCancel,
}: {
  seed: number
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
                <Sigil
                  preset={c.sigil}
                  seed={seed ^ c.id.charCodeAt(0)}
                  cacheKey={`pick-${c.id}`}
                  color={open ? COLORS.bone : COLORS.ash}
                  spin={280}
                />
                <span className="class-name">{c.name}</span>
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
            Keep marching as you are
          </button>
        )}
      </div>
    </div>
  )
}
