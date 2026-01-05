<script setup lang="ts">
  import { toast } from 'vue-sonner'
  import { User, Lock, ImageIcon, AlertTriangle } from 'lucide-vue-next'
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { ProfileForm, PasswordForm, ProfilePictureForm, DangerZone } from '@/components/settings'
  import { getErrorMessage } from '@/types/api'

  definePageMeta({
    layout: 'dashboard',
    middleware: 'sidebase-auth',
    breadcrumb: {
      label: 'Settings',
    },
  })

  useSeoMeta({
    title: 'Account Settings',
    description: 'Manage your HayaseDB account settings',
  })

  const { data: session, refresh: refreshSession } = useAuth()
  const { authFetch } = useAuthFetch()

  const profileLoading = ref(false)
  const passwordLoading = ref(false)
  const pictureLoading = ref(false)
  const deleteLoading = ref(false)

  const profileFormRef = ref<InstanceType<typeof ProfileForm> | null>(null)
  const passwordFormRef = ref<InstanceType<typeof PasswordForm> | null>(null)

  const userInitials = computed(() => {
    return session.value?.username?.[0]?.toUpperCase() ?? 'U'
  })

  const profileCurrentValues = computed(() => ({
    email: session.value?.email ?? '',
    username: session.value?.username ?? '',
    firstName: session.value?.firstName ?? '',
    lastName: session.value?.lastName ?? '',
  }))

  async function handleProfileUpdate(data: {
    email?: string
    username?: string
    firstName?: string
    lastName?: string
  }) {
    profileLoading.value = true
    try {
      await authFetch('/api/users/me/profile', {
        method: 'PATCH',
        body: data,
      })
      await refreshSession()
      profileFormRef.value?.reset()
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update profile'))
    } finally {
      profileLoading.value = false
    }
  }

  async function handlePasswordChange(data: { currentPassword: string; newPassword: string }) {
    passwordLoading.value = true
    try {
      await authFetch('/api/users/me/password', {
        method: 'PUT',
        body: data,
      })
      passwordFormRef.value?.reset()
      toast.success('Password changed successfully')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to change password'))
    } finally {
      passwordLoading.value = false
    }
  }

  async function handlePictureUpload(file: File) {
    pictureLoading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)

      await authFetch('/api/users/me/profile-picture', {
        method: 'POST',
        body: formData,
      })
      await refreshSession()
      toast.success('Profile picture updated')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to upload picture'))
    } finally {
      pictureLoading.value = false
    }
  }

  async function handlePictureDelete() {
    pictureLoading.value = true
    try {
      await authFetch('/api/users/me/profile-picture', {
        method: 'DELETE',
      })
      await refreshSession()
      toast.success('Profile picture removed')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to remove picture'))
    } finally {
      pictureLoading.value = false
    }
  }

  async function handleAccountDelete(data: { password: string }) {
    deleteLoading.value = true
    try {
      await authFetch('/api/users/me', {
        method: 'DELETE',
        body: data,
      })
      toast.success('Account deleted successfully')
      await navigateTo('/auth/logout')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete account'))
      deleteLoading.value = false
    }
  }
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
      <p class="text-muted-foreground">Manage your account settings and preferences.</p>
    </div>

    <Tabs default-value="profile" class="w-full">
      <TabsList class="grid w-full grid-cols-4 lg:w-fit">
        <TabsTrigger value="profile" class="gap-2">
          <User class="h-4 w-4" />
          <span class="hidden sm:inline">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="security" class="gap-2">
          <Lock class="h-4 w-4" />
          <span class="hidden sm:inline">Security</span>
        </TabsTrigger>
        <TabsTrigger value="picture" class="gap-2">
          <ImageIcon class="h-4 w-4" />
          <span class="hidden sm:inline">Picture</span>
        </TabsTrigger>
        <TabsTrigger value="danger" class="gap-2">
          <AlertTriangle class="h-4 w-4" />
          <span class="hidden sm:inline">Danger</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" class="mt-6">
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
      </TabsContent>

      <TabsContent value="security" class="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription> Ensure your account is using a secure password. </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm
              ref="passwordFormRef"
              :is-loading="passwordLoading"
              @submit="handlePasswordChange"
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="picture" class="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Upload a new profile picture or remove your current one.
            </CardDescription>
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
      </TabsContent>

      <TabsContent value="danger" class="mt-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-destructive">Danger Zone</CardTitle>
            <CardDescription> Irreversible and destructive actions. </CardDescription>
          </CardHeader>
          <CardContent>
            <DangerZone :is-loading="deleteLoading" @submit="handleAccountDelete" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
