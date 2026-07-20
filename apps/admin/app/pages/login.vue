<script setup lang="ts">
import type { LoginSchema } from '@hayasedb/contract'

definePageMeta({ layout: false })

useSeoMeta({ title: 'Sign in' })

const { loading, signInEmail } = useAuthActions()
useAuthError()

function onSubmit(data: LoginSchema) {
  void signInEmail(data, { requireAdmin: true })
}
</script>

<template>
  <AuthCard>
    <AuthLoginForm
      title="Admin sign in"
      :loading="loading"
      :on-submit="onSubmit"
    />
  </AuthCard>
</template>
