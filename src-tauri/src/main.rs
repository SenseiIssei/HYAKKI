#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

//! 百鬼 HYAKKI — the desktop shell.
//!
//! Two things this exists for, beyond having its own window:
//!
//! 1. **Closing it does not stop the Parade.** The window hides to the tray and
//!    the simulation keeps running at full rate, which a browser tab cannot do.
//! 2. **The save is a real file.** `localStorage` is destroyed by "clear
//!    browsing data", which people do routinely, and which would eat 200 hours.

use std::fs;
use std::path::PathBuf;
use tauri::{
    AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem,
};

const BACKUPS: usize = 3;

fn save_dir(app: &AppHandle) -> PathBuf {
    let dir = app
        .path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| PathBuf::from("."));
    let _ = fs::create_dir_all(&dir);
    dir
}

fn save_file(app: &AppHandle) -> PathBuf {
    save_dir(app).join("save.dat")
}

#[tauri::command]
fn load_save(app: AppHandle) -> Option<String> {
    let main = save_file(&app);
    if let Ok(s) = fs::read_to_string(&main) {
        if !s.trim().is_empty() {
            return Some(s);
        }
    }
    // The main file is missing or empty. Try the backups oldest-first-newest.
    for i in 0..BACKUPS {
        let bak = save_dir(&app).join(format!("save.bak{i}"));
        if let Ok(s) = fs::read_to_string(&bak) {
            if !s.trim().is_empty() {
                return Some(s);
            }
        }
    }
    None
}

#[tauri::command]
fn write_save(app: AppHandle, blob: String) -> Result<(), String> {
    let dir = save_dir(&app);
    let main = dir.join("save.dat");

    // Rotate the previous save down one slot before overwriting.
    for i in (1..BACKUPS).rev() {
        let from = dir.join(format!("save.bak{}", i - 1));
        let to = dir.join(format!("save.bak{i}"));
        let _ = fs::copy(&from, &to);
    }
    let _ = fs::copy(&main, dir.join("save.bak0"));

    // Write to a temp file and rename, so a crash mid-write cannot leave a
    // half-written save where the real one was.
    let tmp = dir.join("save.tmp");
    fs::write(&tmp, blob).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &main).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_path(app: AppHandle) -> String {
    save_file(&app).to_string_lossy().to_string()
}

/// Window controls go through Rust, not the JS window API.
///
/// `withGlobalTauri: false` still injects `__TAURI_INVOKE__` — which is why
/// saving worked — but it does NOT inject `window.__TAURI__.window`, so the
/// title-bar buttons rendered and silently did nothing. invoke is the reliable
/// channel, so the buttons use it.
#[tauri::command]
fn win_minimize(window: tauri::Window) {
    let _ = window.minimize();
}

#[tauri::command]
fn win_toggle_maximize(window: tauri::Window) {
    match window.is_maximized() {
        Ok(true) => {
            let _ = window.unmaximize();
        }
        _ => {
            let _ = window.maximize();
        }
    }
}

#[tauri::command]
fn win_hide(window: tauri::Window) {
    let _ = window.hide();
}

#[tauri::command]
fn win_quit(app: AppHandle) {
    if let Some(w) = app.get_window("main") {
        let _ = w.emit("hyakki://quitting", ());
    }
    std::thread::sleep(std::time::Duration::from_millis(200));
    std::process::exit(0);
}

#[tauri::command]
fn win_start_drag(window: tauri::Window) {
    let _ = window.start_dragging();
}

#[tauri::command]
fn reveal_save(app: AppHandle) {
    let dir = save_dir(&app);
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("explorer").arg(dir).spawn();
    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("open").arg(dir).spawn();
    #[cfg(target_os = "linux")]
    let _ = std::process::Command::new("xdg-open").arg(dir).spawn();
}

fn tray() -> SystemTray {
    let menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show", "Show"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit", "Stop walking"));
    SystemTray::new().with_menu(menu)
}

fn main() {
    tauri::Builder::default()
        .system_tray(tray())
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::DoubleClick { .. } => {
                if let Some(w) = app.get_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "show" => {
                    if let Some(w) = app.get_window("main") {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
                "quit" => {
                    // The front end saves on beforeunload; give it the chance.
                    if let Some(w) = app.get_window("main") {
                        let _ = w.emit("hyakki://quitting", ());
                    }
                    std::thread::sleep(std::time::Duration::from_millis(250));
                    std::process::exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .on_window_event(|event| {
            // Closing hides. The Parade does not stop because you looked away.
            if let tauri::WindowEvent::CloseRequested { api, .. } = event.event() {
                let _ = event.window().hide();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            load_save,
            write_save,
            save_path,
            reveal_save,
            win_minimize,
            win_toggle_maximize,
            win_hide,
            win_quit,
            win_start_drag
        ])
        .run(tauri::generate_context!())
        .expect("hyakki failed to start");
}
