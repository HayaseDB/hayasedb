export function useAuth() {
  const { loggedIn, user, clear, fetch: fetchSession } = useUserSession()

  const typedUser = computed(() => user.value as UserResponse | null)

  async function login(credentials: { email: string; password: string }): Promise<UserResponse> {
    const response = await $fetch<{ user: UserResponse }>('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })
    await fetchSession()
    return response.user
  }

  async function register(data: {
    email: string
    password: string
    username: string
    firstName: string
    lastName: string
  }): Promise<MessageResponse> {
    return await $fetch<MessageResponse>('/api/auth/register', {
      method: 'POST',
      body: data,
    })
  }

  async function logout(): Promise<void> {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
  }

  async function logoutAll(): Promise<void> {
    await $fetch('/api/auth/logout-all', { method: 'POST' })
    await clear()
  }

  return {
    user: typedUser,
    isAuthenticated: loggedIn,
    login,
    register,
    logout,
    logoutAll,
    refreshSession: fetchSession,
  }
}
