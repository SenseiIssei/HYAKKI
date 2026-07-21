# HYAKKI 百鬼 — The Turning

> *A hundred demons. Which is to say: too many to count.*

MYRIAD becomes **HYAKKI**. Same engine, entirely new world.

---

## Why re-theme and not rebuild

Seven phases produced a simulation that is genuinely hard to get right and is now
*measured*: an exponential Ash curve that actually compounds, a Names economy that took
two attempts to stop exploding, an offline catch-up that is accurate to 2.4%, a relic
comparison that forks the real sim, and 111 tests including design tests that fail when
balance drifts.

**None of that is Greek.** The fiction, the names, the enemies, the art and the copy are a
content layer sitting on top of it. Replacing that layer is a large job but a *safe* one —
and the folklore is a better fit for the machine than the original fiction ever was.

---

## The core insight

Japanese folklore already contains this game's structure, told better:

| The mechanic | The folklore that already is it |
|---|---|
| An endless procession you march in | **Hyakki Yagyō** — the Night Parade of One Hundred Demons |
| A world that is a god's rotting corpse | **Yomi**, and Izanami's body in it, maggot-ridden, with eight thunders growing out of her |
| Build, get destroyed, build again, forever | **Sai no Kawara** — souls stack stone towers; oni knock them down; they begin again |
| A boss every 10 ranks, ten of them | **The Ten Kings** (十王) who judge the dead, Enma among them |
| Equipment with a history and a will | **Tsukumogami** — objects that receive a soul after a hundred years of service |
| Enemies that are your own past runs | **Onryō** — the vengeful dead, returning because something was left unfinished |
| Choosing a route into danger | **Sanzu no Kawa** — the river with three crossings: bridge, ford, or torrent, by your merit |
| A currency to enter a dungeon | **Rokumonsen** (六文銭) — the six coins buried with the dead to pay the crossing |
| Collecting 100 lore fragments | **Hyakumonogatari Kaidankai** — tell one hundred ghost stories, snuff a candle after each; at the hundredth, something comes |
| A name that quiets an angry spirit | **Goryō** — wrathful ghosts placated by being enshrined and *named* |

Nothing here is a stretch. The last row is the one that matters most: MYRIAD's "Names"
mechanic — a currency that buys things numbers cannot — is *exactly* what enshrinement is
for in the actual belief system. The engine was already shaped like this.

---

## The one-sentence test, rewritten

> **You walk in a procession of demons through the corpse of a dead goddess, and every time
> you are destroyed you go back to the riverbed and stack the stones again.**

---

## What changes, what does not

### Does not change
- `src/sim/` — combat, formulas, prestige maths, offline catch-up, descent resolution
- The save system, migrations, export/import
- The balance harnesses and all 111 tests (renamed strings only)
- The procedural sigil generator — *the algorithm*. Its output changes completely.

### Changes entirely
- Every name, in every layer: currencies, actions, enemies, classes, bosses, rooms, relics
- All copy: fragments, autopsy lines, death causes, room vignettes, observations
- The art direction: palette, sigil parameters, typography, motion
- The horror register — see [04](04-HORROR.md). MYRIAD was *unsettling*. HYAKKI is meant to
  be *frightening*, which is a different craft.

### Is added
- **Kegare / defilement** — a purity axis the original had no equivalent for
- **Ofuda and wards** — consumable protections, because that is how you survive yōkai
- **The Hyakumonogatari archive** — 100 candles, and what arrives at the hundredth
- **A real desktop application** — see [05](05-DESKTOP.md)

---

## Documents

| Doc | Contents |
|---|---|
| [01 — The Lore](01-LORE.md) | The researched folklore, with sources, and exactly what we take from each |
| [02 — The Glossary](02-GLOSSARY.md) | Every renamed thing, old → new, binding |
| [03 — The Content](03-CONTENT.md) | Classes, yōkai families, the Ten Kings, tsukumogami, the hells |
| [04 — Horror](04-HORROR.md) | Art direction and the craft of actually being frightening |
| [05 — The Desktop](05-DESKTOP.md) | Tauri: a real application, not a browser tab |
| [06 — Roadmap](06-ROADMAP.md) | The order of work |
