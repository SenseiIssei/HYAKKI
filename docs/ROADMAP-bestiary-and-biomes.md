# Roadmap — 50 more yōkai, new biomes, and music that changes with the road

_Status: **SHIPPED.** All six phases below are built and merged — per-biome
music modes, six new biomes, fifty new yōkai across three waves, and the
lore/i18n pass. This document is kept as the design record. Counts as shipped:
**74 species**, **12 biomes**, each biome with its own musical mode._

## The three systems this touches (and why it's cheap)

Everything below plugs into three tables that were built to be extended:

1. **`src/pixel/species.ts` → `SPECIES[]`.** A monster is one `build(seed, phase)`
   function (a character-grid sprite that animates on `phase ∈ [0,1)`) plus one
   table row (`id, name, kanji, family, from, weight, fps, lore, build`). No
   other file has to change for a new enemy to spawn, animate, colour-shift and
   show its Register line. The five combat **families** — `chaff` (fast, weak,
   many), `organs` (slow bruisers), `returned` (ghosts), `nothing` (voids),
   `warden` (the Ten Kings / bosses) — already carry attack animations, spark
   colours, and death dissolves, so a new species inherits its whole feel from
   the family it declares.

2. **`src/ui/Backdrop.tsx` → `REGIONS[]`.** A biome is one row: `id, from, name`,
   and a five-colour palette (`sky[2], far, mid, near`). `regionFor(rank)` picks
   it by depth; the parallax layers and fog redraw themselves. Adding a biome is
   one entry — the comment already says so.

3. **`src/audio/` → `engine.ts` (`setAmbience`) + `music.ts`.** Ambience already
   cross-fades per region. Music does **not** yet change with the region — it is
   one mode (the _in_ scale 陰音階 on D) everywhere. That is the gap this roadmap
   closes: **each biome gets its own musical mode and instrumentation.**

**Economy-safety rule (unbreakable):** signature/gear/enemy stats may touch
damage, crit, survival, speed, and _feel_ — never `bf/af/omen` or any income
multiplier. New content is measured against the prestige harness before merge
(the Ri 50→170→732 no-runaway check), exactly as gear was in Phase 7.

---

## Part A — six new biomes, interleaved with the six that exist

Existing: Bamboo Road (0), Emptied Village (60), Thousand Gates (160), The River
/ Sanzu (320), The Burning Ground / Jigoku (700), Without Interval / Muken
(2000).

New biomes slot **between** them so the road keeps changing, roughly every
40–120 ranks early and widening later. `from` values are proposals; final values
get tuned against pacing.

| # | id | name | from | mood / palette direction |
|---|----|------|------|--------------------------|
| B1 | `paddies` | The Drowned Paddies | 30 | flat black water, a low green mist, frog-song |
| B2 | `market` | The Night Market | 110 | lantern-red, crowded, too many lights for how empty it is |
| B3 | `snow` | The Snow Country | 230 | white-out, blue shadow, the cold that the Yuki-onna keeps |
| B4 | `aokigahara` | The Sea of Trees | 460 | no wind, no birds, roots and rope, green-black |
| B5 | `bridges` | The Hundred-Bridge Marsh | 900 | fog over black planks, will-o'-wisps, the River's edge going wrong |
| B6 | `togen` | The Iron Wastes | 1400 | between Jigoku and Muken — rust, slag, cooling metal, dull orange |

Each new biome ships with: one palette row in `REGIONS`, one ambience voice id in
`setAmbience`, one music mode (Part C), and its share of the 50 monsters (Part B).

---

## Part B — the fifty

Named where real folklore gives a name; the deepest hells invent where it must.
Each line: **NAME 漢字** — `family` · biome · one-line hook (the sprite/attack idea).

### The Bamboo Road & Drowned Paddies (early — chaff-heavy, teach the families)
1. **Konaki-jijī 子泣き爺** — `chaff` · bamboo · a crying infant that turns to stone weight when picked up; lunges then goes heavy.
2. **Kejōrō 毛倡妓** — `returned` · bamboo · a woman who is all hair from behind; the hair is the attack.
3. **Suzuri-no-tamashii 硯の魂** — `chaff` · bamboo · a possessed inkstone that spits ink that blinds (a debuff tell).
4. **Kawauso 獺** — `chaff` · paddies · a trickster otter, fast, feints before it strikes.
5. **Kazenbō 火前坊** — `returned` · paddies · a burnt monk's ghost, drifts low over the water.
6. **Ōnamazu 大鯰** — `organs` · paddies · the earthquake catfish; a slow, ground-shaking slam.
7. **Dorotabō 泥田坊** — `organs` · paddies · a one-eyed mud figure rising from a stolen field; grabs.
8. **Ashimagari 足まがり** — `chaff` · paddies · a cotton-soft thing that wraps the legs (a slow tell).
9. **Kanedama 金霊** — `nothing` · paddies · a hovering coin of light that gives nothing and takes.

