import {
  LOCALIZATION_LOCALE_LABELS,
  LOCALIZATION_LOCALE_OPTIONS,
  type LocalizationLocale,
} from '@hayasedb/domain'

interface Translation {
  locale: LocalizationLocale
}

interface UseTranslationEditorOptions<T extends Translation> {
  translations: Ref<T[]>
  create: (locale: LocalizationLocale) => T
  fields: readonly string[]
  path?: string
  errors?: Ref<{ name?: string }[] | undefined>
}

export function useTranslationEditor<T extends Translation>(
  options: UseTranslationEditorOptions<T>,
) {
  const {
    translations,
    create,
    fields,
    path = 'translations',
    errors,
  } = options

  const activeIndex = ref(0)

  watch(
    () => translations.value.length,
    (length) => {
      if (activeIndex.value > length - 1)
        activeIndex.value = Math.max(0, length - 1)
    },
  )

  const active = computed(() => translations.value[activeIndex.value])

  const activeLocale = computed({
    get: () => active.value?.locale,
    set: (locale?: LocalizationLocale) => {
      const index = translations.value.findIndex(
        (item) => item.locale === locale,
      )
      if (index >= 0) activeIndex.value = index
    },
  })

  const localeLabel = (locale: LocalizationLocale) =>
    LOCALIZATION_LOCALE_LABELS[locale]

  const usedLocales = computed(() =>
    translations.value.map((item) => item.locale),
  )

  const remainingOptions = computed(() => {
    const used = new Set(usedLocales.value)
    return LOCALIZATION_LOCALE_OPTIONS.filter(
      (option) => !used.has(option.value),
    )
  })

  const canAdd = computed(() => remainingOptions.value.length > 0)
  const canRemove = computed(() => translations.value.length > 1)

  const invalidIndexes = computed(() => {
    const names =
      errors?.value?.map((error) => error.name).filter(Boolean) ?? []
    if (names.length === 0) return new Set<number>()
    const invalid = new Set<number>()
    for (const name of names) {
      for (const field of fields) {
        const match = name!.match(new RegExp(`^${path}\\.(\\d+)\\.${field}$`))
        if (match?.[1]) invalid.add(Number(match[1]))
      }
    }
    return invalid
  })

  const switcherItems = computed(() =>
    translations.value.map((translation, index) => ({
      value: translation.locale,
      label: localeLabel(translation.locale),
      invalid: invalidIndexes.value.has(index),
    })),
  )

  function add(locale: LocalizationLocale) {
    translations.value.push(create(locale))
    activeIndex.value = translations.value.length - 1
  }

  function removeActive() {
    if (!canRemove.value) return
    const index = activeIndex.value
    translations.value.splice(index, 1)
    activeIndex.value = Math.max(
      0,
      Math.min(index, translations.value.length - 1),
    )
  }

  return {
    activeIndex,
    active,
    activeLocale,
    switcherItems,
    remainingOptions,
    invalidIndexes,
    usedLocales,
    canAdd,
    canRemove,
    localeLabel,
    add,
    removeActive,
  }
}
