import type {
  SignInEmailInput,
  SignUpEmailInput,
  SocialProvider,
} from '@hayasedb/contract'

export function useAuthActions() {
  const api = useApiClient()
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const { loading, run } = useApiAction()

  const redirectTarget = () => safeRedirectPath(route.query.redirect)

  async function signInEmail(
    input: SignInEmailInput,
    { requireAdmin = false }: { requireAdmin?: boolean } = {},
  ): Promise<boolean> {
    loading.value = true
    try {
      const result = await callApi(() => api.auth.signInEmail(input), {
        title: 'Sign in failed',
      })
      if (!result) return false

      await refreshAppSession()

      if (requireAdmin) {
        const { data: session } = useAppSession()
        if (session.value?.user.role !== 'admin' || session.value.user.banned) {
          await useAccountActions().signOut()
          toast.add({
            title: 'Access denied',
            description: 'This account is not an administrator.',
            color: 'error',
          })
          return false
        }
      }

      await router.push(redirectTarget())
      return true
    } finally {
      loading.value = false
    }
  }

  async function signUpEmail(input: SignUpEmailInput): Promise<boolean> {
    const result = await run(() => api.auth.signUpEmail(input), {
      title: 'Sign up failed',
      success: {
        title: 'Check your inbox',
        description: `We sent a verification link to ${input.email}.`,
      },
    })
    if (!result) return false

    await refreshAppSession()
    await router.push(redirectTarget())
    return true
  }

  async function signInSocial(provider: SocialProvider): Promise<void> {
    loading.value = true
    const origin = window.location.origin
    const result = await callApi(
      () =>
        api.auth.signInSocial({
          provider,
          callbackURL: `${origin}${redirectTarget()}`,
          errorCallbackURL: `${origin}/login`,
        }),
      { title: 'Sign in failed' },
    )
    if (result?.url) {
      window.location.href = result.url
      return
    }
    loading.value = false
    if (result) {
      toast.add({
        title: 'Sign in failed',
        description: 'The provider did not return a sign-in link.',
        color: 'error',
      })
    }
  }

  async function verifyEmail(token: string): Promise<boolean> {
    const result = await run(() => api.auth.verifyEmail({ token }), {
      title: 'Verification failed',
      fallback: 'This link is invalid or has expired.',
      success: {
        title: 'Email verified',
        description: 'Your email address has been confirmed.',
      },
    })
    if (!result) return false

    await refreshAppSession()
    return true
  }

  async function requestPasswordReset(email: string): Promise<boolean> {
    return Boolean(
      await run(
        () =>
          api.auth.requestPasswordReset({
            email,
            redirectTo: '/auth/reset-password',
          }),
        {
          title: 'Request failed',
          success: {
            title: 'Check your inbox',
            description:
              'If that email is registered, a reset link is on its way.',
          },
        },
      ),
    )
  }

  async function resetPassword(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    const result = await run(
      () => api.auth.resetPassword({ token, newPassword }),
      {
        title: 'Reset failed',
        fallback: 'This link is invalid or has expired.',
        success: {
          title: 'Password updated',
          description: 'You can now sign in with your new password.',
        },
      },
    )
    if (!result) return false

    await router.push('/login')
    return true
  }

  return {
    loading,
    signInEmail,
    signUpEmail,
    signInSocial,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
  }
}
