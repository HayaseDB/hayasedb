<script setup lang="ts">
  import { toast } from 'vue-sonner'
  import { LoginForm } from '@/components/auth'

  definePageMeta({
    layout: 'auth',
    middleware: 'guest',
  })

  useSeoMeta({
    title: 'Sign In',
    description: 'Sign in to your HayaseDB account',
  })

  const route = useRoute()
  const { login } = useAuth()
  const isLoading = ref(false)

  const redirectTo = computed(() => {
    const redirect = route.query.redirect
    return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/dashboard'
  })

  async function handleLogin(credentials: { email: string; password: string }) {
    isLoading.value = true
    try {
      await login(credentials)
      toast.success('Welcome back!')
      await navigateTo(redirectTo.value)
    } catch {
      toast.error('Unable to sign in')
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <LoginForm :is-loading="isLoading" @submit="handleLogin" />
</template>
