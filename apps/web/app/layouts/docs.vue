<script setup lang="ts">
const { user, adminUrl, signOut } = await useLayoutSession()
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden">
    <AppHeader
      :user="user"
      :admin-url="adminUrl"
      :on-sign-out="signOut"
      class="relative top-auto z-20 shrink-0"
    />

    <div class="min-h-0 flex-1 overflow-hidden">
      <slot />
    </div>
  </div>
</template>
