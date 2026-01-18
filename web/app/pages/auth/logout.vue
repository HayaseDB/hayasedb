<script setup lang="ts">
  definePageMeta({
    layout: false,
  })

  const { logout } = useAuth()

  onMounted(async () => {
    await logout()
    await navigateTo('/auth/login', { replace: true })
  })
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <p class="text-muted-foreground">Signing out...</p>
  </div>
</template>
