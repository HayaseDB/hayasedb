<script setup lang="ts">
import * as z from 'zod'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import type { SocialProvider } from '~/composables/useAuthActions'

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

const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
})
type Schema = z.output<typeof schema>

const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Enter your email',
    required: true,
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    required: true,
  },
]

const providers = useSocialProviders(() => props.providers)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  await signInEmail(event.data, { requireAdmin: props.requireAdmin })
}
</script>

<template>
  <UAuthForm
    :schema="schema"
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
