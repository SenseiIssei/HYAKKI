
# 03 — Combat & Math

> All numbers are `Decimal` (break_infinity.js) from the first commit. See [11 — Architecture](11-ARCHITECTURE.md).
> Constants live in `src/content/balance.ts` and are tunable without touching logic.

---

## 1. The tick

Simulation runs at a **fixed 10 ticks per second** (`TICK_MS = 100`). Rendering is decoupled. Offline catch-up runs the identical function in a loop, batched.

```
step(state, dt=1 tick):
  1. advance cooldowns (soldier attack, enemy attack, regen, Resolve)
  2. resolve soldier attack if ready
  3. resolve enemy attack if ready
  4. apply damage-over-time stacks
  5. apply regen / lifesteal
  6. check deaths → award Bone → spawn next enemy or advance Rank
  7. check Stand timer
  8. check soldier death → end run
```

Determinism: all RNG comes from a seeded PRNG stored in save state (`mulberry32`). Same save + same inputs = same outcome. This makes offline catch-up honest and bug reports reproducible.

---

## 2. Soldier stats

| Stat | Symbol | Base | Meaning |
|---|---|---|---|
| Max Health | `HP` | 140 | Death at 0 |
| Health Regen | `REG` | 3.0/s | Flat per second |
| Attack | `ATK` | 14 | Damage per hit before mitigation |
| Attack Speed | `SPD` | 1.0/s | Hits per second |
| Armor | `ARM` | 0 | Reduces incoming, softcapped |
| Evasion | `EVA` | 0% | Chance to take zero |
| Crit Chance | `CC` | 5% | |
| Crit Multiplier | `CM` | 1.5× | |
| Penetration | `PEN` | 0% | Ignores this fraction of enemy Armor |
| Lifesteal | `LS` | 0% | Fraction of damage dealt healed |
| Resolve Rate | `RES` | 1.0 | How fast the Signature meter fills |
| Bone Find | `BF` | 1.0× | Bone multiplier |
| Ash Find | `AF` | 1.0× | Ash multiplier |

### Stat composition order (strict — never deviate)

```
final = ((base + flatAdd) * (1 + Σ additivePct)) * Π multiplicativeMults
```

- **Tree nodes** give `flatAdd` and `additivePct`.
- **Relics** give `additivePct` (common/named) and `multiplicativeMults` (myth/true name only).
- **Class passives** give `multiplicativeMults`.
- **Vows** give `multiplicativeMults`.

Multiplicative sources are *rare and precious*. This is what makes a Myth relic feel like an event.

---

## 3. Damage formula

```
raw       = ATK * classPipeline(state)
crit      = rand() < CC ? CM : 1
mitigated = raw * crit * (1 - armorReduction(enemyARM * (1 - PEN)))
final     = max(mitigated, raw * 0.05)          // 5% floor: nothing is ever immune
```

### Armor reduction (softcap that never reaches 1.0)

```
armorReduction(A) = A / (A + K)
K = 30 * (1.08 ^ rank)
```

`K` grows with Rank so that a flat Armor number becomes less relevant as you descend — this forces continual investment and prevents an early Armor stack from trivializing the midgame. At `A == K` you take exactly half damage. Reduction asymptotes at 100% but the 5% damage floor guarantees you always take *something*.

**Same function is used for the soldier's own Armor** against enemy attacks, with the same `K`. Symmetry keeps it intuitive.

### Enemy attack
```
enemyRaw   = eATK
playerTake = enemyRaw * (1 - armorReduction(ARM)) ; 5% floor
if rand() < EVA: playerTake = 0
```

---

## 4. Enemy scaling

The heart of the game. Enemy power at Rank `r`:

```
eHP(r)  = 10  * growth(r)
eATK(r) = 1.5 * growth(r) ^ 0.75      // attack lags HP → fights get longer, not deadlier
eARM(r) = 0.6 * growth(r) ^ 0.55

growth(r) = PROD(i=1..r) stepGrowth(i)  *  hardening(r)

// The Hollow's immune response has to learn you first. Without this warm-up,
// run one ends around Rank 18 and the opening never gets to breathe.
stepGrowth(i) = 1.075 + (1.145 - 1.075) * (i / 40)    i <  40
              = 1.145                                  i >= 40

hardening(r) = 1                            r <  100
             = 1.03 ^ (r - 100)             r >= 100   // second gear
             = above * 1.05 ^ (r - 1000)    r >= 1000  // third gear
             = above * 1.09 ^ (r - 10000)   r >= 10000 // the Nothing
```

