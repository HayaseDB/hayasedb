<script setup lang="ts">
import { en } from '@nuxt/ui/locale'

useHead({
  titleTemplate: '%s · HayaseDB Admin',
})

useSeoMeta({
  robots: 'noindex, nofollow',
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
