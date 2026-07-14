<script setup lang="ts">
const {
  q,
  format,
  status,
  genreId,
  sortKey,
  page,
  pageSize,
  pageTo,
  hasFilters,
  resetFilters,
  genres,
  items,
  total,
  pending,
} = useAnimeListQuery({ key: 'explore-anime' })

useSeoMeta({
  title: () => {
    const base = q.value ? `“${q.value}” – Explore` : 'Explore'
    return page.value > 1 ? `${base} – Page ${page.value}` : base
  },
  description: 'Search and discover anime.',
})

watch(page, () => {
  if (import.meta.client) window.scrollTo({ top: 0 })
})

const initialLoading = computed(() => pending.value && items.value.length === 0)
const rangeStart = computed(() => (page.value - 1) * pageSize + 1)
const rangeEnd = computed(() => Math.min(page.value * pageSize, total.value))
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
      v-model:sort-key="sortKey"
      :genres="genres"
      class="mb-4"
    />

    <div
      v-if="!initialLoading"
      class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1"
    >
      <p class="text-muted text-sm">
        {{ total }} {{ total === 1 ? 'title' : 'titles' }}
      </p>
      <UButton
        v-if="hasFilters"
        label="Reset filters"
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="resetFilters()"
      />
    </div>

    <div
      v-if="initialLoading"
      class="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-y-8 xl:grid-cols-6"
    >
      <div v-for="n in pageSize" :key="n" class="flex flex-col gap-2">
        <USkeleton class="aspect-[2/3] w-full rounded-lg" />
        <USkeleton class="h-4 w-3/4" />
      </div>
    </div>

    <UEmpty
      v-else-if="items.length === 0"
      variant="naked"
      icon="i-lucide-search-x"
      title="No anime found"
      :description="
        hasFilters
          ? 'Try adjusting your search or filters.'
          : 'Check back later — new titles are added regularly.'
      "
      :actions="
        hasFilters
          ? [
              {
                label: 'Reset filters',
                color: 'neutral',
                variant: 'outline',
                onClick: () => {
                  void resetFilters()
                },
              },
            ]
          : undefined
      "
      class="py-16"
    />

    <div
      v-else
      class="grid grid-cols-2 gap-x-4 gap-y-6 transition-opacity sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-y-8 xl:grid-cols-6"
      :class="{ 'opacity-60': pending }"
    >
      <AnimeCard
        v-for="anime in items"
        :key="anime.id"
        :anime="anime"
        :to="`/anime/${anime.slug}`"
      />
    </div>

    <div v-if="total > pageSize" class="mt-10 flex flex-col items-center gap-3">
      <UPagination
        :page="page"
        :items-per-page="pageSize"
        :total="total"
        :to="pageTo"
        show-edges
        :sibling-count="1"
      />
      <p class="text-muted text-xs">
        Showing {{ rangeStart }}–{{ rangeEnd }} of {{ total }}
      </p>
    </div>
  </UContainer>
</template>
