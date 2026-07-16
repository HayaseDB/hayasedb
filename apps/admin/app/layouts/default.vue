<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { pendingCount } = useModerationCounts()

const navItems = computed<NavigationMenuItem[][]>(() => [
  [
    { label: 'Overview', icon: 'i-lucide-layout-dashboard', to: '/' },
    { label: 'Anime', icon: 'i-lucide-clapperboard', to: '/anime' },
    { label: 'Genres', icon: 'i-lucide-tags', to: '/genres' },
    {
      label: 'Submissions',
      icon: 'i-lucide-inbox',
      to: '/submissions',
      badge: pendingCount.value > 0 ? String(pendingCount.value) : undefined,
    },
    { label: 'Users', icon: 'i-lucide-users', to: '/users' },
  ],
])
</script>

<template>
  <UDashboardGroup storage="local" storage-key="admin-sidebar">
    <UDashboardSidebar
      collapsible
      resizable
      :ui="{
        root: 'transition-[width] duration-200 ease-out data-[dragging=true]:transition-none',
        footer: 'border-t border-default',
      }"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          to="/"
          class="text-highlighted flex min-w-0 items-center gap-2 font-semibold"
          :class="collapsed ? 'w-full justify-center' : ''"
        >
          <AppLogo class="size-6 shrink-0" />
          <span v-if="!collapsed" class="truncate text-lg">
            HayaseDB <span class="text-muted font-normal">Admin</span>
          </span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="navItems"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <AdminUserMenu :collapsed="collapsed" class="w-full" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
