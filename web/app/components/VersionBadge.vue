<script setup lang="ts">
  const config = useRuntimeConfig()

  const versionDisplay = computed(() => {
    const version = config.public.version
    const semverRegex = /^\d+\.\d+\.\d+/
    return semverRegex.test(version) ? `v${version}` : version
  })
</script>

<template>
  <span class="version-badge">
    {{ versionDisplay }}
  </span>
</template>

<style scoped>
  .version-badge {
    position: fixed;
    bottom: 0.75rem;
    left: 1rem;
    font-size: 0.75rem;
    color: oklch(0.6 0 0);
    opacity: 0.4;
    transition: opacity 0.2s ease;
    z-index: 50;
    user-select: none;
  }

  .version-badge:hover {
    opacity: 1;
  }
</style>
