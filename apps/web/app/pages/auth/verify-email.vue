<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { verifyEmail } = useAuthActions()
const { loading: resending, resendVerification } = useAccountActions()

const token = computed(() => {
  const value = route.query.token
  return typeof value === 'string' ? value : ''
})

const { data: session } = await useAppSession()
const email = computed(() => session.value?.user?.email ?? null)

type Status = 'missing' | 'verifying' | 'success' | 'error'
const status = ref<Status>(token.value ? 'verifying' : 'missing')

onMounted(async () => {
  if (!token.value) return
  const ok = await verifyEmail(token.value)
  status.value = ok ? 'success' : 'error'
  if (ok) await refreshNuxtData('app-session')
})

function onResend() {
  if (email.value) void resendVerification(email.value)
}

async function onContinue() {
  await refreshNuxtData('app-session')
  await router.push('/')
}
</script>

<template>
  <AuthCard>
    <div class="flex flex-col items-center gap-4 text-center">
      <template v-if="status === 'missing'">
        <UIcon name="i-lucide-triangle-alert" class="text-error size-8" />
        <p class="text-highlighted font-medium">Invalid verification link</p>
        <p class="text-muted text-sm">
          This link is missing its token. Request a new verification email and
          try again.
        </p>
        <UButton to="/login" label="Back to sign in" variant="subtle" block />
      </template>

      <template v-else-if="status === 'verifying'">
        <UIcon
          name="i-lucide-loader-circle"
          class="text-primary size-8 animate-spin"
        />
        <p class="text-muted text-sm">Verifying your email…</p>
      </template>

      <template v-else-if="status === 'success'">
        <UIcon name="i-lucide-circle-check" class="text-success size-8" />
        <p class="text-highlighted font-medium">Email verified</p>
        <p class="text-muted text-sm">Your account is ready to go.</p>
        <UButton label="Continue" color="primary" block @click="onContinue" />
      </template>

      <template v-else>
        <UIcon name="i-lucide-circle-x" class="text-error size-8" />
        <p class="text-highlighted font-medium">Verification failed</p>
        <p class="text-muted text-sm">This link is invalid or has expired.</p>
        <UButton
          v-if="email"
          label="Resend verification email"
          color="primary"
          block
          :loading="resending"
          @click="onResend"
        />
        <UButton to="/login" label="Back to sign in" variant="subtle" block />
      </template>
    </div>
  </AuthCard>
</template>
