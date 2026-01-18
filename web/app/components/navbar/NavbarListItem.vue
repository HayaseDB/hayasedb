<script setup lang="ts">
  import type { Component } from 'vue'
  import { NavigationMenuLink } from '@/components/ui/navigation-menu'
  import { cn } from '@/utils/cn'

  defineProps<{
    to: string
    title: string
    icon?: Component
    class?: string
  }>()
</script>

<template>
  <li>
    <NavigationMenuLink as-child>
      <NuxtLink
        :to="to"
        :class="
          cn(
            'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none',
            $props.class,
          )
        "
      >
        <div class="flex items-center gap-2">
          <component :is="icon" v-if="icon" class="size-4" />
          <div class="text-sm leading-none font-medium">{{ title }}</div>
        </div>
        <p class="text-muted-foreground line-clamp-2 text-sm leading-snug">
          <slot />
        </p>
      </NuxtLink>
    </NavigationMenuLink>
  </li>
</template>
