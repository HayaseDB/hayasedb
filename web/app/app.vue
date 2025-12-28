<script setup lang="ts">
  import { Toaster } from '@/components/ui/sonner'
  import { LoadingOverlay } from '@/components/ui/loading-overlay'
  import 'vue-sonner/style.css'

  const colorMode = useColorMode()

  const toastTheme = computed<'light' | 'dark'>(() => {
    return colorMode.value === 'light' ? 'light' : 'dark'
  })

  const { isLoading } = useLoadingIndicator()
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
    <ClientOnly>
      <Toaster rich-colors position="bottom-right" :theme="toastTheme" :duration="4000" />
    </ClientOnly>
  </NuxtLayout>
  <LoadingOverlay :is-loading="isLoading" />
</template>
