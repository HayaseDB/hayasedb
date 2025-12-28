<script setup lang="ts">
  import { toast } from 'vue-sonner'

  definePageMeta({
    auth: { authenticatedOnly: true, navigateUnauthenticatedTo: '/auth/login' },
  })

  useSeoMeta({ title: 'Sessions' })

  const { signOut, token, data, status, refresh, getSession } = useAuth()
  const { authFetch } = useAuthFetch()

  interface Session {
    id: string
    createdAt: string
    updatedAt: string
    isCurrent: boolean
  }

  const sessions = ref<Session[]>([])
  const profile = ref<Record<string, unknown> | null>(null)
  const loading = ref(false)

  async function fetchProfile() {
    if (!token.value) return
    try {
      profile.value = await authFetch<Record<string, unknown>>('/api/users/me/profile')
      toast.success('Profile fetched')
    } catch {
      toast.error('Failed to fetch profile')
    }
  }

  async function fetchSessions() {
    if (!token.value) return
    loading.value = true
    try {
      sessions.value = await authFetch<Session[]>('/api/sessions')
    } catch {
      toast.error('Failed to fetch sessions')
    }
    loading.value = false
  }

  async function revokeSession(id: string) {
    if (!token.value) return
    try {
      await authFetch(`/api/sessions/${id}`, { method: 'DELETE' })
      toast.success('Session revoked')
      await fetchSessions()
    } catch {
      toast.error('Failed to revoke session')
    }
  }

  async function testRefresh() {
    try {
      await refresh()
      toast.success('Token refreshed')
    } catch {
      toast.error('Refresh failed')
    }
  }

  async function testGetSession() {
    try {
      await getSession()
      toast.success('Session fetched')
    } catch {
      toast.error('Get session failed')
    }
  }

  async function handleLogout() {
    await signOut().catch(() => {})
    if (!token.value) {
      navigateTo('/auth/login')
    }
  }

  watch(
    token,
    (newToken) => {
      if (newToken) fetchSessions()
    },
    { immediate: true },
  )
</script>

<template>
  <div class="container mx-auto max-w-2xl space-y-6 p-8">
    <h1 class="text-2xl font-bold">Sessions Test Page</h1>

    <div class="space-y-2 rounded border p-4">
      <h2 class="font-semibold">Auth Status</h2>
      <p>
        Status: <code>{{ status }}</code>
      </p>
      <p>
        Token: <code>{{ token?.slice(0, 20) }}...</code>
      </p>
    </div>

    <div class="space-y-2 rounded border p-4">
      <h2 class="font-semibold">User Info</h2>
      <pre class="text-sm">{{ JSON.stringify(data, null, 2) }}</pre>
    </div>

    <div v-if="profile" class="space-y-2 rounded border p-4">
      <h2 class="font-semibold">Profile (from /api/users/me/profile)</h2>
      <pre class="text-sm">{{ JSON.stringify(profile, null, 2) }}</pre>
    </div>

    <div class="flex flex-wrap gap-2">
      <button class="rounded bg-blue-600 px-4 py-2 text-white" @click="testRefresh">
        Test Refresh
      </button>
      <button class="rounded bg-purple-600 px-4 py-2 text-white" @click="testGetSession">
        Test Get Session
      </button>
      <button class="rounded bg-green-600 px-4 py-2 text-white" @click="fetchProfile">
        Get Profile
      </button>
      <button class="rounded bg-gray-600 px-4 py-2 text-white" @click="fetchSessions">
        Reload Sessions
      </button>
      <button class="rounded bg-red-600 px-4 py-2 text-white" @click="handleLogout">Logout</button>
    </div>

    <div class="space-y-2 rounded border p-4">
      <h2 class="font-semibold">Sessions</h2>
      <p v-if="loading">Loading...</p>
      <div
        v-for="session in sessions"
        :key="session.id"
        class="flex justify-between rounded border p-2"
      >
        <div>
          <p class="text-sm">{{ session.id }}</p>
          <p class="text-xs text-gray-500">{{ session.createdAt }}</p>
          <span v-if="session.isCurrent" class="text-xs text-green-600">Current</span>
        </div>
        <button
          v-if="!session.isCurrent"
          class="text-sm text-red-600"
          @click="revokeSession(session.id)"
        >
          Revoke
        </button>
      </div>
    </div>
  </div>
</template>
