<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  changePasswordSchema,
  type ChangePasswordSchema,
} from '@hayasedb/contract'

const props = withDefaults(
  defineProps<{
    onSubmit?: (data: ChangePasswordSchema) => unknown | Promise<unknown>
  }>(),
  {
    onSubmit: undefined,
  },
)

const state = reactive<Partial<ChangePasswordSchema>>({
  currentPassword: undefined,
  newPassword: undefined,
  confirmPassword: undefined,
})

function reset() {
  state.currentPassword = undefined
  state.newPassword = undefined
  state.confirmPassword = undefined
}

const form = useTemplateRef('form')

async function handleSubmit(event: FormSubmitEvent<ChangePasswordSchema>) {
  const ok = await props.onSubmit?.(event.data)
  if (ok) reset()
}

defineExpose({ reset })
</script>

<template>
  <div class="grid gap-x-12 gap-y-4 lg:grid-cols-3">
    <div class="lg:col-span-1">
      <h3 class="text-highlighted text-sm font-medium">Password</h3>
      <p class="text-muted mt-1 text-sm">
        Change your password. Other devices will be signed out.
      </p>
    </div>

    <UForm
      ref="form"
      v-slot="{ loading }"
      :schema="changePasswordSchema"
      :state="state"
      class="flex flex-col gap-4 lg:col-span-2"
      @submit="handleSubmit"
    >
      <UFormField name="currentPassword" label="Current password" required>
        <UInput
          v-model="state.currentPassword"
          type="password"
          placeholder="Enter your current password"
          autocomplete="current-password"
          class="w-full"
        />
      </UFormField>

      <UFormField name="newPassword" label="New password" required>
        <UInput
          v-model="state.newPassword"
          type="password"
          placeholder="Enter a new password"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>

      <UFormField name="confirmPassword" label="Confirm password" required>
        <UInput
          v-model="state.confirmPassword"
          type="password"
          placeholder="Re-enter your new password"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>

      <div class="flex justify-end">
        <UButton
          type="submit"
          label="Update password"
          color="primary"
          :loading="loading"
          :disabled="!form?.dirty"
        />
      </div>
    </UForm>
  </div>
</template>
