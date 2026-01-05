<script setup lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { PasswordForm } from '@/components/settings'

  const { passwordFormRef, passwordLoading, handlePasswordChange } = useSettings()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Change Password</CardTitle>
      <CardDescription>Ensure your account is using a secure password.</CardDescription>
    </CardHeader>
    <CardContent>
      <PasswordForm
        ref="passwordFormRef"
        :is-loading="passwordLoading"
        @submit="handlePasswordChange"
      />
    </CardContent>
  </Card>
</template>
