import { en, type TranslationKey } from './locales/en.js'
import { fr } from './locales/fr.js'

type LocaleMap = Record<TranslationKey, string>

function detectLocale(): string {
  const raw = process.env['LC_ALL'] ?? process.env['LC_MESSAGES'] ?? process.env['LANG'] ?? 'en'
  return raw.slice(0, 2).toLowerCase()
}

const locales: Record<string, LocaleMap> = { en, fr }

const locale = detectLocale()
const translations: LocaleMap = locales[locale] ?? en

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let str: string = translations[key] ?? en[key]
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return str
}
