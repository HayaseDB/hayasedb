const errorMessages: Record<string, string> = {
  account_not_linked:
    'This email is already registered with a different sign-in method. Sign in with your password first, then link the provider from your account settings.',
  account_already_linked_to_different_user:
    'That account is already linked to a different user.',
  "email_doesn't_match":
    "The provider's email address doesn't match your account.",
  unable_to_link_account: "We couldn't link that account. Please try again.",
}

export function useAuthError() {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  onMounted(() => {
    const error = route.query.error
    if (typeof error !== 'string') return

    toast.add({
      title: 'Something went wrong',
      description:
        errorMessages[error] ?? 'Please try again or contact support.',
      color: 'error',
    })
    void router.replace({ query: { ...route.query, error: undefined } })
  })
}
