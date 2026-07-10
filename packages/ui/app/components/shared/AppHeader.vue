<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { data: session } = await useAppSession()
const user = computed(() => session.value?.user ?? null)
const { signOut } = useAccountActions()

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
      <UserMenu :user="user" :on-sign-out="signOut" />
    </template>

    <template #body>
      <UNavigationMenu :items="links" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
