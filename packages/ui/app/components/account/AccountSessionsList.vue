<script setup lang="ts">
import type { AccountSessionRow } from '@hayasedb/contract'
import { LazyConfirmModal } from '#components'

const props = withDefaults(
  defineProps<{
    sessions?: AccountSessionRow[]
    currentToken?: string | null
    loading?: boolean
    onRevoke?: (token: string) => unknown
    onRevokeOthers?: () => unknown
  }>(),
  {
    sessions: () => [],
    currentToken: null,
    loading: false,
    onRevoke: undefined,
    onRevokeOthers: undefined,
  },
)

const hasOthers = computed(() =>
  props.sessions.some(
    (session: AccountSessionRow) => session.token !== props.currentToken,
  ),
)

const overlay = useOverlay()
const confirmModal = overlay.create(LazyConfirmModal)

function askRevoke(token: string) {
  confirmModal.open({
    title: 'Revoke this session?',
    description: 'This device will be signed out immediately.',
    confirmLabel: 'Revoke',
    onConfirm: () => props.onRevoke?.(token),
  })
}

function askRevokeOthers() {
  confirmModal.open({
    title: 'Sign out other devices?',
    description: 'All devices except this one will be signed out.',
    confirmLabel: 'Sign out others',
    onConfirm: () => props.onRevokeOthers?.(),
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
          label="Sign out others"
          :disabled="!hasOthers || loading"
          @click="askRevokeOthers"
        />
      </div>
      <p class="text-muted mt-1 text-sm">
        Devices currently signed in to your account.
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
                <UBadge
                  v-if="session.token === currentToken"
                  color="primary"
                  variant="subtle"
                  size="sm"
                  label="This device"
                />
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
              :disabled="session.token === currentToken || loading"
              @click="askRevoke(session.token)"
            />
          </div>
        </template>
      </div>

      <p v-else class="text-muted text-sm">No active sessions.</p>
    </div>
  </div>
</template>
