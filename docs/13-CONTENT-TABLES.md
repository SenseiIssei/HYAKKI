# 13 — Content Tables

Ship-ready data. Paste these into `src/content/` and tune. All costs/values are starting points, to be corrected by the balance harness ([03 §9](03-COMBAT-MATH.md)).

---

## `balance.ts`

```ts
export const BALANCE = {
  TICK_MS: 100,

  // soldier base
  BASE_HP: 140, BASE_REG: 3.0, BASE_ATK: 14, BASE_SPD: 1.0,
  BASE_ARM: 0, BASE_EVA: 0, BASE_CC: 0.05, BASE_CM: 1.5,
  BASE_PEN: 0, BASE_LS: 0, BASE_RES: 1.0, BASE_BF: 1.0, BASE_AF: 1.0,

  // enemy scaling
  ENEMY_HP_BASE: 10, ENEMY_ATK_BASE: 1.5, ENEMY_ARM_BASE: 0.6, ENEMY_SPD_BASE: 0.8,
  GROWTH: 1.145, GROWTH_WARM: 1.075, WARMUP_RANKS: 40,
  ATK_EXP: 0.75, ARM_EXP: 0.55,
  HARDEN_100: 1.03, HARDEN_1000: 1.05, HARDEN_10000: 1.09,

  ENEMIES_PER_RANK_BASE: 4, ENEMIES_PER_RANK_DIV: 25, ENEMIES_PER_RANK_CAP: 12,

  // armor softcap
  ARMOR_K_BASE: 30, ARMOR_K_GROWTH: 1.08,

  // burn (Lampbearer)
  BURN_PER_STACK: 0.02, BURN_DECAY: 0.9875, BURN_CARRY: 0.5,
  DAMAGE_FLOOR: 0.05,

  // stands
  STAND_EVERY: 10, STAND_HP_MULT: 8, STAND_ATK_MULT: 1.6,
  STAND_TIMER_BASE: 30, STAND_TIMER_PER_100: 5,
  STAND_FIRST_SEEN_BONUS: 1.5, STAND_PUSHBACK: 3, STAND_FAILS_TO_END: 3,

  // economy
  BONE_BASE: 2, BONE_GROWTH: 1.11, BONE_STAND_MULT: 25,
  // Ash is EXPONENTIAL in depth. See docs/03 § 6 for why the original
  // polynomial (rank/12)^2.1 stalls the game dead at Rank 50.
  ASH_BASE: 1.5, ASH_GROWTH: 1.09,
  NAMES_DIV: 5e6, NAMES_EXP: 0.5,
  ICHOR_EXP: 1.4, ICHOR_DIV: 3,

  // resolve
  RESOLVE_BASE_GAIN: 0.6, RESOLVE_DAMAGE_SCALE: 4, RESOLVE_CAP: 100,

  // offline
  OFFLINE_WINDOW_H_BASE: 12, OFFLINE_EFFICIENCY: 0.70,
  KEY_REGEN_MIN: 20, KEY_CAP_BASE: 3,

  // upgrades
  BONE_UPGRADE_SCALE: 1.16,
  TREE_NODE_SCALE: 1.06, KEYSTONE_EVERY: 25,

  // stands
  STAND_EVERY: 10, STAND_TIMER_BASE: 30, STAND_TIMER_PER_100: 5,
  STAND_FIRST_SEEN_BONUS: 1.25, STAND_PUSHBACK: 3, STAND_FAILS_TO_END: 3,

  // relics
  RELIC_DROP_BASE: 0.0015, RELIC_DROP_STAND: 0.06,
  RELIC_QUALITY_RANK_CAP: 500,
  INVENTORY_CAP_BASE: 40, INVENTORY_CAP_PER_NAME: 10,
  GHOST_CAP: 500,
} as const
```

---

## `upgrades.ts` — Bone upgrades (run-scoped)

| id | label | effect | base | scale |
|---|---|---|---|---|
| `reinforce` | REINFORCE | `atk +8% add` | 5 | 1.16 |
| `standfast` | STAND FAST | `hp +8% add` | 5 | 1.16 |
| `whet` | WHET | `spd +4% add` | 12 | 1.16 |
| `plate` | PLATE | `arm +6 flat` | 15 | 1.16 |
| `bleedthem` | BLEED THEM | `ls +1% flat` | 40 | 1.16 |
| `quicken` | QUICKEN | `res +5% add` | 60 | 1.16 |

## `upgrades.ts` — Ash tree (see [05](05-PROGRESSION.md) for keystone text)

