<script setup lang="ts">
const { data: me } = await useAsyncData('admin-me', () => useApiClient().me())
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-xl font-semibold">Admin console</h1>
      <UserMenu />
    </div>

    <UCard>
      <template #header>Signed in as</template>
      <pre class="text-sm">{{ me }}</pre>
    </UCard>
  </UContainer>
</template>
