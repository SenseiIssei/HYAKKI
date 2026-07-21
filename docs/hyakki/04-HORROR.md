# 04 — Horror

MYRIAD was *unsettling*. HYAKKI has to be **frightening**, and that is a different craft.

---

## The four rules

### 1. The horror is procedural, not decorative
Japanese ghost stories rarely turn on a monster appearing. They turn on **procedure
continuing**: the bureaucracy of the afterlife, the register that already has your name, the
oni who are simply on shift. Nothing here hates you. That is the frightening part.

The scariest line in the game should be a clerk being polite.

### 2. Wrongness before threat
A yūrei is disturbing before it is dangerous — the hair, the missing feet, the way it is
*facing you already*. Every enemy gets one wrongness that lands before any damage does:

- **Yūrei have no feet.** The sigil's lower third simply isn't drawn.
- **Oni do not look at you.** Their sigil's core faces away and never rotates toward you.
- **Mu is drawn by not drawing.** It is a hole in the grain, and the background shows through.
- **The Kings do not move at all.** No idle rotation, no breathing. Stillness among all that drift.

### 3. Silence is the instrument
The drone is the floor. **Take it away and the room gets louder.** A Judgment begins by
*cutting the drone entirely* for 800ms before the bell. Nothing in the mix is scarier than
its sudden absence.

### 4. Never explain
No bestiary. No "the karakasa is a type of yōkai". They are present, and everyone behaves as
though this is ordinary.

---

## Palette

Away from bone-and-blood toward **ink, paper, lacquer and rot**.

```css
--sumi:      #0A0908;  /* ink black — background */
--sumi-lift: #14110F;  /* panels */
--sumi-edge: #221C18;  /* 1px borders */
--washi:     #E4DCCB;  /* paper — primary text and strokes */
--washi-dim: #8E8577;  /* secondary */
--hai:       #55504A;  /* ash grey — disabled */
--shu:       #C1372B;  /* vermilion — torii, seals, danger */
--kin:       #B8912F;  /* old gold — the Kings, the Named */
--aoi:       #46707A;  /* dead blue-green — yūrei, Mu, cold */
--kegare:    #4B3A52;  /* a bruised purple, only for defilement */
```

Vermilion is the key change. It is the colour of **torii gates and shrine seals** — a colour
that in this tradition means *a boundary, warded*. Using it for danger is not decoration; it
is the world telling you where the line is.

## Typography

| Role | Face |
|---|---|
| Kanji / display | **Noto Serif JP** (self-hosted, subset to the ~180 glyphs we use) |
| Body / lore | **EB Garamond** — kept; it sits with Noto Serif JP surprisingly well |
| Numbers | **JetBrains Mono**, tabular |
| Labels | Inter, uppercase, wide tracking |

Kanji are set **large and sparse** — a single 百 behind the Ri counter at 8% opacity, the
size of the panel. Never small decorative kanji; that reads as a menu, not a world.

## Texture

Grain becomes **washi fibre**: the same SVG turbulence, but stretched anisotropically so it
reads as paper grain rather than film noise. Vignette warms slightly at the edges — lamplight
on paper, not a camera.

**New: the drift becomes the Parade.** The faint vertical marks that scroll behind everything
become faint *sigil fragments* — pieces of other walkers, moving past you in the procession,
always downward, always slightly too slow.

## Sigils

Generator unchanged. Parameters and post-processing move:

| | MYRIAD | HYAKKI |
|---|---|---|
| Stroke | even weight | **brush-like**: `stroke-linecap: square`, width varied 0.6×–1.6× along the path via 3 stacked paths at different opacities |
| Symmetry | strict | Kings stay strict; yūrei break it — one sector drawn at 92% scale, so it never quite closes |
| Feet | n/a | yūrei: bottom third of the viewBox masked out |
| Colour | rank-tinted | tinted by **Kegare**, not Rank — the world discolours as *you* do |

## Motion

- **The Kings do not move.** Everything else drifts; they are still. It is deeply wrong.
- **Judgment onset:** drone cuts, vignette closes 15%, one vermilion horizontal rule draws
  across the screen in 400ms — a brush stroke, a boundary.
- **Yūrei approach** by *scaling up slightly* rather than sliding in. They were always there.
- **Mu** does not animate at all. It is a hole. Holes do not move.

## The riverbed

The reset screen replaces MYRIAD's white Autopsy. It is the game's best image and it should
be the best screen:

```

                         Ri 214

              Your tower was eleven stones.

                    ● ● ● ● ● ● ● ● ● ● ●
                    ─────────────────────

              It is nothing now. Begin.

                    ＋ 4,180  石

                 [ STACK THE STONES ]

```

The stones **animate falling** as the screen opens — eleven small marks dropping and
scattering, 600ms, no bounce. Then the Ishi count rises. Then the button.

Not white. **Wet grey** — `#6E6A63`, the colour of river stones — which is a colder shock
after the ink-black of the Parade than white would be.
