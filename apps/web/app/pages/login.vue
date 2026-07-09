<script setup lang="ts">
import type { LoginSchema, SocialProvider } from '@hayasedb/contract'

const { loading, signInEmail, signInSocial } = useAuthActions()
useAuthError()

function onSubmit(data: LoginSchema) {
  void signInEmail(data)
}

function onSocial(provider: SocialProvider) {
  void signInSocial(provider)
}
</script>

<template>
  <AuthCard>
    <AuthLoginForm
      :providers="['github', 'discord']"
      :loading="loading"
      :on-submit="onSubmit"
      :on-social="onSocial"
    >
      <template #footer>
        No account?
        <ULink to="/register" class="text-primary">Create one</ULink>
        ·
        <ULink to="/auth/forgot-password" class="text-primary">
          Forgot password?
        </ULink>
      </template>
    </AuthLoginForm>
  </AuthCard>
</template>