### The Emptied Village & Night Market (mid — organs and returned mix)
10. **Ittan-momen 一反木綿** — `chaff` · village · a flying strip of cloth that smothers; darting attack.
11. **Tenjōname 天井嘗** — `returned` · village · a long-tongued ceiling-licker that drops from above.
12. **Akaname 垢嘗** — `chaff` · village · the filth-licker; low, scuttling, a fast jab.
13. **Mokumokuren 目目連** — `nothing` · village · a wall of eyes in torn paper screens; a stare that pulses.
14. **Ōmukade 大百足** — `organs` · market · a giant centipede, multi-hit lunge.
15. **Tesso 鉄鼠** — `chaff` · market · the iron-rat swarm of a wronged monk; comes in numbers.
16. **Bakeneko 化け猫** — `returned` · market · a two-tailed cat that dances on the lanterns; quick and cruel.
17. **Kasa-obake reprise / Hone-karakasa 骨傘** — `chaff` · market · a broken-ribbed umbrella, faster and meaner than its shrine cousin.
18. **Nurikabe 塗壁** — `organs` · market · the wall that blocks the road; a Stand-style stonewall (defensive tell).
19. **Nozuchi 野槌** — `organs` · market · a maul-shaped serpent; heavy overhead.
20. **Aka-manto 赤マント** — `warden` (mini) · market · the red-cloak that asks a question with no safe answer; a choice-tell boss.

### The Thousand Gates & Snow Country (shrine + cold)
21. **Tsukumogami procession 付喪神** — `chaff` · shrine · a parade of hundred-year tools; a mixed swarm.
22. **Jatai 蛇帯** — `returned` · shrine · a possessed obi-sash that strangles; a coiling drift-attack.
23. **Basan 波山** — `chaff` · shrine · a fire-breathing cockerel; a short flame jab (no real heat this high — a tell).
24. **Hitodama swarm 人魂** — `nothing` · shrine · soul-flames that gutter and gather; a pulsing void-lite.
25. **Yamawaro 山童** — `chaff` · snow · a mountain-child, hardy, comes down in a pack.
26. **Nurikabe-no-yuki / Yukinba 雪婆** — `organs` · snow · the snow-hag; slow, freezing slam that slows you.
27. **Tsurara-onna 氷柱女** — `returned` · snow · the icicle-woman; a downward drift-spike.
28. **Oshiroi-babā 白粉婆** — `returned` · snow · a face caked white, mirror in hand; a blinding tell.
29. **Kamaitachi 鎌鼬** — `chaff` · snow · the sickle-weasel wind; three cuts in one blink (the fastest jab in the game).
30. **Yuki-warashi 雪童子** — `nothing` · snow · a child-shaped absence in the white-out; stands and pulls the warmth.

### The Sea of Trees & River / Sanzu (returned & nothing get loud)
31. **Jubokko 樹木子** — `organs` · aokigahara · a blood-drinking tree; roots grab and drain.
32. **Yamabiko 山彦** — `returned` · aokigahara · an echo given a body; it answers your ability with a copy (a mirror mechanic).
33. **Nobiagari 伸び上がり** — `chaff` · aokigahara · a thing that grows taller the longer you look; scaling tell.
34. **Kubikire-uma 首切れ馬** — `organs` · aokigahara · a headless horse; a trampling charge.
35. **Ao-nyōbō 青女房** — `returned` · aokigahara · a blue court-lady still waiting; a grief-drift.
36. **Funayūrei reprise / Umi-bōzu 海坊主** — `nothing` · sanzu · the sea-monk; a rising black tide (big void pulse).
37. **Ayakashi 絢** — `returned` · sanzu · a coastline of drowned sailors passing for days; an endurance wave.
38. **Gaki 餓鬼** — `organs` · sanzu · a hungry ghost, all belly and need; grabs and drains resolve.
39. **Shōkera 精螻蛄** — `chaff` · sanzu · a thing that watches through the skylight for sins; a peeking dart.
40. **Datsue-ba 奪衣婆** — `warden` (mini) · sanzu · the old woman at the Sanzu who takes your clothes; a toll-boss that strips a buff.

