import { refDebounced } from '@vueuse/core'
import { toast } from 'vue-sonner'
import type { ProfileForm, PasswordForm } from '@/components/settings'

export type SessionSortField = 'created_at' | 'updated_at' | null
export type SessionSortOrder = 'asc' | 'desc' | null

export function useSettings() {
  const { user, refreshSession } = useAuth()

  const sessionsPage = ref<number>(1)
  const sessionsLimit = ref<number>(5)
  const sessionsSort = ref<SessionSortField>(null)
  const sessionsOrder = ref<SessionSortOrder>(null)
  const sessionsSearch = ref('')
  const sessionsSearchDebounced = refDebounced(sessionsSearch, 300)

  watch(sessionsSearchDebounced, () => {
    sessionsPage.value = 1
  })

  const sessionsQuery = computed(() => {
    const query: Record<string, string | number> = {
      page: sessionsPage.value,
      limit: sessionsLimit.value,
    }
    if (sessionsSort.value) {
      query.sort = sessionsSort.value
    }
    if (sessionsOrder.value) {
      query.order = sessionsOrder.value
    }
    const trimmedSearch = sessionsSearchDebounced.value.trim()
    if (trimmedSearch) {
      query.search = trimmedSearch
    }
    return query
  })

  const {
    data: sessionsData,
    status: sessionsStatus,
    refresh: refreshSessions,
  } = useFetch<PaginatedSessionResponse>('/api/sessions', {
    query: sessionsQuery,
  })

  const sessions = computed(() => sessionsData.value?.items ?? [])
  const sessionsMeta = computed<PaginationMeta | null>(() => sessionsData.value?.meta ?? null)

  const profileLoading = ref(false)
  const passwordLoading = ref(false)
  const pictureLoading = ref(false)
  const deleteLoading = ref(false)
  const sessionsLoading = ref(false)

  const profileFormRef = ref<InstanceType<typeof ProfileForm> | null>(null)
  const passwordFormRef = ref<InstanceType<typeof PasswordForm> | null>(null)

  const userInitials = computed(() => user.value?.username?.[0]?.toUpperCase() ?? 'U')

  const profileCurrentValues = computed(() => ({
    email: user.value?.email ?? '',
    username: user.value?.username ?? '',
    firstName: user.value?.firstName ?? '',
    lastName: user.value?.lastName ?? '',
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
      await $fetch('/api/users/me', { method: 'PATCH', body: data })
      await refreshSession()
      profileFormRef.value?.reset()
      toast.success('Profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      profileLoading.value = false
    }
  }

  async function handlePasswordChange(data: { currentPassword: string; newPassword: string }) {
    passwordLoading.value = true
    try {
      await $fetch('/api/users/me/password', { method: 'PATCH', body: data })
      passwordFormRef.value?.reset()
      toast.success('Password changed successfully')
    } catch {
      toast.error('Failed to change password')
    } finally {
      passwordLoading.value = false
    }
  }

  async function handlePictureUpload(file: File) {
    pictureLoading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      await $fetch('/api/users/me/profile-picture', { method: 'POST', body: formData })
      await refreshSession()
      toast.success('Profile picture updated')
    } catch {
      toast.error('Failed to upload picture')
    } finally {
      pictureLoading.value = false
    }
  }

  async function handlePictureDelete() {
    pictureLoading.value = true
    try {
      await $fetch('/api/users/me/profile-picture', { method: 'DELETE' })
      await refreshSession()
      toast.success('Profile picture removed')
    } catch {
      toast.error('Failed to remove picture')
    } finally {
      pictureLoading.value = false
    }
  }

  async function handleAccountDelete(data: { password: string }) {
    deleteLoading.value = true
    try {
      await $fetch('/api/users/me', { method: 'DELETE', body: data })
      toast.success('Account deleted successfully')
      await navigateTo('/auth/logout')
    } catch {
      toast.error('Failed to delete account')
      deleteLoading.value = false
    }
  }

  async function handleTerminateSession(sessionId: string) {
    sessionsLoading.value = true
    try {
      await $fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
      await refreshSessions()
      toast.success('Session terminated successfully')
    } catch {
      toast.error('Failed to terminate session')
    } finally {
      sessionsLoading.value = false
    }
  }

  async function handleTerminateAllOtherSessions() {
    sessionsLoading.value = true
    try {
      await $fetch('/api/sessions/others', { method: 'DELETE' })
      sessionsPage.value = 1
      await refreshSessions()
      toast.success('All other sessions terminated')
    } catch {
      toast.error('Failed to terminate sessions')
    } finally {
      sessionsLoading.value = false
    }
  }

  function setSessionsPage(page: number) {
    sessionsPage.value = page
  }

  function setSessionsPageSize(size: number) {
    sessionsLimit.value = size
    sessionsPage.value = 1
  }

  function setSessionsSort(sort: SessionSortField, order: SessionSortOrder) {
    sessionsSort.value = sort
    sessionsOrder.value = order
  }

  return {
    session: user,
    sessions,
    sessionsMeta,
    sessionsPage,
    sessionsLimit,
    sessionsSort,
    sessionsOrder,
    sessionsSearch,
    profileLoading,
    passwordLoading,
    pictureLoading,
    deleteLoading,
    isSessionsLoading,
    profileFormRef,
    passwordFormRef,
    userInitials,
    profileCurrentValues,
    handleProfileUpdate,
    handlePasswordChange,
    handlePictureUpload,
    handlePictureDelete,
    handleAccountDelete,
    handleTerminateSession,
    handleTerminateAllOtherSessions,
    setSessionsPage,
    setSessionsPageSize,
    setSessionsSort,
  }
}
