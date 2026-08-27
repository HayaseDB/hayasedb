<script setup lang="ts">
import { en } from '@nuxt/ui/locale'

useSeoMeta({
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

useSchemaOrg([
  defineOrganization({
    name: 'HayaseDB',
    logo: '/web-app-manifest-512x512.png',
  }),
  defineWebSite({ name: 'HayaseDB' }),
  defineWebPage(),
])

defineOgImage('Default')
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
