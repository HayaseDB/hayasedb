<script setup lang="ts">
  import AppNavbar from '@/components/navbar/AppNavbar.vue'
</script>

<template>
  <div class="bg-background text-foreground min-h-screen antialiased">
    <AppNavbar />
    <main>
      <slot />
    </main>
  </div>
</template>
