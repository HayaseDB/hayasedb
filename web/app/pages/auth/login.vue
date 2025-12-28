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
    await signIn(credentials).catch(() => {})
    isLoading.value = false

    if (token.value) {
      toast.success('Welcome back!')
      return navigateTo('/')
    }
    toast.error('Unable to sign in')
  }
</script>

<template>
  <LoginForm :is-loading="isLoading" @submit="handleLogin" />
</template>
