/**
 * The Wardens. Each is a Stand: a timed check with one telegraphed Signature.
 * Phase 1 ships the first five. docs/07-ENEMIES.md
 *
 * Rule: a Warden must be beatable by two different builds. None of these are a
 * single-stat check.
 */
export type WardenDef = {
  id: string
  name: string
  /** lowest Rank at which this Warden takes the Stand */
  firstRank: number
  signature: string
  /** one line, second person, shown when it dies */
  defeatLine: string
  /** what the telegraph means, shown under the timer the first time */
  tell: string
  sigilSeed: number
  /** what it becomes after your first Interment */
  t2Name: string
}

/** Same identity, escalated form. Ten designs, twenty encounters. */
export function wardenName(def: WardenDef, interments: number): string {
  return interments > 0 ? def.t2Name : def.name
}

export const WARDENS: WardenDef[] = [
  {
    id: 'quartermaster',
    name: 'THE QUARTERMASTER',
    firstRank: 10,
    signature: 'ISSUE',
    tell: 'It is signing for something.',
    defeatLine: 'The Quartermaster stops writing. The line is still open.',
    sigilSeed: 0x9e37,
    t2Name: 'THE QUARTERMASTER, OVERDRAWN',
  },
  {
    id: 'surgeon',
    name: 'THE SURGEON',
    firstRank: 20,
    signature: 'CONSENT',
    tell: 'It is washing its hands.',
    defeatLine: 'The Surgeon is finished. It did not say with what.',
    sigilSeed: 0x51ed,
    t2Name: 'THE SURGEON, UNWASHED',
  },
  {
    id: 'bell',
    name: 'BELL',
    firstRank: 40,
    signature: 'REVEILLE',
    tell: 'It is drawing breath it does not have.',
    defeatLine: 'Bell stops. You do not hear it stop.',
    sigilSeed: 0x2545,
    t2Name: 'BELL, CRACKED',
  },
  {
    id: 'columnshead',
    name: "THE COLUMN'S HEAD",
    firstRank: 70,
    signature: 'ADVANCE',
    tell: 'It has taken a step you did not see it take.',
    defeatLine: "The Column's Head faces the other way now. The Column has not noticed.",
    sigilSeed: 0x7f4a,
    t2Name: 'THE HEAD, TURNED',
  },
  {
    id: 'moth',
    name: 'MOTH',
    firstRank: 110,
    signature: 'CIRCLE',
    tell: 'It is going around.',
    defeatLine: 'Moth lands. Nothing was burning.',
    sigilSeed: 0x1b873,
    t2Name: 'MOTH, SINGED',
  },
  {
    id: 'census',
    name: 'THE CENSUS',
    firstRank: 160,
    signature: 'COUNT',
    tell: 'It is adding you up.',
    defeatLine: 'The Census closes. Your entry is still open.',
    sigilSeed: 0x3c19,
    t2Name: 'THE CENSUS, AMENDED',
  },
  {
    id: 'drownedsergeant',
    name: 'THE DROWNED SERGEANT',
    firstRank: 220,
    signature: 'ORDER',
    tell: 'It is drawing breath through water.',
    defeatLine: 'The Sergeant sinks back. The order stands.',
    sigilSeed: 0x6ba1,
    t2Name: 'THE SERGEANT, SURFACING',
  },
  {
    id: 'predecessor',
    name: 'YOUR PREDECESSOR',
    firstRank: 300,
    signature: 'RECALL',
    tell: 'It is standing the way you stand.',
    defeatLine: 'Your Predecessor stops. You recognise the way it falls.',
    sigilSeed: 0x2d7f,
    t2Name: 'YOUR PREDECESSOR, CORRECTED',
  },
]

/** Which Warden holds the Stand at this Rank. */
export function wardenFor(rank: number): WardenDef {
  let out = WARDENS[0]
  for (const w of WARDENS) if (rank >= w.firstRank) out = w
  return out
}

export const WARDEN_BY_ID: Record<string, WardenDef> = Object.fromEntries(
  WARDENS.map((w) => [w.id, w]),
)
