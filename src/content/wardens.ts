/**
 * THE TEN KINGS 十王 — the judges of the dead.
 *
 * Ten documented magistrates who pronounce at set intervals after death. They
 * hold the Judgment every tenth Ri.
 *
 * They are NOT killed. The hearing ends, or it does not — copy never says
 * "defeated". Keeping a living religious figure out of the position of farmable
 * boss is the rule. docs/hyakki/01-LORE.md
 */
export type WardenDef = {
  id: string
  name: string
  kanji: string
  /** when this King pronounces, after death */
  judges: string
  /** lowest Ri at which this King takes the hearing */
  firstRank: number
  signature: string
  /** one line, second person, when the hearing ends */
  defeatLine: string
  /** the telegraph — clerical courtesy is the most frightening register here */
  tell: string
  sigilSeed: number
  /** what it becomes after Enshrinement */
  t2Name: string
}

/** Same identity, escalated form. Ten designs, twenty hearings. */
export function wardenName(def: WardenDef, interments: number): string {
  return interments > 0 ? def.t2Name : def.name
}

export const WARDENS: WardenDef[] = [
  {
    id: 'quartermaster',
    name: 'SHINKŌ-Ō',
    kanji: '秦広王',
    judges: 'the seventh day',
    firstRank: 10,
    signature: 'THE FIRST HEARING',
    tell: 'It is opening the register.',
    defeatLine: 'The first hearing is adjourned. There are nine more.',
    sigilSeed: 0x9e37,
    t2Name: 'SHINKŌ-Ō, AMENDED',
  },
  {
    id: 'surgeon',
    name: 'SHOKŌ-Ō',
    kanji: '初江王',
    judges: 'the fourteenth day',
    firstRank: 20,
    signature: 'THE CROSSING',
    tell: 'The ground is getting wet.',
    defeatLine: 'You are permitted to cross. It does not say by which of the three.',
    sigilSeed: 0x51ed,
    t2Name: 'SHOKŌ-Ō, AMENDED',
  },
  {
    id: 'bell',
    name: 'SŌTEI-Ō',
    kanji: '宋帝王',
    judges: 'the twenty-first day',
    firstRank: 40,
    signature: 'THE ACCOUNT',
    tell: 'It has found the page.',
    defeatLine: 'It stops reading. It does not close the book.',
    sigilSeed: 0x2545,
    t2Name: 'SŌTEI-Ō, AMENDED',
  },
  {
    id: 'columnshead',
    name: 'GOKAN-Ō',
    kanji: '五官王',
    judges: 'the twenty-eighth day',
    firstRank: 70,
    signature: 'THE SCALES',
    tell: 'One pan of the scale has begun to move.',
    defeatLine: 'You weigh what you weigh. It writes the figure down.',
    sigilSeed: 0x7f4a,
    t2Name: 'GOKAN-Ō, AMENDED',
  },
  {
    id: 'moth',
    name: 'ENMA-Ō',
    kanji: '閻魔王',
    judges: 'the thirty-fifth day — the final judgment',
    firstRank: 110,
    signature: 'JŌHARI NO KAGAMI',
    tell: 'Miru-me has seen it. Kagu-hana has smelled it.',
    defeatLine: 'Enma turns the mirror away. You are not told what was in it.',
    sigilSeed: 0x1b873,
    t2Name: 'ENMA-Ō, AMENDED',
  },
  {
    id: 'census',
    name: 'HENSEI-Ō',
    kanji: '変成王',
    judges: 'the forty-second day',
    firstRank: 160,
    signature: 'THE ALTERATION',
    tell: 'It is deciding what you will be instead.',
    defeatLine: 'You are permitted to remain what you are. For now, is implied.',
    sigilSeed: 0x3c19,
    t2Name: 'HENSEI-Ō, AMENDED',
  },
  {
    id: 'drownedsergeant',
    name: 'TAIZAN-Ō',
    kanji: '泰山王',
    judges: 'the forty-ninth day',
    firstRank: 220,
    signature: 'THE ALLOTMENT',
    tell: 'It is choosing which of the six roads.',
    defeatLine: 'The allotment is deferred. Deferred is not the same as spared.',
    sigilSeed: 0x6ba1,
    t2Name: 'TAIZAN-Ō, AMENDED',
  },
  {
    id: 'predecessor',
    name: 'BYŌDŌ-Ō',
    kanji: '平等王',
    judges: 'the hundredth day',
    firstRank: 300,
    signature: 'EQUALITY',
    tell: 'It is counting what you have put down.',
    defeatLine: 'It finds you equal to what you have done. It does not say to how much.',
    sigilSeed: 0x2d7f,
    t2Name: 'BYŌDŌ-Ō, AMENDED',
  },
  {
    id: 'toshi',
    name: 'TOSHI-Ō',
    kanji: '都市王',
    judges: 'the first year',
    firstRank: 400,
    signature: 'THE REGISTER',
    tell: 'It has asked you not to speak.',
    defeatLine: 'The entry is made. You are not shown the entry.',
    sigilSeed: 0x4af2,
    t2Name: 'TOSHI-Ō, AMENDED',
  },
  {
    id: 'godo',
    name: 'GODŌ-TENRIN-Ō',
    kanji: '五道転輪王',
    judges: 'the third year — the last of them',
    firstRank: 500,
    signature: 'THE WHEEL',
    tell: 'The wheel has started and it does not stop for hearings.',
    defeatLine: 'The wheel goes round. You are still on the outside of it.',
    sigilSeed: 0x11c9,
    t2Name: 'GODŌ-TENRIN-Ō, FINAL',
  },
]

/** Which King holds the hearing at this Ri. */
export function wardenFor(rank: number): WardenDef {
  let out = WARDENS[0]
  for (const w of WARDENS) if (rank >= w.firstRank) out = w
  return out
}

export const WARDEN_BY_ID: Record<string, WardenDef> = Object.fromEntries(
  WARDENS.map((w) => [w.id, w]),
)

/** Enma's two assistants, named on screen — which is worse than anonymous. */
export const ENMA_HEADS = [
  { name: 'MIRU-ME', kanji: '見る目', does: 'perceives your secret faults' },
  { name: 'KAGU-HANA', kanji: '嗅ぐ鼻', does: 'smells out what you did' },
]
