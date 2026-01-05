<script setup lang="ts">
  definePageMeta({
    layout: false,
  })

  const { signOut } = useAuth()

  await signOut({ callbackUrl: '/auth/login', redirect: true }).catch(() => {
    navigateTo('/auth/login', { replace: true })
  })
</script>

<template>
  <div />
</template>
