<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { AccountUser } from '@hayasedb/contract'

withDefaults(
  defineProps<{
    user?: AccountUser | null
    adminUrl?: string | null
    onSignOut?: () => unknown
  }>(),
  { user: null, adminUrl: null, onSignOut: undefined },
)

const links: NavigationMenuItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Explore', to: '/explore' },
]
</script>

<template>
  <UHeader>
    <template #title>
      <span class="text-highlighted flex items-center gap-2">
        <AppLogo class="size-6 shrink-0" />
        <span class="text-lg font-semibold">HayaseDB</span>
      </span>
    </template>

    <UNavigationMenu :items="links" />

    <template #right>
      <UserMenu
        :user="user"
        :admin-url="adminUrl"
        :on-sign-out="onSignOut"
        show-contributions
      />
    </template>

    <template #body>
      <UNavigationMenu :items="links" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
