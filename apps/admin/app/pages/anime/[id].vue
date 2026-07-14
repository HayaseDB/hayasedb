<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

const route = useRoute()
const api = useApiClient()
const id = computed(() => String(route.params.id))

const {
  data: anime,
  error,
  refresh,
} = await useAsyncData(
  () => `admin-anime-${id.value}`,
  () => api.anime.getById({ id: id.value }),
  { watch: [id] },
)

if (error.value || !anime.value) {
  throw createError({ statusCode: 404, statusMessage: 'Anime not found' })
}

const { genres } = useGenres()

const crumbs = computed<BreadcrumbItem[]>(() => [
  { label: 'Anime', to: '/anime' },
  { label: anime.value?.slug ?? '' },
])
</script>

<template>
  <UDashboardPanel id="admin-anime-edit">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
          <UBreadcrumb :items="crumbs" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <AnimeFormCard
        v-if="anime"
        :anime="anime"
        :genres="genres"
        :on-saved="refresh"
        class="mx-auto w-full max-w-5xl"
      />
    </template>
  </UDashboardPanel>
</template>
