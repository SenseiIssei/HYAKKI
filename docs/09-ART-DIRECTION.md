# 09 — Art Direction

**Zero image assets ship with this game.** Everything is SVG generated from a seed at runtime.

---

## Palette

```css
--void:        #0B0B0F;   /* background, everywhere */
--void-lift:   #14141A;   /* panels */
--void-edge:   #1F1F28;   /* borders, 1px */
--bone:        #E8E2D4;   /* primary text, primary strokes */
--bone-dim:    #9A9488;   /* secondary text */
--ash:         #5C5A55;   /* disabled, dividers */
--blood:       #B4232A;   /* damage, danger, Named rarity */
--gold:        #C9A227;   /* Wardens, Myth rarity, prestige */
--ichor:       #3FA7A0;   /* True Name rarity, healing, Ichor currency */
--nothing:     transparent; /* the Nothing family. Literally. */
```

Five colours plus black and bone. **Nothing else is allowed.** No greens, no purples, no gradients between hues (only within a hue, to black).

**Light mode:** exists, inverts void↔bone, keeps accents. Layer IV (The Choir) forces it temporarily and that should feel *wrong*.

---

## The sigil generator — full spec

This is the core visual system. One function, used for every entity in the game.

```ts
type SigilParams = {
  seed: number
  symmetry: number      // 1-12 — rotational order
  rings: number         // 1-4 concentric structural rings
  strokeWeight: number  // 0.5-6
  density: number       // 0-1, how many marks per sector
  coreFill: 'solid' | 'hollow' | 'negative' | 'none'
  jitter: number        // 0-1, how irregular
  openness: number      // 0-1, likelihood strokes fail to close
  palette: [stroke, accent]
}

function sigil(p: SigilParams): SVGElement
```

**Algorithm:**
1. Seed `mulberry32(p.seed)`.
2. Work in a 100×100 viewBox, origin centre.
3. For each ring `r` at radius `R = 15 + 30 * (r / rings)`:
   - Generate `ceil(density * 5)` **marks** in the first sector (angle `0 → 2π/symmetry`).
   - A mark is one of: line (radial), arc, chord, dot, forked line, hook. Weighted by `density` and `jitter`.
   - Mark endpoints get `± jitter * 8` positional noise.
   - With probability `openness`, truncate the mark to 60-90% length (it doesn't close).
4. **Rotate-copy** the sector `symmetry` times around the origin. This is what makes generated shapes read as *designed* rather than random — bilateral/radial symmetry is the entire trick.
5. Draw the core per `coreFill`:
   - `solid` — filled circle r=8
   - `hollow` — stroked circle r=8
   - `negative` — a circle punched out with a mask, showing the page through the sigil
   - `none` — nothing
6. Emit as `<path>` elements with `vector-effect="non-scaling-stroke"`.

**Cost:** one sigil ≈ 30-90 path commands. Cache by seed in a `Map`. Rendering 12 on screen is trivial.

### Family presets

| Entity | symmetry | rings | stroke | density | core | jitter | openness |
|---|---|---|---|---|---|---|---|
| Chaff | 3-4 | 1-2 | 0.8 | 0.3 | none | 0.5 | 0.6 |
| Organs | 6-8 | 2-3 | 2.5 | 0.8 | solid | 0.2 | 0.1 |
| Returned | 2 | 2 | 1.4 | 0.5 | hollow | 0.3 | 0.4 |
| Warden | 12 | 4 | 3.5 | 0.9 | solid + gold ring | 0.05 | 0.0 |
| Nothing | 5 | 3 | 0 | 0.7 | negative | 0.4 | 0.8 |
| Soldier (you) | class-defined | 2 | 2.0 | 0.5 | class-defined | 0.15 | 0.2 |
| Relic | 4-6 | 1-2 | 1.2 | 0.6 | varies by rarity | 0.4 | 0.3 |

**Rank tinting:** as Rank climbs, lerp stroke colour `bone → blood` over Ranks 1-500, then `blood → gold` to 5000, then desaturate toward `nothing`. The player watches the world drain of colour as they descend, without a single asset.

---

## Motion

Everything moves slowly. Nothing bounces. No easing curve is ever springy.

| Element | Motion |
|---|---|
| Sigil idle | Slow rotation, 0.2-0.6°/s, direction by seed parity. Scale breathe ±2% over 4s. |
| Taking a hit | 90ms jitter offset, then settle. Stroke flashes to `--blood` for 120ms. |
| Death | Paths detach and fall with slight rotation, opacity → 0 over 600ms. **Never a puff or a pop.** |
| Signature firing | The sigil's rings counter-rotate and lock; a single white ring expands outward past the frame. |
| Damage numbers | Rise 24px over 700ms, `ease-out`, fade from full to 0 in the last 40%. Monospace. |
| Rank advance | The whole scene shifts left 40px and the new enemy enters from the right. 400ms. |
| Reveille | Screen fills with `--bone` (not black — white), holds 800ms, fades to the Mouth. |
| Background | A very slow vertical drift of faint marks, 1-2px, 30s to cross. Suggests you are moving. |

**Reduced motion:** honour `prefers-reduced-motion`. Kill rotation and drift, keep damage numbers and hit flashes (they carry information).

---

## Typography

| Role | Face | Notes |
|---|---|---|
| Display / lore / fragments | **EB Garamond** or **Cormorant Garamond** | serif, generous line height (1.7), max 62ch |
| Numbers, stats, damage | **JetBrains Mono** | tabular figures mandatory (`font-variant-numeric: tabular-nums`) |
| UI labels, buttons | **Inter** (or system) uppercase, `letter-spacing: 0.14em`, 11-12px | |
| The title | EB Garamond, uppercase, `letter-spacing: 0.5em` | `M Y R I A D` |

Self-host the fonts (subset, woff2). No CDN — the game must work fully offline.

---

## Texture & atmosphere

Three overlays, all CSS/SVG, all cheap:

1. **Grain** — an SVG `feTurbulence` filter baked once to a tiling PNG data-URI, `opacity: 0.035`, `mix-blend-mode: overlay`, fixed to viewport. Non-animated (animated grain is nauseating and expensive).
2. **Vignette** — a radial gradient, `rgba(0,0,0,0.55)` at edges. Tightens by 15% during Stands.
3. **Scanline / weave** — 1px horizontal lines at 3% opacity, 3px pitch. Optional, toggleable.

**No bloom. No particles. No screen shake beyond the 90ms hit jitter.** The restraint *is* the style.

---

## The one visual rule

> If a player screenshots any single frame of this game, it should be legible as a woodcut. Black, bone, one accent, symmetric shapes, and a lot of numbers.

Any effect that would break that in a still frame doesn't ship.
