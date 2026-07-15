<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import type { ZodType } from 'zod'
import type { SocialProvider } from '@hayasedb/contract'

const props = withDefaults(
  defineProps<{
    schema: ZodType<T>
    fields: AuthFormField[]
    providers?: SocialProvider[]
    loading?: boolean
    title?: string
    submitLabel?: string
    onSubmit?: (data: T) => unknown | Promise<unknown>
    onSocial?: (provider: SocialProvider) => unknown
  }>(),
  {
    providers: () => [],
    loading: false,
    title: undefined,
    submitLabel: 'Submit',
    onSubmit: undefined,
    onSocial: undefined,
  },
)

const providers = useSocialProviders(
  () => props.providers,
  (provider) => props.onSocial?.(provider),
)

function handleSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  void props.onSubmit?.(event.data as T)
}
</script>

<template>
  <UAuthForm
    :schema="schema"
    :fields="fields"
    :providers="providers"
    :title="title"
    :submit="{ label: submitLabel, loading }"
    @submit="handleSubmit"
  >
    <template v-if="$slots.footer" #footer>
      <span class="text-muted text-sm">
        <slot name="footer" />
      </span>
    </template>
  </UAuthForm>
</template>
