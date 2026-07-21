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

// ── window controls, for the custom title bar ──

type AppWindow = {
  minimize(): Promise<void>
  toggleMaximize(): Promise<void>
  hide(): Promise<void>
  startDragging(): Promise<void>
}

function appWindow(): AppWindow | null {
  const w = window as unknown as { __TAURI__?: { window?: { appWindow?: AppWindow } } }
  return w.__TAURI__?.window?.appWindow ?? null
}

export const winMinimize = () => void appWindow()?.minimize()
export const winMaximize = () => void appWindow()?.toggleMaximize()
export const winHide = () => void appWindow()?.hide()
export const winDrag = () => void appWindow()?.startDragging()
