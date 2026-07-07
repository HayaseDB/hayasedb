<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import type { SocialProvider } from '#ui-layer/composables/useAuthActions'
import { registerSchema, type RegisterSchema } from '#ui-layer/utils/authSchema'

const props = withDefaults(
  defineProps<{
    providers?: SocialProvider[]
    title?: string
    submitLabel?: string
  }>(),
  {
    providers: () => [],
    title: 'Create account',
    submitLabel: 'Create account',
  },
)

const { loading, signUpEmail } = useAuthActions()

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

const providers = useSocialProviders(() => props.providers)

async function onSubmit(event: FormSubmitEvent<RegisterSchema>) {
  await signUpEmail(event.data)
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
