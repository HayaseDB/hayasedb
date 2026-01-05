<script setup lang="ts">
  import { FieldDescription } from '@/components/ui/field'

  interface Props {
    mode: 'login' | 'register'
  }

  defineProps<Props>()

  const route = useRoute()

  const registerLink = computed(() => ({
    path: '/auth/register',
    query: route.query.redirect ? { redirect: route.query.redirect } : undefined,
  }))

  const loginLink = computed(() => ({
    path: '/auth/login',
    query: route.query.redirect ? { redirect: route.query.redirect } : undefined,
  }))
</script>

<template>
  <FieldDescription class="px-6 text-center">
    <template v-if="mode === 'login'">
      Don't have an account?
      <NuxtLink :to="registerLink" class="hover:text-primary underline underline-offset-4">
        Sign up
      </NuxtLink>
    </template>
    <template v-else>
      Already have an account?
      <NuxtLink :to="loginLink" class="hover:text-primary underline underline-offset-4">
        Sign in
      </NuxtLink>
    </template>
  </FieldDescription>
</template>
