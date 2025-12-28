<script setup lang="ts">
  import { toast } from 'vue-sonner'
  import { RegisterForm } from '@/components/auth'
  import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

  definePageMeta({
    layout: 'auth',
    auth: { unauthenticatedOnly: true, navigateAuthenticatedTo: '/' },
  })

  useSeoMeta({
    title: 'Create Account',
    description: 'Create your HayaseDB account',
  })

  const { signUp, status } = useAuth()
  const isLoading = computed(() => status.value === 'loading')
  const success = ref(false)

  interface RegisterData {
    email: string
    password: string
    username: string
    firstName: string
    lastName: string
  }

  async function handleRegister(data: RegisterData) {
    try {
      await signUp(data)
      toast.success('Account created!', {
        description: 'Check your email to verify your account',
      })
      success.value = true
    } catch (error: unknown) {
      const fetchError = error as { data?: { message?: string } }
      toast.error(fetchError?.data?.message || 'Registration failed')
    }
  }

  onMounted(() => {
    success.value = false
  })
</script>

<template>
  <div v-if="success" class="flex flex-col gap-4">
    <Alert>
      <AlertTitle>Check your email</AlertTitle>
      <AlertDescription>
        We've sent a verification link to your email address. Please click the link to verify your
        account.
      </AlertDescription>
    </Alert>
    <NuxtLink to="/auth/login" class="text-muted-foreground text-center text-sm hover:underline">
      Back to sign in
    </NuxtLink>
  </div>
  <RegisterForm v-else :is-loading="isLoading" @submit="handleRegister" />
</template>
