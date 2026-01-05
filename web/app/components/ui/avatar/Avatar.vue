<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { AvatarRoot } from 'reka-ui'
  import { cn } from '@/utils/cn'

  const props = defineProps<{
    class?: HTMLAttributes['class']
  }>()
</script>

<template>
  <AvatarRoot
    data-slot="avatar"
    :class="
      cn(
        'border-border relative flex size-8 shrink-0 overflow-hidden rounded-[20%] border',
        props.class,
      )
    "
  >
    <slot />
  </AvatarRoot>
</template>
