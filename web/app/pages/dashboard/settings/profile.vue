<script setup lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { ProfileForm } from '@/components/settings'

  const { profileFormRef, profileCurrentValues, profileLoading, handleProfileUpdate } =
    useSettings()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Profile Information</CardTitle>
      <CardDescription>
        Update your account profile information and email address.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ProfileForm
        ref="profileFormRef"
        :current-values="profileCurrentValues"
        :is-loading="profileLoading"
        @submit="handleProfileUpdate"
      />
    </CardContent>
  </Card>
</template>
