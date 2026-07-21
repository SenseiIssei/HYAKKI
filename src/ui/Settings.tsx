import { useState } from 'react'
import { createInitialState } from '../sim/state'
import { exportSave, hardReset, importSave } from '../save/storage'
import { game, replaceGame, saveNow, useUI } from '../store/gameStore'
import { fmtInt, fmtTime } from '../format'
import { BALANCE as B } from '../content/balance'

export function Settings() {
  const close = useUI((s) => s.setSettings)
  const numbersOnly = useUI((s) => s.numbersOnly)
  const setNumbersOnly = useUI((s) => s.setNumbersOnly)
  const fontScale = useUI((s) => s.fontScale)
  const setFontScale = useUI((s) => s.setFontScale)
  const [blob, setBlob] = useState('')
  const [msg, setMsg] = useState('')
  const g = game()

  return (
    <div className="overlay dark" onClick={() => close(false)}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <h2>The Ledger</h2>
        <div className="hint">
          soldier #{fmtInt(g.soldierNumber)} · {fmtInt(g.totalKills)} felled ·{' '}
          {fmtInt(g.totalDeaths)} deaths · {fmtTime((g.totalTicks / B.TICKS_PER_SEC) * 1000)} marched
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
          Motion follows your system setting. Keys: 1 Tree · 2 Carried · 3 Orders · 4 here ·
          Esc closes.
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
