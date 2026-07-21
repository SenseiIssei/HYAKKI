import { useEffect } from 'react'
import { BALANCE as B } from '../content/balance'
import { step } from '../sim/combat'
import { catchUp, shouldReveille } from '../sim/offline'
import { projectedAsh, reveille } from '../sim/prestige'
import {
  drainEvents,
  game,
  refreshStats,
  saveNow,
  setReport,
  useUI,
} from '../store/gameStore'

const PUMP_MS = 50
const RENDER_MS = 1000 / 10
const MAX_TICKS_PER_PUMP = 400
/** Longer than this and we treat the gap as time away, not as lag. */
const AWAY_THRESHOLD_MS = 5_000
/** Don't interrupt the player with a report for a trip to the kitchen. */
const REPORT_THRESHOLD_MS = 3 * 60_000

/**
 * The sim is driven by a wall-clock accumulator on a setInterval, NOT by
 * requestAnimationFrame. rAF is suspended entirely in a hidden or unfocused
 * tab, which for an idle game means the thing silently stops being an idle
 * game. setInterval is throttled to ~1Hz in the background, but because every
 * pump simulates `Date.now() - last` rather than a fixed step, throttling costs
 * us resolution and never progress.
 *
 * docs/11-ARCHITECTURE.md § The game loop
 */
export function useGameLoop() {
  const bump = useUI((s) => s.bump)

  useEffect(() => {
    const g = game()

    // ── time spent with the game closed ──
    const away = Date.now() - g.lastSeenAt
    if (away > AWAY_THRESHOLD_MS) {
      const report = catchUp(g, away)
      refreshStats()
      if (away >= REPORT_THRESHOLD_MS) setReport(report)
      bump()
    }
    g.lastSeenAt = Date.now()

    let carryMs = 0
    let lastWall = Date.now()
    let lastRender = 0
    let lastSave = Date.now()
    let idleTicks = 0
    let lastRank = g.rank

    const pump = () => {
      const now = Date.now()
      const dt = now - lastWall
      lastWall = now

      if (dt > AWAY_THRESHOLD_MS) {
        // Laptop slept, or the tab was frozen hard. Same path as offline.
        const report = catchUp(game(), dt)
        refreshStats()
        if (dt >= REPORT_THRESHOLD_MS) setReport(report)
      } else if (dt > 0) {
        carryMs += dt
        let ticks = Math.floor(carryMs / B.TICK_MS)
        carryMs -= ticks * B.TICK_MS
        if (ticks > MAX_TICKS_PER_PUMP) ticks = MAX_TICKS_PER_PUMP
        if (ticks > 0) {
          const s = game()
          step(s, ticks)
          idleTicks = s.rank === lastRank ? idleTicks + ticks : 0
          lastRank = s.rank

          // Standing Orders also run while you are watching.
          if (shouldReveille(s, idleTicks)) {
            s.lastAsh = projectedAsh(s)
            reveille(s)
            refreshStats()
            idleTicks = 0
            lastRank = s.rank
          }
        }
      }

      const changed = drainEvents(now)
      if (now - lastRender >= RENDER_MS && changed) {
        lastRender = now
        bump()
      }
      if (now - lastSave >= B.SAVE_INTERVAL_MS) {
        lastSave = now
        saveNow()
      }
    }

    const id = window.setInterval(pump, PUMP_MS)
    window.addEventListener('beforeunload', saveNow)
    document.addEventListener('visibilitychange', saveNow)

    return () => {
      window.clearInterval(id)
      window.removeEventListener('beforeunload', saveNow)
      document.removeEventListener('visibilitychange', saveNow)
      saveNow()
    }
  }, [bump])
}
