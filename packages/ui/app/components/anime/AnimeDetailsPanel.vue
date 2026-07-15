<script setup lang="ts">
import type { AnimeDetail } from '@hayasedb/contract'

interface PanelRow {
  label: string
  value: string
  class?: string
}

const props = defineProps<{
  anime: Pick<
    AnimeDetail,
    'format' | 'status' | 'startDate' | 'endDate' | 'titleRomaji'
  >
  genres?: { id: string; name: string; to: string }[]
}>()

const rows = computed<PanelRow[]>(() => {
  const entries: PanelRow[] = []
  const format = animeFormatLabel(props.anime.format)
  if (format) entries.push({ label: 'Format', value: format })
  const status = animeStatusLabel(props.anime.status)
  if (status) {
    entries.push({
      label: 'Status',
      value: status,
      class: animeStatusTextClass(props.anime.status),
    })
  }
  const released = formatAnimeDateRange(
    props.anime.startDate,
    props.anime.endDate,
  )
  if (released) entries.push({ label: 'Released', value: released })
  if (props.anime.titleRomaji) {
    entries.push({ label: 'Romaji', value: props.anime.titleRomaji })
  }
  return entries
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UCard
      v-if="rows.length"
      variant="soft"
      :ui="{ root: 'bg-elevated', body: 'p-4 sm:p-4' }"
    >
      <dl class="flex flex-col gap-3">
        <div v-for="row in rows" :key="row.label" class="flex flex-col gap-0.5">
          <dt class="text-muted text-xs">{{ row.label }}</dt>
          <dd
            class="text-sm font-medium break-words"
            :class="row.class ?? 'text-highlighted'"
          >
            {{ row.value }}
          </dd>
        </div>
      </dl>
    </UCard>

    <div v-if="genres?.length" class="flex flex-col gap-2">
      <span class="text-muted text-xs">Genres</span>
      <ul class="flex flex-col gap-1.5">
        <li v-for="genre in genres" :key="genre.id">
          <UButton
            :to="genre.to"
            :label="genre.name"
            color="neutral"
            variant="soft"
            size="sm"
            block
            class="justify-start rounded-lg"
          />
        </li>
      </ul>
    </div>
  </div>
</template>
