<script setup lang="ts">
import type { NuxtError } from '#app'
import { en } from '@nuxt/ui/locale'

defineProps<{ error: NuxtError }>()
</script>

<template>
  <UApp :locale="en">
    <UError :error="error" />
  </UApp>
</template>
