<script setup lang="ts">
import type { LocalizationLocale } from '@hayasedb/domain'
import type { SeasonDraft, StructureTitle } from '#imports'

const props = defineProps<{ season: SeasonDraft }>()

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
  <div class="border-default flex flex-col gap-3 rounded-lg border p-3">
    <div class="grid gap-3 sm:grid-cols-2">
      <UFormField label="Kind" required>
        <USelect
          v-model="season.kind"
          :items="animeSeasonKindOptions"
          value-key="value"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Number" hint="Optional">
        <UInput
          :model-value="season.number ?? ''"
          placeholder="1"
          inputmode="decimal"
          class="w-full"
          @update:model-value="
            (value) => (season.number = String(value) || null)
          "
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

    <UFormField v-if="active" label="Title" hint="Optional">
      <UInput
        v-model="active.title"
        placeholder="Season title"
        class="w-full"
      />
    </UFormField>
  </div>
</template>
