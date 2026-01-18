<script setup lang="ts">
  import { toast } from 'vue-sonner'
  import { RegisterForm } from '@/components/auth'

  definePageMeta({
    layout: 'auth',
    middleware: 'guest',
  })

  useSeoMeta({
    title: 'Create Account',
    description: 'Create your HayaseDB account',
  })

  const route = useRoute()
  const { register } = useAuth()
  const isLoading = ref(false)

  interface RegisterData {
    email: string
    password: string
    username: string
    firstName: string
    lastName: string
  }

  async function handleRegister(data: RegisterData) {
    isLoading.value = true
    try {
      await register(data)
      toast.success('Account created!', {
        description: 'Check your email to verify your account.',
      })
      await navigateTo({
        path: '/auth/login',
        query: route.query.redirect ? { redirect: route.query.redirect } : undefined,
      })
    } catch {
      toast.error('Unable to create account')
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <RegisterForm :is-loading="isLoading" @submit="handleRegister" />
</template>
