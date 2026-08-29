<script setup lang="ts">
import {
  LOCALIZATION_LOCALE_LABELS,
  type LocalizationLocale,
} from '@hayasedb/domain'

const props = defineProps<{ value: unknown }>()

const localeLabel = (locale: string) =>
  LOCALIZATION_LOCALE_LABELS[locale as LocalizationLocale] ?? locale

const items = computed(() => {
  if (!Array.isArray(props.value)) return []
  return props.value.flatMap((value) => {
    if (!value || typeof value !== 'object') return []
    const item = value as Record<string, unknown>
    if (typeof item.locale !== 'string' || typeof item.title !== 'string') {
      return []
    }
    return [
      {
        locale: item.locale,
        title: item.title,
        original: item.original === true,
      },
    ]
  })
})
</script>

<template>
  <span class="flex flex-col gap-1">
    <span v-for="item in items" :key="item.locale" class="flex gap-2">
      <UBadge
        :label="
          item.original
            ? `${localeLabel(item.locale)} · original`
            : localeLabel(item.locale)
        "
        color="neutral"
        variant="subtle"
        size="sm"
        class="shrink-0"
      />
      <span class="wrap-break-word">{{ item.title }}</span>
    </span>
  </span>
</template>
