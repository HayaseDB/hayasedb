<script setup lang="ts">
import type { LocalizationLocale } from '@hayasedb/domain'
import type { EpisodeDraft, EpisodeText } from '#imports'

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
    :class="bordered ? 'border-default border' : 'bg-elevated/40'"
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
        v-if="episode.isNew"
        label="New"
        color="info"
        variant="subtle"
        size="sm"
      />
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
        <UFormField label="Number" hint="Optional">
          <UInput
            :model-value="episode.number ?? ''"
            placeholder="1"
            inputmode="decimal"
            class="w-full"
            @update:model-value="
              (value) => (episode.number = String(value) || null)
            "
          />
        </UFormField>

        <UFormField label="Type" required>
          <USelect
            v-model="episode.type"
            :items="animeEpisodeTypeOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Status" required>
          <USelect
            v-model="episode.status"
            :items="animeEpisodeStatusOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Air date" hint="Optional">
          <UInput
            :model-value="episode.airDate ?? ''"
            type="date"
            class="w-full"
            @update:model-value="
              (value) => (episode.airDate = String(value) || null)
            "
          />
        </UFormField>

        <UFormField label="Runtime" hint="Minutes, optional">
          <UInputNumber
            v-model="durationMinutes"
            :min="1"
            placeholder="24"
            class="w-full"
          />
        </UFormField>
      </div>

      <LocaleSwitcher
        v-model:locale="localization.activeLocale.value"
        :items="localization.switcherItems.value"
        :add-options="localization.remainingOptions.value"
        :can-add="localization.canAdd.value"
        :can-remove="localization.canRemove.value"
        show-original
        :is-original="active?.original"
        @add="localization.add"
        @remove="removeActive"
        @make-original="makeActiveOriginal"
      />

      <template v-if="active">
        <UFormField label="Title" hint="Optional">
          <UInput
            v-model="active.title"
            placeholder="Episode title"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Overview" hint="Optional">
          <UTextarea
            :model-value="active.overview ?? ''"
            :rows="3"
            placeholder="Short plot description…"
            class="w-full"
            @update:model-value="
              (value) => (active!.overview = String(value) || null)
            "
          />
        </UFormField>
      </template>
    </div>
  </div>
</template>
