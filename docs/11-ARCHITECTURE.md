# 11 — Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| Build | **Vite** | Instant HMR; a game loop plus HMR is a joy |
| Language | **TypeScript, strict** | 200 hours of save data. Types are not optional here. |
| UI | **React 18** | Familiar from DevPanel; the UI is mostly static panels over a canvas-less SVG scene |
| State | **Zustand + immer** | Small, no boilerplate, works fine outside React (the sim needs that) |
| Big numbers | **break_infinity.js** (`Decimal`) | **From commit one.** Non-negotiable. |
| Compression | **lz-string** | Save blobs |
| Rendering | **Inline SVG**, React-rendered | ~200 nodes on screen max; React handles it. No canvas needed. |
| Tests | **Vitest** | The sim is pure — it must be tested |
| Desktop later | **Tauri** | Wraps the same build with zero code change |

**Total runtime dependencies: 3.** (`decimal`, `lz-string`, `zustand`). That's the target.

---

## The golden rule

> **`src/sim/` imports nothing from React and knows nothing about the DOM.**

The simulation is a pure function library. React subscribes to it. This gives us, for free:
- offline catch-up (run the same `step()` 400,000 times in a loop)
- the relic comparison feature (fork state, run 300 ticks, diff)
- the Descent win-probability estimate (run the route 50 times)
- headless balance scripts in Node
- deterministic, testable combat

If any of those feel hard to build later, the rule was broken.

---

## Folder layout

```
myriad/
├─ index.html
├─ vite.config.ts
├─ package.json
├─ scripts/
│  └─ balance.ts            # node: headless sim → CSV
└─ src/
   ├─ main.tsx
   ├─ sim/                  # ── PURE. NO REACT. ──
   │  ├─ types.ts           # GameState, StatBlock, Enemy, Ghost
   │  ├─ state.ts           # createInitialState, invariants
   │  ├─ formulas.ts        # every equation from doc 03
   │  ├─ stats.ts           # stat composition pipeline
   │  ├─ combat.ts          # step(state, ticks) — the core
   │  ├─ enemies.ts         # spawn(rank, seed) → Enemy
   │  ├─ ghosts.ts          # snapshot/recall past runs
   │  ├─ prestige.ts        # reveille / interment / apotheosis
   │  ├─ relics.ts          # rollRelic, compareRelic
   │  ├─ descent.ts         # map gen, route resolve
   │  ├─ offline.ts         # catchUp(state, ms) → state + report
   │  └─ rng.ts             # mulberry32, seeded everything
   ├─ content/              # ── DATA ONLY. NO LOGIC. ──
   │  ├─ balance.ts         # every tunable constant
   │  ├─ classes.ts
   │  ├─ upgrades.ts        # tree nodes + keystones
   │  ├─ relicAffixes.ts
   │  ├─ mythics.ts
   │  ├─ wardens.ts
   │  ├─ layers.ts
   │  ├─ vows.ts
   │  ├─ names.ts           # enemy name grammar pools
   │  └─ fragments.ts       # lore, keyed by unlock condition
   ├─ render/               # ── SVG GENERATION ──
   │  ├─ sigil.ts           # the generator (doc 09)
   │  ├─ sigilCache.ts
   │  └─ presets.ts
   ├─ save/
   │  ├─ serialize.ts       # Decimal ⇄ string
   │  ├─ migrate.ts         # version chain
   │  └─ storage.ts         # localStorage + export/import
   ├─ store/
   │  ├─ gameStore.ts       # zustand, holds sim state
   │  └─ uiStore.ts         # drawers, settings — never persisted with sim
   ├─ loop/
   │  └─ useGameLoop.ts     # fixed-timestep accumulator
   └─ ui/
      ├─ App.tsx
      ├─ Column.tsx         # the main combat view
      ├─ Sigil.tsx
      ├─ drawers/{Tree,Relics,Descend,Vows}.tsx
      ├─ Autopsy.tsx
      └─ atoms/{Num,Bar,Button,Card}.tsx
```

---

## The game loop

**Do not drive the sim with `requestAnimationFrame`.** rAF is not throttled in a
hidden tab — it is *suspended entirely*, and in some embedded/preview surfaces the
page reports `document.hidden === true` permanently. An idle game whose clock is
rAF silently stops being an idle game. This was found the hard way in Phase 0:
the first build looked correct and simply never advanced.

Use a `setInterval` pump with a **wall-clock accumulator**, so throttling costs
resolution but never progress:

```ts
const PUMP_MS = 50
const AWAY_THRESHOLD_MS = 5_000
let carryMs = 0
let lastWall = Date.now()

function pump() {
  const now = Date.now()
  const dt = now - lastWall
  lastWall = now

  if (dt > AWAY_THRESHOLD_MS) {
    catchUp(dt)                 // slept, froze, or backgrounded hard
  } else if (dt > 0) {
    carryMs += dt
    let ticks = Math.floor(carryMs / TICK_MS)
    carryMs -= ticks * TICK_MS
    step(state, Math.min(ticks, 400))   // cap = anti death-spiral
  }
}
setInterval(pump, PUMP_MS)
```

Background tabs throttle `setInterval` to ~1Hz, which is fine: each pump
simulates the real elapsed time rather than a fixed step.

**Never trust `Date.now()` deltas blindly** — clock changes and sleep/wake produce
garbage. Any gap over the threshold routes through `catchUp()`, which clamps to
the offline window and applies offline efficiency.

