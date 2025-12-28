<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'

  interface Props {
    duration?: number
    direction?: 'up' | 'down'
    repeat?: number
    class?: HTMLAttributes['class']
  }

  const props = withDefaults(defineProps<Props>(), {
    duration: 30,
    direction: 'up',
    repeat: 4,
    class: undefined,
  })

  const animationStyle = computed(() => ({
    '--scroll-duration': `${props.duration}s`,
  }))
</script>

<template>
  <div :class="cn('h-full overflow-hidden', props.class)">
    <div
      class="flex flex-col gap-4 pb-4 will-change-transform"
      :class="[direction === 'up' ? 'animate-scroll-up' : 'animate-scroll-down']"
      :style="animationStyle"
    >
      <template v-for="i in repeat" :key="i">
        <slot />
      </template>
    </div>
  </div>
</template>

<style scoped>
  .animate-scroll-up {
    animation: scroll-up var(--scroll-duration, 30s) linear infinite;
  }

  .animate-scroll-down {
    animation: scroll-down var(--scroll-duration, 30s) linear infinite;
  }

  @keyframes scroll-up {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-50%);
    }
  }

  @keyframes scroll-down {
    from {
      transform: translateY(-50%);
    }
    to {
      transform: translateY(0);
    }
  }
</style>
