<script setup lang="ts">
const { data: session } = await useAppSession()
const me = computed(() => session.value?.user ?? null)
const auth = useAuth()
const router = useRouter()

async function signOut() {
  await auth.signOut()
  await router.push('/login')
}
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-xl font-semibold">Admin console</h1>
      <UserMenu :email="session?.user?.email" @sign-out="signOut" />
    </div>

    <UCard>
      <template #header>Signed in as</template>
      <pre class="text-sm">{{ me }}</pre>
    </UCard>
  </UContainer>
</template>
