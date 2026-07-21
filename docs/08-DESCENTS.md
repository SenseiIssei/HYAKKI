# 08 — Descents (the dungeon layer)

> *"The Column goes forward. There is also down."*

Unlocked at first Interment. Descents are the game's second axis: where the Column is infinite and passive, a Descent is **finite, chosen, and risky**.

---

## The shape of a Descent

1. **Spend 1 Key.** (Keys regen 1 per 20 min, cap 3 → 12.)
2. **Pick a Layer** and a **Depth** (Depth 1 is trivial; Depth scales forever).
3. **The map appears** — a branching node graph, 6-12 floors deep, Slay-the-Spire style. You can see room *types* but not contents (unless Cartographer or *A Map of the Hollow*).
4. **Plot your entire route** before committing. This is the only genuinely tactical decision in the game and it is 100% pre-combat.
5. **Confirm.** The Descent runs in real time (5-25 min depending on Depth) whether the game is open or not.
6. **Return** to a report and rewards.

**How resolution actually works:** the whole Descent is resolved deterministically **at
commit time**, seeded, and revealed when the clock runs out. The estimate the player was
shown is therefore *exactly* what happens, and nothing can be gamed by buying upgrades
while it runs. The real-time wait is presentational — which also makes offline completion
free.

Resolution forks the real combat sim, so crits, Burn, Signatures, the armour softcap and
the class pipeline all behave as they do in the Column. A test asserts the fork never
disturbs the live game.

**One trap worth recording:** enemy health and attack must be scaled *separately*. Scaling
both by the same multiplier made the Descent Warden (`×8`) five times deadlier than the
Warden of the same name in the Column, which uses `×8` health and `×1.6` attack — so every
Descent ended at the last room, at every depth.

You may run 1 Descent concurrently (→ 4 with Names). Descents run while the Column also runs. They never interrupt each other.

```
              ┌ FIGHT ─── CACHE ──┐
   MOUTH ─────┤                   ├─── ELITE ──┬─ SHRINE ─── WARDEN
              └ SHRINE ─┬─ RIDDLE ┘            └─ EMPTY ────┘
                        └─ FIGHT ──── CACHE ───┘
```

---

## Room types

| Room | What it does | Risk |
|---|---|---|
| **FIGHT** | 3-6 enemies of the Layer's family at Depth scaling | Low |
| **ELITE** | One Organ or Returned at ×3 stats. Drops a relic. | Medium |
| **CACHE** | Free relic, rarity rolled by Depth | None |
| **SHRINE** | Choose 1 of 3 temporary Descent-only buffs | None |
| **RIDDLE** | A **stat check**: *"Only the heavy pass" — requires ARM ≥ X.* Pass → big reward. Fail → take 30% max HP and continue. | Low but binary |
| **EMPTY** | Nothing happens. A vignette of text. Restores 25% HP. | None |
| **TOLL** | Pay Bone/Ash/HP for a guaranteed upgrade | Player's choice |
| **THE DOOR** | Optional. Skips 2 floors forward, ×2 danger. | High |
| **WARDEN** | The Layer boss. Always the final room. Drops Names + Ichor. | High |

Your HP does **not** regenerate between rooms except via EMPTY and Shrines. That's the resource being managed by your route choice. Dying mid-Descent = you keep everything collected so far but forfeit the Warden.

---

## The five Layers

Each Layer has an enemy family bias, a mechanical twist, a palette shift, and its own Warden.

### Layer I — THE OSSUARY
*The place where the Myriad's dead were stacked, before someone realised there would be no end to them.*
- **Family:** Chaff, heavy
- **Twist:** every kill leaves a **Bone Pile**; standing over piles grants stacking +2% ATK for the rest of the Descent
- **Palette:** bone white on deep grey
- **Warden:** *The Quartermaster* (T1 form)
- **Unlocked:** free at first Interment

### Layer II — THE DROWNED BARRACKS
*Someone flooded it deliberately. The bunks are still made.*
- **Family:** Organs
- **Twist:** **Pressure** — you lose 1.5% max HP per room entered, non-refundable. Route length is the real cost.
- **Palette:** ichor teal on black
- **Warden:** *The Drowned Sergeant*
- **Unlocked:** 3 Names

