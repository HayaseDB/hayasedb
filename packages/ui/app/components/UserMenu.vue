<script setup lang="ts">
const { data: session } = await useAppSession()

const auth = useAuth()
const router = useRouter()

async function signOut() {
  await auth.signOut()
  await router.push('/login')
}
</script>

<template>
  <div v-if="session?.user" class="flex items-center gap-3">
    <span class="text-muted text-sm">{{ session.user.email }}</span>
    <UButton
      color="neutral"
      variant="subtle"
      size="sm"
      icon="i-lucide-log-out"
      @click="signOut"
    >
      Sign out
    </UButton>
  </div>
  <UButton v-else to="/login" color="neutral" variant="subtle" size="sm">
    Sign in
  </UButton>
</template>
