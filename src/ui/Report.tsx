import { fmt, fmtInt, fmtTime } from '../format'
import type { OfflineReport } from '../sim/offline'
import { useUI } from '../store/gameStore'

/**
 * "While you slept". One of the best moments in the game — treat it as a
 * designed screen, not a toast. docs/11-ARCHITECTURE.md § Offline catch-up
 */
export function Report({ report }: { report: OfflineReport }) {
  const close = useUI((s) => s.setReport)
  const capped = report.creditedMs < report.awayMs - 60_000

  const rows: [string, string][] = [
    ['marched for', fmtTime(report.creditedMs)],
    ['ranks cleared', fmtInt(report.ranksCleared)],
    ['enemies felled', fmtInt(report.kills)],
    ['stands held', fmtInt(report.standsHeld)],
    ['times you died', fmtInt(report.deaths)],
    ['times you woke', fmtInt(report.reveilles)],
  ]
  if (report.relics > 0) rows.push(['carried back', `${fmtInt(report.relics)} relics`])

  return (
    <div className="overlay dark report-overlay">
      <div className="report">
        <div className="rank-label">While you slept</div>
        <div className="report-time">{fmtTime(report.awayMs)}</div>
        <div className="rank-rule" />

        <div className="report-stats">
          {rows.map(([k, v]) => (
            <div key={k} className="report-row">
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>

        {report.ashGained.gt(0) && (
          <div className="ash-award">
            <div className="ash-number">◈ {fmt(report.ashGained)}</div>
            <div className="ash-word">Ash</div>
          </div>
        )}

        <p className="report-line">{report.line}</p>

        {capped && (
          <p className="hint" style={{ marginBottom: 14 }}>
            You were away longer than the Column could account for. Only{' '}
            {fmtTime(report.creditedMs)} was counted — raise VIGIL to widen it.
          </p>
        )}

        <button className="big-btn" onClick={() => close(null)}>
          Take the count
        </button>
      </div>
    </div>
  )
}
