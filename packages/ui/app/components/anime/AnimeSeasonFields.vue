<script setup lang="ts">
import { createAnimeSeasonInputSchema } from '@hayasedb/contract'
import type { LocalizationLocale } from '@hayasedb/domain'
import type { SeasonDraft, StructureTitle, ChangeSet } from '#imports'

const props = defineProps<{
  season: SeasonDraft
  changes?: MaybeRefOrGetter<ChangeSet | undefined>
}>()

const season = computed(() => props.season)

const translations = computed({
  get: () => season.value.translations,
  set: (value: StructureTitle[]) => {
    season.value.translations = value
  },
})

const localization = useTranslationEditor({
  translations,
  fields: ['title'],
  create: (locale: LocalizationLocale) => ({
    locale,
    title: '',
    original: season.value.translations.length === 0,
  }),
})

const { activeIndex, active } = localization

const scope = provideRootedChangeScope({
  prefix: () => `seasons.${props.season.id}`,
  changes: () => toValue(props.changes),
})

const titlePath = computed(
  () => `translations.${active.value?.locale ?? ''}.title`,
)

const titleName = computed(() =>
  activeIndex.value >= 0
    ? `translations.${activeIndex.value}.title`
    : undefined,
)

const schema = createAnimeSeasonInputSchema.omit({ animeId: true })

const localeSetChanged = computed(
  () => scope.kindOf(`translations.${TRANSLATION_SET_PATH}`) !== 'unchanged',
)

const switcherItems = computed(() =>
  localization.switcherItems.value.map((item) => ({
    ...item,
    changed: scope.kindOf(`translations.${item.value}.title`) !== 'unchanged',
  })),
)

function makeActiveOriginal() {
  season.value.translations.forEach((item, index) => {
    item.original = index === activeIndex.value
  })
}

function removeActive() {
  const wasOriginal = active.value?.original
  localization.removeActive()
  const first = season.value.translations[0]
  if (wasOriginal && first) first.original = true
}
</script>

<template>
  <UForm :schema="schema" :state="season" class="flex flex-col gap-3">
    <div class="grid gap-3 sm:grid-cols-2">
      <AppFormField path="kind" name="kind" label="Kind" required>
        <template #default="{ field }">
          <USelect
            v-model="season.kind"
            :items="animeSeasonKindOptions"
            value-key="value"
            class="w-full"
            v-bind="field"
          />
        </template>
      </AppFormField>

      <AppFormField path="number" name="number" label="Number">
        <template #default="{ field }">
          <UInput
            :model-value="season.number ?? ''"
            placeholder="1"
            inputmode="decimal"
            class="w-full"
            v-bind="field"
            @update:model-value="
              (value) => (season.number = String(value) || null)
            "
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

    <AppFormField
      v-if="active"
      :path="titlePath"
      :name="titleName"
      label="Title"
    >
      <template #default="{ field }">
        <UInput
          v-model="active!.title"
          placeholder="Season title"
          class="w-full"
          v-bind="field"
        />
      </template>
    </AppFormField>
  </UForm>
</template>
