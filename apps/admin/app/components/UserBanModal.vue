<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { adminBanUserSchema, type AdminBanUserSchema } from '@hayasedb/contract'

const props = defineProps<{
  userName?: string | null
  onSubmit: (data: AdminBanUserSchema) => Promise<boolean>
}>()

const emit = defineEmits<{ close: [boolean] }>()

const form = useTemplateRef('form')
const saving = ref(false)
const state = reactive<Partial<AdminBanUserSchema>>({
  reason: undefined,
  expiresIn: undefined,
})

async function handleSubmit(event: FormSubmitEvent<AdminBanUserSchema>) {
  saving.value = true
  try {
    if (await props.onSubmit(event.data)) emit('close', true)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :title="userName ? `Ban ${userName}` : 'Ban user'"
    description="The user is signed out everywhere and cannot sign in while banned."
    :dismissible="!saving"
  >
    <template #body>
      <UForm
        ref="form"
        :schema="adminBanUserSchema"
        :state="state"
        :validate-on="['input', 'change']"
        class="flex flex-col gap-4"
        @submit="handleSubmit"
      >
        <UFormField label="Reason" name="reason" required>
          <UTextarea
            v-model="state.reason"
            placeholder="Why is this user being banned?"
            :rows="3"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField
          label="Duration"
          name="expiresIn"
          help="Leave empty for a permanent ban."
        >
          <AppSelect
            v-model="state.expiresIn"
            :items="banDurationOptions"
            value-key="value"
            placeholder="Permanent"
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
          label="Ban user"
          color="error"
          :loading="saving"
          @click="form?.submit()"
        />
      </div>
    </template>
  </UModal>
</template>
