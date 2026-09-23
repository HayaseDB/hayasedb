<script setup lang="ts">
import { createAnimeEpisodeFieldsSchema } from '@hayasedb/contract'
import type { LocalizationLocale } from '@hayasedb/domain'
import type { EpisodeDraft, EpisodeText, ChangeSet } from '#imports'

const props = defineProps<{
  episode: EpisodeDraft
  changes?: MaybeRefOrGetter<ChangeSet | undefined>
}>()

const episode = computed(() => props.episode)

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

const scope = provideRootedChangeScope({
  prefix: () => `episodes.${props.episode.id}`,
  changes: () => toValue(props.changes),
})

const translationPath = (field: 'title' | 'overview') =>
  `translations.${active.value?.locale ?? ''}.${field}`

const translationName = (field: 'title' | 'overview') =>
  activeIndex.value >= 0
    ? `translations.${activeIndex.value}.${field}`
    : undefined

const schema = createAnimeEpisodeFieldsSchema

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
  <UForm :schema="schema" :state="episode" class="flex flex-col gap-4">
    <div class="grid gap-3 sm:grid-cols-2">
      <AppFormField path="number" name="number" label="Number">
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

      <AppFormField path="type" name="type" label="Type" required>
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

      <AppFormField path="status" name="status" label="Status" required>
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

      <AppFormField path="airDate" name="airDate" label="Air date">
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
        name="durationSeconds"
        label="Runtime (minutes)"
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
        :name="translationName('title')"
        label="Title"
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
        :name="translationName('overview')"
        label="Overview"
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
  </UForm>
</template>
