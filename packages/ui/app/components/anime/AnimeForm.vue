<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { AnimeMediaType } from '@hayasedb/domain'
import {
  createAnimeInputSchema,
  type CreateAnimeInput,
} from '@hayasedb/contract'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import type {
  AnimeFormState,
  AnimeMediaController,
  AnimeRelationRow,
  AnimeRelationSearchResult,
  AnimeStructureState,
  ChangeKind,
  ChangeSet,
} from '#imports'

const state = defineModel<AnimeFormState>('state', { required: true })

const structure = defineModel<AnimeStructureState | undefined>('structure', {
  default: undefined,
})

const props = withDefaults(
  defineProps<{
    media: AnimeMediaController
    genres: { id: string; name: string }[]
    proposedGenres?: { id: string; name: string }[]
    isEdit: boolean
    isDirty: boolean
    changes: ChangeSet
    relationRows: AnimeRelationRow[]
    saving: boolean
    submitLabel?: string
    selfId?: string | null
    onSubmit: (data: CreateAnimeInput) => unknown | Promise<unknown>
    onCreateGenre?: (name: string) => void
    onSearchAnime: (query: string) => Promise<AnimeRelationSearchResult[]>
    structureLoading?: boolean
    structureChangeCount?: number
    structureChangeBudget?: number
  }>(),
  {
    proposedGenres: () => [],
    submitLabel: undefined,
    selfId: null,
    onCreateGenre: undefined,
    structureLoading: false,
    structureChangeCount: 0,
    structureChangeBudget: 0,
  },
)

provideChangeScope({ changes: () => props.changes })

const cover = computed(() => props.media.cover.value)
const banner = computed(() => props.media.banner.value)
const gallery = computed(() => props.media.gallery.value)

const genreItems = computed(() => [
  ...props.genres.map((g: { id: string; name: string }) => ({
    label: g.name,
    value: g.id,
  })),
  ...props.proposedGenres.map((g: { id: string; name: string }) => ({
    label: `${g.name} (new)`,
    value: g.id,
  })),
])

function handleCreateGenre(name: string) {
  const trimmed = name.trim()
  if (!trimmed || !props.onCreateGenre) return
  const lower = trimmed.toLowerCase()
  const existing = [...props.genres, ...props.proposedGenres].find(
    (g) => g.name.toLowerCase() === lower,
  )
  if (existing) {
    if (!state.value.genreIds.includes(existing.id)) {
      state.value.genreIds = [...state.value.genreIds, existing.id]
    }
    return
  }
  props.onCreateGenre(trimmed)
}
const formatItems = animeFormatOptions
const statusItems = animeStatusOptions

function handleSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  void props.onSubmit(event.data as CreateAnimeInput)
}

const translations = computed({
  get: () => state.value.translations,
  set: (value) => {
    state.value.translations = value
  },
})

const formErrors = ref<{ name?: string }[]>()

const localization = useTranslationEditor({
  translations,
  fields: ['title', 'description'],
  errors: formErrors,
  create: (locale) => ({
    locale,
    title: '',
    description: null,
    original: state.value.translations.length === 0,
  }),
})

const activeTranslationIndex = localization.activeIndex
const activeTranslation = localization.active

const translationPath = (field: AnimeTranslationField) =>
  `translations.${activeTranslation.value?.locale ?? ''}.${field}`

const changedPaths = computed<ReadonlySet<string>>(
  () => props.changes?.paths ?? new Set<string>(),
)

const localeSetChanged = computed(() =>
  changedPaths.value.has(`translations.${TRANSLATION_SET_PATH}`),
)

const switcherItems = computed(() =>
  localization.switcherItems.value.map((item) => ({
    ...item,
    changed: [...changedPaths.value].some((path) =>
      path.startsWith(`translations.${item.value}.`),
    ),
  })),
)

function makeActiveOriginal() {
  state.value.translations.forEach((item, itemIndex) => {
    item.original = itemIndex === activeTranslationIndex.value
  })
}

function removeActiveTranslation() {
  const wasOriginal = activeTranslation.value?.original
  localization.removeActive()
  if (wasOriginal && state.value.translations[0]) {
    state.value.translations[0].original = true
  }
}

