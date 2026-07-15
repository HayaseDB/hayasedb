<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  createGenreInputSchema,
  type CreateGenreInput,
  type Genre,
} from '@hayasedb/contract'

const props = defineProps<{
  genre?: Genre | null
  onSubmit: (data: CreateGenreInput) => Promise<boolean>
}>()

const emit = defineEmits<{ close: [boolean] }>()

const form = useTemplateRef('form')
const saving = ref(false)
const state = reactive<CreateGenreInput>({ name: props.genre?.name ?? '' })

async function handleSubmit(event: FormSubmitEvent<CreateGenreInput>) {
  saving.value = true
  try {
    if (await props.onSubmit(event.data)) emit('close', true)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal :title="genre ? 'Edit genre' : 'New genre'" :dismissible="!saving">
    <template #body>
      <UForm
        ref="form"
        :schema="createGenreInputSchema"
        :state="state"
        :validate-on="['input', 'change']"
        class="flex flex-col gap-4"
        @submit="handleSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput
            v-model="state.name"
            placeholder="Action"
            class="w-full"
            autofocus
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
          :label="genre ? 'Save' : 'Create'"
          color="primary"
          :loading="saving"
          @click="form?.submit()"
        />
      </div>
    </template>
  </UModal>
</template>