Design intent: `1.145^r` alone gets boring because player power also grows exponentially and the two can trivially match. The `hardening` gears mean **each order of magnitude of Rank requires a qualitatively better build**, not just more of the same.

### Enemies per Rank
```
count(r) = 4 + floor(r / 25), capped at 12
```
Deeper Ranks feel weightier without dragging (each enemy also dies faster relative to your DPS growth).

### Stands (every 10th Rank)
```
Warden HP  = eHP(r) * 8 * (1 + standsCleared * 0.02)
Warden ATK = eATK(r) * 1.6
Timer      = 30s + 5s per 100 Ranks       // hard fail if not killed in time
```
A Stand failure does **not** end the run — you're pushed back 3 Ranks and the Warden reheals. Three consecutive failures ends it. This makes Stands feel like *checks*, not coin flips.

---

## 5. Bone (run currency)

```
boneFromKill(r) = 2 * (1.11 ^ r) * BF
boneFromStand(r) = boneFromKill(r) * 25
```

Bone growth (1.11) is deliberately **slower** than enemy growth (1.145). Bone upgrades alone can never keep up — they buy you maybe 15-25 extra Ranks per run. Ash is the real engine. This is the correct tension: Bone is the tactic, Ash is the strategy.

### Bone upgrades (in-run, reset every Reveille)
Six of them, each with infinite levels, cost `base * 1.16^level`:

| Name | Effect per level | Base cost |
|---|---|---|
| **REINFORCE** | +8% ATK (additive) | 5 |
| **STAND FAST** | +8% HP (additive) | 5 |
| **WHET** | +4% SPD (additive) | 12 |
| **PLATE** | +6 ARM (flat) | 15 |
| **BLEED THEM** | +1% LS | 40 |
| **QUICKEN** | +5% Resolve Rate | 60 |

---

## 6. Ash (prestige tier 1)

```
ashOnReveille = floor( 1.5 * 1.09 ^ deepestRank * AF * vowMult )
```

**Ash is exponential in depth, not polynomial. This is the single most important formula in the game.**

> ### The mistake this replaced — read before touching it
>
> The original design specified `(deepestRank / 12) ^ 2.1`. That is unshippable, and it took a
> multi-Reveille harness to see why.
>
> Reaching Rank `R` requires player power growing like `1.145^R` — exponential. A polynomial
> reward cannot fund an exponential requirement. Each Reveille buys a pool that grows like `R²`
> while the next Rank costs `1.145×` more than the last, so the ratio collapses and depth
> converges to a **fixed point**.
>
> Measured, with the original numbers: the game stalled dead at **Rank 50 forever** — runs 7
> through 14 all ended at exactly Rank 50 while tree levels went from 35 to 67. Tripling the
> player's investment produced *zero* progress.
>
> **Every Rank must MULTIPLY the payout, not add to it.**

The corollary, equally load-bearing:

> ### Primary tree nodes must be multiplicative
>
> `MEAT`, `EDGE` and `CLOT` are `stat *= 1.08 ^ level`. Additive levels (`+10% per level`) grow
> *linearly* in level count, and level count only grows linearly with Rank — so additive nodes
> also lose to exponential enemies, just more slowly.

And the counterweight, which is not optional:

> ### Economy nodes must NOT be multiplicative
>
> `TITHE` and `PYRE` stay additive. Multiplicative Ash Find feeds its own income — more Ash buys
> more Ash Find buys more Ash — and the curve goes superexponential. Measured, with `PYRE` at
> `×1.05/level`: **Rank 899 by run 7**, at which point the player is unkillable and progress is
> bounded only by wall-clock. Any node that multiplies a *currency* is a feedback loop.

### Measured compounding (`npx tsx scripts/prestige.ts`)

