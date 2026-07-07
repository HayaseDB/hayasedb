const errorMessages: Record<string, string> = {
  account_not_linked:
    'This email is already registered with a different sign-in method. Sign in with your password first, then link the provider from your account settings.',
}

export function useAuthError() {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  onMounted(() => {
    const error = route.query.error
    if (typeof error !== 'string') return

    toast.add({
      title: 'Sign in failed',
      description:
        errorMessages[error] ?? 'Something went wrong. Please try again.',
      color: 'error',
    })
    void router.replace({ query: { ...route.query, error: undefined } })
  })
}
