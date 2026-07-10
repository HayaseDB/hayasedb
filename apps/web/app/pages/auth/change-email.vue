<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const { loading, verifyEmail } = useAuthActions()

const token = computed(() => {
  const value = route.query.token
  return typeof value === 'string' ? value : ''
})

const confirmed = ref(false)

onMounted(async () => {
  if (!token.value) return
  confirmed.value = await verifyEmail(token.value)
})
</script>

<template>
  <AuthCard>
    <div class="flex flex-col items-center gap-4 text-center">
      <template v-if="!token">
        <UIcon name="i-lucide-triangle-alert" class="text-error size-8" />
        <p class="text-highlighted font-medium">Invalid confirmation link</p>
        <p class="text-muted text-sm">
          This link is missing its token or has expired.
        </p>
      </template>

      <template v-else-if="loading">
        <UIcon
          name="i-lucide-loader-circle"
          class="text-primary size-8 animate-spin"
        />
        <p class="text-muted text-sm">Confirming your new email…</p>
      </template>

      <template v-else-if="confirmed">
        <UIcon name="i-lucide-circle-check" class="text-success size-8" />
        <p class="text-highlighted font-medium">Email updated</p>
        <p class="text-muted text-sm">Your new email address is now active.</p>
        <UButton to="/" label="Continue" color="primary" block />
      </template>

      <template v-else>
        <UIcon name="i-lucide-circle-x" class="text-error size-8" />
        <p class="text-highlighted font-medium">Confirmation failed</p>
        <p class="text-muted text-sm">This link is invalid or has expired.</p>
        <UButton to="/" label="Go home" variant="subtle" block />
      </template>
    </div>
  </AuthCard>
</template>
