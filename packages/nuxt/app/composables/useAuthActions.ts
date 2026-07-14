import type {
  SignInEmailInput,
  SignUpEmailInput,
  SocialProvider,
} from '@hayasedb/contract'

export function useAuthActions() {
  const auth = useAuth()
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const loading = ref(false)

  const redirectTarget = () => (route.query.redirect as string) || '/'

  async function signInEmail(
    input: SignInEmailInput,
    { requireAdmin = false }: { requireAdmin?: boolean } = {},
  ): Promise<boolean> {
    loading.value = true
    try {
      const { data, error } = await auth.signIn.email(input)

      if (error || !data) {
        toast.add({
          title: 'Sign in failed',
          description: error?.message ?? 'Please try again.',
          color: 'error',
        })
        return false
      }

      if (requireAdmin) {
        const { data: session } = await auth.getSession()
        if (session?.user.role !== 'admin' || session.user.banned) {
          await auth.signOut()
          toast.add({
            title: 'Access denied',
            description: 'This account is not an administrator.',
            color: 'error',
          })
          return false
        }
      }

      await refreshNuxtData('app-session')
      await router.push(redirectTarget())
      return true
    } finally {
      loading.value = false
    }
  }

  async function signUpEmail(input: SignUpEmailInput): Promise<boolean> {
    loading.value = true
    try {
      const { data, error } = await auth.signUp.email(input)

      if (error || !data) {
        toast.add({
          title: 'Sign up failed',
          description: error?.message ?? 'Please try again.',
          color: 'error',
        })
        return false
      }

      toast.add({
        title: 'Check your inbox',
        description: `We sent a verification link to ${input.email}.`,
        color: 'info',
      })
      await refreshNuxtData('app-session')
      await router.push(redirectTarget())
      return true
    } finally {
      loading.value = false
    }
  }

  async function signInSocial(provider: SocialProvider): Promise<void> {
    loading.value = true
    try {
      const origin = window.location.origin
      await auth.signIn.social({
        provider,
        callbackURL: `${origin}${redirectTarget()}`,
        errorCallbackURL: `${origin}/login`,
      })
    } catch (error) {
      loading.value = false
      throw error
    }
  }

  async function verifyEmail(token: string): Promise<boolean> {
    loading.value = true
    try {
      const { error } = await auth.verifyEmail({ query: { token } })

      if (error) {
        toast.add({
          title: 'Verification failed',
          description: error.message ?? 'This link is invalid or has expired.',
          color: 'error',
        })
        return false
      }

      toast.add({
        title: 'Email verified',
        description: 'Your email address has been confirmed.',
        color: 'success',
      })
      return true
    } finally {
      loading.value = false
    }
  }

  async function requestPasswordReset(email: string): Promise<boolean> {
    loading.value = true
    try {
      const { error } = await auth.requestPasswordReset({
        email,
        redirectTo: '/auth/reset-password',
      })

      if (error) {
        toast.add({
          title: 'Request failed',
          description: error.message ?? 'Please try again.',
          color: 'error',
        })
        return false
      }

      toast.add({
        title: 'Check your inbox',
        description: 'If that email is registered, a reset link is on its way.',
        color: 'success',
      })
      return true
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    loading.value = true
    try {
      const { error } = await auth.resetPassword({ token, newPassword })

      if (error) {
        toast.add({
          title: 'Reset failed',
          description: error.message ?? 'This link is invalid or has expired.',
          color: 'error',
        })
        return false
      }

      toast.add({
        title: 'Password updated',
        description: 'You can now sign in with your new password.',
        color: 'success',
      })
      await router.push('/login')
      return true
    } finally {
      loading.value = false
    }
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
