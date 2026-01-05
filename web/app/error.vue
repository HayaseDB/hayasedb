<script setup lang="ts">
  import type { NuxtError } from '#app'
  import { Button } from '@/components/ui/button'

  const props = defineProps<{
    error: NuxtError
  }>()

  const errorTitle = computed(() => {
    switch (props.error.statusCode) {
      case 404:
        return 'Page not found'
      case 500:
        return 'Server error'
      case 403:
        return 'Access denied'
      default:
        return 'An error occurred'
    }
  })

  const errorDescription = computed(() => {
    return props.error.statusMessage || props.error.message || 'Something went wrong'
  })

  const handleClearError = () => clearError({ redirect: '/' })

  useHead({
    title: errorTitle,
  })
</script>

<template>
  <div class="bg-background text-foreground flex min-h-screen items-center justify-center">
    <main class="text-center" role="main">
      <p class="text-muted-foreground text-sm font-medium">{{ error.statusCode }}</p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{{ errorTitle }}</h1>
      <p class="text-muted-foreground mt-4 text-base">{{ errorDescription }}</p>
      <div class="mt-6">
        <Button @click="handleClearError">Go back home</Button>
      </div>
    </main>
  </div>
</template>
