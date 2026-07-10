<script setup lang="ts">
import { en } from '@nuxt/ui/locale'
</script>

<template>
  <UApp :locale="en">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