Rendering is a separate concern: bump a frame counter at 10Hz from the same pump.
CSS animations handle everything continuous, so no rAF is needed at all.

---

## Offline catch-up

```ts
catchUp(state, elapsedMs): OfflineReport
```

1. `capped = min(elapsedMs, offlineWindowMs)`
2. `efficiency = 0.70` (→ 1.0 with the VIGIL 25 keystone)
3. `ticks = floor(capped * efficiency / TICK_MS)`

### Measure, then extrapolate

Naively ticking a 96-hour window costs ~1.9s — a visible freeze on the screen the
player came back for. So the loop **really simulates one Rank, then extrapolates the
next few** from the known enemy-growth curve, then measures again:

- `ticks(r+1) ≈ ticksMeasured × (rankWeight(r+1) / rankWeight(measured))`
- health loss scales by the enemy-attack ratio over the same span
- Bone is closed-form and exact

Extrapolation inherits crit, Burn and Signature behaviour from the measurement rather
than trying to model it — that is why it stays accurate without duplicating combat.

**Anything dangerous always falls back to the real simulation:** Stands (timed, can end
the run), and any point where health is below `RISK_FLOOR` (35% of max) or is projected
to fall below it inside the span. Getting a death wrong would be unforgivable.

### Measured (`npx tsx scripts/offline.ts`)

| Window | Time | Note |
|---|---|---|
| 1h | 23ms | |
| **12h (the default window)** | **81ms** | what almost every player has |
| 96h | 65ms | clamped to the 12h window without VIGIL |
| 207h, VIGIL 80 | **1.5s** | deep-endgame worst case: 896 Reveilles of real game |

Accuracy against really simulating the same span: **depth within 2.4%**, Reveille count
within 2 over three hours. The 400ms target in the original plan holds for every
realistic window; the 207h figure is honest and only reachable with ~80 levels of VIGIL
and eight days away.

Standing Orders fire inside the loop, so multiple Reveilles happen. The **"While you
slept"** report is a designed screen, not a toast.

### Timer throttling is real and the wall clock is the answer

Chrome applies **intensive throttling** to a tab hidden for more than 5 minutes: timers
are clamped to roughly **once per minute**. Observed directly during Phase 3 testing —
the game appeared frozen for 35 seconds, then jumped.

Because every pump simulates `Date.now() - lastWall` rather than a fixed step, a 60s gap
routes straight through `catchUp` and nothing is lost. This is the same property that
makes rAF unusable and `setInterval` + wall clock correct.

---

## Save format

```ts
type SaveFile = {
  v: number                  // schema version
  t: number                  // Date.now() at save
  sim: SerializedGameState   // Decimals as strings
  ghosts: Ghost[]            // capped at 500
}
```

Pipeline: `JSON.stringify` → `LZString.compressToBase64` → `localStorage['myriad.save']`.

- **Autosave every 10s** and on `visibilitychange`, `beforeunload`, and every prestige.
- **Three rolling backup slots** (`myriad.save.bak0/1/2`), rotated hourly. Idle-game save corruption is the single worst failure mode; this is cheap insurance.
- **Migrations are a chain of pure functions**: `migrations: Record<number, (s:any)=>any>`. Never branch on version inside game logic.
- **Export/import** ships in Phase 0. A player must always be able to get their save out.
- No server, no account, no cloud sync at launch. (Optional later: a tiny endpoint on the DevPanel VPS storing the same blob keyed by a user-chosen phrase.)

---

## Decimal discipline

```ts
import Decimal from 'break_infinity.js'
```

Rules, enforced by lint + review:
1. Every currency, stat, damage value, and cost is `Decimal`. **No exceptions.**
2. Counters that will never exceed 1e15 (rank, level, count, seed, tick) stay `number`. Mixing is fine as long as the boundary is explicit.
3. Never `Number(decimal)` except at the display boundary.
4. Never compare with `<` — use `.lt()`, `.gte()`. Add an ESLint rule banning arithmetic operators on values typed `Decimal`.
5. Serialize with `.toString()`, revive with `new Decimal(str)`.

Retrofitting Decimal into a working idle game costs a full week and introduces subtle bugs everywhere. Doing it on day one costs an hour.

---

## Performance budget

| Thing | Budget |
|---|---|
| One sim tick | < 0.05 ms |
| Frame (sim + React) | < 4 ms at 60fps |
| Offline catch-up, 96h | < 400 ms |
| Sigil generation (uncached) | < 1 ms |
| Save write | < 15 ms |
| Bundle (gzipped) | < 250 KB incl. fonts |
| Cold start to playable | < 800 ms |

React re-render control: the combat view subscribes to a **throttled** slice (10Hz for numbers, 60Hz only for the damage-number layer). Everything else re-renders on event, not tick. Damage numbers live in their own component with their own local state so a floating number never re-renders the tree.

---

## Testing

| Test | What it guards |
|---|---|
| `formulas.spec` | Every equation against a table of known values |
| `combat.spec` | 10,000 ticks are deterministic given a seed |
| `save.spec` | Round-trip every version through the migration chain |
| `offline.spec` | `catchUp(1h)` ≈ 1h of real ticking, within 2% |
| `balance.spec` | TTK stays inside the target band from doc 03 §9 at Ranks 1/50/200/1000 |

That last one is a **design test**, and it's the most valuable file in the repo. When balance drifts, CI says so.
