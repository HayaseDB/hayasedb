<script setup lang="ts">
const config = useRuntimeConfig()

const { data, error } = await useAsyncData('ping', () =>
  makeClient(config.public.apiUrl).ping({ message: 'hello from web' }),
)
</script>

<template>
  <UContainer class="py-10">
    <DemoCard title="oRPC ping (shared contract)">
      <p v-if="error" class="text-error">
        Failed to reach the API: {{ error.message }}
      </p>
      <pre v-else class="text-sm">{{ data }}</pre>
    </DemoCard>
  </UContainer>
</template>
