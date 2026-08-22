<script setup lang="ts">
import { LazyConfirmModal } from '#components'

interface ApiKeyRow {
  id: string
  name?: string | null
  start?: string | null
  enabled?: boolean | null
  createdAt: Date | string
  expiresAt?: Date | string | null
  lastRequest?: Date | string | null
}

const props = withDefaults(
  defineProps<{
    keys?: ApiKeyRow[]
    loading?: boolean
    onDelete?: (keyId: string) => unknown
  }>(),
  {
    keys: () => [],
    loading: false,
    onDelete: undefined,
  },
)

const overlay = useOverlay()
const confirmModal = overlay.create(LazyConfirmModal)

function askDelete(key: ApiKeyRow) {
  confirmModal.open({
    title: `Delete ${key.name ?? 'this API key'}?`,
    description:
      'Requests using this key will stop working immediately. This cannot be undone.',
    confirmLabel: 'Delete',
    onConfirm: () => props.onDelete?.(key.id),
  })
}

const isExpired = (key: ApiKeyRow) =>
  key.expiresAt != null && new Date(key.expiresAt).getTime() < Date.now()
</script>

<template>
  <div class="border-default divide-default divide-y rounded-lg border">
    <div
      v-for="key in keys"
      :key="key.id"
      class="flex flex-wrap items-center gap-3 px-4 py-3"
    >
      <UIcon name="i-lucide-key-round" class="text-dimmed size-4 shrink-0" />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="text-highlighted truncate text-sm font-medium">
            {{ key.name ?? 'Unnamed key' }}
          </span>
          <UBadge
            v-if="key.enabled === false"
            label="Disabled"
            color="neutral"
            variant="subtle"
            size="sm"
          />
          <UBadge
            v-else-if="isExpired(key)"
            label="Expired"
            color="error"
            variant="subtle"
            size="sm"
          />
        </div>
        <p class="text-muted mt-0.5 font-mono text-xs">
          <template v-if="key.start">{{ key.start }}&hellip;</template>
          <template v-else>&hellip;</template>
        </p>
      </div>
      <span class="text-muted text-xs">
        <template v-if="key.lastRequest">
          Last used
          <NuxtTime :datetime="key.lastRequest" relative locale="en" />
        </template>
        <template v-else>Never used</template>
      </span>
      <UTooltip>
        <span class="text-muted text-xs">
          Created
          <NuxtTime :datetime="key.createdAt" relative locale="en" />
        </span>
        <template #content>
          <span v-if="key.expiresAt" class="text-xs">
            Expires
            <NuxtTime
              :datetime="key.expiresAt"
              date-style="medium"
              time-style="short"
              locale="en"
            />
          </span>
          <span v-else class="text-xs">Never expires</span>
        </template>
      </UTooltip>
      <UButton
        color="error"
        variant="ghost"
        size="sm"
        icon="i-lucide-trash-2"
        aria-label="Delete API key"
        :disabled="loading"
        @click="askDelete(key)"
      />
    </div>
  </div>
</template>
