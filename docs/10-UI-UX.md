# 10 — UI & Screens

## Layout principle

**One screen. Everything else is a drawer over it.** The Column is always running behind whatever you're doing, and you can always see it. No page navigation, no loading, no context loss.

---

## The main view (desktop, ≥1024px)

```
┌────────────────────────────────────────────────────────────────────────┐
│  M Y R I A D                                   #47 · HOPLITE · ⚙       │  ← 44px bar
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                            R A N K   2 1 4                             │  ← the number.
│                          ───────────────────                           │     48px mono.
│                            Thin Refusal                                │     centered.
│                                                                        │
│                                                                        │
│        ⬡                                              ⬢                │  ← two sigils
│      (you)                                        (enemy)              │     180px each
│  ████████████░░░░  84%                      ████████░░░░░░░░  61%      │
│  ▰▰▰▰▰▰▱▱▱▱ RESOLVE                                     +1,204 ⬤       │  ← dmg numbers
│                                                                        │
│                                                                        │
├──────────────────────────┬─────────────────────────────────────────────┤
│  BONE   14,203  ⬤        │  REINFORCE   L12    ·  1,940  ⬤             │
│  ASH     8,421  ◈        │  STAND FAST  L9     ·  1,120  ⬤             │  ← run upgrades
│  NAMES       6  ✦        │  WHET        L4     ·  3,880  ⬤             │     always visible
│  KEYS      2/3  ⌸        │  PLATE       L7     ·  2,410  ⬤             │
├──────────────────────────┴─────────────────────────────────────────────┤
│  [ THE TREE ]  [ RELICS 4/6 ]  [ DESCEND ]  [ VOWS ]  ┃  SOUND REVEILLE│
│                                                       ┃    ◈ 4,180     │  ← always shows
└────────────────────────────────────────────────────────────────────────┘     projected Ash
```

**Notes:**
- The Rank number is the largest element on screen at all times. It is the game.
- `SOUND REVEILLE` is permanently visible with a live Ash projection. Never hidden in a menu.
- Bottom-left panel of Bone upgrades reveals rows one at a time during onboarding.
- The combat log is **not** on the main screen — it's a collapsible strip along the very bottom edge (24px), expandable to 200px.

## Mobile (<768px)

Vertical stack: header → Rank → enemy sigil → your sigil → bars → currency row → a bottom tab bar with the four drawers. Combat is portrait-first. **The game must be fully playable one-handed on a phone** — it's an idle game.

---

## The drawers

Each slides up from the bottom over the main view, 80vh, with the Column still visible and running at the top.

### THE TREE
Three columns (Flesh / Iron / Rite), 5 nodes each, as vertical stacks. Each node card:
```
┌──────────────────────────────┐
│  ⬡  MEAT                L34  │
│     +12% Max HP per level    │
│     ────────────────────────  │
│     Next keystone at L50:    │
│     "Regen scales with HP"   │
│                              │
│   [ BUY  ◈ 1,240 ]  [ ×10 ]  │
└──────────────────────────────┘
```
- Buy `×1 / ×10 / ×Max` toggle, global.
- Keystones already earned show as small filled marks along the node's edge.
- A `RECANT` button (full free respec) lives at the bottom, behind one confirm.

### RELICS
Left: 6 slots as sigil frames. Right: inventory grid. Drag to equip, or click for the comparison card (see [06 — Relics](06-RELICS.md)). Sort by: DPS delta / rarity / newest. `MELT ALL BELOW [rarity]` bulk action — mandatory QoL, ships with the system.

### DESCEND
Layer picker (5 cards), Depth slider with live `Estimated clear: 71%`, then the node map. Route plotted by clicking nodes; the path highlights. `COMMIT` locks it and closes the drawer. A small persistent chip appears in the header showing the running Descent's remaining time.

### VOWS
Grid of vow cards, taken ones lit. Shows the current stacked multiplier prominently: `ASH ×11.4`. Taking or breaking a Vow requires a confirm and states plainly what it does.

---

## The Autopsy (run-end screen)

Full screen. White background — the only white screen in the game. This is deliberate: death is bright.

```

                              R A N K   2 1 4

                    You died forty seconds after
                        you stopped winning.

                    ────────────────────────────

                    deepest rank        214  (best: 231)
                    time                14m 20s
                    enemies felled      1,847
                    stands held         21
                    killed by           The Census, Rank 220

                    ────────────────────────────

                             + 4 , 1 8 0
                                 ASH

                    ────────────────────────────

                          [ SOUND REVEILLE ]

```

**Rules for this screen:**
- Never says "failed", "lost", "game over", or "try again".
- The one-line cause of death is generated from real sim data, phrased in the fiction voice. Pool of ~25 templates keyed to the actual failure mode (outscaled DPS / burst / DoT / Stand timer / erasure).
- Ash number counts up over 900ms.
- If a personal best was set, one extra line: *"Further than before."*

---

## Copy voice in UI

| Context | Register |
|---|---|
| Tooltips, stat numbers, costs | **Clinical.** "+12% Max HP per level. Next: 1,240 Ash." No flavour. |
| Buttons | **Imperative, diegetic.** `SOUND REVEILLE`, `RECANT`, `COMMIT`, `MELT`, `TAKE THE VOW` |
| Log lines | **Terse present tense.** "Bell stops." "Rank 215." "It has your gait." |
| Fragments, autopsy, empty rooms | **Full fiction voice.** Serif, slow, second person. |

Never mix registers inside one element.

---

## Onboarding, precisely

No modals. No arrows. No "click here!" The technique is **progressive revelation**: the UI starts nearly empty and elements *fade in* at the moment they become relevant, each with a one-word label and nothing else.

| Trigger | Element appears |
|---|---|
| Game start | Class select (3 options), then only: sigils, HP bars, Rank |
| First kill | Bone counter |
| 5 Bone | `REINFORCE` button |
| 20 Bone | `STAND FAST`, `WHET` |
| Rank 10 | Stand timer ring |
| First death | The Autopsy, then the Tree drawer, then `SOUND REVEILLE` |
| Reveille 3 | Relic slots |
| Reveille 25 | Standing Orders panel |
| First Interment | Descend tab, Vows tab, Names counter |

**A tutorial the player can't notice is the only good tutorial for this genre.**

---

## Accessibility (non-negotiable, ships in Phase 1)

- `prefers-reduced-motion` → no rotation, no drift, no shift transitions
- All information conveyed by colour is *also* conveyed by shape or text (rarity has both a colour and a name; damage type has a glyph)
- Minimum contrast 4.5:1 on all text against its actual background including the grain overlay
- Full keyboard navigation; every drawer reachable by number key 1-4, `Esc` closes
- A **numbers-only mode** that disables all sigils and renders combat as a text log — for low-end devices and for players who find the visuals hard to parse
- Font size scale setting (90% / 100% / 120%)
- No flashing above 3Hz, anywhere

---

## Settings

```
DISPLAY     number format (short / scientific / full)
            reduced motion            [auto | on | off]
            grain / scanlines         [on | off]
            numbers-only mode         [off | on]
            font scale                [90 100 120]
GAMEPLAY    standing orders           (configured here)
            confirm before Reveille   [on | off]
            confirm before Interment  [on]
SAVE        export save   ·   import save   ·   HARD RESET
CREDITS     
```

**Export/import is a plain base64 text blob.** It ships in Phase 0. Never trap a player's 200 hours inside one browser's localStorage.
