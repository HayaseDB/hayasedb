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

  const { signIn, status } = useAuth()
  const isLoading = computed(() => status.value === 'loading')

  async function handleLogin(credentials: { email: string; password: string }) {
    try {
      await signIn(credentials)
      toast.success('Welcome back!')
      await navigateTo('/')
    } catch (error: unknown) {
      const fetchError = error as { data?: { message?: string } }
      toast.error(fetchError?.data?.message || 'Login failed')
    }
  }
</script>

<template>
  <LoginForm :is-loading="isLoading" @submit="handleLogin" />
</template>
