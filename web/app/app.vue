<script setup lang="ts">
  import { Toaster } from '@/components/ui/sonner'
  import 'vue-sonner/style.css'
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
    <Toaster rich-colors position="bottom-right" theme="system" :duration="4000" />
  </NuxtLayout>
</template>
