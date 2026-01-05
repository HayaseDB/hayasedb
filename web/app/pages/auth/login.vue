<script setup lang="ts">
  import { toast } from 'vue-sonner'
  import { LoginForm } from '@/components/auth'
  import { getErrorMessage } from '@/types/api'

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

  const route = useRoute()
  const { signIn } = useAuth()
  const isLoading = ref(false)

  const redirectTo = computed(() => {
    const redirect = route.query.redirect
    return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/'
  })

  async function handleLogin(credentials: { email: string; password: string }) {
    isLoading.value = true
    try {
      await signIn(credentials, { redirect: false })
      toast.success('Welcome back!')
      await navigateTo(redirectTo.value)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to sign in'))
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <LoginForm :is-loading="isLoading" @submit="handleLogin" />
</template>
