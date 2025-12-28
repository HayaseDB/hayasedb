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

  const { signIn } = useAuth()
  const isLoading = ref(false)

  async function handleLogin(credentials: { email: string; password: string }) {
    isLoading.value = true
    try {
      await signIn(credentials)
      toast.success('Welcome back!')
      await navigateTo('/')
    } catch (e) {
      const err = e as { data?: { message?: string; data?: { message?: string } } }
      toast.error(err.data?.data?.message || err.data?.message || 'Unable to sign in')
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <LoginForm :is-loading="isLoading" @submit="handleLogin" />
</template>
