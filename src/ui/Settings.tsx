import { useEffect, useState } from 'react'
import { audioLevel } from '../audio/engine'
import { createInitialState } from '../sim/state'
import { exportSave, hardReset, importSave } from '../save/storage'
import { game, replaceGame, saveNow, useUI } from '../store/gameStore'
import { fmtInt, fmtTime } from '../format'
import { BALANCE as B } from '../content/balance'

export function Settings() {
  const close = useUI((s) => s.setSettings)
  const numbersOnly = useUI((s) => s.numbersOnly)
  const setNumbersOnly = useUI((s) => s.setNumbersOnly)
  const screenShake = useUI((s) => s.screenShake)
  const setScreenShake = useUI((s) => s.setScreenShake)
  const damageNumbers = useUI((s) => s.damageNumbers)
  const setDamageNumbers = useUI((s) => s.setDamageNumbers)
  const fontScale = useUI((s) => s.fontScale)
  const setFontScale = useUI((s) => s.setFontScale)
  const audioOn = useUI((s) => s.audioOn)
  const setAudioOn = useUI((s) => s.setAudioOn)
  const audioVolume = useUI((s) => s.audioVolume)
  const setAudioVolume = useUI((s) => s.setAudioVolume)
  const musicOn = useUI((s) => s.musicOn)
  const setMusicOn = useUI((s) => s.setMusicOn)
  const [blob, setBlob] = useState('')
  const [level, setLevel] = useState(0)

  // A meter, so "is the sound on?" is answerable by looking.
  useEffect(() => {
    if (!audioOn) return
    const id = window.setInterval(() => setLevel(audioLevel()), 100)
    return () => window.clearInterval(id)
  }, [audioOn])
  const [msg, setMsg] = useState('')
  const g = game()

  return (
    <div className="overlay dark" onClick={() => close(false)}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-row">
          <button
            className="small-btn"
            onClick={() => {
              close(false)
              useUI.getState().setLedger(true)
            }}
          >
            Open the Ledger
          </button>
          <span className="hint" style={{ alignSelf: 'center' }}>
            #{fmtInt(g.soldierNumber)} · {fmtTime((g.totalTicks / B.TICKS_PER_SEC) * 1000)} marched
          </span>
        </div>

        <h2>Sound</h2>
        <label className="orders-toggle">
          <input
            type="checkbox"
            checked={audioOn}
            onChange={(e) => setAudioOn(e.target.checked)}
          />
          <span>Drone, bell, breath</span>
        </label>
        {audioOn && (
          <div className="orders-rule">
            <span className="orders-when">volume</span>
            <span className="orders-value">{audioVolume}%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={audioVolume}
              onChange={(e) => setAudioVolume(Number(e.target.value))}
              aria-label="Volume"
            />
            <span className="bar" style={{ height: 3 }}>
              <span
                className="bar-fill resolve"
                style={{ width: `${Math.min(100, level * 400)}%` }}
              />
            </span>
          </div>
        )}
        {audioOn && (
          <label className="orders-toggle">
            <input
              type="checkbox"
              checked={musicOn}
              onChange={(e) => setMusicOn(e.target.checked)}
            />
            <span>Koto, taiko, breath</span>
          </label>
        )}
        <div className="hint">
          Everything you hear is generated as it plays — the music is written on the in
          scale as it goes, so it never repeats. There are no sound files, for the same
          reason there are no pictures.
        </div>

        <h2>Display</h2>
        <label className="orders-toggle">
          <input
            type="checkbox"
            checked={numbersOnly}
            onChange={(e) => setNumbersOnly(e.target.checked)}
          />
          <span>Numbers only — no sigils, combat as a log</span>
        </label>
        <label className="orders-toggle">
          <input
            type="checkbox"
            checked={damageNumbers}
            onChange={(e) => setDamageNumbers(e.target.checked)}
          />
          <span>Floating damage numbers</span>
        </label>
        <label className="orders-toggle">
          <input
            type="checkbox"
            checked={screenShake}
            onChange={(e) => setScreenShake(e.target.checked)}
          />
          <span>Impact — hit-stop and screen shake</span>
        </label>
        <div className="panel-row">
          <span className="hint" style={{ alignSelf: 'center' }}>Text size</span>
          {[90, 100, 120].map((n) => (
            <button
              key={n}
              className="small-btn"
              data-on={fontScale === n}
              onClick={() => setFontScale(n)}
            >
              {n}%
            </button>
          ))}
        </div>
        <div className="hint">
          Motion follows your system setting. Keys: 1 Tree · 2 Carried · 3 Orders ·
          4 Bargain · 5 Descend · 6 Apotheosis · 7 here · Esc closes.
        </div>

        <h2>Save</h2>
        <textarea
          value={blob}
          spellCheck={false}
          placeholder="Paste a save here to import, or export below."
          onChange={(e) => setBlob(e.target.value)}
        />
        <div className="panel-row">
          <button
            className="small-btn"
            onClick={() => {
              saveNow()
              setBlob(exportSave(game()))
              setMsg('Exported. Copy the text above.')
            }}
          >
            Export
          </button>
          <button
            className="small-btn"
            onClick={() => {
              try {
                replaceGame(importSave(blob))
                setMsg('Imported.')
              } catch (err) {
                setMsg(err instanceof Error ? err.message : 'That did not work.')
              }
            }}
          >
            Import
          </button>
          <button
            className="small-btn danger"
            onClick={() => {
              if (!confirm('Erase everything? There is no undo.')) return
              hardReset()
              replaceGame(createInitialState())
              setMsg('Erased.')
            }}
          >
            Hard reset
          </button>
        </div>
        {msg && <div className="hint">{msg}</div>}

        <div className="panel-row" style={{ justifyContent: 'flex-end' }}>
          <button className="small-btn" onClick={() => close(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
