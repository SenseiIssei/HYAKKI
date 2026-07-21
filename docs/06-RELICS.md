# 06 — Relics

> *"Everything in the Hollow was carried in by someone. Nothing has been carried out."*

## Structure

A relic is: **rarity + 1-4 affixes + a seeded sigil + a flavor line.**

### Slots — changed from the original plan
Slots were specified as "1 Name each". Names do not exist until Phase 4, so slots
**open with depth** instead: 2 at the start, then +1 at `bestRankEver` 60, 150 and 400.
The sixth still comes from a Name. Gating the whole system behind a currency two
phases away would have meant shipping relics with no way to earn room for them.

### Guaranteed drops
Random-only drops meant a player could reach Reveille 3 without ever seeing the system
(measured — it happened in testing). So:
- **Your first Warden always drops**, at improved odds.
- **First clear of Rank 25 / 100 / 250 / 500 / 1000 / 2500 / 5000 / 10000** always drops.

Both use a rarity bonus of `+1`, not more. An earlier `+3` made the very first drop a
**Myth**, which is a great five seconds and a permanent devaluation of Myths.

| Rarity | Affixes | Affix rolls | Drop weight | Colour | Multiplicative? |
|---|---|---|---|---|---|
| **Issued** | 1 | low half of range | 60% | bone grey | no |
| **Kept** | 2 | full range | 27% | bone white | no |
| **Named** | 3 | full range, one guaranteed high | 10% | blood red | no |
| **Myth** | 3 + 1 unique effect | high half | 2.7% | divine gold | **yes** |
| **True Name** | 4 + 1 unique + a downside | max range | 0.3% | ichor teal | **yes, large** |

**True Names always carry a real cost.** That's what makes them memorable rather than just "the best one."

---

## Affix pool

Additive percentage affixes (Issued → Named):

| Affix | Range | Tag |
|---|---|---|
| *Whetted* | +6% – 30% ATK | offense |
| *Heavy* | +8% – 40% Max HP | defense |
| *Quick* | +3% – 18% Attack Speed | offense |
| *Plated* | +5 – 60 Armor | defense |
| *Keen* | +2% – 12% Crit Chance | crit |
| *Cruel* | +0.05× – 0.5× Crit Mult | crit |
| *Thirsting* | +0.5% – 5% Lifesteal | sustain |
| *Knitted* | +0.4 – 6/s Regen | sustain |
| *Sharpened* | +2% – 15% Penetration | offense |
| *Slippery* | +1% – 9% Evasion | defense |
| *Tithed* | +10% – 60% Bone Find | economy |
| *Pyred* | +5% – 30% Ash Find | economy |
| *Resolute* | +8% – 45% Resolve Rate | utility |
| *Ominous* | +5% – 25% relic drop rate | economy |
| *Burning* | Attacks apply Burn at 30% – 100% of Lampbearer rate | hybrid |
| *Echoing* | +1 Echo (Chorus only) | class |
| *Standing* | +15% – 70% damage vs Wardens | situational |
| *Chaffing* | +20% – 90% damage vs Chaff | situational |
| *Numbered* | +0.2% – 2% all stats per 100 Reveilles | scaling |

**Generation:** `rollRelic(seed, dropRank, dropSource)` → deterministic. Rank influences roll quality: `rollQuality = 0.4 + 0.6 * min(1, dropRank / 500)`.

---

## Handcrafted Myths & True Names

These are authored, not generated. Each has an identity, a unique effect, and a line.

### Myths (gold)

