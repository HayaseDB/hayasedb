<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

useSeoMeta({ title: 'New anime' })

const { genres } = useGenres()

const crumbs: BreadcrumbItem[] = [
  { label: 'Anime', to: '/anime' },
  { label: 'New anime' },
]
</script>

<template>
  <UDashboardPanel id="admin-anime-new">
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
        :anime="null"
        :genres="genres"
        class="mx-auto w-full max-w-5xl"
      />
    </template>
  </UDashboardPanel>
</template>
