<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  updateProfileSchema,
  type AccountUser,
  type UpdateProfileSchema,
} from '@hayasedb/contract'

const props = withDefaults(
  defineProps<{
    user?: AccountUser | null
    verified?: boolean
    onSubmit?: (data: UpdateProfileSchema) => unknown | Promise<unknown>
    onUploadAvatar?: (file: File) => unknown | Promise<unknown>
  }>(),
  {
    user: null,
    verified: false,
    onSubmit: undefined,
    onUploadAvatar: undefined,
  },
)

const state = reactive<Partial<UpdateProfileSchema>>({
  name: props.user?.name,
})

watch(
  () => props.user,
  (user) => {
    state.name = user?.name
  },
)

const uploading = ref(false)

async function onFileSelect(file: File | null | undefined) {
  if (!file || uploading.value || !props.verified) return
  uploading.value = true
  try {
    await props.onUploadAvatar?.(file)
  } finally {
    uploading.value = false
  }
}

const form = useTemplateRef('form')

async function handleSubmit(event: FormSubmitEvent<UpdateProfileSchema>) {
  await props.onSubmit?.(event.data)
}
</script>

<template>
  <div class="grid gap-x-12 gap-y-4 lg:grid-cols-3">
    <div class="lg:col-span-1">
      <h3 class="text-highlighted text-sm font-medium">Profile</h3>
      <p class="text-muted mt-1 text-sm">Update your name and avatar.</p>
    </div>

    <div class="flex flex-col gap-6 lg:col-span-2">
      <UFileUpload
        accept="image/png,image/jpeg,image/webp,image/gif"
        :interactive="false"
        :preview="false"
        @update:model-value="onFileSelect"
      >
        <template #default="{ open }">
          <div class="flex items-center gap-4">
            <div class="relative shrink-0 rounded-full">
              <UAvatar
                :src="user?.image ?? undefined"
                :alt="state.name"
                size="3xl"
                class="size-16 text-xl"
              />

              <span
                v-if="uploading"
                class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50"
              >
                <UIcon
                  name="i-lucide-loader-circle"
                  class="size-5 animate-spin text-white"
                />
              </span>
            </div>

            <div class="flex flex-col gap-1">
              <UButton
                label="Change avatar"
                color="neutral"
                variant="outline"
                size="sm"
                :loading="uploading"
                class="w-fit"
                @click="open()"
              />
              <p class="text-muted text-xs">
                PNG, JPG, WEBP or GIF, up to 5MB.
              </p>
            </div>
          </div>
        </template>
      </UFileUpload>

      <UForm
        ref="form"
        v-slot="{ loading }"
        :schema="updateProfileSchema"
        :state="state"
        class="flex flex-col gap-4"
        @submit="handleSubmit"
      >
        <UFormField name="name" label="Name" required>
          <UInput
            v-model="state.name"
            placeholder="Your name"
            autocomplete="name"
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
