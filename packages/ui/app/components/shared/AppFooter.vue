<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const legalLinks: NavigationMenuItem[] = [
  { label: 'Imprint', to: '/imprint' },
  { label: 'Privacy Policy', to: '/privacy' },
]
</script>

<template>
  <UFooter>
    <template #left>
      <p class="text-muted text-sm">© HayaseDB</p>
    </template>

    <UNavigationMenu :items="legalLinks" variant="link" />

    <template #right>
      <UButton
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        to="https://github.com"
        target="_blank"
        aria-label="GitHub"
      />
    </template>
  </UFooter>
</template>
