<script setup lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { ProfilePictureForm } from '@/components/settings'

  const { session, userInitials, pictureLoading, handlePictureUpload, handlePictureDelete } =
    useSettings()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Profile Picture</CardTitle>
      <CardDescription> Upload a new profile picture or remove your current one. </CardDescription>
    </CardHeader>
    <CardContent>
      <ProfilePictureForm
        :current-picture="session?.profilePicture"
        :user-initials="userInitials"
        :is-loading="pictureLoading"
        @upload="handlePictureUpload"
        @delete="handlePictureDelete"
      />
    </CardContent>
  </Card>
</template>
