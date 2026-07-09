<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  changeEmailSchema,
  type AccountUser,
  type ChangeEmailSchema,
} from '@hayasedb/contract'

const props = withDefaults(
  defineProps<{
    user?: AccountUser | null
    onSubmit?: (data: ChangeEmailSchema) => unknown | Promise<unknown>
  }>(),
  {
    user: null,
    onSubmit: undefined,
  },
)

const state = reactive<Partial<ChangeEmailSchema>>({
  email: props.user?.email,
})

watch(
  () => props.user?.email,
  (email) => {
    state.email = email
  },
)

const form = useTemplateRef('form')

async function handleSubmit(event: FormSubmitEvent<ChangeEmailSchema>) {
  await props.onSubmit?.(event.data)
}
</script>

<template>
  <div class="grid gap-x-12 gap-y-4 lg:grid-cols-3">
    <div class="lg:col-span-1">
      <h3 class="text-highlighted text-sm font-medium">Email</h3>
      <p class="text-muted mt-1 text-sm">
        The address used to sign in and receive notifications.
      </p>
    </div>

    <div class="lg:col-span-2">
      <UForm
        ref="form"
        v-slot="{ loading }"
        :schema="changeEmailSchema"
        :state="state"
        class="flex flex-col gap-4"
        @submit="handleSubmit"
      >
        <UFormField name="email" label="Email" required>
          <UInput
            v-model="state.email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end">
          <UButton
            type="submit"
            label="Save"
            color="primary"
            :loading="loading"
            :disabled="!form?.dirty"
          />
        </div>
      </UForm>
    </div>
  </div>
</template>
