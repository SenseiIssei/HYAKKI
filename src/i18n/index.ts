import { STRINGS, type Locale } from './strings'

export { LOCALES, type Locale } from './strings'

const KEY = 'hyakki.lang'

function detect(): Locale {
  // Guarded: this module is imported by the headless test env too, where
  // localStorage and navigator do not exist.
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
    if (stored && ['en', 'de', 'ja', 'fr', 'es'].includes(stored)) return stored as Locale
    const nav =
      typeof navigator !== 'undefined' ? (navigator.language || 'en').slice(0, 2).toLowerCase() : 'en'
    if (['de', 'ja', 'fr', 'es'].includes(nav)) return nav as Locale
  } catch {
    /* fall through to English */
  }
  return 'en'
}

let locale: Locale = detect()

export function getLocale(): Locale {
  return locale
}

export function persistLocale(l: Locale) {
  locale = l
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, l)
  } catch {
    /* memory-only if storage is unavailable */
  }
}

/**
 * Translate a key in a given locale (or the current one). English is the
 * fallback for a missing translation; the key itself is the fallback for a
 * missing key — so the UI never renders blank, only, at worst, a raw id.
 */
export function translate(key: string, l: Locale = locale): string {
  const e = STRINGS[key]
  if (!e) return key
  return e[l] ?? e.en ?? key
}
