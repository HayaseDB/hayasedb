<script setup lang="ts">
import {
  ANIME_EPISODE_FIELD_ORDER,
  type LocalizationLocale,
} from '@hayasedb/domain'
import type { ChangeKind, EpisodeDraft, EpisodeText } from '#imports'

const props = withDefaults(
  defineProps<{
    episode: EpisodeDraft
    label: string
    isFirst?: boolean
    isLast?: boolean
    bordered?: boolean
  }>(),
  { isFirst: false, isLast: false, bordered: false },
)

const emit = defineEmits<{ moveUp: []; moveDown: []; remove: [] }>()

const episode = computed(() => props.episode)

const open = ref(episode.value.isNew)

const translations = computed({
  get: () => episode.value.translations,
  set: (value: EpisodeText[]) => {
    episode.value.translations = value
  },
})

const localization = useTranslationEditor({
  translations,
  fields: ['title', 'overview'],
  create: (locale: LocalizationLocale) => ({
    locale,
    title: '',
    overview: null,
    original: episode.value.translations.length === 0,
  }),
})

const { activeIndex, active } = localization

const scope = provideNestedChangeScope(() => `episodes.${props.episode.id}`)

const translationPath = (field: 'title' | 'overview') =>
  `translations.${active.value?.locale ?? ''}.${field}`

const localeSetChanged = computed(
  () => scope.kindOf(`translations.${TRANSLATION_SET_PATH}`) !== 'unchanged',
)

const switcherItems = computed(() =>
  localization.switcherItems.value.map((item) => ({
    ...item,
    changed: ['title', 'overview'].some(
      (field) =>
        scope.kindOf(`translations.${item.value}.${field}`) !== 'unchanged',
    ),
  })),
)

const episodeKind = computed<ChangeKind>(() => {
  if (props.episode.isNew) return 'added'
  if (props.episode.removed) return 'removed'
  const touched =
    scope.kindOf('$state') !== 'unchanged' ||
    ANIME_EPISODE_FIELD_ORDER.some(
      (field) => scope.kindOf(field) !== 'unchanged',
    ) ||
    switcherItems.value.some((item) => item.changed)
  return touched ? 'changed' : 'unchanged'
})

function makeActiveOriginal() {
  episode.value.translations.forEach((item, index) => {
    item.original = index === activeIndex.value
  })
}

function removeActive() {
  const wasOriginal = active.value?.original
  localization.removeActive()
  const first = episode.value.translations[0]
  if (wasOriginal && first) first.original = true
}

const durationMinutes = computed({
  get: () =>
    episode.value.durationSeconds
      ? Math.round(episode.value.durationSeconds / 60)
      : null,
  set: (minutes: number | null) => {
    episode.value.durationSeconds = minutes && minutes > 0 ? minutes * 60 : null
  },
})
</script>

<template>
  <div
    class="rounded-lg"
    :data-change="episodeKind"
    :class="[
      bordered ? 'border-default border' : 'bg-elevated/40',
      CHANGE_RING_CLASS[episodeKind],
    ]"
  >
    <div class="flex items-center gap-1 px-2 py-1.5">
      <UButton
        type="button"
        :icon="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        :aria-expanded="open"
        :aria-label="open ? 'Collapse episode' : 'Expand episode'"
        @click="open = !open"
      />

      <button
        type="button"
        class="text-highlighted min-w-0 flex-1 truncate text-left text-sm"
        @click="open = !open"
      >
        {{ label }}
      </button>

      <UBadge
        v-if="episode.status !== 'RELEASED'"
        :label="ANIME_EPISODE_STATUS_LABELS[episode.status]"
        :color="ANIME_EPISODE_STATUS_COLORS[episode.status]"
        variant="subtle"
        size="sm"
      />

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

    <div v-if="open" class="flex flex-col gap-3 px-3 pb-3">
      <div class="grid gap-3 sm:grid-cols-2">
        <AppFormField path="number" label="Number" hint="Optional">
          <template #default="{ field }">
            <UInput
              :model-value="episode.number ?? ''"
              placeholder="1"
              inputmode="decimal"
              class="w-full"
              v-bind="field"
              @update:model-value="
                (value) => (episode.number = String(value) || null)
              "
            />
          </template>
        </AppFormField>

        <AppFormField path="type" label="Type" required>
          <template #default="{ field }">
            <USelect
              v-model="episode.type"
              :items="animeEpisodeTypeOptions"
              value-key="value"
              class="w-full"
              v-bind="field"
            />
          </template>
        </AppFormField>

        <AppFormField path="status" label="Status" required>
          <template #default="{ field }">
            <USelect
              v-model="episode.status"
              :items="animeEpisodeStatusOptions"
              value-key="value"
              class="w-full"
              v-bind="field"
            />
          </template>
        </AppFormField>

        <AppFormField path="airDate" label="Air date" hint="Optional">
          <template #default="{ field }">
            <UInput
              :model-value="episode.airDate ?? ''"
              type="date"
              class="w-full"
              v-bind="field"
              @update:model-value="
                (value) => (episode.airDate = String(value) || null)
              "
            />
          </template>
        </AppFormField>

        <AppFormField
          path="durationSeconds"
          label="Runtime"
          hint="Minutes, optional"
        >
          <template #default="{ field }">
            <UInputNumber
              v-model="durationMinutes"
              :min="1"
              placeholder="24"
              class="w-full"
              v-bind="field"
            />
          </template>
        </AppFormField>
      </div>

      <LocaleSwitcher
        v-model:locale="localization.activeLocale.value"
        :items="switcherItems"
        :add-options="localization.remainingOptions.value"
        :can-add="localization.canAdd.value"
        :can-remove="localization.canRemove.value"
        :changed="localeSetChanged"
        show-original
        :is-original="active?.original"
        @add="localization.add"
        @remove="removeActive"
        @make-original="makeActiveOriginal"
      />

      <template v-if="active">
        <AppFormField
          :path="translationPath('title')"
          label="Title"
          hint="Optional"
        >
          <template #default="{ field }">
            <UInput
              v-model="active!.title"
              placeholder="Episode title"
              class="w-full"
              v-bind="field"
            />
          </template>
        </AppFormField>

        <AppFormField
          :path="translationPath('overview')"
          label="Overview"
          hint="Optional"
        >
          <template #default="{ field }">
            <UTextarea
              :model-value="active!.overview ?? ''"
              :rows="3"
              placeholder="Short plot description…"
              class="w-full"
              v-bind="field"
              @update:model-value="
                (value) => (active!.overview = String(value) || null)
              "
            />
          </template>
        </AppFormField>
      </template>
    </div>
  </div>
</template>
