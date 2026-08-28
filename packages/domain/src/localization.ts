export const LOCALIZATION_LOCALES = [
  'ar',
  'de',
  'en',
  'es',
  'fr',
  'it',
  'ja-Jpan',
  'ja-Latn',
  'ko',
  'nl',
  'pl',
  'pt-BR',
  'pt-PT',
  'ru',
  'tr',
  'uk',
  'zh-Hans',
  'zh-Hant',
] as const

export type LocalizationLocale = (typeof LOCALIZATION_LOCALES)[number]

const LOCALE_BY_LOWERCASE = new Map<string, LocalizationLocale>(
  LOCALIZATION_LOCALES.map((locale) => [locale.toLowerCase(), locale]),
)

export function canonicalizeLocale(
  value: string,
): LocalizationLocale | undefined {
  return LOCALE_BY_LOWERCASE.get(value.trim().toLowerCase())
}

export const LOCALIZATION_LOCALE_LABELS = {
  ar: 'Arabic',
  de: 'German',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  'ja-Jpan': 'Japanese — native script',
  'ja-Latn': 'Japanese — romanized',
  ko: 'Korean',
  nl: 'Dutch',
  pl: 'Polish',
  'pt-BR': 'Portuguese — Brazil',
  'pt-PT': 'Portuguese — Portugal',
  ru: 'Russian',
  tr: 'Turkish',
  uk: 'Ukrainian',
  'zh-Hans': 'Chinese — simplified',
  'zh-Hant': 'Chinese — traditional',
} as const satisfies Record<LocalizationLocale, string>

export const LOCALIZATION_LOCALE_OPTIONS = LOCALIZATION_LOCALES.map(
  (value) => ({ value, label: LOCALIZATION_LOCALE_LABELS[value] }),
)
