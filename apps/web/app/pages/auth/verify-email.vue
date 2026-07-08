<script setup lang="ts">
const route = useRoute()
const { loading, verifyEmail } = useAuthActions()

const token = computed(() => {
  const value = route.query.token
  return typeof value === 'string' ? value : ''
})

const verified = ref(false)

onMounted(async () => {
  if (!token.value) return
  verified.value = await verifyEmail(token.value)
})
</script>

<template>
  <AuthCard>
    <div class="flex flex-col items-center gap-4 text-center">
      <template v-if="!token">
        <UIcon name="i-lucide-triangle-alert" class="text-error size-8" />
        <p class="text-highlighted font-medium">Invalid verification link</p>
        <p class="text-muted text-sm">
          This link is missing its token. Request a new verification email and
          try again.
        </p>
      </template>

      <template v-else-if="loading">
        <UIcon
          name="i-lucide-loader-circle"
          class="text-primary size-8 animate-spin"
        />
        <p class="text-muted text-sm">Verifying your email…</p>
      </template>

      <template v-else-if="verified">
        <UIcon name="i-lucide-circle-check" class="text-success size-8" />
        <p class="text-highlighted font-medium">Email verified</p>
        <p class="text-muted text-sm">Your account is ready to go.</p>
        <UButton to="/" label="Continue" color="primary" block />
      </template>

      <template v-else>
        <UIcon name="i-lucide-circle-x" class="text-error size-8" />
        <p class="text-highlighted font-medium">Verification failed</p>
        <p class="text-muted text-sm">This link is invalid or has expired.</p>
        <UButton to="/login" label="Back to sign in" variant="subtle" block />
      </template>
    </div>
  </AuthCard>
</template>
