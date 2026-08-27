<script setup lang="ts">
import { LazyConfirmModal } from '#components'

interface ApiKeyUsage {
  used: number
  limit?: number | null
  remaining?: number | null
  windowMs: number
  resetsAt?: Date | string | null
}

interface ApiKeyRateLimit {
  enabled: boolean
  max?: number | null
  windowMs: number
}

interface ApiKeyRow {
  id: string
  name?: string | null
  start?: string | null
  enabled?: boolean | null
  rateLimit?: ApiKeyRateLimit | null
  usage?: ApiKeyUsage | null
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

function windowLabel(windowMs: number) {
  const seconds = Math.round(windowMs / 1000)
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600
    return hours === 1 ? 'hour' : `${hours} hours`
  }
  if (seconds % 60 === 0) {
    const minutes = seconds / 60
    return minutes === 1 ? 'minute' : `${minutes} minutes`
  }
  return seconds === 1 ? 'second' : `${seconds} seconds`
}

const rows = computed(() =>
  props.keys.map((key) => {
    const limit = key.usage?.limit ?? key.rateLimit?.max ?? null
    const usage = key.usage && limit ? { ...key.usage, limit } : undefined

    const percent = usage
      ? Math.min(100, Math.round((usage.used / usage.limit) * 100))
      : 0

    const expired = isExpired(key)
    const revoked = key.enabled === false

    return {
      key,
      usage,
      percent,
      status: revoked
        ? ({ label: 'Disabled', color: 'neutral' } as const)
        : expired
          ? ({ label: 'Expired', color: 'error' } as const)
          : ({ label: 'Active', color: 'success' } as const),
      inactive: revoked || expired,
      color:
        percent >= 100
          ? ('error' as const)
          : percent >= 80
            ? ('warning' as const)
            : ('primary' as const),
    }
  }),
)
</script>

<template>
  <ul class="border-default divide-default divide-y rounded-lg border">
    <li
      v-for="row in rows"
      :key="row.key.id"
      class="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-6"
    >
      <div class="flex min-w-0 flex-1 gap-3">
        <span
          class="bg-elevated text-dimmed mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md"
          aria-hidden="true"
        >
          <UIcon name="i-lucide-key-round" class="size-4" />
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              class="text-highlighted truncate text-sm font-medium"
              :class="row.inactive && 'line-through'"
            >
              {{ row.key.name ?? 'Unnamed key' }}
            </span>
            <UBadge
              :label="row.status.label"
              :color="row.status.color"
              variant="subtle"
              size="sm"
            />
          </div>

          <p class="text-muted mt-1 font-mono text-xs">
            {{ row.key.start ?? '••••' }}&hellip;
          </p>

          <dl
            class="text-muted mt-2 flex flex-col gap-x-4 gap-y-1 text-xs sm:flex-row sm:flex-wrap"
          >
            <div class="flex gap-1">
              <dt class="text-dimmed">Last used</dt>
              <dd>
                <NuxtTime
                  v-if="row.key.lastRequest"
                  :datetime="row.key.lastRequest"
                  relative
                  locale="en"
                />
                <template v-else>Never</template>
              </dd>
            </div>
            <div class="flex gap-1">
              <dt class="text-dimmed">Created</dt>
              <dd>
                <NuxtTime :datetime="row.key.createdAt" relative locale="en" />
              </dd>
            </div>
            <div class="flex gap-1">
              <dt class="text-dimmed">Expires</dt>
              <dd>
                <NuxtTime
                  v-if="row.key.expiresAt"
                  :datetime="row.key.expiresAt"
                  date-style="medium"
                  locale="en"
                />
                <template v-else>Never</template>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="sm:w-48 sm:shrink-0">
        <template v-if="row.usage">
          <div class="flex items-baseline justify-between gap-2">
            <span class="text-highlighted text-sm font-medium tabular-nums">
              {{ row.usage.used }}
              <span class="text-muted font-normal">
                / {{ row.usage.limit }}
              </span>
            </span>
            <span class="text-dimmed text-xs">
              per {{ windowLabel(row.usage.windowMs) }}
            </span>
          </div>

          <UProgress
            :model-value="row.usage.used"
            :max="row.usage.limit"
            :color="row.inactive ? 'neutral' : row.color"
            size="sm"
            class="mt-2"
            :aria-label="`Rate limit usage for ${row.key.name ?? 'this API key'}`"
          />

          <p class="text-dimmed mt-1.5 text-xs">
            <template v-if="row.usage.resetsAt">
              Resets
              <NuxtTime :datetime="row.usage.resetsAt" relative locale="en" />
            </template>
            <template v-else>
              {{ row.usage.limit }} requests available
            </template>
          </p>
        </template>

        <p v-else class="text-dimmed text-xs">No request limit</p>
      </div>

      <UButton
        color="error"
        variant="ghost"
        size="sm"
        icon="i-lucide-trash-2"
        label="Delete"
        :disabled="loading"
        :aria-label="`Delete ${row.key.name ?? 'this API key'}`"
        class="self-start max-sm:-ml-2"
        @click="askDelete(row.key)"
      />
    </li>
  </ul>
</template>
