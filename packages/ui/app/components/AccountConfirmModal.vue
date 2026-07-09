<script setup lang="ts">
withDefaults(
  defineProps<{
    open?: boolean
    title?: string
    description?: string
    confirmLabel?: string
    confirmColor?: 'error' | 'primary' | 'warning' | 'neutral'
    loading?: boolean
  }>(),
  {
    open: false,
    title: 'Are you sure?',
    description: '',
    confirmLabel: 'Confirm',
    confirmColor: 'error',
    loading: false,
  },
)

const emit = defineEmits<{
  confirm: []
  'update:open': [value: boolean]
}>()

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    :description="description"
    @update:open="emit('update:open', $event)"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          :disabled="loading"
          @click="close"
        />
        <UButton
          :color="confirmColor"
          :label="confirmLabel"
          :loading="loading"
          @click="emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
