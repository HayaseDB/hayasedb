<script setup lang="ts">
withDefaults(
  defineProps<{
    email?: string | null
    signInTo?: string
    onSignOut?: () => unknown
  }>(),
  {
    email: null,
    signInTo: '/login',
    onSignOut: undefined,
  },
)
</script>

<template>
  <div v-if="email" class="flex items-center gap-3">
    <span class="text-muted text-sm">{{ email }}</span>
    <UButton
      color="neutral"
      variant="subtle"
      size="sm"
      icon="i-lucide-log-out"
      @click="() => void onSignOut?.()"
    >
      Sign out
    </UButton>
  </div>
  <UButton v-else :to="signInTo" color="neutral" variant="subtle" size="sm">
    Sign in
  </UButton>
</template>
