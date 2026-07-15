<script setup lang="ts">
const route = useRoute()
const api = useApiClient()
const slug = computed(() => String(route.params.slug))

const { data: anime, error } = await useAsyncData(
  () => `anime-${slug.value}`,
  () => api.anime.getBySlug({ slug: slug.value }),
  { watch: [slug] },
)

if (error.value || !anime.value) {
  throw createError({ statusCode: 404, statusMessage: 'Anime not found' })
}

const detail = computed(() => anime.value!)

const banner = computed(() =>
  detail.value.media.find((m) => m.type === 'BANNER'),
)
const cover = computed(() => detail.value.media.find((m) => m.type === 'COVER'))
const galleryItems = computed(() =>
  detail.value.media
    .filter((m) => m.type === 'GALLERY')
    .map((image, index) => ({
      id: image.id,
      url: image.url,
      alt: `${detail.value.titleEnglish} gallery image ${index + 1}`,
    })),
)

const genreItems = computed(() =>
  detail.value.genres.map((genre) => ({
    ...genre,
    to: `/explore?genreId=${genre.id}`,
  })),
)

const lightbox = useAnimeLightbox()

function openCoverLightbox() {
  if (!cover.value) return
  lightbox.open({
    items: [
      {
        id: cover.value.id,
        url: cover.value.url,
        alt: `${detail.value.titleEnglish} cover`,
      },
    ],
  })
}

const descriptionExpanded = ref(false)
const isLongDescription = computed(
  () => (detail.value.description?.length ?? 0) > 400,
)
watch(slug, () => {
  descriptionExpanded.value = false
})
function toggleDescription() {
  descriptionExpanded.value = !descriptionExpanded.value
}

useSeoMeta({
  title: () => detail.value.titleEnglish,
  description: () => detail.value.description ?? undefined,
  ogTitle: () => detail.value.titleEnglish,
  ogDescription: () => detail.value.description ?? undefined,
  ogImage: () => cover.value?.url,
})
</script>

<template>
  <div>
    <div v-if="banner" class="relative h-56 w-full sm:h-72 lg:h-80">
      <AnimeCoverImage
        :src="banner.url"
        :alt="`${detail.titleEnglish} banner`"
      />
      <div
        class="from-default absolute inset-0 bg-gradient-to-t to-transparent"
      />
    </div>

    <UContainer class="py-10" :class="{ 'relative -mt-24 sm:-mt-28': banner }">
      <UButton
        to="/explore"
        variant="link"
        color="neutral"
        icon="i-lucide-arrow-left"
        class="mb-4 -ml-2"
      >
        Back to explore
      </UButton>

      <div class="flex flex-col gap-6 sm:flex-row sm:items-start lg:gap-8">
        <div class="w-40 shrink-0 sm:w-48 lg:w-56">
          <button
            type="button"
            :disabled="!cover"
            class="ring-default block aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg ring-1"
            :class="{ 'cursor-zoom-in': cover }"
            :aria-label="`Open ${detail.titleEnglish} cover in fullscreen`"
            @click="openCoverLightbox()"
          >
            <AnimeCoverImage
              :src="cover?.url"
              :alt="`${detail.titleEnglish} cover`"
            />
          </button>
          <AnimeDetailsPanel
            class="mt-4 hidden sm:flex"
            :anime="detail"
            :genres="genreItems"
          />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-col gap-1">
            <h1 class="text-highlighted text-2xl font-semibold lg:text-3xl">
              {{ detail.titleEnglish }}
            </h1>
            <p v-if="detail.titleNative" class="text-muted text-sm">
              {{ detail.titleNative }}
            </p>
          </div>

          <div class="mt-4">
            <p
              v-if="detail.description"
              class="text-toned max-w-3xl text-sm leading-relaxed"
              :class="{
                'line-clamp-6': isLongDescription && !descriptionExpanded,
              }"
            >
              {{ detail.description }}
            </p>
            <p v-else class="text-muted text-sm">No description yet.</p>
            <UButton
              v-if="isLongDescription"
              :label="descriptionExpanded ? 'Show less' : 'Show more'"
              :trailing-icon="
                descriptionExpanded
                  ? 'i-lucide-chevron-up'
                  : 'i-lucide-chevron-down'
              "
              color="neutral"
              variant="link"
              size="sm"
              class="mt-1 -ml-2.5"
              @click="toggleDescription()"
            />
          </div>

          <AnimeDetailsPanel
            class="mt-6 flex sm:hidden"
            :anime="detail"
            :genres="genreItems"
          />

          <div v-if="galleryItems.length" class="mt-8 max-w-3xl">
            <h2 class="text-highlighted mb-4 text-lg font-semibold">Gallery</h2>
            <AnimeGallery :items="galleryItems" />
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
