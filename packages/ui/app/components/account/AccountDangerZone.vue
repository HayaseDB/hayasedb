<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    loading?: boolean
    onSignOut?: () => unknown
    onDeleteAccount?: () => unknown
  }>(),
  {
    loading: false,
    onSignOut: undefined,
    onDeleteAccount: undefined,
  },
)

const confirmOpen = ref(false)

function askDelete() {
  confirmOpen.value = true
}

function onConfirm() {
  props.onDeleteAccount?.()
  confirmOpen.value = false
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid gap-x-12 gap-y-4 lg:grid-cols-3">
      <div class="lg:col-span-1">
        <h3 class="text-highlighted text-sm font-medium">Sign out</h3>
        <p class="text-muted mt-1 text-sm">End your session on this device.</p>
      </div>

      <div class="flex items-start lg:col-span-2 lg:justify-end">
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-lucide-log-out"
          label="Sign out"
          :disabled="loading"
          @click="() => void onSignOut?.()"
        />
      </div>
    </div>

    <USeparator />

    <div class="grid gap-x-12 gap-y-4 lg:grid-cols-3">
      <div class="lg:col-span-1">
        <h3 class="text-highlighted text-sm font-medium">Delete account</h3>
        <p class="text-muted mt-1 text-sm">
          Permanently delete your account and all associated data. This cannot
          be undone.
        </p>
      </div>

      <div class="flex items-start lg:col-span-2 lg:justify-end">
        <UButton
          color="error"
          icon="i-lucide-trash-2"
          label="Delete account"
          :disabled="loading"
          @click="askDelete"
        />
      </div>
    </div>

    <ConfirmModal
      v-model:open="confirmOpen"
      title="Delete your account?"
      description="This permanently deletes your account and all associated data. This action cannot be undone."
      confirm-label="Delete account"
      :loading="loading"
      @confirm="onConfirm"
    />
  </div>
</template>
