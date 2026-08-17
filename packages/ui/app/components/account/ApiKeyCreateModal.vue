<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const props = withDefaults(
  defineProps<{
    onCreate?: (input: {
      name: string
      expiresIn: number | null
    }) => Promise<boolean> | boolean
  }>(),
  {
    onCreate: undefined,
  },
)

const emit = defineEmits<{ close: [boolean] }>()

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(32),
  expiresIn: z.number(),
})

type Schema = z.output<typeof schema>

const DAY = 60 * 60 * 24

const expiryOptions = [
  { label: 'Never expires', value: 0 },
  { label: '30 days', value: 30 * DAY },
  { label: '90 days', value: 90 * DAY },
  { label: '1 year', value: 365 * DAY },
]

const state = reactive<Schema>({ name: '', expiresIn: 0 })

const loading = ref(false)

async function handleSubmit(event: FormSubmitEvent<Schema>) {
  if (loading.value) return
  loading.value = true
  try {
    const created = await props.onCreate?.({
      name: event.data.name,
      expiresIn: event.data.expiresIn || null,
    })
    if (created !== false) emit('close', true)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    title="Create API key"
    description="Use API keys to access the public HayaseDB API from your own applications."
    :dismissible="!loading"
  >
    <template #body>
      <UForm
        id="api-key-create"
        :schema="schema"
        :state="state"
        :validate-on="['change', 'input']"
        class="flex flex-col gap-4"
        @submit="handleSubmit"
      >
        <UFormField name="name" label="Name" required>
          <UInput
            v-model="state.name"
            class="w-full"
            placeholder="My application"
            autofocus
          />
        </UFormField>
        <UFormField name="expiresIn" label="Expiration">
          <USelect
            v-model="state.expiresIn"
            :items="expiryOptions"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          :disabled="loading"
          @click="emit('close', false)"
        />
        <UButton
          type="submit"
          form="api-key-create"
          label="Create key"
          :loading="loading"
        />
      </div>
    </template>
  </UModal>
</template>
