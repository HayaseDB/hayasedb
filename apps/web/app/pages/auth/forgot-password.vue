<script setup lang="ts">
import type { ForgotPasswordSchema } from '@hayasedb/contract'

definePageMeta({ layout: false })

useSeoMeta({ title: 'Forgot password' })

const { loading, requestPasswordReset } = useAuthActions()

const sent = ref(false)

async function onSubmit(data: ForgotPasswordSchema) {
  sent.value = await requestPasswordReset(data.email)
}
</script>

<template>
  <AuthCard>
    <div v-if="sent" class="flex flex-col items-center gap-4 text-center">
      <UIcon name="i-lucide-mail-check" class="text-primary size-8" />
      <p class="text-highlighted font-medium">Check your inbox</p>
      <p class="text-muted text-sm">
        If that email is registered, a password reset link is on its way.
      </p>
      <UButton to="/login" label="Back to sign in" variant="subtle" block />
    </div>

    <AuthForgotPasswordForm v-else :loading="loading" :on-submit="onSubmit">
      <template #footer>
        Remembered it?
        <ULink to="/login" class="text-primary">Sign in</ULink>
      </template>
    </AuthForgotPasswordForm>
  </AuthCard>
</template>
