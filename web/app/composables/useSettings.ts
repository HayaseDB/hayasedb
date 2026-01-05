import { toast } from 'vue-sonner'
import { getErrorMessage } from '@/types/api'
import type { Session } from '@/types/session'
import type { ProfileForm, PasswordForm } from '@/components/settings'

export function useSettings() {
  const { data: session, refresh: refreshSession } = useAuth()
  const { authFetch } = useAuthFetch()
  const { rawToken } = useAuthState()

  const {
    data: sessions,
    status: sessionsStatus,
    refresh: refreshSessions,
  } = useFetch<Session[]>('/api/sessions', {
    headers: computed(() => ({
      Authorization: rawToken.value ? `Bearer ${rawToken.value}` : '',
    })),
  })

  const profileLoading = ref(false)
  const passwordLoading = ref(false)
  const pictureLoading = ref(false)
  const deleteLoading = ref(false)
  const sessionsLoading = ref(false)

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

  const isSessionsLoading = computed(
    () => sessionsStatus.value === 'pending' || sessionsLoading.value,
  )

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

  async function handleTerminateSession(sessionId: string) {
    sessionsLoading.value = true
    try {
      await authFetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
      await refreshSessions()
      toast.success('Session terminated successfully')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to terminate session'))
    } finally {
      sessionsLoading.value = false
    }
  }

  async function handleTerminateAllOtherSessions() {
    sessionsLoading.value = true
    try {
      await authFetch('/api/sessions/others', { method: 'DELETE' })
      await refreshSessions()
      toast.success('All other sessions terminated')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to terminate sessions'))
    } finally {
      sessionsLoading.value = false
    }
  }

  return {
    // Session data
    session,
    sessions,

    // Loading states
    profileLoading,
    passwordLoading,
    pictureLoading,
    deleteLoading,
    isSessionsLoading,

    // Form refs
    profileFormRef,
    passwordFormRef,

    // Computed values
    userInitials,
    profileCurrentValues,

    // Handlers
    handleProfileUpdate,
    handlePasswordChange,
    handlePictureUpload,
    handlePictureDelete,
    handleAccountDelete,
    handleTerminateSession,
    handleTerminateAllOtherSessions,
  }
}
