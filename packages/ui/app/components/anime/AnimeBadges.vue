<script setup lang="ts">
import type { AnimeFormat, AnimeStatus } from '@hayasedb/domain'

withDefaults(
  defineProps<{
    format?: AnimeFormat | null
    status?: AnimeStatus | null
    size?: 'sm' | 'md'
  }>(),
  { format: null, status: null, size: 'sm' },
)
</script>

<template>
  <div class="flex flex-wrap items-center gap-1">
    <UBadge
      v-if="animeFormatLabel(format)"
      :label="animeFormatLabel(format)!"
      :size="size"
      color="neutral"
      variant="subtle"
    />
    <UBadge
      v-if="animeStatusLabel(status)"
      :label="animeStatusLabel(status)!"
      :size="size"
      :color="animeStatusColor(status)"
      variant="subtle"
    />
  </div>
</template>
