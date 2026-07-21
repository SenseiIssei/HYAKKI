# 04 — Classes

## Design rule

Every class changes **how damage is produced**, not just which stat is highest. Two classes with identical stat sheets must play differently. Each owns:

- a **Pipeline** — the multiplier injected into the damage formula
- a **Signature** — the auto-firing Resolve ability
- a **Curse** — a real, permanent downside
- a **Scaling identity** — which stat it wants stacked, and what breaks it
- a **Sigil family** — the procedural glyph parameters that make it recognizable

Class is chosen at the Mouth each run and can be changed freely between runs. **Never** locked.

---

## Starting three (available at minute zero)

### ⬡ HOPLITE — *the wall that walks*
> *"The line does not advance. The line simply is, further forward than it was."*

| | |
|---|---|
| **Pipeline** | `damage × (1 + ARM / 200)` — your armor *is* your weapon |
| **Signature** | **BRACE** — become immune for 3s; at the end, release all damage prevented as a single hit |
| **Curse** | −40% Attack Speed. You are slow. |
| **Wants** | Armor, HP, flat mitigation |
| **Breaks on** | Enemies past Rank 400 with penetration; needs Armor-`K` fixes from Ichor |
| **Sigil** | Symmetry order 6, thick strokes, closed outer ring, solid core |

The correct first class. Forgiving, obvious, and it teaches the armor softcap by hitting it.

---

### ⬡ LAMPBEARER — *carries the fire that is eating them*
> *"The lamp was lit before the march. Nobody remembers lighting it."*

| | |
|---|---|
| **Pipeline** | `damage × 0.55` (weak hits) but every hit applies a **Burn** stack |
| **Burn** | Each stack deals `2% of ATK` per tick, lasts 8s, stacks unlimited. **Stacks carry to the next enemy at 50%.** |
| **Signature** | **FLASHPOINT** — instantly detonate all Burn stacks for their full remaining duration |
| **Curse** | Burn does not crit. Crit stats are dead on this class. |
| **Wants** | Attack Speed above all else, then ATK, then Resolve Rate |
| **Breaks on** | Short fights — it needs ramp. Terrible at low Ranks, monstrous in Stands. |
| **Sigil** | Symmetry order 3, open strokes with trailing tails, flickering opacity animation, hollow core |

The "wait for it" class. Its power curve within a single fight is the mechanic.

---

### ⬡ AUGUR — *has read the ending and is bored by it*
> *"It calls the coin before the toss. It has never once been wrong. It has also never once been believed."*

| | |
|---|---|
| **Pipeline** | `damage × 1.0`, but **Crit Chance above 100% rolls over into extra Crit Multiplier** at 1% → +0.02× |
| **Signature** | **FORESIGHT** — the next 6 attacks are guaranteed crits at double Crit Multiplier |
| **Curse** | −50% base HP. Enormously fragile. |
| **Wants** | Crit Chance, Crit Multiplier, luck-tagged relic affixes |
| **Breaks on** | Variance. A bad streak at a Stand kills the run. High-risk, high-Ash. |
| **Sigil** | Symmetry order 5 (pentagonal, unstable), thin strokes, elements that redraw themselves every few seconds |

The gambler. Highest ceiling of the starting three, worst floor.

---

## Earned through play — changed from the original plan

These three were specified as costing Names. Names arrive in Phase 4, which would have
meant shipping "all six classes" in Phase 2 with three of them unbuyable. Each now
unlocks through **the thing the class is about**, which is better design than a price tag:

| Class | Unlocks at | Why that condition |
|---|---|---|
| **REVENANT** | 25 deaths | It is the class that gets stronger from dying |
| **CHORUS** | 10 Reveilles | It summons your past selves; it needs you to have some |
| **GRAVEDIGGER** | 5,000 felled | It needs bodies |

Locked classes are **shown, not hidden**, with a live progress bar. Knowing what you are
marching toward is most of the reason to keep marching.

Names still gate NULL, WARDEN, CARTOGRAPHER and the sixth relic slot in Phase 4.

## Unlocked with Names

### ⬡ REVENANT — *2 Names*
> *"It has died more times than it has been alive. It considers this an advantage, and it is right."*

| | |
|---|---|
| **Pipeline** | `damage × (1 + deathsThisAscension / 400)` — your lifetime death count is a stat |
| **Signature** | **SECOND BODY** — on lethal damage, continue fighting at 0 HP for 6s, then die properly. Off cooldown, this is a free extra life. |
| **Curse** | Health Regen and Lifesteal are set to **zero**. You cannot heal, ever. |
| **Wants** | Nothing but time. The class gets stronger every run you play forever. |
| **Breaks on** | Nothing — it's the tortoise. Weakest at hour 1, top-3 at hour 200. |
| **Sigil** | Symmetry order 2 (bilateral, humanoid), strokes that don't quite close, a small offset second sigil ghosted behind it |

The long-game class and the most thematically loaded one. Its power literally is your play history.

