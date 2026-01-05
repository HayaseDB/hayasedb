<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import type { AlertVariants } from '.'
  import { cn } from '@/utils/cn'
  import { alertVariants } from '.'

  interface Props {
    variant?: AlertVariants['variant']
    class?: HTMLAttributes['class']
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    class: undefined,
  })
</script>

<template>
  <div role="alert" data-slot="alert" :class="cn(alertVariants({ variant }), props.class)">
    <slot />
  </div>
</template>
