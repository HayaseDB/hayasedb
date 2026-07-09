<script setup lang="ts">
import type { AuthFormField } from '@nuxt/ui'
import {
  resetPasswordSchema,
  type ResetPasswordSchema,
} from '@hayasedb/contract'

withDefaults(
  defineProps<{
    loading?: boolean
    title?: string
    submitLabel?: string
    onSubmit?: (data: ResetPasswordSchema) => unknown | Promise<unknown>
  }>(),
  {
    loading: false,
    title: 'Set a new password',
    submitLabel: 'Update password',
    onSubmit: undefined,
  },
)

const fields: AuthFormField[] = [
  {
    name: 'password',
    type: 'password',
    label: 'New password',
    placeholder: 'Enter a new password',
    required: true,
    defaultValue: '',
    autocomplete: 'new-password',
  },
  {
    name: 'confirmPassword',
    type: 'password',
    label: 'Confirm password',
    placeholder: 'Re-enter your new password',
    required: true,
    defaultValue: '',
    autocomplete: 'new-password',
  },
]
</script>

<template>
  <AuthFormBase
    :schema="resetPasswordSchema"
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
