<script setup lang="ts">
import type { EpisodeDraft } from '#imports'

const props = withDefaults(
  defineProps<{
    episodes: EpisodeDraft[]
    startIndex?: number
    context?: string
  }>(),
  { startIndex: 0, context: undefined },
)

const emit = defineEmits<{ close: [boolean] }>()

const activeIndex = ref(
  Math.min(
    Math.max(props.startIndex, 0),
    Math.max(props.episodes.length - 1, 0),
  ),
)

const active = computed(() => props.episodes[activeIndex.value])

const canPrevious = computed(() => activeIndex.value > 0)
const canNext = computed(() => activeIndex.value < props.episodes.length - 1)

function previous() {
  if (canPrevious.value) activeIndex.value -= 1
}

function next() {
  if (canNext.value) activeIndex.value += 1
}

const marker = computed(() => {
  const episode = active.value
  if (!episode) return ''
  if (episode.type === 'REGULAR') return `Episode ${episode.number ?? '–'}`
  const label = ANIME_EPISODE_TYPE_LABELS[episode.type]
  return episode.number ? `${label} ${episode.number}` : label
})

const title = computed(() =>
  active.value ? preferredStructureTitle(active.value.translations) : null,
)

const description = computed(() =>
  [props.context, `${activeIndex.value + 1} of ${props.episodes.length}`]
    .filter(Boolean)
    .join(' · '),
)
</script>

<template>
  <USlideover
    :title="title || marker"
    :description="description"
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #body>
      <AnimeEpisodeFields v-if="active" :key="active.id" :episode="active" />
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <UButton
            type="button"
            icon="i-lucide-chevron-left"
            label="Previous"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="!canPrevious"
            @click="previous"
          />
          <UButton
            type="button"
            icon="i-lucide-chevron-right"
            label="Next"
            trailing
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="!canNext"
            @click="next"
          />
        </div>

        <UButton
          type="button"
          label="Done"
          color="neutral"
          size="sm"
          @click="emit('close', true)"
        />
      </div>
    </template>
  </USlideover>
</template>
