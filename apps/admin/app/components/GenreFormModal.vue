<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  createGenreInputSchema,
  type CreateGenreInput,
  type Genre,
} from '@hayasedb/contract'
import type { LocalizationLocale } from '@hayasedb/domain'

const props = defineProps<{
  genre?: Genre | null
  onSubmit: (data: CreateGenreInput) => Promise<boolean>
}>()

const emit = defineEmits<{ close: [boolean] }>()

const form = useTemplateRef('form')
const saving = ref(false)
const state = reactive<CreateGenreInput>({
  slug: props.genre?.slug ?? '',
  translations: props.genre?.translations.map((translation) => ({
    ...translation,
  })) ?? [{ locale: 'en', name: '' }],
})

const formErrors = ref<{ name?: string }[]>()

const translations = computed({
  get: () => state.translations,
  set: (value) => {
    state.translations = value
  },
})

const localization = useTranslationEditor({
  translations,
  fields: ['name'],
  errors: formErrors,
  create: (locale: LocalizationLocale) => ({ locale, name: '' }),
})

const { activeIndex, active } = localization

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
        @error="(event) => (formErrors = event.errors)"
      >
        <UFormField label="Slug" name="slug" hint="Stable and not translated">
          <UInput
            v-model="state.slug"
            placeholder="action"
            class="w-full"
            autofocus
          />
        </UFormField>

        <LocaleSwitcher
          v-model:locale="localization.activeLocale.value"
          :items="localization.switcherItems.value"
          :add-options="localization.remainingOptions.value"
          :can-add="localization.canAdd.value"
          :can-remove="localization.canRemove.value"
          @add="localization.add"
          @remove="localization.removeActive()"
        />

        <UFormField
          v-if="active"
          label="Name"
          :name="`translations.${activeIndex}.name`"
          required
        >
          <UInput v-model="active.name" placeholder="Action" class="w-full" />
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
