import { getDiscovery, useUI } from '../store/gameStore'

/**
 * The card that names a yōkai the first time you ever put it down. A quiet
 * flourish that turns a kill into a discovery and points at the Bestiary
 * filling up behind the scenes. It lives on the presentation timeline (born +
 * DISCOVERY_MS), so it announces itself and then fades on its own.
 */
export function Discovery() {
  useUI((s) => s.frame)
  const d = getDiscovery()
  if (!d) return null
  return (
    <div className={`discovery ${d.boss ? 'discovery-boss' : ''}`} aria-live="polite">
      <div className="discovery-eyebrow">{d.boss ? 'A king is felled' : 'First felled'}</div>
      <div className="discovery-name">
        <span className="kanji">{d.kanji}</span>
        <span>{d.name}</span>
      </div>
      <div className="discovery-lore">{d.lore}</div>
      <div className="discovery-foot">recorded in the Bestiary</div>
    </div>
  )
}
