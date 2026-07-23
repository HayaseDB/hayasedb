<script setup lang="ts">
import { Motion, useReducedMotion } from 'motion-v'

const props = withDefaults(
  defineProps<{
    delay?: number
    pop?: boolean
  }>(),
  { delay: 0, pop: false },
)

const reducedMotion = useReducedMotion()

const initial = computed(() => {
  if (reducedMotion.value) return false
  return props.pop ? { opacity: 0, y: 20, scale: 0.94 } : { opacity: 0, y: 24 }
})

const target = computed(() =>
  props.pop ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0 },
)

const transition = computed(() =>
  props.pop
    ? {
        type: 'spring' as const,
        stiffness: 260,
        damping: 22,
        delay: props.delay,
      }
    : { duration: 0.5, ease: 'easeOut' as const, delay: props.delay },
)
</script>

<template>
  <Motion
    :initial="initial"
    :while-in-view="target"
    :in-view-options="{ once: true, amount: 0.2 }"
    :transition="transition"
  >
    <slot />
  </Motion>
</template>
