# 02 — Core Loop

## The nested loops

```
  ┌─ TICK (100ms) ──────────────────────────────────────────┐
  │  soldier attacks · enemy attacks · DoTs · Resolve fills  │
  └──────────────────────────────────────────────────────────┘
        ↓ enemy dies → Bone awarded → next enemy spawns
  ┌─ RANK (~3-15s) ─────────────────────────────────────────┐
  │  clear N enemies → Rank++ → every 10th Rank is a Stand   │
  └──────────────────────────────────────────────────────────┘
        ↓ you die (or a Stand timer expires)
  ┌─ RUN / REVEILLE (5-40 min early, hours late) ───────────┐
  │  Autopsy → Ash awarded → spend on the tree → march again │
  └──────────────────────────────────────────────────────────┘
        ↓ Ash tree saturates
  ┌─ INTERMENT (1-4 days) ──────────────────────────────────┐
  │  Reset Ash tree → gain Names → unlock classes, slots,    │
  │  Vows, and DESCENTS                                      │
  └──────────────────────────────────────────────────────────┘
        ↓ Names saturate
  ┌─ APOTHEOSIS (1-3 weeks) ────────────────────────────────┐
  │  Reset everything → gain Ichor → unlock the Nothing,     │
  │  reality modifiers, and the Warden you become            │
  └──────────────────────────────────────────────────────────┘
```

---

## Minute one to minute ten (the onboarding, precisely)

No tutorial popups. The game teaches by revealing one control at a time.

| Time | What happens | What the player learns |
|---|---|---|
| 0:00 | Black screen. Text: *"Ten thousand were sent."* Then: *"Choose what you were."* Three class sigils appear (only 3 of 6 at first — Hoplite, Lampbearer, Augur). | Class choice matters and is permanent-per-run |
| 0:10 | Combat starts immediately. Two sigils face each other. Numbers fly. | Combat is automatic |
| 0:25 | First kill. `+4 Bone` slides into a counter that just appeared bottom-left. | Bone exists |
| 0:40 | A single upgrade button appears: **`REINFORCE — 5 Bone`**. Nothing else on screen. | Spend Bone |
| 1:30 | Second and third Bone upgrades unfold. Rank counter appears top-center. | There is a build |
| 3:00 | **Rank 10 — first Stand.** A Warden sigil, much larger, with a timer ring. You beat it easily. | Stands are special and timed |
| 2:00 | You start losing. Enemy HP outpaces you. Damage numbers get small. | The wall |
| 2:45 | You die. Screen goes white, not black. **THE AUTOPSY**: *"Rank 31. You bled at a rate you could not answer."* `+12 ASH` | Death is the currency |
| 3:00 | The Ash tree opens for the first time. Three trunks, one node each affordable. | Permanent progression |
| 3:30 | **SOUND REVEILLE** button. You press it. *"You wake at the Mouth. Your coat says 2."* | The loop |
| 5:00 | Second run reaches Rank 31 in half the time. | It compounds. Hooked. |

*(Times above are measured from the balance harness, not estimated.)*

**Nothing is explained in words.** Every mechanic is introduced by appearing at the exact moment it becomes relevant, with a one-word label.

---

## The session shape (what a day looks like at ~week 2)

- **Morning, 3 min.** Open. Read the "While you slept" report — 9 hours of marching, 60 Reveilles auto-completed by the *Standing Order* system (see below). Spend a large Ash pile on 4-5 tree nodes. Set a Descent running. Close.
- **Lunch, 2 min.** Descent finished. Collect a relic. Equip it if it beats what you have (the game tells you: `+14% effective DPS`). Start another Descent.
- **Evening, 15 min.** The real session. You've hit a wall. You respec, swap class, take a Vow, push a new personal best, maybe an Interment. This is where the game is actually *played*.
- **Overnight.** Standing Orders run the Column while you sleep.

### Standing Orders (the auto-prestige system)
Unlocked at Reveille 25. A rule the player configures once:

> **Sound Reveille automatically when:** `[ Ash gain would be ≥ 1.5× last run ]` **or** `[ no Rank progress for 5 minutes ]`

This is what makes the game genuinely idle. Without it, offline progress caps at one run. With it, the player wakes up to 60 runs of compounding. **It is the single most important quality-of-life feature in the game and it must ship by Phase 3.**

Later tiers of Standing Orders can also auto-buy tree nodes by priority list, and auto-Interment.

---

## The week-to-week arc

| Stage | Hours in | What's new | What the player is optimizing |
|---|---|---|---|
| **The March** | 0-3 | Ash tree, Reveille, Stands | Raw stats. Buy the cheapest thing. |
| **The Build** | 3-12 | Relics, all 6 classes, Bone upgrade tree deepens | Class synergy. First real decisions. |
| **The Bargain** | 12-40 | Interment, Names, Vows, Descents | Efficiency per hour. Route planning. |
| **The Depth** | 40-120 | Layer 3-5 Descents, Warden evolutions, the Returned | Beating specific walls with specific builds |
| **The Turn** | 120-250 | Apotheosis, the Nothing, narrative payload lands | Understanding what the game has been doing |
| **The Myriad** | 250+ | Endgame: you author Wardens for your own future runs | Self-competition. Infinite. |

---

## Failure states

There is exactly one: **you stop making progress.** The game responds to it in escalating ways:

1. **Soft (< 2 min stalled):** damage numbers dim; a thin line of text appears under the enemy: *"It is not tiring."*
2. **Medium (5 min stalled):** the Reveille button starts breathing (subtle scale pulse). Ash projection shows on it.
3. **Hard (10 min stalled):** the Hollow speaks. One line, taken from a pool: *"You have made this Rank into a habit."*

**The game never forces a reset.** If the player wants to sit at Rank 400 farming Bone for an hour, that's a valid strategy for some builds (Gravedigger).

---

## What the player is doing when they're "not playing"

This must always be true: **something is accruing.**

| System | Accrues offline? | Cap |
|---|---|---|
| Column progress (Ranks, Bone) | Yes, full sim | Offline window (12h base → 96h upgraded) |
| Reveilles via Standing Orders | Yes | Same window |
| Keys (for Descents) | Yes | Cap 3 → 12 upgraded |
| Descent in progress | Yes, completes in real time | 1 concurrent → 4 upgraded |
| Ash tree purchases | Only with Standing Orders tier 2 | — |
