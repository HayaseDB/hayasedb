<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import {
  registerSchema,
  type RegisterSchema,
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
    title: 'Create account',
    submitLabel: 'Create account',
  },
)

const emit = defineEmits<{
  submit: [data: RegisterSchema]
  social: [provider: SocialProvider]
}>()

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

const providers = useSocialProviders(
  () => props.providers,
  (provider) => emit('social', provider),
)

function onSubmit(event: FormSubmitEvent<RegisterSchema>) {
  emit('submit', event.data)
}
</script>

<template>
  <UAuthForm
    :schema="registerSchema"
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
