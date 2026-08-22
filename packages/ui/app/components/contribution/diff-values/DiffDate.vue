<script setup lang="ts">
import { isoToFuzzy, type FuzzyDate } from '@hayasedb/domain'

const props = defineProps<{ value: unknown }>()

const text = computed(() => {
  const value = props.value
  if (value && typeof value === 'object' && 'year' in value) {
    return formatAnimeDate(value as FuzzyDate) ?? ''
  }
  if (typeof value === 'string') {
    const parsed = isoToFuzzy(value)
    if (Number.isFinite(parsed.year)) {
      return formatAnimeDate(parsed) ?? value
    }
    return value
  }
  return String(value)
})
</script>

<template>
  <span class="wrap-break-word">{{ text }}</span>
</template>
