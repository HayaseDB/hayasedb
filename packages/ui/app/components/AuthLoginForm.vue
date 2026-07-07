<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import type { SocialProvider } from '#ui-layer/composables/useAuthActions'
import { loginSchema, type LoginSchema } from '#ui-layer/utils/authSchema'

const props = withDefaults(
  defineProps<{
    providers?: SocialProvider[]
    requireAdmin?: boolean
    title?: string
    submitLabel?: string
  }>(),
  {
    providers: () => [],
    requireAdmin: false,
    title: 'Sign in',
    submitLabel: 'Sign in',
  },
)

const { loading, signInEmail } = useAuthActions()
useAuthError()

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

const providers = useSocialProviders(() => props.providers)

async function onSubmit(event: FormSubmitEvent<LoginSchema>) {
  await signInEmail(event.data, { requireAdmin: props.requireAdmin })
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
