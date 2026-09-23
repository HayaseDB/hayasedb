<script setup lang="ts">
import { ANIME_EPISODE_FIELD_ORDER } from '@hayasedb/domain'
import type { ChangeKind, EpisodeDraft } from '#imports'

const props = withDefaults(
  defineProps<{
    episode: EpisodeDraft
    isFirst?: boolean
    isLast?: boolean
  }>(),
  { isFirst: false, isLast: false },
)

const emit = defineEmits<{
  open: []
  moveUp: []
  moveDown: []
  remove: []
}>()

const scope = useChangeScope(() => `episodes.${props.episode.id}`)

const marker = computed(() => {
  const { number, type } = props.episode
  if (type === 'REGULAR') return number ?? '–'
  const label = ANIME_EPISODE_TYPE_LABELS[type]
  return number ? `${label} ${number}` : label
})

const title = computed(() =>
  preferredStructureTitle(props.episode.translations),
)

const airDate = computed(() => formatEpisodeAirDate(props.episode.airDate))

const duration = computed(() =>
  formatEpisodeDuration(props.episode.durationSeconds),
)

const changedPaths = computed(() => {
  const fields = ANIME_EPISODE_FIELD_ORDER.filter(
    (field) => field !== 'translations' && scope.kindOf(field) !== 'unchanged',
  ).length
  const translations = props.episode.translations.filter((item) =>
    ['title', 'overview'].some(
      (field) =>
        scope.kindOf(`translations.${item.locale}.${field}`) !== 'unchanged',
    ),
  ).length
  const localeSet =
    scope.kindOf(`translations.${TRANSLATION_SET_PATH}`) !== 'unchanged' ? 1 : 0
  return fields + translations + localeSet
})

const kind = computed<ChangeKind>(() => {
  if (props.episode.isNew) return 'added'
  if (props.episode.removed) return 'removed'
  if (scope.kindOf('$state') !== 'unchanged') return 'changed'
  return changedPaths.value > 0 ? 'changed' : 'unchanged'
})

const actions = computed(() => [
  [
    {
      label: 'Edit episode',
      icon: 'i-lucide-pencil',
      onSelect: () => emit('open'),
    },
  ],
  [
    {
      label: 'Remove episode',
      icon: 'i-lucide-trash-2',
      color: 'error' as const,
      onSelect: () => emit('remove'),
    },
  ],
])
</script>

<template>
  <div
    class="border-default flex min-h-12 items-center gap-2 rounded-md border p-2"
    :data-change="kind"
    :class="CHANGE_RING_CLASS[kind]"
  >
    <button
      type="button"
      class="flex min-w-0 flex-1 items-center gap-3 text-left"
      @click="emit('open')"
    >
      <span
        class="bg-elevated text-toned flex min-w-10 shrink-0 justify-center rounded px-2 py-1 text-xs font-medium tabular-nums"
      >
        {{ marker }}
      </span>

      <span class="flex min-w-0 flex-1 flex-col">
        <span
          class="truncate text-sm"
          :class="title ? 'text-highlighted font-medium' : 'text-muted italic'"
        >
          {{ title || 'Untitled' }}
        </span>
        <span
          v-if="airDate || duration"
          class="text-muted flex items-center gap-2 text-xs"
        >
          <span v-if="airDate">{{ airDate }}</span>
          <span v-if="duration">{{ duration }}</span>
        </span>
      </span>
    </button>

    <UBadge
      v-if="episode.type !== 'REGULAR'"
      :label="ANIME_EPISODE_TYPE_LABELS[episode.type]"
      color="neutral"
      variant="subtle"
      size="sm"
      class="hidden sm:inline-flex"
    />

    <UBadge
      v-if="episode.status !== 'RELEASED'"
      :label="ANIME_EPISODE_STATUS_LABELS[episode.status]"
      :color="ANIME_EPISODE_STATUS_COLORS[episode.status]"
      variant="subtle"
      size="sm"
    />

    <UBadge
      v-if="kind === 'changed' && changedPaths > 0"
      :label="`${changedPaths} changed`"
      color="warning"
      variant="subtle"
      size="sm"
      class="hidden sm:inline-flex"
    />

    <div class="hidden items-center gap-1 sm:flex">
      <UButton
        type="button"
        icon="i-lucide-chevron-up"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        :disabled="isFirst"
        aria-label="Move episode up"
        @click="emit('moveUp')"
      />
      <UButton
        type="button"
        icon="i-lucide-chevron-down"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        :disabled="isLast"
        aria-label="Move episode down"
        @click="emit('moveDown')"
      />
      <UButton
        type="button"
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        size="xs"
        square
        aria-label="Remove episode"
        @click="emit('remove')"
      />
    </div>

    <UDropdownMenu
      :items="actions"
      :content="{ align: 'end' }"
      class="sm:hidden"
    >
      <UButton
        type="button"
        icon="i-lucide-ellipsis-vertical"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        aria-label="Episode actions"
      />
    </UDropdownMenu>
  </div>
</template>
