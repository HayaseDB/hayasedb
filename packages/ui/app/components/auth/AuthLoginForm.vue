<script setup lang="ts">
import type { AuthFormField } from '@nuxt/ui'
import {
  loginSchema,
  type LoginSchema,
  type SocialProvider,
} from '@hayasedb/contract'

withDefaults(
  defineProps<{
    providers?: SocialProvider[]
    loading?: boolean
    title?: string
    submitLabel?: string
    onSubmit?: (data: LoginSchema) => unknown | Promise<unknown>
    onSocial?: (provider: SocialProvider) => unknown
  }>(),
  {
    providers: () => [],
    loading: false,
    title: 'Sign in',
    submitLabel: 'Sign in',
    onSubmit: undefined,
    onSocial: undefined,
  },
)

const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Enter your email',
    required: true,
    defaultValue: '',
    autocomplete: 'email',
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    required: true,
    defaultValue: '',
    autocomplete: 'current-password',
  },
]
</script>

<template>
  <AuthFormBase
    :schema="loginSchema"
    :fields="fields"
    :providers="providers"
    :loading="loading"
    :title="title"
    :submit-label="submitLabel"
    :on-submit="onSubmit"
    :on-social="onSocial"
  >
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </AuthFormBase>
</template>
