<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    confirmLabel?: string
    confirmColor?: 'error' | 'primary' | 'warning' | 'neutral'
    onConfirm?: () => unknown | Promise<unknown>
  }>(),
  {
    title: 'Are you sure?',
    description: '',
    confirmLabel: 'Confirm',
    confirmColor: 'error',
    onConfirm: undefined,
  },
)

const emit = defineEmits<{ close: [boolean] }>()

const loading = ref(false)

async function confirm() {
  if (loading.value) return
  if (!props.onConfirm) {
    emit('close', true)
    return
  }
  loading.value = true
  try {
    if ((await props.onConfirm()) !== false) emit('close', true)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal :title="title" :description="description" :dismissible="!loading">
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
          :color="confirmColor"
          :label="confirmLabel"
          :loading="loading"
          @click="confirm"
        />
      </div>
    </template>
  </UModal>
</template>
