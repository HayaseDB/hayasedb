<script setup lang="ts">
import type { ResetPasswordSchema } from '@hayasedb/contract'

definePageMeta({ layout: false })

useSeoMeta({ title: 'Reset password' })

const route = useRoute()
const { loading, resetPassword } = useAuthActions()

const token = computed(() => {
  const value = route.query.token
  return typeof value === 'string' ? value : ''
})

async function onSubmit(data: ResetPasswordSchema) {
  if (!token.value) return
  await resetPassword(token.value, data.password)
}
</script>

<template>
  <AuthCard>
    <div v-if="!token" class="flex flex-col items-center gap-4 text-center">
      <UIcon name="i-lucide-triangle-alert" class="text-error size-8" />
      <p class="text-highlighted font-medium">Invalid reset link</p>
      <p class="text-muted text-sm">
        This link is missing its token or has expired. Request a new one.
      </p>
      <UButton
        to="/auth/forgot-password"
        label="Request a new link"
        variant="subtle"
        block
      />
    </div>

    <AuthResetPasswordForm v-else :loading="loading" :on-submit="onSubmit">
      <template #footer>
        Back to
        <ULink to="/login" class="text-primary">sign in</ULink>
      </template>
    </AuthResetPasswordForm>
  </AuthCard>
</template>
