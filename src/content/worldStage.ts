/**
 * WORLD–STAGE — how depth reads.
 *
 * The descent is one infinite counter (the old "Ri"). Here it is re-expressed
 * the way a game numbers its levels: every ten Ri is a World, and the Stage is
 * where you are inside it. Ri 1 → 0-1, Ri 10 → 1-0, Ri 137 → 13-7. It never
 * stops, because the counter underneath never does.
 */

export type WorldStage = {
  /** every ten Ri */
  world: number
  /** 0..9 within the World */
  stage: number
  /** "13-7" */
  label: string
}

export function worldStage(rank: number): WorldStage {
  const r = Math.max(0, Math.floor(rank))
  const world = Math.floor(r / 10)
  const stage = r % 10
  return { world, stage, label: `${world}-${stage}` }
}

/** Just the "W-S" string, for the many places that only need the label. */
export function wsLabel(rank: number): string {
  return worldStage(rank).label
}

/**
 * Procedural variation per World.
 *
 * Each World is seeded from its own number, so the same World always looks the
 * same but no two neighbours match — a deterministic hue rotation and a small
 * saturation lift layered on top of whatever authored Region the depth falls
 * in. This is what makes "randomly generated levels" true without authoring a
 * thousand of them: the Regions give the broad strokes, the World seed tilts
 * the palette so each one is its own place.
 */
export function worldHue(world: number): number {
  if (world <= 0) return 0
  // a well-spread hash so consecutive Worlds jump around the wheel rather than
  // drifting slowly through it
  const h = (world * 2654435761) >>> 0
  return (h % 140) - 70 // -70..69 degrees
}

export function worldSat(world: number): number {
  if (world <= 0) return 1
  const h = (world * 40503) >>> 0
  return 1 + (h % 40) / 100 // 1.00 .. 1.39
}
