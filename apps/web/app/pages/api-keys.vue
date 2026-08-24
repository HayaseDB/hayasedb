<script setup lang="ts">
import { LazyApiKeyCreateModal, LazyApiKeyCreatedModal } from '#components'

const { keys, pending, refresh } = await useApiKeys()
const { loading, createKey, deleteKey } = useApiKeyActions()

const overlay = useOverlay()
const createModal = overlay.create(LazyApiKeyCreateModal)
const createdModal = overlay.create(LazyApiKeyCreatedModal)

function openCreateModal() {
  createModal.open({
    onCreate: async (input: CreateApiKeyInput) => {
      const created = await createKey(input)
      if (!created) return false
      await refresh()
      createdModal.open({ apiKey: created.key, docsUrl: '/docs' })
      return true
    },
  })
}

async function onDelete(keyId: string) {
  const deleted = await deleteKey(keyId)
  if (deleted) await refresh()
}

useSeoMeta({ title: 'API keys' })
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-highlighted text-2xl font-semibold">API keys</h1>
        <p class="text-muted text-sm">
          A key is required to reach the HayaseDB API from your own
          applications. Send it as the x-api-key header to get your own rate
          limit of 60 requests per minute.
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="Create key"
        @click="openCreateModal"
      />
    </div>

    <div
      v-if="pending && !keys.length"
      class="border-default divide-default divide-y rounded-lg border"
    >
      <div v-for="n in 3" :key="n" class="flex items-center gap-3 px-4 py-3">
        <USkeleton class="size-5 rounded-full" />
        <USkeleton class="h-4 flex-1" />
        <USkeleton class="h-4 w-20" />
      </div>
    </div>
    <ApiKeysList
      v-else-if="keys.length"
      :keys="keys"
      :loading="loading"
      :on-delete="onDelete"
    />
    <UEmpty
      v-else
      icon="i-lucide-key-round"
      title="No API keys yet"
      description="Requests to the API are rejected without one. Create a key to start fetching anime data."
      :actions="[
        {
          label: 'Create key',
          icon: 'i-lucide-plus',
          variant: 'subtle',
          onClick: openCreateModal,
        },
      ]"
    />
  </UContainer>
</template>
