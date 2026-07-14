<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  createGenreInputSchema,
  type CreateGenreInput,
  type Genre,
} from '@hayasedb/contract'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  genre?: Genre | null
  onSubmit: (data: CreateGenreInput) => Promise<boolean>
}>()

const state = reactive<CreateGenreInput>({ name: '' })

watch(open, (value) => {
  if (value) state.name = props.genre?.name ?? ''
})

function close() {
  open.value = false
}

async function handleSubmit(event: FormSubmitEvent<CreateGenreInput>) {
  if (await props.onSubmit(event.data)) close()
}
</script>

<template>
  <UModal v-model:open="open" :title="genre ? 'Edit genre' : 'New genre'">
    <template #body>
      <UForm
        v-slot="{ loading }"
        :schema="createGenreInputSchema"
        :state="state"
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
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="close"
          />
          <UButton
            type="submit"
            :label="genre ? 'Save' : 'Create'"
            color="primary"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
