# 05 — Progression

## The three prestige layers

| Layer | Name | Resets | Grants | Cadence | Unlocks |
|---|---|---|---|---|---|
| **T1** | **REVEILLE** | Rank, Bone, Bone upgrades | **Ash** | 5-40 min | — |
| **T2** | **INTERMENT** | All of T1 + the entire Ash tree | **Names** | 1-4 days | Descents, classes, slots, Vows |
| **T3** | **APOTHEOSIS** | All of T2 + Names + all unlocks | **Ichor** | 1-3 weeks | Rule modifiers, the Nothing, Warden authoring |

**Rule:** each layer must feel like it *changes the game*, not just multiplies it. T1 multiplies. T2 unlocks. T3 rewrites.

---

## The Ash Tree

Three trunks. Each node has **infinite levels**, cost `base × 1.06^level`. But every **25 levels** a node crosses a **Keystone** breakpoint that grants a qualitative effect — this is what stops the tree being a flat treadmill.

**MEAT, EDGE and CLOT are multiplicative** (`×1.08` per level). Everything else is flat or additive. See [03 § 6](03-COMBAT-MATH.md) — this split is load-bearing, not cosmetic: the primary nodes must compound or they lose to exponential enemies, and the economy nodes must *not* compound or the whole curve runs away.

**OMEN is hidden until relics exist** (Phase 2). A node that does nothing is worse than a node that isn't there yet.

> **Every keystone below is implemented.** The lists were reordered from the original draft so that no effect depends on a system that doesn't exist yet (relics, Vows, Echoes, Organs). Nothing here is a stub.

### Trunk I — FLESH (survival & sustain)

| Node | Per level | Base cost | Keystones (L25 / L50 / L75 / L100) |
|---|---|---|---|
| **MEAT** | +12% Max HP | 8 | *Regen also scales with Max HP* / *+1% max HP as flat regen* / *Overheal becomes a shield* / *You cannot be one-shot from above 50%* |
| **SCAR** | +4 Armor | 12 | *Armor no longer reduced by enemy PEN below 20%* / *Take 10% less from Stands* / *Armor applies to DoTs* / *Gain 1 Armor per Rank cleared this run* |
| **CLOT** | +0.4/s Regen | 20 | *Regen ticks during Stand timers at 3×* / *Regen not interrupted by damage* / *Killing an enemy heals 2% max HP* / *Regen scales with Rank* |
| **MARROW** | +0.5% Lifesteal | 45 | *Lifesteal works on DoT damage* / *Lifesteal cannot be reduced* / *Overkill damage is lifestolen* / *Lifesteal heals Echoes too* |
| **RETURN** | +2% chance to revive at 15% HP on death | 200 | *Revive at 40%* / *Revive twice per run* / *Revive grants 5s immunity* / *Revive fully restores Resolve* |

### Trunk II — IRON (offense)

| Node | Per level | Base cost | Keystones |
|---|---|---|---|
| **EDGE** | +10% Attack | 8 | *+1% ATK per 10 Ranks this run* / *ATK also adds 5% of itself to Burn* / *Crits apply a 2s −20% Armor debuff* / *First hit on a new enemy deals 300%* |
| **HASTE** | +5% Attack Speed | 15 | *Attack Speed uncapped* / *Every 10th hit is free (no cooldown)* / *Attack Speed adds to Resolve Rate* / *Kills grant +30% SPD for 2s, stacking to 5* |
| **SPITE** | +2% Crit Chance | 18 | *Crit Chance over 100% adds Crit Mult (Augur effect, all classes)* / *Crits pierce 20% Armor* / *Crits refund 5 Resolve* / *Non-crits become crits after 8 non-crits* |
| **CRUELTY** | +0.06× Crit Multiplier | 30 | *Crit Mult applies to Signature* / *+0.5× vs Wardens* / *Crits chain 25% to the next enemy* / *Crit Mult scales with missing enemy HP* |
| **AWL** | +1.5% Penetration | 60 | *Penetration is never wasted (excess becomes ATK)* / *Ignore the 5% floor cap (deal true damage)* / *Pen applies to Evasion as accuracy* / *+10% pen vs Organs* |

### Trunk III — RITE (economy, time, meta)

