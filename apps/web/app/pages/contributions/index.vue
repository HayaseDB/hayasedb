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
      v-if="pending && !items.length"
      class="border-default divide-default divide-y rounded-lg border"
    >
      <div v-for="n in 3" :key="n" class="flex items-center gap-3 px-4 py-3">
        <USkeleton class="h-5 w-24 rounded-full" />
        <USkeleton class="h-4 flex-1" />
        <USkeleton class="h-4 w-20" />
      </div>
    </div>
    <div
      v-else-if="items.length"
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
        <UBadge
          :label="String(item.changeCount)"
          color="neutral"
          variant="subtle"
          size="sm"
        />
        <UTooltip :text="formatDateTime(item.submittedAt)">
          <span class="text-muted text-xs">
            {{ formatRelativeTime(item.submittedAt) }}
          </span>
        </UTooltip>
      </NuxtLink>
    </div>
    <UEmpty
      v-else
      icon="i-lucide-git-pull-request-arrow"
      title="No contributions yet"
      description="Found something missing or wrong? Add or correct an entry and it goes to review."
      :actions="[
        {
          label: 'Add an anime',
          to: '/contribute/new',
          icon: 'i-lucide-plus',
          variant: 'subtle',
        },
      ]"
    />

    <div v-if="total > pageSize" class="mt-6 flex justify-center">
      <UPagination
        v-model:page="page"
        :total="total"
        :items-per-page="pageSize"
      />
    </div>
  </UContainer>
</template>
