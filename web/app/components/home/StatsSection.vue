<script setup lang="ts">
  import type { StatsResponse } from '#shared/types'
  import { Card, CardContent } from '@/components/ui/card'
  import { Skeleton } from '@/components/ui/skeleton'

  const { data, status } = await useFetch<StatsResponse>('/api/stats', {
    server: false,
  })

  const stats = computed(() => [
    { label: 'Users', value: data.value?.totalUsers ?? 0 },
    { label: 'Animes', value: data.value?.totalAnimes ?? 0 },
    { label: 'Media', value: data.value?.totalMedia ?? 0 },
    { label: 'Requests', value: data.value?.totalRequests ?? 0 },
  ])

  function formatNumber(num: number): string {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}k`
    return num.toString()
  }
</script>

<template>
  <section class="px-4 py-12 sm:py-16">
    <div class="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      <Card v-for="stat in stats" :key="stat.label" class="text-center">
        <CardContent class="p-4 sm:p-6">
          <template v-if="status === 'pending'">
            <Skeleton class="mx-auto mb-2 h-8 w-16 sm:h-10 sm:w-20" />
            <Skeleton class="mx-auto h-4 w-12 sm:w-16" />
          </template>
          <template v-else>
            <p class="text-primary text-2xl font-bold sm:text-3xl md:text-4xl">
              {{ formatNumber(stat.value) }}
            </p>
            <p class="text-muted-foreground text-xs sm:text-sm">
              {{ stat.label }}
            </p>
          </template>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
