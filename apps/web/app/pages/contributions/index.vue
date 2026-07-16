<script setup lang="ts">
const { items, total, page, pageSize, pending } = useMyContributions()

useSeoMeta({ title: 'My contributions' })
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-highlighted text-2xl font-semibold">
          My contributions
        </h1>
        <p class="text-muted text-sm">
          Everything you have submitted for review.
        </p>
      </div>
      <UButton to="/contribute/new" icon="i-lucide-plus" label="Add anime" />
    </div>

    <div
      v-if="items.length"
      class="border-default divide-default divide-y rounded-lg border"
    >
      <NuxtLink
        v-for="item in items"
        :key="item.id"
        :to="`/contributions/${item.id}`"
        class="hover:bg-elevated/50 flex flex-wrap items-center gap-3 px-4 py-3 transition"
      >
        <ChangesetStatusBadge :status="item.status" />
        <span class="text-highlighted min-w-0 flex-1 truncate font-medium">
          {{ item.summary }}
        </span>
        <span class="text-muted truncate text-sm">
          {{ item.entityLabels.join(', ') }}
        </span>
        <span class="text-muted text-xs">
          {{ formatDateTime(item.submittedAt) }}
        </span>
      </NuxtLink>
    </div>
    <UPageCard v-else-if="!pending" variant="subtle">
      <div class="flex flex-col items-center gap-3 py-8 text-center">
        <UIcon
          name="i-lucide-git-pull-request-arrow"
          class="text-muted size-8"
        />
        <p class="text-muted text-sm">
          You haven't submitted anything yet. Found something missing or wrong?
        </p>
        <UButton to="/contribute/new" label="Add an anime" variant="soft" />
      </div>
    </UPageCard>

    <div v-if="total > pageSize" class="mt-6 flex justify-center">
      <UPagination
        v-model:page="page"
        :total="total"
        :items-per-page="pageSize"
      />
    </div>
  </UContainer>
</template>
