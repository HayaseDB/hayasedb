<script setup lang="ts">
  definePageMeta({
    layout: 'auth',
    middleware: 'sidebase-auth',
    auth: {
      unauthenticatedOnly: false,
      navigateUnauthenticatedTo: '/auth/login',
    },
  })

  const { signOut, token } = useAuth()

  onMounted(async () => {
    await signOut().catch(() => {})
    if (!token.value) {
      navigateTo('/auth/login')
    }
  })
</script>

<template>
  <div class="flex items-center justify-center">
    <p class="text-muted-foreground">Signing out...</p>
  </div>
</template>
