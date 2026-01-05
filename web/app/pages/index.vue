<script setup lang="ts">
  import { Button } from '@/components/ui/button'

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
        <Button as-child>
          <NuxtLink to="/auth/login">Sign In</NuxtLink>
        </Button>
        <Button as-child variant="secondary">
          <NuxtLink to="/auth/register">Sign Up</NuxtLink>
        </Button>
      </div>
    </div>
  </div>
</template>
