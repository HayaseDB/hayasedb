<script setup lang="ts">
import { ANIME_FORMATS, ANIME_STATUSES } from '@hayasedb/domain'

const route = useRoute()
const router = useRouter()

useSeoMeta({
  title: 'Explore',
  description: 'Search and discover anime.',
})

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function enumParam<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  return typeof value === 'string' &&
    (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined
}

const {
  q,
  format,
  status,
  genreId,
  page,
  pageSize,
  genres,
  items,
  total,
  pending,
} = useAnimeList({
  key: 'explore-anime',
  initial: {
    q: queryString(route.query.q),
    format: enumParam(route.query.format, ANIME_FORMATS),
    status: enumParam(route.query.status, ANIME_STATUSES),
    genreId: queryString(route.query.genreId),
  },
})

watch([q, format, status, genreId], ([qv, fv, sv, gv]) => {
  router.replace({
    query: {
      ...(qv ? { q: qv } : {}),
      ...(fv ? { format: fv } : {}),
      ...(sv ? { status: sv } : {}),
      ...(gv ? { genreId: gv } : {}),
    },
  })
})
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-6 flex flex-col gap-1">
      <h1 class="text-highlighted text-2xl font-semibold">Explore</h1>
      <p class="text-muted text-sm">Search and discover anime.</p>
    </div>

    <AnimeFilterBar
      v-model:q="q"
      v-model:format="format"
      v-model:status="status"
      v-model:genre-id="genreId"
      :genres="genres"
      class="mb-6"
    />

    <div
      v-if="pending && items.length === 0"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
    >
      <USkeleton
        v-for="n in 8"
        :key="n"
        class="aspect-[2/3] w-full rounded-lg"
      />
    </div>

    <div
      v-else-if="items.length === 0"
      class="text-muted flex flex-col items-center gap-2 py-20 text-center"
    >
      <UIcon name="i-lucide-search-x" class="size-8" />
      <p class="text-sm">No anime found.</p>
    </div>

    <div
      v-else
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      :class="{ 'opacity-60': pending }"
    >
      <AnimeCard
        v-for="anime in items"
        :key="anime.id"
        :anime="anime"
        :to="`/anime/${anime.slug}`"
      />
    </div>

    <div v-if="total > pageSize" class="mt-8 flex justify-center">
      <UPagination
        v-model:page="page"
        :items-per-page="pageSize"
        :total="total"
      />
    </div>
  </UContainer>
</template>
