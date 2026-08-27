<script setup lang="ts">
import type { NuxtError } from '#app'
import { en } from '@nuxt/ui/locale'

const props = defineProps<{ error: NuxtError }>()

useSeoMeta({
  title: () =>
    props.error.statusCode === 404 ? 'Page not found' : 'Something went wrong',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <UApp :locale="en">
    <UError :error="error" />
  </UApp>
</template>
