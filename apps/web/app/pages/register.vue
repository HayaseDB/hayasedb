<script setup lang="ts">
import type { RegisterSchema, SocialProvider } from '@hayasedb/contract'

const { loading, signUpEmail, signInSocial } = useAuthActions()

function onSubmit(data: RegisterSchema) {
  void signUpEmail(data)
}

function onSocial(provider: SocialProvider) {
  void signInSocial(provider)
}
</script>

<template>
  <AuthCard>
    <AuthRegisterForm
      :providers="['github', 'discord']"
      :loading="loading"
      @submit="onSubmit"
      @social="onSocial"
    >
      <template #footer>
        Already have an account?
        <ULink to="/login" class="text-primary">Sign in</ULink>
      </template>
    </AuthRegisterForm>
  </AuthCard>
</template>
