<script setup lang="ts">
  import { Moon, Sun } from 'lucide-vue-next'
  import { Button } from '@/components/ui/button'

  const colorMode = useColorMode()

  const toggleTheme = () => {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
</script>

<template>
  <Button variant="ghost" size="icon" @click="toggleTheme">
    <ClientOnly>
      <Sun v-if="colorMode.value === 'dark'" class="size-5" />
      <Moon v-else class="size-5" />
      <template #fallback>
        <div class="size-5" />
      </template>
    </ClientOnly>
    <span class="sr-only">Toggle theme</span>
  </Button>
</template>
