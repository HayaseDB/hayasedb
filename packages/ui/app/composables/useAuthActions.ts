export type SocialProvider = 'github'

export interface SignInEmailInput {
  email: string
  password: string
}

export interface SignUpEmailInput {
  name: string
  email: string
  password: string
}

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
          description: error?.message ?? 'Unknown error',
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

      await router.push(redirectTarget())
      return true
    } finally {
      loading.value = false
    }
  }

  async function signUpEmail(input: SignUpEmailInput): Promise<boolean> {
    loading.value = true
    try {
      const { error } = await auth.signUp.email(input)

      if (error) {
        toast.add({
          title: 'Sign up failed',
          description: error.message,
          color: 'error',
        })
        return false
      }

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

  return { loading, signInEmail, signUpEmail, signInSocial }
}
