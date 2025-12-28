<script setup lang="ts">
  import { toast } from 'vue-sonner'
  import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
  import { Button } from '@/components/ui/button'

  definePageMeta({
    layout: 'auth',
  })

  useSeoMeta({
    title: 'Verify Email',
    description: 'Verify your HayaseDB account email',
  })

  const route = useRoute()
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  async function verify() {
    const token = route.query.token as string

    if (!token) {
      error.value = 'Invalid verification link'
      toast.error('Invalid verification link')
      isLoading.value = false
      return
    }

    try {
      await $fetch('/api/auth/verify-email', { method: 'POST', body: { token } })
      toast.success('Email verified!', {
        description: 'You can now sign in to your account',
      })
      await navigateTo('/auth/login')
    } catch (e) {
      const err = e as { data?: { message?: string; data?: { message?: string } } }
      const message = err.data?.data?.message || err.data?.message || 'Verification failed'
      error.value = message
      toast.error(message)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(verify)
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col gap-6">
    <div v-if="isLoading" class="text-center">
      <h2 class="mb-2 text-xl font-semibold">Verifying your email...</h2>
      <p class="text-muted-foreground">Please wait while we verify your email address.</p>
    </div>

    <template v-else-if="error">
      <Alert variant="destructive">
        <AlertTitle>Verification failed</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <Button as-child variant="outline" class="w-full">
        <NuxtLink to="/auth/login"> Back to sign in </NuxtLink>
      </Button>
    </template>
  </div>
</template>
