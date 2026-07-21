# 05 — The Desktop

> *"I don't want just a browser game."*

HYAKKI ships as a **real application**: its own window, its own icon, an installer, and a
tray presence so the Parade keeps marching when it is not in front of you.

---

## Tauri, not Electron

| | Tauri | Electron |
|---|---|---|
| Installer size | **~4 MB** | ~85 MB |
| Memory | ~40 MB | ~200 MB |
| Webview | the OS's own (WebView2 on Windows) | a bundled Chromium |
| Build | Rust toolchain + the existing `dist/` | Node, bundled runtime |

The game is already a static bundle with **zero external requests** and a Content-Security
sandbox it never needed to break. That is exactly the shape Tauri wants. The existing
`vite build` output is the app; nothing in `src/` has to change.

Odysync on this machine is already Tauri, so the toolchain is proven here.

---

## What being an application actually buys

These are the reasons, not the vibes:

1. **It keeps running.** The wall-clock loop already survives backgrounding, but a browser
   tab gets closed by accident and throttled to once a minute. A tray app with its window
   hidden runs at full rate. For an idle game this is the whole argument.
2. **The save stops living in a website's storage.** `localStorage` is wiped by "clear
   browsing data" — which people do routinely, and which would eat 200 hours. The desktop
   build writes a real file to the app data directory, with the rolling backups next to it.
3. **A window with no browser in it.** No tab strip, no URL bar, no favicon. Custom
   title bar, ink-black, `decorations: false`. The frame stops being someone else's product.
4. **It is a thing you own.** An icon, a Start Menu entry, an installer with your name on it.
5. **Native notifications, sparingly.** One case only: *the Parade has stalled for an hour*.
   Never "come back and play". Off by default.

---

## Structure

```
hyakki/
├─ src/                 unchanged — the game
├─ src-tauri/
│  ├─ Cargo.toml
│  ├─ tauri.conf.json
│  ├─ icons/            generated from one 1024px source
│  └─ src/
│     ├─ main.rs        window, tray, single-instance
│     └─ save.rs        read/write the save file + backups
└─ dist/                vite output, embedded in the binary
```

## Window

```jsonc
{
  "windows": [{
    "title": "百鬼",
    "width": 1180, "height": 780,
    "minWidth": 900, "minHeight": 620,
    "decorations": false,          // our own title bar, in the game's own type
    "transparent": false,
    "theme": "Dark",
    "center": true
  }],
  "trayIcon": { "iconPath": "icons/tray.png", "tooltip": "百鬼" }
}
```

**Tray menu:** Show · Ri (live, disabled label) · Pause the Parade · Quit.
Closing the window **hides to tray** and keeps simulating. Quit is explicit, and it saves
first.

## Save, properly

A small Rust side is worth it here:

```rust
#[tauri::command] fn load_save() -> Option<String>
#[tauri::command] fn write_save(blob: String) -> Result<(), String>
#[tauri::command] fn save_path() -> String   // shown in Settings
```

Written to `%APPDATA%/hyakki/save.dat` (and the XDG/Application Support equivalents), with
`save.bak0..2` beside it. The web build keeps using `localStorage`; **the storage layer picks
one at startup**, so `src/save/storage.ts` grows a single branch and nothing else changes.

Settings gains **"Show the save file"**, which opens the folder. A 200-hour save should be a
file you can see, copy and back up.

## Icon

Generated, like everything else: a single sigil at symmetry 12 — a King's ring — rendered to
1024px, then down-sampled. The tray icon is the same mark at symmetry 3, monochrome washi,
so it reads at 16px.

## Build

```bash
npm run build          # vite -> dist/
npm run tauri build    # -> src-tauri/target/release/bundle/
```

Produces `HYAKKI_0.1.0_x64-setup.exe` (NSIS) and an MSI. Per the standing rule on this
machine: **always hand over the release installer, never the debug binary.**

Unsigned for now — Windows SmartScreen will warn on first run. Signing needs a certificate
and is a separate decision.

## What this does not change

The web build stays. `npm run dev` remains the fast path for development, and the same
`dist/` is deployable if that is ever wanted. Tauri is an additional target, not a
replacement — and the game must keep working with no Tauri APIs present at all.
