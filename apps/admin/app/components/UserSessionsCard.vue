<script setup lang="ts">
import { LazyConfirmModal } from '#components'
import type { AdminUserSession } from '@hayasedb/auth/client'

const props = withDefaults(
  defineProps<{
    sessions?: AdminUserSession[]
    loading?: boolean
    onRevoke?: (token: string) => unknown
    onRevokeAll?: () => unknown
  }>(),
  {
    sessions: () => [],
    loading: false,
    onRevoke: undefined,
    onRevokeAll: undefined,
  },
)

const overlay = useOverlay()
const confirmModal = overlay.create(LazyConfirmModal)

function askRevoke(token: string) {
  confirmModal.open({
    title: 'Revoke this session?',
    description: 'The user will be signed out on this device immediately.',
    confirmLabel: 'Revoke',
    onConfirm: () => props.onRevoke?.(token),
  })
}

function askRevokeAll() {
  confirmModal.open({
    title: 'Revoke all sessions?',
    description: 'The user will be signed out on every device.',
    confirmLabel: 'Revoke all',
    onConfirm: () => props.onRevokeAll?.(),
  })
}
</script>

<template>
  <div class="grid gap-x-12 gap-y-4 lg:grid-cols-3">
    <div class="lg:col-span-1">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-highlighted text-sm font-medium">Active sessions</h3>
        <UButton
          color="neutral"
          variant="subtle"
          size="xs"
          icon="i-lucide-log-out"
          label="Revoke all"
          :disabled="!sessions.length || loading"
          @click="askRevokeAll"
        />
      </div>
      <p class="text-muted mt-1 text-sm">
        Devices currently signed in to this account.
      </p>
    </div>

    <div class="lg:col-span-2">
      <div v-if="sessions.length" class="flex flex-col">
        <template v-for="(session, index) in sessions" :key="session.id">
          <USeparator v-if="Number(index) > 0" />
          <div class="flex items-center justify-between gap-4 py-3 first:pt-0">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-monitor"
                  class="text-dimmed size-4 shrink-0"
                />
                <span class="text-highlighted truncate text-sm font-medium">
                  {{ describeDevice(session.userAgent) }}
                </span>
              </div>
              <p class="text-muted mt-0.5 text-xs">
                <template v-if="session.ipAddress">
                  {{ session.ipAddress }} -
                </template>
                <NuxtTime
                  :datetime="session.createdAt"
                  date-style="medium"
                  time-style="short"
                />
              </p>
            </div>

            <UButton
              color="error"
              variant="ghost"
              size="sm"
              icon="i-lucide-trash-2"
              label="Revoke"
              :disabled="loading"
              @click="askRevoke(session.token)"
            />
          </div>
        </template>
      </div>

      <p v-else class="text-muted text-sm">No active sessions.</p>
    </div>
  </div>
</template>
