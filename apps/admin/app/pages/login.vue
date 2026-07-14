<script setup lang="ts">
import type { LoginSchema, SocialProvider } from '@hayasedb/contract'

definePageMeta({ layout: false })

useSeoMeta({ title: 'Sign in' })

const { loading, signInEmail, signInSocial } = useAuthActions()
useAuthError()

function onSubmit(data: LoginSchema) {
  void signInEmail(data, { requireAdmin: true })
}

function onSocial(provider: SocialProvider) {
  void signInSocial(provider)
}
</script>

<template>
  <AuthCard>
    <AuthLoginForm
      title="Admin sign in"
      :loading="loading"
      :on-submit="onSubmit"
      :on-social="onSocial"
    />
  </AuthCard>
</template>
