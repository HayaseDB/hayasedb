<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { AnimeMediaType } from '@hayasedb/domain'
import {
  createAnimeInputSchema,
  type CreateAnimeInput,
} from '@hayasedb/contract'
import type { AnimeFormState, AnimeMediaController } from '#imports'

const state = defineModel<AnimeFormState>('state', { required: true })

const props = withDefaults(
  defineProps<{
    media: AnimeMediaController
    genres: { id: string; name: string }[]
    isEdit: boolean
    isDirty: boolean
    changedFields?: (keyof AnimeFormState)[]
    saving: boolean
    onSubmit: (data: CreateAnimeInput) => unknown | Promise<unknown>
  }>(),
  { changedFields: () => [] },
)

const changed = (field: keyof AnimeFormState) =>
  props.isEdit && props.changedFields.includes(field)

const cover = computed(() => props.media.cover.value)
const banner = computed(() => props.media.banner.value)
const gallery = computed(() => props.media.gallery.value)

const genreItems = computed(() =>
  props.genres.map((g: { id: string; name: string }) => ({
    label: g.name,
    value: g.id,
  })),
)
const formatItems = animeFormatOptions
const statusItems = animeStatusOptions

function handleSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  void props.onSubmit(event.data as CreateAnimeInput)
}

const mediaLabel = (type: AnimeMediaType) => ANIME_MEDIA_TYPE_LABELS[type]

const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
function onDrop(index: number) {
  const from = dragIndex.value
  dragIndex.value = null
  dragOverIndex.value = null
  if (from !== null) props.media.reorderGallery(from, index)
}

const tabs = [
  { label: 'General', icon: 'i-lucide-file-text', slot: 'general' as const },
  { label: 'Images', icon: 'i-lucide-images', slot: 'images' as const },
]
const activeTab = ref('0')
</script>

<template>
  <UForm :schema="createAnimeInputSchema" :state="state" @submit="handleSubmit">
    <UTabs
      v-model="activeTab"
      :items="tabs"
      orientation="vertical"
      variant="link"
      :ui="{
        root: 'flex-row items-start gap-8',
        list: 'w-48 shrink-0',
        content: 'flex-1 min-w-0',
      }"
    >
      <template #general>
        <div class="flex flex-col gap-6">
          <UPageCard title="Titles" variant="subtle">
            <div class="flex flex-col gap-4">
              <UFormField label="Slug" name="slug" required>
                <UInput
                  v-model="state.slug"
                  placeholder="cowboy-bebop"
                  class="w-full"
                  :highlight="changed('slug')"
                  :color="changed('slug') ? 'info' : undefined"
                />
              </UFormField>
              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="English title" name="titleEnglish">
                  <UInput
                    v-model="state.titleEnglish"
                    placeholder="Attack on Titan"
                    class="w-full"
                    :highlight="changed('titleEnglish')"
                    :color="changed('titleEnglish') ? 'info' : undefined"
                  />
                </UFormField>
                <UFormField label="Romaji title" name="titleRomaji">
                  <UInput
                    v-model="state.titleRomaji"
                    placeholder="Shingeki no Kyojin"
                    class="w-full"
                    :highlight="changed('titleRomaji')"
                    :color="changed('titleRomaji') ? 'info' : undefined"
                  />
                </UFormField>
                <UFormField label="Native title" name="titleNative">
                  <UInput
                    v-model="state.titleNative"
                    placeholder="進撃の巨人"
                    class="w-full"
                    :highlight="changed('titleNative')"
                    :color="changed('titleNative') ? 'info' : undefined"
                  />
                </UFormField>
              </div>
            </div>
          </UPageCard>

          <UPageCard title="Format" variant="subtle">
            <UFormField name="format">
              <AppSelect
                v-model="state.format"
                :items="formatItems"
                :clear-value="null"
                value-key="value"
                placeholder="None"
                class="w-full"
                :highlight="changed('format')"
                :color="changed('format') ? 'info' : undefined"
              />
            </UFormField>
          </UPageCard>

          <UPageCard title="Release Data" variant="subtle">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Status" name="status">
                <AppSelect
                  v-model="state.status"
                  :items="statusItems"
                  :clear-value="null"
                  value-key="value"
                  placeholder="None"
                  class="w-full"
                  :highlight="changed('status')"
                  :color="changed('status') ? 'info' : undefined"
                />
              </UFormField>
              <div class="hidden sm:block" />
              <UFormField label="Start date" name="startDate">
                <UInput
                  v-model="state.startDate"
                  type="date"
                  class="w-full"
                  :highlight="changed('startDate')"
                  :color="changed('startDate') ? 'info' : undefined"
                />
              </UFormField>
              <UFormField label="End date" name="endDate">
                <UInput
                  v-model="state.endDate"
                  type="date"
                  class="w-full"
                  :highlight="changed('endDate')"
                  :color="changed('endDate') ? 'info' : undefined"
                />
              </UFormField>
            </div>
          </UPageCard>

          <UPageCard title="Description" variant="subtle">
            <UFormField name="description">
              <UTextarea
                v-model="state.description"
                :rows="6"
                placeholder="English description…"
                class="w-full"
                :highlight="changed('description')"
                :color="changed('description') ? 'info' : undefined"
              />
            </UFormField>
          </UPageCard>

          <UPageCard title="Genres" variant="subtle">
            <UFormField name="genreIds">
              <USelectMenu
                v-model="state.genreIds"
                :items="genreItems"
                value-key="value"
                multiple
                placeholder="Select genres"
                class="w-full"
                :highlight="changed('genreIds')"
                :color="changed('genreIds') ? 'info' : undefined"
              />
            </UFormField>
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
                class="border-default aspect-2/3 w-28 shrink-0 rounded-md border"
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
                class="border-default h-32 rounded-md border"
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
                <div
                  v-for="(m, index) in gallery"
                  :key="m.key"
                  draggable="true"
                  class="group relative cursor-grab active:cursor-grabbing"
                  :class="
                    dragOverIndex === index ? 'ring-primary rounded ring-2' : ''
                  "
                  @dragstart="dragIndex = index"
                  @dragover.prevent="dragOverIndex = index"
                  @dragleave="dragOverIndex = null"
                  @drop="onDrop(index)"
                >
                  <AnimeCoverImage
                    :src="m.url"
                    :alt="`Gallery image ${Number(index) + 1}`"
                    class="bg-default h-32 w-24 rounded"
                  />
                  <UIcon
                    name="i-lucide-grip-vertical"
                    class="bg-inverted/70 text-inverted absolute top-1 left-1 size-5 rounded p-0.5"
                  />
                  <UButton
                    icon="i-lucide-x"
                    color="error"
                    variant="solid"
                    size="xs"
                    class="absolute top-1 right-1 opacity-0 transition group-hover:opacity-100"
                    @click="() => media.removeGallery(m.key)"
                  />
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
    </UTabs>

    <div
      class="border-default mt-6 flex items-center justify-end gap-3 border-t py-4"
    >
      <UButton
        type="submit"
        :label="isEdit ? 'Save changes' : 'Create anime'"
        color="primary"
        :loading="saving"
        :disabled="isEdit && !isDirty"
      />
    </div>
  </UForm>
</template>
