<script setup lang="ts">
const { data: session } = await useAppSession()
const user = computed(() => session.value?.user ?? null)
const { signOut } = useAccountActions()
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader :user="user" :on-sign-out="signOut" />

    <UMain class="flex-1">
      <slot />
    </UMain>

    <AppFooter />
  </div>
</template>
