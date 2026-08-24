<script setup lang="ts">
const { user, adminUrl, signOut } = await useLayoutSession()
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader :user="user" :admin-url="adminUrl" :on-sign-out="signOut" />

    <UMain class="flex-1">
      <slot />
    </UMain>

    <AppFooter />
  </div>
</template>
