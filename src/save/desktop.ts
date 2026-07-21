/**
 * The desktop storage backend.
 *
 * The game must keep working with no Tauri APIs present at all — the web build
 * is not a second-class target. So this detects the shell at runtime and the
 * rest of the save layer never knows which one it got.
 */

type Invoke = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>

let invoke: Invoke | null = null
let checked = false

function getInvoke(): Invoke | null {
  if (checked) return invoke
  checked = true
  const w = window as unknown as {
    __TAURI__?: { invoke: Invoke }
    __TAURI_INVOKE__?: Invoke
  }
  invoke = w.__TAURI__?.invoke ?? w.__TAURI_INVOKE__ ?? null
  return invoke
}

export const isDesktop = () => getInvoke() !== null

/** Read at startup. Returns null on web, or when there is nothing saved yet. */
export async function desktopLoad(): Promise<string | null> {
  const i = getInvoke()
  if (!i) return null
  try {
    return (await i<string | null>('load_save')) ?? null
  } catch (err) {
    console.error('[hyakki] desktop load failed', err)
    return null
  }
}

/**
 * Fire-and-forget. The sim autosaves every 10s and on unload; making those
 * paths async would mean threading promises through the whole store for no
 * benefit, and a dropped write is covered by the next one plus the backups.
 */
export function desktopWrite(blob: string): void {
  const i = getInvoke()
  if (!i) return
  void i('write_save', { blob }).catch((err) =>
    console.error('[hyakki] desktop save failed', err),
  )
}

export async function desktopSavePath(): Promise<string | null> {
  const i = getInvoke()
  if (!i) return null
  try {
    return await i<string>('save_path')
  } catch {
    return null
  }
}

export function revealSave(): void {
  void getInvoke()?.('reveal_save')
}

// ── window controls ──
//
// These go through invoke, NOT `window.__TAURI__.window`. With
// `withGlobalTauri: false` the invoke bridge is injected but the JS window API
// is not, so the title-bar buttons rendered and did nothing at all.

const win = (cmd: string) => {
  const i = getInvoke()
  if (!i) return
  void i(cmd).catch((err) => console.error(`[hyakki] ${cmd} failed`, err))
}

export const winMinimize = () => win('win_minimize')
export const winMaximize = () => win('win_toggle_maximize')
export const winHide = () => win('win_hide')
export const winQuit = () => win('win_quit')
export const winDrag = () => win('win_start_drag')
