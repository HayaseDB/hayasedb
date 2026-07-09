<script setup lang="ts">
import type { AuthFormField } from '@nuxt/ui'
import {
  forgotPasswordSchema,
  type ForgotPasswordSchema,
} from '@hayasedb/contract'

withDefaults(
  defineProps<{
    loading?: boolean
    title?: string
    submitLabel?: string
    onSubmit?: (data: ForgotPasswordSchema) => unknown | Promise<unknown>
  }>(),
  {
    loading: false,
    title: 'Forgot password',
    submitLabel: 'Send reset link',
    onSubmit: undefined,
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
]
</script>

<template>
  <AuthFormBase
    :schema="forgotPasswordSchema"
    :fields="fields"
    :loading="loading"
    :title="title"
    :submit-label="submitLabel"
    :on-submit="onSubmit"
  >
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </AuthFormBase>
</template>