---

### ⬡ CHORUS — *never marches alone*
> *"Ask it how many it is. It will answer honestly and the answer will change while it speaks."*

| | |
|---|---|
| **Pipeline** | `damage × (0.7 + 0.25 × echoes)`, with up to `floor(reveilleCount / 10)` (cap 12) Echoes |
| **Echoes** | Each Echo takes its **identity** from a real past-run Ghost and its **strength from you**. *(Changed from the original spec of "25% of the stats it had" — a Reveille-3 ghost would be worthless by Reveille 300, making the class unplayable at exactly the depth it is designed for.)* |
| **Signature** | **THE CHOIR** — all Echoes attack simultaneously for 400% |
| **Curse** | −30% Attack Speed, and Echoes die permanently for the rest of the run when killed |
| **Wants** | Reveille count, then group multipliers, then Resolve |
| **Breaks on** | AoE-tagged enemies (Organs family) that clear Echoes fast |
| **Sigil** | Symmetry order 8, drawn as many small satellite sigils orbiting a thin center |

Mechanically uses the *same past-run snapshot system* as the Returned enemies. Build that system once, use it twice.

---

### ⬡ GRAVEDIGGER — *is not here to fight*
> *"It follows the Column at a distance. It is the only one of them with a job that has an end."*

| | |
|---|---|
| **Pipeline** | `damage × 0.45` — genuinely bad at combat |
| **Passive** | **×2.5 Bone Find, ×1.8 Ash Find, +50% offline window** |
| **Signature** | **EXHUME** — instantly gain Bone equal to 30s of your current earn rate |
| **Curse** | Cannot clear a Stand faster than the timer past Rank 200. You will plateau. |
| **Wants** | Bone Find, Ash Find, offline duration |
| **Breaks on** | Depth. It's a farming class, not a pushing class. |
| **Sigil** | Symmetry order 1 (asymmetric — the only one), heavy downward strokes, a filled trench shape |

The overnight class. The intended play pattern is: push with Augur/Hoplite in the evening, switch to Gravedigger before bed.

---

### ⬡ NULL — *8 Names*
> *"Its coat is blank. Not worn blank. Issued blank."*

| | |
|---|---|
| **Pipeline** | `damage × 1.0`. **All Ash tree bonuses are ignored.** Only relics and Bone upgrades apply. |
| **Signature** | **ERASE** — deletes the enemy's Armor and all its buffs, permanently, for this Rank |
| **Curse** | The tree does nothing. You are naked except for what you carry. |
| **Wants** | Relics. Only relics. Every relic slot and every Myth. |
| **Breaks on** | Early prestige layers. Becomes absurd once you have 6 slots of Myth relics. |
| **Sigil** | An empty ring. That's it. No interior. The only sigil that is defined by absence. |

The connoisseur's class. Turns the game into a pure equipment puzzle.

---

### ⬡ WARDEN — *12 Names*
> *"You have fought this. You are wearing it now."*

| | |
|---|---|
| **Pipeline** | `damage × 1.3`, and you gain the **Stand** enemy statline (8× HP, Warden armor curve) |
| **Signature** | Rotates through the Signatures of every Warden you have ever killed |
| **Curse** | You are subject to the **Stand timer at every Rank**, not just every 10th. Constant pressure. |
| **Wants** | Everything. It's the "you've earned it" class. |
| **Breaks on** | The timer. Pure DPS check, forever. |
| **Sigil** | Full Warden sigil rendering: symmetry order 12, layered rings, gold accent |

---

### ⬡ CARTOGRAPHER — *Descent-only, 3 Names*
Cannot be used in the Column. In Descents only:
- Reveals all room contents before you commit to a route
- +2 route branches per floor
- +100% relic drop rate, −50% Ichor
The route-planning specialist.

---

## Class comparison at a glance

| Class | Early | Mid | Late | Idle-friendly | Skill floor |
|---|---|---|---|---|---|
| Hoplite | ★★★★★ | ★★★☆☆ | ★★☆☆☆ | ★★★★☆ | Lowest |
| Lampbearer | ★★☆☆☆ | ★★★★★ | ★★★★☆ | ★★★★★ | Low |
| Augur | ★★★☆☆ | ★★★★☆ | ★★★★★ | ★★☆☆☆ | High |
| Revenant | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ | ★★★★★ | Low |
| Chorus | ★☆☆☆☆ | ★★★★☆ | ★★★★☆ | ★★★☆☆ | Medium |
| Gravedigger | ★★☆☆☆ | ★★★☆☆ | ★★☆☆☆ | ★★★★★ | Lowest |
| NULL | ☆☆☆☆☆ | ★★☆☆☆ | ★★★★★ | ★★★☆☆ | Highest |
| Warden | — | — | ★★★★★ | ★★☆☆☆ | High |

Balance is intentionally *not* flat. A class being bad early and great late is a feature — it gives Names something to buy that changes the game rather than inflating it.
