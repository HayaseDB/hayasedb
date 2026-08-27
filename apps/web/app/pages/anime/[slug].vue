<script setup lang="ts">
import { fuzzyToIso } from '@hayasedb/domain'

const route = useRoute()
const api = useApiClient()
const slug = computed(() => String(route.params.slug))

const { data: anime, error } = await useAsyncData(
  () => `anime-${slug.value}`,
  () => resolveAnimeBySlug(api, slug.value),
  { watch: [slug] },
)

if (isRateLimitedError(error.value)) {
  throw createError({
    statusCode: 429,
    statusMessage: 'Too many requests, please try again in a moment.',
  })
}

if (error.value || !anime.value) {
  throw createError({ statusCode: 404, statusMessage: 'Anime not found' })
}

const detail = computed(() => anime.value!)

const displayTitle = computed(
  () =>
    detail.value.titleEnglish ??
    detail.value.titleRomaji ??
    detail.value.titleNative ??
    detail.value.slug,
)

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
      alt: `${displayTitle.value} gallery image ${index + 1}`,
    })),
)

const genreItems = computed(() =>
  detail.value.genres.map((genre) => ({
    ...genre,
    to: `/explore?genre=${genre.id}`,
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
        alt: `${displayTitle.value} cover`,
      },
    ],
  })
}

const descriptionExpanded = ref(false)
const descriptionEl = useTemplateRef<HTMLElement>('descriptionEl')
const descriptionClamped = useClampOverflow(descriptionEl, descriptionExpanded)
watch(slug, () => {
  descriptionExpanded.value = false
})
function toggleDescription() {
  descriptionExpanded.value = !descriptionExpanded.value
}

const metaDescription = computed(() => {
  const raw = detail.value.description?.replace(/\s+/g, ' ').trim()
  if (!raw) return undefined
  if (raw.length <= 160) return raw
  const clipped = raw.slice(0, 157)
  const lastSpace = clipped.lastIndexOf(' ')
  return `${(lastSpace > 100 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`
})

useSeoMeta({
  title: () => displayTitle.value,
  description: () => metaDescription.value,
  ogTitle: () => displayTitle.value,
  ogDescription: () => metaDescription.value,
  ogType: 'video.tv_show',
  ogImageAlt: () => `${displayTitle.value} cover art`,
  twitterImageAlt: () => `${displayTitle.value} cover art`,
})

defineOgImage('Anime', {
  title: displayTitle.value,
  cover: cover.value?.url ?? null,
  genres: detail.value.genres.slice(0, 3).map((genre) => genre.name),
  format: detail.value.format,
  year: detail.value.startDate?.year ?? null,
})

useSchemaOrg([
  defineMovie({
    name: displayTitle,
    description: computed(() => detail.value.description ?? undefined),
    image: computed(() => cover.value?.url ?? '/web-app-manifest-512x512.png'),
    genre: computed(() =>
      detail.value.genres.map((genre) => genre.name).join(', '),
    ),
    dateCreated: computed(
      () => fuzzyToIso(detail.value.startDate) ?? undefined,
    ),
  }),
])
</script>

<template>
  <div>
    <div v-if="banner" class="relative h-56 w-full sm:h-72 lg:h-80">
      <AnimeCoverImage :src="banner.url" :alt="`${displayTitle} banner`" />
      <div
        class="from-default absolute inset-0 bg-gradient-to-t to-transparent"
      />
    </div>

    <UContainer class="py-10" :class="{ 'relative -mt-24 sm:-mt-28': banner }">
      <div class="mb-4 flex items-center justify-between gap-3">
        <UButton
          to="/explore"
          variant="link"
          color="neutral"
          icon="i-lucide-arrow-left"
          class="-ml-2"
        >
          Back to explore
        </UButton>
        <UButton
          :to="`/contribute/anime/${detail.id}`"
          label="Suggest edit"
          icon="i-lucide-pencil"
          color="neutral"
          variant="outline"
          size="sm"
        />
      </div>

      <div class="flex flex-col gap-6 sm:flex-row sm:items-start lg:gap-8">
        <div class="w-40 shrink-0 sm:w-48 lg:w-56">
          <button
            type="button"
            :disabled="!cover"
            class="ring-default block aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg ring-1"
            :class="{ 'cursor-zoom-in': cover }"
            :aria-label="`Open ${displayTitle} cover in fullscreen`"
            @click="openCoverLightbox()"
          >
            <AnimeCoverImage :src="cover?.url" :alt="`${displayTitle} cover`" />
          </button>
          <AnimeDetailsPanel
            class="mt-4 hidden sm:flex"
            :anime="detail"
            :genres="genreItems"
          />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex min-w-0 flex-col gap-1">
            <h1 class="text-highlighted text-2xl font-semibold lg:text-3xl">
              {{ displayTitle }}
            </h1>
            <p
              v-if="detail.titleNative && detail.titleNative !== displayTitle"
              class="text-muted text-sm"
            >
              {{ detail.titleNative }}
            </p>
          </div>

          <div class="mt-4">
            <p
              v-if="detail.description"
              ref="descriptionEl"
              class="text-toned text-sm leading-relaxed"
              :class="{ 'line-clamp-6': !descriptionExpanded }"
            >
              {{ detail.description }}
            </p>
            <p v-else class="text-muted text-sm">No description yet.</p>
            <UButton
              v-if="descriptionClamped"
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

          <div v-if="detail.relations.length" class="mt-8">
            <h2 class="text-highlighted mb-4 text-lg font-semibold">
              Relations
            </h2>
            <AnimeRelationList
              :relations="detail.relations"
              :to="(anime: { slug: string }) => `/anime/${anime.slug}`"
            />
          </div>

          <div v-if="galleryItems.length" class="mt-8">
            <h2 class="text-highlighted mb-4 text-lg font-semibold">Gallery</h2>
            <AnimeGallery :items="galleryItems" />
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
