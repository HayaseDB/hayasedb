<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import {
  resetPasswordSchema,
  type ResetPasswordSchema,
} from '@hayasedb/contract'

withDefaults(
  defineProps<{
    loading?: boolean
    title?: string
    submitLabel?: string
  }>(),
  {
    loading: false,
    title: 'Set a new password',
    submitLabel: 'Update password',
  },
)

const emit = defineEmits<{
  submit: [data: ResetPasswordSchema]
}>()

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

function onSubmit(event: FormSubmitEvent<ResetPasswordSchema>) {
  emit('submit', event.data)
}
</script>

<template>
  <UAuthForm
    :schema="resetPasswordSchema"
    :fields="fields"
    :title="title"
    :submit="{ label: submitLabel, loading }"
    @submit="onSubmit"
  >
    <template v-if="$slots.footer" #footer>
      <span class="text-muted text-sm">
        <slot name="footer" />
      </span>
    </template>
  </UAuthForm>
</template>
