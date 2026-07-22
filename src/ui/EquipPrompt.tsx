import { RARITIES, SLOT_META } from '../content/relics'
import { relicLabel } from '../sim/relics'
import { compare, equipRelic, game, useT, useUI } from '../store/gameStore'

/**
 * "A better item. Equip it?" — raised when a drop beats what's worn in its
 * slot and the player has chosen to be asked. Shows the real gain (measured by
 * the sim, not guessed) and lets them equip, keep, or switch to always-auto.
 */
export function EquipPrompt() {
  useUI((s) => s.frame)
  const uid = useUI((s) => s.pendingEquip)
  const setPending = useUI((s) => s.setPendingEquip)
  const setAutoEquip = useUI((s) => s.setAutoEquip)
  const t = useT()
  const g = game()

  const relic = uid ? g.inventory.find((r) => r.uid === uid) : null
  if (!relic) return null

  const c = RARITIES[relic.rarity].color
  const cmp = compare(relic)
  const dps = cmp.dpsDelta
  const surv = cmp.survivalDelta
  const pctStr = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)}%`

  const close = () => setPending(null)
  const doEquip = () => {
    equipRelic(relic.uid)
    close()
  }

  return (
    <div className="equip-prompt-scrim" onClick={close}>
      <div className="equip-prompt" style={{ borderColor: c }} onClick={(e) => e.stopPropagation()}>
        <div className="ep-head">{t('equip.better')}</div>
        <div className="ep-name" style={{ color: c }}>
          <span className="kanji">{SLOT_META[relic.slot].kanji}</span> {relicLabel(relic)}
        </div>
        <div className="ep-tier">
          {RARITIES[relic.rarity].label} · {SLOT_META[relic.slot].label}
        </div>
        <div className="ep-deltas">
          {Math.abs(dps) > 0.001 && (
            <span className={dps > 0 ? 'up' : 'down'}>
              {dps > 0 ? '▲' : '▼'} DMG {pctStr(dps)}
            </span>
          )}
          {Math.abs(surv) > 0.001 && Number.isFinite(cmp.survivalNext) && (
            <span className={surv > 0 ? 'up' : 'down'}>
              {surv > 0 ? '▲' : '▼'} SURV {pctStr(surv)}
            </span>
          )}
        </div>
        <div className="ep-q">{t('equip.q')}</div>
        <div className="ep-actions">
          <button className="big-btn" onClick={doEquip}>
            {t('equip.yes')}
          </button>
          <button className="small-btn" onClick={close}>
            {t('equip.no')}
          </button>
        </div>
        <button
          className="ep-always"
          onClick={() => {
            setAutoEquip('auto')
            doEquip()
          }}
        >
          {t('equip.always')}
        </button>
      </div>
    </div>
  )
}
