import { useEffect, useState } from 'react'
import { Backdrop } from './Backdrop'
import { PixelWalker } from './PixelActor'
import { fmtInt, fmtTime } from '../format'
import { BALANCE as B } from '../content/balance'
import { game, stats, useT, useUI } from '../store/gameStore'
import { wsLabel } from '../content/worldStage'
import { isDesktop, winHide, winQuit } from '../save/desktop'

/**
 * The front of the game. A title, a road already moving behind it, and the
 * walker standing on it — so the first thing you see is the thing you are.
 */
export function MainMenu({
  onContinue,
  onNew,
}: {
  onContinue: () => void
  onNew: () => void
}) {
  const g = game()
  const st = stats()
  const setSettings = useUI((s) => s.setSettings)
  const setLedger = useUI((s) => s.setLedger)
  const setWards = useUI((s) => s.setWards)
  const setStories = useUI((s) => s.setStories)
  const setBestiary = useUI((s) => s.setBestiary)
  const setDescend = useUI((s) => s.setDescend)
  const setRelics = useUI((s) => s.setRelics)
  const t = useT()
  const [confirming, setConfirming] = useState(false)

  const played = g.totalTicks > 0
  const hasWalked = played || g.reveilles > 0

  // Enter continues; Esc backs out of the confirm
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !confirming) hasWalked ? onContinue() : onNew()
      if (e.key === 'Escape') setConfirming(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirming, hasWalked, onContinue, onNew])

  return (
    <div className="menu">
      <Backdrop ri={g.bestRankEver || 1} />

      <div className="menu-inner">
        <div className="menu-title">
          <div className="menu-kanji">百鬼</div>
          <div className="menu-romaji">Hyakki</div>
          <div className="menu-tag">{t('menu.tagline')}</div>
        </div>

        <div className="menu-walker">
          <PixelWalker stats={st} pose="walk" scale={4} />
        </div>

        {confirming ? (
          <div className="menu-confirm">
            <p className="menu-warn">
              There is already someone on the road — {fmtInt(g.soldierNumber)}, who has walked{' '}
              {fmtTime((g.totalTicks / B.TICKS_PER_SEC) * 1000)} and got as far as{' '}
              {wsLabel(g.bestRankEver)}.
            </p>
            <p className="menu-warn">{t('confirm.warn2')}</p>
            <div className="menu-row">
              <button className="menu-btn danger" onClick={onNew}>
                {t('confirm.unmake')}
              </button>
              <button className="menu-btn" onClick={() => setConfirming(false)}>
                {t('confirm.leave')}
              </button>
            </div>
          </div>
        ) : (
          <nav className="menu-nav">
            {hasWalked && (
              <button className="menu-btn primary" onClick={onContinue}>
                {t('menu.continue')}
                <span className="menu-sub">
                  #{fmtInt(g.soldierNumber)} · {wsLabel(g.rank)}
                </span>
              </button>
            )}
            <button
              className={`menu-btn ${hasWalked ? '' : 'primary'}`}
              onClick={() => (hasWalked ? setConfirming(true) : onNew())}
            >
              {hasWalked ? t('menu.begin_again') : t('menu.newgame')}
              {!hasWalked && <span className="menu-sub">{t('menu.newgame_sub')}</span>}
            </button>
            {hasWalked && (g.interments > 0 || g.apotheoses > 0) && (
              <button
                className="menu-btn"
                data-kind="delve"
                onClick={() => {
                  onContinue()
                  setDescend(true)
                }}
              >
                {t('menu.dungeon')}
                <span className="menu-sub">{t('menu.dungeon_sub')}</span>
              </button>
            )}
            {hasWalked && (
              <button
                className="menu-btn"
                data-kind="gear"
                onClick={() => {
                  onContinue()
                  setRelics(true)
                }}
              >
                {t('menu.inventory')}
                <span className="menu-sub">
                  {fmtInt(g.inventory.length)} · {fmtInt(g.equipped.filter(Boolean).length)}/6
                </span>
              </button>
            )}
            {g.fragments.length > 0 && (
              <button className="menu-btn" data-kind="lore" onClick={() => setStories(true)}>
                {t('menu.candles')}
                <span className="menu-sub">
                  {g.snuffed.length > 0
                    ? `${fmtInt(g.snuffed.filter((n) => n <= 99).length)} put out`
                    : `${fmtInt(g.fragments.length)} lit`}
                </span>
              </button>
            )}
            {g.ofudaOwned.length > 0 && (
              <button className="menu-btn" data-kind="vow" onClick={() => setWards(true)}>
                {t('menu.wards')}
                <span className="menu-sub">
                  {g.ofuda.length > 0 ? `carrying ${fmtInt(g.ofuda.length)}` : t('menu.wards_sub')}
                </span>
              </button>
            )}
            {hasWalked && (
              <button className="menu-btn" data-kind="lore" onClick={() => setBestiary(true)}>
                The Bestiary
                <span className="menu-sub">the hundred demons, and your count</span>
              </button>
            )}
            {hasWalked && (
              <button className="menu-btn" data-kind="lore" onClick={() => setLedger(true)}>
                {t('menu.register')}
                <span className="menu-sub">{t('menu.register_sub')}</span>
              </button>
            )}
            <button className="menu-btn" onClick={() => setSettings(true)}>
              {t('menu.options')}
            </button>
            {isDesktop() && (
              <button className="menu-btn quiet" onClick={winHide}>
                {t('menu.stop_watching')}
                <span className="menu-sub">{t('menu.stop_watching_sub')}</span>
              </button>
            )}
            {isDesktop() && (
              <button className="menu-btn quiet" onClick={winQuit}>
                {t('menu.quit')}
              </button>
            )}
          </nav>
        )}
      </div>

      <div className="menu-foot">
        <span>百鬼 0.1.0</span>
        <span>{t('footer.tagline')}</span>
      </div>
    </div>
  )
}
