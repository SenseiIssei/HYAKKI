# 12 — Roadmap

Seven phases. Each has a hard **definition of done** — a thing you can watch happen. Do not start a phase before its predecessor's DoD is true.

---

## Phase 0 — THE MARCH *(the vertical slice)*

**Goal:** a soldier fights forever and you can't look away.

- [ ] Vite + React + TS scaffold, strict mode
- [ ] `break_infinity.js` wired in, Decimal helpers, display formatter with suffix table
- [ ] `src/sim/` skeleton: `types`, `state`, `formulas`, `combat.step()`
- [ ] Fixed-timestep loop hook
- [ ] **The sigil generator** — full spec from doc 09, with all family presets
- [ ] One class (HOPLITE), one enemy family (CHAFF), Ranks 1-∞ with the growth curve
- [ ] Bone, and the 6 Bone upgrades
- [ ] The main view: Rank number, two sigils, HP bars, damage numbers, currency panel
- [ ] Save/load + **export/import** + autosave + 3 backup slots
- [ ] Palette, fonts, grain, vignette

**DoD:** you open it, do nothing for two minutes, and it looks like a game you'd want to play. Close the tab, reopen, everything is where you left it.

---

## Phase 1 — THE ASH

**Goal:** the loop closes.

- [ ] Death detection → **The Autopsy** screen with generated cause-of-death line
- [ ] Ash formula, `SOUND REVEILLE` with live projection
- [ ] The full Ash Tree: 15 nodes × infinite levels, all 60 keystones
- [ ] Tree drawer UI with `×1/×10/×Max` and free `RECANT`
- [ ] Stands every 10 Ranks, with timer, plus Warden #1 THE QUARTERMASTER
- [ ] `scripts/balance.ts` + the TTK band test
- [ ] Progressive-revelation onboarding

**DoD:** a fresh player reaches their first Reveille in 7-10 minutes without being told anything, and immediately does a second run. Balance CSV shows no flat stretch longer than 20 Ranks.

---

## Phase 2 — THE BUILD

**Goal:** two players' games look different.

- [ ] All 6 base classes with Pipelines, Signatures, Curses
- [ ] Resolve meter + Signature firing
- [ ] Relic system: affix pool, rarity, generation, slots (2→6)
- [ ] **The relic comparison card** (sim-fork DPS/survival delta) — this is the phase's headline feature
- [ ] Inventory, melt, bulk-melt
- [ ] All 12 handcrafted Myths
- [ ] Enemy families: Organs, plus the name grammar
- [ ] Wardens #2-5

**DoD:** you can beat your personal best with two structurally different builds, and the relic card tells you which relic is better without you doing arithmetic.

---

## Phase 3 — THE SLEEP *(the phase that makes it an idle game)*

**Goal:** it's better when you're not looking.

- [ ] `catchUp()` with batched fast-path, 96h in <400ms
- [ ] Offline window, efficiency, VIGIL keystones
- [ ] **The "While you slept" report screen**
- [ ] **Standing Orders tier 1** (auto-Reveille) — *critical, do not defer*
- [ ] `visibilitychange` handling
- [ ] Mobile layout, one-handed portrait
- [ ] Accessibility pass: reduced motion, contrast, keyboard, numbers-only mode

**DoD:** close it Friday evening, open it Sunday morning, and the report is worth screenshotting. Play the whole thing on a phone with one thumb.

---

## Phase 4 — THE BARGAIN

**Goal:** the second prestige layer, and real decisions.

- [ ] Interment, Names, the Name shop
- [ ] All 10 Vows, Vow slots, stacked multiplier display
- [ ] **The Ghost system** — snapshots on Reveille, rolling 500
- [ ] THE RETURNED enemy family drawing from Ghosts
- [ ] CHORUS class Echoes (reuses Ghosts)
- [ ] Standing Orders tier 2 (auto-buy priority list)
- [ ] Wardens #6-8, and T2 Warden evolutions

**DoD:** a player fights an enemy wearing their own number from thirty runs ago, and notices.

> **Met.** Live at Rank 301:
> ```
> Soldier #67
> It got as far as Rank 20. You were it.
> ```
> The Returned appear from Rank 40 once ghosts exist, at 6-30% of spawns rising with
> depth. They take their **identity** from a real past run (number, sigil seed, one affix
> it carried) and their **numbers from the present Rank** — an old ghost's raw statline
> would be harmless by Rank 900.

### Known plateau (measured, and deliberate)

Over 100 Reveilles the curve is: slow start → rapid climb around Reveille 20-30 →
**hard wall at ~Rank 6,800**, where `hardening`'s third gear (`1.05^(r-1000)`) outruns
anything the tree can buy. Depth then sits flat for dozens of runs.

That wall is the content gap Phases 5 and 6 exist to break — Descents for a second power
axis, and Ichor for rule changes that edit the curve itself. It is not a balance bug, but
it does mean **the game currently has an endgame ceiling at ~Rank 6,800**.

---

## Phase 5 — THE DEPTH

**Goal:** the dungeon layer.

- [ ] Keys, regen, cap
- [ ] Descent map generation, all 9 room types
- [ ] Route plotting UI + **live win-probability estimate**
- [ ] Layers I-IV with their twists, palettes and Wardens
- [ ] Concurrent Descents, offline completion
- [ ] CARTOGRAPHER class
- [ ] Web Worker sim for true background progress

**DoD:** you plot a route, close the laptop, and come back to a resolved Descent and a relic you're excited about.

---

## Phase 6 — THE TURN

**Goal:** the game says something.

- [ ] Apotheosis, Ichor, the rule-modifier shop
- [ ] THE NOTHING family + erasure damage + negative-space sigils
- [ ] Layer V — NOWHERE, with its self-deleting map
- [ ] NULL and WARDEN classes
- [ ] All T3 Warden evolutions
- [ ] **THE MYRIAD** final encounter, statted from every Ghost you've recorded
- [ ] The fragment system, all ~60 fragments, the Archive screen
- [ ] Warden authoring — your best Ascension becomes a boss for your future ones

**DoD:** a player who has been playing for 120 hours gets quiet for a second.

---

## Phase 7 — POLISH & AFTER

- [ ] Audio: drone bed, bell, three hit textures, one Signature swell. Sparse. Mixable to zero.
- [ ] Achievements — written as *observations*, not tasks (*"You have died one thousand times. The Hollow has kept count."*)
- [ ] Statistics screen: lifetime everything, graphed
- [ ] Tauri desktop build + installer, tray mode
- [ ] Optional cloud save via the DevPanel VPS
- [ ] Deploy to `senseiissei.dev/myriad` (manual scp + docker compose, per the existing DevPanel process)

---

## Sequencing advice

**Build in this order and the game is always playable.** After Phase 0 it's a toy; after Phase 1 it's a game; after Phase 3 it's *the* game; everything after is depth.

**The three things people get wrong in this genre, and where we've guarded against them:**
1. *Retrofitting big numbers* → Decimal in Phase 0.
2. *Shipping automation too late, so the game becomes a chore* → Standing Orders in Phase 3, not Phase 6.
3. *Balance drift with no instrumentation* → the balance harness and TTK test in Phase 1.

**If you only ever finish Phase 0-3, you have a complete, good, finished game.** Phases 4-6 are the reason to keep going, not the reason to start.