| trunk | id | label | per level | base |
|---|---|---|---|---|
| FLESH | `meat` | MEAT | `hp +12% add` | 8 |
| FLESH | `scar` | SCAR | `arm +4 flat` | 12 |
| FLESH | `clot` | CLOT | `reg +0.4 flat` | 20 |
| FLESH | `marrow` | MARROW | `ls +0.5% flat` | 45 |
| FLESH | `return` | RETURN | `revive +2% flat` | 200 |
| IRON | `edge` | EDGE | `atk +10% add` | 8 |
| IRON | `haste` | HASTE | `spd +5% add` | 15 |
| IRON | `spite` | SPITE | `cc +2% flat` | 18 |
| IRON | `cruelty` | CRUELTY | `cm +0.06 flat` | 30 |
| IRON | `awl` | AWL | `pen +1.5% flat` | 60 |
| RITE | `tithe` | TITHE | `bf +8% add` | 10 |
| RITE | `pyre` | PYRE | `af +6% add` | 40 |
| RITE | `vigil` | VIGIL | `offlineH +1 flat` | 90 |
| RITE | `omen` | OMEN | `relicDrop +3% add` | 70 |
| RITE | `resolve` | RESOLVE | `res +6% add` | 55 |

All scale `1.13^level`, keystone every 25 levels (4 keystones defined per node = content through L100; beyond L100 keystones repeat as `+1 tier` numeric bonuses).

---

## `classes.ts`

```ts
export const CLASSES = [
  { id:'hoplite',     name:'HOPLITE',     cost:0,  sigil:{symmetry:6,core:'solid'},
    pipeline:s => 1 + s.arm/200,          curse:{spd:-0.40},
    signature:{ id:'brace', text:'BRACE' } },
  { id:'lampbearer',  name:'LAMPBEARER',  cost:0,  sigil:{symmetry:3,core:'hollow'},
    pipeline:() => 0.55,                  curse:{burnCannotCrit:true},
    signature:{ id:'flashpoint' }, applies:'burn' },
  { id:'augur',       name:'AUGUR',       cost:0,  sigil:{symmetry:5,core:'hollow'},
    pipeline:() => 1.0,                   curse:{hpMult:0.5}, critOverflow:true,
    signature:{ id:'foresight' } },
  { id:'revenant',    name:'REVENANT',    cost:2,  sigil:{symmetry:2,core:'hollow'},
    pipeline:s => 1 + s.deathsThisAsc/400, curse:{reg:0, ls:0},
    signature:{ id:'secondbody' } },
  { id:'chorus',      name:'CHORUS',      cost:2,  sigil:{symmetry:8,core:'none'},
    pipeline:() => 0.7,                   curse:{spd:-0.30}, echoes:'floor(reveilles/10) cap 12',
    signature:{ id:'thechoir' } },
  { id:'gravedigger', name:'GRAVEDIGGER', cost:3,  sigil:{symmetry:1,core:'solid'},
    pipeline:() => 0.45,                  passive:{bf:2.5, af:1.8, offline:1.5},
    signature:{ id:'exhume' } },
  { id:'null',        name:'NULL',        cost:8,  sigil:{symmetry:1,core:'none',ringOnly:true},
    pipeline:() => 1.0,                   curse:{ignoreTree:true},
    signature:{ id:'erase' } },
  { id:'warden',      name:'WARDEN',      cost:12, sigil:{symmetry:12,core:'solid'},
    pipeline:() => 1.3,                   curse:{standTimerEveryRank:true},
    signature:{ id:'rotating' } },
  { id:'cartographer',name:'CARTOGRAPHER',cost:3,  descentOnly:true,
    sigil:{symmetry:4,core:'hollow'} },
] as const
```

---

## `names.ts` — enemy name grammar

