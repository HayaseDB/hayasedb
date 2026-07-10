<script setup lang="ts">
import type { RegisterSchema, SocialProvider } from '@hayasedb/contract'

definePageMeta({ layout: false })

const { loading, signUpEmail, signInSocial } = useAuthActions()

const formKey = ref(0)

async function onSubmit(data: RegisterSchema) {
  if (await signUpEmail(data)) formKey.value++
}

function onSocial(provider: SocialProvider) {
  void signInSocial(provider)
}
</script>

<template>
  <AuthCard>
    <AuthRegisterForm
      :key="formKey"
      :providers="['github', 'discord']"
      :loading="loading"
      :on-submit="onSubmit"
      :on-social="onSocial"
    >
      <template #footer>
        Already have an account?
        <ULink to="/login" class="text-primary">Sign in</ULink>
      </template>
    </AuthRegisterForm>
  </AuthCard>
</template>
