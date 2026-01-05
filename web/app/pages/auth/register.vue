<script setup lang="ts">
  import { toast } from 'vue-sonner'
  import { RegisterForm } from '@/components/auth'
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
    title: 'Create Account',
    description: 'Create your HayaseDB account',
  })

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
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: data,
      })
      toast.success('Account created!', {
        description: 'Check your email to verify your account.',
      })
      await navigateTo('/auth/login')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to create account'))
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <RegisterForm :is-loading="isLoading" @submit="handleRegister" />
</template>
