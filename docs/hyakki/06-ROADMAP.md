# 06 — Roadmap

Five phases. Each has a definition of done you can watch happen. The engine is not touched
until Phase D, and even then only additively.

---

## Phase A — THE NAME

The project becomes HYAKKI.

- [ ] Rename the folder, package, window title, wordmark
- [ ] The new palette, in full
- [ ] Noto Serif JP self-hosted and subset
- [ ] The washi grain and the warm vignette
- [ ] Wordmark: 百鬼, with `HYAKKI` beneath it in wide tracking

**DoD:** it is unmistakably a different game at a glance, before a single enemy is renamed.

---

## Phase B — THE WORLD

Every string in the game, replaced. No new systems.

- [ ] The glossary applied everywhere — currencies, actions, screens, buttons
- [ ] The Ten Kings replace the Wardens, with their real signatures
- [ ] The families: Kozō, Oni, Yūrei, Mu — and the yūrei subtypes by how each kage died
- [ ] Classes renamed and re-fictioned; Ins replace Signatures
- [ ] Tsukumogami: age tiers, 12 Named, 6 Resentful
- [ ] The Eight Hot Hells replace the Layers
- [ ] The riverbed replaces the Autopsy, with the falling stones
- [ ] All 30 Kaidan rewritten as ghost stories; the Register's observations rewritten
- [ ] Sigil parameter changes: brush strokes, no feet on yūrei, still Kings, negative Mu

**DoD:** a player who has never seen MYRIAD would never guess it was ever Greek. All 111
tests still pass, because none of them test a string that matters.

---

## Phase C — THE APPLICATION

- [ ] `src-tauri/` scaffold, Rust toolchain confirmed
- [ ] Custom title bar, ink-black, no decorations
- [ ] Tray: show / Ri / pause / quit, and close-hides-to-tray
- [ ] The save moves to a real file, with backups, and a storage-layer branch
- [ ] "Show the save file" in Settings
- [ ] Generated icons at every size
- [ ] `npm run tauri build` → a signed-off installer on the Desktop

**DoD:** you double-click an icon, a black window opens with no browser in it, and closing it
does not stop the Parade.

---

## Phase D — THE NEW MECHANICS

The two things the folklore demands that MYRIAD had no equivalent for.

- [ ] **Kegare** 穢れ: accumulation, thresholds, and the world discolouring as you do
- [ ] **Ofuda** 御札: four wards, drops, the pre-walk loadout of up to three
- [ ] Kegare tints the sigils instead of Rank
- [ ] Balance harness for both; the compounding test must still hold

**DoD:** a defiled walk *looks and behaves* different from a clean one, and the harness says
the economy still compounds.

---

## Phase E — THE HUNDRED

- [ ] The Archive becomes Hyakumonogatari: 100 candle slots, snuffing, darkening
- [ ] The remaining 70 Kaidan written
- [ ] The hundredth story, and what arrives
- [ ] Audio re-voiced: the drone cutting before a Judgment; a bell that is a real *bonshō*
      profile rather than a generic struck bell

**DoD:** someone reads the hundredth story at two in the morning and puts the laptop down.

---

## Sequencing

**A and B are the whole pivot** — after them it is a Japanese horror game that happens to
have a very well-tested engine underneath. C makes it a product. D and E make it *more* than
MYRIAD was, rather than a re-skin.

If only A–C get finished, that is a complete, shippable thing.

## Risks, honestly

| Risk | Mitigation |
|---|---|
| The Rust toolchain is a real dependency and can eat an afternoon on Windows | Odysync already builds Tauri on this machine — proven |
| Font subsetting Noto Serif JP is fiddly; a full JP font is ~5 MB | Subset to the exact glyph set we author; target under 120 KB |
| 70 more Kaidan is a lot of writing, and bad ones are worse than none | Ship at 30, count honestly, add in batches |
| Kegare could wreck a tuned economy | It is a *modifier* on existing curves, gated behind the harness |
| Treating a living tradition as set dressing | The rules in [01](01-LORE.md): faithful shapes, no deity as loot, Jizō never an obstacle |
