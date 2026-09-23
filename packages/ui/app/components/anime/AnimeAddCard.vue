<script setup lang="ts">
defineProps<{ label: string }>()

const emit = defineEmits<{ add: [] }>()
</script>

<template>
  <button
    type="button"
    class="border-default text-muted hover:border-primary hover:text-primary focus-visible:ring-primary flex min-h-12 w-full items-center gap-3 rounded-md border border-dashed p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    @click="emit('add')"
  >
    <span
      class="flex min-w-10 shrink-0 justify-center rounded px-2 py-1 text-xs"
    >
      <UIcon name="i-lucide-plus" class="size-4" />
    </span>
    <span class="truncate text-sm font-medium">{{ label }}</span>
  </button>
</template>
