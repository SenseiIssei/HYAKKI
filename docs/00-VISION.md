# 00 — Vision & Pillars

## The one-sentence test

> **A small soldier marches into a wound forever, and every death makes the march longer.**

If a feature doesn't serve that sentence, it doesn't ship.

---

## Design pillars

### 1. The number is the story
Most idle games treat big numbers as a side effect. MYRIAD treats them as the *subject*. Your soldier number, your rank, your death count, your Ash — these are diegetic. The UI presents numbers with the reverence of scripture: monospace, large, centered, unhurried. When a number crosses a threshold, the world comments on it.

**Implication:** never abbreviate a milestone number away. `1,000,000` is a moment. `1.00M` is a stat. Show both — the full number on milestones, the short form everywhere else.

### 2. You never fight. You prepare, then you watch.
Combat is 100% automatic and always has been. The player's verbs are: **choose a class**, **spend currency**, **equip relics**, **plot a Descent route**, **take a Vow**, **decide when to die**. There is no attack button, no clicker, no active skill rotation. The tension is in build commitment, not reflexes.

**Implication:** combat must be *legible*. If the player can't tell why they lost, the whole game breaks. Every fight ends with a one-line autopsy: *"Rank 214 — the Warden outpaced your regen by 3.1/s."*

### 3. Dying is the progress button
Failure is never punishment. The wall you hit is the game telling you it's time to Reveille. The reset screen is the most beautiful screen in the game, not the saddest. Players should *want* to lose.

**Implication:** the run-end screen shows what you gained, never what you lost. Ash earned, ranks cleared, a new fragment of lore. Never "you failed."

### 4. Zero assets, infinite variety
Every visual is generated from a seed. This isn't a cost-saving compromise — it's the aesthetic. The god's body produces infinite variations of the same few holy shapes. A rank-3 chaff enemy and a rank-90,000 chaff enemy are drawn by the same function with different seeds, and that *is* the horror.

**Implication:** the sigil generator is a first-class system, not a placeholder. Budget real time for it in Phase 0.

### 5. Idle means idle
The game must be *better* when you're not looking at it. No mandatory check-ins, no timers that punish absence, no daily login streaks. Offline progress is generous and the report you come back to is the reward.

**Implication:** active play gets a small, optional multiplier (the Urge, +25% for 30s on a 2-min cooldown). It is never required and never more than a nudge.

### 6. Surreal, not grimdark
The tone is dream-logic and religious awe, not blood and edge. The god is not evil. Its death is not a tragedy. Enemies are organs and antibodies and memories. When the game is unsettling, it's because something is *wrong in a quiet way*, not because it's loud.

**Reference register:** Byzantine iconography, anatomical woodcuts, Anabasis, *Blame!*, Gnostic texts, the phrase "I have no mouth."

---

## Anti-goals

| We are NOT building | Why |
|---|---|
| A clicker | Clicking is not a fantasy. Marching is. |
| A gacha | No randomized paid anything. No paid anything. |
| A PvP game | The only other player is your past self. Literally. |
| A story-first game | Lore is a reward for depth, never a gate. Skippable, always. |
| A pixel-art idle game | Every idle game looks like that. Ours must not. |
| An "energy"-gated game | The only gated system is Descents, and Keys regen fast enough to never feel like a wall. |
| A live-service | It is finished when it's finished. It works offline forever. |

---

## The three promises to the player

1. **You will always have something to spend on.** No dead-end sessions. Ever.
2. **The wall is never permanent.** Every wall has at least two solutions: more numbers, or a different build.
3. **The game knows how long you've played, and it will say so.** Depth is acknowledged. Loyalty gets weird rewards.

---

## Success criteria (how we know it worked)

- A new player reaches their **first Reveille within 10 minutes** without reading anything.
- A player who leaves for 8 hours comes back to a report they **screenshot**.
- At 20 hours played, the player can explain **why** their build works, in one sentence.
- At 50 hours played, the game has **shown them something they didn't expect**, at least twice.