### The Bridges, Iron Wastes, Burning Ground & Muken (bosses & the deepest)
41. **Ōkubi 大首** — `nothing` · bridges · an enormous face filling the fog; a wide pulse that fills the arena.
42. **Waira 猥** — `organs` · bridges · a one-clawed marsh-beast that drags prey under; a hook-and-pull.
43. **Hibagon / Yamajijii 山爺** — `organs` · bridges · a mountain-giant, single crushing blow.
44. **Onibi-no-mure 鬼火の群れ** — `nothing` · iron · demon-fires in a cooling forge; a lattice of pulses.
45. **Kanabō-oni 金棒鬼** — `organs` · iron · an oni smith with a red-hot club; heavy, with a burn-over-time tell.
46. **Shuten-dōji 酒呑童子** — `warden` · iron · the drunken demon-king of Ōe; a named court boss (Stand + tells).
47. **Hōkō / Genbu-gone-wrong 彭侯** — `organs` · jigoku · a tree-spirit turned furnace; slow, immense.
48. **Enma-no-tsukai 閻魔の使い** — `warden` · jigoku · a herald of the judge; a boss that _reads your ledger_ (references your run).
49. **Kokū 虚空** — `nothing` · muken · not a hole but the space a hole leaves; the quietest, worst enemy — a slow total pulse.
50. **Yatō 夜藤 (the Night-Wisteria)** — `warden` · muken · an invented final court for Without Interval: a King made of every road that came before; the capstone fight.

Weighting/`from` per row gets tuned so each biome introduces 2–3 new faces while
older ones thin out, keeping the road a crowd, never a clone army.

---

## Part C — music that changes with the biome

Today `music.ts` is one mode (_in_ scale on D) plus koto/taiko/breath voices.
The change: a **mode table keyed by region**, switched the same moment
`setAmbience` fires. Japanese scale practice gives us real, distinct colours —
this is not random transposition, it's the right modes for the place.

| biome | mode (scale) | intervals from root | instrumentation shift | feeling |
|-------|--------------|---------------------|------------------------|---------|
| bamboo | **in** 陰 | 0,1,5,7,8 | koto sparse, breath | the dark default, unease held |
| paddies | **yo** 陽 | 0,2,5,7,9 | koto + a low frog-thump | brighter, but wrong-bright |
| village | **miyako-bushi / in** | 0,1,5,7,8 | koto muted, shamisen pluck | abandoned, dry |
| market | **ryo** 呂 | 0,2,4,7,9 | shamisen lead, faster taiko | crowded, feverish |
| shrine | **hirajōshi** 平調子 | 0,2,3,7,8 | koto open tuning, bells | rite, gold, waiting |
| snow | **kumoi** 雲井 | 0,2,3,7,9 | koto high, breath, no drum | white silence, thin air |
| aokigahara | **iwato** 岩戸 | 0,1,5,6,10 | detuned koto, no pulse | no wind, no exit |
| sanzu | **insen** 陰旋 | 0,1,5,7,10 | koto + water, slow taiko | the crossing |
| bridges | **iwato (low)** | 0,1,5,6,10 | sub-drone, wisps | fog, one plank at a time |
| jigoku | **chromatic descent** | 0,1,2,3… | taiko dominant, brass-ish rasp | the burning, tempo climbs with Ri |
| iron | **in + tritone drone** | 0,1,5,7,8 + ♭5 pedal | anvil percussion | forge, metal cooling |
| muken | **single held cluster** | root + ♭2 + ♭5 | almost no melody, breath only | without interval — nearly no music at all |

Implementation: add `musicForRegion(regionId)` in `music.ts` that swaps the
active `SCALE` array and a small `voices` config; call it from the same place
`setAmbience` is called (`Column.tsx` region effect). Cross-fade the melodic
layer over ~2s so the mode-change lands as you walk into the new place, not as a
hard cut. Depth still intensifies _within_ a biome (tempo, the wrong-note
semitone) exactly as it does now — biome sets the colour, Ri sets the pressure.

---

## Suggested phasing (ship in increments, each self-contained)

- **P1 — Music modes (no new art).** Add `musicForRegion` + the mode table for
  the **six existing** biomes. Biggest feel-per-line change; ships alone.
- **P2 — Six new biomes.** Palette rows + ambience ids + their music modes. The
  road visibly changes more often.
- **P3 — Bestiary wave 1 (early 20).** Bamboo/Paddies/Village/Market species.
- **P4 — Bestiary wave 2 (mid 20).** Shrine/Snow/Aokigahara/Sanzu species.
- **P5 — Bestiary wave 3 + new bosses (final 10).** The mini-wardens and the
  Muken capstone (Yatō), each measured against the prestige harness.
- **P6 — Register/lore + i18n pass** for everything new (navigable strings only;
  narrative stays written English per the existing i18n scope decision).

Every wave: `tsc -b` clean, the bestiary distinctness + animation test green (no
two species share a silhouette, none renders static), and the economy harness
unchanged.
