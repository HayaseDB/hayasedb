export async function useLayoutSession() {
  const config = useRuntimeConfig()
  const { signOut } = useAccountActions()
  const { data: session } = await useAppSession()

  const user = computed(() => session.value?.user ?? null)

  const adminUrl = computed(() => {
    if (user.value?.role !== 'admin' || user.value.banned) return null
    return config.public.adminUrl
  })

  return { user, adminUrl, signOut }
}
