<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/utils/cn'

  interface Props {
    class?: HTMLAttributes['class']
  }

  const props = withDefaults(defineProps<Props>(), {
    class: undefined,
  })
</script>

<template>
  <div
    data-slot="alert-description"
    :class="
      cn('col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed', props.class)
    "
  >
    <slot />
  </div>
</template>
