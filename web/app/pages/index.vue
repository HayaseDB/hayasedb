<script setup lang="ts">
  definePageMeta({
    layout: 'default',
  })

  useSeoMeta({
    title: 'Home',
    description: 'Welcome to HayaseDB',
  })
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold">HayaseDB</h1>
      <p class="text-muted-foreground mt-2">Database for anime/manga</p>
      <div class="mt-6 flex justify-center gap-4">
        <NuxtLink
          to="/auth/login"
          class="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
        >
          Sign In
        </NuxtLink>
        <NuxtLink
          to="/auth/register"
          class="bg-secondary text-secondary-foreground rounded-md px-4 py-2 text-sm font-medium"
        >
          Sign Up
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
