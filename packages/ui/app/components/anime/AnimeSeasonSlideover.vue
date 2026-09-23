<script setup lang="ts">
import type { ChangeSet, SeasonDraft } from '#imports'

const props = defineProps<{
  season: SeasonDraft
  changes?: ChangeSet
}>()

const emit = defineEmits<{ close: [boolean] }>()

const heading = computed(() => {
  const kind = ANIME_SEASON_KIND_LABELS[props.season.kind]
  const title = preferredStructureTitle(props.season.translations)
  return (
    title || (props.season.number ? `${kind} ${props.season.number}` : kind)
  )
})

const count = computed(
  () => props.season.episodes.filter((episode) => !episode.removed).length,
)

const description = computed(
  () => `${count.value} ${count.value === 1 ? 'episode' : 'episodes'}`,
)
</script>

<template>
  <USlideover
    :title="heading"
    :description="description"
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #body>
      <AnimeSeasonFields :season="season" :changes="changes" />
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
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
