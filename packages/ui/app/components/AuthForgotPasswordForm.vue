<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import {
  forgotPasswordSchema,
  type ForgotPasswordSchema,
} from '@hayasedb/contract'

withDefaults(
  defineProps<{
    loading?: boolean
    title?: string
    submitLabel?: string
  }>(),
  {
    loading: false,
    title: 'Forgot password',
    submitLabel: 'Send reset link',
  },
)

const emit = defineEmits<{
  submit: [data: ForgotPasswordSchema]
}>()

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

function onSubmit(event: FormSubmitEvent<ForgotPasswordSchema>) {
  emit('submit', event.data)
}
</script>

<template>
  <UAuthForm
    :schema="forgotPasswordSchema"
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
