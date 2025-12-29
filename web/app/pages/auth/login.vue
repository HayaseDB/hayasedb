<script setup lang="ts">
  import { toast } from 'vue-sonner'
  import { LoginForm } from '@/components/auth'

  definePageMeta({
    layout: 'auth',
    middleware: 'sidebase-auth',
    auth: {
      unauthenticatedOnly: true,
      navigateAuthenticatedTo: '/',
    },
  })

  useSeoMeta({
    title: 'Sign In',
    description: 'Sign in to your HayaseDB account',
  })

  const { signIn } = useAuth()
  const isLoading = ref(false)

  async function handleLogin(credentials: { email: string; password: string }) {
    isLoading.value = true
    try {
      await signIn(credentials, { redirect: false })
      toast.success('Welcome back!')
      await navigateTo('/')
    } catch (error: unknown) {
      const message =
        (error as { data?: { data?: { message?: string } } })?.data?.data?.message ||
        'Unable to sign in'
      toast.error(message)
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <LoginForm :is-loading="isLoading" @submit="handleLogin" />
</template>
