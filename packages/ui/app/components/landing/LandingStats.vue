<script setup lang="ts">
import NumberFlow, { NumberFlowGroup } from '@number-flow/vue'
import { useInView } from 'motion-v'

interface LandingStat {
  label: string
  value: number
}

const props = defineProps<{
  stats: LandingStat[]
}>()

const root = useTemplateRef<HTMLElement>('root')
const inView = useInView(root, { once: true, amount: 0.3 })

const items = computed(() =>
  props.stats.map((stat: LandingStat, index: number) => ({
    ...stat,
    delay: index * 0.08,
  })),
)
</script>

<template>
  <div ref="root" class="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
    <NumberFlowGroup>
      <MotionReveal
        v-for="stat in items"
        :key="stat.label"
        pop
        :delay="stat.delay"
      >
        <p class="text-highlighted text-4xl font-bold tabular-nums sm:text-5xl">
          <NumberFlow :value="inView ? stat.value : 0" locales="en-US" />
        </p>
        <p class="text-muted mt-1 text-sm">{{ stat.label }}</p>
      </MotionReveal>
    </NumberFlowGroup>
  </div>
</template>
