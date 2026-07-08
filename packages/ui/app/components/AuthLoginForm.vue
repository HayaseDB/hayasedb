<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import {
  loginSchema,
  type LoginSchema,
  type SocialProvider,
} from '@hayasedb/contract'

const props = withDefaults(
  defineProps<{
    providers?: SocialProvider[]
    loading?: boolean
    title?: string
    submitLabel?: string
  }>(),
  {
    providers: () => [],
    loading: false,
    title: 'Sign in',
    submitLabel: 'Sign in',
  },
)

const emit = defineEmits<{
  submit: [data: LoginSchema]
  social: [provider: SocialProvider]
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

const providers = useSocialProviders(
  () => props.providers,
  (provider) => emit('social', provider),
)

function onSubmit(event: FormSubmitEvent<LoginSchema>) {
  emit('submit', event.data)
}
</script>

<template>
  <UAuthForm
    :schema="loginSchema"
    :fields="fields"
    :providers="providers"
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
