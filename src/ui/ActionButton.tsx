/**
 * A self-speaking action button: a plain-language title with a one-line
 * description of what it does, colour-coded by what KIND of thing it is, so the
 * bottom bar reads as "here is what you can do and why" instead of a row of
 * cryptic little folklore words. The evocative name stays — it just no longer
 * has to carry the explaining on its own.
 *
 * `kind` drives the accent colour through a CSS custom property, so every
 * button of the same family (growth, prestige, delving…) shares a hue and the
 * eye can group them at a glance.
 */
export type ActionKind =
  | 'grow' // spend the small currency to get stronger
  | 'vow' // standing orders
  | 'prestige' // give this run up for lasting power
  | 'delve' // the dungeon
  | 'become' // the deepest meta-progression
  | 'gear' // inventory / equipment
  | 'lore' // stories, register, reading

export function ActionButton({
  kind,
  title,
  sub,
  dot,
  onClick,
}: {
  kind: ActionKind
  title: string
  sub: string
  dot?: boolean
  onClick: () => void
}) {
  return (
    <button className="act-btn" data-kind={kind} onClick={onClick}>
      <span className="act-title">
        {title}
        {dot && <span className="dot" />}
      </span>
      <span className="act-sub">{sub}</span>
    </button>
  )
}
