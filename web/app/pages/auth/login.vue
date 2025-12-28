<script setup lang="ts">
  import { toast } from 'vue-sonner'
  import { LoginForm } from '@/components/auth'

  definePageMeta({
    layout: 'auth',
    auth: { unauthenticatedOnly: true, navigateAuthenticatedTo: '/' },
  })

  useSeoMeta({
    title: 'Sign In',
    description: 'Sign in to your HayaseDB account',
  })

  const { signIn, token } = useAuth()
  const isLoading = ref(false)

  async function handleLogin(credentials: { email: string; password: string }) {
    isLoading.value = true
    try {
      await signIn(credentials)
      isLoading.value = false

      if (token.value) {
        toast.success('Welcome back!')
        return navigateTo('/')
      }
      toast.error('Unable to sign in')
    } catch (error: unknown) {
      isLoading.value = false
      const message =
        (error as { data?: { data?: { message?: string } } })?.data?.data?.message ||
        'Unable to sign in'
      toast.error(message)
    }
  }
</script>

<template>
  <LoginForm :is-loading="isLoading" @submit="handleLogin" />
</template>