| Relic | Unique effect | Line |
|---|---|---|
| **The Ninth Nail** | ×1.4 damage. Every 9th attack deals ×9. | *"There were eight. There is a ninth. Nobody built it."* |
| **Lantern of the Unreturned** | ×1.25 ATK. Burn stacks never expire during a Stand. | *"It lights nothing. It only makes the dark specific."* |
| **The Warden's Left Eye** | ×1.3 Crit Mult. You see Stand enemy HP before the fight. | *"It blinks when you are not looking. You know this because you have looked."* |
| **A Letter Never Sent** | ×1.2 Ash Find. +1% Ash per 10 Reveilles this Ascension. | *"The address is a rank and a number. Both of them are yours."* |
| **Ration Tin, Empty** | ×1.5 Bone Find. Lose 20% Max HP. | *"Licked clean. Not recently."* |
| **The Long Coat** | ×1.35 Max HP. Armor is never reduced below its starting value. | *"Issued to ten thousand. Fits exactly one."* |
| **Bell, Cracked** | ×1.3 Resolve Rate. Signature also fires at 50% Resolve for half effect. | *"It rings on the downstroke only. Reveille has always sounded wrong."* |
| **The Surgeon's Consent** | ×1.4 Lifesteal effectiveness. Regen is halved. | *"Signed. Not by the patient."* |
| **A Map of the Hollow** | ×1.15 all stats. Descents reveal one extra room. | *"It is accurate. It updates. You have never seen it update."* |
| **The Second Coat** | ×1.2 ATK and HP. On death, you may continue at Rank −5 once per run. | *"Same number, stitched twice. The second stitching is fresher."* |
| **Tooth of the Thing at 400** | ×1.6 damage vs enemies above Rank 400. | *"Pulled, not shed."* |
| **Ash of the First Reveille** | ×1.1 per prestige layer entered (Ash / Names / Ichor). | *"Cold. Still cold. Colder than the room."* |

### True Names (teal — always with a cost)

| Relic | Effect | Cost | Line |
|---|---|---|---|
| **Your Own Skull** | ×2.5 all offensive stats | Max HP set to 1. Only Evasion and revives can save you. | *"You recognise it. You do not recognise how you recognise it."* |
| **The Blank Coat** | ×3.0 relic effects | You cannot use your class Pipeline or Signature. | *"No number. The stitching holes are there. The thread is not."* |
| **The Count** | Every Rank cleared gives permanent +0.4% all stats for this Ascension | You cannot Reveille until Rank 200. | *"Someone has been keeping it. Someone is still keeping it."* |
| **The Wound's Own Blade** | ×4.0 damage | You take 12% of your Max HP per second, always. | *"It was in the god. It is not from the god."* |
| **Nothing, Held** | Enemies of the Nothing family drop double everything | −60% damage to everything else | *"Weightless. Your hand closes further than it should."* |
| **The Ten Thousandth Coat** | ×1.0 to everything, +1 relic slot, +1 Vow slot | Your soldier number is set to 10,000 and stops increasing. Reveille count no longer grows. | *"The last one. It has been the last one for some time."* |

---

## The equip decision

The single most important UX in the game. When a relic drops, show a **direct comparison against the currently equipped set**, computed by running the headless sim:

```
┌──────────────────────────────────────────────┐
│  ⬡  KEPT — "Whetted, Slippery"               │
│     +22% Attack · +6% Evasion                │
│                                              │
│     vs. equipped:   ▲ +9.4% effective DPS    │
│                     ▼ −2.1% survival time    │
│                                              │
│     [ EQUIP ]   [ MELT — 40 Ash ]  [ KEEP ]  │
└──────────────────────────────────────────────┘
```

`effective DPS` and `survival time` are computed by **forking the real simulation** and
running 600 ticks (60s) against the current Rank's enemy, with and without the relic, in
every slot — the best slot wins. Because it is the real sim, it accounts for crits, Burn,
Signatures, the armour softcap and the class pipeline for free; a closed-form estimate
would get all of those wrong.

**Never make the player do arithmetic.** This is the feature that separates a good idle
game from a spreadsheet.

Two implementation notes that are easy to get wrong:
- The fork must not disturb the live run (there is a test asserting this).
- It measures against a **normal enemy, never a Warden mid-Stand**, or the number swings
  wildly depending on when the player happens to open the panel.
- When survival becomes infinite (regen outpaces the enemy), the card says
  *"holds indefinitely"* rather than `100.0%`. A percentage against infinity is a lie.

**MELT** converts a relic to Ash (`rarityValue × dropRank`). Inventory has a hard cap (40, +10 per Name) to force this decision.

---

## Drop sources

| Source | Rate | Quality |
|---|---|---|
| Regular kill | 0.15% × drop rate | dropRank quality |
| Stand (Warden) | 6% × drop rate | +1 rarity tier weight |
| Descent Cache room | 100% | Layer-scaled |
| Descent Warden | 100% + Name | Guaranteed Named or better |
| First clear of a Rank milestone (100/250/500/1000/…) | 100% | Guaranteed Myth at 1000+ |
| Melting duplicates (OMEN keystone) | — | Re-roll one affix |
