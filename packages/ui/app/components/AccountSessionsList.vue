<script setup lang="ts">
import type { AccountSessionRow } from '@hayasedb/contract'

const props = withDefaults(
  defineProps<{
    sessions?: AccountSessionRow[]
    currentToken?: string | null
    loading?: boolean
  }>(),
  {
    sessions: () => [],
    currentToken: null,
    loading: false,
  },
)

const emit = defineEmits<{
  revoke: [token: string]
  'revoke-others': []
}>()

const hasOthers = computed(() =>
  props.sessions.some(
    (session: AccountSessionRow) => session.token !== props.currentToken,
  ),
)

const confirmOpen = ref(false)
const pendingToken = ref<string | null>(null)
const revokingOthers = ref(false)

function askRevoke(token: string) {
  pendingToken.value = token
  revokingOthers.value = false
  confirmOpen.value = true
}

function askRevokeOthers() {
  pendingToken.value = null
  revokingOthers.value = true
  confirmOpen.value = true
}

function onConfirm() {
  if (revokingOthers.value) {
    emit('revoke-others')
  } else if (pendingToken.value) {
    emit('revoke', pendingToken.value)
  }
  confirmOpen.value = false
}

function describeDevice(userAgent?: string | null): string {
  if (!userAgent) return 'Unknown device'
  const browser = /Edg/.test(userAgent)
    ? 'Edge'
    : /OPR|Opera/.test(userAgent)
      ? 'Opera'
      : /Chrome/.test(userAgent)
        ? 'Chrome'
        : /Firefox/.test(userAgent)
          ? 'Firefox'
          : /Safari/.test(userAgent)
            ? 'Safari'
            : 'Browser'
  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /Mac OS|Macintosh/.test(userAgent)
      ? 'macOS'
      : /Android/.test(userAgent)
        ? 'Android'
        : /iPhone|iPad|iOS/.test(userAgent)
          ? 'iOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'Unknown OS'
  return `${browser} on ${os}`
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
                  {{ session.ipAddress }} ·
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

    <AccountConfirmModal
      v-model:open="confirmOpen"
      :title="
        revokingOthers ? 'Sign out other devices?' : 'Revoke this session?'
      "
      :description="
        revokingOthers
          ? 'All devices except this one will be signed out.'
          : 'This device will be signed out immediately.'
      "
      :confirm-label="revokingOthers ? 'Sign out others' : 'Revoke'"
      :loading="loading"
      @confirm="onConfirm"
    />
  </div>
</template>
