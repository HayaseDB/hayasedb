<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  adminCreateUserSchema,
  type AdminCreateUserSchema,
} from '@hayasedb/contract'

const props = defineProps<{
  onSubmit: (data: AdminCreateUserSchema) => Promise<boolean>
}>()

const emit = defineEmits<{ close: [boolean] }>()

const form = useTemplateRef('form')
const saving = ref(false)
const state = reactive<Partial<AdminCreateUserSchema>>({
  name: undefined,
  email: undefined,
  password: undefined,
  role: 'user',
})

async function handleSubmit(event: FormSubmitEvent<AdminCreateUserSchema>) {
  saving.value = true
  try {
    if (await props.onSubmit(event.data)) emit('close', true)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal title="New user" :dismissible="!saving">
    <template #body>
      <UForm
        ref="form"
        :schema="adminCreateUserSchema"
        :state="state"
        :validate-on="['input', 'change']"
        class="flex flex-col gap-4"
        @submit="handleSubmit"
      >
        <UFormField label="Name" name="name" required>
          <UInput
            v-model="state.name"
            placeholder="Jane Doe"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField label="Email" name="email" required>
          <UInput
            v-model="state.email"
            type="email"
            placeholder="jane@example.com"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" name="password" required>
          <UInput
            v-model="state.password"
            type="password"
            placeholder="At least 8 characters"
            autocomplete="new-password"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Role" name="role" required>
          <USelect
            v-model="state.role"
            :items="userRoleOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          :disabled="saving"
          @click="emit('close', false)"
        />
        <UButton
          label="Create"
          color="primary"
          :loading="saving"
          @click="form?.submit()"
        />
      </div>
    </template>
  </UModal>
</template>
