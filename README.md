# MYRIAD

> *Ten thousand soldiers marched into the Hollow to kill a god.*
> *They succeeded.*
> *The god, dying, forgot how to end.*
> *Its death is still happening. You are inside it.*

**MYRIAD** is an infinitely-scaling idle auto-battler about one nameless soldier in an endless column, marching into the still-dying body of a god. You pick a class, you never touch a button in combat, and the number on your back goes up forever.

---

## The pitch in one paragraph

You are Soldier #1 of the Myriad. You march. You fight automatically. Eventually you meet something you cannot kill, and you die — and you wake at the start of the march as Soldier #2, permanently stronger, carrying **Ash** from everything you burned through. Do that a few hundred times and you stop being a number: you earn a **Name**, and Names buy things numbers cannot. Do it long enough and the enemies start looking familiar, because the game has been saving your corpses, and now it is sending them back at you with your own stats. The final upgrade is not a stat. It's becoming the thing that stopped you.

---

## Genre & references

| | |
|---|---|
| **Genre** | Idle / incremental auto-battler with roguelite descents |
| **Session shape** | Check in 3-6× a day for 2-10 min; runs overnight |
| **Feels like** | Melvor Idle's depth × Vampire Survivors' pacing × Slay the Spire's map × a woodcut of hell |
| **Platform** | Web (React + Vite + TypeScript), Tauri desktop shell later |
| **Art** | Zero image assets. Every entity is a procedurally-generated symmetric SVG sigil, seeded by ID. |
| **Monetization** | None. Free, offline-capable, no ads, no IAP. |
| **Audio** | Drone, bell, breath. Almost no melody. |

---

## Documentation map

| Doc | What's in it |
|---|---|
| [00 — Vision & Pillars](docs/00-VISION.md) | Design pillars, anti-goals, the one-sentence test |
| [01 — Fiction & Glossary](docs/01-FICTION.md) | The world, the god, the naming conventions for everything |
| [02 — Core Loop](docs/02-CORE-LOOP.md) | Minute-to-minute, session-to-session, week-to-week |
| [03 — Combat & Math](docs/03-COMBAT-MATH.md) | Every formula. Damage, scaling, softcaps, prestige currency curves |
| [04 — Classes](docs/04-CLASSES.md) | 6 starting + 3 unlockable classes, each with a distinct damage pipeline |
| [05 — Progression](docs/05-PROGRESSION.md) | The three prestige layers, the Ash tree, Vows |
| [06 — Relics](docs/06-RELICS.md) | Affix system, rarity, procedural generation, 40 handcrafted mythics |
| [07 — Enemies & Wardens](docs/07-ENEMIES.md) | Five enemy families, ten named Wardens, the Returned system |
| [08 — Descents (Dungeons)](docs/08-DESCENTS.md) | Branching node maps, Keys, five themed layers |
| [09 — Art Direction](docs/09-ART-DIRECTION.md) | The sigil generator spec, palette, motion, typography |
| [10 — UI & Screens](docs/10-UI-UX.md) | Every screen, wireframed in ASCII, plus the copy voice |
| [11 — Architecture](docs/11-ARCHITECTURE.md) | Folder layout, headless sim, save format, Decimal math, offline catch-up |
| [12 — Roadmap](docs/12-ROADMAP.md) | 7 phases from empty repo to endgame, with definition-of-done per phase |
| [13 — Content Tables](docs/13-CONTENT-TABLES.md) | Ship-ready data: upgrade nodes, affixes, enemy stats, vow list |
| [14 — Narrative](docs/14-NARRATIVE.md) | The fragment system, the twist, and how it's mechanically real |

---

## Status

**Phases 0-4 complete and playable.** Design complete for all seven phases.

```
npm install
npm run dev      # http://localhost:5180
npm test         # 69 tests, incl. the balance-band and compounding design tests
npx tsx scripts/balance.ts hoplite 25     # headless TTK curve, one run
npx tsx scripts/prestige.ts hoplite 16 15 # does it compound? 16 Reveilles
npx tsx scripts/offline.ts                # offline catch-up: speed and accuracy
npx tsx scripts/interment.ts hoplite 60   # the Names economy over 60 Reveilles
```

Working today: class select (Hoplite / Lampbearer / Augur, each with a real damage
pipeline and an auto-firing Signature), infinite Ranks, procedural sigils for every
entity, Bone economy, **Ash and Reveille**, **the 14-node tree with all 56 keystones
implemented**, free Recant, **Stands every 10th Rank against five Wardens** with real
telegraphed signatures, Burn, revives, shields, progressive-revelation onboarding,
the Autopsy, save/load/export/import with rolling backups and a v1→v2 migration,
offline catch-up, and two headless balance harnesses.

Phase 2 adds: **relics** (5 rarities, 14 affixes, 12 authored Myths and 6 True Names),
the **sim-fork comparison card**, depth-gated slots, melt and bulk-melt, **all six
classes** (Revenant / Chorus / Gravedigger earned through play), **Ghost snapshots**,
and the **Organs** enemy family.

Measured: first run **Rank ~40**; compounding across 12 Reveilles with real equip
decisions reaches **Rank 90**, monotonically, on all three starting classes.

Phase 3 makes it genuinely idle: **offline catch-up** (12h window in 81ms),
the **"While you slept" report**, **Standing Orders** (auto-Reveille, unlocked at
Reveille 25), keyboard navigation, a **numbers-only mode**, and font scaling.

Measured: eight hours away returns **632 Ranks, 190 Stands, 33 Reveilles, 726 Ash**.

Phase 4 is the bargain: **Interment and Names**, the **Name shop**, **all 10 Vows**
(every downside genuinely enforced), **Standing Orders tier 2** (auto-spend down a
priority list), Wardens 6-8 with **T2 evolutions**, and **THE RETURNED** — enemies built
from your own past runs, wearing their real coat numbers.

Next: [Phase 5 — The Depth](docs/12-ROADMAP.md) (Descents: Keys, branching route maps,
and the five Layers).
