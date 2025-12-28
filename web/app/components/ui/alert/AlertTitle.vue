<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'

  interface Props {
    class?: HTMLAttributes['class']
  }

  const props = withDefaults(defineProps<Props>(), {
    class: undefined,
  })
</script>

<template>
  <h5
    data-slot="alert-title"
    :class="cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', props.class)"
  >
    <slot />
  </h5>
</template>
