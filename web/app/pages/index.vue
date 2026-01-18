<script setup lang="ts">
  definePageMeta({
    layout: 'default',
  })

  useSeoMeta({
    title: 'Home',
    description:
      'HayaseDB - A free, open source anime database with a powerful API for developers.',
  })
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)]">
    <HomeHeroSection />
    <HomeStatsSection />
    <HomeTeamSection />
  </div>
</template>