const mediaLabel = (type: AnimeMediaType) => ANIME_MEDIA_TYPE_LABELS[type]

const mediaKind = (path: string): ChangeKind =>
  changedPaths.value.has(`media.${path}`) ? 'changed' : 'unchanged'

const galleryKind = (item: { key: string; kind?: string }): ChangeKind => {
  const id = 'id' in item ? String((item as { id: string }).id) : item.key
  return changedPaths.value.has(`media.GALLERY.${id}`) ? 'changed' : 'unchanged'
}

const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
function onDrop(index: number) {
  const from = dragIndex.value
  dragIndex.value = null
  dragOverIndex.value = null
  if (from !== null) props.media.reorderGallery(from, index)
}

const tabs = computed(() => [
  { label: 'General', icon: 'i-lucide-file-text', slot: 'general' as const },
  {
    label: 'Relations',
    icon: 'i-lucide-git-branch',
    slot: 'relations' as const,
  },
  { label: 'Images', icon: 'i-lucide-images', slot: 'images' as const },
  ...(structure.value
    ? [
        {
          label: 'Episodes',
          icon: 'i-lucide-list-video',
          slot: 'episodes' as const,
        },
      ]
    : []),
])
const activeTab = ref('0')

const isDesktop = useBreakpoints(breakpointsTailwind).greaterOrEqual('lg')
</script>

