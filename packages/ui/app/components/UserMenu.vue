<script setup lang="ts">
defineProps<{
  email?: string | null
}>()

defineEmits<{
  signOut: []
}>()
</script>

<template>
  <div v-if="email" class="flex items-center gap-3">
    <span class="text-muted text-sm">{{ email }}</span>
    <UButton
      color="neutral"
      variant="subtle"
      size="sm"
      icon="i-lucide-log-out"
      @click="$emit('signOut')"
    >
      Sign out
    </UButton>
  </div>
  <UButton v-else to="/login" color="neutral" variant="subtle" size="sm">
    Sign in
  </UButton>
</template>
