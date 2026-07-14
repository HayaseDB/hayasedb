<script setup lang="ts">
import { en } from '@nuxt/ui/locale'

useHead({
  titleTemplate: (title) =>
    title ? `${title} · HayaseDB Admin` : 'HayaseDB Admin',
})
</script>

<template>
  <UApp :locale="en">
    <NuxtLoadingIndicator />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