<template>
  <UForm
    :schema="createAnimeInputSchema"
    :state="state"
    @submit="handleSubmit"
    @error="(event) => (formErrors = event.errors)"
  >
    <UTabs
      v-model="activeTab"
      :items="tabs"
      :orientation="isDesktop ? 'vertical' : 'horizontal'"
      variant="link"
      :ui="{
        root: 'gap-6 lg:flex-row lg:items-start lg:gap-8',
        list: 'lg:w-48 lg:shrink-0',
        trigger: 'max-lg:flex-1 max-lg:min-w-0',
        content: 'min-w-0 lg:flex-1',
      }"
    >
      <template #general>
        <div class="flex flex-col gap-6">
          <UPageCard title="General information" variant="subtle">
            <div class="flex flex-col gap-4">
              <AppFormField path="slug" label="Slug" name="slug" required>
                <template #default="{ field }">
                  <UInput
                    id="anime-slug"
                    v-model="state.slug"
                    placeholder="cowboy-bebop"
                    class="w-full"
                    v-bind="field"
                  />
                </template>
              </AppFormField>

              <LocaleSwitcher
                v-model:locale="localization.activeLocale.value"
                :items="switcherItems"
                :add-options="localization.remainingOptions.value"
                :can-add="localization.canAdd.value"
                :can-remove="localization.canRemove.value"
                :changed="localeSetChanged"
                show-original
                :is-original="activeTranslation?.original"
                @add="localization.add"
                @remove="removeActiveTranslation"
                @make-original="makeActiveOriginal"
              />

              <template v-if="activeTranslation">
                <AppFormField
                  :path="translationPath('title')"
                  label="Title"
                  :name="`translations.${activeTranslationIndex}.title`"
                  required
                >
                  <template #default="{ field }">
                    <UInput
                      id="anime-title"
                      v-model="activeTranslation!.title"
                      placeholder="Localized title"
                      class="w-full"
                      v-bind="field"
                    />
                  </template>
                </AppFormField>
                <AppFormField
                  :path="translationPath('description')"
                  label="Description"
                  :name="`translations.${activeTranslationIndex}.description`"
                >
                  <template #default="{ field }">
                    <UTextarea
                      :model-value="activeTranslation!.description ?? undefined"
                      :rows="4"
                      placeholder="Localized anime description…"
                      class="w-full"
                      v-bind="field"
                      @update:model-value="
                        (value) =>
                          (activeTranslation!.description = value || null)
                      "
                    />
                  </template>
                </AppFormField>
              </template>
            </div>
          </UPageCard>

          <UPageCard title="Format" variant="subtle">
            <div class="grid gap-4 sm:grid-cols-2">
              <AppFormField path="format" label="Format" name="format">
                <template #default="{ field }">
                  <AppSelect
                    v-model="state.format"
                    :items="formatItems"
                    :clear-value="null"
                    value-key="value"
                    placeholder="None"
                    class="w-full"
                    v-bind="field"
                  />
                </template>
              </AppFormField>
            </div>
          </UPageCard>

          <UPageCard title="Release Data" variant="subtle">
            <div class="grid gap-4 sm:grid-cols-2">
              <AppFormField
                path="status"
                label="Status"
                name="status"
                class="sm:col-span-2"
              >
                <template #default="{ field }">
                  <AppSelect
                    v-model="state.status"
                    :items="statusItems"
                    :clear-value="null"
                    value-key="value"
                    placeholder="None"
                    class="w-full"
                    v-bind="field"
                  />
                </template>
              </AppFormField>
              <AppFormField
                path="startDate"
                label="Start date"
                name="startDate"
              >
                <template #default="{ field }">
                  <AnimeFuzzyDateInput
                    v-model="state.startDate"
                    v-bind="field"
                  />
                </template>
              </AppFormField>
              <AppFormField path="endDate" label="End date" name="endDate">
                <template #default="{ field }">
                  <AnimeFuzzyDateInput v-model="state.endDate" v-bind="field" />
                </template>
              </AppFormField>
            </div>
          </UPageCard>

          <UPageCard title="Genres" variant="subtle">
            <AppFormField
              path="genreIds"
              name="genreIds"
              :description="
                onCreateGenre
                  ? 'Pick existing genres or type a new name to propose it.'
                  : undefined
              "
            >
              <template #default="{ field }">
                <USelectMenu
                  id="anime-genres"
                  v-model="state.genreIds"
                  :items="genreItems"
                  value-key="value"
                  multiple
                  placeholder="Select genres"
                  class="w-full"
                  :create-item="Boolean(onCreateGenre)"
                  v-bind="field"
                  @create="handleCreateGenre"
                />
              </template>
            </AppFormField>
          </UPageCard>
        </div>
      </template>

      <template #relations>
        <div class="flex flex-col gap-6">
          <UPageCard
            title="Relations"
            description="Link this anime to its prequels, sequels, side stories and alternatives. Relations are shown from this anime's point of view."
            variant="subtle"
          >
            <AnimeRelationEditor
              v-model="state.relationEdges"
              :self-id="selfId"
              :search-anime="onSearchAnime"
              :rows="relationRows"
            />
          </UPageCard>
        </div>
      </template>

      <template #images>
        <div class="flex flex-col gap-6">
          <UPageCard :title="mediaLabel('COVER')" variant="subtle">
            <div class="flex items-start gap-4">
              <AnimeCoverImage
                :src="cover?.url"
                :alt="mediaLabel('COVER')"
                :data-change="mediaKind('COVER')"
                class="border-default aspect-2/3 w-28 shrink-0 rounded-md border"
                :class="CHANGE_RING_CLASS[mediaKind('COVER')]"
              />
              <div class="flex flex-col gap-2">
                <UFileUpload
                  :accept="MEDIA_ACCEPT"
                  :interactive="false"
                  :preview="false"
                  @update:model-value="
                    (f?: File | null) => {
                      if (f) media.setSingle('COVER', f)
                    }
                  "
                >
                  <template #default="{ open }">
                    <UButton
                      :label="cover ? 'Replace cover' : 'Add cover'"
                      icon="i-lucide-upload"
                      color="neutral"
                      variant="outline"
                      size="sm"
                      @click="() => open()"
                    />
                  </template>
                </UFileUpload>
                <UButton
                  v-if="cover"
                  label="Remove"
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="sm"
                  @click="() => media.removeSingle('COVER')"
                />
              </div>
            </div>
          </UPageCard>

          <UPageCard :title="mediaLabel('BANNER')" variant="subtle">
            <div class="flex flex-col gap-3">
              <AnimeCoverImage
                :src="banner?.url"
                :alt="mediaLabel('BANNER')"
                :data-change="mediaKind('BANNER')"
                class="border-default h-32 rounded-md border"
                :class="CHANGE_RING_CLASS[mediaKind('BANNER')]"
              />
              <div class="flex gap-2">
                <UFileUpload
                  :accept="MEDIA_ACCEPT"
                  :interactive="false"
                  :preview="false"
                  @update:model-value="
                    (f?: File | null) => {
                      if (f) media.setSingle('BANNER', f)
                    }
                  "
                >
                  <template #default="{ open }">
                    <UButton
                      :label="banner ? 'Replace banner' : 'Add banner'"
                      icon="i-lucide-upload"
                      color="neutral"
                      variant="outline"
                      size="sm"
                      @click="() => open()"
                    />
                  </template>
                </UFileUpload>
                <UButton
                  v-if="banner"
                  label="Remove"
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="sm"
                  @click="() => media.removeSingle('BANNER')"
                />
              </div>
            </div>
          </UPageCard>

          <UPageCard :title="mediaLabel('GALLERY')" variant="subtle">
            <div class="flex flex-col gap-4">
              <div v-if="gallery.length" class="flex flex-wrap gap-3">
                <div v-for="(m, index) in gallery" :key="m.key">
                  <div
                    draggable="true"
                    class="relative cursor-grab active:cursor-grabbing"
                    :class="
                      dragOverIndex === index
                        ? 'ring-primary rounded ring-2'
                        : ''
                    "
                    @dragstart="dragIndex = index"
                    @dragover.prevent="dragOverIndex = index"
                    @dragleave="dragOverIndex = null"
                    @drop="onDrop(index)"
                  >
                    <AnimeCoverImage
                      :src="m.url"
                      :alt="`Gallery image ${Number(index) + 1}`"
                      :data-change="galleryKind(m)"
                      class="bg-default h-32 w-24 rounded"
                      :class="CHANGE_RING_CLASS[galleryKind(m)]"
                    />
                    <UIcon
                      name="i-lucide-grip-vertical"
                      class="bg-inverted/70 text-inverted absolute top-1 left-1 hidden size-5 rounded p-0.5 lg:block"
                    />
                    <UButton
                      icon="i-lucide-x"
                      color="error"
                      variant="solid"
                      size="sm"
                      class="absolute top-1 right-1"
                      :aria-label="`Remove gallery image ${Number(index) + 1}`"
                      @click="() => media.removeGallery(m.key)"
                    />
                  </div>
                  <div class="mt-1 flex justify-center gap-1">
                    <UButton
                      icon="i-lucide-chevron-left"
                      color="neutral"
                      variant="outline"
                      size="sm"
                      :disabled="index === 0"
                      :aria-label="`Move gallery image ${Number(index) + 1} left`"
                      @click="() => media.reorderGallery(index, index - 1)"
                    />
                    <UButton
                      icon="i-lucide-chevron-right"
                      color="neutral"
                      variant="outline"
                      size="sm"
                      :disabled="index === gallery.length - 1"
                      :aria-label="`Move gallery image ${Number(index) + 1} right`"
                      @click="() => media.reorderGallery(index, index + 1)"
                    />
                  </div>
                </div>
              </div>
              <p v-else class="text-muted text-sm">No gallery images yet.</p>

              <div class="border-default border-t pt-3">
                <UFileUpload
                  :accept="MEDIA_ACCEPT"
                  :interactive="false"
                  :preview="false"
                  @update:model-value="
                    (f?: File | null) => {
                      if (f) media.addGallery(f)
                    }
                  "
                >
                  <template #default="{ open }">
                    <UButton
                      label="Add gallery image"
                      icon="i-lucide-upload"
                      color="neutral"
                      variant="outline"
                      @click="() => open()"
                    />
                  </template>
                </UFileUpload>
              </div>
            </div>
          </UPageCard>
        </div>
      </template>

      <template v-if="structure" #episodes>
        <UPageCard
          title="Episodes & seasons"
          description="An anime holds either seasons or standalone episodes, never both."
          variant="subtle"
        >
          <AnimeStructureEditor
            v-model:state="structure"
            :loading="structureLoading"
            :change-count="structureChangeCount"
            :change-budget="structureChangeBudget"
          />
        </UPageCard>
      </template>
    </UTabs>

    <div
      class="border-default mt-6 flex flex-col items-stretch gap-3 border-t py-4 sm:flex-row sm:items-center sm:justify-end"
    >
      <slot name="footer-leading" />
      <UButton
        type="submit"
        :label="submitLabel ?? (isEdit ? 'Save changes' : 'Create anime')"
        color="primary"
        :loading="saving"
        :disabled="isEdit && !isDirty"
      />
    </div>
  </UForm>
</template>
