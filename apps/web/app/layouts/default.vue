<script setup lang="ts">
const config = useRuntimeConfig()
const { data: session } = await useAppSession()
const user = computed(() => session.value?.user ?? null)
const { signOut } = useAccountActions()

const adminUrl = computed(() => {
  if (user.value?.role !== 'admin' || user.value.banned) return null
  return config.public.adminUrl
})
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
