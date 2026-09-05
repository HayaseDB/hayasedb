<script setup lang="ts">
import type { AnimeEpisode } from '@hayasedb/contract'

const props = defineProps<{ episode: AnimeEpisode }>()

const duration = computed(() =>
  formatEpisodeDuration(props.episode.durationSeconds),
)

const airDate = computed(() => {
  if (!props.episode.airDate) return null
  const parsed = new Date(`${props.episode.airDate}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return props.episode.airDate
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
})

const marker = computed(() => {
  const { number, type } = props.episode
  if (type === 'REGULAR') return number ?? '–'
  const label = ANIME_EPISODE_TYPE_LABELS[type]
  return number ? `${label} ${number}` : label
})

const title = computed(() => props.episode.title?.title ?? null)
</script>

<template>
  <li
    class="border-default flex items-start gap-3 border-b py-3 last:border-b-0"
  >
    <span
      class="bg-elevated text-toned mt-0.5 flex min-w-10 shrink-0 justify-center rounded px-2 py-1 text-xs font-medium tabular-nums"
    >
      {{ marker }}
    </span>

    <div class="min-w-0 flex-1">
      <p
        v-if="title"
        class="text-highlighted text-sm font-medium wrap-break-word"
      >
        {{ title }}
      </p>
      <p v-else class="text-muted text-sm italic">Untitled</p>

      <p
        v-if="episode.overview"
        class="text-muted mt-1 line-clamp-2 text-xs leading-relaxed"
      >
        {{ episode.overview }}
      </p>

      <div
        class="text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
      >
        <span v-if="airDate">{{ airDate }}</span>
        <span v-if="duration">{{ duration }}</span>
        <UBadge
          v-if="episode.status !== 'RELEASED'"
          :label="ANIME_EPISODE_STATUS_LABELS[episode.status]"
          :color="ANIME_EPISODE_STATUS_COLORS[episode.status]"
          variant="subtle"
          size="sm"
        />
      </div>
    </div>
  </li>
</template>
