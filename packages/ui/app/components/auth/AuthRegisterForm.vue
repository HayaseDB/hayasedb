<script setup lang="ts">
import type { AuthFormField } from '@nuxt/ui'
import {
  registerSchema,
  type RegisterSchema,
  type SocialProvider,
} from '@hayasedb/contract'

withDefaults(
  defineProps<{
    providers?: SocialProvider[]
    loading?: boolean
    title?: string
    submitLabel?: string
    onSubmit?: (data: RegisterSchema) => unknown | Promise<unknown>
    onSocial?: (provider: SocialProvider) => unknown
  }>(),
  {
    providers: () => [],
    loading: false,
    title: 'Create account',
    submitLabel: 'Create account',
    onSubmit: undefined,
    onSocial: undefined,
  },
)

const fields: AuthFormField[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Name',
    placeholder: 'Enter your name',
    required: true,
    defaultValue: '',
    autocomplete: 'name',
  },
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
    autocomplete: 'new-password',
  },
]
</script>

<template>
  <AuthFormBase
    :schema="registerSchema"
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
