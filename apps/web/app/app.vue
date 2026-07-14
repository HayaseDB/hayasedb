<script setup lang="ts">
import { en } from '@nuxt/ui/locale'

useHead({
  titleTemplate: (title) => (title ? `${title} · HayaseDB` : 'HayaseDB'),
})
</script>

<template>
  <UApp :locale="en">
    <NuxtLoadingIndicator color="var(--ui-primary)" :height="2" />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
