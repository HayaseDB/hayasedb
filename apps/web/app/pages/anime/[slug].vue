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

const dateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})
function formatDate(value?: string | null) {
  return value ? dateFormatter.format(new Date(value)) : null
}
const releaseRange = computed(() => {
  const start = formatDate(detail.value.startDate)
  const end = formatDate(detail.value.endDate)
  if (start && end) return start === end ? start : `${start} – ${end}`
  return start ?? end
})

const banner = computed(() =>
  detail.value.media.find((m) => m.type === 'BANNER'),
)
const cover = computed(() => detail.value.media.find((m) => m.type === 'COVER'))
const gallery = computed(() =>
  detail.value.media.filter((m) => m.type === 'GALLERY'),
)

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
    <div v-if="banner" class="relative h-48 w-full sm:h-64">
      <AnimeCoverImage
        :src="banner.url"
        :alt="`${detail.titleEnglish} banner`"
      />
      <div
        class="from-default absolute inset-0 bg-gradient-to-t to-transparent"
      />
    </div>

    <UContainer class="py-10" :class="{ 'relative -mt-24': banner }">
      <UButton
        to="/explore"
        variant="link"
        color="neutral"
        icon="i-lucide-arrow-left"
        class="mb-4 -ml-2"
      >
        Back to explore
      </UButton>

      <div class="flex flex-col gap-6 sm:flex-row">
        <AnimeCoverImage
          :src="cover?.url"
          :alt="`${detail.titleEnglish} cover`"
          class="aspect-[2/3] w-40 shrink-0 rounded-lg sm:w-48"
        />

        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <h1 class="text-highlighted text-2xl font-semibold">
              {{ detail.titleEnglish }}
            </h1>
            <p v-if="detail.titleNative" class="text-muted text-sm">
              {{ detail.titleNative }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <AnimeBadges
              :format="detail.format"
              :status="detail.status"
              size="md"
            />
            <span
              v-if="releaseRange"
              class="text-muted inline-flex items-center gap-1 text-sm"
            >
              <UIcon name="i-lucide-calendar" class="size-4" />
              {{ releaseRange }}
            </span>
          </div>

          <div v-if="detail.genres.length" class="flex flex-wrap gap-2">
            <UBadge
              v-for="genre in detail.genres"
              :key="genre.id"
              :label="genre.name"
              :to="`/explore?genreId=${genre.id}`"
              color="neutral"
              variant="soft"
            />
          </div>

          <p
            v-if="detail.description"
            class="text-toned mt-2 max-w-2xl text-sm leading-relaxed"
          >
            {{ detail.description }}
          </p>
          <p v-else class="text-muted text-sm">No description yet.</p>
        </div>
      </div>

      <div v-if="gallery.length" class="mt-10">
        <h2 class="text-highlighted mb-3 text-lg font-semibold">Gallery</h2>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <AnimeCoverImage
            v-for="(image, index) in gallery"
            :key="image.id"
            :src="image.url"
            :alt="`${detail.titleEnglish} gallery image ${index + 1}`"
            lazy
            class="aspect-video rounded-lg"
          />
        </div>
      </div>
    </UContainer>
  </div>
</template>