### Layer III — THE MUSEUM OF WOUNDS
*Every injury the god ever took, mounted and labelled. Some of the labels are in your handwriting.*
- **Family:** The Returned
- **Twist:** **Exhibits** — each room shows a real past run of yours. Enemies get that run's relic affixes. Beating an exhibit permanently re-rolls one of your relics.
- **Palette:** gold on near-black
- **Warden:** *Your Predecessor*
- **Unlocked:** 7 Names

### Layer IV — THE CHOIR
*Ten thousand voices. Nine thousand of them are counting. The rest are the number.*
- **Family:** mixed, always in groups of 3+
- **Twist:** **Harmony** — enemies buff each other +15% per living ally. Kill order matters, so the route determines which fights are group fights.
- **Palette:** blood red on white — the only inverted Layer
- **Warden:** *The Census*
- **Unlocked:** 14 Names

### Layer V — NOWHERE
*There is no description. The Layer select shows an empty field where the description goes.*
- **Family:** Nothing
- **Twist:** **Erasure** — rooms delete themselves from the map as you approach. Your plotted route becomes invalid mid-run and the game re-routes you. You are not in control. That's the point.
- **Palette:** the UI loses its accent colour entirely
- **Warden:** *The Hollow Itself*
- **Unlocked:** first Apotheosis

---

## Depth scaling

```
descentRank(layer, depth) = bestRankEver * 0.97 * layerBase * 1.0012 ^ depth
duration(depth)           = 5min + 40s * depth, capped 25min
rewardMult(depth)         = 1.10 ^ depth
```

> ### The tuning window is far narrower than it looks
>
> The original spec was `layerBase * 1.19 ^ depth`, with Layer multipliers from 1.0 to 3.4.
> Both are wildly out of range, and it took three passes to find out why.
>
> Enemy power is **exponential in Rank**, so the entire span from "trivial" to
> "impossible" is about **20% of Rank**. Measured against a real player whose Column wall
> was Rank 6,679:
>
> | Descent Rank | Clear |
> |---|---|
> | 6,478 | **100%** |
> | 7,973 | **0%** |
>
> So the whole depth slider *and* every Layer's difficulty has to fit between roughly
> **1.0× and 1.2× of the player's deepest Rank**. Layer multipliers are therefore
> 1.0 / 1.005 / 1.01 / 1.015 — the Layers are differentiated by their **twist**, not by
> raw Rank. Anything wider is not "harder", it is a wall or a walkover.
>
> Note the base is ~1× rather than well below: the Column wall is set by Stand **timers**,
> so a player's raw 1v1 killing power reaches deeper than their best Rank suggests. An
> earlier `0.6×` base made every Descent a guaranteed clear.

**Known limitation, honestly:** because the transition is a cliff rather than a slope, the
estimate is usually 100% or 0% and only lands in between for a narrow band of depths. The
estimate is *accurate* — 0pp error against 100 real resolutions — it just rarely has an
interesting number to show.

The player chooses Depth manually with a slider, and the UI shows a **live win-probability estimate** computed by running the headless sim over the plotted route 50 times. Not a hidden number — show it: `Estimated clear: 71%`.

This is the most important UX in the Descent system. Roguelite route planning is only fun when you understand the odds you're taking.

---

## Rewards

| Source | Reward |
|---|---|
| Fight/Elite rooms | Bone (converted to Ash on return at 1:200), relic chance |
| Cache | Guaranteed relic |
| Layer Warden, first clear | 1 Name + relic (Named or better) + Layer II unlock progress |
| Layer Warden, repeat | Ichor `= depth^1.2 / 8`, relic chance |
| Full clear with no rooms skipped | ×1.5 everything, and a Fragment |

---

## Why Descents exist (design justification)

The Column is passive and infinite — that's the idle game. But an idle game with *only* that has no moment where the player makes a real decision. Descents give:

1. **A decision with stakes** (route + Depth) that resolves in minutes, not hours
2. **A reason to build differently** (a Riddle-heavy route wants Armor; a Harmony Layer wants AoE)
3. **The only source of Names**, so the meta-progression flows through the interesting system
4. **Bounded content** to author against — themed, finite, memorable — balancing the unbounded Column

**Rule:** a player must never *have* to run Descents to progress the Column. They're an accelerator and a content layer, never a tax.