```ts
export const ADJ = ['Thin','Small','Pale','Quiet','Late','Bent','Dry','Cold','Half','Spare',
  'Willing','Patient','Folded','Blank','Even','Narrow','Wet','Slow','Grey','Standing',
  'Unwashed','Counted','Issued','Amended','Faint','Wound','Struck','Sealed','Hollow','Kept',
  'Marched','Numbered','Silent','Bare','Sworn','Idle','Certain','Missing','Second','Last']

export const NOUN = ['Refusal','Objection','Answer','Errand','Order','Report','Return','Count',
  'Bell','Coat','Column','Ration','Nail','Lamp','Ledger','Margin','Rank','Wound','Stitch','Bunk',
  'Tin','Letter','Clerk','Muster','Rota','Hour','Watch','Line','Sum','Draft','Tally','Debt',
  'Whistle','Boot','Bandage','Chit','Signal','Grave','Post','Name']

export const ORGAN_VERB = ['Counts','Waited','Remembers','Refuses','Insists','Continues',
  'Objects','Repeats','Answers','Holds','Listens','Bleeds Correctly','Was Not Asked','Keeps Time']

export const GRAMMARS = {
  chaff:    (r)=> `${pick(ADJ,r)} ${pick(NOUN,r)}`,
  organs:   (r)=> `The ${pick(NOUN,r)} that ${pick(ORGAN_VERB,r)}`,
  returned: (g)=> `Soldier #${g.soldierNumber.toLocaleString()}`,
  warden:   (w)=> w.name,
  nothing:  ()=> '',            // deliberately empty. Do not fill this in.
}
```

---

## `vows.ts`

| id | name | effect | ashMult | other |
|---|---|---|---|---|
| `salt` | Vow of Salt | no Bone, Bone upgrades disabled | 2.2 | |
| `silence` | Vow of Silence | Signatures never fire | 1.8 | |
| `opencoat` | Vow of the Open Coat | Armor permanently 0 | 2.0 | |
| `haste` | Vow of Haste | 20s timer on every Rank | 2.5 | |
| `singlebody` | Vow of the Single Body | no revives | 1.6 | |
| `poverty` | Vow of Poverty | no relics | 2.4 | |
| `longcount` | Vow of the Long Count | growth 1.145 → 1.16 | 3.0 | |
| `blankcoat` | Vow of the Blank Coat | class locked for the Ascension | 1.5 | +1 Name/Interment |
| `waking` | Vow of the Waking | no offline progress | 2.0 | ×1.4 Names |
| `tenthousand` | Vow of Ten Thousand | Ascension force-ends at Rank 10,000 | 4.0 | ×2 Names |

---

## `wardens.ts`

| id | name | firstRank | signature | t2 name | t3 name |
|---|---|---|---|---|---|
| `quartermaster` | THE QUARTERMASTER | 10 | spawns 3 Chaff | The Quartermaster, Overdrawn | The Ledger |
| `surgeon` | THE SURGEON | 20 | heals to 60% once | The Surgeon, Unwashed | The Theatre |
| `bell` | BELL | 40 | resets Resolve to 0 | Bell, Cracked | The Sound Itself |
| `columnshead` | THE COLUMN'S HEAD | 70 | +8% ATK every 3s | The Head, Turned | The March |
| `moth` | MOTH | 110 | untargetable 4s, then 400% | Moth, Singed | The Lamp's Answer |
| `census` | THE CENSUS | 160 | HP = your kills this run | The Census, Amended | Ten Thousand |
| `drownedsergeant` | THE DROWNED SERGEANT | 220 | silences your Signature | The Sergeant, Surfacing | The Order |
| `predecessor` | YOUR PREDECESSOR | 300 | copies your statline at 90% | Your Predecessor, Corrected | The One Before |
| `ninthnail` | THE NINTH NAIL | 400 | every 9th attack ×9 | The Ninth Nail, Driven | The Wound |
| `hollow` | THE HOLLOW ITSELF | 500 | erasure; ARM/EVA read 0 | The Hollow, Awake | **THE MYRIAD** |

---

## `layers.ts`

| id | name | family | twist | palette | warden | cost |
|---|---|---|---|---|---|---|
| `ossuary` | THE OSSUARY | chaff | Bone Piles: +2% ATK stacking | bone/grey | quartermaster | free |
| `barracks` | THE DROWNED BARRACKS | organs | Pressure: −1.5% max HP per room | ichor/black | drownedsergeant | 3 Names |
| `museum` | THE MUSEUM OF WOUNDS | returned | Exhibits: enemies use your past affixes | gold/black | predecessor | 7 Names |
| `choir` | THE CHOIR | mixed | Harmony: +15% per living ally | blood/white (inverted) | census | 14 Names |
| `nowhere` | NOWHERE | nothing | Erasure: rooms delete from the map | no accent | hollow | Apotheosis |

---

## Room weights per floor

```ts
export const ROOM_WEIGHTS = {
  fight: 34, elite: 12, cache: 14, shrine: 12,
  riddle: 9, empty: 8, toll: 7, door: 4,
}   // warden is always, and only, the final node
```

---

## Number suffix table

```ts
export const SUFFIXES = ['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc',
  'UDc','DDc','TDc','QaDc','QiDc','SxDc','SpDc','OcDc','NoDc','Vg']
// beyond 1e66 → scientific notation, e.g. 4.21e72
```
