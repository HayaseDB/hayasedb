<script setup lang="ts">
import { changesetNoteBodySchema } from '@hayasedb/contract'
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

const props = defineProps<{
  summary: string
  onConfirm: (note: string) => Promise<boolean>
}>()

const emit = defineEmits<{ close: [boolean] }>()

const schema = z.object({
  note: changesetNoteBodySchema.min(3, 'Explain why this is rejected'),
})

type RejectState = z.output<typeof schema>

const form = useTemplateRef('form')
const saving = ref(false)
const state = reactive<RejectState>({ note: '' })

async function handleSubmit(event: FormSubmitEvent<RejectState>) {
  saving.value = true
  try {
    if (await props.onConfirm(event.data.note)) emit('close', true)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    title="Reject submission"
    :description="summary"
    :dismissible="!saving"
  >
    <template #body>
      <UForm
        ref="form"
        :schema="schema"
        :state="state"
        :validate-on="['input', 'change']"
        class="flex flex-col gap-4"
        @submit="handleSubmit"
      >
        <UFormField
          label="Reason"
          name="note"
          help="The contributor sees this note and can revise & resubmit."
        >
          <UTextarea
            v-model="state.note"
            :rows="4"
            placeholder="What needs to change?"
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
          label="Reject"
          color="error"
          :loading="saving"
          @click="form?.submit()"
        />
      </div>
    </template>
  </UModal>
</template>
