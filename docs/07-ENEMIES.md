# 07 — Enemies & Wardens

## Five families

Each family is a **sigil generator preset** plus a behavioural modifier. Every enemy in the game is `family + seed + rank`. That's infinite enemies from five hand-designed shapes.

| Family | What it is | Appears | Behaviour | Sigil params |
|---|---|---|---|---|
| **CHAFF** | The Hollow's antibodies | Rank 1+ | Baseline. Fast, weak, numerous. | symmetry 3-4, thin strokes, small, high count |
| **ORGANS** | Parts of the god still working | Rank 15+ | High HP, slow, **AoE pulse** every 4s that damages Echoes | symmetry 6-8, radial, filled blobby core, slow rotation |
| **THE RETURNED** | Reissued dead soldiers, including yours | Rank 40+ | Uses a real past-run snapshot's statline, scaled to Rank | symmetry 2 (bilateral/humanoid), a visible number glyph |
| **WARDENS** | The ten named bosses | Every 10th Rank | Timed. Unique Signature each. | symmetry 12, layered rings, gold accent, large |
| **NOTHING** | Post-Rank-500 entities | Rank 500+ | **Erasure** — damage that ignores Armor and Evasion entirely, and removes buffs | negative space: the sigil is drawn by *not* drawing, the background shows through |

### Family stat modifiers

| Family | HP | ATK | ARM | Speed | Bone | Special |
|---|---|---|---|---|---|---|
| Chaff | ×0.7 | ×1.0 | ×0.8 | ×1.3 | ×1.0 | — |
| Organs | ×2.4 | ×0.8 | ×1.5 | ×0.6 | ×2.2 | AoE pulse; +30% Armor vs Penetration |
| The Returned | ×1.3 | ×1.4 | ×1.0 | ×1.0 | ×1.8 | Copies one of your relic affixes |
| Warden | ×8.0 | ×1.6 | ×2.0 | ×0.8 | ×25 | Timed; Signature; relic chance |
| Nothing | ×1.8 | ×2.2 | ×0.0 | ×0.9 | ×4.0 | Erasure damage; immune to DoT |

Family mix by Rank band is a weighted table in `content/enemies.ts` — deeper Ranks skew toward Organs and Returned, then Nothing.

---

## The Returned — the system that carries the game's soul

This is the mechanic worth building carefully.

**Every time you Reveille, the game saves a snapshot:**
```ts
type Ghost = {
  soldierNumber: number      // your coat number that run
  class: ClassId
  deepestRank: number
  finalStats: StatBlock      // ATK, HP, ARM, SPD, CC, CM...
  relicAffixes: Affix[]      // one sampled affix
  diedTo: string             // enemy family + rank
  seed: number               // for their sigil
}
```
Keep the last 500. Rolling.

**When a Returned enemy spawns**, it draws a Ghost from your history (weighted toward Ghosts whose `deepestRank` is near the current Rank), scales its statline to the current Rank, and fights you with it. Its sigil is the *same seed* your soldier had that run, and its coat number is displayed.

The first time a player notices that the enemy they're fighting has *their own number from forty runs ago*, that's the game landing. It costs almost nothing to build and it's the whole thesis.

**CHORUS class reuses the identical Ghost pool** as friendly Echoes. Build once, use twice.

**Later escalations:**
- Rank 250+: a Returned may spawn with your *current* number. It says so in the log: *"Its coat says 214. So does yours."*
- Post-Apotheosis: you author a Warden from your best Ascension. Future Ascensions fight it.

---

## The Ten Wardens

Each appears on a schedule and **evolves** at each prestige layer — same identity, escalated form and Signature. Ten Wardens × 3 forms = 30 boss encounters from ten designs.

| # | Warden | First Stand | Signature | Evolves into (T2) | (T3) |
|---|---|---|---|---|---|
| 1 | **THE QUARTERMASTER** | Rank 10 | *Issue* — spawns 3 Chaff mid-fight | The Quartermaster, Overdrawn | The Ledger |
| 2 | **THE SURGEON** | Rank 20 | *Consent* — heals to 60% once | The Surgeon, Unwashed | The Theatre |
| 3 | **BELL** | Rank 40 | *Reveille* — resets your Resolve to 0 | Bell, Cracked | The Sound Itself |
| 4 | **THE COLUMN'S HEAD** | Rank 70 | *Advance* — gains +8% ATK every 3s, forever | The Head, Turned | The March |
| 5 | **MOTH** | Rank 110 | *Circle* — becomes untargetable for 4s, then hits for 400% | Moth, Singed | The Lamp's Answer |
| 6 | **THE CENSUS** | Rank 160 | *Count* — its HP is set to your total kills this run | The Census, Amended | Ten Thousand |
| 7 | **THE DROWNED SERGEANT** | Rank 220 | *Order* — silences your Signature for the fight | The Sergeant, Surfacing | The Order |
| 8 | **YOUR PREDECESSOR** | Rank 300 | *Recall* — copies your entire statline at 90% | Your Predecessor, Corrected | The One Before |
| 9 | **THE NINTH NAIL** | Rank 400 | *Fix* — every 9th of its attacks deals ×9 | The Ninth Nail, Driven | The Wound |
| 10 | **THE HOLLOW ITSELF** | Rank 500 | *Nothing* — erasure damage; your Armor and Evasion read 0 | The Hollow, Awake | **THE MYRIAD** |

Warden #10 tier 3, **THE MYRIAD**, is fought at Apotheosis. It is ten thousand small sigils in the shape of one enormous soldier. Its statline is the sum of every Ghost you have ever recorded. **Killing it is the credits.**

---

## Warden Stand design rules

1. A Warden must be beatable by **two different builds** minimum. Never a single-stat check.
2. Every Warden Signature is **telegraphed** — the sigil visibly changes 1.5s before it fires. Even though you can't react, seeing it teaches you what killed you.
3. The Stand timer is generous the first time you see a Warden (+50% duration on first encounter) and normal thereafter. Learning shouldn't cost a run.
4. Warden defeat text is one line, always in second person: *"Bell stops. You do not hear it stop."*

---

## Enemy naming

Chaff, Organs, Returned and Nothing enemies get **generated names** from a template grammar, so Rank 8,412 still produces something with texture:

```
CHAFF:    [adj] [noun]           →  "Thin Refusal", "Small Objection", "Pale Answer"
ORGANS:   The [noun] that [verb] →  "The Lung that Counts", "The Valve that Waited"
RETURNED: Soldier #[n]           →  "Soldier #1,204" (a real past number of yours)
NOTHING:  [space]                →  rendered as blank. The name field is empty.
```

Word pools live in `content/names.ts`. ~40 adjectives × ~60 nouns × 5 grammars = plenty. Seeded, so the same enemy always has the same name.

The Nothing having **no name at all** — an empty label where every other enemy has one — is one of the best free horror beats in the design. Do not fill it in.