| Run | 1 | 2 | 4 | 7 | 11 | 14 | 16 |
|---|---|---|---|---|---|---|---|
| Rank | 36 | 38 | 47 | 60 | 70 | 80 | 90 |
| Ash | 33 | 39 | 86 | 264 | 625 | 1,479 | 4,974 |

Push, plateau for a run or two, buy through the wall. All three classes are monotonic.

Minimum meaningful gain: the button is disabled below `ashOnReveille < 1`, with the projection shown so the player knows how close they are.

**Ash is kept across Reveille and spent in the tree. It is *not* a running total you hoard** — spent Ash is spent. (Rejected alternative: "Ash total drives passive bonuses." Too passive; removes the spending decision, which is the fun part.)

---

## 7. Names (prestige tier 2)

```
namesOnInterment = floor( (totalAshEverSpent / 5e6) ^ 0.5 ) + wardenNamesEarned
```

Square-root scaling: Names are *slow*, and that's correct. A player should feel each one. Target: **first Interment at ~8-14 hours played, yielding 3-5 Names.** Total Names available at 100h: ~40.

Names buy things that are not numbers:

| Cost | Unlock |
|---|---|
| 1 | Relic slot (max 6) |
| 2 | Class: Revenant |
| 2 | Class: Chorus |
| 3 | Class: Gravedigger |
| 2 | Vow slot (max 4) |
| 3 | Descent Layer 2 |
| 4 | +1 concurrent Descent |
| 5 | Standing Orders tier 2 (auto-buy) |
| 8 | Class: NULL |
| 12 | Class: Warden |

---

## 8. Ichor (prestige tier 3)

```
ichorOnApotheosis = floor( namesEverSpent ^ 1.4 / 3 )
```

Ichor buys **rules**, not stats:
- *"Armor's `K` no longer scales with Rank."* (breaks the softcap)
- *"The 5% damage floor becomes 2%."*
- *"Your Signature fires twice."*
- *"Bone growth becomes 1.13."*
- *"You may equip two classes."* ← the big one, ~40 Ichor
- *"The Returned drop Ash."*

---

## 9. The Time-To-Kill target curve (the balance north star)

The single metric to tune against. `TTK` = seconds to kill one non-Stand enemy at your current build.

| Rank band | Target TTK | Why |
|---|---|---|
| 1-30 | 0.4-1.2s | Fast dopamine. Numbers fly. |
| 30-100 | 1.0-2.5s | Readable. You can see the fight. |
| 100-500 | 1.5-3.0s | The comfortable groove |
| 500+ | 2.0-4.0s | Weighty; each kill matters |
| Stand | 8-25s | An event. Long enough to be tense. |

If TTK exceeds ~6s outside a Stand, the build has failed and the player is at their wall. **The autopsy should say so explicitly.**

### Balance harness (build this in Phase 1)
`scripts/balance.ts` — runs the headless sim with a scripted "average player" purchase policy, dumps CSV:
`rank, ttk, dps, ehp, boneRate, timeToRank, ashProjection`
Plot it. Any discontinuity is a bug. Any flat region longer than 20 Ranks is a boring stretch.

---

## 10. Resolve & Signatures

Every class has one **Signature** ability that fires automatically when the Resolve meter fills.

```
resolveGain per tick = (0.6 + damageTakenThisTick / maxHP * 4) * RES
Signature fires at 100. Meter resets to 0.
```

Resolve fills from *time* and *danger*. A safe fight fills it in ~14s; a fight where you're being hurt fills it in ~5s. This means Signatures fire most often exactly when you need them, which reads as heroic without any player input.

---

## 11. Rounding & display

- Internal: full `Decimal` precision, never rounded.
- Display: `< 1e6` → full number with thousands separators. `≥ 1e6` → 3 significant figures + suffix (`4.21M`, `9.99e14`).
- Suffix table to `1e63` (standard short scale), then scientific.
- **Milestone numbers** (round powers of ten, personal bests) are shown in full, once, in the log, with the phrasing *"You have dealt one billion."*
- Damage numbers on screen: always short form, always monospace, always fade upward over 700ms.