| Node | Per level | Base cost | Keystones |
|---|---|---|---|
| **TITHE** | +8% Bone Find | 10 | *Bone continues accruing during Stands* / *Unspent Bone gives +1% ATK per 1000* / *Bone upgrades cost 10% less* / *Bone carries 5% through Reveille* |
| **PYRE** | +6% Ash Find | 40 | *Ash gain floor: never less than 60% of your best run* / *Wardens drop bonus Ash* / *Ash projection shown live* / *+1% Ash per Vow active* |
| **VIGIL** | +1h offline window | 90 | *Offline runs at 100% efficiency (from 70%)* / *Offline Standing Orders enabled* / *Offline Descents complete* / *Offline window ×1.5* |
| **OMEN** | +3% relic drop rate | 70 | *Guaranteed relic every 5 Stands* / *Drops roll one extra affix* / *+1 rarity tier chance* / *Duplicate relics merge into +1 affix roll* |
| **RESOLVE** | +6% Resolve Rate | 55 | *Signature costs 90 instead of 100* / *Signature fires at run start* / *Resolve carries between Ranks* / *Signature has a 15% chance not to consume Resolve* |

**Total: 15 nodes, 60 keystones.** That is enough content for 100+ hours before a single new node is needed.

### Respec
Free and unlimited. `RECANT` button refunds 100% of Ash. **No respec cost, ever** — punishing experimentation in a build game is indefensible. The cost of respeccing is the time to re-earn the wall, which is punishment enough.

---

## Vows (self-imposed challenges)

Unlocked at first Interment. You have 1 Vow slot, up to 4 (2 Names each). Vows apply **for the entire Ascension** (until Apotheosis), not per-run. Taking one is a commitment.

Each Vow is `[real downside] → [multiplicative Ash/Name gain]`. Multiplicative, so they stack into something huge.

| Vow | Downside | Reward |
|---|---|---|
| **Vow of Salt** | Gain no Bone. All Bone upgrades disabled. | ×2.2 Ash |
| **Vow of Silence** | Signatures never fire. | ×1.8 Ash |
| **Vow of the Open Coat** | Armor is permanently 0. | ×2.0 Ash |
| **Vow of Haste** | Every Rank has a 20s timer, not just Stands. | ×2.5 Ash |
| **Vow of the Single Body** | Revive and Second Body do nothing. | ×1.6 Ash |
| **Vow of Poverty** | Cannot equip relics. | ×2.4 Ash |
| **Vow of the Long Count** | Enemy growth is 1.16 instead of 1.145. | ×3.0 Ash |
| **Vow of the Blank Coat** | Cannot change class this Ascension. | ×1.5 Ash, +1 Name per Interment |
| **Vow of the Waking** | No offline progress at all. | ×2.0 Ash, ×1.4 Names |
| **Vow of Ten Thousand** | You die permanently at Rank 10,000. Ascension force-ends. | ×4.0 Ash, ×2 Names |

Four slots of the right Vows is a ~×30 Ash swing. This is the endgame optimization puzzle, and it's *player-authored difficulty* — the best kind.

---

## Standing Orders (automation)

The system that makes MYRIAD genuinely idle. Three tiers.

**Tier 1 — free at Reveille 25.** Auto-Reveille.
```
SOUND REVEILLE WHEN:
  ▸ projected Ash ≥ [ 1.5× ] last run     [slider 1.1× – 5×]
  ▸ OR no Rank gained for [ 5 ] minutes   [slider 1 – 30]
```

**Tier 2 — 5 Names.** Auto-purchase. A drag-to-reorder priority list of tree nodes; the game buys down the list whenever it can afford the top item.

**Tier 3 — 15 Names.** Auto-Interment, and auto-dispatch Descents on a chosen Layer whenever Keys are full.

**Design note:** automating a system is the *reward for mastering it*. Never automate something the player hasn't done manually at least 20 times. Never automate a decision that is actually interesting (relic equipping, class choice, Vows) — those stay manual forever.

---

## Progression pacing targets

| Milestone | Target time | Guard |
|---|---|---|
| First Reveille | 2-4 min | Measured, not guessed: the balance harness puts run one at Rank 29-32 in 2.2-2.9 min across all three starting classes. The original 7-10 min target was aspirational and wrong — a shorter first loop is a better hook. |
| Reveille 10 | 45 min | |
| Reveille 25 (Standing Orders) | 2.5 h | Critical — the game must automate before it becomes a chore |
| First relic | 1 h | |
| First Interment | 8-14 h | |
| All 6 base classes unlocked | 30 h | |
| First Descent Layer 3 | 45 h | |
| First Apotheosis | 90-140 h | |
| The Turn (narrative payload) | 120 h | |
| "Finished" content | ~400 h | After which it's pure infinite scaling |
