<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const navItems: NavigationMenuItem[][] = [
  [
    { label: 'Overview', icon: 'i-lucide-layout-dashboard', to: '/' },
    { label: 'Users', icon: 'i-lucide-users', to: '/users' },
  ],
]
</script>

<template>
  <UDashboardGroup storage="local" storage-key="admin-sidebar">
    <UDashboardSidebar collapsible resizable>
      <template #header="{ collapsed }">
        <NuxtLink
          to="/"
          class="text-highlighted flex items-center gap-2 font-semibold"
          :class="collapsed ? 'w-full justify-center' : ''"
        >
          <AppLogo class="size-6 shrink-0" />
          <span v-if="!collapsed" class="text-lg">
            HayaseDB <span class="text-muted font-normal">Admin</span>
          </span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="navItems"
          orientation="vertical"
        />
      </template>

      <template #footer="{ collapsed }">
        <AdminUserMenu :collapsed="collapsed" class="w-full" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
